import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { isFunctional } from "./ratchet/no-comments.mjs";

const USAGE =
  "usage: bun inventory.ts <work-dir> [--exclude <regex>] [--keep <regex>] [--part-size <n>] [path ...]";
const REPO = execSync("git rev-parse --show-toplevel").toString().trim();
process.chdir(REPO);

const argv = process.argv.slice(2);
const option = (name: string) => {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const [, value] = argv.splice(index, 2);
  return value;
};
const EXCLUDE = new RegExp(
  option("--exclude") ?? String.raw`(^|/)(dist|build|out|coverage|vendor|generated|\.nuxt|\.output|\.next|\.svelte-kit)/|\.min\.(js|css)$`,
);
const keepPattern = option("--keep");
const KEEP = keepPattern ? new RegExp(keepPattern) : undefined;
const PART_SIZE = Number(option("--part-size") ?? 450);
const [WORK, ...SCOPE] = argv;
if (!WORK) {
  console.error(USAGE);
  process.exit(1);
}
mkdirSync(`${WORK}/parts`, { recursive: true });
mkdirSync(`${WORK}/results`, { recursive: true });

let ts: typeof import("typescript");
try {
  ts = createRequire(join(REPO, "package.json"))("typescript");
} catch {
  console.error("typescript is not resolvable from the repo root: install it, or run from a workspace that has it.");
  process.exit(1);
}

const SCRIPT = /\.([cm]?[jt]sx?)$/;
const STYLE = /\.(css|scss|sass|less|pcss|postcss)$/;
const MARKUP = /\.(vue|html|svelte|astro)$/;
const UNPARSED = /\.(py|rb|go|rs|java|kt|kts|swift|php|sh|bash|zsh|sql|c|h|cc|cpp|hpp|cs|scala|dart|lua|ex|exs|tf)$/;

interface Span { start: number; end: number }
interface Comment extends Span { text: string; line: number; endLine: number; ownLine: boolean }

function scriptComments(text: string, file: string, offset = 0): Span[] {
  const kind = /x$/.test(file) || /\.jsx?$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const jsxTextStarts = new Set<number>();
  const nodes: import("typescript").Node[] = [];
  const visit = (node: import("typescript").Node) => {
    nodes.push(node);
    if (node.kind === ts.SyntaxKind.JsxText) jsxTextStarts.add(node.pos);
    node.getChildren(source).forEach(visit);
  };
  visit(source);
  const found = new Map<number, Span>();
  for (const node of nodes) {
    const ranges = [
      ...(jsxTextStarts.has(node.pos) ? [] : (ts.getLeadingCommentRanges(text, node.pos) ?? [])),
      ...(jsxTextStarts.has(node.end) ? [] : (ts.getTrailingCommentRanges(text, node.end) ?? [])),
    ];
    for (const range of ranges) found.set(range.pos, { start: range.pos + offset, end: range.end + offset });
  }
  return [...found.values()];
}

function regexComments(text: string, pattern: RegExp, offset = 0): Span[] {
  return [...text.matchAll(pattern)].map((m) => ({ start: m.index! + offset, end: m.index! + offset + m[0].length }));
}

const CSS_BLOCK = /\/\*[\s\S]*?\*\//g;
const CSS_LINE = /(?<=^[ \t]*)\/\/.*$/gm;
const HTML = /<!--[\s\S]*?-->/g;
const EMBEDDED = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/g;

function markupComments(text: string, file: string): Span[] {
  const spans: Span[] = [];
  let outside = text;
  for (const match of text.matchAll(EMBEDDED)) {
    const [whole, tag, attributes, body] = match;
    const bodyStart = match.index! + whole.indexOf(">") + 1;
    const lang = /lang=["']?(\w+)/.exec(attributes)?.[1] ?? (tag === "script" ? "ts" : "css");
    if (tag === "script") spans.push(...scriptComments(body, `${file}.${lang}`, bodyStart));
    else {
      spans.push(...regexComments(body, CSS_BLOCK, bodyStart));
      if (/scss|sass|less/.test(lang)) spans.push(...regexComments(body, CSS_LINE, bodyStart));
    }
    outside = outside.slice(0, match.index!) + " ".repeat(whole.length) + outside.slice(match.index! + whole.length);
  }
  return [...spans, ...regexComments(outside, HTML)];
}

function commentSpans(file: string, text: string): Span[] {
  if (SCRIPT.test(file)) return scriptComments(text, file);
  if (MARKUP.test(file)) return markupComments(text, file);
  const spans = regexComments(text, CSS_BLOCK);
  return /\.(scss|sass|less)$/.test(file) ? [...spans, ...regexComments(text, CSS_LINE)] : spans;
}

function commentValue(text: string): string {
  if (text.startsWith("<!--")) return text.slice(4, -3);
  if (text.startsWith("/*")) return text.slice(2, -2);
  return text.slice(2);
}

const tracked = execSync(`git ls-files -z -- ${SCOPE.map((p) => `'${p}'`).join(" ")}`)
  .toString()
  .split("\0")
  .filter((file) => file && !EXCLUDE.test(file));
const unparsed = new Map<string, number>();
const sources = new Map<string, string>();
const comments: (Comment & { file: string })[] = [];

for (const file of tracked) {
  if (!SCRIPT.test(file) && !STYLE.test(file) && !MARKUP.test(file)) {
    const ext = UNPARSED.exec(file)?.[1];
    if (ext) unparsed.set(ext, (unparsed.get(ext) ?? 0) + 1);
    continue;
  }
  const text = readFileSync(file, "utf8");
  sources.set(file, text);
  for (const { start, end } of commentSpans(file, text).sort((a, b) => a.start - b.start)) {
    const comment = text.slice(start, end);
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end);
    const ownLine =
      text.slice(lineStart, start).trim() === "" && text.slice(end, lineEnd === -1 ? undefined : lineEnd).trim() === "";
    const line = text.slice(0, start).split("\n").length;
    comments.push({ file, start, end, text: comment, line, endLine: line + comment.split("\n").length - 1, ownLine });
  }
}

interface Block {
  id: string; file: string; line: number; endLine: number; ownLine: boolean; text: string; functional: boolean;
  parts: { start: number; end: number; ownLine: boolean }[];
}
const blocks: Block[] = [];
for (const comment of comments) {
  const previous = blocks.at(-1);
  const continues =
    previous && previous.file === comment.file && previous.ownLine && comment.ownLine &&
    comment.line === previous.endLine + 1 && comment.text.startsWith("//") && previous.text.startsWith("//");
  const part = { start: comment.start, end: comment.end, ownLine: comment.ownLine };
  if (continues) {
    previous.parts.push(part);
    previous.endLine = comment.endLine;
    previous.text += `\n${comment.text}`;
  } else {
    blocks.push({ ...comment, id: "", functional: false, parts: [part] });
  }
}
blocks.forEach((block, index) => {
  block.id = `c${String(index + 1).padStart(5, "0")}`;
  block.functional = block.text.split("\n").some((text) => isFunctional(commentValue(text.trim()), block.file, KEEP));
});
writeFileSync(`${WORK}/inventory.json`, JSON.stringify(blocks, null, 1));

const area = (file: string) => file.split("/").slice(0, -1).slice(0, 2).join("/") || ".";
const deletable = blocks.filter((b) => !b.functional);
const byArea = new Map<string, Block[]>();
for (const block of deletable) byArea.set(area(block.file), [...(byArea.get(area(block.file)) ?? []), block]);

const partitions: Block[][] = [[]];
for (const [, areaBlocks] of [...byArea].sort((a, b) => b[1].length - a[1].length)) {
  for (const block of areaBlocks) {
    const current = partitions.at(-1)!;
    if (current.length >= PART_SIZE && current.at(-1)?.file !== block.file) partitions.push([]);
    partitions.at(-1)!.push(block);
  }
}
partitions.filter((p) => p.length > 0).forEach((partition, index) => {
  const entries = partition.map((block) => ({
    id: block.id,
    at: `${block.file}:${block.line}${block.endLine > block.line ? `-${block.endLine}` : ""}`,
    trailing: block.ownLine ? undefined : true,
    comment: block.text,
    codeAfter: sources.get(block.file)!.split("\n").slice(block.endLine, block.endLine + 4).join("\n"),
  }));
  writeFileSync(`${WORK}/parts/p${index + 1}.json`, JSON.stringify(entries, null, 1));
  console.log(`p${index + 1}: ${partition.length} blocks (${[...new Set(partition.map((b) => area(b.file)))].join(", ")})`);
});

const shedLines = (list: Block[]) => list.filter((b) => b.ownLine).reduce((sum, b) => sum + b.endLine - b.line + 1, 0);
console.log("\nLines shed by deleting every non-functional comment, by area:");
for (const [name, areaBlocks] of [...byArea].sort((a, b) => shedLines(b[1]) - shedLines(a[1])).slice(0, 15)) {
  console.log(`  ${name}: ${shedLines(areaBlocks)} lines (${areaBlocks.length} blocks)`);
}
const total = [...sources.values()].reduce((sum, text) => sum + text.split("\n").length, 0);
console.log(
  `\n${comments.length} comments in ${blocks.length} blocks across ${sources.size} files; ` +
    `${blocks.length - deletable.length} functional blocks kept; ` +
    `${deletable.filter((b) => !b.ownLine).length} trailing comments (no line shed).`,
);
console.log(`ESTIMATE: ${shedLines(deletable)} comment-only lines to shed, of ${total} lines in the parsed files.`);
if (unparsed.size > 0) {
  console.log(
    `NOT PARSED: ${[...unparsed].map(([ext, n]) => `.${ext} (${n} files)`).join(", ")}; their comments are not in this inventory.`,
  );
}

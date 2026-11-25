import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const REPO = execSync("git rev-parse --show-toplevel").toString().trim();
const WORK = process.argv[2];
if (!WORK) {
  console.error("usage: bun apply.ts <work-dir>");
  process.exit(1);
}
process.chdir(REPO);

const DELETED = new Set(["tautology", "stale", "excuse", "decision"]);

interface Part { start: number; end: number; ownLine: boolean }
interface Block { id: string; file: string; functional: boolean; parts: Part[] }
interface Verdict { id: string; category: string; defer?: boolean }

const blocks: Block[] = JSON.parse(readFileSync(`${WORK}/inventory.json`, "utf8"));
const verdicts = new Map<string, Verdict>();
for (const file of readdirSync(`${WORK}/results`).filter((f) => f.endsWith(".json"))) {
  for (const verdict of JSON.parse(readFileSync(`${WORK}/results/${file}`, "utf8")).blocks as Verdict[]) {
    verdicts.set(verdict.id, verdict);
  }
}

const kept = blocks.filter((b) => {
  const verdict = verdicts.get(b.id);
  return !b.functional && (!verdict || verdict.defer || !DELETED.has(verdict.category));
});
if (kept.length > 0) {
  console.warn(`${kept.length} blocks stay (no verdict, or deferred): ${kept.slice(0, 10).map((b) => b.id).join(", ")}`);
}

const byFile = new Map<string, Part[]>();
for (const block of blocks) {
  const verdict = verdicts.get(block.id);
  if (block.functional || !verdict || verdict.defer || !DELETED.has(verdict.category)) continue;
  byFile.set(block.file, [...(byFile.get(block.file) ?? []), ...block.parts]);
}

let removedLines = 0;
for (const [file, parts] of byFile) {
  const original = readFileSync(file, "utf8");
  let text = original;
  for (const part of [...parts].sort((a, b) => b.start - a.start)) {
    let { start, end } = part;
    const jsxOpen = text.slice(0, start).match(/\{\s*$/);
    const jsxClose = text.slice(end).match(/^\s*\}/);
    if (jsxOpen && jsxClose && /\.[jt]sx$|\.vue$/.test(file) && !part.ownLine) {
      start -= jsxOpen[0].length;
      end += jsxClose[0].length;
    }
    if (part.ownLine || (jsxOpen && jsxClose && text.slice(text.lastIndexOf("\n", start - 1) + 1, start).trim() === "")) {
      const lineEnd = text.indexOf("\n", end);
      if (text.slice(end, lineEnd === -1 ? undefined : lineEnd).trim() === "") {
        start = text.lastIndexOf("\n", start - 1) + 1;
        end = lineEnd === -1 ? text.length : lineEnd + 1;
      }
    } else {
      while (start > 0 && (text[start - 1] === " " || text[start - 1] === "\t")) start -= 1;
    }
    text = text.slice(0, start) + text.slice(end);
  }
  text = text.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "");
  removedLines += original.split("\n").length - text.split("\n").length;
  writeFileSync(file, text);
}
console.log(`Deleted comments in ${byFile.size} files, ${removedLines} lines removed before formatting.`);

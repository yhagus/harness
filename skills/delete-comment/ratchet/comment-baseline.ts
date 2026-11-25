import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

const BASELINE_FILE = "comment-baseline.json";
const LINT_COMMAND = ["npx", "eslint", "--format", "json", "."];
const RULE = /no-comments\)?$/;
const SEE = "";

interface EslintResult {
  filePath: string;
  messages: { ruleId: string | null }[];
}
interface OxlintOutput {
  diagnostics: { code: string; filename: string }[];
}

function toRepoPath(file: string): string {
  return (isAbsolute(file) ? relative(process.cwd(), file) : file).split(sep).join("/");
}

function countCommentsPerFile(): Map<string, number> {
  const [command, ...args] = LINT_COMMAND;
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    env: { ...process.env, COMMENT_BASELINE: "off" },
  });
  if (result.error) {
    throw new Error(`could not run ${LINT_COMMAND.join(" ")}`, { cause: result.error });
  }
  const output: EslintResult[] | OxlintOutput = JSON.parse(result.stdout);
  const hits = Array.isArray(output)
    ? output.flatMap((file) => file.messages.filter((m) => RULE.test(m.ruleId ?? "")).map(() => file.filePath))
    : output.diagnostics.filter((d) => RULE.test(d.code)).map((d) => d.filename);
  const counts = new Map<string, number>();
  for (const file of hits.map(toRepoPath)) {
    counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  return counts;
}

const allowGrowth = process.argv.includes("--allow-growth");
const previous: Record<string, number> = existsSync(BASELINE_FILE)
  ? JSON.parse(readFileSync(BASELINE_FILE, "utf8"))
  : {};
const counts = countCommentsPerFile();

const grown = [...counts].filter(([file, count]) => count > (previous[file] ?? 0));
if (grown.length > 0 && !allowGrowth && existsSync(BASELINE_FILE)) {
  for (const [file, count] of grown) {
    console.error(`${file}: ${count} comments, baseline allows ${previous[file] ?? 0}`);
  }
  console.error(
    `\nThe comment ratchet only moves down. Delete the new comments, or pass --allow-growth when a reviewer agreed to it${SEE}.`,
  );
  process.exit(1);
}

const baseline = Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
console.log(`${BASELINE_FILE}: ${total} comments left in ${counts.size} files.`);

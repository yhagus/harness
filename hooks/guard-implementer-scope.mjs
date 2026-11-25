#!/usr/bin/env node
// PreToolUse guard for stack-specific implementer subagents.
// Usage (in agent frontmatter): node ~/.claude/hooks/guard-implementer-scope.mjs <required-dependency> [!excluded-dependency ...]
// e.g. `vue !nuxt`: the app must depend on vue and must not depend on nuxt.
// Blocks writes to files whose nearest package.json does not depend on <required-dependency>,
// e.g. nest-implementer (@nestjs/core) writing into a Nuxt app nested in the same monorepo.
// Exit 2 = block; stderr is fed back to the agent.
// A repo can list files every implementer may write, one repo-relative path per
// line, in `.claude/implementer-shared-files` (e.g. a root script that checks web/).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

const requiredDep = process.argv[2];
const excludedDeps = process.argv.slice(3).filter((a) => a.startsWith('!')).map((a) => a.slice(1));
const input = JSON.parse(readFileSync(0, 'utf8'));
const cwd = input.cwd || process.cwd();
const tool = input.tool_name;
const toolInput = input.tool_input || {};

function nearestExistingDir(p) {
  let dir = p;
  while (!existsSync(dir)) dir = dirname(dir);
  return statSync(dir).isDirectory() ? dir : dirname(dir);
}

function nearestPackageJson(p) {
  let dir = nearestExistingDir(p);
  while (true) {
    const candidate = resolve(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function dependsOnRequired(pkgPath) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const all = Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies);
    return requiredDep in all && !excludedDeps.some((dep) => dep in all);
  } catch {
    return true; // unreadable package.json: don't block on uncertainty
  }
}

// True when the repo lists this file in `.claude/implementer-shared-files`.
function isSharedFile(absPath) {
  let dir = nearestExistingDir(absPath);
  while (true) {
    const list = resolve(dir, '.claude', 'implementer-shared-files');
    if (existsSync(list)) {
      const shared = readFileSync(list, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => resolve(dir, line));
      return shared.includes(absPath);
    }
    const parent = dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

// Returns the foreign package.json if the path belongs to another app, else null.
function foreignPackage(target, base = cwd) {
  const absPath = resolve(base, target);
  const pkg = nearestPackageJson(absPath);
  if (!pkg) return null; // outside any JS project (e.g. scratch dirs)
  if (dependsOnRequired(pkg) || isSharedFile(absPath)) return null;
  return pkg;
}

function block(target, pkg) {
  process.stderr.write(
    `Blocked: ${target} belongs to the app at ${dirname(pkg)}, which is not a ` +
      `${requiredDep}${excludedDeps.map((d) => ` (non-${d})`).join('')} app. You may only change files in your own app. Do not work around this; ` +
      `list the change needed there as a follow-up in your report.\n`,
  );
  process.exit(2);
}

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  const target = toolInput.file_path || toolInput.notebook_path;
  if (target) {
    const pkg = foreignPackage(target);
    if (pkg) block(target, pkg);
  }
} else if (tool === 'Bash') {
  // Best effort: only inspect commands that look like they write or install.
  const fullCmd = toolInput.command || '';
  // A leading `cd <dir> &&` moves where the rest of the command runs, so judge
  // its words against that directory, not the agent's starting one.
  const cdPrefix = fullCmd.match(/^\s*cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))\s*&&/);
  const base = cdPrefix
    ? resolve(cwd, (cdPrefix[1] ?? cdPrefix[2] ?? cdPrefix[3]).replace(/^~(?=\/|$)/, homedir()))
    : cwd;
  const cmd = cdPrefix ? fullCmd.slice(cdPrefix[0].length) : fullCmd;
  const writes =
    /(^|[^<>&0-9])>{1,2}(?!&)|\b(sed|perl)\s+(-\w*\s+)*-i|\b(tee|mv|cp|rm|touch|mkdir|rmdir|ln|install|patch|truncate)\b|\b(npm|pnpm|yarn|bun|npx|bunx)\s+(add|install|i|remove|rm|uninstall|update|upgrade|run|x|exec)\b|\bgit\s+(checkout|restore|apply|mv|rm|stash)\b|\b(nest|nuxi|nuxt)\s+\w+/;
  // Running another app's checks only reads it, so verification across apps
  // stays allowed, e.g. `cd web && bun run check 2>&1 | tail -20`.
  const checksOnly =
    /^\s*(?:cd\s+[^\s;&|]+\s*&&\s*)?(?:npm|pnpm|yarn|bun)\s+run\s+(?:check|lint|format:check|typecheck|test(?::[\w-]+)?)\b[^;&|<>`$]*(?:\s2>&1)?(?:\s*\|\s*(?:tail|head|grep)\b[^;&|<>`$]*)*$/;
  if (writes.test(cmd) && !checksOnly.test(cmd)) {
    const tokens = cmd
      .split(/[\s;&|()<>]+/)
      .map((t) => t.replace(/^['"=]+|['"]+$/g, ''))
      .filter((t) => t && !t.startsWith('-') && !t.includes('$') && !/^\w+=/.test(t));
    for (const token of tokens) {
      const pkg = foreignPackage(token, base);
      if (pkg) block(token, pkg);
    }
  }
}
process.exit(0);

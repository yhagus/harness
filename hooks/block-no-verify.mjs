#!/usr/bin/env node
// PreToolUse guard: keeps git hooks running. Blocks `git commit`, `git merge`
// and `git push` when they skip hooks with --no-verify (or -n on commit).
// Exit 2 = block; stderr is fed back to the agent.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = (input.tool_input && input.tool_input.command) || '';

// Each simple command in a chain, so `git commit -m x && ls -n` isn't misread.
const segments = command.split(/&&|\|\||;|\|/);
const skipsHooks = segments.some((segment) => {
  const gitCall = segment.match(/\bgit\b(?:\s+-C\s+\S+|\s+-c\s+\S+)*\s+(commit|merge|push)\b(.*)$/);
  if (!gitCall) return false;
  const [, subcommand, rest] = gitCall;
  if (/(^|\s)--no-verify\b/.test(rest)) return true;
  // -n means --no-verify only for commit; flags may be bundled, as in -an.
  return subcommand === 'commit' && /(^|\s)-[a-zA-Z]*n[a-zA-Z]*(\s|$)/.test(rest.replace(/(["']).*?\1/g, ''));
});

if (skipsHooks) {
  process.stderr.write(
    'Blocked: this skips the git hooks. Run the commit with its hooks. If a hook ' +
      'check fails and you cannot fix it, stop and report the failing check and its ' +
      'output instead.\n',
  );
  process.exit(2);
}
process.exit(0);

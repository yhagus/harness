---
name: delete-comment
description: Delete a codebase's code comments. Classifies every comment, deletes tautologies and stale ones, files issues for excuses, moves decision records into ADRs, then bans comments with a ratcheted lint rule, leaves a repo-local /delete-comment skill, and estimates the lines shed.
disable-model-invocation: true
---

If the repo already has `.claude/skills/delete-comment/SKILL.md`, this is a repeat run: follow that skill instead and stop here.

Every code comment gets one verdict, and each verdict has one fate:

| Verdict     | What it is                                                              | Fate                                                    |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `tautology` | repeats what is already visible from the code                           | deleted                                                 |
| `excuse`    | lets a hacky implementation get away with it, so the hack propagates   | deleted, and an issue filed to fix the hacky code       |
| `stale`     | references code or implementation details that are no longer relevant  | deleted                                                 |
| `decision`  | records an important, non-obvious decision about the code              | deleted, and moved into an ADR                          |

Functional comments (compiler and linter directives, `@ts-expect-error`, `/*#__PURE__*/`, licence headers, JSDoc types in plain JS) are code, not comments: the inventory sets them aside and the lint rule allows them. Both share one allowlist, `isFunctional` in `ratchet/no-comments.mjs`; add repo-specific markers a tool reads with `--keep` / the rule's `allow` option.

The sweep need not delete every comment in this PR: the ratchet in step 7 bans new comments and lets the rest shrink over later runs. A verdict with `defer: true` stays; so does any comment outside the swept paths.

Work in a directory outside the repo (the session scratchpad), `$WORK` below. Scripts here are `~/.claude/skills/delete-comment/<name>`. An argument narrows the sweep to those paths.

## Steps

1. **Inventory and estimate.** On a branch off the default branch, run `bun ~/.claude/skills/delete-comment/inventory.ts $WORK [--exclude <regex>] [--keep <regex>] [paths]`. It needs `typescript` resolvable from the repo root. It parses JS/TS with the TypeScript compiler (Vue/HTML/Svelte script blocks too), CSS and markup comments by pattern, skips generated and vendored paths (override with `--exclude`), and writes `$WORK/inventory.json` plus one `$WORK/parts/p<N>.json` per ~450 blocks. Its `ESTIMATE` line is the lines shed by deleting every comment; its `NOT PARSED` line lists languages whose comments it missed: count those with the language's own tooling and add them to the estimate. Done when you have the estimate and the inventory covers every language the repo lints.

2. **Classify.** Dispatch one classifier subagent per partition, all in one message, on Sonnet (`general-purpose`, since it writes a result file), briefed with the absolute path of `~/.claude/skills/delete-comment/classify-brief.md`, its partition file, and `$WORK/results/p<N>.json` as output. Done when every partition has a result in which `jq` finds every input id once and every `adr` / `issue` key resolving; send a fresh agent the gaps.

3. **Review the verdicts.** Read every `decision`, `excuse`, `stale` and deferred verdict with its reason. Demote a decision below the ADR bar (hard to reverse or surprising, and a real trade-off) to `tautology`; promote a tautology whose reason describes a workaround to `excuse`; merge ADR and issue drafts two partitions wrote about one thing. Done when each draft maps to one decision or one hack.

4. **Write the ADRs.** Use the repo's ADR directory and voice; with none, create `docs/adr/` in the format of `~/.claude/skills/domain-modeling/ADR-FORMAT.md`. Number new ADRs after the highest existing one, fold each `append` into its ADR, and add one ADR recording this policy: code comments are banned, decisions live in ADRs, the baseline only moves down. Done when every `decision` block is covered by an ADR file on disk.

5. **File the issues.** Find the tracker from the remote (`gh repo view --json nameWithOwner`, `glab repo view`) and the repo's labelling convention. Show the user the target and the issue titles, and file on their go-ahead. Done when every `excuse` block maps to an issue number.

6. **Delete.** Run `bun ~/.claude/skills/delete-comment/apply.ts $WORK`. It deletes every verdicted, non-deferred comment (whole lines for own-line comments, the `{ }` around JSX comments) and collapses the blank lines left behind. Then run the repo's formatter.

7. **Ban comments with a ratchet.** Copy `ratchet/no-comments.mjs` to `scripts/lint/` and register it in the repo's linter: an ESLint flat config `plugins: { comments: plugin }` with `"comments/no-comments": ["error", { baseline: "comment-baseline.json", adr: "ADR <n>" }]`, or oxlint `jsPlugins`. Copy `ratchet/comment-baseline.ts` to `scripts/`, set its `LINT_COMMAND` (JSON output) and `SEE`, add a `comments:baseline` package script, and run it to write `comment-baseline.json`: the per-file count of comments left. The rule fails a file whose count exceeds its baseline, and asks for a re-run when a file drops below it; the script refuses growth without `--allow-growth`. Name in the report what the linter does not parse (CSS, Vue templates, other languages): the ratchet does not cover them. Done when lint passes, and a comment added to a clean file fails lint (try it, then revert).

8. **Check.** Run the repo's documented checks (`AGENTS.md`, `CLAUDE.md`, CI config). A deletion that breaks a check was load-bearing: restore it, mark it `defer`, file an issue, re-run the baseline. Done when every check is green.

9. **Leave a repo skill.** Write `.claude/skills/delete-comment/` in the repo so the next run repeats this as a ratchet turn: copy `inventory.ts`, `apply.ts`, `classify-brief.md` and `ratchet/no-comments.mjs` (fix the inventory's import to the copied rule's path), and write its `SKILL.md` from `repo-skill-template.md`, every `<placeholder>` filled with what this run found: exclude and keep patterns, ADR directory and an example ADR, issue tracker and label, formatter, baseline and check commands. Done when no placeholder is left and its inventory runs from the repo root.

10. **Commit and report.** One commit per kind: `docs(adr): ...`, `refactor: delete code comments ...`, `build(lint): ban code comments with a ratcheted baseline`, `chore: add delete-comment skill`. Report:
    - verdict counts, ADRs written, issues filed (numbers);
    - lines shed in this PR (`git diff --shortstat <default branch>`);
    - the estimate from step 1 for deleting all comments, and what remains of it in the baseline;
    - what the ratchet does not cover.

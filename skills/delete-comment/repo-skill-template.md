---
name: delete-comment
description: Sweep the comments the ratchet still allows in <repo>: classify each, move decisions into ADRs, file issues for excuses, delete the rest and lower the comment baseline.
disable-model-invocation: true
---

Comments are banned by `<rule id>` in `<lint config>`, ratcheted down per file by `<baseline file>` (<comment-ban ADR>). One run of this skill is one ratchet turn: every comment the baseline still allows gets a verdict and its fate.

| Verdict     | Fate                                               |
| ----------- | -------------------------------------------------- |
| `tautology` | deleted                                            |
| `stale`     | deleted                                            |
| `excuse`    | deleted, and an issue filed to fix the hacky code  |
| `decision`  | deleted, and moved into an ADR in `<adr dir>`      |

A verdict with `defer: true` stays for a later turn. Work in a directory outside the repo (the session scratchpad), `$WORK` below. An argument narrows the sweep to those paths.

## Steps

1. **Inventory.** On a branch off `<default branch>`: `bun .claude/skills/delete-comment/inventory.ts $WORK --exclude '<exclude regex>' --keep '<keep regex>' [paths]`. Done when it prints the ESTIMATE line.
2. **Classify.** One classifier subagent per `$WORK/parts/p<N>.json`, all in one message, on Sonnet, briefed with the absolute path of `.claude/skills/delete-comment/classify-brief.md`, its partition and `$WORK/results/p<N>.json`. Done when `jq` shows every partition's ids complete and every `adr` / `issue` key resolving; send a fresh agent the gaps.
3. **Review.** Read every `decision`, `excuse`, `stale` and deferred verdict with its reason. Demote a decision below the ADR bar to `tautology`; promote a tautology whose reason describes a workaround to `excuse`; merge drafts two partitions wrote about one thing. Done when each draft maps to one decision or one hack.
4. **ADRs.** Number after the highest in `<adr dir>`, in the voice of `<example ADR>`; fold each `append` into its ADR. Done when every `decision` block is covered by an ADR on disk.
5. **Issues.** `<issue CLI and target>`, label `<label>`. Show the user the titles and get a go-ahead, then file. Done when every `excuse` block maps to an issue number.
6. **Delete.** `bun .claude/skills/delete-comment/apply.ts $WORK`, then `<format command>`.
7. **Ratchet and check.** `<baseline command>` (never with `--allow-growth` here), then `<check commands>`. A deletion that breaks a check was load-bearing: restore it, mark it `defer`, file an issue. Done when every check is green.
8. **Commit** one commit per kind (`docs(adr): ...`, `refactor: delete code comments ...`, `chore(lint): ratchet comment baseline`) and report: verdict counts, ADRs written, issues filed, lines removed (`git diff --shortstat <default branch>`), comments left in the baseline, and the ESTIMATE for what remains.

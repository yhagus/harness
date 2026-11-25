# Comment classification brief

The project is deleting its code comments. Classify the comment blocks in ONE partition file and draft what must survive them. Read the repo, write only your result file.

## Input

Your partition file is a JSON array of blocks: `id`, `at` (file:line or file:start-end), `trailing` (true when the comment sits after code on the same line), `comment` (verbatim), `codeAfter` (the 4 source lines after it). Classify from that; open the file only when the context isn't enough to judge.

First, find the repo's decision records and vocabulary: its ADR directory (`docs/adr/`, `docs/decisions/`, `adr/`; none is fine), and a glossary or `CONTEXT.md` if one exists. Read the ADRs your partition's comments cite.

## Categories (exactly one per block)

- `tautology`: repeats what is already visible from the code: its name, signature, type, the obvious behaviour, a section header (`// Settings`, `/* Buttons */`), a field description that restates the field name, commented-out code. Also a comment whose content an existing ADR already records in full (say which in `reason`).
- `excuse`: lets a hacky implementation get away with it: a workaround, a "for now", a TODO/FIXME/HACK, a known limitation papered over, duplicated logic justified in prose, a cast or escape hatch explained away, a "keep in sync with X by hand". The implementation is the problem, so it gets an issue.
- `stale`: references code, files, symbols, behaviour or plans that no longer match the code. Grep every path or symbol it names and check its claim against the code it sits on; call it stale only after checking.
- `decision`: documents an important, non-obvious decision a future reader would otherwise "fix": a deliberate deviation from the obvious path, a constraint invisible in the code (an external API's quirk, a security property, an ordering or concurrency guarantee, a wire-format rule), a rejected alternative. The ADR bar: hard to reverse or surprising without context, AND the result of a real trade-off. A small local "why" whose loss costs a reader a minute is `tautology`.

Between tautology and decision, ask: "if this comment vanished, would a competent engineer likely make a wrong change?" Yes → decision.

A block a tool reads (a code generator marker, a parser pragma, a check script's anchor) is load-bearing: give it its category and add `"defer": true` with the tool in `reason`; the main thread keeps it out of this sweep.

## ADR drafts (for `decision` blocks)

Group decision blocks that are facets of one decision into one draft. Each draft is either:
- `existing: "<ADR number or file>"` when an ADR already covers it: `alreadyRecorded: true` when it already says what the comment says, else `append` (one or two sentences in that ADR's voice);
- or new: `title` (the decision as a sentence) and `body` in Markdown: the context, what was decided and why, naming the governed code by symbol or file path. Add `## Considered Options` / `## Consequences` only when the comments supply real material. Match existing ADRs' voice when there are any. State only rationale the comments or code support.

Leave new ADRs unnumbered; the main thread numbers them.

## Issue drafts (for `excuse` blocks)

Group excuse blocks about the same hacky implementation into one draft: `title` (imperative, under 80 chars) and `body` in Markdown with `## Problem` (what the code does and why it's hacky, citing file:line), `## What the deleted comment said` (quote it), `## Suggested direction`, `## Acceptance criteria` (checkbox list). Check open issues once first (`gh issue list --state open --limit 200 --json number,title`, or `glab issue list` on GitLab); when one already covers it, set `existingIssue: <number>` in place of a body.

## Output

Write `<work-dir>/results/<partition>.json` (the path is in your prompt):

```json
{
  "blocks": [ { "id": "c00001", "category": "tautology", "reason": "≤ 15 words", "adr": "key-or-omit", "issue": "key-or-omit", "defer": false } ],
  "adrs":   [ { "key": "kebab-slug", "existing": "0014", "alreadyRecorded": false, "append": "…", "title": "…", "body": "…" } ],
  "issues": [ { "key": "kebab-slug", "title": "…", "body": "…", "existingIssue": 12 } ]
}
```

Done when `jq` confirms every input id appears exactly once in `blocks`, every `decision` block names an `adr` key and every `excuse` block an `issue` key that resolve in `adrs` / `issues`.

Final message: counts per category, ADR drafts (new / append / already recorded), issue drafts, and anything surprising (a deferred block, a comment that turned out load-bearing). No file dumps.

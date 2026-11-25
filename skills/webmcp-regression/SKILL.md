---
name: webmcp-regression
description: Write or extend a frontend regression suite for one menu or feature, built on WebMCP tools and a thin DOM layer, run by command. Judges function against the requirement, sorts every mismatch into frontend or API.
argument-hint: "Which menu or feature, and where is its requirement?"
disable-model-invocation: true
---

Write the regression suite for one menu or feature of a frontend. The suite runs by command, with no model in the loop; you write it, and you triage what it cannot label itself. Its verdict goes to whoever owns the fix: the frontend (this repo) or the API (provided, built elsewhere).

The requirement is the source of truth, in whatever form it comes: an HTML mock, a document, a spec. The frontend rebuilds that product; the API is given. The suite exists to find where the two disagree and to say which side is wrong.

## Principles

- **The frontend is under test.** The suite drives the app the way a user does and reads the API only as evidence. An API defect is reported with that evidence, never worked around in the suite.
- **Two layers.** The tool layer calls the page's own functions through WebMCP tools and carries the logic: flows, states, rules, roles, edges. The DOM layer is thin and proves the wiring: each action is rendered, offered in the right state, and reaches the same function. See [references/dom-layer.md](references/dom-layer.md).
- **Function, not wording.** A scenario passes when the behaviour works. Assert state, presence, enablement, counts and values compared against data, never label text, copy, casing or spacing. Wording changes with language and with data an admin edits.
- **Every failure has an owner and evidence.** frontend or api, with the recorded request and response. The runner labels every failure it can decide in code, so a clear red run needs no model.
- **Green is not done.** Passing proves only what has a scenario. Always report coverage per layer, and name what is uncovered.
- **Nothing is skipped.** A scenario that cannot run is a failure that says why, or an empty pass proven by a response. A skip hides gaps.

## Steps

1. **Map the requirement into a coverage matrix.** One row per behaviour: an action, a state, a rule, a role difference, an empty state, an error path. Each row has an id, where the requirement says it, its layer (`tool`, `dom`, or both; every user action needs `dom`), and its scenario or `uncovered`. Read the requirement in narrow ranges. When it is large or minified, delegate the enumeration to a read-only agent, and ask it to trace code that later patches wrap, since the last definition is the live one. Done when no behaviour in the section is missing a row.
2. **Read the API as it answers, not as documented.** Pull raw live responses for every endpoint the screen reads, and the backend source when you have it (read-only). Specs often omit response schemas. Done when, for every field the screen reads, you know whether it is sent with a value, sent as null, or absent.
3. **Set up the runner and the tools.** The runner is Playwright unless the project has none; set it up as [references/running.md](references/running.md) says when it is missing, recorder and owner labels included. Write or extend the tools as [references/tools.md](references/tools.md) says. Done when every action in the matrix has a tool and a spec can call it.
4. **Write the scenarios.** Tool-layer rows take a pattern from [references/scenario-patterns.md](references/scenario-patterns.md); DOM-layer rows follow [references/dom-layer.md](references/dom-layer.md). Done when every row has a scenario per layer or an explicit `uncovered` with the reason, and every scenario ends in exactly one outcome.
5. **Run it** with the project's command, as [references/running.md](references/running.md) says. Done when the whole suite has finished and its report is saved.
6. **Triage the failures the runner left unlabelled** with the procedure in [references/outcomes.md](references/outcomes.md), and check one labelled failure per label against its evidence. Frontend: fix it in this repo and rerun. API: report it with the recorded evidence. Suite mistake: fix the suite; a scenario that fails on its own error was written wrong. Done when the failures left are API ones, each with evidence.
7. **Report** passed, passed-empty and failed by owner, then coverage per layer with the uncovered rows listed. Say "matches the requirement" only when nothing is uncovered.

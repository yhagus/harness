# Scenario patterns

Patterns for the tool layer; pick one per coverage row. DOM-layer checks follow [dom-layer.md](dom-layer.md). A scenario judges behaviour, not wording.

## Patterns

- **Flow.** Do what a user does, end to end, then read the result back from somewhere other than the action's own response: the detail page, the list, the next screen. A 2xx proves nothing. Most real bugs surfaced here: a response id read under the wrong name, a call to a function that was renamed, a phase shown wrongly after a save.
- **Two views, one truth.** Read the same data through two paths (the tool's state, the mounted component, the rendered page, the raw API) and compare. It needs no requirement, and it catches a detail panel that drops a field the list shows.
- **Round trip.** Change something, check it, put it back in a `finally`, so a failing check never leaves the fixture changed.
- **Role.** Read the viewer's permissions from the app, then check the UI offers exactly the actions they allow. A role you cannot be becomes an empty pass, proven by the permission the API sent, not a skip.
- **State machine.** Each transition asserts which actions the next state offers. Scenarios share fixtures, so a step that changes the state (an action that releases the assignee) breaks the steps after it. Give later scenarios an ensure-state helper instead of assuming.
- **Empty and boundary.** Exercise the edge (one page of results, no group, no login) and prove the API sends the field, as in [outcomes.md](outcomes.md).
- **Irreversible action.** When the backend keeps what the action creates, make fresh data per run (a stamped name) and leave the result, or find a restore that really works. Check that a reuse assumption holds before building on it: closing a child record can move its parent back to an earlier status, where the next step no longer behaves as it did on the first run.
- **Error path.** Send what the requirement's UI would send. A rejection is an API failure with the payload attached.
- **Mounted probe.** Mount the real component with fake props to test UI logic with no side effects. Check the prop names against the component; a probe that passes stale prop names tests nothing.

## Mistakes to avoid

- Truthiness as "the API sent it". A null value is sent.
- A scenario that catches its own mistake and reports it as a requirement gap.
- Hard-coded sample values that master data does not contain.
- Depending on list order or on the first row.
- Fixtures shared between scenarios with no ensure-state step.
- Long fixed sleeps. Wait on a condition with a timeout.
- Counting a scenario that did not exercise its check as proof. An empty pass says so.

# The DOM layer

The tool layer proves the logic by calling the page's functions. It never touches the template, so a button wired to the wrong handler, a render condition that hides an action from the wrong role, or a value computed right and rendered wrong all pass there. The DOM layer exists to catch exactly that, and nothing more.

## What it checks

For every user action in the coverage matrix:

- **Rendered and offered.** The control is present, visible and enabled in the states and roles the requirement offers it, and absent or disabled in the others. Reuse the state the tool layer already reaches; read the expected state from the tool, not from a literal.
- **Wired.** Clicking it reaches the same function the tool calls: the recorded request matches the one the tool sends for the same input, or the tool state afterwards shows the same change.
- **Shown as computed.** For the fields the requirement shows, the rendered value equals the tool's state for the same record (the "two views, one truth" pattern, across the template).

Add one or two click-through flows per menu for the paths the requirement treats as critical, driven entirely by locators.

Business rules, edge cases and data shape stay in the tool layer. A DOM scenario that starts asserting a rule belongs in the tool layer, with a wiring check left behind here.

## Locators

In order, stop at the first that identifies the element uniquely:

1. Role plus accessible name (`getByRole`, `getByLabel`), with the locale pinned for the run.
2. A `data-testid`, added only where role and name repeat, such as an action on every table row. Scope it to its row or region first.
3. Text, as a last resort.

Styling classes and generated ids change with every redesign; leave them out of locators. A control a role locator cannot find is often an accessibility defect too: report it as frontend.

## Assertions

Assert state: visible, enabled, checked, count, and values compared with the tool's data. Use the runner's waiting assertions and wait on a condition with a timeout, never a fixed sleep. A failure here is judged from the trace and screenshot the runner keeps.

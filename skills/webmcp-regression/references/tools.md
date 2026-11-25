# WebMCP tools

A tool lets the agent use a screen without clicking. The suite is built on them, so their fidelity decides whether a pass means anything.

## Rules

1. **Call the page's own functions** (hooks, composables, services, utils), never the API directly. Confirm dialogs, toasts, refreshes and error handling live there, so a click and a tool call trigger the same things. A tool that skips them tests something the user never runs.
2. **Logic still inside a component moves out first.** Put it in the feature's shared module (hook, composable, service), make the page call it, then let the tool call the same function. Never copy the logic into the tool.
3. **Return structured state that mirrors the screen**, shaped by the page's own mappers, so what the tool returns is what the user sees. Prefer fields over pre-formatted strings.
4. **Mark intent.** Read-only tools say so; tools that change data say so, and refuse to touch anything that is not test data (a name prefix guard).
5. **Cover every action the requirement shows**, and change the tool and its scenarios when the action changes.
6. **Dialogs open as they do for a user.** A destructive action opens its confirm dialog and the tool waits for the answer. Who answers it is the runner's rule, in [running.md](running.md).
7. **Expose tools in dev and test builds only**, never in production.

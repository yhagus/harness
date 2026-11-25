# Running the suite

The suite runs by one command, deterministic and unattended. A model writes it and triages what it cannot label; no model drives a run.

## The Playwright runner (default)

Run against the app the developer already serves (dev or a dev deploy), as one logged-in user with that user's permissions.

1. **Auth is a setup project.** `auth.setup.ts` reuses the saved `storageState` while it still opens the app logged in. When it does not, it opens a headed browser on the login page and waits, with a long timeout, for a signed-in page; the human types the credentials, and the setup saves the new state. Every test project uses that state and depends on the setup project. The agent never types a password or token. Keep the state file out of version control.
2. **The app exposes its suite in dev and test builds only**: a global or a dev-only module that lists scenarios and runs one by id, returning its checks as JSON. Calling it needs no browser flag and no tool channel, so results arrive whole.
3. **One Playwright test per scenario.** A tool-layer test calls `page.evaluate` to run its scenario in the page; a DOM-layer test drives the page with locators. Scenarios that share a fixture run in a serial describe, in order.
4. **Record every request of every test.** A fixture listens to the page's responses and keeps method, URL, request body, status and response body for the app's API calls, then attaches them to the test as JSON with `testInfo.attach`. This is the evidence for [outcomes.md](outcomes.md); the app needs no recorder of its own.
5. **Keep the trace and a screenshot of every failure** (`trace: 'retain-on-failure'`). A DOM-layer failure is judged from them.
6. **Write a JSON report to a file**, one entry per test with its outcome, its owner label from [outcomes.md](outcomes.md), and its attachments. Triage reads that file, not the terminal.
7. **Run the command, wait for it to exit, read the report.** A suite takes minutes; batch fixes between runs instead of rerunning for each one.

Leave the source files alone while a run is going: hot reload refreshes the page and breaks the run. A run that lands on the login page has an expired state; it stops and asks the human to log in again.

## Dialogs in an unattended run

A test answers a confirm dialog only when the record it acts on passes the test-data guard. A permanent delete of data the app cannot recreate runs only with an explicit opt-in flag for that run, default off; without it the scenario reports `omitted` with the flag's name, and its coverage row counts as uncovered for that run.

## In-page run (fallback)

When the project has no Playwright, run the suite inside the user's own browser.

1. The human logs in.
2. Start the suite in the background from the page and keep a status object with its start time and result, also stored in page storage, one key per run.
3. Poll about every 30 seconds. One browser-tool call times out after roughly 45 seconds, and a long wait loses the connection.
4. A suite that deletes opens a confirm dialog and waits. Tell the user to answer it, then keep polling.
5. Read the result whole from page storage. Tool results passed through the tool channel are cut at a few thousand characters.
6. The app must record requests itself here: wrap the HTTP client once and keep the calls per scenario.

Debug either runner with tagged console logs: prefix temporary output with a unique tag, read it by pattern, and grep the tag to remove it before you finish.

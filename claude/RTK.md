# Command output

Command output here is condensed to save tokens, keeping every signal and
dropping costly noise. Treat it as the complete result: run commands
normally, and batch related commands into one call to avoid extra turns.
Truncated results state their recovery path in their own output. Re-run a
command as `rtk proxy <cmd>` only when its result is unusable: empty when
output was clearly expected, contradicting its exit code, or garbled.

A full test-suite run keeps only its totals once condensed. Write a report
file in the same run (for PHPUnit/Pest `--log-junit <scratchpad>/junit.xml`,
for Vitest/Jest a JUnit reporter) and read failing test names and per-test
times from it, so one run answers both.

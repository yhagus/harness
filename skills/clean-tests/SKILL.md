---
name: clean-tests
description: Clean up a test suite. Finds tautological, type-redundant, duplicate and flaky low-value tests, shows you a plan, and after your approval removes or replaces them so the suite gets smaller, faster and less flaky without losing real protection.
disable-model-invocation: true
argument-hint: "[path | browser | unit | all]"
---

# Clean up tests

Make the test suite smaller and quieter without losing real protection.

The `verifier` agent does the analysis and the edits. Your job in this session is to scope the work, show the user the plan, and get approval before anything is deleted. The approval step exists because some decisions rest on knowledge only the user has: which journeys are business-critical, or whether a flaky test once caught a real incident that never made it into git or CI history.

Requested scope: $ARGUMENTS

## 1. Scope

- If the requested scope is empty, ask the user which part to clean: a directory, a test type (browser/e2e, unit, integration), or everything. Suggest starting with browser/e2e tests, since they are usually the noisiest. Wait for the answer.
- Resolve the scope to concrete paths and the command that runs those tests, using the repo's test layout and config.

## 2. Pre-flight

- Run `git status`. If there are uncommitted changes, stop and ask the user to commit or stash them first. Cleanup commits must contain only cleanup, so every deletion stays easy to review and revert.
- If the current branch is the main branch, suggest creating a dedicated branch (for example `chore/clean-tests-<scope>`) and ask before creating it.

## 3. Audit

Spawn the `verifier` agent, without a `model` parameter, with a prompt like:

> Mode 3, audit only. Scope: <resolved paths and test command>. Classify every test in scope and return the full plan. Change nothing and commit nothing.

## 4. Review the plan with the user

If the plan contains nothing to remove, replace or fix, say so and stop.

Otherwise, present it:
- One summary line per group, with counts (for example "Delete, provable from code: 23 tests").
- If the verifier found bugs (flakiness caused by the application code), show them first: they matter more than the cleanup.
- Show every "needs a human call" entry individually, with the verifier's reasoning, and ask the user to decide each one.
- Show the other groups compactly (file, test name, one-line reason), so the user can scan them and exclude anything.

Then ask the user to approve the plan as is, approve it with exclusions, or cancel. Wait for an explicit answer. Never move on to deletion without it.

## 5. Execute

Spawn the `verifier` agent again, without a `model` parameter, with the approved plan:

> Mode 3, execute this approved plan exactly. Do not re-audit or add entries. <the approved plan, including the user's decisions on the "needs a human call" entries and any exclusions>

## 6. Report

Relay the verifier's result:
- test count and run time, before and after
- tests removed, grouped by reason
- replacements written and flakiness fixed
- bugs found
- the commits created

If anything could not be run in isolation or verified, say so plainly.

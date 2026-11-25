---
name: ts-readability-standards
description: TypeScript, readability and test-discipline standards for NestJS and React codebases. Use whenever writing, refactoring or reviewing TypeScript code, tests, scripts or config in these projects, even for small changes. Preloaded by nest-implementer and react-implementer.
---

# TypeScript, readability and test standards

These standards exist for two reasons: types are only useful when they tell the truth, and code is read far more often than it is written. Every rule below serves one of those.

## TypeScript

Everything is TypeScript: application code, tests, scripts (seeds, codegen, one-off tooling) and config files. One language and one type system means every file is checked and every reader knows what to expect. The only exception is a config file for a tool that cannot read TypeScript; use the format that tool requires. Run scripts with the TypeScript runner the project already uses (see the `package.json` scripts) rather than adding a new one.

Keep the types honest. Escape hatches hide exactly the bugs the compiler exists to catch:
- No `any`. Data of unknown shape (API responses, parsed JSON, `localStorage`, env vars, URL params) is `unknown` until you narrow it with a type guard or the project's validation library.
- Don't use `as` to silence a type error, the non-null operator in expressions (`user!.id`), or `@ts-ignore`. If a suppression is truly unavoidable, use `@ts-expect-error` with a comment saying why: unlike `@ts-ignore`, it fails once the error is gone. `as const` is fine, because it narrows rather than lies.
- Definite assignment on decorated class properties (`@Column() name!: string`, `@IsString() email!: string`) is the standard NestJS and ORM pattern under strict mode, and is fine. Never make a field optional just to avoid it: that changes the contract.
- Rely on the project's ESLint config where it enforces these rules. Never disable a lint rule inline to make code pass; fix the code, or report why you couldn't.

Make types readable documentation:
- Annotate the public surface (exported functions, hooks, public methods, component props) so a reader sees the contract without reading the body. Let inference handle local variables.
- Model distinct states with discriminated unions rather than a bag of optional fields and booleans, so impossible states can't be represented. For example: `{ step: 'details' } | { step: 'payment'; orderId: string } | { step: 'done'; receiptUrl: string }`.
- In new code, prefer string literal unions or `as const` objects over `enum`, unless the project already uses enums for that domain (ORM or class-validator enums, for example).
- Use `satisfies` to check object and config literals without widening their types.
- Reuse existing types (entities, DTOs, API client or generated types) instead of redeclaring a shape that can drift.
- Readability beats type cleverness. In application code, a plain named type beats deep conditional or mapped types.

## Readability

Write for the next developer who opens the file with no context.

- Match the conventions of the surrounding code first, including `type` vs `interface`, file layout and naming. Consistency is itself readability. Let the formatter and linter handle formatting.
- Names say what something is or does, in the domain's language. No unexplained abbreviations. Booleans read as questions (`isExpired`, `hasAccess`); functions start with a verb.
- One function, one job. Prefer early returns over nested `if`/`else`, and avoid nested ternaries.
- Explicit beats clever: no dense one-liners or chains that need a comment to decode.
- Replace magic numbers and strings with named constants.
- Comments explain why, not what. No commented-out code (git remembers it), and no JSDoc that only restates the types.
- Don't abstract early. Wait for the third real use before extracting a shared helper, and don't build a generic utility for a single caller: a wrong abstraction is harder to undo than duplication.
- Keep the diff focused on the task. Renaming, reformatting or restructuring unrelated code buries the real change in review and collides with parallel work. Mention hard-to-read nearby code in your report instead.

## Test discipline

A small, high-signal suite beats a large, noisy one. Every test costs run time, maintenance, and flakiness that teaches people to ignore red builds. Write the fewest tests that would catch a real regression, and hold each one to this check: "Would this fail on a plausible regression, and only then?"

- No tautological tests. They pass whatever the code does and give false confidence: expected values computed with the code under test, assertions that a mock returns what you configured, snapshots nobody checked.
- Don't test what TypeScript already guarantees: return types, required properties, argument types, object shapes.
- Don't test third-party libraries; test your use of them.
- Tests are documentation. Name each test after the behaviour (`'rejects an expired coupon'`), keep arrange, act and assert visible, and keep loops and conditionals out of test bodies.
- Check that each new test can fail. The TDD red step usually proves it. For a test written after the code, break the behaviour, confirm the test goes red, then restore the code and check that `git diff` shows only intended changes before moving on.
- Unless your task is to prune tests, don't delete existing low-value tests (tautological, type-redundant, or flaky without a record of catching real regressions). List them in your report with file and test name instead. Pruning is a deliberate job for the verifier agent; doing it mid-ticket widens the diff and collides with parallel work.

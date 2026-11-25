# Naming conventions

## Order of precedence

When these sources disagree, the one higher on the list wins:

1. **What the language or tool requires.** A Python import name can't contain a hyphen, npm rejects uppercase package names, and Next.js only recognizes `page.tsx`.
2. **What the existing repo already does.**
3. **The community defaults below.**

## Project and repository names

Use lowercase kebab-case: `data-viz-tools`.

The same string then works unchanged as a folder, a URL slug, and a package name on npm or PyPI. It also avoids case problems, because macOS and Windows treat `Data-Viz` and `data-viz` as the same name while Linux and git treat them as different.

To normalize what the user typed:

1. Lowercase it.
2. Turn spaces and underscores into hyphens.
3. Drop anything outside `a-z0-9-`.
4. Collapse repeated hyphens and trim them from both ends.

Don't add suffixes like `-project` or `-app` unless the user did.

The manifest name should match the directory name, so nobody has to remember two names. The one standard exception is the Python import name (see `python.md`).

## Directory names

**Use lowercase ASCII with no spaces.** Hyphen is the default separator. Where a directory doubles as an import path, the language's identifier rules win: Python packages use `snake_case`, and Go packages use a single lowercase word.

Lowercase matters because macOS and Windows filesystems are case-insensitive by default. There, `Utils/` and `utils/` are the same folder, while Linux and git treat them as two. A rename that only changes case therefore tends to break CI on one platform while working on another. Keeping everything lowercase avoids the problem entirely.

**Use plural names for folders that hold a collection of like things**: `tests/`, `docs/`, `scripts/`, `examples/`, `fixtures/`. Leave the conventional short forms as they are: `src/`, `lib/`, `bin/`.

**Name folders by their domain** (`billing/`, `auth/`, `parsers/`) rather than with catch-alls like `utils/`, `misc/`, `helpers/` or `common/`. A catch-all grows without bound because anything fits in it. If the repo already has a small, well-scoped `utils/`, it's fine to use it.

**Put tooling config in the dot-directories the tools expect**, such as `.github/` and `.vscode/`. Don't invent new dot-directories.

## File names

**Follow the language's convention.** Python, Go and Rust use `snake_case`. TypeScript and JavaScript are covered in `typescript.md`.

**Keep conventional root files in uppercase**: `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`. GitHub and GitLab look for these exact names and surface them in the UI, and uppercase sorts them to the top of a listing. The same goes for `Makefile` and `Dockerfile`, which their tools find by those names.

**Use no spaces, and nothing outside `A-Za-z0-9._-`.** The exceptions are framework routing syntax, such as Next.js `[id]`, `(group)` and `@slot`. Spaces and odd characters break shell scripts, CI configs and URLs in ways that are tedious to debug.

**Name test files with the runner's default discovery pattern** so they run with no configuration: `test_*.py` for pytest, and `*.test.ts` for Vitest or Jest.

## Root of a new project

Create the smallest useful set:

- `README.md`, with the name, a one-paragraph purpose, and how to install, run and test;
- `.gitignore` for the stack;
- the manifest;
- the source directory;
- one test.

Leave out `LICENSE` unless the user names a license; mention that it's missing in the report.

Add `.editorconfig`, CI workflows, Docker files and pre-commit configs only when asked.

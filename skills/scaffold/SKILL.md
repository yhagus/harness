---
name: scaffold
description: Scaffold a new project, or a new module inside an existing repository, with a directory layout and names that follow community conventions for the stack (Python and TypeScript/JavaScript in depth, with a fallback for other languages). Use only when the user explicitly asks to scaffold, bootstrap, or lay out a project, package, library, app, or module, or types /scaffold. Do not use for questions about where a single file belongs or for general explanations of project layout.
---

# Scaffold

Create a directory structure with conventional names and a minimal set of working starter files, either as a new project or as a new module inside a repository that already exists.

Arguments: $ARGUMENTS

(In Claude Code that line holds whatever the user typed after `/scaffold`. If it still reads as a literal placeholder, take the stack, kind and name from the user's message instead.)

## What a good scaffold looks like

Someone who knows the stack opens it and finds nothing surprising. The folders are where they expect, names follow the ecosystem's rules, and the project installs, builds and runs its one test without further setup.

Keep it minimal. Every file you create is a file the user has to maintain or delete, so leave out anything added "just in case": empty placeholder folders (git doesn't track them anyway), CI config, Docker files, and lint setups the user didn't ask for.

## Workflow

### 1. Work out mode, stack, kind and name

Check the filesystem rather than guessing.

- **Mode.** If the target directory is empty or doesn't exist, this is a *new project*. If it is inside a repo, or holds a manifest (`.git`, `pyproject.toml`, `package.json`, `go.mod`, `Cargo.toml`, ...), this is an *existing repo*.
- **Stack.** Take it from the arguments or the message. In an existing repo, the manifests tell you. For a new project with no stack given, ask, in one short question.
- **Kind.** Library, CLI, web app, service, monorepo, or module. When the request is vague, pick the smallest kind that fits.
- **Name.** Normalize it with the rules in `references/naming.md`. If the name had to change (`"Data Viz Tools"` becomes `data-viz-tools`), say so in the proposal, so the user isn't surprised by it later.

### 2. Read the references for this job

- `references/naming.md`: always.
- `references/python.md` or `references/typescript.md`: for those stacks.
- `references/other-stacks.md`: for anything else. It covers how to find the conventions and has short notes on Go and Rust.

### 3. In an existing repo, the repo's conventions beat community defaults

A new module that follows community best practice but looks different from its neighbours is, to the team that owns the repo, a mistake. Consistency inside a codebase matters more than consistency with the wider world. The community defaults in the references only fill the gaps where the repo has no precedent.

Do the following:

- **Find the nearest sibling**, an existing module of the same kind as the new one, and mirror its shape. Check how files and folders are cased, where tests live (alongside the code, in `__tests__/`, or in a top-level `tests/`), whether there are `index.ts` or `__init__.py` files and what they export, and where types, fixtures and config sit.
- **Read the config that encodes conventions**: `.editorconfig`, ESLint filename rules, `tsconfig.json` path aliases, `[tool.*]` sections in `pyproject.toml`, and `CONTRIBUTING.md` if present.
- **Register the new module** wherever its siblings are registered (a parent `index.ts`, an `__init__.py`, a workspace list, a router), and only there.
- **If the repo is inconsistent**, follow the majority in the nearest directory and mention the inconsistency in one line.

**In a large repo, if you can spawn subagents**, hand this survey to one read-only subagent so file listings don't crowd your context. Ask it to return, with an example path for each finding:

- folder and file casing;
- where tests are placed;
- what barrel or `__init__` files export;
- where siblings are registered.

Spot-check one of its examples yourself, then write every file yourself so the names stay consistent. In a small repo, or where subagents aren't available, just look directly.

### 4. Prefer the framework's own generator

When the request maps onto a framework with an official generator (`npm create vite`, `create-next-app`, `django-admin startproject`, `cargo new`, `go mod init`, `uv init`), use it. Framework maintainers update their generators along with their defaults, while a hand-written skeleton slowly goes stale. Propose running it, then apply the naming conventions to whatever you add on top.

Generators usually need network access. If they can't run here, hand-scaffold to match what the generator would produce, and say that's what you did.

### 5. Propose before writing

Show the planned tree in a code block. Add a one-line note on anything non-obvious, and list the names you derived. Then wait for a go-ahead.

This step earns its place because moving and renaming files after they exist is more work than adjusting a plan, and in an existing repo the user knows conventions you may have missed. If the user has already said to go ahead without checking, skip the wait.

### 6. Create

- **Never overwrite an existing file.** If a planned path already exists, stop and tell the user rather than replacing it.
- **Use the chosen name consistently** in the directory, the manifest (`pyproject.toml`, `package.json`) and the README title.
- **Starter contents are minimal but working**: one trivial passing test, a manifest containing only the settings that matter, and a README with the project's purpose and how to install, run and test it.
- **Don't invent choices that belong to the user.** That includes a license (it's a legal decision; mention that one is missing instead), author names (use `git config user.name` if it's set, otherwise leave them out), and dependencies beyond what the stack strictly needs.

### 7. Verify

Run the bundled checker on what you created. It lives at `scripts/check_layout.py` in this skill's folder.

```bash
python <skill-folder>/scripts/check_layout.py <path> --project   # new project
python <skill-folder>/scripts/check_layout.py <path>             # new module
```

Fix every error. Warnings flag things that are usually wrong but sometimes deliberate, such as a camelCase folder that matches its siblings. Fix the accidental ones, and leave the deliberate ones alone.

If the stack's tooling is already available, a quick smoke run is worth doing (`python -m pytest`, `npx tsc --noEmit`). Don't install a pile of dependencies just for this.

### 8. Report

Keep it short:

- the tree as created;
- any names you normalized;
- anything you left for the user, such as choosing a license, `git init`, or the install command.

The user can open the files themselves, so don't walk through each one.

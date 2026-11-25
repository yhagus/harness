# yhagus's Harness

My [Claude Code](https://docs.claude.com/en/docs/claude-code) setup: [Agent Skills](https://agentskills.io/home), subagents, hooks, global `CLAUDE.md` and settings. It holds the skills I wrote, plus a list of the third-party skills I use, so one script can restore everything on a new machine.

> [!IMPORTANT]
> This repo is tuned to my own workflow: Conventional Commits, NestJS / Nuxt / Vue / React work, and the [rtk](https://github.com/rtk-ai/rtk) output filter. Take what fits, but read a skill or agent before relying on it.

## Installation

### Full Setup

Restores skills, agents, hooks, `CLAUDE.md` and settings into `~/.claude`. Requires `node`, `npx`, `jq` and `git`.

```bash
git clone git@github.com:yhagus/harness.git ~/harness
cd ~/harness && ./install.sh
```

The script:

1. Installs the third-party skills from [`skills.json`](skills.json) with the [skills](https://github.com/vercel-labs/skills) CLI.
2. Installs the skills in [`skills/`](skills).
3. Copies [`agents/`](agents) and [`hooks/`](hooks) into `~/.claude/`.
4. Copies `CLAUDE.md`, `RTK.md`, `statusline.sh` and `keybindings.json` from [`claude/`](claude).
5. Merges [`claude/settings.json`](claude/settings.json) into `~/.claude/settings.json`. Repo values win, other keys stay, and hooks and permissions are merged without duplicates.

Before replacing a file, the script backs it up to `~/.claude/backups/harness-<timestamp>/`. Pass `--skip-skills` to skip steps 1 and 2.

### Skills Only

To install only the skills in this repo, use the [skills](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add yhagus/harness --skill='*'
```

or to install all of them globally:

```bash
npx skills add yhagus/harness --skill='*' -g
```

## Skills

### My Skills

Written or adapted by me. They live in [`skills/`](skills).

| Skill | Description |
|-------|-------------|
| [clean-tests](skills/clean-tests) | Find tautological, duplicate and flaky low-value tests, show a plan, then remove or replace them after approval |
| [delete-comment](skills/delete-comment) | Classify every code comment, delete the noise, move decisions into ADRs, then ban comments with a ratcheted lint rule |
| [scaffold](skills/scaffold) | Scaffold a project or module with a layout and names that follow the stack's community conventions |
| [ts-readability-standards](skills/ts-readability-standards) | TypeScript, readability and test-discipline standards for NestJS and React codebases, preloaded by the implementers |
| [webmcp-regression](skills/webmcp-regression) | Write a frontend regression suite for one feature on WebMCP tools, and sort every mismatch into frontend or API |
| [impeccable](skills/impeccable) | Design, critique, audit and polish frontend interfaces, and capture design systems (adapted from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)) |
| [context7-mcp](skills/context7-mcp) | Fetch current library and framework docs through the Context7 MCP server (adapted from [upstash/context7](https://github.com/upstash/context7)) |

### Third-party Skills

Installed from their own repos by `install.sh`, which reads [`skills.json`](skills.json). They are not copied here.

| Source | Skills |
|--------|--------|
| [mattpocock/skills](https://github.com/mattpocock/skills) | ask-matt, code-review, codebase-design, diagnosing-bugs, domain-modeling, grill-me, grill-with-docs, grilling, handoff, implement, implement-spec, improve-codebase-architecture, pr, prototype, research, retro, setup-matt-pocock-skills, tdd, teach, to-questionnaire, to-spec, to-tickets, triage, wait-what, wayfinder, wizard, writing-for-agents |
| [antfu/skills](https://github.com/antfu/skills) | nuxt, vue |
| [blader/humanizer](https://github.com/blader/humanizer) | humanizer |
| [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | security-audit |
| [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) | asd-ste100 |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | find-skills |

## Agents

Subagents in [`agents/`](agents), copied to `~/.claude/agents/`.

| Agent | Description |
|-------|-------------|
| [nest-implementer](agents/development/nest-implementer.md) | Builds one backend ticket in a NestJS app |
| [nuxt-implementer](agents/development/nuxt-implementer.md) | Builds one ticket in a Nuxt app |
| [vue-implementer](agents/development/vue-implementer.md) | Builds one ticket in a plain Vue 3 app (not Nuxt) |
| [react-implementer](agents/development/react-implementer.md) | Builds one frontend ticket in a React app |
| [node-implementer](agents/development/node-implementer.md) | Fallback implementer for libraries, CLIs, scripts and workers |
| [verifier](agents/quality-assurance/verifier.md) | Writes and runs tests, and checks an implementation against its ticket |
| [Explore](agents/Explore.md) | Read-only code search on Haiku that returns `file:line` pointers |
| [pr-writer](agents/pr-writer.md) | Writes the title and body of a pull or merge request on any git platform |
| [release-writer](agents/release-writer.md) | Writes the changelog section for a release |
| [impeccable-*](agents) | Four helpers for the impeccable skill: asset producer, documenter, finish reviewer, manual edit applier |

## Hooks

| Hook | Wired in | What it does |
|------|----------|--------------|
| [block-no-verify.mjs](hooks/block-no-verify.mjs) | `settings.json`, PreToolUse on Bash | Blocks `git commit`, `merge` and `push` when they skip git hooks with `--no-verify` |
| [guard-implementer-scope.mjs](hooks/guard-implementer-scope.mjs) | Implementer agent frontmatter | Blocks an implementer from writing outside its own app, such as nest-implementer editing a Nuxt app |
| `rtk hook claude` | `settings.json`, PreToolUse on Bash | Condenses command output. Needs the `rtk` binary |

## FAQ

### How Do I Update the Repo After Changing My Setup?

```bash
./scripts/export.sh && git add -A && git commit -m "chore: sync claude setup" && git push
```

[`scripts/export.sh`](scripts/export.sh) copies the real skill folders from `~/.claude/skills` (symlinked ones belong to other installers), plus agents, hooks, `CLAUDE.md`, and the portable parts of `settings.json`. It also rebuilds `skills.json` from `~/.agents/.skill-lock.json`.

### What Is Not Included?

- Orca hooks: the Orca app installs them itself, so `export.sh` drops them.
- Bailian skills (`bl skill init`) and `cua-driver`: each has its own installer.
- The `pluno-webmcp-for-anything` plugin: install it from `/plugin`.
- Claude's managed `synced` skills: they sync from your account.

# harness

My Claude Code setup: skills, subagents, hooks, global `CLAUDE.md` and settings.

## Install on a new machine

Requires `node`, `npx`, `jq` and `git`. The `rtk` binary is needed for the `rtk hook claude` hook.

```bash
git clone git@github.com:yhagus/harness.git ~/harness
cd ~/harness && ./install.sh
```

What it does:

1. Installs third-party skills listed in `skills.json` with `npx skills add <repo> -g -a claude-code`.
2. Installs my own skills from `skills/` the same way.
3. Copies `agents/` and `hooks/` into `~/.claude/`.
4. Copies `CLAUDE.md`, `RTK.md`, `statusline.sh` and `keybindings.json` into `~/.claude/`.
5. Merges `claude/settings.json` into `~/.claude/settings.json`: repo values win, other keys stay, hooks and permissions are merged without duplicates.

Every file it replaces is backed up first to `~/.claude/backups/harness-<timestamp>/`.
Run `./install.sh --skip-skills` to skip steps 1 and 2.

Only my own skills: `npx skills add yhagus/harness -g`.

## Update the repo from this machine

```bash
./scripts/export.sh && git add -A && git commit -m "chore: sync claude setup" && git push
```

`export.sh` copies the real skill folders from `~/.claude/skills` (symlinks belong to other installers), plus agents, hooks, `CLAUDE.md` and a portable subset of `settings.json`. It drops Orca hooks, because the Orca app installs those itself. It also rebuilds `skills.json` from `~/.agents/.skill-lock.json`.

## Layout

| Path | Contents |
| --- | --- |
| `skills/` | Skills I wrote or edited |
| `skills.json` | Third-party skills, grouped by source repo |
| `agents/` | Subagents (`development/` implementers, `quality-assurance/verifier`, writers, Explore) |
| `hooks/` | Hook scripts: `block-no-verify.mjs` (global), `guard-implementer-scope.mjs` (in implementer frontmatter) |
| `claude/` | `CLAUDE.md`, `RTK.md`, `settings.json`, `statusline.sh`, `keybindings.json` |

## Not included

- Bailian skills (`bl skill init`) and `cua-driver`: their own installers set them up.
- The `pluno-webmcp-for-anything` plugin: install it from `/plugin`.
- Claude's managed `synced` skills: they sync from your account.

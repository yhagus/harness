# v1.0.0

#### Notable changes

**Upgrade**
* First release, nothing to upgrade from. To install, clone the repo and run `./install.sh`. It needs `node`, `npx` and `jq` on the PATH, and warns when `rtk` is missing (the `rtk hook claude` PreToolUse hook fails until it is installed) – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)
* `install.sh` writes into `~/.claude` (override with `CLAUDE_HOME`). It backs up replaced files to `~/.claude/backups/harness-<timestamp>`, overwrites same-name agents and hooks, replaces `CLAUDE.md`, `RTK.md`, `statusline.sh` and `keybindings.json`, and merges `settings.json`: repo values win, existing keys are kept, and `permissions.allow` and hook lists are merged without duplicates – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)

**Installer and export**
* `install.sh` restores the whole setup on a new machine: third-party skills from `skills.json`, the repo's own skills, agents, hooks, global instructions, status line, keybindings and settings. Pass `--skip-skills` to copy only agents, hooks, `CLAUDE.md` and settings – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)
* `scripts/export.sh` snapshots `~/.claude` back into the repo (own skills, agents, hooks, config files, a portable subset of `settings.json` without Orca hooks, and `skills.json` from the skill lock file). It needs `jq` – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)

**Skills**
* Own skills: `clean-tests`, `context7-mcp`, `delete-comment`, `impeccable`, `scaffold`, `ts-readability-standards` and `webmcp-regression` – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)
* `skills.json` lists the third-party skills to install, from `antfu/skills`, `blader/humanizer`, `cloudflare/security-audit-skill`, `danyuchn/asd-ste100-skill`, `mattpocock/skills` and `vercel-labs/skills` – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)

**Agents and hooks**
* Subagents: `Explore`, `pr-writer`, `release-writer`, the stack implementers (`nest`, `node`, `nuxt`, `react`, `vue`), the `verifier`, and the four `impeccable-*` helpers – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)
* Hooks: `block-no-verify.mjs` (registered as a PreToolUse hook in the portable settings) and `guard-implementer-scope.mjs` – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)

**Global configuration**
* Global `CLAUDE.md` and `RTK.md`, a status line script, keybindings, and a portable `settings.json` (model, per-model effort levels, env, attribution, status line, rtk read-only permissions, PreToolUse hooks) – [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3)

**Documentation**
* The README explains installation and lists the skills, agents and hooks in tables; the title and intro paragraph were then removed so it opens with the note on the repo's workflow focus – [fd5bb45](https://github.com/yhagus/harness/commit/fd5bb4509f7b7a72de3e2d0ef1f43d5bbab64667), [cda93bd](https://github.com/yhagus/harness/commit/cda93bd98d7f71822117bca3d689e2d327c2708e)

#### Features
* `general`
  * [68fa388](https://github.com/yhagus/harness/commit/68fa38810ecdd7eacfab99c021f746e9c3c54cb3) feat: add claude code skills, agents, hooks and installer

#### Docs
* `general`
  * [cda93bd](https://github.com/yhagus/harness/commit/cda93bd98d7f71822117bca3d689e2d327c2708e) docs: drop readme title and intro
  * [fd5bb45](https://github.com/yhagus/harness/commit/fd5bb4509f7b7a72de3e2d0ef1f43d5bbab64667) docs: restructure readme with skill, agent and hook tables

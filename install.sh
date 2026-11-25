#!/usr/bin/env bash
# Restore the Claude Code setup in this repo onto a new machine.
#   git clone git@github.com:yhagus/harness.git && cd harness && ./install.sh
# Options: --skip-skills  only copy agents, hooks, CLAUDE.md and settings
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
CLAUDE="${CLAUDE_HOME:-$HOME/.claude}"
BACKUP="$CLAUDE/backups/harness-$(date +%Y%m%d-%H%M%S)"
SKIP_SKILLS=0
[ "${1:-}" = "--skip-skills" ] && SKIP_SKILLS=1

for cmd in node npx jq; do
  command -v "$cmd" >/dev/null || { echo "Missing required command: $cmd" >&2; exit 1; }
done
command -v rtk >/dev/null || echo "warning: rtk is not installed; the 'rtk hook claude' PreToolUse hook will fail until it is."

mkdir -p "$CLAUDE"

backup() {  # back up an existing file or directory before replacing it
  [ -e "$1" ] || return 0
  mkdir -p "$BACKUP"
  cp -R "$1" "$BACKUP/"
}

# 1. Skills
if [ "$SKIP_SKILLS" -eq 0 ]; then
  echo "==> Third-party skills (skills.json)"
  jq -c '.skills[]' "$REPO/skills.json" | while read -r entry; do
    source="$(jq -r '.source' <<<"$entry")"
    names=()
    while IFS= read -r name; do names+=("$name"); done < <(jq -r '.skills[]' <<<"$entry")
    echo "  $source: ${names[*]}"
    npx -y skills add "$source" -g -a claude-code -y --skill "${names[@]}"
  done

  echo "==> Own skills (skills/)"
  npx -y skills add "$REPO" -g -a claude-code -y --skill '*'
fi

# 2. Agents and hooks (merged into the existing folders; same-name files are overwritten)
echo "==> Agents and hooks"
for dir in agents hooks; do
  backup "$CLAUDE/$dir"
  mkdir -p "$CLAUDE/$dir"
  cp -R "$REPO/$dir/." "$CLAUDE/$dir/"
done

# 3. Global instructions, status line, keybindings
echo "==> CLAUDE.md, RTK.md, statusline, keybindings"
for f in CLAUDE.md RTK.md statusline.sh keybindings.json; do
  [ -f "$REPO/claude/$f" ] || continue
  backup "$CLAUDE/$f"
  cp "$REPO/claude/$f" "$CLAUDE/$f"
done
chmod +x "$CLAUDE/statusline.sh" 2>/dev/null || true

# 4. settings.json: repo values win, existing keys are kept, hook lists are merged without duplicates
echo "==> settings.json"
if [ -f "$CLAUDE/settings.json" ]; then
  backup "$CLAUDE/settings.json"
  jq -s '
    .[0] as $old | .[1] as $new
    | ($old * ($new | del(.hooks)))
    | .permissions.allow = ((($old.permissions.allow // []) + ($new.permissions.allow // [])) | unique)
    | .hooks = reduce (($new.hooks // {}) | to_entries[]) as $e
        ($old.hooks // {}; .[$e.key] = (((.[$e.key] // []) + $e.value) | unique))
  ' "$CLAUDE/settings.json" "$REPO/claude/settings.json" > "$CLAUDE/settings.json.tmp"
  mv "$CLAUDE/settings.json.tmp" "$CLAUDE/settings.json"
else
  cp "$REPO/claude/settings.json" "$CLAUDE/settings.json"
fi

[ -d "$BACKUP" ] && echo "Backed up replaced files to $BACKUP"
echo "Done. Restart Claude Code to load the new setup."

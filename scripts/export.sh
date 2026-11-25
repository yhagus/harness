#!/usr/bin/env bash
# Snapshot this machine's ~/.claude setup into the repo.
# Run it after changing skills, agents, hooks or CLAUDE.md, then commit.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE="${CLAUDE_HOME:-$HOME/.claude}"
LOCK="$HOME/.agents/.skill-lock.json"

command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

# Own skills: real directories in ~/.claude/skills (symlinks are installed by other tools).
# `synced` is Claude's managed cloud-skill cache and `.trash` is deleted skills, so both are skipped.
rm -rf "$REPO/skills" && mkdir -p "$REPO/skills"
for dir in "$CLAUDE"/skills/*/; do
  name="$(basename "$dir")"
  [ -L "${dir%/}" ] && continue
  case "$name" in synced|.trash) continue ;; esac
  cp -R "${dir%/}" "$REPO/skills/$name"
done

rm -rf "$REPO/agents" "$REPO/hooks"
cp -R "$CLAUDE/agents" "$REPO/agents"
cp -R "$CLAUDE/hooks" "$REPO/hooks"

mkdir -p "$REPO/claude"
for f in CLAUDE.md RTK.md statusline.sh keybindings.json; do
  [ -f "$CLAUDE/$f" ] && cp "$CLAUDE/$f" "$REPO/claude/$f"
done

# Portable subset of settings.json. Orca hooks are dropped: the Orca app installs them itself.
jq '{
  model, modelSettings, env, attribution, includeCoAuthoredBy, statusLine, permissions,
  hooks: (.hooks // {}
    | map_values(map(.hooks |= map(select((.command // "") | test("ORCA_|\\.orca/") | not)))
                 | map(select(.hooks | length > 0)))
    | with_entries(select(.value | length > 0)))
} | with_entries(select(.value != null))' "$CLAUDE/settings.json" > "$REPO/claude/settings.json"

# Third-party skills installed with `npx skills add`, grouped by source repo.
if [ -f "$LOCK" ]; then
  jq '{skills: ([.skills | to_entries[] | {source: .value.source, name: .key}]
       | group_by(.source) | map({source: .[0].source, skills: (map(.name) | sort)}))}' \
    "$LOCK" > "$REPO/skills.json"
fi

find "$REPO" -name .DS_Store -delete
echo "Exported to $REPO"

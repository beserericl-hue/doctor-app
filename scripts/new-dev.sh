#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
chmod +x scripts/setup.sh
./scripts/setup.sh

echo ""
echo "Installing skills globally into ~/.claude/skills/..."
mkdir -p ~/.claude/skills
for SKILL in react-native-expo android-sdk ios-xcode eas-build-deploy mobile-testing healthcare-ui-accessibility; do
  SRC=".claude/skills/$SKILL/SKILL.md"
  DEST="$HOME/.claude/skills/$SKILL"
  if [ -f "$SRC" ]; then
    mkdir -p "$DEST"
    cp "$SRC" "$DEST/SKILL.md"
    echo "  installed $SKILL globally"
  fi
done
echo ""
echo "All done! Run: claude"

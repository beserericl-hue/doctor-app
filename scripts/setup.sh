#!/usr/bin/env bash
set -e
echo ""
echo "DoctorApp — Dev Environment Setup"
echo "==================================="
echo ""

NODE_VERSION=$(node --version 2>/dev/null | cut -dv -f2 | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required. Install from https://nodejs.org"
  exit 1
fi
echo "  ok Node.js $(node --version)"
echo "  ok npm $(npm --version)"

cd "$(dirname "$0")/../app"
npm install
echo "  ok Dependencies installed"

echo ""
echo "Verifying Claude Code skills..."
for SKILL in react-native-expo android-sdk ios-xcode eas-build-deploy mobile-testing healthcare-ui-accessibility; do
  if [ -f "../.claude/skills/$SKILL/SKILL.md" ]; then
    echo "  ok $SKILL"
  else
    echo "  MISSING $SKILL"
  fi
done

echo ""
echo "Setup complete!"
echo "  cd app && npx expo start"
echo ""

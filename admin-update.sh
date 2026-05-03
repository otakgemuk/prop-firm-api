#!/bin/bash
# admin-update.sh
# 
# Usage: ./admin-update.sh /path/to/exported/plans.json "Update message"
#
# This script takes the JSON exported from the admin page and commits it to GitHub

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-plans.json> [commit-message]"
  echo "Example: $0 ~/Downloads/plans.json 'Update Funded Futures Network pricing'"
  exit 1
fi

EXPORT_FILE="$1"
COMMIT_MSG="${2:-data: update pricing from admin panel}"

if [ ! -f "$EXPORT_FILE" ]; then
  echo "❌ File not found: $EXPORT_FILE"
  exit 1
fi

# Copy the exported file to the repo
cp "$EXPORT_FILE" data/plans.json
cp "$EXPORT_FILE" frontend/data.json
cp "$EXPORT_FILE" frontend/dist/plans.json

# Regenerate staticData.ts
node -e "
  const data = require('./data/plans.json');
  const ts = '// Auto-generated from data/plans.json\n\n' +
    'export const STATIC_PLANS = ' + JSON.stringify(data, null, 2) + ';\n';
  require('fs').writeFileSync('./frontend/src/lib/staticData.ts', ts);
"

# Commit and push
git config user.name "Admin Update"
git config user.email "admin@mightyox.dev"
git add data/plans.json frontend/data.json frontend/src/lib/staticData.ts
git commit -m "$COMMIT_MSG"
git push origin main

echo "✅ Changes pushed to GitHub!"
echo "🚀 Site will update in 1-2 minutes at https://otakgemuk.github.io/prop-firm-api/"

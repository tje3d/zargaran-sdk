#!/bin/bash
set -e

echo "=== 🚀 Publishing zargaran-apiclient to npm ==="

echo ""
echo "📦 Step 1: Installing dependencies..."
bun install

echo ""
echo "🔨 Step 2: Building package..."
bun run build

echo ""
echo "🧪 Step 3: Running tests..."
bun test

echo ""
echo "📋 Step 4: Dry run to verify package contents..."
npm pack --dry-run

echo ""
echo "🔐 Step 5: Checking npm login status..."
whoami=$(npm whoami 2>/dev/null || echo "")
if [ -z "$whoami" ]; then
  echo "❌ Not logged in to npm. Run 'npm login' first."
  exit 1
fi
echo "✅ Logged in as: $whoami"

echo ""
read -p "🚀 Ready to publish! Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Publish cancelled."
  exit 1
fi

echo ""
echo "📤 Publishing to npm..."
npm publish --access public

echo ""
echo "✅ Published successfully!"
echo "🔗 View at: https://www.npmjs.com/package/zargaran-apiclient"

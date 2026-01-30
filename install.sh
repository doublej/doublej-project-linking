#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/jurrejan/doublej-project-linking.git"

echo "==> Cloning repository..."
git clone "$REPO" doublej-project-linking
cd doublej-project-linking

echo "==> Installing dependencies..."
bun install

echo "==> Creating profile directories..."
mkdir -p profiles/profiles profiles/rules

cat <<'EOF'

========================================
  Setup complete!
========================================

Development mode (with live API):
  bun run dev
  Open http://localhost:5173 to manage profiles and rules.

Static build (for GitHub Pages / any static host):
  bun run build:static
  This generates:
    dist/widget.js            — embeddable widget
    dist/widget-manifest.json — static config manifest

Embed on any page:
  <script src="https://YOUR-HOST/widget.js"></script>

The widget tries the API first, then falls back to the static manifest.

EOF

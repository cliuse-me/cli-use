#!/bin/bash

# Uninstall script for cli-use (@cli-use/tui)

echo "🗑️  Uninstalling @cli-use/tui..."

# 1. Uninstall the global package
npm uninstall -g @cli-use/tui

# 2. Force clean the cache (optional but recommended for dev testing)
npm cache clean --force

echo "✅ Uninstallation complete."
echo "   You can verify by running: npm list -g @cli-use/tui"

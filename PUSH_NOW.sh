#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           🚀 PUSH TO GITHUB - READY TO EXECUTE 🚀            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Repository: https://github.com/zodiesel21011-cmd/calendarinbox"
echo "Branch: main"
echo ""
echo "📦 What will be pushed:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git log --oneline -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to push? Running: git push -u origin main"
echo ""

# Uncomment the line below to auto-push
# git push -u origin main

echo "⚠️  To push, run this command manually:"
echo ""
echo "    git push -u origin main"
echo ""
echo "Or uncomment the push line in this script and run again."
echo ""


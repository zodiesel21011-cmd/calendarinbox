#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🚀 FORCE PUSH TO GITHUB - REPLACE WITH WORKING CODE 🚀    ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  WARNING: This will REPLACE all files on GitHub with the"
echo "    verified working code from this repository."
echo ""
echo "Repository: https://github.com/zodiesel21011-cmd/calendarinbox"
echo "Branch: main"
echo ""
echo "What will happen:"
echo "  1. Delete all old files from GitHub"
echo "  2. Push fresh, verified working code"
echo "  3. Clean commit history"
echo ""
read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "🚀 Pushing to GitHub..."
    echo ""
    git push -u origin main --force
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SUCCESS! Your verified code is now on GitHub!"
        echo ""
        echo "View it: https://github.com/zodiesel21011-cmd/calendarinbox"
        echo ""
    else
        echo ""
        echo "❌ Push failed. Check your GitHub token and try again."
        echo ""
    fi
else
    echo ""
    echo "❌ Cancelled. No changes made."
    echo ""
fi


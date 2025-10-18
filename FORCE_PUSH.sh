#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     ⚠️  FORCE PUSH - REPLACE ALL GITHUB FILES ⚠️            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This will:"
echo "  1. Delete all current files in GitHub repository"
echo "  2. Push verified working code from this folder"
echo "  3. Replace everything with clean code"
echo ""
echo "Repository: https://github.com/zodiesel21011-cmd/calendarinbox"
echo "Branch: main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What will be pushed:"
echo ""
git log --oneline -5
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Executing force push..."
echo ""

# Force push to main branch
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║              ✅ SUCCESS - CODE PUSHED TO GITHUB ✅           ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "View on GitHub:"
    echo "https://github.com/zodiesel21011-cmd/calendarinbox"
    echo ""
    echo "Next step: Deploy to Vercel"
    echo "https://vercel.com/new"
    echo ""
else
    echo ""
    echo "❌ Push failed. Check your credentials."
    echo ""
    echo "Make sure you're using:"
    echo "  Username: your_github_username"
    echo "  Password: your_personal_access_token"
    echo ""
    echo "Get token: https://github.com/settings/tokens"
    echo ""
fi

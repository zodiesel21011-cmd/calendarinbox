# 🚀 Deploy AI Mail Pro to Vercel

## Method 1: GitHub → Vercel (Recommended)

### Step 1: Push to GitHub

From the `aimail-pro` folder:

```bash
git push -u origin main
```

**Need Help?**
- Use GitHub Personal Access Token as password
- Get token: https://github.com/settings/tokens
- Or use GitHub Desktop: https://desktop.github.com/

---

### Step 2: Deploy to Vercel

1. **Go to Vercel**  
   👉 https://vercel.com/new

2. **Import Repository**
   - Click "Import Git Repository"
   - Select: `zodiesel21011-cmd/calendarinbox`
   - Click "Import"

3. **Configure Build**
   ```
   Framework Preset: Vite
   Root Directory: aimail-pro (if needed)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Deploy!**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Done! ✅

Your app will be live at: `https://your-project.vercel.app`

---

## Method 2: Vercel CLI (Fast Deploy)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy from folder

```bash
cd aimail-pro
vercel
```

Follow prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your username
- **Link to existing project?** → No
- **Project name?** → aimail-pro (or your choice)
- **Directory?** → ./
- **Override settings?** → No

Then:

```bash
vercel --prod
```

**Done!** Your app is live! 🎉

---

## Method 3: Upload Folder to Vercel

1. **Download Source Code**
   - Extract `aimail-pro-complete.tar.gz`

2. **Go to Vercel**
   👉 https://vercel.com/new

3. **Drag & Drop**
   - Drag the `aimail-pro` folder into Vercel
   - Wait for upload
   - Vercel will auto-detect Vite
   - Click "Deploy"

**Done!** 🚀

---

## ⚙️ Vercel Configuration

The `vercel.json` file is already configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 🔧 Environment Variables (Optional)

If you connect real APIs later:

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_OPENAI_API_KEY=your_key_here
VITE_MICROSOFT_CLIENT_ID=your_client_id
VITE_GOOGLE_CLIENT_ID=your_client_id
```

---

## ✅ After Deployment

Your app will be available at:
```
https://your-project-name.vercel.app
```

### Features Working:
✅ Email inbox with AI analysis
✅ Full calendar views
✅ Meeting detection
✅ Auto-scheduling
✅ Teams integration UI
✅ All demo data

### To Connect Real APIs:
Update service files in `src/services/` with real API keys

---

## 🆘 Troubleshooting

### Build Fails?

Check:
1. `package.json` has all dependencies
2. No TypeScript errors: `npm run build` locally
3. Node version: Use Node 18+ (set in Vercel settings)

### Blank Page?

Check:
1. Vercel build logs for errors
2. Browser console for JavaScript errors
3. Ensure base path is correct in `vite.config.ts`

### Need Help?

- Vercel Docs: https://vercel.com/docs
- Check deployment logs in Vercel dashboard
- Vercel support: https://vercel.com/support

---

## 🎯 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Import from GitHub:** https://vercel.com/new
- **Vercel CLI Docs:** https://vercel.com/docs/cli
- **GitHub Repo:** https://github.com/zodiesel21011-cmd/calendarinbox

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live production URL
- ✅ Automatic deployments from GitHub
- ✅ SSL certificate (HTTPS)
- ✅ Global CDN
- ✅ Preview deployments for branches

Share your live URL with anyone! 🚀

---

**Built with ❤️ • Deployed on Vercel • Ready for production**

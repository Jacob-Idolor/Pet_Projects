# 🚀 CI/CD Pipeline Setup Guide

## Overview
This project has automated CI/CD pipelines for fast deployment and testing.

---

## 🎯 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run tests
npm test

# Validate code syntax
npm run validate
```

---

## ☁️ Deployment Options

### Option 1: GitHub Pages (Free, Automatic)

**Setup:**
1. Push code to GitHub
2. Go to repository Settings → Pages
3. Source: GitHub Actions
4. Done! Auto-deploys on every push to main

**URL:** `https://yourusername.github.io/gto-poker-trainer/`

---

### Option 2: Netlify (Free, Fast)

**Setup:**
1. Sign up at [netlify.com](https://netlify.com)
2. Get your auth token: Account → Applications → Personal access tokens
3. Add secrets to GitHub:
   - `NETLIFY_AUTH_TOKEN` - Your token
   - `NETLIFY_SITE_ID` - Your site ID
4. Push to main branch → auto-deploys!

**Alternative - Manual Deploy:**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**URL:** `https://your-site-name.netlify.app`

---

### Option 3: Vercel (Free, Very Fast)

**Setup:**
1. Sign up at [vercel.com](https://vercel.com)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```
3. For automated deploys, add GitHub secrets:
   - `VERCEL_TOKEN` - Your token
   - `VERCEL_ORG_ID` - Organization ID
   - `VERCEL_PROJECT_ID` - Project ID

**URL:** `https://your-project.vercel.app`

---

## 🔧 GitHub Actions Secrets Setup

Go to: Repository → Settings → Secrets and variables → Actions

Add these secrets based on which service you're using:

### For Netlify:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### For Vercel:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 📋 CI/CD Pipeline Features

### Automated Testing ✅
- HTML validation
- JavaScript syntax checking
- Local server smoke test
- File structure validation
- GTO data validation

### Automated Deployment 🚀
- Deploys on every push to main
- Multiple deployment targets (Pages, Netlify, Vercel)
- Pull request previews (Netlify/Vercel)
- Rollback capabilities

### Performance ⚡
- CDN distribution
- Automatic caching
- HTTPS by default
- Global edge network

---

## 🔄 Workflow

```
1. Make changes locally
2. Test: npm run dev
3. Validate: npm run validate
4. Commit and push
5. GitHub Actions runs tests
6. Auto-deploys to production
7. Live in ~1 minute!
```

---

## 📊 Pipeline Status

Check pipeline status:
- GitHub: Actions tab
- Netlify: Site deploys dashboard
- Vercel: Deployments page

---

## 🛠️ Customization

### Add Custom Tests
Edit `test-runner.js`:
```javascript
test('Your test name', () => {
    // Your test code
    assertTrue(condition, 'Error message');
});
```

### Change Deployment Trigger
Edit `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ your-branch ]
```

### Add Environment Variables
In Netlify/Vercel dashboard:
- Settings → Environment Variables
- Add your variables

---

## 🚨 Troubleshooting

### Build Fails
1. Check GitHub Actions logs
2. Run `npm run validate` locally
3. Fix errors and push again

### Deployment Fails
1. Verify secrets are set correctly
2. Check service status (status.netlify.com, vercel-status.com)
3. Review deployment logs

### Tests Fail
1. Run `npm test` locally
2. Fix issues
3. Commit and push

---

## 📈 Performance Monitoring

### Built-in Analytics:
- **Netlify Analytics**: Settings → Analytics
- **Vercel Analytics**: Dashboard → Analytics
- **GitHub Insights**: Repository → Insights

---

## 🔐 Security Features

- Automatic HTTPS
- Security headers configured
- XSS protection
- Content-Type protection
- Frame protection

---

## 💡 Best Practices

1. **Test Locally First**: Always run `npm run dev` before pushing
2. **Small Commits**: Make small, focused changes
3. **Pull Before Push**: Keep your local branch updated
4. **Check Status**: Monitor deployment status after pushing
5. **Use Branches**: Create feature branches for major changes

---

## 🎉 Quick Deploy Commands

```bash
# One-time setup
npm install -g netlify-cli vercel
netlify login
vercel login

# Deploy to Netlify
netlify deploy --prod

# Deploy to Vercel
vercel --prod

# Or just push to GitHub
git add .
git commit -m "Update"
git push origin main
# Pipeline handles the rest!
```

---

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages Docs](https://pages.github.com)

---

**Your site will be live and automatically updated on every push!** 🚀

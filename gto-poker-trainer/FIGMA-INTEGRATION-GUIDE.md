# 🎨 Figma Design Integration Guide

## Overview
This guide shows you how to import designs from Figma and update the GTO Poker Trainer's look and feel.

---

## 📥 Method 1: Export Figma Styles (Recommended)

### Step 1: Export Design Tokens from Figma

#### Using Figma Tokens Plugin:
1. Install **"Design Tokens"** or **"Figma Tokens"** plugin in Figma
2. Select your design file
3. Go to Plugins → Design Tokens → Export
4. Choose **CSS Variables** format
5. Copy the exported CSS

#### Manual Export from Figma:
1. Select all colors in your design
2. Right-click → Copy as CSS
3. Paste into `design-tokens.css`

### Step 2: Update Design Tokens File

Open `design-tokens.css` and replace the color values:

```css
:root {
    /* Copy your Figma colors here */
    --primary-500: #YOUR_COLOR;
    --secondary-500: #YOUR_COLOR;
    --bg-primary: #YOUR_BG_COLOR;
    /* ... etc */
}
```

### Step 3: Link Design Tokens in HTML

Update `index.html` to load design tokens first:

```html
<head>
    <!-- Load design tokens FIRST -->
    <link rel="stylesheet" href="design-tokens.css">
    <link rel="stylesheet" href="styles.css">
</head>
```

---

## 🎨 Method 2: Export Figma Components as CSS

### Export Individual Components:

#### For Buttons:
1. In Figma, select your button component
2. Right-click → Copy as CSS
3. Paste into `components/buttons.css`

#### For Cards:
1. Select card design
2. Copy as CSS
3. Paste into `components/cards.css`

---

## 🖼️ Method 3: Export Images/Assets

### Export Icons and Graphics:

1. **Select elements** in Figma
2. **File → Export** (or use Ctrl+Shift+E)
3. Choose format:
   - **SVG** for icons (scalable)
   - **PNG 2x** for images (retina)
   - **WebP** for photos (smaller size)

4. Export to `assets/` folder:
   ```
   assets/
   ├── icons/
   │   ├── logo.svg
   │   ├── position-icons.svg
   │   └── action-buttons.svg
   ├── images/
   │   └── background.png
   └── cards/
       ├── card-back.png
       └── suits.svg
   ```

---

## 🔧 Method 4: Use Figma API (Advanced)

### Auto-sync Figma designs:

```javascript
// figma-sync.js
const FIGMA_TOKEN = 'YOUR_TOKEN';
const FILE_KEY = 'YOUR_FILE_KEY';

async function syncDesign() {
    const response = await fetch(
        `https://api.figma.com/v1/files/${FILE_KEY}/styles`,
        {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        }
    );
    
    const data = await response.json();
    // Convert to CSS variables
    generateCSS(data.meta.styles);
}
```

---

## 📝 Quick Style Updates

### Update Colors:
In `design-tokens.css`, find and replace:

```css
/* Primary Brand Color */
--primary-500: #00ff87;  /* Change this */

/* Background */
--bg-primary: #0a0e27;   /* Change this */

/* Text */
--text-primary: #ffffff; /* Change this */
```

All components will automatically update!

### Update Spacing:
```css
/* Change the base unit */
--spacing-2: 8px;  /* Change to 10px for more space */
```

### Update Border Radius:
```css
/* Make everything more rounded */
--radius-lg: 12px;  /* Change to 16px */
--radius-xl: 16px;  /* Change to 24px */
```

### Update Fonts:
```css
/* Change font family */
--font-primary: 'Your Font', -apple-system, sans-serif;

/* Change sizes */
--text-base: 16px;  /* Change to 18px */
```

---

## 🎯 Component-Specific Styling

### Buttons

Current location: `styles.css` around line 230

```css
.btn {
    /* Update using design tokens */
    height: var(--button-height-lg);
    border-radius: var(--radius-button);
    background: var(--gradient-primary);
    font-size: var(--text-base);
    padding: 0 var(--space-lg);
}
```

**To customize:**
1. Copy button design from Figma
2. Update the `.btn` class
3. Use design token variables

### Cards

Current location: `styles.css` around line 1100

```css
.card {
    width: var(--card-width-md);
    height: calc(var(--card-width-md) * var(--card-height-ratio));
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
}
```

### Position Cards

Current location: `styles.css` around line 630

```css
.position-card {
    background: var(--bg-elevated);
    border: 2px solid var(--border-default);
    border-radius: var(--radius-card);
    padding: var(--space-lg);
}
```

---

## 🎨 Complete Design Overhaul Steps

### 1. Prepare Figma File
- Organize layers by component type
- Use consistent naming (Button/Primary, Button/Secondary, etc.)
- Create a style guide page with all colors, fonts, spacing

### 2. Export Everything
```
Export from Figma:
├── Colors → design-tokens.css (--primary-*, --bg-*, etc.)
├── Typography → design-tokens.css (--font-*, --text-*)
├── Spacing → design-tokens.css (--space-*, --spacing-*)
├── Components → Copy as CSS → Paste into styles.css
└── Assets → Export as PNG/SVG → Save to assets/
```

### 3. Update HTML (if needed)
If you change component structure, update `index.html`:
```html
<!-- Example: New button structure -->
<button class="btn btn-primary btn-lg">
    <span class="btn-icon">🎮</span>
    <span class="btn-text">Start Game</span>
</button>
```

### 4. Test Responsive Design
Open DevTools (F12) and test:
- Mobile: 375px width
- Tablet: 768px width  
- Desktop: 1440px width
- Large: 1920px width

### 5. Deploy
```bash
# Test locally
start index.html

# Deploy to web
# (Copy all files to your web host)
```

---

## 🔍 Finding What to Change

### To change a specific element:

1. **Open browser DevTools** (F12)
2. **Click Inspector** (top-left icon)
3. **Click the element** you want to change
4. **See the CSS rules** in the Styles panel
5. **Find the file and line number**
6. **Edit that file**

Example:
```
If you see:
  styles.css:450
  .btn-primary {
    background: var(--primary-500);
  }

Then edit line 450 in styles.css
```

---

## 📦 Pre-built Figma Templates

### Compatible Figma Templates:
1. **Gaming UI Kit** - Dark mode, neon colors
2. **Card Game UI** - Playing card designs
3. **Dashboard UI** - Stats and analytics
4. **Mobile App UI** - Touch-friendly designs

### How to use templates:
1. Duplicate template to your Figma
2. Customize colors/fonts
3. Export design tokens
4. Replace `design-tokens.css`
5. Done! ✅

---

## 🎨 Color Scheme Examples

### Cyberpunk Theme:
```css
--primary-500: #ff00ff;      /* Neon pink */
--secondary-500: #00ffff;    /* Cyan */
--bg-primary: #0a0014;       /* Deep purple */
```

### Professional Theme:
```css
--primary-500: #2563eb;      /* Blue */
--secondary-500: #7c3aed;    /* Purple */
--bg-primary: #1e293b;       /* Slate */
```

### Nature Theme:
```css
--primary-500: #22c55e;      /* Green */
--secondary-500: #14b8a6;    /* Teal */
--bg-primary: #052e16;       /* Dark green */
```

Just paste these into `design-tokens.css` and the whole app updates!

---

## 🚀 Advanced: Build System (Optional)

### Use PostCSS to auto-import Figma:

1. Install tools:
```bash
npm install -g postcss-cli figma-api-to-css
```

2. Create `postcss.config.js`:
```javascript
module.exports = {
  plugins: [
    require('figma-api-to-css')({
      figmaToken: process.env.FIGMA_TOKEN,
      fileKey: 'YOUR_FILE_KEY'
    })
  ]
}
```

3. Run build:
```bash
postcss design-tokens.css -o dist/design-tokens.css
```

---

## 📚 Resources

### Figma Plugins:
- **Design Tokens** - Export variables
- **CSS Gen** - Generate CSS from designs
- **Figma to Code** - Convert to HTML/CSS
- **Stark** - Accessibility checker

### Online Tools:
- **Figma API Explorer** - https://www.figma.com/developers/api
- **CSS Gradient Generator** - https://cssgradient.io/
- **Shadow Generator** - https://shadows.brumm.af/

---

## ✅ Checklist

- [ ] Export colors from Figma
- [ ] Update `design-tokens.css`
- [ ] Link design tokens in HTML
- [ ] Export component styles
- [ ] Export icons/images to `assets/`
- [ ] Test on mobile (375px)
- [ ] Test on desktop (1440px)
- [ ] Check dark/light modes
- [ ] Verify accessibility (contrast)
- [ ] Deploy changes

---

## 🆘 Troubleshooting

**Problem: Colors not updating**
- Solution: Make sure `design-tokens.css` loads BEFORE `styles.css`

**Problem: Fonts not loading**
- Solution: Add font-face or Google Fonts link in HTML `<head>`

**Problem: Images not showing**
- Solution: Check image paths are relative: `assets/logo.svg`

**Problem: Design looks broken on mobile**
- Solution: Check media queries in `styles.css` (search for `@media`)

---

**Ready to redesign? Update `design-tokens.css` and watch the magic happen!** ✨

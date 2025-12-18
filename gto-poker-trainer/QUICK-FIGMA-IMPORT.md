# 🎨 Quick Figma Import Guide

## Step 1: Export from Figma

### Method A: Using Figma Tokens Plugin (Recommended)
1. Install "Design Tokens" or "Figma Tokens" plugin in Figma
2. Select your design file
3. Go to Plugins → Design Tokens → Export
4. Choose **CSS Variables** format
5. Copy the output

### Method B: Manual Export
1. Select all elements with your colors
2. Right-click → Copy → Copy as CSS
3. Extract the color values

---

## Step 2: Update `design-tokens.css`

Open `design-tokens.css` and replace these values:

```css
:root {
    /* === COLORS - Paste your Figma colors here === */
    
    /* Primary Brand Colors (from Figma) */
    --primary-50: #YOUR_COLOR;
    --primary-100: #YOUR_COLOR;
    --primary-200: #YOUR_COLOR;
    --primary-300: #YOUR_COLOR;
    --primary-400: #YOUR_COLOR;
    --primary-500: #YOUR_MAIN_COLOR;  /* Main brand color */
    --primary-600: #YOUR_COLOR;
    --primary-700: #YOUR_COLOR;
    --primary-800: #YOUR_COLOR;
    --primary-900: #YOUR_COLOR;
    
    /* Secondary Colors (from Figma) */
    --secondary-500: #YOUR_SECONDARY_COLOR;
    
    /* Background Colors (from Figma) */
    --bg-primary: #YOUR_DARK_BG;       /* Main background */
    --bg-secondary: #YOUR_LIGHTER_BG;  /* Secondary background */
    --bg-elevated: #YOUR_CARD_BG;      /* Cards and elevated surfaces */
    
    /* Text Colors (from Figma) */
    --text-primary: #YOUR_TEXT_COLOR;     /* Main text */
    --text-secondary: #YOUR_MUTED_TEXT;   /* Secondary text */
    
    /* Semantic Colors (from Figma) */
    --success-500: #YOUR_GREEN;
    --error-500: #YOUR_RED;
    --warning-500: #YOUR_ORANGE;
    --info-500: #YOUR_BLUE;
}
```

---

## Step 3: Update Typography (Optional)

```css
:root {
    /* Font Family - Import from Figma */
    --font-primary: 'Your Figma Font', -apple-system, sans-serif;
    
    /* If using Google Fonts, add to index.html: */
    /* <link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet"> */
}
```

---

## Step 4: Test Your Changes

1. Save `design-tokens.css`
2. Refresh your browser
3. All colors, spacing, fonts update automatically! ✨

---

## 🎯 Quick Color Updates

Just want to change colors quickly? Update these 5 values:

```css
--primary-500: #00ff87;      /* Main brand color */
--secondary-500: #667eea;    /* Secondary/accent color */
--bg-primary: #0a0e27;       /* Dark background */
--text-primary: #ffffff;     /* Text color */
--error-500: #e74c3c;        /* Error/danger color */
```

---

## 📦 Example: Import Gaming Theme from Figma

```css
:root {
    /* Cyberpunk Gaming Theme */
    --primary-500: #ff00ff;      /* Neon Pink */
    --primary-300: #ff66ff;      /* Light Pink */
    --secondary-500: #00ffff;    /* Cyan */
    --bg-primary: #0a0014;       /* Deep Purple */
    --bg-secondary: #1a0f2e;     /* Dark Purple */
    --bg-elevated: #2d1b4e;      /* Purple Card */
    --text-primary: #ffffff;     /* White */
    --text-secondary: #b399ff;   /* Light Purple */
}
```

---

## 🔍 Finding Figma Colors

### In Figma:
1. Select any element
2. Look at the **Fill** property in the right panel
3. Click the color swatch
4. Copy the **HEX value** (e.g., #00FF87)

### For Text Colors:
1. Select text
2. Look at **Text** section
3. Copy the color HEX value

### For Backgrounds:
1. Select the frame/rectangle
2. Look at **Fill** section
3. Copy the HEX value

---

## ⚡ What Happens When You Update?

When you change `design-tokens.css`, these update automatically:

✅ All button colors  
✅ Card backgrounds  
✅ Text colors  
✅ Borders  
✅ Shadows and glows  
✅ Spacing between elements  
✅ Border radius (roundness)  
✅ Font sizes  
✅ Everything! 🎉

---

## 🆘 Troubleshooting

**Problem**: Colors not changing  
**Solution**: Make sure `design-tokens.css` loads BEFORE `styles.css` in `index.html`

```html
<!-- Correct order: -->
<link rel="stylesheet" href="design-tokens.css">
<link rel="stylesheet" href="styles.css">
```

**Problem**: Font not loading  
**Solution**: Add Google Fonts or font file import to `index.html`

---

## 🎨 Popular Figma Design Systems

These are compatible with our token system:

- **Material Design** (Google)
- **Ant Design** (Alibaba)
- **Carbon Design** (IBM)
- **Fluent Design** (Microsoft)
- **Gaming UI Kits** (various)

Just export their color tokens and paste into `design-tokens.css`!

---

**That's it!** Update `design-tokens.css` and everything updates. No code changes needed. 🚀

# orderly.

> Shop the feeling, keep the cash. Pure dopamine, zero clutter.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
# → Open http://localhost:5173

# 3. Build for production
npm run build
```

## Deploy to Vercel (free, ~2 min)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Vercel auto-detects Vite — just click Deploy
4. You'll get a live URL like `https://orderly.vercel.app`

## Deploy to Netlify (alternative)

1. Run `npm run build` locally
2. Drag the `dist/` folder to https://app.netlify.com/drop
3. Done — instant live URL

## Project Structure

```
orderly/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config
├── package.json
└── src/
    ├── main.jsx        # React root
    ├── index.css       # Global reset
    └── App.jsx         # All components + data
```

## Features
- 177 products across 16 categories
- Cart, checkout, order tracking simulation
- User auth (stored in localStorage)
- Shareable dopamine receipt
- Brand analytics dashboard (panelist opt-in)

## PWA Setup (Install on Phone)

After deploying, users visit the URL and tap **Share → Add to Home Screen** on iPhone, or **Menu → Add to Home Screen** on Android. It installs like a native app — icon on home screen, full screen, works offline.

### Generate icons (one-time)
```bash
npm install canvas --save-dev
node generate-icons.mjs
```
This creates `public/pwa-192.png`, `public/pwa-512.png`, and `public/apple-touch-icon.png`.

If you'd rather skip the script, just drop any 512×512 PNG into `public/` named `pwa-512.png` and resize copies for the other two. A square logo with a dark background works great.

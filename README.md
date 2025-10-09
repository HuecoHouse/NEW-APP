# Brand Vision Studio

Brand Vision Studio is a glassmorphism-inspired web app that analyzes any public website URL and instantly composes an AI-guided brand system. Drop in a link and the studio will surface:

- A synthesized brand story, mission statement, elevator pitch, and hero copy
- Modular messaging that you can expand or regenerate on the fly
- Suggested taglines, calls-to-action, and voice pillars
- Color palettes, font pairings, logo art-direction notes, and asset concepts
- A personal library so you can store, search, and reload every exploration

No external services are required—everything runs in the browser using heuristics and contextual generation.

## Quick Start

The project is fully static. Use any simple file server to preview it locally:

```bash
# optional helper scripts
npm install

# start a local server (choose one)
npm start
# or
python -m http.server 8000
```

Then visit the printed URL (for example `http://localhost:8000/index.html`). Paste a website URL, toggle the options you want, and press **Generate Brand System**. You can expand or regenerate any text block, refresh palettes and assets, and store the final set in your searchable library.

### Fetching live sites

Most modern websites restrict cross-origin scraping. If the app can’t read the page directly it will fall back to AI heuristics based on the URL metadata and tell you so in the interface. To analyze private or protected content, route the request through a CORS-enabled proxy or export the page markup and host it temporarily.

## Deploying

Because there’s no build step, deployment is as easy as serving the static files:

- **GitHub Pages** – Run `npm run build` (or `node scripts/build-docs.mjs`) to copy the latest assets into `docs/`, commit, and point Pages to that folder.
- **Netlify / Vercel / Cloudflare Pages** – Import the repo, use “no build command,” and set the output directory to `.` (or `docs/` if you prefer the Pages layout).
- **Any static host** – Upload the root directory contents as-is.

## Library persistence

Saved brand systems live in `localStorage` under the key `brand-vision-library-v1`. Clearing browser storage or switching devices will reset the library. You can always export entries manually by copying the generated content from the interface.

## Troubleshooting

- **“We used AI heuristics…” warning** – The target site blocked cross-origin access. Results are still generated from the URL, but use a proxy if you need deeper context.
- **Nothing happens on submit** – Make sure the URL includes `http://` or `https://`. The form automatically adds `https://` if it’s missing.
- **Library doesn’t persist** – Private browsing modes often disable `localStorage`. Switch to a standard window to keep your saved analyses.

## Scripts

- `npm start` – Runs `npx serve .` for a zero-config local preview.
- `npm run build` – Copies `index.html`, `styles.css`, and `script.js` into `docs/` with relative asset paths so GitHub Pages can host the latest build.

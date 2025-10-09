# Brand Vision Studio

Brand Vision Studio is a glassmorphism-inspired web app that analyzes any public website URL and instantly composes an AI-guided brand system. Drop in a link and the studio will surface:

- A synthesized brand story, mission statement, elevator pitch, and hero copy
- Modular messaging that you can expand or regenerate on the fly
- Suggested taglines, calls-to-action, and voice pillars
- Color palettes, font pairings, logo art-direction notes, and asset concepts
- A floating soundtrack player that pairs each analysis with ambient previews

No external services are required for the core experience—everything runs in the browser using heuristics and contextual generation. A lightweight Node backend is included if you want the Spotify helper to manage OAuth on your behalf.

## Quick Start

Install dependencies and launch the static preview with any simple file server:

```bash
npm install

# start a local server (choose one)
npm start
# or
python -m http.server 8000
```

Then visit the printed URL (for example `http://localhost:8000/index.html`). Paste a website URL, toggle the options you want, and press **Generate Brand System**. You can expand or regenerate any text block, refresh palettes and assets, and explore the floating soundtrack queue.

### Spotify helper API (optional)

If you want the in-app Spotify tooling to exchange tokens for you, run the lightweight Node backend alongside the static site:

1. Copy `.env.example` to `.env` and add your Spotify app credentials. If you were provided the secret `0e612f85f09b42cfba4f34bac653a1a1`, set it as `SPOTIFY_CLIENT_SECRET` and keep it private.
2. Update `SPOTIFY_REDIRECT_URI` if you’re hosting somewhere other than `http://localhost:5000/api/spotify/callback`.
3. Start the API server:

   ```bash
   npm run api
   ```

4. Use the redirect URI below when registering your Spotify application:
   - `http://localhost:5000/api/spotify/callback`
   - `https://<your-domain>/api/spotify/callback`
   - `https://<username>.github.io/<repo>/api/spotify/callback`

The helper exposes `GET /api/spotify/login`, `GET /api/spotify/callback`, and `GET /api/spotify/refresh` endpoints that the UI can call to complete the OAuth flow.

### Fetching live sites

Most modern websites restrict cross-origin scraping. If the app can’t read the page directly it will fall back to AI heuristics based on the URL metadata and tell you so in the interface. To analyze private or protected content, route the request through a CORS-enabled proxy or export the page markup and host it temporarily.

## Deploying

Because there’s no build step, deployment is as easy as serving the static files:

- **GitHub Pages** – Run `npm run build` (or `node scripts/build-docs.mjs`) to copy the latest assets into `docs/`, commit, and point Pages to that folder. The build script now drops matching `404.html` and `.nojekyll` files in both the repository root and `docs/`, and the fallback page automatically redirects project pages back to the correct base path instead of GitHub’s default 404 screen.
- **Netlify / Vercel / Cloudflare Pages** – Import the repo, use “no build command,” and set the output directory to `.` (or `docs/` if you prefer the Pages layout).
- **Any static host** – Upload the root directory contents as-is.

If you’re using the Spotify helper API, deploy `server.js` to any Node-friendly host (Render, Railway, Fly.io, Heroku, etc.). Update `SPOTIFY_REDIRECT_URI` to point at the deployed `/api/spotify/callback` endpoint and mirror that exact value in the Spotify developer dashboard.

## Spotify integration (optional)

If you want Brand Vision Studio to call Spotify’s API as part of your workflow, you’ll need to register a valid redirect URI in the Spotify developer dashboard and mirror that value in your `.env` file (or wherever you store secrets). The floating soundtrack player will automatically use the helper endpoints once they’re live, so there’s no in-app form to manage the redirect anymore—just configure the backend and start the API server when you need it.

When you run `npm run api`, the backend exposes:

- `GET /api/spotify/login` – Returns an authorize URL and state token.
- `GET /api/spotify/callback` – Exchanges an authorization code for access and refresh tokens.
- `GET /api/spotify/refresh` – Refreshes an expiring access token.

These endpoints are CORS-enabled so you can host the UI and API on different domains if needed.

## Troubleshooting

- **“We used AI heuristics…” warning** – The target site blocked cross-origin access. Results are still generated from the URL, but use a proxy if you need deeper context.
- **Nothing happens on submit** – Make sure the URL includes `http://` or `https://`. The form automatically adds `https://` if it’s missing.
## Scripts

- `npm start` – Runs `npx serve .` for a zero-config local preview.
- `npm run build` – Copies `index.html`, `styles.css`, and `script.js` into `docs/` with relative asset paths so GitHub Pages can host the latest build.
- `npm run api` – Launches the Node-based Spotify helper API on port 5000 (configurable via `.env`).

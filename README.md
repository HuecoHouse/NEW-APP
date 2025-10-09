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
Then visit the printed URL (for example `http://localhost:8000/index.html`). Paste a website URL, toggle the options you want, and press **Generate Brand System**. You can expand or regenerate any text block, refresh palettes and assets, and store the final set in your searchable library.

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
If you want Brand Vision Studio to call Spotify’s API as part of your workflow, you’ll need to register a valid redirect URI in the Spotify developer dashboard. The Source panel includes a Spotify setup card where you can paste the exact URI you configure with Spotify or let the app suggest one based on the current site. The helper validates that the URL is HTTPS (or `http://localhost` for development), stores it locally, and drives the floating soundtrack player.

When you run `npm run api`, the backend exposes:

- `GET /api/spotify/login` – Returns an authorize URL and state token.
- `GET /api/spotify/callback` – Exchanges an authorization code for access and refresh tokens.
- `GET /api/spotify/refresh` – Refreshes an expiring access token.

These endpoints are CORS-enabled so you can host the UI and API on different domains if needed.
- **GitHub Pages** – Run `npm run build` (or `node scripts/build-docs.mjs`) to copy the latest assets into `docs/`, commit, and point Pages to that folder. The build script now drops a matching `404.html` and `.nojekyll` file so Pages will always fall back to the app shell instead of the default 404 screen.
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
- `npm run api` – Launches the Node-based Spotify helper API on port 5000 (configurable via `.env`).
# New PDF App

This project is a static web application that lets you upload a PDF, automatically detect the existing company name, provide a replacement name and logo, and download the rebranded result.
This project is a static web application that lets you upload a PDF, specify the current and replacement company names, provide a new logo, and download the rebranded result.

## Local Development

Because everything runs in the browser you only need a static file server:

1. Install dependencies (optional): `npm install` (only required if you want to use the `npm start` helper that launches a local server with `serve`).
2. Start a local server in the project root:
   - With npm: `npm start`
   - Or with Python: `python -m http.server 8000`
3. Open the printed URL (for example `http://localhost:8000/index.html`) to use the app.

## Hosting Options

You can deploy the site anywhere that serves static files. A few popular choices:

### GitHub Pages
1. Push this repository to GitHub.
2. Run `npm run build` (or `node scripts/build-docs.mjs`) to copy the latest assets into the `docs/` folder that GitHub Pages can serve.
3. Commit the generated `docs/` files.
4. In the repository settings, enable GitHub Pages and choose the `main` branch `docs/` folder as the publishing source.
5. GitHub will publish the static site at `https://<username>.github.io/<repo>/`.

> **Tip:** If you prefer to publish directly from the repository root instead of `docs/`, change the Pages source accordingly and skip step 2—the same files at the project root work either way.

### Netlify
1. Create a new Netlify site and connect it to your GitHub repository, or drag-and-drop the project folder into Netlify Drop.
2. Set the build command to `none` and the publish directory to the repository root (or to `.`).
3. Deploy and Netlify will give you a live preview URL.

### Vercel
1. Run `vercel` from the project directory or import the repo in the Vercel dashboard.
2. When prompted for the project configuration, choose `Other` framework with no build command and set the output directory to `.`.
3. Deploy to get a live preview link and optional production domain.

Any static hosting provider (e.g., Cloudflare Pages, AWS S3 + CloudFront) works as long as it can serve the files in this repository.

## Troubleshooting

- **Seeing “File not found” on GitHub Pages?** Ensure the Pages source is set to the `docs/` folder (after running `npm run build`) or to the repository root. The published URL will be `https://<username>.github.io/<repo>/`. Visiting the domain root (`https://<username>.github.io/`) without the repo name will result in a 404.
- **Getting “The PDF processing tools failed to load”?** The app now attempts to download `pdf-lib` from two different CDNs. If both fail—most commonly because of a blocked network request—the form is disabled and a notice appears beneath the hero copy. Check your network or configure your hosting provider to allow requests to the CDN domains, then refresh. As a last resort, download `pdf-lib.min.js` and serve it locally (see below).
- **Current name not detected?** The app analyses textual content streams to infer the existing brand. If detection comes up empty you’ll see a manual entry field—type the original company name there so the replacement can continue. For best results make sure the brand appears consistently as selectable text (not just as part of images).

## Notes

The in-browser PDF manipulation relies on the client device for processing, so hosting only needs to deliver the static assets—no server-side code is required.

The interface loads [`pdf-lib`](https://github.com/Hopding/pdf-lib) from a CDN at runtime. The loader tries jsDelivr first and falls back to unpkg; if you plan to run the site without internet access, download `pdf-lib.min.js` and update `index.html` (and `docs/index.html`) to point to your copy.
The interface loads [`pdf-lib`](https://github.com/Hopding/pdf-lib) from a CDN at runtime. If you plan to run the site without internet access, download that script locally and update `index.html` to point to your copy.

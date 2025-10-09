# Brand Vision Studio

A minimalist single-page web app that turns any website URL into an AI-inspired brand system. Paste a link, toggle the modules you need, and Brand Vision Studio generates narrative, palette, typography, asset concepts, and messaging guidance — all inside a frosted-glass interface with a floating focus playlist.

## Features

- **URL-first intake** with optional toggles for logo ideas, asset directions, and voice guidance.
- **Heuristic brand generation** that produces deterministic narratives, color palettes, typography pairings, and messaging suggestions for consistent iteration.
- **In-place refinement** letting you expand cards for deeper detail or regenerate sections for alternative angles.
- **Floating soundtrack player** featuring a calming playlist that stays anchored to the screen for uninterrupted flow.
- **Responsive Apple-inspired layout** with glassmorphism, pill controls, and smooth scaling from desktop to mobile.

## Getting started

```bash
npm install
npm start
```

The included `start` script serves the static files with [`http-server`](https://www.npmjs.com/package/http-server). Once running, open the printed URL (typically <http://localhost:8080>) in your browser.

Prefer not to install dependencies? Launch a quick preview with Python:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Project structure

```
NEW-APP/
├── index.html      # Application shell and layout
├── styles.css      # Glassmorphism-inspired styling
├── script.js       # Brand generation logic and soundtrack player
└── README.md       # Documentation
```

## Testing

The project uses a lightweight syntax check to ensure the JavaScript compiles:

```bash
npm test
```

## Deployment

Because the site is fully static, you can deploy it to any static host (GitHub Pages, Netlify, Vercel, Render static sites, etc.). Upload the contents of the repository root and set the entry point to `index.html`.

## License

MIT

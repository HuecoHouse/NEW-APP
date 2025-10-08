# New PDF App

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
2. In the repository settings, enable GitHub Pages and choose the `main` branch root.
3. GitHub will build the static site for you and provide a `https://<username>.github.io/<repo>/` URL.

### Netlify
1. Create a new Netlify site and connect it to your GitHub repository, or drag-and-drop the project folder into Netlify Drop.
2. Set the build command to `none` and the publish directory to the repository root (or to `.`).
3. Deploy and Netlify will give you a live preview URL.

### Vercel
1. Run `vercel` from the project directory or import the repo in the Vercel dashboard.
2. When prompted for the project configuration, choose `Other` framework with no build command and set the output directory to `.`.
3. Deploy to get a live preview link and optional production domain.

Any static hosting provider (e.g., Cloudflare Pages, AWS S3 + CloudFront) works as long as it can serve the files in this repository.

## Notes

The in-browser PDF manipulation relies on the client device for processing, so hosting only needs to deliver the static assets—no server-side code is required.

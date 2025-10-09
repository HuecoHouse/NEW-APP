import { mkdir, readFile, writeFile, copyFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const docsDir = join(projectRoot, 'docs');

const filesToCopy = ['index.html', 'styles.css', 'script.js'];

async function ensureDocsDir() {
  await mkdir(docsDir, { recursive: true });
}

async function copyFileWithUpdates(file) {
  const sourcePath = join(projectRoot, file);
  const targetPath = join(docsDir, file);
  await mkdir(dirname(targetPath), { recursive: true });

  if (file === 'index.html') {
    const html = await readFile(sourcePath, 'utf8');
    const updated = html.replace(/<link rel="stylesheet" href="styles.css" \/>/, '<link rel="stylesheet" href="./styles.css" />')
      .replace(/<script defer src="script.js"><\/script>/, '<script defer src="./script.js"></script>');
    await writeFile(targetPath, updated, 'utf8');
  } else {
    await copyFile(sourcePath, targetPath);
  }
}

async function main() {
  await ensureDocsDir();
  await Promise.all(filesToCopy.map(copyFileWithUpdates));
  await Promise.all([
    createFallbackPage(docsDir),
    createFallbackPage(projectRoot),
  ]);
  await Promise.all([
    writeFile(join(docsDir, '.nojekyll'), ''),
    writeFile(join(projectRoot, '.nojekyll'), ''),
  ]);
  console.log(`Copied ${filesToCopy.length} assets into docs/ for GitHub Pages.`);
}

async function createFallbackPage(baseDir) {
  const fallbackPath = join(baseDir, '404.html');
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting…</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(240, 244, 250, 0.9));
      color: #1c1c1e;
    }
    .card {
      padding: 2rem 2.5rem;
      border-radius: 28px;
      backdrop-filter: blur(18px);
      background: rgba(255, 255, 255, 0.75);
      box-shadow: 0 20px 45px rgba(15, 15, 36, 0.12);
      text-align: center;
      max-width: 420px;
    }
    h1 {
      font-size: 1.4rem;
      margin-bottom: 0.75rem;
    }
    p {
      margin: 0;
      line-height: 1.5;
    }
    a {
      color: #0a84ff;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Redirecting you back to Brand Vision Studio…</h1>
    <p>If nothing happens, <a id="fallback-link" href="/">return to the app</a>.</p>
  </div>
  <script>
    (function () {
      try {
        var origin = window.location.origin;
        var segments = window.location.pathname.split('/').filter(Boolean);
        var targetSegments = segments.length > 1 ? [segments[0]] : [];
        var targetPath = '/' + (targetSegments.length ? targetSegments[0] + '/' : '');
        var destination = origin + targetPath;
        document.getElementById('fallback-link').setAttribute('href', targetPath || '/');
        window.location.replace(destination);
      } catch (error) {
        console.error('Failed to redirect from 404 fallback', error);
      }
    })();
  </script>
</body>
</html>
`;
  await writeFile(fallbackPath, fallbackHtml, 'utf8');
}

  await createFallbackPage();
  await writeFile(join(docsDir, '.nojekyll'), '');
  console.log(`Copied ${filesToCopy.length} assets into docs/ for GitHub Pages.`);
}

async function createFallbackPage() {
  const indexPath = join(docsDir, 'index.html');
  const fallbackPath = join(docsDir, '404.html');
  const html = await readFile(indexPath, 'utf8');
  const fallbackHtml = html.replace(
    '</head>',
    '  <meta http-equiv="refresh" content="0; url=./" />\n</head>'
  );
  await writeFile(fallbackPath, fallbackHtml, 'utf8');
}

  console.log(`Copied ${filesToCopy.length} assets into docs/ for GitHub Pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

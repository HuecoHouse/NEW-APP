import { mkdir, copyFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const docs = join(root, 'docs');

async function main() {
  await mkdir(docs, { recursive: true });

  for (const file of ['index.html', 'styles.css', 'script.js']) {
    await copyFile(join(root, file), join(docs, file));
  }

  const fallback = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0;url=./index.html" />
    <title>Redirecting…</title>
  </head>
  <body></body>
</html>`;

  await writeFile(join(docs, '404.html'), fallback);
  await writeFile(join(root, '404.html'), fallback);
  await writeFile(join(docs, '.nojekyll'), '');
  await writeFile(join(root, '.nojekyll'), '');

  console.log('Copied site assets to docs/.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

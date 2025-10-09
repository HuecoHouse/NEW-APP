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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

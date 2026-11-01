import { build } from 'vite';
import { readdir, mkdtemp, symlink, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staging = await mkdtemp(path.join(root, '.site-build-'));
const legacyFiles = new Set(['index.html', 'styles.css', 'script.js', 'logo.svg']);
try {
  // Reuse unchanged assets, while freezing the currently published homepage.
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['dist', 'legacy', 'scripts', 'work'].includes(entry.name)) continue;
    if (legacyFiles.has(entry.name)) {
      await copyFile(path.join(root, 'legacy', entry.name), path.join(staging, entry.name));
    } else {
      await symlink(path.join(root, entry.name), path.join(staging, entry.name));
    }
  }
  await build({ root: staging, base: '/', build: { outDir: path.join(root, 'dist'), emptyOutDir: true } });
  await build({ root, base: '/v2/', build: { outDir: path.join(root, 'dist/v2'), emptyOutDir: true } });
} finally {
  await rm(staging, { recursive: true, force: true });
}

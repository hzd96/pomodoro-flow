import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Writes the list of built files and a build id into dist/sw.js so the service worker can precache them. */
function swPrecache(): Plugin {
  let files: string[] = [];
  let outDir = 'dist';
  return {
    name: 'sw-precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      files = Object.keys(bundle).filter((f) => f.startsWith('assets/')).sort();
    },
    closeBundle() {
      const path = resolve(outDir, 'sw.js');
      const id = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 10);
      const src = readFileSync(path, 'utf8');
      const out = src
        .replace("const BUILD_ID = 'dev';", `const BUILD_ID = '${id}';`)
        .replace('const ASSETS = [];', `const ASSETS = ${JSON.stringify(files.map((f) => `/${f}`))};`);
      if (out === src || !out.includes(id)) throw new Error('sw-precache: placeholders not found in sw.js');
      writeFileSync(path, out);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), swPrecache()],
  server: { port: 3000 },
});

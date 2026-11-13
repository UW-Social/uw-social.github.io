// Exercise the real importer in workerd against a public calendar. Persistence
// is in-memory only; no Firebase credentials, AI calls or publication are used.
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  stdin: {
    contents: `
      import { createImportService } from './src/event-imports.mjs';
      export default { async fetch() {
        const docs = new Map(); let revision = 0;
        const store = {
          async get(path) { return docs.get(path) || null; },
          async commit(writes) { for (const w of writes) docs.set(w.path, {data:w.data,version:String(++revision)}); },
          async list() { return {items:[],nextPageToken:''}; }
        };
        try {
          const service = createImportService({}, {store});
          const run = await service.crawl('ece', 'runtime-check');
          return Response.json({status:run.status,scanned:run.scanned,imported:run.imported});
        } catch (error) { return Response.json({error:error.message}, {status:500}); }
      } };
    `,
    resolveDir: directory,
  }, bundle: true, format: 'esm', platform: 'browser', write: false,
});
const mf = new Miniflare({ modules: true, compatibilityDate: '2026-10-16', script: result.outputFiles[0].text });
try {
  const response = await mf.dispatchFetch('http://runtime-check.local/');
  console.log(await response.text());
  if (!response.ok) process.exitCode = 1;
} finally { await mf.dispose(); }

import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

/** The redesign's renderer: the mockup page's modules (src/render/page, in the order of its ORDER file) share one
 *  scope, as they did on the page, so they are concatenated into one module with src/render/facade.js at the end.
 *  The game imports it as 'virtual:pagekit' (types in src/render/pagekit.d.ts). */
function pagekit(): Plugin {
  const dir = 'src/render/page';
  const files = () => readFileSync(`${dir}/ORDER`, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    name: 'pagekit',
    resolveId: (id) => (id === 'virtual:pagekit' ? '\0pagekit' : null),
    load(id) {
      if (id !== '\0pagekit') return null;
      const parts = [...files().map((f) => `${dir}/${f}`), 'src/render/facade.js'];
      for (const f of parts) this.addWatchFile(f);
      return parts.map((f) => `// ---- ${f}\n` + readFileSync(f, 'utf8')).join('\n');
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/render/page/') || file.endsWith('/src/render/facade.js')) {
        const m = server.moduleGraph.getModuleById('\0pagekit');
        if (m) { server.moduleGraph.invalidateModule(m); server.ws.send({ type: 'full-reload' }); }
        return [];
      }
    },
  };
}

export default defineConfig({ plugins: [pagekit(), viteSingleFile()], build: { target: 'es2020' } });

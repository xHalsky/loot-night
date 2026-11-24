import { build } from 'vite';
import cfg from '../../vite.config.ts';
await build({ ...cfg, configFile: false, root: 'test/pkcheck', base: './', logLevel: 'warn', build: { outDir: '../../.pkcheck', emptyOutDir: true } });

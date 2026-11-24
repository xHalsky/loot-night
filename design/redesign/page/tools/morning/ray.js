// node ray.js out.png w h scene camx,camy,camz tgtx,tgty,tgtz fovdeg
const p = require('../node_modules/puppeteer-core'), fs = require('fs');
(async () => {
  const [out, w, h, scene, cam, tgt, fov] = process.argv.slice(2);
  const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage(); pg.on('console', (m) => console.log('CON', m.text()));
  await pg.goto('file://' + __dirname + '/' + (process.env.SC || 'scene.html'));
  const t0 = Date.now();
  const d = await pg.evaluate((w, h, s, cam, tgt, fov) => window.render(+w, +h, +s, cam.split(',').map(Number), tgt.split(',').map(Number), (+fov * Math.PI) / 180), w, h, scene, cam, tgt, fov);
  if (d.startsWith('ERR')) { console.log(d); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', Date.now() - t0, 'ms'); await b.close();
})();

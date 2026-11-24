// node render.js face -> out/f<face>-<layer>.png (each layer alone, 2560 x 1440, transparent)
const p = require('../node_modules/puppeteer-core'), fs = require('fs'), { make } = require('./gf_svg.js');
(async () => {
  const faces = (process.argv[2] || '1,2,3').split(',').map(Number);
  const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 2560, height: 1440 });
  for (const face of faces) {
    const { svg, layers, smooth } = make(face);
    await pg.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    for (const id of layers) {
      await pg.evaluate((id) => { for (const el of document.querySelectorAll('svg > g')) el.style.display = el.id === id ? '' : 'none'; }, id);
      const el = await pg.$('svg'); await el.screenshot({ path: `out/f${face}-${id}.png`, omitBackground: true });
    }
    fs.writeFileSync(`out/f${face}-layers.json`, JSON.stringify({ layers, smooth }));
  }
  await b.close(); console.log('ok');
})();

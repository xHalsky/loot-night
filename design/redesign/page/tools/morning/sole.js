// her soles as drawn art, placed on the 3D feet: node sole.js feet.json -> out/s-<layer>.png (2560 x 1440, transparent)
// Local frame: x across the sole (+ = the inside, the big toe's side), y from the top of the heel (0) to the toe tips (100).
const p = require('../node_modules/puppeteer-core'), fs = require('fs');
const g = (v) => { const c = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); return '#' + c + c + c; };
const OUT = 'M0,0 C8,0 14,4 15,12 C16,20 13,28 11.5,36 C10.5,44 13,52 17,60 C20,66 22.5,72 22,79 ' +
  'C23,86 21,97 14.5,98.5 C9,99.5 7.5,93 8.2,86 C7,94 5.5,100 1.5,100 C-2.5,100 -3,94 -2.6,88 ' +
  'C-3,94 -4.8,98 -8,97.6 C-11,97 -11.2,92 -10.6,87 C-11.2,92 -12.6,95 -15.2,94.4 C-17.6,93.8 -18,89.5 -17.6,85 ' +
  'C-18,89 -19.4,91 -21,90.2 C-23,89.2 -23.2,85 -22,80 C-21,72 -18.5,62 -17,52 C-16,40 -16,26 -15,13 C-14,4 -8,0 0,0 Z';
// the outline without the heel's back edge, where the sole runs on into the ankle (OPENHEEL=1: seen from above, so the
// heel's top meets her leg, not the bed)
const OUT_OPEN = 'M15,12 ' + OUT.slice(OUT.indexOf('C16,20'), OUT.indexOf(' C-14,4 -8,0 0,0 Z'));
const INK_OUT = process.env.OPENHEEL ? OUT_OPEN : OUT;
const st = (w) => `fill="none" stroke="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
function soleLayers() {
  return {
    sole: `<defs><radialGradient id="sg" cx="-3" cy="54" r="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g(0.86)}"/><stop offset="0.7" stop-color="${g(0.74)}"/><stop offset="1" stop-color="${g(0.58)}"/></radialGradient>
      <radialGradient id="ar" cx="12.5" cy="42" r="14" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g(0.42)}"/><stop offset="1" stop-color="${g(0.42)}" stop-opacity="0"/></radialGradient>
      <linearGradient id="cr" x1="0" y1="78" x2="0" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g(0.5)}" stop-opacity="0"/><stop offset="0.5" stop-color="${g(0.5)}"/><stop offset="1" stop-color="${g(0.5)}" stop-opacity="0"/></linearGradient></defs>
      <path d="${OUT}" fill="url(#sg)"/><ellipse cx="12.5" cy="42" rx="6" ry="16" fill="url(#ar)"/><rect x="-23" y="78" width="46" height="12" fill="url(#cr)"/>`,
    pad: `<ellipse cx="0" cy="16" rx="11" ry="12" fill="${g(0.84)}"/><ellipse cx="1.5" cy="71" rx="19" ry="8.5" fill="${g(0.8)}"/>
      <ellipse cx="15" cy="92" rx="6" ry="5.6" fill="${g(0.86)}"/><ellipse cx="2" cy="95" rx="3.6" ry="3.8" fill="${g(0.84)}"/>
      <ellipse cx="-7" cy="93" rx="3.2" ry="3.4" fill="${g(0.82)}"/><ellipse cx="-14.3" cy="91" rx="2.8" ry="3" fill="${g(0.8)}"/><ellipse cx="-20.3" cy="87" rx="2.3" ry="2.6" fill="${g(0.78)}"/>`,
    'ink-sole': `<path d="${INK_OUT}" ${st(1.25)}/><path d="M20.5,81.5 C10,85 -8,84.5 -21,80.5" ${st(0.8)}/>
      <path d="M8.2,86 L8.6,92 M-2.6,88 L-2.8,93.5 M-10.6,87 L-11,91.6 M-17.6,85 L-17.9,88.6" ${st(0.85)}/>`,
  };
}
(async () => {
  const feet = JSON.parse(fs.readFileSync(process.argv[2] || 'out/feet.json'));
  const L = soleLayers();
  const svgFor = (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="2560" height="1440">${feet.map((f) => {
    const [hx, hy] = f.heel, [tx, ty] = f.toe, [vx, vy] = f.width;
    const k = 0.9, a = (vx / 46) * k, b = (vy / 46) * k, c = ((tx - hx) / 100) * k, d = ((ty - hy) / 100) * k;   // local x along the width, y heel to toes
    return `<g transform="matrix(${a} ${b} ${c} ${d} ${hx} ${hy})">${L[id]}</g>`;
  }).join('')}</svg>`;
  const b = await p.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 2560, height: 1440 });
  for (const id of Object.keys(L)) {
    await pg.setContent(`<html><body style="margin:0;background:transparent">${svgFor(id)}</body></html>`);
    const el = await pg.$('svg'); await el.screenshot({ path: `${process.argv[3] || 'out/s-'}${id}.png`, omitBackground: true });
  }
  await b.close(); console.log('ok');
})();

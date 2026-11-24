// Her portrait for the caught screen, as vector layers. Each <g> is one material; its fills are greys that carry the
// light (0 dark .. 1 lit). Layers named ink-* / x-* are exact colours (only their coverage counts). 640 x 360 units.
// Each part's lines sit right after the part, so whatever is in front hides them.
// make(face) -> { svg, layers }; face: 1 stern glare, 2 glasses glare + shadowed face, 3 furious with the anger mark.
const g = (v) => { const c = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); return '#' + c + c + c; };
const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${(640 - +x).toFixed(2)},${y}`);
const both = (d, attrs) => `<path d="${d}" ${attrs}/><path d="${mir(d)}" ${attrs}/>`;
const st = (w, extra = '') => `fill="none" stroke="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;

function make(face = 1) {
  const L = [], dark = face === 2, fury = face === 3;
  // ---------------------------------------------------------------- your door and the hallway behind her
  L.push(['bg', `
    <defs><radialGradient id="hall" cx="320" cy="70" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g(0.78)}"/><stop offset="0.35" stop-color="${g(0.6)}"/><stop offset="0.7" stop-color="${g(0.36)}"/><stop offset="1" stop-color="${g(0.18)}"/></radialGradient>
    <linearGradient id="jamb" x1="0" x2="1"><stop offset="0" stop-color="${g(0.05)}"/><stop offset="1" stop-color="${g(0.16)}"/></linearGradient></defs>
    <rect x="0" y="0" width="640" height="360" fill="${g(0.02)}"/>
    <rect x="128" y="0" width="384" height="360" fill="url(#hall)"/>
    <path d="M128,0 L196,40 L196,250 L128,300 Z" fill="${g(0.3)}"/><path d="${mir('M128,0 L196,40 L196,250 L128,300 Z')}" fill="${g(0.38)}"/>
    <path d="M196,40 L444,40 L512,0 L128,0 Z" fill="${g(0.42)}"/>
    <rect x="290" y="12" width="60" height="9" fill="${g(1)}"/><rect x="284" y="21" width="72" height="3" fill="${g(0.7)}"/>
    <path d="M196,250 L444,250 L512,300 L512,360 L128,360 L128,300 Z" fill="${g(0.46)}"/>
    <rect x="96" y="0" width="36" height="360" fill="url(#jamb)"/><rect x="508" y="0" width="36" height="360" fill="url(#jamb)"/>
    <rect x="128" y="0" width="4" height="360" fill="${g(0.26)}"/><rect x="508" y="0" width="4" height="360" fill="${g(0.3)}"/>
  `, 'smooth']);
  // ---------------------------------------------------------------- the long hair behind her shoulders
  const backHair = 'M320,46 C258,46 224,82 222,136 C220,198 210,270 200,360 L440,360 C430,270 420,198 418,136 C416,82 382,46 320,46 Z';
  L.push(['hairback', `<defs><linearGradient id="hb" x1="0" x2="1"><stop offset="0" stop-color="${g(0.5)}"/><stop offset="0.12" stop-color="${g(0.2)}"/><stop offset="0.88" stop-color="${g(0.2)}"/><stop offset="1" stop-color="${g(0.55)}"/></linearGradient></defs>
    <path d="${backHair}" fill="url(#hb)"/>`]);
  L.push(['ink-hairback', `<path d="${backHair}" ${st(1.6)}/>${[0, 1, 2].map((k) => both(`M${231 + k * 8},170 C${229 + k * 8},240 ${222 + k * 8},300 ${216 + k * 8},360`, st(1))).join('')}`]);
  // ---------------------------------------------------------------- neck and shoulders above the tee's wide neck
  const bodyD = 'M298,214 L299,258 C280,266 238,272 204,284 C182,292 170,312 166,360 L474,360 C470,312 458,292 436,284 C402,272 360,266 341,258 L342,214 Z';
  L.push(['body', `<path d="${bodyD}" fill="${g(0.74)}"/>
    <path d="M296,212 C304,236 336,236 344,212 L344,246 C330,240 310,240 296,246 Z" fill="${g(0.38)}"/>
    ${both('M266,282 C282,279 297,283 307,288 C296,290 282,288 266,286 Z', `fill="${g(0.52)}"`)}
    ${both('M204,284 C188,292 180,304 176,322 L198,300 Z', `fill="${g(0.5)}"`)}`]);
  L.push(['ink-body', `<path d="M299,258 L299,226 M341,258 L341,226" ${st(1.2)}/>${both('M268,282 C283,279 297,283 307,288', st(0.9))}`]);
  // ---------------------------------------------------------------- the tee: cream, a wide neckline, soft folds
  const teeD = 'M166,360 C170,320 182,300 204,292 C232,286 262,294 282,302 C300,310 340,310 358,302 C378,294 408,286 436,292 C458,300 470,320 474,360 Z';
  L.push(['tee', `<path d="${teeD}" fill="${g(0.7)}"/>
    <path d="M282,302 C300,310 340,310 358,302 C350,316 332,320 320,320 C308,320 290,316 282,302 Z" fill="${g(0.45)}"/>
    ${both('M200,302 C206,322 210,342 212,360 L194,360 C192,338 192,318 200,302 Z', `fill="${g(0.48)}"`)}
    ${both('M250,320 C262,332 268,348 270,360 L262,360 C258,346 252,332 244,324 Z', `fill="${g(0.55)}"`)}
    <path d="M184,302 C202,294 232,290 262,296" fill="none" stroke="${g(0.92)}" stroke-width="2"/>`]);
  L.push(['ink-tee', `<path d="M166,360 C170,320 182,300 204,292 C232,286 262,294 282,302 C300,310 340,310 358,302 C378,294 408,286 436,292 C458,300 470,320 474,360" ${st(1.4)}/>`]);
  // ---------------------------------------------------------------- her face
  const faceD = 'M257,118 C255,154 259,186 272,210 C285,229 303,239 320,242 C337,239 355,229 368,210 C381,186 385,154 383,118 C362,98 278,98 257,118 Z';
  L.push(['face', `<defs><radialGradient id="fl" cx="306" cy="168" r="86" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${g(0.86)}"/><stop offset="0.62" stop-color="${g(0.76)}"/><stop offset="1" stop-color="${g(0.5)}"/></radialGradient>
    <linearGradient id="gloom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g(0.04)}"/><stop offset="0.6" stop-color="${g(0.26)}"/><stop offset="1" stop-color="${g(0.6)}"/></linearGradient></defs>
    <path d="${faceD}" fill="url(#fl)"/>
    <path d="M257,118 C300,108 340,108 383,118 L383,141 L374,138 L366,143 L356,137 L346,143 L334,137 L320,143 L306,137 L294,143 L284,137 L274,143 L266,138 L257,141 Z" fill="${g(0.5)}"/>
    <path d="M368,210 C381,186 385,154 383,128 L375,136 C377,166 371,194 358,214 Z" fill="${g(0.56)}"/>
    <path d="M283,226 C300,238 340,238 357,226 C344,237 331,241 320,242 C309,241 296,237 283,226 Z" fill="${g(0.6)}"/>
    <path d="M324,176 C328,186 328,193 323,197 L317,197 C321,191 322,183 320,176 Z" fill="${g(0.6)}"/>
    <ellipse cx="320" cy="214" rx="8" ry="2.5" fill="${g(0.92)}"/>
    ${both('M257,134 C256,164 259,190 270,210 L276,206 C268,188 265,164 266,138 Z', `fill="${g(0.5)}"`)}
    ${dark ? `<path d="M255,104 L385,104 L385,206 C350,196 290,196 255,206 Z" fill="url(#gloom)"/>` : ''}`]);
  L.push(['ink-face', `<path d="M257,130 C255,160 259,188 272,210 C285,229 303,239 320,242 C337,239 355,229 368,210 C381,188 385,160 383,130" ${st(1.5)}/>`]);
  // ---------------------------------------------------------------- the eyes (narrowed in anger), behind her glasses
  // left eye centre 288,162; the right one mirrored
  const lid = fury ? 'M266,151 C279,147 295,151 309,163' : 'M267,155 C279,150 294,151 307,161';
  const eyeOpen = fury ? 'M266,151 C279,147 295,151 309,163 C301,169 284,170 269,162 Z' : 'M267,155 C279,150 294,151 307,161 C300,167 284,168 270,164 Z';
  L.push(['sclera', dark ? '' : both(eyeOpen, `fill="${g(0.92)}"`) + both(fury ? 'M266,151 C279,147 295,151 309,163 L308,166 C295,155 279,151 267,155 Z' : 'M267,155 C279,150 294,151 307,161 L306,164 C294,155 280,154 268,159 Z', `fill="${g(0.4)}"`)]);
  const ir = fury ? 6.4 : 9.2, pup = fury ? 1.2 : 2.8, icy = fury ? 160 : 161;
  L.push(['iris', dark ? '' : `<defs><clipPath id="eL"><path d="${eyeOpen}"/></clipPath><clipPath id="eR"><path d="${mir(eyeOpen)}"/></clipPath>
      <radialGradient id="ig" cx="0.5" cy="0.72" r="0.62"><stop offset="0" stop-color="${g(0.95)}"/><stop offset="0.45" stop-color="${g(0.6)}"/><stop offset="0.8" stop-color="${g(0.3)}"/><stop offset="1" stop-color="${g(0.12)}"/></radialGradient></defs>
    ${[[289, 'eL'], [351, 'eR']].map(([cx, cl]) => `<g clip-path="url(#${cl})"><circle cx="${cx}" cy="${icy}" r="${ir}" fill="url(#ig)"/><circle cx="${cx}" cy="${icy}" r="${ir}" fill="none" stroke="${g(0.1)}" stroke-width="1.4"/><circle cx="${cx}" cy="${icy}" r="${pup}" fill="${g(0.02)}"/><rect x="${cx - 12}" y="${icy - 12}" width="24" height="7" fill="${g(0.1)}"/></g>`).join('')}`]);
  L.push(['ink-eyes', dark ? '' : `
    ${both(lid, st(fury ? 3.4 : 3.2))}
    ${both(fury ? 'M266,151 L259,149 M268,148 L261,143' : 'M267,155 L260,153 M269,152 L262,148', st(1.6))}
    ${both(fury ? 'M269,163 C284,170 300,169 307,165' : 'M270,164 C284,168 299,167 305,163', st(1.1))}`]);
  L.push(['x-shine', dark ? '' : [289, 351].map((cx) => `<circle cx="${cx - 4}" cy="${icy - 4}" r="${fury ? 1.5 : 2.6}" fill="#000"/><circle cx="${cx + 3.5}" cy="${icy + 4}" r="1.2" fill="#000"/>`).join('')]);
  // ---------------------------------------------------------------- the mouth: a stern line, a tight line, a shout
  if (fury) {
    const m = 'M297,212 C305,204 335,204 343,212 C344,223 336,233 320,234 C304,233 296,223 297,212 Z';
    L.push(['mouth', `<path d="${m}" fill="${g(0.2)}"/><path d="M308,229 C314,224 326,224 332,229 C328,233 312,233 308,229 Z" fill="${g(0.72)}"/>`]);
    L.push(['teeth', `<path d="M300,210 C308,206 332,206 340,210 L339,215 C330,212 310,212 301,215 Z" fill="${g(1)}"/><path d="M303,225 C310,222 330,222 337,225 L335,229 C328,227 312,227 305,229 Z" fill="${g(0.9)}"/>`]);
    L.push(['ink-mouth', `<path d="${m}" ${st(1.8)}/><path d="M297,212 L292,217 M343,212 L348,217" ${st(1.3)}/>`]);
  } else L.push(['ink-mouth', dark ? `<path d="M306,213 C314,212 326,212 334,213" ${st(2.2)}/>` : `<path d="M307,214 C313,210 327,210 333,214" ${st(2)}/><path d="M313,219 C317,220 323,220 327,219" ${st(1)}/>`]);
  L.push(['ink-nose', `<path d="M324,178 C327,187 326,193 321,196" ${st(1.3)}/>`]);
  // ---------------------------------------------------------------- the front hair: crown, blunt bangs, sidelocks to the chest
  const crown = 'M238,122 C240,72 276,50 320,50 C364,50 400,72 402,122 L400,135 L389,137 L383,129 L373,139 L362,131 L351,140 L341,132 L331,141 L320,134 L309,141 L299,132 L289,140 L278,131 L267,139 L257,129 L251,137 L240,135 Z';
  const lock = 'M240,112 C234,156 240,206 233,256 C228,296 223,326 217,360 L254,360 C256,324 258,288 264,248 C269,206 266,166 268,136 Z';
  const hv = fury ? 0.22 : 0.24;
  L.push(['hair', `<defs><linearGradient id="hv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g(hv + 0.1)}"/><stop offset="0.5" stop-color="${g(hv)}"/><stop offset="1" stop-color="${g(hv - 0.1)}"/></linearGradient></defs>
    <path d="${crown}" fill="url(#hv)"/>${both(lock, 'fill="url(#hv)"')}
    <path d="M262,86 C286,70 354,70 378,86 L380,96 C354,82 286,82 260,96 Z" fill="${g(0.44)}"/>
    ${[-50, -40, -31, -22, -13, -4, 5, 14, 23, 32, 41, 50].map((dx, k) => { const x = 320 + dx, y0 = 76 + (dx * dx) / 160; return `<path d="M${x},${y0} L${x + dx * 0.03},${y0 + 7 + (k % 3) * 2}" fill="none" stroke="${g(k % 2 ? 0.8 : 0.7)}" stroke-width="1.5"/>`; }).join('')}
    ${both('M243,124 C239,166 244,212 238,256 C234,294 229,326 224,360', `fill="none" stroke="${g(0.62)}" stroke-width="2.6"`)}
    ${both('M250,170 C251,214 247,268 242,330', `fill="none" stroke="${g(0.48)}" stroke-width="1.6"`)}
    ${both('M260,96 C252,106 247,118 246,134', `fill="none" stroke="${g(0.5)}" stroke-width="2"`)}
    ${[268, 286, 304, 336, 354, 372].map((x) => `<path d="M${x},98 C${x},108 ${x},116 ${x + (x < 320 ? -0.5 : 0.5)},124" fill="none" stroke="${g(0.4)}" stroke-width="1.2"/>`).join('')}
    ${both('M236,200 C234,240 230,290 226,340', `fill="none" stroke="${g(0.44)}" stroke-width="1.4"`)}`]);
  L.push(['ink-hair', `<path d="${crown}" ${st(1.5)}/>${both(lock, st(1.5))}
    ${[284, 300, 340, 356].map((x) => `<path d="M${x},98 C${x - 1},112 ${x},122 ${x + (x < 320 ? 1 : -1)},${132 + (x % 32 ? 4 : 0)}" ${st(0.9)}/>`).join('')}
    ${both('M246,150 C244,200 240,250 234,300', st(0.9))}
    ${[262, 272, 292, 310, 330, 348, 368, 378].map((x) => `<path d="M${x},${104 + Math.abs(x - 320) * 0.05} C${x},116 ${x + (x < 320 ? -1 : 1)},124 ${x + (x < 320 ? -1 : 1)},${128 + (x % 3)}" ${st(0.7)}/>`).join('')}
    ${both('M256,140 C255,190 251,240 246,300 M261,170 C261,214 258,262 254,330', st(0.7))}`]);
  // the brows, drawn over the bangs as anime does: low and angled in anger
  const brow = face === 1 ? 'M266,138 C280,134 296,139 309,150 L306,153 C294,145 281,141 267,141 Z' : face === 2 ? 'M265,136 C280,132 297,138 310,151 L307,154 C295,146 281,140 266,139 Z' : 'M263,130 C280,127 300,138 313,154 L309,158 C296,146 280,135 264,135 Z';
  L.push(['ink-brows', both(brow, 'fill="#000"')]);
  // ---------------------------------------------------------------- the clip: a pink flower on her right
  L.push(['clip', `<g transform="translate(384,98)">${[0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2, x = (Math.cos(a) * 5.4).toFixed(2), y = (Math.sin(a) * 5.4).toFixed(2); return `<ellipse cx="${x}" cy="${y}" rx="4.8" ry="3.8" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${x} ${y})" fill="${g(0.5 + 0.18 * Math.cos(a + 2.4))}"/>`; }).join('')}<circle cx="0" cy="0" r="2.6" fill="${g(1)}"/></g>`]);
  L.push(['ink-clip', `<g transform="translate(384,98)">${[0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2, x = (Math.cos(a) * 5.4).toFixed(2), y = (Math.sin(a) * 5.4).toFixed(2); return `<ellipse cx="${x}" cy="${y}" rx="4.8" ry="3.8" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${x} ${y})" ${st(1)}/>`; }).join('')}</g>`]);
  // ---------------------------------------------------------------- her glasses (2nd catch: the lenses go opaque white)
  const lens = 'M264,161 C264,146 275,138 289,138 C303,138 313,147 313,161 C313,175 303,184 289,184 C275,184 264,175 264,161 Z';
  L.push(['glare', dark ? both(lens, `fill="${g(0.72)}"`) + both('M270,178 L296,140 L306,142 L280,182 Z', `fill="${g(1)}"`) + both('M289,183 L311,152 L313,159 L296,184 Z', `fill="${g(0.95)}"`)
    : '']);
  L.push(['ink-glasses', `${both(lens, st(1.8))}<path d="M313,157 C316,152 324,152 327,157" ${st(1.7)}/>${both('M264,158 L250,153', st(1.7))}`]);
  // ---------------------------------------------------------------- shines, the blush hatch, the anger mark, the gloom lines
  L.push(['x-glint', dark ? '' : both('M268,153 C270,146 276,141 283,140', st(1.1)) + both('M309,166 C307,172 302,177 296,179', st(0.9))]);
  L.push(['x-moon', dark ? both('M303,149 L306,145 L309,149 L306,153 Z', 'fill="#000"') + '<path d="M353,147 L357,135 L361,147 L373,151 L361,155 L357,167 L353,155 L341,151 Z" fill="#000"/>' : '']);
  L.push([fury ? 'x-hatch' : 'x-blush', both(fury ? 'M266,198 L272,188 M272,200 L278,190 M278,201 L284,191 M284,201 L289,193' : 'M270,197 L275,189 M276,198 L281,190 M282,198 L287,190', st(fury ? 1.4 : 1.1))]);
  if (fury) L.push(['x-vein', `<g transform="translate(362,70) rotate(14)"><path d="M-10,-3 C-6,-3 -3,-6 -3,-10 M3,-10 C3,-6 6,-3 10,-3 M10,3 C6,3 3,6 3,10 M-3,10 C-3,6 -6,3 -10,3" ${st(3)}/></g>`]);
  if (dark) L.push(['x-gloom', [292, 300, 308, 332, 340, 348].map((x, k) => `<path d="M${x},186 L${x},${196 + (k % 3) * 5}" ${st(1.3)}/>`).join('') + both('M262,142 L262,188 M258,148 L258,182', st(1.3))]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="2560" height="1440">${L.map(([id, s]) => `<g id="${id}">${s}</g>`).join('\n')}</svg>`;
  return { svg, layers: L.map(([id]) => id), smooth: L.filter((l) => l[2] === 'smooth').map((l) => l[0]) };
}
module.exports = { make };

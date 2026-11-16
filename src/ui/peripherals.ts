// Desk keyboard and mouse (real-life flavor): a mechanical gaming keyboard with WASD caps and a soft RGB glow.
export function keyboardSvg(): string {
  const W = 300, H = 96, u = 18.4, gap = 1.6;
  const rows: [string, number][][] = [
    [['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['⌫', 2.1]],
    [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1.6]],
    [['Caps', 1.8], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ['Enter', 2.3]],
    [['Shift', 2.3], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['Shift', 2.8]],
    [['Ctrl', 1.4], ['⊞', 1.2], ['Alt', 1.2], ['', 7.4], ['Alt', 1.2], ['Fn', 1.2], ['Ctrl', 1.5]],
  ];
  const hot = new Set(['W', 'A', 'S', 'D', 'Q', 'E', 'Tab', '1', '2', '3']);
  let keys = '';
  rows.forEach((row, r) => {
    let x = 8;
    const total = row.reduce((s, [, w]) => s + w, 0);
    const scale = (W - 16 - gap * (row.length - 1)) / (total * u);
    row.forEach(([label, w]) => {
      const kw = w * u * scale, y = 7 + r * (u - 1.2);
      const isHot = hot.has(label);
      keys += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <rect width="${kw.toFixed(1)}" height="${u - 3}" rx="2.5" fill="${isHot ? '#3a2f52' : '#24212c'}"/>
        <rect x="1.6" y="1" width="${(kw - 3.2).toFixed(1)}" height="${u - 7}" rx="2" fill="${isHot ? '#4a3d6a' : '#33303d'}"/>
        ${label ? `<text x="${(kw / 2).toFixed(1)}" y="${u - 9}" text-anchor="middle" font-size="${label.length > 2 ? 5 : 6.5}" fill="${isHot ? '#d9c7ff' : '#9a95a8'}" font-family="Inter, sans-serif">${label}</text>` : ''}
      </g>`;
      x += kw + gap;
    });
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><linearGradient id="kbRgb" x1="0" x2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset=".5" stop-color="#2fd2ff"/><stop offset="1" stop-color="#ff5cc8"/></linearGradient></defs>
    <rect x="2" y="4" width="${W - 4}" height="${H - 4}" rx="7" fill="url(#kbRgb)" opacity=".28" filter="blur(3px)"/>
    <rect x="1" y="1" width="${W - 2}" height="${H - 4}" rx="7" fill="#16141c" stroke="#2d2a36" stroke-width="2"/>
    <rect x="5" y="4" width="${W - 10}" height="${H - 11}" rx="5" fill="#0f0e14"/>
    ${keys}
  </svg>`;
}

export function mouseSvg(): string {
  return `<svg viewBox="0 0 48 80" width="48" height="80">
    <path d="M24 2 C 40 2 40 -8 34 -26" stroke="#2d2a36" stroke-width="2.5" fill="none"/>
    <path d="M24 4 C 8 4 4 18 4 34 V 56 C 4 70 14 78 24 78 C 34 78 44 70 44 56 V 34 C 44 18 40 4 24 4 Z" fill="#1c1a22" stroke="#34303e" stroke-width="2"/>
    <path d="M24 4 V 30 M5 30 Q24 36 43 30" stroke="#0d0c11" stroke-width="1.6" fill="none"/>
    <path d="M7 24 Q8 8 22 6" stroke="#3a3646" stroke-width="2" fill="none" opacity=".7"/>
    <rect x="21" y="10" width="6" height="12" rx="3" fill="#0d0c11" stroke="#4a4658"/>
    <rect x="22.5" y="12" width="3" height="7" rx="1.5" fill="#7a5cff" opacity=".8"/>
    <path d="M10 62 Q24 70 38 62" stroke="#7a5cff" stroke-width="2" fill="none" opacity=".55"/>
  </svg>`;
}

/** Over-ear headphones lying on the desk, seen from above. */
export function headsetSvg(): string {
  return `<svg viewBox="0 0 130 110" width="130" height="110">
    <defs>
      <radialGradient id="hsCup" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#4a4458"/><stop offset="1" stop-color="#1a1720"/></radialGradient>
      <radialGradient id="hsPad" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#2a2533"/><stop offset=".7" stop-color="#15121b"/><stop offset="1" stop-color="#3a3446"/></radialGradient>
    </defs>
    <ellipse cx="66" cy="70" rx="56" ry="30" fill="rgba(0,0,0,.35)" filter="blur(4px)"/>
    <path d="M28 64 C 26 18, 104 14, 104 60" fill="none" stroke="#14121a" stroke-width="11" stroke-linecap="round"/>
    <path d="M28 64 C 26 18, 104 14, 104 60" fill="none" stroke="#3a3446" stroke-width="7" stroke-linecap="round"/>
    <path d="M36 40 C 48 24, 84 22, 96 38" fill="none" stroke="#7a5cff" stroke-width="2" opacity=".7"/>
    <g transform="rotate(-14 28 72)"><ellipse cx="28" cy="72" rx="20" ry="25" fill="url(#hsCup)" stroke="#0d0b11" stroke-width="2"/><ellipse cx="28" cy="72" rx="12" ry="16" fill="url(#hsPad)"/><rect x="22" y="48" width="12" height="6" rx="2" fill="#2a2533"/></g>
    <g transform="rotate(12 104 68)"><ellipse cx="104" cy="68" rx="20" ry="25" fill="url(#hsCup)" stroke="#0d0b11" stroke-width="2"/><ellipse cx="104" cy="68" rx="12" ry="16" fill="url(#hsPad)"/><circle cx="111" cy="58" r="2.2" fill="#7a5cff"/></g>
    <path d="M30 96 C 34 108, 60 104, 74 100 S 110 104, 128 108" fill="none" stroke="#1a1720" stroke-width="3"/>
  </svg>`;
}

/** Monster stock on the desk: up to three cans, one slightly turned. */
export function monsterStockSvg(count: number): string {
  const can = (x: number, y: number, r: number, k: number) => `<g transform="translate(${x} ${y}) rotate(${r})">
    <ellipse cx="13" cy="58" rx="14" ry="4" fill="rgba(0,0,0,.4)"/>
    <defs><linearGradient id="msg${k}" x1="0" x2="1"><stop offset="0" stop-color="#050505"/><stop offset=".38" stop-color="#3c3c3c"/><stop offset=".6" stop-color="#141414"/><stop offset="1" stop-color="#030303"/></linearGradient></defs>
    <rect x="0" y="4" width="26" height="54" rx="4" fill="url(#msg${k})"/>
    <ellipse cx="13" cy="5" rx="12.5" ry="3.6" fill="#c9ced6" stroke="#8a919c"/>
    <rect x="10" y="3" width="7" height="2.4" rx="1.2" fill="#eef1f4"/>
    <path d="M6 16 L8.5 38 M13 14 L13.4 40 M20 16 L17.5 38" stroke="#6fe08a" stroke-width="2.6" stroke-linecap="round"/>
    <text x="13" y="50" text-anchor="middle" font-size="4.6" font-weight="800" fill="#fff" font-family="Inter, sans-serif">MONSTER</text>
  </g>`;
  const spots: [number, number, number][] = [[6, 18, -3], [30, 8, 4], [52, 20, -1]];
  return `<svg viewBox="0 0 84 84" width="84" height="84" style="overflow:visible">${spots.slice(0, count).map(([x, y, r], i) => can(x, y, r, i)).join('')}
    ${count === 0 ? '<text x="42" y="60" text-anchor="middle" font-size="10" fill="#8a7a6a" font-family="Inter, sans-serif">no cans left</text>' : ''}</svg>`;
}

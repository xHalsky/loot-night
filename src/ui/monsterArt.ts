// The bin next to the desk: tonight's empties pile up in it (design doc section 9).
import { S } from '../core/state';

export function deskPileHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const k = n.bin.length;
  // cans poke out of the top as the pile grows
  const tops = Array.from({ length: Math.min(k, 8) }, (_, i) => {
    const x = 8 + ((i * 17) % 44), y = 22 - Math.floor(i / 3) * 7, r = ((i * 47) % 70) - 35;
    return `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-4" y="-12" width="8" height="18" rx="2" fill="#151515"/><ellipse cx="0" cy="-12" rx="4" ry="1.5" fill="#c9ced6"/><path d="M-2 -8 L-1.5 2 M1.5 -8 L1 2" stroke="#6fe08a" stroke-width="1.2"/></g>`;
  }).join('');
  return `<div class="desk-bin"><svg viewBox="0 0 64 80" width="64" height="80">
    <path d="M4 20 L60 20 L54 78 L10 78 Z" fill="#3a4658"/>
    ${tops}
    <path d="M4 24 L60 24 L54 78 L10 78 Z" fill="rgba(110,128,150,.55)"/>
    ${[1, 2, 3, 4, 5, 6].map(i => `<path d="M${4 + i * 8} 24 L${10 + i * 6.3} 78" stroke="rgba(30,40,54,.55)"/>`).join('')}
    <rect x="1" y="18" width="62" height="7" rx="3" fill="#252e3b"/>
  </svg><span>${k ? `${k} empt${k === 1 ? 'y' : 'ies'}` : 'bin'}</span></div>`;
}

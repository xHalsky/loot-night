// The apartment plan (docs/design/her.md, "The plan"): the blue sheet taped to his wall. One layout for the big
// sheet (planSvg) and the corner in the webcam view (door.ts), drawn to match the hallway seen through the crack:
// your door opens onto a hallway; right across it the kitchen's open doorway, further along the same wall the
// bathroom door, and at the far end the bedroom door and the living room's opening on your side.
// Who hears what (ROOM_DISTANCE): living room through your wall and the kitchen across (next), bathroom (middle),
// bedroom (far). The plan never marks where she is.

/** Walls as segments on a 200 x 200 sheet (openings are gaps). */
export const PLAN_WALLS: [number, number, number, number][] = [
  [2, 2, 198, 2], [2, 2, 2, 198], [2, 198, 198, 198], [198, 2, 198, 88], [198, 104, 198, 198],   // outer (the front door at the hallway's end)
  [70, 84, 96, 84], [114, 84, 150, 84], [180, 84, 198, 84],                                       // hallway, north: bathroom door, kitchen opening
  [70, 108, 150, 108], [168, 108, 198, 108],                                                      // hallway, south: your door
  [70, 2, 70, 86], [70, 95, 70, 97], [70, 107, 70, 108],                                          // the far end: bedroom door, living-room opening
  [2, 96, 70, 96],                                                                                 // bedroom | living room
  [140, 2, 140, 84],                                                                               // bathroom | kitchen
  [118, 108, 118, 198],                                                                            // living room | your room (a shared wall)
];
/** Your room's centre (the gold YOU). */
export const PLAN_YOU: [number, number] = [158, 152];

export function planSvg(size: number): string {
  const W = 'stroke="#eaf3ff" stroke-width="2.2" fill="none" stroke-linecap="square"', F = 'stroke="#cfe2ff" stroke-width="1" fill="none" opacity=".8"';
  const walls = PLAN_WALLS.map(([a, b, c, d]) => `M${a} ${b}L${c} ${d}`).join('');
  const sight = '#ff9aa8';
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}">
    <defs><pattern id="bpGrid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="rgba(255,255,255,.08)" stroke-width=".6"/></pattern></defs>
    <rect width="200" height="200" fill="#1d4f91"/><rect width="200" height="200" fill="url(#bpGrid)"/>
    <path d="M166 106 L70 87 M166 106 L70 106" fill="none" stroke="${sight}" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>
    <path d="${walls}" ${W}/>
    <path d="M96 84 V66 A18 18 0 0 1 114 84 M70 86 H61 A9 9 0 0 0 70 95 M168 108 V126 A18 18 0 0 1 150 108 M198 88 H182 A16 16 0 0 0 198 104" ${F}/>
    <path d="M2 22 V62 M5 22 V62 M100 2 H126 M100 5 H126 M152 2 H188 M152 5 H188 M2 120 V176 M5 120 V176 M22 198 H90 M22 195 H90 M198 124 V176 M195 124 V176" stroke="#eaf3ff" stroke-width="1"/>
    <rect x="8" y="8" width="40" height="52" ${F}/><rect x="11" y="11" width="15" height="9" ${F}/><rect x="30" y="11" width="15" height="9" ${F}/><path d="M8 28 H48" ${F}/>
    <rect x="52" y="8" width="12" height="12" ${F}/><rect x="52" y="26" width="14" height="30" ${F}/>
    <rect x="74" y="6" width="22" height="46" rx="6" ${F}/><rect x="108" y="6" width="20" height="12" ${F}/><ellipse cx="130" cy="62" rx="6" ry="8" ${F}/>
    <path d="M144 6 H194 V72 H182 V18 H144 Z" ${F}/><circle cx="188" cy="30" r="3" ${F}/><circle cx="188" cy="44" r="3" ${F}/><rect x="146" y="22" width="14" height="18" ${F}/><circle cx="162" cy="58" r="9" ${F}/>
    <path d="M8 116 V160" stroke="#cfe2ff" stroke-width="2.4"/><rect x="30" y="126" width="24" height="26" ${F}/><rect x="72" y="116" width="20" height="52" rx="4" ${F}/><rect x="24" y="172" width="28" height="18" rx="4" ${F}/>
    <rect x="136" y="180" width="46" height="14" ${F}/><path d="M142 184 H176" stroke="#cfe2ff" stroke-width="2"/><circle cx="159" cy="170" r="7" ${F}/><rect x="184" y="118" width="10" height="30" ${F}/>
    <g font-family="Patrick Hand, sans-serif" font-size="11" fill="#eaf3ff" letter-spacing=".8" text-anchor="middle">
      <text x="30" y="82">BEDROOM</text><text x="114" y="74" font-size="9">BATH</text><text x="166" y="80" font-size="9">KITCHEN</text>
      <text x="124" y="99" font-size="8">HALLWAY</text><text x="46" y="112" font-size="10">LIVING</text>
      <text x="${PLAN_YOU[0]}" y="${PLAN_YOU[1]}" fill="#ffd27a">YOU</text></g>
    <g font-family="Patrick Hand, sans-serif" font-size="9" fill="${sight}" text-anchor="middle"><text x="165" y="94">1</text><text x="105" y="94">2</text><text x="78" y="103">3</text></g>
  </svg>`;
}

// Types for the redesign's renderer (the mockup page's modules, see vite.config.ts and src/render/facade.js).
declare module 'virtual:pagekit' {
  export const PK: {
    init(): Promise<void>;
    ready(): boolean;
    battleArea(vm: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    panel(vm: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    ebreak(bg: HTMLCanvasElement | null, st: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    ebWarm(n: number, ms: number): boolean;
    noSignal(t: number): HTMLCanvasElement;
    caught(rung: number, T: number, cost: string): HTMLCanvasElement;
    cuddle(bg: HTMLCanvasElement | null, st: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    pause(t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    howto(frame: HTMLCanvasElement | null, o: unknown, t: number, black: boolean): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    micro(frame: HTMLCanvasElement | null, lid: number, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    away(bg: HTMLCanvasElement | null, st: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    coach(id: string, o: { title: string; text: string }, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    tip(tip: unknown, x: number, y: number): HTMLCanvasElement;
    inspect(bg: HTMLCanvasElement | null, o: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    morning(scene: string, data: unknown, hover: boolean): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    plan(frame: HTMLCanvasElement | null, layout: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    cableStart(deal: { kinds: number[]; colors: number[]; sockets: number[]; plugged: boolean[] }, plug: (p: number, slot: number) => boolean, elapsed: () => number): void;
    cableDown(x: number, y: number): boolean; cableMove(x: number, y: number): boolean; cableUp(): void; cableDragging(): boolean; cableWarm(ms: number): boolean; cablePoints(): { plugs: number[][]; slots: number[][] };
    cables(bg: HTMLCanvasElement | null, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    ebMap: {
      drawerHandle(o: number): number[]; drawerCans(n: number): number[][]; grabAt(k: number): number[]; spot(): number[];
      openTab(lift: number): number[]; lips(th: number): number[];
      toss: { bx: number; sx: number; sy: number; floor: number };
      tossToScene(x: number, y: number): number[]; sceneToToss(px: number, py: number): number[]; floorAt(x: number, z: number): number[];
    };
    ebCursor(kind: 'hand' | 'grab'): string;
    her(src: HTMLCanvasElement, st: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    desk(src: HTMLCanvasElement, st: unknown, t: number, phase?: 0 | 1 | 2): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[]; overlay: HTMLCanvasElement | null; shake: number } | null;
    phone(vm: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string }[] };
    drawFrame(scene: string, tScreen: number, t: number, moment: string, her: string, o?: Record<string, unknown>): HTMLCanvasElement;
    drawScreen(scene: string, t: number, o?: Record<string, unknown>): HTMLCanvasElement;
    palettes(): { moonwell: string[]; pc98: string[]; desk: string[] };
  };
}

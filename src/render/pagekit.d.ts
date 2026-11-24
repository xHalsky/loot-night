// Types for the redesign's renderer (the mockup page's modules, see vite.config.ts and src/render/facade.js).
declare module 'virtual:pagekit' {
  export const PK: {
    init(): Promise<void>;
    ready(): boolean;
    battleArea(vm: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    panel(vm: unknown, t: number): { canvas: HTMLCanvasElement; hits: { x: number; y: number; w: number; h: number; act: string; arg: string; tip: string }[] };
    drawFrame(scene: string, tScreen: number, t: number, moment: string, her: string, o?: Record<string, unknown>): HTMLCanvasElement;
    drawScreen(scene: string, t: number, o?: Record<string, unknown>): HTMLCanvasElement;
    palettes(): { moonwell: string[]; pc98: string[]; desk: string[] };
  };
}

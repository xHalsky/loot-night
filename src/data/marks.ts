import type { MarkId } from '../core/state';

// Ability marks (docs/design/dungeon.md): one skill marks an enemy, another cashes the mark in.
// Numbers are in tuning.ts (MARK_*). Skill descriptions write a mark as [id]word[/]; markText() colours the word.
export const MARKS: Record<MarkId, { name: string; tag: string; color: string; by: string; payoff: string }> = {
  stagger: { name: 'Stagger', tag: 'STAGGERED', color: '#f2d24b', by: 'Bash', payoff: 'Fire hits it double' },
  chill: { name: 'Chill', tag: 'CHILLED', color: '#8fd8ff', by: 'Frost', payoff: 'Bash shatters it' },
  judged: { name: 'Judge', tag: 'JUDGED', color: '#ffe9a0', by: 'Smite (healer auto)', payoff: 'every skill hit on it heals your most hurt hero' },
  taunted: { name: 'Taunted', tag: 'TAUNTED', color: '#ff8a6a', by: 'Taunt', payoff: 'with Ward up, its hits bounce back' },
};

/** Turns [id]word[/] tokens into coloured text (html) or plain words (for titles). */
export function markText(s: string, html = true): string {
  return s.replace(/\[(\w+)\](.*?)\[\/\]/g, (_, id: string, w: string) =>
    html && MARKS[id as MarkId] ? `<b style="color:${MARKS[id as MarkId].color}">${w}</b>` : w);
}

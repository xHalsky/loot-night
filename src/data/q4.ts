// Q4, the Excel clicker (handoff step 4, #55; grid doc 7i): the job titles and the macros' names and what a level does.
// The numbers are in tuning.ts.
import { T } from '../config/tuning';

export const Q4_TITLES = ['Intern', 'Junior Analyst', 'Analyst', 'Senior Analyst', 'Team Lead', 'Manager', 'Director'];
export type MacroId = 'intern' | 'autofill' | 'vlookup' | 'cond' | 'pivotm' | 'pq';
export const MACROS: { id: MacroId; name: string; fx: (lv: number) => string }[] = [
  { id: 'intern', name: 'Intern', fx: (l) => `AutoSum ${(l * T.Q4_INTERN_SUMS).toFixed(1)}x a second` },
  { id: 'autofill', name: 'AutoFill', fx: (l) => `Fills ${l * T.Q4_AUTOFILL_CELLS} cell${l * T.Q4_AUTOFILL_CELLS === 1 ? '' : 's'} a second` },
  { id: 'vlookup', name: 'VLOOKUP', fx: (l) => `+${Math.round(l * T.Q4_VLOOKUP * 100)}% a filled cell` },
  { id: 'cond', name: 'Conditional Formatting', fx: (l) => `+${Math.round(Math.min(T.Q4_COND_MAX - T.Q4_BALANCED_CHANCE, l * T.Q4_COND) * 100)}% BALANCED chance` },
  { id: 'pivotm', name: 'Pivot macro', fx: (l) => `Spins ${(l * T.Q4_PIVOTM_TURNS).toFixed(1)} turns a second` },
  { id: 'pq', name: 'Power Query', fx: (l) => `+${Math.round(l * T.Q4_PQ * 100)}% all the macros earn` },
];

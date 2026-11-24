// Lists names declared more than once at the top level across the page modules (a module can't redeclare them).
import { parseAst } from 'rolldown/parseAst';
import { readFileSync } from 'node:fs';
const dir = process.argv[2] || 'src/render/page', order = readFileSync(dir + '/ORDER', 'utf8').split('\n').filter(Boolean);
const seen = new Map();
for (const f of order) {
  const src = readFileSync(dir + '/' + f, 'utf8'), ast = parseAst(src, { lang: 'js' });
  const line = (p) => src.slice(0, p).split('\n').length;
  for (const st of ast.body) {
    const names = [];
    if (st.type === 'FunctionDeclaration' && st.id) names.push(st.id.name);
    if (st.type === 'ClassDeclaration' && st.id) names.push(st.id.name);
    if (st.type === 'VariableDeclaration') for (const d of st.declarations) if (d.id.type === 'Identifier') names.push(d.id.name);
    for (const n of names) (seen.get(n) || seen.set(n, []).get(n)).push(`${f}:${line(st.start)}`);
  }
}
let n = 0; for (const [k, v] of seen) if (v.length > 1) { console.log(k, v.join(' ')); n++; }
console.log(n ? n + ' duplicates' : 'no duplicates', '(' + seen.size + ' top-level names)');

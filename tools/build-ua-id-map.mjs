/**
 * Builds ua (prod-prettified bundle) ↔ FreeformBoard hook-variable map for future recovery tooling.
 */
import fs from 'node:fs';
import parser from '@babel/parser';
import traverse from '@babel/traverse';

/** @param {any} init */
function reactHookKind(init) {
  if (!init || init.type !== 'CallExpression') return null;
  const { callee } = init;
  if (callee.type !== 'SequenceExpression') return null;
  const last = callee.expressions[callee.expressions.length - 1];
  if (!last || last.type !== 'MemberExpression') return null;
  if (last.object?.type !== 'Identifier' || last.object.name !== 'g') return null;
  if (last.property?.type !== 'Identifier') return null;
  const pn = /** @type {string} */ (last.property.name);
  if (['useRef', 'useState', 'useCallback', 'useMemo'].includes(pn)) return pn;
  return null;
}

/** @typedef {{ kind: string; ua?: string; uaPair?: string[] }} UaH */
/** @typedef {{ kind: string; fb?: string; fbPair?: string[] }} FbH */

/** @returns {UaH[]} */
function collectUaHooks(ast) {
  /** @type {UaH[]} */
  const out = [];
  traverse.default(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name !== 'ua') return;
      const body = path.node.body.body;
      for (const stmt of body) {
        if (stmt.type !== 'VariableDeclaration') continue;
        for (const d of stmt.declarations) {
          const hook = reactHookKind(d.init);
          if (!hook) continue;
          if (hook === 'useState') {
            if (d.id.type !== 'ArrayPattern' || d.id.elements.length < 2) continue;
            const a = d.id.elements[0];
            const b = d.id.elements[1];
            if (a?.type !== 'Identifier' || b?.type !== 'Identifier') continue;
            out.push({ kind: 'state', uaPair: [a.name, b.name] });
            continue;
          }
          if (d.id.type !== 'Identifier') continue;
          out.push({
            kind: hook === 'useRef' ? 'ref' : hook === 'useCallback' ? 'callback' : 'memo',
            ua: d.id.name,
          });
        }
      }
      path.stop();
    },
  });
  return out;
}

/** @returns {FbH[]} */
function collectFbHooks(ast) {
  /** @type {FbH[]} */
  const out = [];
  traverse.default(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name !== '__fb') return;
      const body = path.node.body.body;
      for (const stmt of body) {
        if (stmt.type !== 'VariableDeclaration') continue;
        for (const d of stmt.declarations) {
          if (!d.init || d.init.type !== 'CallExpression') continue;
          if (d.init.callee.type !== 'Identifier') continue;
          const cn = d.init.callee.name;
          if (!['useRef', 'useState', 'useCallback', 'useMemo'].includes(cn)) continue;
          if (cn === 'useState') {
            if (d.id.type !== 'ArrayPattern' || d.id.elements.length < 2) continue;
            const a = d.id.elements[0];
            const b = d.id.elements[1];
            if (a?.type !== 'Identifier' || b?.type !== 'Identifier') continue;
            out.push({ kind: 'state', fbPair: [a.name, b.name] });
            continue;
          }
          if (d.id.type !== 'Identifier') continue;
          out.push({
            kind: cn === 'useRef' ? 'ref' : cn === 'useCallback' ? 'callback' : 'memo',
            fb: d.id.name,
          });
        }
      }
      path.stop();
    },
  });
  return out;
}

const uaAst = parser.parse(fs.readFileSync('/tmp/ua-pretty.js', 'utf8'), { sourceType: 'module' });
const uaH = collectUaHooks(uaAst);

const fbLines = fs.readFileSync('src/components/FreeformBoard.tsx', 'utf8').split(/\r?\n/);
const fbAst = parser.parse(`function __fb() {\n${fbLines.slice(3070, 5974).join('\n')}\n}\n`, {
  sourceType: 'script',
  plugins: ['typescript'],
});

const fbH = collectFbHooks(fbAst);

const map = new Map();

let ui = 0;
let fi = 0;
while (ui < uaH.length && fi < fbH.length) {
  const a = uaH[ui];
  const b = fbH[fi];
  if (a.kind === 'ref' && a.ua === 'et') {
    ui++;
    continue;
  }
  if (a.kind !== b.kind) {
    console.error('kind mismatch @', ui, fi, a, b);
    process.exit(1);
  }
  if (a.kind === 'state') {
    map.set(a.uaPair[0], b.fbPair[0]);
    map.set(a.uaPair[1], b.fbPair[1]);
    ui++;
    fi++;
    continue;
  }
  map.set(/** @type {string} */ (a.ua), b.fb);
  ui++;
  fi++;
}

if (ui !== uaH.length || fi !== fbH.length) {
  if (
    ui === uaH.length - 1 &&
    uaH[ui].kind === 'memo' &&
    uaH[ui].ua === 'Yi' &&
    fi === fbH.length
  ) {
    map.set('Yi', 'pinnedStripBoardSelection');
    ui++;
  }
}

if (ui !== uaH.length || fi !== fbH.length) {
  console.error('Alignment failed', uaH.slice(ui), fbH.slice(fi));
  process.exit(1);
}

fs.writeFileSync('/tmp/ua-id-map.entries.json', JSON.stringify([...map.entries()], null, 2));

console.error('map size', map.size, 'written /tmp/ua-id-map.entries.json');

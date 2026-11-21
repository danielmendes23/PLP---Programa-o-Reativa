/** Auditor comum às duas condições, sem dependências npm.
 * Escopo: imports literais, ciclos, importações de módulos proibidos e padrões
 * de efeitos colaterais nas camadas domain/application. Não é prova formal de pureza.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, extname, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'src');
const asJson = process.argv.includes('--json');
const files = [];
function walk(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(path);
  }
}
walk(root);
files.sort();
const fileSet = new Set(files);
const violations = [];
if (!existsSync(root) || files.length === 0) {
  violations.push({ kind: 'missing-source', file: '.', target: null,
    reason: 'Diretório de código ausente ou sem arquivos analisáveis' });
}
const knownLayers = new Set(['domain', 'application', 'infrastructure', 'presentation']);
const layer = file => {
  const dir = relative(root, file).split(sep)[0];
  return knownLayers.has(dir) ? dir : null;
};
const forbidden = new Map([
  ['domain', new Set(['application', 'infrastructure', 'presentation'])],
  ['application', new Set(['infrastructure', 'presentation'])]
]);
const graph = new Map();
// A remoção simples de comentários evita muitos falsos positivos, mas não é um parser AST.
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/gm, '$1');
}
for (const file of files) {
  const content = withoutComments(readFileSync(file, 'utf8'));
  const relFile = relative(root, file).split(sep).join('/');
  const fromLayer = layer(file);
  const imports = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^;'"\n]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  const paths = new Set();
  for (const pattern of patterns) for (const match of content.matchAll(pattern)) {
    paths.add(match[1]);
  }
  for (const target of paths) {
    if (fromLayer === 'domain' && /^(?:node:)?(?:fs(?:\/promises)?|child_process|http|https|net|process|timers(?:\/promises)?|rxjs(?:\/|$))/.test(target)) {
      violations.push({ kind: 'forbidden-module', file: relFile, target,
        reason: 'Domínio não deve depender de IO, timers nem RxJS' });
    }
    if (!target.startsWith('.')) continue;
    const base = resolve(dirname(file), target);
    const candidates = extname(base)
      ? [base, base.replace(/\.js$/, '.ts'), base.replace(/\.mjs$/, '.mts')]
      : [`${base}.ts`, `${base}.tsx`, `${base}.js`, resolve(base, 'index.ts')];
    const dest = candidates.find(candidate => fileSet.has(candidate)) ?? base;
    const toLayer = layer(dest);
    if (fromLayer && toLayer && forbidden.get(fromLayer)?.has(toLayer)) {
      violations.push({ kind: 'layer', file: relFile,
        target: relative(root, dest).split(sep).join('/'),
        reason: `${fromLayer} não pode importar ${toLayer}` });
    }
    if (fileSet.has(dest)) imports.add(dest);
  }
  // Verificações heurísticas adicionais, sem pretensão de provar pureza de função.
  if (fromLayer === 'domain' || fromLayer === 'application') {
    const checks = [
      ['console', /\bconsole\s*\./g, 'Console não pertence à camada de domínio/aplicação'],
      ['random', /\bMath\s*\.\s*random\s*\(/g, 'Sorteio deve ficar na infraestrutura'],
      ['timer', /\b(?:setTimeout|setInterval|fetch)\s*\(/g, 'Timer, fetch ou IO direto na camada']
    ];
    if (fromLayer === 'domain') {
      checks.push(['clock', /\b(?:Date\s*\.\s*now\s*\(|new\s+Date\s*\()/g,
        'Relógio/tempo corrente não deve ser lido pelo domínio']);
      checks.push(['process', /\bprocess\s*\./g, 'Domínio não pode depender do processo']);
    }
    for (const [kind, pattern, reason] of checks) {
      if (pattern.test(content)) violations.push({ kind: `side-effect-${kind}`, file: relFile,
        target: null, reason });
    }
  }
  graph.set(file, [...imports]);
}
const visited = new Set(), stack = [], onStack = new Set(), seen = new Set();
function visit(node) {
  visited.add(node); stack.push(node); onStack.add(node);
  for (const dest of graph.get(node) ?? []) {
    if (!visited.has(dest)) visit(dest);
    else if (onStack.has(dest)) {
      const cycle = stack.slice(stack.indexOf(dest)).concat(dest).map(p => relative(root, p).split(sep).join('/'));
      const signature = [...new Set(cycle.slice(0, -1))].sort().join('|');
      if (!seen.has(signature)) {
        seen.add(signature);
        violations.push({ kind: 'cycle', file: cycle[0], target: cycle.at(-1),
          reason: cycle.join(' -> ') });
      }
    }
  }
  stack.pop(); onStack.delete(node);
}
for (const file of files) if (!visited.has(file)) visit(file);
const result = {
  scannedFiles: files.length, violationCount: violations.length, violations,
  coverage: 'Imports literais, ciclos e indícios de efeitos colaterais; não equivale a revisão semântica/AST.'
};
if (asJson) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Arquitetura: ${files.length} arquivo(s), ${violations.length} violação(ões)`);
  for (const v of violations) console.error(` - ${v.file} -> ${v.target ?? '(local)'}: ${v.reason}`);
}
process.exitCode = violations.length ? 1 : 0;

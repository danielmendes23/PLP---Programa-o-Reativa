/** Prepara dois ambientes cegos, sem copiar a solução pronta ou testes externos. */
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const arg = (key, defaultValue) => args.includes(key) ? args[args.indexOf(key) + 1] : defaultValue;
const trial = arg('--trial', 'trial-01');
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,48}$/.test(trial)) throw Error('Nome do trial inválido.');
const destination = join(root, 'runs', trial);
if (existsSync(destination)) throw Error(`Diretório existente: ${destination}. Use outro --trial; nunca apague evidências.`);
mkdirSync(destination, { recursive: true });
for (const condition of ['baseline', 'with-harness']) {
  const target = join(destination, condition);
  cpSync(join(root, 'experiment', 'seed'), target, { recursive: true });
  cpSync(join(root, 'evaluation', 'prompts', 'functional-requirements.md'),
    join(target, 'PROMPT.md'));
  if (condition === 'with-harness') {
    cpSync(join(root, 'experiment', 'harness-overlay', 'AGENTS.md'), join(target, 'AGENTS.md'));
    cpSync(join(root, 'experiment', 'harness-overlay', 'ARCHITECTURE.md'), join(target, 'ARCHITECTURE.md'));
    cpSync(join(root, 'eslint.config.mjs'), join(target, 'eslint.config.mjs'));
    cpSync(join(root, '.dependency-cruiser.cjs'), join(target, '.dependency-cruiser.cjs'));
    cpSync(join(root, 'tests', 'unit'), join(target, 'tests', 'unit'), { recursive: true });
    const pkgPath = join(target, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    Object.assign(pkg.scripts, {
      lint: 'eslint src tests/unit',
      arch: 'dependency-cruiser --config .dependency-cruiser.cjs src',
      validate: 'npm run typecheck && npm run lint && npm run arch && npm run test'
    });
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}
console.log(`Preparados ${destination}/baseline e ${destination}/with-harness`);
console.log('IMPORTANTE: execute agentes em sessões independentes e com o PROMPT.md idêntico.');
console.log('Nenhuma implementação ou teste externo foi copiado para os workspaces.');

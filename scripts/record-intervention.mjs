/** Registro explícito das intervenções humanas, sem confundir com correções automáticas. */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const args = process.argv.slice(2);
const value = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
const trial = value('--trial') ?? 'trial-01';
const condition = value('--run');
if (!/^[\w-]{1,49}$/.test(trial) || !['baseline', 'with-harness'].includes(condition))
  throw Error('Uso: npm run experiment:record -- --trial trial-01 --run baseline|with-harness --reason "descrição" OU --confirm-zero');
const zero = args.includes('--confirm-zero');
const reason = value('--reason');
if (zero === Boolean(reason)) throw Error('Escolha --reason ou --confirm-zero, não ambos.');
const results = resolve('evaluation/results');
mkdirSync(results, { recursive: true });
const file = join(results, `${trial}-${condition}-interventions.jsonl`);
if (zero && existsSync(file)) throw Error('Arquivo já existe: não confirme zero sobre registro anterior.');
const entry = { type: zero ? 'confirmed_zero' : 'intervention',
  ...(reason ? { reason } : {}), recordedAt: new Date().toISOString() };
if (zero) writeFileSync(file, JSON.stringify(entry) + '\n');
else appendFileSync(file, JSON.stringify(entry) + '\n');
console.log(`Registro criado: ${file}`);

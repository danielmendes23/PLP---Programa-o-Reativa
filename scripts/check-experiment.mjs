/** Verifica se o kit pode criar execuções independentes sem expor solução. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const p = name => resolve(name);
const checks = [
  ['seed/contrato', 'experiment/seed/src/domain/types.ts'],
  ['prompt comum', 'evaluation/prompts/functional-requirements.md'],
  ['orientações harness', 'experiment/harness-overlay/AGENTS.md'],
  ['arquitetura harness', 'experiment/harness-overlay/ARCHITECTURE.md'],
  ['aceitação independente', 'evaluation/acceptance/monitor.acceptance.test.ts'],
  ['aceitação de aleatoriedade', 'evaluation/acceptance/simulator.acceptance.test.ts'],
  ['registro de sessão', 'scripts/record-session.mjs'],
  ['avaliador', 'scripts/evaluate-experiment.mjs'],
];
const errors = checks.filter(([,path]) => !existsSync(p(path))).map(([name]) => `falta ${name}`);
const seed = readdirSync(p('experiment/seed/src'), { recursive: true }).join(' ');
if (seed.includes('monitor.ts') || seed.includes('temperature-policy.ts'))
  errors.push('seed vazou implementação de referência');
const prompt = readFileSync(p('evaluation/prompts/functional-requirements.md'), 'utf8');
if (!prompt.includes('monitorReadings')) errors.push('prompt não define contrato de monitoramento');
if (!prompt.includes('makeDemoReadings')) errors.push('prompt não define contrato testável do simulador');
const architecture = readFileSync(p('experiment/harness-overlay/ARCHITECTURE.md'), 'utf8');
if (architecture.includes('gerador determinístico de leituras para demonstração')) errors.push('arquitetura contradiz aleatoriedade');
console.log(errors.length ? errors.join('\n') : 'Preparação experimental: OK (arquivos e isolamento básico).');
process.exitCode = errors.length ? 1 : 0;

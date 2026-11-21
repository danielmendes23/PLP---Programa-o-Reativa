/** Avaliação comum às condições, sem alterar permanentemente os workspaces. */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const get = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const trial = get('--trial', 'trial-02'), reportId = get('--report-id', trial);
const fallbackModel = get('--model', 'não informado');
if (!/^[\w-]{1,49}$/.test(trial)) throw Error('trial inválido');
if (!/^[\w-]{1,49}$/.test(reportId)) throw Error('report-id inválido');
// --trial identifica os workspaces existentes; --report-id nomeia novos relatórios,
// permitindo reavaliar sem apagar nem modificar resultados históricos.

const outDir = join(root, 'evaluation', 'results');
mkdirSync(outDir, { recursive: true });
// Reexecuções não podem apagar resultados de um experimento anterior.
for (const name of ['baseline', 'with-harness']) {
  const prefix = `${reportId}-${name}`;
  for (const suffix of ['-score.json', '-vitest.json', '-source-manifest.json']) {
    if (existsSync(join(outDir, `${prefix}${suffix}`)))
      throw Error(`Resultados anteriores detectados (${prefix}${suffix}). Preserve o trial e use outro ID.`);
  }
  if (existsSync(join(outDir, `${prefix}-source`)))
    throw Error(`Snapshot existente: ${prefix}-source; use novo trial.`);
}

function command(cwd, bin, arguments_, logName) {
  const started = Date.now();
  const result = spawnSync(bin, arguments_, { cwd, encoding: 'utf8', timeout: 180000,
    shell: process.platform === 'win32', maxBuffer: 12 * 1024 * 1024 });
  const output = [result.stdout ?? '', result.stderr ?? '', result.error?.message ?? ''].join('\n');
  writeFileSync(join(outDir, logName), output);
  return { exitCode: result.status ?? -1, durationMs: Date.now() - started,
    output, error: result.error?.message ?? null };
}
function loadInterventions(name) {
  const file = join(outDir, `${trial}-${name}-interventions.jsonl`);
  if (!existsSync(file)) return { count: null, confirmed: false };
  const entries = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  const zero = entries.some(entry => entry.type === 'confirmed_zero');
  const interventions = entries.filter(entry => entry.type === 'intervention').length;
  if (zero && interventions) throw Error(`Intervenções inconsistentes: ${file}`);
  return { count: interventions, confirmed: zero || interventions > 0 };
}
function safeJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}
function manifest(src) {
  const files = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        files.push({ path: path.slice(src.length + 1).replaceAll('\\', '/'),
          sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
          bytes: statSync(path).size });
      }
    }
  }
  walk(src);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { capturedAt: new Date().toISOString(), fileCount: files.length, files,
    note: 'Snapshot e SHA-256 do src gerado, para auditoria posterior. Não prova isolamento do agente.' };
}
function runCondition(name) {
  const cwd = join(root, 'runs', trial, name);
  if (!existsSync(join(cwd, 'package.json'))) throw Error(`Workspace ausente: ${cwd}; execute prepare.`);
  if (!existsSync(join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest')))
    throw Error(`Dependências não instaladas em ${cwd}. Execute npm install no diretório primeiro.`);
  const prefix = `${reportId}-${name}`;
  // Configurações externas iguais em ambas as condições; preservar o original caso exista.
  const extraEslint = join(cwd, '.evaluation-eslint.config.mjs');
  const extraTs = join(cwd, '.evaluation-tsconfig.json');
  const extraVitest = join(cwd, '.evaluation-vitest.config.mjs');
  const evalFolder = join(cwd, 'evaluation', 'acceptance');
  const externalTests = readdirSync(join(root, 'evaluation', 'acceptance')).filter(f => f.endsWith('.test.ts'));
  const acceptanceFiles = externalTests.map(f => join(evalFolder, f));
  if ([extraEslint, extraTs, extraVitest, ...acceptanceFiles].some(existsSync)) throw Error(`Arquivos temporários já existem: ${cwd}`);
  const evaluationFolderPreexisting = existsSync(evalFolder);
  mkdirSync(evalFolder, { recursive: true });
  const sharedTS = JSON.parse(readFileSync(join(root, 'experiment', 'seed', 'tsconfig.json'), 'utf8'));
  sharedTS.include = ['src/**/*.ts'];
  writeFileSync(extraTs, JSON.stringify(sharedTS, null, 2));
  cpSync(join(root, 'eslint.config.mjs'), extraEslint);
  for (const f of externalTests) cpSync(join(root, 'evaluation', 'acceptance', f), join(evalFolder, f));
  // Configuração explicitamente fornecida por --config: impede que a configuração
  // de testes gerada pelo agente (ex.: include: ['tests/**/*.test.ts']) oculte
  // os testes externos. A mesma configuração é usada nas duas condições.
  writeFileSync(extraVitest, `export default {
  test: {
    include: ['evaluation/acceptance/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    environment: 'node',
    globals: false,
    pool: 'forks',
    fileParallelism: false
  }
};\n`);
  let tests, typecheck, lint, arch;
  const vitestReportPath = join(outDir, `${prefix}-vitest.json`);
  const eslintReportPath = join(outDir, `${prefix}-eslint.json`);
  try {
    tests = command(cwd, 'npm', ['exec', '--', 'vitest', 'run', '--config', '.evaluation-vitest.config.mjs', '--reporter=json', `--outputFile=${vitestReportPath}`], `${prefix}-vitest.log`);
    typecheck = command(cwd, 'npm', ['exec', '--', 'tsc', '--project', '.evaluation-tsconfig.json'], `${prefix}-tsc.log`);
    lint = command(cwd, 'npm', ['exec', '--', 'eslint', 'src', '--config', '.evaluation-eslint.config.mjs', '--format', 'json', '--output-file', eslintReportPath], `${prefix}-eslint.log`);
    arch = command(root, 'node', ['scripts/check-architecture.mjs', join(cwd, 'src'), '--json'], `${prefix}-architecture.log`);
  } finally {
    for (const tempFile of [extraEslint, extraTs, extraVitest, ...acceptanceFiles]) rmSync(tempFile, { force: true });
    if (!evaluationFolderPreexisting && existsSync(evalFolder) && readdirSync(evalFolder).length === 0)
      rmSync(evalFolder, { recursive: true });
    // Nunca remover arquivos que o agente tenha criado na pasta evaluation/.
  }
  const testReport = safeJson(vitestReportPath);
  // O Vitest pode emitir JSON aparentemente válido com 0/0 testes.
  // Isso é falha da infraestrutura, não 0 falhas da implementação.
  const discoveredNames = (Array.isArray(testReport?.testResults) ? testReport.testResults : [])
    .map(item => String(item.name ?? '').replaceAll('\\', '/'));
  const missingSuites = externalTests.filter(f => !discoveredNames.some(n =>
    n.endsWith(`/evaluation/acceptance/${f}`)));
  const discoveryValid = Number.isInteger(testReport?.numTotalTests) &&
    testReport.numTotalTests > 0 && missingSuites.length === 0;
  const lintReport = safeJson(eslintReportPath);
  let archReport; try { archReport = JSON.parse(arch.output); } catch { archReport = null; }
  const human = loadInterventions(name);
  const session = safeJson(join(outDir, `${trial}-${name}-session.json`));
  const src = join(cwd, 'src');
  const sourceManifest = manifest(src);
  if (existsSync(src)) cpSync(src, join(outDir, `${prefix}-source`), { recursive: true });
  writeFileSync(join(outDir, `${prefix}-source-manifest.json`), JSON.stringify(sourceManifest, null, 2) + '\n');
  const model = session?.model ?? fallbackModel;
  const modelIdentified = session ? Boolean(session.modelIdentified) :
    !/^(auto|github[ -]?copilot|copilot|desconhecido|não identificado|nao identificado|unknown|não informado)/i.test(model);
  const transcriptAvailable = existsSync(join(outDir, `${trial}-${name}-transcript.txt`));
  const result = {
    trial, reportId, condition: name, model, modelIdentified,
    sessionMetadataAvailable: Boolean(session), sessionTool: session?.tool ?? null,
    transcriptAvailable, sourceManifestFile: `${prefix}-source-manifest.json`,
    sourceSnapshot: `${prefix}-source`,
    sourceFileCount: sourceManifest.fileCount, collectedAt: new Date().toISOString(), nodeVersion: process.version,
    acceptance: {
      passed: discoveryValid ? testReport.numPassedTests : null,
      failed: discoveryValid ? testReport.numFailedTests : null,
      failedSuites: discoveryValid ? testReport.numFailedTestSuites : null,
      total: discoveryValid ? testReport.numTotalTests : null,
      rawTotal: testReport?.numTotalTests ?? null,
      exitCode: tests.exitCode, durationMs: tests.durationMs,
      reportAvailable: Boolean(testReport), discoveryValid,
      expectedSuites: externalTests.length,
      discoveredSuites: externalTests.length - missingSuites.length,
      missingSuites,
      infrastructureError: !discoveryValid
        ? 'Testes externos ausentes/incompletos: verificar o log do Vitest.' : null
    },
    typescript: { diagnostics: (typecheck.output.match(/error TS\d+:/g) ?? []).length,
      exitCode: typecheck.exitCode, durationMs: typecheck.durationMs },
    eslint: { errors: Array.isArray(lintReport) ? lintReport.reduce((n, e) => n + (e.errorCount ?? 0), 0) : null,
      warnings: Array.isArray(lintReport) ? lintReport.reduce((n, e) => n + (e.warningCount ?? 0), 0) : null,
      exitCode: lint.exitCode, durationMs: lint.durationMs },
    architecture: { violations: archReport?.violationCount ?? null, exitCode: arch.exitCode, durationMs: arch.durationMs },
    humanInterventions: human.count, interventionLogConfirmed: human.confirmed,
    logsPrefix: prefix, note: 'Metadados de modelo declarados pelo operador. Falhas de importação/suíte contam em failedSuites. Snapshots preservados.'
  };
  writeFileSync(join(outDir, `${prefix}-score.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(`${name}: ${JSON.stringify({ acceptance: result.acceptance, tsc: result.typescript,
    eslint: result.eslint, architecture: result.architecture, humanInterventions: result.humanInterventions })}`);
  return result;
}
console.log(`Avaliando os códigos de ${trial} com verificações independentes (relatório: ${reportId}).`);
const results = ['baseline', 'with-harness'].map(runCondition);
console.log(`Relatórios brutos salvos em ${outDir}`);
if (results.some(r => !r.acceptance.discoveryValid))
  console.error('ERRO DE INFRAESTRUTURA: algum conjunto de testes externos não foi descoberto. Confira *-vitest.log; esses dados NÃO devem ser comparados como 0 falhas.');
if (results.some(r => !r.acceptance.discoveryValid || r.acceptance.exitCode !== 0 || r.typescript.exitCode !== 0 ||
  r.eslint.exitCode !== 0 || r.architecture.exitCode !== 0))
  console.log('Uma ou mais verificações falharam: isto é um resultado experimental; consulte logs.');

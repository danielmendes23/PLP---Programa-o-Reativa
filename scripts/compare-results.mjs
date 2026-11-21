/** Tabela comparativa e alertas de qualidade dos dados, sem inferir causalidade. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2);
const trial = args.includes('--trial') ? args[args.indexOf('--trial') + 1] : 'trial-02';
if (!/^[\w-]{1,49}$/.test(trial)) throw Error('trial inválido');
const dir = resolve('evaluation/results');
const read = cond => {
  const path = join(dir, `${trial}-${cond}-score.json`);
  if (!existsSync(path)) throw Error(`Falta ${path}; execute npm run experiment:evaluate.`);
  return JSON.parse(readFileSync(path, 'utf8'));
};
const a = read('baseline'), b = read('with-harness');
const rows = [
  ['Testes independentes aprovados', a.acceptance.passed, b.acceptance.passed],
  ['Testes independentes reprovados', a.acceptance.failed, b.acceptance.failed],
  ['Total de testes disponíveis', a.acceptance.total, b.acceptance.total],
  ['Suítes de teste com falha', a.acceptance.failedSuites, b.acceptance.failedSuites],
  ['Diagnósticos TypeScript', a.typescript.diagnostics, b.typescript.diagnostics],
  ['Erros ESLint', a.eslint.errors, b.eslint.errors],
  ['Violações arquiteturais (auditoria comum)', a.architecture.violations, b.architecture.violations],
  ['Intervenções humanas registradas', a.humanInterventions, b.humanInterventions]
];
const fmt = value => value === null || value === undefined ? 'N/D' : String(value);
const ok = r => r.acceptance.reportAvailable && r.acceptance.total > 0 &&
  r.acceptance.discoveryValid !== false && r.eslint.errors !== null && r.architecture.violations !== null;
const warnings = [];
for (const result of [a, b]) {
  if (!result.acceptance.reportAvailable || result.acceptance.total === null ||
      result.acceptance.total === 0 || result.acceptance.discoveryValid === false)
    warnings.push(`${result.condition}: os testes independentes não foram todos descobertos/executados; avaliação INCONCLUSIVA, nunca 0/0 como sucesso.`);
}

if (!a.sessionMetadataAvailable || !b.sessionMetadataAvailable)
  warnings.push('Metadados de sessão ausentes em uma ou ambas as condições; documente o modelo, a ferramenta e as permissões.');
if (!a.modelIdentified || !b.modelIdentified)
  warnings.push('Modelo específico não identificado em uma ou ambas as condições (Auto/genérico não identifica o modelo real).');
if (a.model !== b.model)
  warnings.push(`Modelos declarados diferentes: baseline "${a.model}" / with-harness "${b.model}".`);
if (a.sessionTool && b.sessionTool && a.sessionTool !== b.sessionTool)
  warnings.push(`Ferramentas declaradas diferentes: "${a.sessionTool}" / "${b.sessionTool}".`);
if (!a.transcriptAvailable || !b.transcriptAvailable)
  warnings.push('Transcrição ausente em pelo menos uma condição; não é possível auditar o comportamento dos agentes.');
if (!a.interventionLogConfirmed || !b.interventionLogConfirmed)
  warnings.push('Intervenções humanas não confirmadas nas duas condições. Ausência de registro não significa zero.');
if (a.acceptance.exitCode !== 0 || b.acceptance.exitCode !== 0 ||
    a.typescript.exitCode !== 0 || b.typescript.exitCode !== 0 ||
    a.eslint.exitCode !== 0 || b.eslint.exitCode !== 0 ||
    a.architecture.exitCode !== 0 || b.architecture.exitCode !== 0)
  warnings.push('Uma ou mais verificações retornaram falha: examine os logs; falha da ferramenta é diferente de defeito da implementação.');
if (a.acceptance.total !== b.acceptance.total || a.acceptance.total === null || b.acceptance.total === null)
  warnings.push('Quantidade de testes diferente ou indisponível entre condições; resultados precisam de auditoria.');
const md = [
  `# Comparação real — ${trial}`, '',
  `Modelo declarado: ${a.model} (baseline) / ${b.model} (with-harness).`,
  `Ferramenta declarada: ${a.sessionTool ?? 'N/D'} / ${b.sessionTool ?? 'N/D'}.`, '',
  '| Métrica | Sem harness | Com harness |','|---|---:|---:|',
  ...rows.map(row => `| ${row[0]} | ${fmt(row[1])} | ${fmt(row[2])} |`),
  '',
  `Indicadores disponíveis: baseline ${ok(a) ? 'sim' : 'parcial'}; with-harness ${ok(b) ? 'sim' : 'parcial'}.`,
  '', '## Qualidade e limitações das evidências', '',
  ...(warnings.length ? warnings.map(w => `- **ATENÇÃO:** ${w}`) : ['- Nenhum aviso automático; ainda é necessária revisão humana da independência experimental.']),
  '',
  `- Snapshots do código: \`${trial}-baseline-source/\` e \`${trial}-with-harness-source/\`.`,
  '- Os arquivos *-source-manifest.json incluem os hashes SHA-256 dos arquivos avaliados.',
  '- O nome do modelo é autodeclarado: os scripts não conseguem inspecionar o modelo interno do Copilot.',
  '- A auditoria de arquitetura busca imports literais, ciclos e padrões de efeitos colaterais; não é prova formal de pureza.',
  '- A suíte externa adiciona testes do simulador aleatório, executados com geradores controlados.',
  '- N/D significa não disponível, nunca zero.',
  '- Tempos dos testes não equivalem a duração de programação do agente.',
  '- Uma execução por condição é evidência descritiva, não comprova diferença causal geral.',
  '- Preserve este trial e repita as execuções em novo ID, mantendo o protocolo.',
  '', '## Interpretação', '',
  'Preencha a interpretação após conferir logs, transcrições e código-fonte. Não declare vantagem estatística sem desenho experimental apropriado.', ''
].join('\n');
const output = join(dir, `${trial}-comparison.md`);
if (existsSync(output)) throw Error(`Comparação já existe em ${output}. Não sobrescreva resultados históricos.`);
writeFileSync(output, md);
console.log(`Comparação salva em: ${output}\n\n${md}`);

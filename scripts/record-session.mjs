/** Metadados DECLARADOS pelo operador, sem alegar descoberta automática de modelo. */
import { copyFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
const args = process.argv.slice(2);
const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const trial = value('--trial') ?? 'trial-02';
const condition = value('--run');
const model = value('--model');
const tool = value('--tool');
const mode = value('--mode') ?? 'Agent';
const permissions = value('--permissions') ?? 'não especificadas';
const notes = value('--notes') ?? '';
const sourceTranscript = value('--transcript');
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,48}$/.test(trial) ||
    !['baseline', 'with-harness'].includes(condition) || !model?.trim() || !tool?.trim()) {
  throw Error('Uso: npm run experiment:session -- --trial trial-02 --run baseline|with-harness --tool "VS Code Copilot" --model "NOME EXATO" [--mode Agent] [--permissions "..."] [--transcript "caminho.txt"] [--notes "..."]');
}
const root = resolve('evaluation/results');
mkdirSync(root, { recursive: true });
const destination = join(root, `${trial}-${condition}-session.json`);
const transcriptDest = join(root, `${trial}-${condition}-transcript.txt`);
if (existsSync(destination)) throw Error(`Metadados já existentes: ${destination}. Não sobrescreva; use outro trial.`);
if (sourceTranscript && existsSync(transcriptDest)) throw Error(`Transcrição já existente: ${transcriptDest}`);
if (sourceTranscript && (!existsSync(resolve(sourceTranscript)) || statSync(resolve(sourceTranscript)).size > 10 * 1024 * 1024))
  throw Error('Arquivo de transcrição não encontrado ou maior que 10 MB.');
const modelIdentified = !/^(auto|github[ -]?copilot|copilot|desconhecido|não identificado|nao identificado|unknown|não informado)/i.test(model.trim());
const metadata = {
  trial, condition, tool: tool.trim(), model: model.trim(), modelIdentified,
  mode: mode.trim(), permissions: permissions.trim(), notes: notes.trim(),
  transcript: sourceTranscript ? `${trial}-${condition}-transcript.txt` : null,
  transcriptPresent: Boolean(sourceTranscript),
  source: 'declaração humana (não verificada automaticamente)',
  recordedAt: new Date().toISOString()
};
if (sourceTranscript) copyFileSync(resolve(sourceTranscript), transcriptDest);
writeFileSync(destination, JSON.stringify(metadata, null, 2) + '\n');
console.log(`Registro salvo: ${destination}`);
if (!modelIdentified) console.warn('ATENÇÃO: modelo não identificado; isso limita a validade da comparação.');
if (!sourceTranscript) console.warn('Transcrição não fornecida; salve manualmente quando disponível.');

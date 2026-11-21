# Protocolo experimental — comparativo com vs. sem harness

## Pergunta
Um harness com instruções, regras verificáveis e feedback de testes reduz erros funcionais,
violações arquiteturais e intervenções humanas em uma tarefa pequena de programação reativa?

## Variável independente
- **baseline**: somente seed mínimo + prompt funcional idêntico, sem regras e testes visíveis do harness.
- **with-harness**: mesmo seed e prompt + AGENTS.md, ARCHITECTURE.md, ESLint,
  dependency-cruiser e testes internos de apoio.

## Variáveis dependentes
- Testes externos aprovados/falhos e falhas de suíte.
- Erros TypeScript em configuração de auditoria idêntica.
- Erros ESLint avaliados pela mesma configuração externa.
- Violações das mesmas regras de camadas (auditoria por imports).
- Quantidade de **intervenções humanas** registradas explicitamente (não contar correções da própria IA).
- Opcional: tokens, tempo total do agente, tentativas de reexecução (somente quando mensuráveis).

## Controles obrigatórios
1. Mesma versão exata de modelo, temperatura/configuração disponível e ferramentas, quando possível.
2. Mesmo conteúdo de `PROMPT.md`, copiado sem diferenças em ambas as execuções.
3. Sessões/contexts separados; nenhum acesso aos diretórios irmãos nem ao projeto de referência.
4. Mesmos recursos e limite de interações/tentativas; documentar caso diferente.
5. Workspaces começam sem `src/application/monitor.ts` e sem solução pronta.
6. Não entregar `evaluation/acceptance` antes de terminar as duas gerações.
7. Não editar código ou testes após ver o resultado da avaliação, a menos que seja um NOVO trial.
8. Arquivar transcrições, prompts, versões de Node/npm e dificuldades reais de instalação.

## Procedimento replicável
1. `npm run experiment:prepare -- --trial trial-02` (cria runs isolados).
2. Em cada run, `npm install` e em seguida executar o mesmo prompt com agentes INDEPENDENTES.
3. Salvar transcrição completa de cada sessão em `evaluation/results/` (sem segredos).
4. Registrar intervenções com `npm run experiment:record -- --trial trial-02 --run baseline --reason "..."`,
   ou `--confirm-zero` quando de fato não houve nenhuma intervenção.
5. Registrar separadamente cada sessão com `npm run experiment:session -- --trial trial-02 --run baseline --tool "VS Code Copilot" --model "NOME/VERSÃO"` (repita com `--run with-harness`), exportando a transcrição quando disponível.
6. Somente depois de ambos concluídos, executar `npm run experiment:evaluate -- --trial trial-02`.
7. `npm run experiment:compare -- --trial trial-02` gera a tabela comparativa.
8. Repetir o processo em `trial-03`, `trial-04` se o prazo permitir.

## Intervenção humana — definição operacional
Conta quando uma pessoa modifica manualmente o código, fornece uma dica corretiva extra,
resolve um erro para o agente, altera instruções ou decide usar solução alternativa.
Não conta quando o agente corrige seus próprios erros autonomamente nem o prompt inicial.
Registre cada ocorrência com descrição e fase, idealmente com o trecho relevante da transcrição.

## Interpretação
- **N/D** representa ausência de medição, jamais zero.
- Falha ao instalar dependências ou iniciar a suíte deve ser relatada separadamente; não
  pode ser interpretada como zero bugs.
- Os testes externos agora têm 13 casos (8 de domínio e 5 do simulador aleatório), mas uma falha de importação pode impedir todos de executar;
  a falha de suíte fica na coluna própria.
- O auditor de arquitetura nativo cobre imports literais e ciclos, não todas as formas de
  importação dinâmica; dependency-cruiser complementa o harness.
- Uma única execução por condição não permite inferência estatística causal. Repetições
  independentes fortalecem a análise descritiva, mas não garantem generalização.
- Avaliação não garante superioridade do harness; todos os resultados são válidos.

## Atualização da metodologia após o trial-01 (versão revisada)
- O `trial-01` foi coletado com **8** testes externos e é preservado como histórico; a bateria revisada tem **13** testes e não deve ser mesclada diretamente com os resultados anteriores.
- O mesmo prompt funcional atualizado exige `makeDemoReadings(rng = Math.random)` nas duas condições. A injeção de RNG permite testar limites e intervalos sem testes aleatórios instáveis.
- A auditoria independente agora checa também imports de módulos proibidos e alguns padrões de efeitos colaterais no domínio/aplicação; é heurística e pode ter falsos negativos.
- `experiment:session` armazena metadados declarados de modelo e ferramenta, além de cópia da transcrição quando fornecida. **Não descobre automaticamente o modelo.**
- O avaliador preserva cópias do código gerado (`*-source/`) e hashes SHA-256; a independência das sessões ainda depende de inspeção dos históricos.
- Para repetição metodologicamente coerente, use a mesma versão deste pacote em `trial-02`, `trial-03`, etc. A diferença principal entre os pares continua sendo presença/ausência do harness.

# Correções após análise do trial-01

As métricas antigas (8/8 versus 8/8) são válidas apenas para a bateria de testes antiga. Este pacote introduz uma **versão nova do protocolo**. Não sobrescreva a coleta passada nem compare diretamente 8/8 com 13/13.

| Problema detectado | Modificação aplicada | Limitação remanescente |
|---|---|---|
| Modelo não identificado | Novo `npm run experiment:session` por condição + alerta no relatório quando Auto/desconhecido | O operador deve consultar o modelo verdadeiro no Copilot; não há extração automática |
| Falta de histórico dos agentes | Importação opcional das transcrições para `evaluation/results/` | Exportar e revisar transcrições ainda é tarefa humana |
| Sem testes da aleatoriedade | Cinco novos testes externos; `makeDemoReadings(rng = Math.random)` permite testar limites e eventos | Os testes externos precisam de `npm install` e execução no computador do grupo |
| Contradição arquitetural | Corrigido `experiment/harness-overlay/ARCHITECTURE.md` | O `trial-01` antigo deve permanecer intacto |
| Auditoria limitada | Verificações extras de imports, RxJS proibido no domínio, console/sorteio/timer e ciclos | Auditoria heurística; revisão semântica continua necessária |
| Apenas um trial | Guia novo para `trial-02` e `trial-03`, com condições padronizadas | Os agentes devem ser executados novamente pelos participantes |

## Outras melhorias

- A avaliação agora salva **snapshots do código das duas versões** nas pastas `*-source/` e um manifesto com hashes SHA-256. Isso evita enviar um segundo ZIP apenas para analisar código.
- O avaliador recusa sobrescrever resultados existentes do mesmo trial.
- O relatório comparativo apresenta avisos explícitos sobre modelo desconhecido, sessões sem transcrição, intervenções não confirmadas e falhas de ferramentas.

## Verificação realizada antes do empacotamento

- `npm run offline`: **13 testes offline passaram** (6 da política + 7 do auditor), auditoria da referência com 0 violações, preparação experimental OK.
- `experiment:prepare -- --trial trial-02`: criação dos dois workspaces validada; `PROMPT.md` idêntico e nenhuma implementação pronta copiada.
- Comandos JavaScript novos verificados quanto à sintaxe; registro de sessão e relatório comparativo exercitados com dados de teste descartáveis.
- A suíte externa Vitest **não foi executada aqui** porque as dependências npm não estavam disponíveis. Execute `npm install && npm run validate` no seu computador antes de usar os agentes.

Comece por `docs/GUIA_TRIAL_02_CORRIGIDO.md`.

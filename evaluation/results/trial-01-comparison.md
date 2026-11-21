# Comparação real — trial-01

Modelo declarado: Claude Sonnet 4.6 (baseline) / Claude Sonnet 4.6 (with-harness).
Ferramenta declarada: Google Antigravity / Google Antigravity.

| Métrica | Sem harness | Com harness |
|---|---:|---:|
| Testes independentes aprovados | 13 | 13 |
| Testes independentes reprovados | 0 | 0 |
| Total de testes disponíveis | 13 | 13 |
| Suítes de teste com falha | 0 | 0 |
| Diagnósticos TypeScript | 0 | 0 |
| Erros ESLint | 0 | 0 |
| Violações arquiteturais (auditoria comum) | 0 | 0 |
| Intervenções humanas registradas | 0 | 0 |

Indicadores disponíveis: baseline sim; with-harness sim.

## Qualidade e limitações das evidências

- Nenhum aviso automático; ainda é necessária revisão humana da independência experimental.

- Snapshots do código: `trial-01-baseline-source/` e `trial-01-with-harness-source/`.
- Os arquivos *-source-manifest.json incluem os hashes SHA-256 dos arquivos avaliados.
- O nome do modelo é autodeclarado: os scripts não conseguem inspecionar o modelo interno do Copilot.
- A auditoria de arquitetura busca imports literais, ciclos e padrões de efeitos colaterais; não é prova formal de pureza.
- A suíte externa adiciona testes do simulador aleatório, executados com geradores controlados.
- N/D significa não disponível, nunca zero.
- Tempos dos testes não equivalem a duração de programação do agente.
- Uma execução por condição é evidência descritiva, não comprova diferença causal geral.
- Preserve este trial e repita as execuções em novo ID, mantendo o protocolo.

## Interpretação

Preencha a interpretação após conferir logs, transcrições e código-fonte. Não declare vantagem estatística sem desenho experimental apropriado.

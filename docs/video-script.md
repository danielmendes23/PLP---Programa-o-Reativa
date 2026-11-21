# Roteiro prático de vídeo (8–12 min, ajustável)

**Abertura (1 min):** problema e hipótese: harness pode orientar um agente e reduzir problemas?

**Domínio reativo (1–2 min):** eventos de sensores -> RxJS -> operador `scan`
-> política pura -> eventos `critical` e `normalized`. Mostrar `npm run demo` e explicar limiares.

**Harness (2 min):** mostrar `AGENTS.md`, `ARCHITECTURE.md`, ESLint,
`dependency-cruiser`, testes e `npm run validate`. Destacar arquitetura em camadas.

**Experimento (2 min):** mostrar `runs/trial-02/baseline` e `with-harness`,
prompts idênticos e transcrições de sessões independentes. Explicar isolamento.

**Resultados (2 min):** executar `npm run experiment:compare -- --trial trial-02` depois
de medir. Mostrar erros, violações e intervenções humanas. Sem números inventados.

**Conclusão (1 min):** discutir o que melhorou, o que não melhorou e limitações
(amostra pequena, diferenças estocásticas, disponibilidade das ferramentas).

**Na entrega:** repositório público, link do vídeo, README e evidências revisadas.

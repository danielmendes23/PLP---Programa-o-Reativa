# Situação da versão revisada — 20/11/2026

## Corrigido no pacote
- Contradição entre ARCHITECTURE.md e PROMPT.md sobre sorteios.
- Simulador de referência aceita RNG injetável para testes.
- 5 novos testes de aceitação do simulador; total **13 testes externos**, desde que `npm install` funcione.
- Auditoria comum com regras adicionais de módulos e padrões de efeitos colaterais, ainda heurística.
- Registro explícito de modelo/ferramenta/sessão e importação opcional da transcrição.
- Avaliação captura o código avaliado e hashes SHA-256 nas pastas de resultados.
- Resultados existentes não são sobrescritos em nova avaliação.

## Validação efetivamente realizada neste ambiente
- Testes offline e auditoria da implementação de referência, sem pacotes externos.
- Preparação básica dos ambientes, isolamento do seed e sintaxe dos scripts Node.

## Depende do computador do grupo
- `npm install`, `npm run demo`, `npm run validate` e a suíte externa com Vitest (se não estiverem disponíveis neste ambiente).
- Duas gerações independentes dos agentes usando o mesmo modelo exato e limites.
- Exportar transcrições e registrar modelo verdadeiro (o script não consulta o Copilot).
- Registrar intervenções humanas reais, analisar os resultados e gravar vídeo.

Comece em `docs/GUIA_TRIAL_02_CORRIGIDO.md`.

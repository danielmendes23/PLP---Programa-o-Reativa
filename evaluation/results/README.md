# Pasta de resultados

Arquivos de saída serão gerados aqui após o experimento. O `.gitignore` evita publicar
logs acidentalmente; selecione e adicione somente evidências revisadas, sem credenciais.

- `trial-02-baseline-score.json` e `trial-02-with-harness-score.json`: métricas reais.
- `trial-02-*-vitest.json`: resultados independentes de testes.
- `trial-02-*-tsc.log`, `*-eslint.json`, `*-architecture.log`: evidências brutas.
- `trial-02-*-interventions.jsonl`: intervenções humanas (ou confirmação de zero).
- `trial-02-comparison.md`: tabela comparativa gerada.

**Nenhuma pontuação real acompanha a distribuição do projeto**, pois as execuções
independentes ainda precisam ser feitas por vocês.

## Revisão após trial-01
- A versão revisada possui **13 testes externos**: 8 da lógica do monitor e 5 de simulação aleatória.
- Após `experiment:session`, serão armazenados `*-session.json` e `*-transcript.txt` (se fornecido).
- Após `experiment:evaluate`, o diretório contém `*-source/` (snapshot do código) e `*-source-manifest.json` (hashes), além dos logs.
- O avaliador **não sobrescreve** um resultado existente; use novo trial.
- Transcrições e arquivos `src` podem conter informações sensíveis; revise antes de compartilhar.

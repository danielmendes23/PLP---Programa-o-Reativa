# Experimento corrigido — guia simples (Windows PowerShell)

**Use este documento para a NOVA coleta.** O ZIP foi revisado depois da análise do `trial-01`. O teste agora tem **13 casos externos**: 8 da lógica de alertas + 5 sobre o simulador aleatório. **Não misture os números do trial-01 com os do trial-02 como se fossem a mesma bateria de testes.**

## Etapa 1 — Começar do zero

1. Extraia o ZIP atualizado em uma pasta nova (não mescle com a pasta antiga).
2. Abra **somente** a subpasta `reactive-ai-harness` no VS Code, com terminal **PowerShell**.
3. Confirme: `Test-Path .\package.json` deve retornar `True`.
4. Execute na raiz, nessa ordem:

```powershell
node --version
npm --version
npm run offline
npm install
npm run demo
npm run validate
```

- Node recomendado: 22.16+; o `npm run offline` não exige pacotes instalados.
- `npm run demo` deve mostrar temperaturas variáveis por faixa e **critical → normalized → critical**.
- `npm run validate` deve passar completamente ANTES de iniciar o experimento; registre qualquer falha.
- A pasta `src/` da raiz contém uma **referência**, não deve ser mostrada aos agentes experimentais.

## Etapa 2 — Criar ambientes independentes

```powershell
npm run experiment:prepare -- --trial trial-02
```

- `runs/trial-02/baseline`: sem regras/testes extras do harness.
- `runs/trial-02/with-harness`: mesmo prompt, mais instruções/regras/testes do harness.

Para instalar dependências em cada condição:

```powershell
Push-Location .\runs\trial-02\baseline
npm install
Pop-Location
Push-Location .\runs\trial-02\with-harness
npm install
Pop-Location
```

## Etapa 3 — Agentes: este passo NÃO é automático

Abra somente a pasta `runs/trial-02/baseline` em uma nova janela do VS Code. Em um chat **novo**, selecione manualmente o modelo específico. Faça exatamente o mesmo com `runs/trial-02/with-harness` em outra janela/chat novos. **Evite `Auto` se puder; não se pode inferir retrospectivamente qual modelo foi usado.** Mesmas permissões, limite de tentativas, ferramentas e prompt nas duas condições.

Copie **exatamente a mesma mensagem** para cada agente:

> Leia PROMPT.md deste workspace e implemente integralmente os requisitos. Trabalhe SOMENTE nos arquivos deste workspace. Não consulte nem altere arquivos externos, outros projetos ou a solução de referência. Não use web, MCP externo, subagentes ou skills externas, mesmo que as ferramentas estejam disponíveis. Use somente leitura/edição de arquivos locais e execução de terminal. Respeite as instruções locais do workspace quando existirem. Execute verificações disponíveis, tente corrigir autonomamente falhas e ao final relate os arquivos criados, comandos, erros e resultados reais. Não peça dicas corretivas que possa resolver sozinho.

Na primeira sessão, o agente não recebe `AGENTS.md`; na segunda, deve ler as regras presentes. O prompt comum e os requisitos de negócio continuam idênticos.

**Permissões no Copilot:** instruções de prompt não bloqueiam tecnicamente ferramentas; revise o histórico de ferramentas e registre desvios. Se o agente pedir aprovação de comando normal (`npm test`), isso não conta como ajuda corretiva. Não edite o código manualmente durante a execução sem registrar a intervenção.

Ao final, os dois arquivos devem existir:

```powershell
Test-Path .\runs\trial-02\baseline\src\application\monitor.ts
Test-Path .\runs\trial-02\with-harness\src\application\monitor.ts
Test-Path .\runs\trial-02\baseline\src\infrastructure\sensor-simulator.ts
Test-Path .\runs\trial-02\with-harness\src\infrastructure\sensor-simulator.ts
```

Todos devem retornar `True`. Isso **não comprova correção**, apenas existência.

## Etapa 4 — Registrar as duas sessões (NOVIDADE)

Exporte, quando disponível, o histórico completo de cada chat para arquivos `.txt` em um local à sua escolha. Não confunda apenas o relatório final do agente com a transcrição completa. Remova tokens e dados pessoais antes de compartilhar.

Volte ao PowerShell na pasta raiz e rode (substitua modelo e caminhos reais):

```powershell
npm run experiment:session -- --trial trial-02 --run baseline --tool "VS Code Copilot" --model "NOME EXATO DO MODELO" --mode "Agent" --permissions "arquivos locais e terminal" --transcript "C:\caminho\baseline.txt"

npm run experiment:session -- --trial trial-02 --run with-harness --tool "VS Code Copilot" --model "NOME EXATO DO MODELO" --mode "Agent" --permissions "arquivos locais e terminal" --transcript "C:\caminho\harness.txt"
```

Se **não tiver** as transcrições, omita o argumento `--transcript` (o relatório avisará). Se não souber o modelo, registre literalmente `--model "Auto (modelo não identificado)"`; **não invente** o nome. Os metadados são **declarados por vocês**, não lidos automaticamente do Copilot.

Se precisar indicar alguma divergência, acrescente `--notes "..."`. O script **não sobrescreve** registro de sessão existente.

## Etapa 5 — Registrar intervenções humanas

Só se REALMENTE não houve ajuda corretiva em nenhuma das condições:

```powershell
npm run experiment:record -- --trial trial-02 --run baseline --confirm-zero
npm run experiment:record -- --trial trial-02 --run with-harness --confirm-zero
```

Se houve dicas adicionais, correções manuais ou mudanças durante a execução, **não confirme zero**. Registre uma chamada por intervenção, por exemplo:

```powershell
npm run experiment:record -- --trial trial-02 --run baseline --reason "Orientei a correção de um import"
```

A aprovação de comandos normais e a autocorreção do próprio agente não são intervenções corretivas.

## Etapa 6 — Rodar avaliação independente e comparação

```powershell
npm run experiment:evaluate -- --trial trial-02
npm run experiment:compare -- --trial trial-02
```

O avaliador agora aplica a **mesma bateria de 13 testes** às duas condições, as mesmas verificações de TypeScript/ESLint/arquitetura, e guarda em `evaluation/results/`:

- relatório `trial-02-comparison.md` e arquivos `*-score.json`;
- logs e relatórios Vitest/ESLint;
- `trial-02-baseline-source/` e `trial-02-with-harness-source/` com **cópias do código realmente avaliado**;
- `*-source-manifest.json` com hashes SHA-256 desses arquivos;
- metadados `*-session.json`, registros de intervenções e eventuais transcrições.

**O mesmo trial não é sobrescrito silenciosamente.** Se precisar repetir a coleta, use `trial-03`. Não corrija os códigos depois de ver a nota para tentar melhorar o resultado do mesmo trial.

## Etapa 7 — Enviar resultados

Inspecione `evaluation/results/trial-02-comparison.md`, remova segredos das transcrições e confira os logs. A partir da raiz:

```powershell
Compress-Archive -Path .\evaluation\results\* -DestinationPath .\Results_trial-02.zip -Force
```

Envie `Results_trial-02.zip` aqui na conversa. A nova pasta de resultados já terá as duas cópias `src/` para auditoria do código.

## Avisos importantes

- **A revisão alterou os critérios de avaliação:** compare diretamente apenas condições executadas usando esta mesma versão.
- Ter 13/13 testes nas duas condições continua sendo um resultado possível e legítimo.
- Uma única repetição ainda não permite generalização estatística. Se houver tempo, repita o protocolo com `trial-03`.
- Capturar metadados e hashes não comprova autonomia da IA nem identidade do modelo: isso depende de registros e revisão humana.

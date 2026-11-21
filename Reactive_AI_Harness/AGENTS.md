# Instruções obrigatórias ao agente de desenvolvimento

Você está desenvolvendo um monitor reativo TypeScript / RxJS. Siga o prompt funcional recebido, sem inventar novos requisitos.

1. Respeite `ARCHITECTURE.md` e preserve o contrato em `src/domain/types.ts`.
2. Domínio = funções puras, sem RxJS, filesystem, console ou timers.
3. Aplicação = orquestração RxJS (scan/map/filter) sem importar infraestrutura ou apresentação.
4. Infraestrutura = simuladores/fontes de eventos. Apresentação = formatação para console.
5. Nunca ignore erros TypeScript, use `any`, desabilite lint, altere limites ou apague testes.
6. Prefira código pequeno e claro. Testes e lógica de domínio devem ser determinísticos; apenas o simulador de demonstração pode usar sorteios controlados conforme PROMPT.md. Não adicione dependências sem justificativa.
7. Implemente os requisitos e execute `npm run validate` depois de `npm install`.
8. Ao falhar, corrija o código e repita a validação; registre no relatório da sessão.
9. Não leia nem modifique arquivos fora deste workspace, especialmente testes de avaliação externos.
10. No final, relate arquivos criados, comandos usados e limitações reais; não invente testes aprovados.

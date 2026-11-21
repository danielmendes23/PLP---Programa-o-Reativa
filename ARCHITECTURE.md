# Arquitetura obrigatória (harness)

```text
sensor (infrastructure) -> application (RxJS) -> presentation (console)
                                  |
                                domain
```

- `src/domain`: contratos e política pura `advanceMonitor`, sem efeito colateral.
- `src/application`: `monitorReadings(Observable<TemperatureReading>)` produz `Observable<MonitorEvent>`.
- `src/infrastructure`: gerador de leituras aleatórias controladas para demonstração.
- `src/presentation`: formatação da saída (nenhuma regra de negócio).
- `src/main.ts`: composição de dependências.

**Restrições automáticas:** `domain` não importa `application`, `infrastructure` ou `presentation`;
`application` não importa `infrastructure` ou `presentation`; não são permitidos ciclos.

**Invariantes:** a terceira alta >=30 emite 1 alerta, inclusive ao 30 exato; ao ficar crítico,
o evento não se repete até chegar <28; um valor entre 28 e 30 interrompe contagem mas não normaliza;
leitura não finita interrompe contagem pendente sem normalizar; após normalização, é possível rearmar.

Execute `npm run validate` ao final; não mude o contrato nem o harness para passar nos testes.

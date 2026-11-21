# PROMPT IDÊNTICO PARA AS DUAS CONDIÇÕES

Implemente, neste workspace, um backend de monitoramento de temperatura **orientado a eventos**,
utilizando **TypeScript e RxJS**. Mantenha `src/domain/types.ts` como contrato público.

## Requisitos funcionais obrigatórios

1. Receba uma sequência ordenada de leituras do **mesmo sensor**, cada uma contendo `sensorId`,
   `temperature` (°C, número) e `timestamp` (milissegundos).
2. Emita um único evento `critical` exatamente na **terceira leitura consecutiva >= 30 °C**.
3. Enquanto o estado estiver crítico, não emita novos alertas críticos.
4. Emita `normalized` somente quando a temperatura cair **estritamente abaixo de 28 °C**.
5. Uma leitura `28 <= temperatura < 30` deve interromper a contagem pendente, mas não normalizar
   um alerta já ativo.
6. Valores de temperatura não finitos (`NaN`, `Infinity`) são inválidos; devem interromper a contagem
   pendente, sem emitir evento e sem normalizar um alerta ativo.
7. Após uma normalização, nova sequência de três altas deve poder emitir outro alerta.
8. Preserve no evento o sensorId, o valor e o timestamp da leitura que disparou o evento.
9. Crie um simulador de demonstração com **11 leituras aleatórias controladas**, sem aleatoriedade
   na lógica de domínio. A sequência de faixas, nesta ordem, é:
   `[24..27, 30..36, 30..36, 30..36, 30..36, 28..29, 28, 24..27, 30..36, 30..36, 30..36]`.
   Sorteie inteiros inclusivos dentro de cada faixa a cada execução, preservando a ordem das
   faixas. A demonstração deverá emitir **`critical`, `normalized`, `critical`** nessa ordem,
   sem repetir `critical` enquanto o alerta estiver ativo. Use o mesmo sensor e timestamps
   iniciando em `2026-01-01T12:00:00Z`, separados de 1 segundo; apresente os eventos no terminal.
   Os testes do domínio **não** devem depender dos sorteios da demonstração.
   Para tornar o simulador testável, exporte `makeDemoReadings(rng: () => number = Math.random): TemperatureReading[]` de `src/infrastructure/sensor-simulator.ts`.
   A função deve usar o gerador `rng` para cada faixa sorteável (inteiros inclusivos); com `rng() === 0` retorna os limites inferiores, e com `rng() === 0.999999` retorna os superiores. O valor fixo da sétima posição permanece 28. Por padrão, use `Math.random` para que execuções da demonstração possam variar.

## Contratos técnicos mínimos

- Exporte **`monitorReadings(readings$: Observable<TemperatureReading>): Observable<MonitorEvent>`**
  em **`src/application/monitor.ts`**. Essa é a entrada de avaliação automatizada.
- Mantenha os tipos `TemperatureReading` e `MonitorEvent` disponíveis em `src/domain/types.ts`.
- A demonstração deve ser executável por `npm run demo`.
- Não altere os limites, nomes dos tipos ou o caminho da função pública para contornar testes.

## Entrega solicitada ao agente

Implemente os arquivos necessários, execute as verificações que estiverem disponíveis neste
workspace e, ao final, informe: arquivos modificados, verificações executadas, sucessos,
falhas e ajustes realizados. Não invente resultados.

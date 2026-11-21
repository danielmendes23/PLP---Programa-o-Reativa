import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/check-architecture.mjs');
function fixture(code, layer = 'domain') {
  const base = mkdtempSync(join(tmpdir(), 'arch-harness-'));
  const dir = join(base, 'src', layer);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'policy.ts'), code);
  const result = spawnSync(process.execPath, [script, join(base, 'src'), '--json'], {
    encoding: 'utf8', timeout: 8000
  });
  rmSync(base, { recursive: true, force: true });
  return { code: result.status, report: JSON.parse(result.stdout) };
}
test('auditor aceita domínio puro', () => {
  const result = fixture('export const add = (x: number) => x + 1;');
  assert.equal(result.code, 0);
  assert.equal(result.report.violationCount, 0);
});
test('auditor detecta console no domínio', () => {
  const result = fixture('console.log("erro");');
  assert.notEqual(result.code, 0);
  assert.ok(result.report.violations.some(v => v.kind === 'side-effect-console'));
});
test('auditor detecta RxJS importado pelo domínio', () => {
  const result = fixture('import { from } from "rxjs";');
  assert.ok(result.report.violations.some(v => v.kind === 'forbidden-module'));
});
test('auditor detecta sorteios na aplicação', () => {
  const result = fixture('const n = Math.random();', 'application');
  assert.ok(result.report.violations.some(v => v.kind === 'side-effect-random'));
});
test('auditor não penaliza comentários sobre console', () => {
  const result = fixture('// console.log("exemplo");\nexport const n = 1;');
  assert.equal(result.report.violationCount, 0);
});
function fixtureFiles(files) {
  const base = mkdtempSync(join(tmpdir(), 'arch-harness-multiple-'));
  const src = join(base, 'src');
  for (const [file, content] of Object.entries(files)) {
    const path = join(src, file);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  const result = spawnSync(process.execPath, [script, src, '--json'], { encoding: 'utf8', timeout: 8000 });
  rmSync(base, { recursive: true, force: true });
  return { code: result.status, report: JSON.parse(result.stdout) };
}
test('auditor detecta importação de infraestrutura pelo domínio', () => {
  const result = fixtureFiles({
    'domain/policy.ts': 'import { thing } from "../infrastructure/source.ts"; export const x = thing;',
    'infrastructure/source.ts': 'export const thing = 1;'
  });
  assert.ok(result.report.violations.some(v => v.kind === 'layer'));
  assert.notEqual(result.code, 0);
});
test('auditor detecta ciclo entre módulos locais', () => {
  const result = fixtureFiles({
    'application/a.ts': 'import { b } from "./b.ts"; export const a = b;',
    'application/b.ts': 'import { a } from "./a.ts"; export const b = a;'
  });
  assert.ok(result.report.violations.some(v => v.kind === 'cycle'));
});

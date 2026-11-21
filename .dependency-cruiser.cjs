/** Regras orientadas a camadas, bloqueadas por exit code != 0. */
module.exports = {
  forbidden: [
    { name: 'dominio-nao-depende-de-camadas', severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/(application|infrastructure|presentation)/' } },
    { name: 'aplicacao-nao-depende-de-infra', severity: 'error',
      from: { path: '^src/application/' },
      to: { path: '^src/(infrastructure|presentation)/' } },
    { name: 'sem-dependencias-circulares', severity: 'error',
      from: {}, to: { circular: true } }
  ],
  options: { doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: 'node_modules' }
};

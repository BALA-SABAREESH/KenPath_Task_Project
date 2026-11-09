const esbuild = require('esbuild');

module.exports = {
  process(sourceText, sourcePath) {
    const result = esbuild.transformSync(sourceText, {
      loader: 'ts',
      format: 'cjs',
      target: 'node18',
      sourcemap: 'inline',
      sourcefile: sourcePath,
    });
    return { code: result.code };
  },
};

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Reutiliza as dependências e versões já instaladas no backend.
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const { default: tsconfigPaths } = await import(
  pathToFileURL(require.resolve('vite-tsconfig-paths')).href
);
const { dependencies, devDependencies } = require('./package.json');

export default {
  root: fileURLToPath(new URL('../../backend/', import.meta.url)),
  plugins: [
    tsconfigPaths({
      projects: [fileURLToPath(new URL('../../backend/tsconfig.json', import.meta.url))],
    }),
  ],
  resolve: {
    dedupe: Object.keys({ ...dependencies, ...devDependencies }),
  },
  test: {
    globals: true,
    include: ['../qa/backend/unit/**/*.spec.ts'],
    coverage: {
      reportsDirectory: '../qa/coverage/backend/unit',
    },
  },
};

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Usa a mesma instalação de React da aplicação e mantém a versão do Vitest.
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { default: react } = await import(
  pathToFileURL(require.resolve('@vitejs/plugin-react')).href
);
const { dependencies, devDependencies } = require('./package.json');

export default {
  root: fileURLToPath(new URL('../../frontend/', import.meta.url)),
  plugins: [react()],
  resolve: {
    dedupe: Object.keys({ ...dependencies, ...devDependencies }),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['../qa/frontend/setupTests.ts'],
    include: ['../qa/frontend/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      reportsDirectory: '../qa/coverage/frontend',
    },
  },
};

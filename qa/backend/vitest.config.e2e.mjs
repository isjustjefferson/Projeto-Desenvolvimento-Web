import config from './vitest.config.mjs';

export default {
  ...config,
  test: {
    ...config.test,
    include: ['../qa/backend/e2e/**/*.e2e-spec.ts'],
    coverage: {
      reportsDirectory: '../qa/coverage/backend/e2e',
    },
  },
};

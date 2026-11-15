import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sem `globals: true` no Vitest, o auto-cleanup do Testing Library não é
// registrado — limpo o DOM explicitamente para não vazar entre testes.
afterEach(() => {
  cleanup();
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnaliseOcrAnexo } from '../../../frontend/src/components/AnaliseOcrAnexo';
import { get, post } from '../../../frontend/src/api/client';

vi.mock('../../../frontend/src/api/client', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../frontend/src/api/client')>(),
  get: vi.fn(),
  post: vi.fn(),
}));

function renderizarAnexo() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={cliente}>
      <AnaliseOcrAnexo chamadoId={25} despesaId={10} anexoId={3} />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.resetAllMocks());

describe('análise fiscal no computador', () => {
  const caminho = '/chamados/25/despesas/10/anexos/3/ocr';

  it('solicita a análise do anexo e mostra itens sugeridos para conferência', async () => {
    vi.mocked(get).mockResolvedValue({ habilitado: true, trabalho: null });
    vi.mocked(post).mockResolvedValue({
      habilitado: true,
      trabalho: {
        id: 1,
        estado: 'CONCLUIDO',
        resultado: { texto: 'Tomada 2 unidades', itens: [{ descricao: 'Tomada', quantidade: '2' }] },
      },
    });
    renderizarAnexo();

    expect(get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'OCR no computador' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar imagem para análise' }));
    expect(await screen.findByText('Itens sugeridos para conferência')).toBeInTheDocument();
    expect(screen.getByText(/Tomada · Qtd\. 2/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(caminho, undefined, expect.anything());
  });
});

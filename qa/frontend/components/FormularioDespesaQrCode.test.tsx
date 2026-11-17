import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { FormularioDespesa } from '../../../frontend/src/components/FormularioDespesa';
import { lerQrCodeDeImagem } from '../../../frontend/src/qrcode';

// Chave de NFC-e (modelo 65 nos dígitos 21-22)
const CHAVE = '35261112345678000190650010000001231000012345';
const QR_NFCE = `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${CHAVE}|2|1|1|ABC123`;

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mantém a extração da chave real; só a leitura da imagem (canvas) é simulada
vi.mock('../../../frontend/src/qrcode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../frontend/src/qrcode')>()),
  lerQrCodeDeImagem: vi.fn(),
}));

// A câmera é substituída por um botão que simula a leitura do texto informado
const leitura = vi.hoisted(() => ({ texto: '' }));
vi.mock('../../../frontend/src/components/LeitorQrCode', () => ({
  LeitorQrCode: ({ onLido }: { onLido: (t: string) => void }) => (
    <button type="button" onClick={() => onLido(leitura.texto)}>
      simular leitura
    </button>
  ),
}));

function renderFormulario() {
  render(<FormularioDespesa salvando={false} onSalvar={vi.fn()} />);
  return {
    usuario: userEvent.setup(),
    tipoDoc: () =>
      screen.getByLabelText<HTMLSelectElement>(
        'Tipo de documento fiscal (opcional)',
      ),
    chave: () => screen.queryByLabelText<HTMLInputElement>(/Chave de acesso/),
    anexar: (arquivo: File) =>
      userEvent.upload(screen.getByLabelText(/Adicionar arquivo/), arquivo),
  };
}

beforeEach(() => {
  vi.mocked(lerQrCodeDeImagem).mockReset().mockResolvedValue(null);
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('FormularioDespesa — QR Code pela câmera', () => {
  it('preenche a chave e o tipo de documento a partir do QR da NFC-e', async () => {
    leitura.texto = QR_NFCE;
    const { usuario, tipoDoc, chave } = renderFormulario();

    await usuario.click(
      screen.getByRole('button', { name: /Ler QR Code com a câmera/ }),
    );
    await usuario.click(
      screen.getByRole('button', { name: 'simular leitura' }),
    );

    expect(tipoDoc().value).toBe('NFCE');
    expect(chave()?.value).toBe(CHAVE.replace(/(\d{4})(?=\d)/g, '$1 '));
    expect(toast.success).toHaveBeenCalled();
    // o leitor fecha depois de ler
    expect(
      screen.queryByRole('button', { name: 'simular leitura' }),
    ).not.toBeInTheDocument();
  });

  it('avisa quando o QR lido não é de nota fiscal', async () => {
    leitura.texto = 'https://exemplo.com.br/promocao';
    const { usuario, tipoDoc, chave } = renderFormulario();

    await usuario.click(
      screen.getByRole('button', { name: /Ler QR Code com a câmera/ }),
    );
    await usuario.click(
      screen.getByRole('button', { name: 'simular leitura' }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/não traz a chave de acesso/),
    );
    expect(tipoDoc().value).toBe('');
    expect(chave()).not.toBeInTheDocument();
  });
});

describe('FormularioDespesa — QR Code em foto anexada', () => {
  it('lê o QR da foto e preenche a chave sozinho', async () => {
    vi.mocked(lerQrCodeDeImagem).mockResolvedValue(QR_NFCE);
    const { tipoDoc, chave, anexar } = renderFormulario();

    await anexar(new File(['img'], 'cupom.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(tipoDoc().value).toBe('NFCE'));
    expect(chave()?.value.replace(/\s/g, '')).toBe(CHAVE);
    expect(await screen.findByText('cupom.jpg')).toBeInTheDocument();
  });

  it('foto sem QR de nota só vira anexo, sem aviso de erro', async () => {
    vi.mocked(lerQrCodeDeImagem).mockResolvedValue(null);
    const { tipoDoc, anexar } = renderFormulario();

    await anexar(new File(['img'], 'recibo.png', { type: 'image/png' }));

    expect(await screen.findByText('recibo.png')).toBeInTheDocument();
    expect(tipoDoc().value).toBe('');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('não tenta ler QR de PDF', async () => {
    const { anexar } = renderFormulario();
    await anexar(new File(['%PDF'], 'nota.pdf', { type: 'application/pdf' }));
    await screen.findByText('nota.pdf');
    expect(lerQrCodeDeImagem).not.toHaveBeenCalled();
  });

  it('não sobrescreve uma chave já preenchida', async () => {
    const { usuario, tipoDoc, chave, anexar } = renderFormulario();
    await usuario.selectOptions(tipoDoc(), 'NFE');
    await usuario.type(chave()!, '1111');

    await anexar(new File(['img'], 'cupom.jpg', { type: 'image/jpeg' }));

    await screen.findByText('cupom.jpg');
    expect(lerQrCodeDeImagem).not.toHaveBeenCalled();
    expect(chave()?.value).toBe('1111');
  });
});

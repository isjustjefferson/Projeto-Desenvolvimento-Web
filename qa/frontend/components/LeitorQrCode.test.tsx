import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LeitorQrCode } from '../../../frontend/src/components/LeitorQrCode';
import { lerQrCodeDeVideo } from '../../../frontend/src/qrcode';

vi.mock('../../../frontend/src/qrcode', () => ({
  lerQrCodeDeVideo: vi.fn(),
}));

const mediaOriginal = Object.getOwnPropertyDescriptor(
  navigator,
  'mediaDevices',
);

function definirCamera(getUserMedia?: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: getUserMedia ? { getUserMedia } : undefined,
  });
}

function streamFalso() {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  return { stream, stop };
}

beforeEach(() => {
  vi.mocked(lerQrCodeDeVideo).mockReset().mockResolvedValue(null);
  // jsdom não reproduz vídeo
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  if (mediaOriginal)
    Object.defineProperty(navigator, 'mediaDevices', mediaOriginal);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
  vi.restoreAllMocks();
});

describe('LeitorQrCode', () => {
  it('explica que a câmera exige HTTPS quando o navegador não a oferece', () => {
    definirCamera(undefined);
    render(<LeitorQrCode onLido={vi.fn()} onFechar={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/HTTPS/);
  });

  it('avisa quando a permissão da câmera é negada', async () => {
    definirCamera(() =>
      Promise.reject(new DOMException('negado', 'NotAllowedError')),
    );
    render(<LeitorQrCode onLido={vi.fn()} onFechar={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Permissão da câmera negada/,
    );
  });

  it('entrega o texto do QR e desliga a câmera ao ler', async () => {
    const { stream, stop } = streamFalso();
    definirCamera(() => Promise.resolve(stream));
    vi.mocked(lerQrCodeDeVideo)
      .mockResolvedValueOnce(null)
      .mockResolvedValue('https://nfce.exemplo/qrcode?p=123');
    const onLido = vi.fn();
    render(<LeitorQrCode onLido={onLido} onFechar={vi.fn()} />);

    await waitFor(() =>
      expect(onLido).toHaveBeenCalledWith('https://nfce.exemplo/qrcode?p=123'),
    );
    expect(onLido).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalled();
  });

  it('cancelar fecha o leitor e desliga a câmera', async () => {
    const { stream, stop } = streamFalso();
    definirCamera(() => Promise.resolve(stream));
    const onFechar = vi.fn();
    const { unmount } = render(
      <LeitorQrCode onLido={vi.fn()} onFechar={onFechar} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    expect(onFechar).toHaveBeenCalled();

    unmount();
    await waitFor(() => expect(stop).toHaveBeenCalled());
  });
});

import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { lerQrCodeDeVideo } from '../qrcode';

interface Props {
  // Recebe o texto bruto do QR Code (para NFC-e, um link com a chave de acesso)
  onLido: (texto: string) => void;
  onFechar: () => void;
}

const SEM_SUPORTE =
  'A câmera só abre em HTTPS (ou em localhost). Neste acesso, anexe uma foto ' +
  'da nota: o QR Code também é lido da imagem.';

function mensagemDeErroCamera(erro: unknown): string {
  const nome = erro instanceof DOMException ? erro.name : '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'Permissão da câmera negada. Libere o acesso nas configurações do navegador e tente de novo.';
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return 'Nenhuma câmera encontrada neste aparelho.';
  }
  if (nome === 'NotReadableError') {
    return 'A câmera está sendo usada por outro aplicativo.';
  }
  return 'Não foi possível abrir a câmera.';
}

// Abre a câmera traseira e procura um QR Code a cada quadro. Ao achar, desliga a
// câmera e entrega o texto lido; ao desmontar, a câmera também é desligada.
export function LeitorQrCode({ onLido, onFechar }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onLidoRef = useRef(onLido);
  const suportado =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);
  const [erro, setErro] = useState(suportado ? '' : SEM_SUPORTE);

  useEffect(() => {
    onLidoRef.current = onLido;
  });

  useEffect(() => {
    if (!suportado) return;
    let ativo = true;
    let stream: MediaStream | null = null;
    let quadro = 0;

    const desligar = () => {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    };

    async function varrer() {
      if (!ativo) return;
      const video = videoRef.current;
      const texto = video ? await lerQrCodeDeVideo(video) : null;
      if (!ativo) return;
      if (texto) {
        ativo = false;
        desligar();
        onLidoRef.current(texto);
        return;
      }
      quadro = requestAnimationFrame(() => void varrer());
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      .then(async (s) => {
        if (!ativo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          await video.play().catch(() => undefined);
        }
        void varrer();
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemDeErroCamera(e));
      });

    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      desligar();
    };
  }, [suportado]);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      {erro ? (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {erro}
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              muted
              playsInline
            />
            {/* Moldura de mira: só visual, não limita a área lida */}
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/80" />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <Camera className="h-3.5 w-3.5 shrink-0" />
            Aponte para o QR Code impresso na nota.
          </p>
        </>
      )}
      <button type="button" onClick={onFechar} className="btn-secondary w-full">
        Cancelar leitura
      </button>
    </div>
  );
}

// Redimensiona e comprime uma imagem no cliente antes de enviá-la à API.
// As fotos trafegam como data URL (base64), então sem isso uma foto de
// celular estoura o limite do corpo da requisição e incha as listagens.

type ImagemCarregada = ImageBitmap | HTMLImageElement;

export async function comprimirImagem(
  arquivo: File,
  maxLado = 1600,
  qualidade = 0.7,
): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem.');
  }
  try {
    const imagem = await carregarImagem(arquivo);
    const maiorLado = Math.max(imagem.width, imagem.height);
    const escala = maiorLado > maxLado ? maxLado / maiorLado : 1;
    const largura = Math.round(imagem.width * escala);
    const altura = Math.round(imagem.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível.');
    ctx.drawImage(imagem, 0, 0, largura, altura);
    if (imagem instanceof ImageBitmap) imagem.close();

    return canvas.toDataURL('image/jpeg', qualidade);
  } catch {
    // Se a compressão falhar, envia o original para não travar o usuário.
    return lerComoDataUrl(arquivo);
  }
}

async function carregarImagem(arquivo: File): Promise<ImagemCarregada> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(arquivo);
    } catch {
      // cai para o carregamento via <img>
    }
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });
}

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(arquivo);
  });
}

import argparse
import base64
import binascii
import json
import os
from io import BytesIO
from pathlib import Path
from time import sleep
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from itens import alinhar_danfe, alinhar_itens

MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 28_000_000
MAX_LADO = 1280


class SemRedirecionamento(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class ApiOcr:
    def __init__(self, origem, token):
        url = urlsplit(origem)
        local = url.hostname in {"localhost", "127.0.0.1", "::1"}
        if (
            not url.hostname
            or url.username
            or url.password
            or url.path not in ("", "/")
            or url.query
            or url.fragment
            or (url.scheme != "https" and not (url.scheme == "http" and local))
        ):
            raise ValueError("Informe uma origem HTTPS ou HTTP em loopback, sem caminho ou credenciais.")
        self.origem = origem.rstrip("/")
        self.token = token
        self.cliente = build_opener(SemRedirecionamento())

    def post(self, caminho, dados):
        requisicao = Request(
            f"{self.origem}/api/fiscal/trabalhos/{caminho}",
            data=json.dumps(dados, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "X-Ocr-Worker-Token": self.token},
        )
        with self.cliente.open(requisicao, timeout=90) as resposta:
            return json.load(resposta)


def carregar_motor():
    cache = Path(__file__).resolve().parent / ".modelo-cache"
    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(cache))
    os.environ.setdefault("HF_HOME", str(cache / "hf"))
    os.environ.setdefault("MPLCONFIGDIR", str(cache / "matplotlib"))

    from paddleocr import PPStructureV3

    modelos = os.environ.get("OCR_MODELOS_DIR")
    configuracao = {"lang": "pt", "ocr_version": "PP-OCRv5"}
    if modelos:
        pasta = Path(modelos)
        configuracao = {}
        for argumento, nome in {
            "layout_detection": "PP-DocLayout_plus-L",
            "region_detection": "PP-DocBlockLayout",
            "chart_recognition": "PP-Chart2Table",
            "text_detection": "PP-OCRv5_server_det",
            "text_recognition": "latin_PP-OCRv5_mobile_rec",
        }.items():
            diretorio = pasta / nome
            if not diretorio.is_dir():
                raise ValueError(f"Modelo local ausente: {nome}")
            configuracao[f"{argumento}_model_name"] = nome
            configuracao[f"{argumento}_model_dir"] = str(diretorio.resolve())

    return PPStructureV3(
        **configuracao,
        device="cpu",
        cpu_threads=4,
        enable_mkldnn=False,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        use_seal_recognition=False,
        use_formula_recognition=False,
        use_chart_recognition=False,
        use_table_recognition=False,
    )


def analisar(modelo, arquivo):
    import numpy as np
    from PIL import Image, ImageOps

    if len(arquivo) > MAX_BYTES:
        raise ValueError("Imagem acima do limite permitido.")
    with Image.open(BytesIO(arquivo)) as foto:
        if foto.format not in {"JPEG", "PNG"} or foto.width * foto.height > MAX_PIXELS:
            raise ValueError("Use JPEG ou PNG com até 28 megapixels.")
        foto = ImageOps.exif_transpose(foto)
        foto.thumbnail((MAX_LADO, MAX_LADO), Image.Resampling.LANCZOS)
        imagem_bgr = np.array(foto.convert("RGB"))[:, :, ::-1].copy()

    dados = next(modelo.predict_iter(imagem_bgr)).json["res"]
    ocr = dados.get("overall_ocr_res") or {}
    itens = []
    for item in (alinhar_danfe(ocr) or alinhar_itens(ocr))[:200]:
        descricao = str(item["descricao"]).strip()[:500]
        if descricao:
            itens.append({
                "descricao": descricao,
                **{campo: str(item[campo])[:40] if item.get(campo) is not None else None
                   for campo in ("quantidade", "unitario", "valor")},
            })
    return {"itens": itens, "texto": "\n".join(ocr.get("rec_texts", []))[:40_000]}


def executar(api, intervalo):
    print("Carregando PaddleOCR em CPU.", flush=True)
    modelo = carregar_motor()
    print("Worker pronto.", flush=True)
    while True:
        try:
            trabalho = api.post("reservar", {})["trabalho"]
            if trabalho is None:
                sleep(intervalo)
                continue

            identificador = int(trabalho["id"])
            try:
                conteudo = "".join(trabalho["conteudo"].split())
                arquivo = base64.b64decode(conteudo, validate=True)
                resultado = analisar(modelo, arquivo)
            except (ValueError, TypeError, OSError, binascii.Error, RuntimeError, StopIteration) as erro:
                print(f"Trabalho {identificador} não processado ({type(erro).__name__}).", flush=True)
                resultado = None

            api.post(f"{identificador}/finalizar", {
                "reserva": trabalho["reserva"], "resultado": resultado,
            })
            print(f"Trabalho {identificador} enviado.", flush=True)
        except HTTPError as erro:
            if erro.code in (401, 403):
                raise SystemExit("A credencial do worker foi recusada pela API.") from None
            print(f"API retornou HTTP {erro.code}. Vou tentar novamente.", flush=True)
            sleep(intervalo)
        except (URLError, TimeoutError, OSError, json.JSONDecodeError):
            print("API indisponível. Vou tentar novamente.", flush=True)
            sleep(intervalo)


def main():
    parser = argparse.ArgumentParser(description="Worker PaddleOCR para anexos de despesas.")
    parser.add_argument("--url", default=os.environ.get("OCR_API_URL", "http://127.0.0.1:3000"))
    parser.add_argument("--intervalo", type=int, default=45, help="Segundos entre consultas sem trabalho.")
    args = parser.parse_args()
    token = os.environ.get("OCR_WORKER_TOKEN", "").strip()
    if not token or args.intervalo < 1:
        parser.error("Defina OCR_WORKER_TOKEN e um intervalo positivo.")
    try:
        api = ApiOcr(args.url, token)
    except ValueError as erro:
        parser.error(str(erro))
    try:
        executar(api, args.intervalo)
    except KeyboardInterrupt:
        print("Worker encerrado.", flush=True)


if __name__ == "__main__":
    main()

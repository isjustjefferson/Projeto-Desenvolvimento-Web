import re
import unicodedata
from typing import NamedTuple


PREFIXO_MONETARIO = r"(?:R\s*\$\s*)?(?:\d{1,3}(?:\.\d{3})+|\d+),"
MOEDA = PREFIXO_MONETARIO + r"\d{2}"
VALOR_UNITARIO = PREFIXO_MONETARIO + r"\d{2,4}"


def chave(texto):
    return "".join(
        c for c in unicodedata.normalize("NFD", texto.upper())
        if not unicodedata.combining(c)
    )


class Caixa(NamedTuple):
    texto: str
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def x(self):
        return (self.x0 + self.x1) / 2

    @property
    def y(self):
        return (self.y0 + self.y1) / 2

    @property
    def altura(self):
        return self.y1 - self.y0


def caixas_ocr(ocr):
    return [
        Caixa(texto.strip(), x0, y0, x1, y1)
        for texto, (x0, y0, x1, y1) in zip(ocr.get("rec_texts", []), ocr.get("rec_boxes", []))
        if texto.strip() and x1 > x0 and y1 > y0
    ]


def ordenar_descricao(segmentos, linha_y):
    linhas = []
    for caixa in sorted(segmentos, key=linha_y):
        if linhas:
            primeira = linhas[-1][0]
            tolerancia = min(caixa.altura, primeira.altura) * 0.55
            if linha_y(caixa) - linha_y(primeira) <= tolerancia:
                linhas[-1].append(caixa)
                continue
        linhas.append([caixa])
    return " ".join(caixa.texto for linha in linhas
                    for caixa in sorted(linha, key=lambda caixa: caixa.x0))


def alinhar_danfe(ocr):
    blocos = caixas_ocr(ocr)
    rotulos = {
        "codigo": r"^COD(?:IGO)?\W*PROD",
        "descricao": r"^DESCRICAO\b.*\bPRODUTOS?\b",
        "ncm": r"^N?CM\s*/?\s*SH$|^NCM$",
        "quantidade": r"^(?:QTDE?|QTD|QUANT(?:IDADE)?)\.?$",
        "unitario": r"^(?:V\.?|VALOR)\s*UNIT(?:ARIO)?\.?$",
        "valor": r"^(?:V\.?|VALOR)\s*TOTAL\.?$",
        "imposto": r"^(?:B\.?C\.?|V\.?|VALOR|ALIQ\.?)\s*(?:ICMS|IPI)\b",
    }
    descricoes = [b for b in blocos if re.search(rotulos["descricao"], chave(b.texto))]
    for descricao in descricoes:
        tolerancia = descricao.altura * 2
        faixa = [b for b in blocos if abs(b.y - descricao.y) <= tolerancia]
        colunas = {}
        for nome, padrao in rotulos.items():
            if nome == "descricao":
                continue
            opcoes = [b for b in faixa if re.search(padrao, chave(b.texto)) and
                      (b.x < descricao.x if nome == "codigo" else b.x > descricao.x)]
            if opcoes:
                colunas[nome] = min(opcoes, key=lambda b: b.x if nome == "imposto" else abs(b.y - descricao.y))
        codigo = colunas.get("codigo")
        ncm = colunas.get("ncm")
        if codigo is None or ncm is None or codigo.x1 >= ncm.x0:
            continue

        inclinacao = max(-0.12, min(0.12, (ncm.y - codigo.y) / (ncm.x - codigo.x)))
        def linha_y(caixa):
            return caixa.y - inclinacao * (caixa.x - descricao.x)

        altura = max(descricao.altura, codigo.altura, ncm.altura)
        y_cabecalho = linha_y(descricao)
        y_fim = min((
            linha_y(b) for b in blocos if linha_y(b) > y_cabecalho
            and re.match(r"^(?:DADOS ADICIONAIS|INFORMACOES COMPLEMENTARES|RESERVADO AO FISCO|DOCUMENTO DE DEMONSTRACAO|CALCULO DO ISSQN)", chave(b.texto))
        ), default=float("inf"))
        abaixo = [b for b in blocos if y_cabecalho + altura * 0.6 < linha_y(b) < y_fim]
        direita_codigo = codigo.x1 + altura * 0.35
        codigos = sorted((
            b for b in abaixo if codigo.x0 - altura <= b.x0 < direita_codigo
            and b.x1 <= direita_codigo + altura
            and re.fullmatch(r"(?=.*\d)[A-Z0-9-]{1,25}", chave(b.texto))
        ), key=linha_y)

        def ler_numero(nome, linha, formato):
            atual = colunas.get(nome)
            if atual is None:
                return None
            seguinte = min((b.x0 for b in colunas.values() if b.x0 > atual.x0), default=None)
            limite = seguinte - altura * 0.35 if seguinte is not None else atual.x1 + altura * 1.8
            textos = [
                b.texto for b in abaixo
                if atual.x0 - altura * 0.45 <= b.x0 < limite and b.x1 <= limite + altura * 0.45
                and abs(linha_y(b) - linha) <= max(altura, b.altura) * 0.8
                and re.fullmatch(formato, b.texto)
                and not any(linha_y(outro) != linha and
                            abs(linha_y(b) - linha_y(outro)) <= abs(linha_y(b) - linha)
                            for outro in codigos)
            ]
            return textos[0] if len(textos) == 1 else None

        itens = []
        for i, referencia in enumerate(codigos):
            y = linha_y(referencia)
            proximo = linha_y(codigos[i+1]) if i+1 < len(codigos) else y_fim
            segmentos = [
                b for b in abaixo if direita_codigo <= b.x0 < ncm.x0
                and b.x1 <= ncm.x0 + altura * 0.25
                and y - altura * 0.8 <= linha_y(b) < min(y + altura * 2.8, proximo - altura * 0.6)
                and re.search(r"[^\W\d_]{2}", b.texto)
                and not re.match(r"^(?:TRIB(?:UTOS)?\b|VALOR\s+APROX\b|ICMS\b|IBPT\b)", chave(b.texto))
            ]
            if not any(abs(linha_y(b) - y) <= max(altura, b.altura) for b in segmentos):
                continue
            quantidade = ler_numero("quantidade", y, r"\d+(?:,\d{1,4}|\.\d{4})?")
            itens.append({
                "descricao": ordenar_descricao(segmentos, linha_y),
                "quantidade": quantidade.replace(".", ",") if quantidade else None,
                "unitario": ler_numero("unitario", y, VALOR_UNITARIO),
                "valor": ler_numero("valor", y, MOEDA),
            })
        return itens
    return []


def alinhar_itens(ocr):

    blocos = []
    for texto, (x0, y0, x1, y1) in zip(ocr.get("rec_texts", []), ocr.get("rec_boxes", [])):
        if texto.strip() and x1 > x0 and y1 > y0:
            blocos.append((texto.strip(), x0, x1, (y0 + y1) / 2, y1 - y0))

    moeda = MOEDA
    fecha = re.compile(r"^(?:SUB\s*TOTAL|DESCONTO|TOTAL\b|DINHEIRO\b|TROCO\b)")
    rodape = min((b[3] for b in blocos if fecha.match(chave(b[0]))), default=float("inf"))
    linhas = []
    precos = []
    for texto, x0, x1, y, altura in blocos:
        if y >= rodape:
            continue
        if re.match(r"^[x×]\s+", texto, re.I):
            quantidades = [
                b for b in blocos
                if re.fullmatch(r"\d{1,4}", b[0]) and b[1] < x0
                and -altura * 0.15 <= x0 - b[2] <= altura
                and abs(y - b[3]) <= max(altura, b[4]) * 0.45
            ]
            if len(quantidades) == 1:
                quantidade, x0, _, _, _ = quantidades[0]
                texto = quantidade + " " + texto
        item = re.fullmatch(r"(\d{1,4})\s*[x×]\s*(.*)", texto, re.I)
        if item:
            descricao = item[2].strip()
            valor = re.search(rf"\s+({moeda})\s*$", descricao)
            if valor:
                descricao = descricao[:valor.start()].strip()
            if re.search(r"[^\W\d_]{2}", descricao):
                linhas.append((y, altura, x0, x1, {
                    "descricao": descricao, "quantidade": int(item[1]),
                    "valor": valor[1] if valor else None,
                }))
        elif re.fullmatch(moeda, texto):
            precos.append((x0, y, altura, texto))

    linhas.sort(key=lambda linha: linha[0])
    candidatos = [[] for _ in linhas]
    usos = [0] * len(precos)
    for i, (y, altura, x0, x1, item) in enumerate(linhas):
        if item["valor"]:
            continue
        for j, (x_preco, y_preco, altura_preco, _) in enumerate(precos):
            if x_preco >= x1 - altura * 0.25 and x_preco > x0 and abs(y_preco - y) <= max(altura, altura_preco) * 0.75:
                candidatos[i].append(j)
                usos[j] += 1

    for linha, opcoes in zip(linhas, candidatos):
        if len(opcoes) == 1 and usos[opcoes[0]] == 1:
            linha[4]["valor"] = precos[opcoes[0]][3]
    return [linha[4] for linha in linhas]

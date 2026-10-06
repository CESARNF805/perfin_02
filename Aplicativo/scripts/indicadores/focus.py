"""Coleta das expectativas de mercado (Boletim Focus) na API Olinda do Banco Central."""
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from urllib.parse import quote

from http_bcb import get_json

URL_OLINDA = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/"
INICIO_PADRAO = date(2020, 1, 1)
TAMANHO_PAGINA = 10000
# Só guardamos a expectativa mensal dos próximos meses (é a usada na "surpresa do mês").
MESES_A_FRENTE_MENSAL = 2

INDICADORES_ANUAIS = {"IPCA": "ipca", "Selic": "selic", "Câmbio": "cambio", "PIB Total": "pib"}


@dataclass(frozen=True)
class Expectativa:
    indicador: str
    tipo: str
    referencia: str
    data: date
    mediana: Decimal | None
    media: Decimal | None
    minimo: Decimal | None
    maximo: Decimal | None
    respondentes: int | None


def _numero(valor) -> Decimal | None:
    return None if valor is None else Decimal(str(valor))


def _base(registro: dict, indicador: str, tipo: str, referencia: str) -> Expectativa:
    return Expectativa(
        indicador=indicador,
        tipo=tipo,
        referencia=referencia,
        data=datetime.strptime(registro["Data"], "%Y-%m-%d").date(),
        mediana=_numero(registro.get("Mediana")),
        media=_numero(registro.get("Media")),
        minimo=_numero(registro.get("Minimo")),
        maximo=_numero(registro.get("Maximo")),
        respondentes=registro.get("numeroRespondentes"),
    )


def converter_anuais(registros: list[dict]) -> list[Expectativa]:
    """Expectativas anuais (IPCA, Selic, câmbio e PIB) para cada ano de referência."""
    resultado = []
    for r in registros:
        indicador = INDICADORES_ANUAIS.get(r.get("Indicador"))
        if indicador and r.get("IndicadorDetalhe") is None and r.get("baseCalculo") == 0:
            resultado.append(_base(r, indicador, "anual", str(r["DataReferencia"])))
    return resultado


def converter_12m(registros: list[dict]) -> list[Expectativa]:
    """IPCA esperado para os próximos 12 meses (série suavizada)."""
    return [
        _base(r, "ipca", "12m", "suavizada")
        for r in registros
        if r.get("Indicador") == "IPCA" and r.get("Suavizada") == "S" and r.get("baseCalculo") == 0
    ]


def _meses_entre(data_pesquisa: date, referencia: str) -> int:
    mes, ano = (int(p) for p in referencia.split("/"))
    return (ano - data_pesquisa.year) * 12 + (mes - data_pesquisa.month)


def converter_mensais(registros: list[dict]) -> list[Expectativa]:
    """IPCA mensal esperado, só para o mês corrente e os próximos (referência AAAA-MM)."""
    resultado = []
    for r in registros:
        if r.get("Indicador") != "IPCA" or r.get("baseCalculo") != 0:
            continue
        exp = _base(r, "ipca", "mensal", "")
        distancia = _meses_entre(exp.data, r["DataReferencia"])
        if -1 <= distancia <= MESES_A_FRENTE_MENSAL:
            mes, ano = r["DataReferencia"].split("/")
            resultado.append(Expectativa(**{**exp.__dict__, "referencia": f"{ano}-{mes}"}))
    return resultado


def converter_copom(registros: list[dict]) -> list[Expectativa]:
    """Selic esperada ao fim de cada reunião do Copom (ex.: R6/2026)."""
    return [
        _base(r, "selic", "copom", r["Reuniao"])
        for r in registros
        if r.get("Indicador") == "Selic" and r.get("baseCalculo") == 0
    ]


def _buscar_entidade(entidade: str, filtro: str, sessao=None) -> list[dict]:
    registros: list[dict] = []
    pulo = 0
    while True:
        url = (
            f"{URL_OLINDA}{entidade}?$format=json&$top={TAMANHO_PAGINA}&$skip={pulo}"
            f"&$filter={quote(filtro)}&$orderby={quote('Data asc')}"
        )
        pagina = (get_json(url, None, sessao) or {}).get("value", [])
        registros.extend(pagina)
        if len(pagina) < TAMANHO_PAGINA:
            return registros
        pulo += TAMANHO_PAGINA


def buscar_expectativas(desde: date, sessao=None) -> list[Expectativa]:
    """Busca todas as expectativas usadas pelo portal com data de pesquisa >= `desde`."""
    filtro_data = f"Data ge '{desde.isoformat()}' and baseCalculo eq 0"
    anuais = " or ".join(f"Indicador eq '{nome}'" for nome in INDICADORES_ANUAIS)
    return [
        *converter_anuais(_buscar_entidade("ExpectativasMercadoAnuais", f"({anuais}) and {filtro_data}", sessao)),
        *converter_12m(_buscar_entidade("ExpectativasMercadoInflacao12Meses", f"Indicador eq 'IPCA' and {filtro_data}", sessao)),
        *converter_mensais(_buscar_entidade("ExpectativaMercadoMensais", f"Indicador eq 'IPCA' and {filtro_data}", sessao)),
        *converter_copom(_buscar_entidade("ExpectativasMercadoSelic", f"Indicador eq 'Selic' and {filtro_data}", sessao)),
    ]

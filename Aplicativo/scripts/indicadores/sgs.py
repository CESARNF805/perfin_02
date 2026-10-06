"""Coleta de séries temporais do SGS (Sistema Gerenciador de Séries Temporais) do Banco Central."""
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation

from http_bcb import get_json

URL_SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados"
INICIO_PADRAO = date(2010, 1, 1)
# A API limita consultas de séries diárias a 10 anos; usamos janelas menores por segurança.
DIAS_POR_JANELA = 3600
# Reprocessa os últimos dias para capturar correções publicadas pelo BCB.
DIAS_SOBREPOSICAO = 45


def inicio_incremental(ultima_data: date | None) -> date:
    """Data inicial da coleta: tudo desde INICIO_PADRAO ou a partir da última data gravada."""
    if ultima_data is None:
        return INICIO_PADRAO
    return max(INICIO_PADRAO, ultima_data - timedelta(days=DIAS_SOBREPOSICAO))


def janelas(inicio: date, fim: date, dias: int = DIAS_POR_JANELA) -> list[tuple[date, date]]:
    """Divide [inicio, fim] em intervalos consecutivos de no máximo `dias` dias."""
    resultado = []
    atual = inicio
    while atual <= fim:
        final = min(fim, atual + timedelta(days=dias - 1))
        resultado.append((atual, final))
        atual = final + timedelta(days=1)
    return resultado


def converter(registros: list[dict], hoje: date) -> list[tuple[date, Decimal]]:
    """Converte o JSON do SGS em (data, valor). Ignora valores vazios e datas futuras."""
    valores: dict[date, Decimal] = {}
    for registro in registros or []:
        try:
            dia = datetime.strptime(registro["data"], "%d/%m/%Y").date()
            valor = Decimal(str(registro["valor"]).strip())
        except (KeyError, ValueError, InvalidOperation):
            continue
        if dia <= hoje and valor.is_finite():
            valores[dia] = valor
    return sorted(valores.items())


def buscar_serie(codigo: int, inicio: date, fim: date, sessao=None) -> list[tuple[date, Decimal]]:
    """Busca a série `codigo` entre `inicio` e `fim`, em janelas."""
    pontos: list[tuple[date, Decimal]] = []
    for de, ate in janelas(inicio, fim):
        params = {
            "formato": "json",
            "dataInicial": de.strftime("%d/%m/%Y"),
            "dataFinal": ate.strftime("%d/%m/%Y"),
        }
        dados = get_json(URL_SGS.format(codigo=codigo), params, sessao)
        pontos.extend(converter(dados, fim))
    return pontos

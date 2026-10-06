"""Testes da coleta (sem rede e sem banco)."""
from datetime import date
from decimal import Decimal

import pytest

import focus
import sgs
from http_bcb import ErroFonte, get_json


class RespostaFalsa:
    def __init__(self, status: int, corpo=None):
        self.status_code = status
        self._corpo = corpo

    def json(self):
        return self._corpo


class SessaoFalsa:
    def __init__(self, respostas):
        self.respostas = list(respostas)
        self.chamadas = 0

    def get(self, url, params=None, timeout=None):
        self.chamadas += 1
        return self.respostas.pop(0)


# ---------------- SGS ----------------

def test_converter_ignora_vazios_invalidos_e_datas_futuras():
    registros = [
        {"data": "01/08/2026", "valor": "-0.32"},
        {"data": "01/09/2026", "valor": ""},
        {"data": "xx/09/2026", "valor": "1"},
        {"data": "03/11/2026", "valor": "13.75"},  # Selic meta projetada: data futura
    ]
    assert sgs.converter(registros, date(2026, 10, 6)) == [(date(2026, 8, 1), Decimal("-0.32"))]


def test_converter_remove_duplicadas_e_ordena():
    registros = [{"data": "02/01/2026", "valor": "2"}, {"data": "01/01/2026", "valor": "1"},
                 {"data": "02/01/2026", "valor": "3"}]
    assert sgs.converter(registros, date(2026, 1, 31)) == [
        (date(2026, 1, 1), Decimal("1")), (date(2026, 1, 2), Decimal("3"))]


def test_converter_aceita_none():
    assert sgs.converter(None, date(2026, 1, 1)) == []


def test_janelas_cobrem_intervalo_sem_buracos():
    partes = sgs.janelas(date(2010, 1, 1), date(2026, 10, 6), dias=3600)
    assert partes[0][0] == date(2010, 1, 1)
    assert partes[-1][1] == date(2026, 10, 6)
    for (_, fim), (inicio, _) in zip(partes, partes[1:]):
        assert (inicio - fim).days == 1
    assert all((fim - inicio).days < 3600 for inicio, fim in partes)


def test_janelas_intervalo_invertido_vazio():
    assert sgs.janelas(date(2026, 1, 2), date(2026, 1, 1)) == []


def test_inicio_incremental():
    assert sgs.inicio_incremental(None) == sgs.INICIO_PADRAO
    assert sgs.inicio_incremental(date(2026, 10, 1)) == date(2026, 8, 17)
    assert sgs.inicio_incremental(date(2010, 1, 10)) == sgs.INICIO_PADRAO


# ---------------- HTTP ----------------

def test_get_json_404_retorna_none():
    assert get_json("https://x", sessao=SessaoFalsa([RespostaFalsa(404)])) is None


def test_get_json_tenta_novamente_e_depois_falha(monkeypatch):
    monkeypatch.setattr("http_bcb.time.sleep", lambda _s: None)
    sessao = SessaoFalsa([RespostaFalsa(500)] * 4)
    with pytest.raises(ErroFonte):
        get_json("https://x?segredo=1", sessao=sessao)
    assert sessao.chamadas == 4


def test_get_json_recupera_apos_erro(monkeypatch):
    monkeypatch.setattr("http_bcb.time.sleep", lambda _s: None)
    sessao = SessaoFalsa([RespostaFalsa(503), RespostaFalsa(200, [1])])
    assert get_json("https://x", sessao=sessao) == [1]


# ---------------- Focus ----------------

def _registro(**extra):
    base = {"Data": "2026-10-02", "Mediana": 5.0129, "Media": 5.0046, "Minimo": 4.338,
            "Maximo": 5.8963, "numeroRespondentes": 144, "baseCalculo": 0}
    return {**base, **extra}


def test_converter_anuais_filtra_indicadores_e_base():
    registros = [
        _registro(Indicador="IPCA", IndicadorDetalhe=None, DataReferencia="2026"),
        _registro(Indicador="Câmbio", IndicadorDetalhe=None, DataReferencia="2027"),
        _registro(Indicador="IPCA", IndicadorDetalhe=None, DataReferencia="2026", baseCalculo=1),
        _registro(Indicador="IGP-M", IndicadorDetalhe=None, DataReferencia="2026"),
        _registro(Indicador="IPCA", IndicadorDetalhe="Administrados", DataReferencia="2026"),
    ]
    resultado = focus.converter_anuais(registros)
    assert [(e.indicador, e.referencia) for e in resultado] == [("ipca", "2026"), ("cambio", "2027")]
    assert resultado[0].mediana == Decimal("5.0129")
    assert resultado[0].data == date(2026, 10, 2)


def test_converter_12m_usa_suavizada():
    registros = [_registro(Indicador="IPCA", Suavizada="N"), _registro(Indicador="IPCA", Suavizada="S")]
    resultado = focus.converter_12m(registros)
    assert len(resultado) == 1 and resultado[0].referencia == "suavizada"


def test_converter_mensais_mantem_so_meses_proximos():
    registros = [
        _registro(Indicador="IPCA", DataReferencia="09/2026"),
        _registro(Indicador="IPCA", DataReferencia="10/2026"),
        _registro(Indicador="IPCA", DataReferencia="12/2026"),
        _registro(Indicador="IPCA", DataReferencia="01/2027"),
        _registro(Indicador="IPCA", DataReferencia="08/2026"),
    ]
    referencias = [e.referencia for e in focus.converter_mensais(registros)]
    assert referencias == ["2026-09", "2026-10", "2026-12"]


def test_converter_copom():
    resultado = focus.converter_copom([_registro(Indicador="Selic", Reuniao="R6/2026")])
    assert resultado[0].tipo == "copom" and resultado[0].referencia == "R6/2026"


def test_valores_nulos_viram_none():
    resultado = focus.converter_copom([_registro(Indicador="Selic", Reuniao="R1/2027", Media=None)])
    assert resultado[0].media is None

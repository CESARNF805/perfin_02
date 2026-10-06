"""Coleta os indicadores do BCB (SGS + Focus) e grava no Supabase.

Uso: INDICADORES_DATABASE_URL=... python coletar.py
Termina com código 1 se alguma série falhar (o GitHub Actions marca a execução como falha).
"""
import sys
from datetime import date, timedelta

import requests

import banco
import focus
import sgs
from http_bcb import ErroFonte

DIAS_SOBREPOSICAO_FOCUS = 7


def coletar_series(conn, sessao, hoje: date) -> list[str]:
    """Coleta cada série ativa; retorna os ids que falharam."""
    falhas = []
    for serie in banco.listar_series_ativas(conn):
        try:
            inicio = sgs.inicio_incremental(banco.ultima_data_valor(conn, serie.id))
            pontos = sgs.buscar_serie(serie.serie_sgs, inicio, hoje, sessao)
            total = banco.gravar_valores(conn, serie.id, pontos)
            banco.registrar_status(conn, serie.id, True, f"{total} pontos desde {inicio.isoformat()}")
            conn.commit()
            print(f"[ok] {serie.id}: {total} pontos")
        except (ErroFonte, ValueError) as erro:
            conn.rollback()
            banco.registrar_status(conn, serie.id, False, str(erro))
            conn.commit()
            falhas.append(serie.id)
            print(f"[erro] {serie.id}: {erro}")
    return falhas


def coletar_focus(conn, sessao) -> bool:
    """Coleta as expectativas Focus de forma incremental; retorna True se deu certo."""
    ultima = banco.ultima_data_focus(conn)
    desde = focus.INICIO_PADRAO if ultima is None else ultima - timedelta(days=DIAS_SOBREPOSICAO_FOCUS)
    try:
        total = banco.gravar_expectativas(conn, focus.buscar_expectativas(desde, sessao))
        conn.commit()
        print(f"[ok] focus: {total} expectativas desde {desde.isoformat()}")
        return True
    except (ErroFonte, ValueError, KeyError) as erro:
        conn.rollback()
        print(f"[erro] focus: {erro}")
        return False


def main() -> int:
    hoje = date.today()
    with banco.conectar() as conn, requests.Session() as sessao:
        falhas = coletar_series(conn, sessao, hoje)
        focus_ok = coletar_focus(conn, sessao)
    if falhas or not focus_ok:
        print(f"Coleta concluída com falhas: {falhas + ([] if focus_ok else ['focus'])}")
        return 1
    print("Coleta concluída sem falhas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

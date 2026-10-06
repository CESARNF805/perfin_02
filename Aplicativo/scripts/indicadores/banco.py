"""Acesso ao banco (Supabase/Postgres) com o papel restrito etl_indicadores."""
import os
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

import psycopg

from focus import Expectativa


@dataclass(frozen=True)
class Serie:
    id: str
    serie_sgs: int


def conectar() -> psycopg.Connection:
    url = os.environ.get("INDICADORES_DATABASE_URL")
    if not url:
        raise RuntimeError("Variável INDICADORES_DATABASE_URL não definida.")
    return psycopg.connect(url, connect_timeout=30)


def listar_series_ativas(conn: psycopg.Connection) -> list[Serie]:
    linhas = conn.execute(
        "select id, serie_sgs from public.indicadores where ativo and serie_sgs is not null order by ordem"
    ).fetchall()
    return [Serie(id=i, serie_sgs=s) for i, s in linhas]


def ultima_data_valor(conn: psycopg.Connection, indicador_id: str) -> date | None:
    return conn.execute(
        "select max(data) from public.indicador_valores where indicador_id = %s", (indicador_id,)
    ).fetchone()[0]


def gravar_valores(conn: psycopg.Connection, indicador_id: str, pontos: list[tuple[date, Decimal]]) -> int:
    with conn.cursor() as cur:
        cur.executemany(
            """insert into public.indicador_valores (indicador_id, data, valor, atualizado_em)
               values (%s, %s, %s, now())
               on conflict (indicador_id, data) do update
                 set valor = excluded.valor, atualizado_em = now()
                 where public.indicador_valores.valor is distinct from excluded.valor""",
            [(indicador_id, dia, valor) for dia, valor in pontos],
        )
    return len(pontos)


def registrar_status(conn: psycopg.Connection, indicador_id: str, ok: bool, mensagem: str) -> None:
    conn.execute(
        """update public.indicadores
           set ultima_coleta_em = now(), ultima_coleta_status = %s, ultima_coleta_mensagem = %s
           where id = %s""",
        ("ok" if ok else "erro", mensagem[:500], indicador_id),
    )


def ultima_data_focus(conn: psycopg.Connection) -> date | None:
    return conn.execute("select max(data) from public.expectativas_focus").fetchone()[0]


def gravar_expectativas(conn: psycopg.Connection, expectativas: list[Expectativa]) -> int:
    with conn.cursor() as cur:
        cur.executemany(
            """insert into public.expectativas_focus
                 (indicador, tipo, referencia, data, mediana, media, minimo, maximo, respondentes)
               values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               on conflict (indicador, tipo, referencia, data) do update set
                 mediana = excluded.mediana, media = excluded.media, minimo = excluded.minimo,
                 maximo = excluded.maximo, respondentes = excluded.respondentes""",
            [
                (e.indicador, e.tipo, e.referencia, e.data, e.mediana, e.media, e.minimo, e.maximo, e.respondentes)
                for e in expectativas
            ],
        )
    return len(expectativas)

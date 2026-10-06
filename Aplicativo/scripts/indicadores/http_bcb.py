"""Requisições HTTP com novas tentativas para as APIs do Banco Central."""
import time

import requests

TENTATIVAS = 4
TIMEOUT_SEGUNDOS = 60


class ErroFonte(Exception):
    """Falha ao consultar uma fonte de dados externa."""


def get_json(url: str, params: dict | None = None, sessao: requests.Session | None = None):
    """GET com até TENTATIVAS e espera exponencial. Retorna None em 404 (sem dados no intervalo)."""
    cliente = sessao or requests
    ultimo_erro = ""
    for tentativa in range(TENTATIVAS):
        try:
            resposta = cliente.get(url, params=params, timeout=TIMEOUT_SEGUNDOS)
            if resposta.status_code == 404:
                return None
            if resposta.status_code == 200:
                return resposta.json()
            ultimo_erro = f"HTTP {resposta.status_code}"
        except (requests.RequestException, ValueError) as erro:
            ultimo_erro = type(erro).__name__
        time.sleep(2**tentativa)
    raise ErroFonte(f"Falha ao consultar {url.split('?')[0]}: {ultimo_erro}")

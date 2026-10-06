-- Catálogo inicial de indicadores (séries do SGS/BCB) e metas de inflação do CMN.

insert into public.indicadores (id, nome, grupo, unidade, periodicidade, serie_sgs, ordem) values
  ('ipca',             'IPCA',                         'inflacao', 'pct_am', 'mensal', 433,   10),
  ('inpc',             'INPC',                         'inflacao', 'pct_am', 'mensal', 188,   20),
  ('igpm',             'IGP-M',                        'inflacao', 'pct_am', 'mensal', 189,   30),
  ('ipca_livres',      'IPCA – preços livres',         'inflacao', 'pct_am', 'mensal', 11428, 40),
  ('ipca_monitorados', 'IPCA – preços monitorados',    'inflacao', 'pct_am', 'mensal', 4449,  50),
  ('selic_meta',       'Selic meta',                   'juros',    'pct_aa', 'diaria', 432,   60),
  ('selic',            'Selic diária',                 'juros',    'pct_ad', 'diaria', 11,    70),
  ('cdi',              'CDI',                          'juros',    'pct_ad', 'diaria', 12,    80),
  ('dolar',            'Dólar (PTAX venda)',           'cambio',   'brl',    'diaria', 1,     90),
  ('euro',             'Euro (PTAX venda)',            'cambio',   'brl',    'diaria', 21619, 100)
on conflict (id) do nothing;

insert into public.metas_inflacao (ano, centro, tolerancia) values
  (2015, 4.5, 2.0), (2016, 4.5, 2.0), (2017, 4.5, 1.5), (2018, 4.5, 1.5),
  (2019, 4.25, 1.5), (2020, 4.0, 1.5), (2021, 3.75, 1.5), (2022, 3.5, 1.5),
  (2023, 3.25, 1.5), (2024, 3.0, 1.5), (2025, 3.0, 1.5), (2026, 3.0, 1.5),
  (2027, 3.0, 1.5), (2028, 3.0, 1.5)
on conflict (ano) do nothing;

-- Sugestão inicial do painel público (o admin ajusta depois).
insert into public.publicacao_indicadores (indicador_id, visivel, ordem, grafico) values
  ('ipca', true, 10, 'barra'),
  ('selic_meta', true, 20, 'linha'),
  ('dolar', true, 30, 'linha')
on conflict (indicador_id) do nothing;

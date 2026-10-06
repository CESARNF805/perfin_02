-- Portal Perfin — esquema base, funções de acesso e RLS.
-- Todas as tabelas com RLS ligado. Acesso padrão negado; policies liberam só o necessário.

-- ============================================================
-- Perfis (quem pode usar o portal)
-- ============================================================
create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome text,
  papel text not null default 'usuario' check (papel in ('admin', 'usuario')),
  bloqueado boolean not null default false,
  criado_em timestamptz not null default now(),
  ultimo_acesso timestamptz
);
alter table public.perfis enable row level security;

-- Membro = tem perfil criado pelo servidor e não está bloqueado.
create or replace function public.is_membro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.user_id = auth.uid() and not p.bloqueado
  );
$$;

-- Admin = papel admin + sessão com senha + MFA (aal2). Login Google nunca dá poder de admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.perfis p
      where p.user_id = auth.uid() and p.papel = 'admin' and not p.bloqueado
    )
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (
      select 1
      from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
      where m ->> 'method' = 'password'
    );
$$;

revoke execute on function public.is_membro() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_membro() to authenticated;
grant execute on function public.is_admin() to authenticated;

create policy perfis_select on public.perfis
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Admin só pode alterar o bloqueio (papel e e-mail ficam com o servidor).
create policy perfis_update_admin on public.perfis
  for update to authenticated
  using (public.is_admin() and user_id <> auth.uid())
  with check (public.is_admin() and user_id <> auth.uid());

revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update (bloqueado) on public.perfis to authenticated;

-- ============================================================
-- Catálogo de indicadores e valores
-- ============================================================
create table public.indicadores (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  nome text not null,
  grupo text not null check (grupo in ('inflacao', 'juros', 'cambio', 'atividade', 'outros')),
  unidade text not null check (unidade in ('pct_am', 'pct_ad', 'pct_aa', 'brl')),
  periodicidade text not null check (periodicidade in ('diaria', 'mensal')),
  fonte text not null default 'BCB/SGS',
  serie_sgs integer unique check (serie_sgs > 0),
  ativo boolean not null default true,
  ordem integer not null default 100,
  ultima_coleta_em timestamptz,
  ultima_coleta_status text check (ultima_coleta_status in ('ok', 'erro')),
  ultima_coleta_mensagem text,
  criado_em timestamptz not null default now()
);
alter table public.indicadores enable row level security;

create policy indicadores_select on public.indicadores
  for select to authenticated using (public.is_membro());
create policy indicadores_insert on public.indicadores
  for insert to authenticated with check (public.is_admin());
create policy indicadores_update on public.indicadores
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.indicadores from anon, authenticated;
grant select, insert on public.indicadores to authenticated;
grant update (nome, grupo, unidade, periodicidade, ativo, ordem) on public.indicadores to authenticated;

create table public.indicador_valores (
  indicador_id text not null references public.indicadores (id) on delete cascade,
  data date not null,
  valor numeric not null,
  atualizado_em timestamptz not null default now(),
  primary key (indicador_id, data)
);
alter table public.indicador_valores enable row level security;

create policy indicador_valores_select on public.indicador_valores
  for select to authenticated using (public.is_membro());

revoke all on public.indicador_valores from anon, authenticated;
grant select on public.indicador_valores to authenticated;

-- ============================================================
-- Expectativas de mercado (Boletim Focus)
-- ============================================================
create table public.expectativas_focus (
  indicador text not null,
  tipo text not null check (tipo in ('anual', '12m', 'mensal', 'copom')),
  referencia text not null,
  data date not null,
  mediana numeric,
  media numeric,
  minimo numeric,
  maximo numeric,
  respondentes integer,
  primary key (indicador, tipo, referencia, data)
);
alter table public.expectativas_focus enable row level security;
create index expectativas_focus_data_idx on public.expectativas_focus (indicador, tipo, data desc);

create policy expectativas_focus_select on public.expectativas_focus
  for select to authenticated using (public.is_membro());

revoke all on public.expectativas_focus from anon, authenticated;
grant select on public.expectativas_focus to authenticated;

-- ============================================================
-- Metas de inflação (CMN)
-- ============================================================
create table public.metas_inflacao (
  ano integer primary key check (ano between 1999 and 2100),
  centro numeric not null check (centro >= 0),
  tolerancia numeric not null check (tolerancia >= 0)
);
alter table public.metas_inflacao enable row level security;

create policy metas_select on public.metas_inflacao
  for select to authenticated using (public.is_membro());
create policy metas_insert on public.metas_inflacao
  for insert to authenticated with check (public.is_admin());
create policy metas_update on public.metas_inflacao
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.metas_inflacao from anon, authenticated;
grant select, insert, update on public.metas_inflacao to authenticated;

-- ============================================================
-- Relatórios mensais (Planilha Google criada pelo próprio usuário)
-- ============================================================
create table public.relatorios (
  id uuid primary key default gen_random_uuid(),
  mes_referencia date not null,
  criado_por uuid not null default auth.uid() references auth.users (id) on delete cascade,
  planilha_id text not null,
  planilha_url text not null,
  rascunho_gmail_id text,
  criado_em timestamptz not null default now()
);
alter table public.relatorios enable row level security;
create index relatorios_criado_por_idx on public.relatorios (criado_por, criado_em desc);

create policy relatorios_select on public.relatorios
  for select to authenticated using (public.is_membro() and criado_por = auth.uid());
create policy relatorios_insert on public.relatorios
  for insert to authenticated with check (public.is_membro() and criado_por = auth.uid());
create policy relatorios_update on public.relatorios
  for update to authenticated
  using (public.is_membro() and criado_por = auth.uid())
  with check (public.is_membro() and criado_por = auth.uid());

revoke all on public.relatorios from anon, authenticated;
grant select, insert on public.relatorios to authenticated;
grant update (rascunho_gmail_id) on public.relatorios to authenticated;

-- ============================================================
-- Tokens Google (cifrados no servidor). Sem policies: só a secret key acessa.
-- ============================================================
create table public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_cifrado text not null,
  access_token_cifrado text,
  expira_em timestamptz,
  escopos text,
  atualizado_em timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
revoke all on public.google_tokens from anon, authenticated;

-- ============================================================
-- Publicação no site
-- ============================================================
create table public.publicacao_indicadores (
  indicador_id text primary key references public.indicadores (id) on delete cascade,
  visivel boolean not null default true,
  ordem integer not null default 100,
  grafico text not null default 'linha' check (grafico in ('linha', 'barra'))
);
alter table public.publicacao_indicadores enable row level security;

create policy publicacao_admin on public.publicacao_indicadores
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.publicacao_indicadores from anon, authenticated;
grant select, insert, update, delete on public.publicacao_indicadores to authenticated;

-- Snapshot já calculado que o site exibe (linha única).
create table public.painel_publico (
  id smallint primary key default 1 check (id = 1),
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.painel_publico enable row level security;

create policy painel_publico_select on public.painel_publico
  for select to anon, authenticated using (true);

revoke all on public.painel_publico from anon, authenticated;
grant select on public.painel_publico to anon, authenticated;

create table public.cartas_mensais (
  id uuid primary key default gen_random_uuid(),
  mes_referencia date not null unique,
  titulo text not null check (char_length(titulo) between 3 and 200),
  corpo text not null check (char_length(corpo) <= 20000),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicada')),
  autor uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicada_em timestamptz
);
alter table public.cartas_mensais enable row level security;

create policy cartas_select_publicadas on public.cartas_mensais
  for select to anon, authenticated using (status = 'publicada');
create policy cartas_select_admin on public.cartas_mensais
  for select to authenticated using (public.is_admin());
create policy cartas_insert_admin on public.cartas_mensais
  for insert to authenticated with check (public.is_admin());
create policy cartas_update_admin on public.cartas_mensais
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cartas_delete_admin on public.cartas_mensais
  for delete to authenticated using (public.is_admin());

revoke all on public.cartas_mensais from anon, authenticated;
-- O público não vê o autor: só as colunas da carta publicada.
grant select (id, mes_referencia, titulo, corpo, status, publicada_em) on public.cartas_mensais to anon;
grant select, insert, update, delete on public.cartas_mensais to authenticated;

-- A secret key (service_role) é usada só no servidor do app.
grant all on all tables in schema public to service_role;

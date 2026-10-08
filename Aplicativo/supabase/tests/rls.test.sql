-- Testes de RLS (pgTAP). Rodam no CI com `supabase test db`, num banco local
-- criado do zero pelas migrations. Tudo acontece numa transação desfeita no fim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- ---------- Dados de teste (como superusuário) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@teste.local'),
  ('00000000-0000-0000-0000-00000000000b', 'membro@teste.local'),
  ('00000000-0000-0000-0000-00000000000c', 'semperfil@teste.local'),
  ('00000000-0000-0000-0000-00000000000d', 'bloqueado@teste.local');
insert into public.perfis (user_id, email, papel, bloqueado) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@teste.local', 'admin', false),
  ('00000000-0000-0000-0000-00000000000b', 'membro@teste.local', 'usuario', false),
  ('00000000-0000-0000-0000-00000000000d', 'bloqueado@teste.local', 'usuario', true);
insert into public.cartas_mensais (mes_referencia, titulo, corpo, status) values
  ('2026-08-01', 'Carta publicada', 'texto', 'publicada'),
  ('2026-09-01', 'Carta rascunho', 'texto', 'rascunho');
insert into public.painel_publico (id, dados) values (1, '{}'::jsonb);

-- ---------- Visitante anônimo ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok('select count(*) from public.indicadores', '42501', null,
  'anônimo não lê indicadores');
select throws_ok('select count(*) from public.perfis', '42501', null,
  'anônimo não lê perfis');
select throws_ok('select count(*) from public.google_tokens', '42501', null,
  'anônimo não lê tokens do Google');
select is((select count(*) from public.painel_publico)::int, 1,
  'anônimo lê o painel público');
select is((select count(*) from public.cartas_mensais)::int, 1,
  'anônimo vê só a carta publicada');

-- ---------- Logado sem perfil (cadastro feito por fora) ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated","aal":"aal1"}', true);

select is((select count(*) from public.indicadores)::int, 0,
  'sem perfil não vê indicadores');
select throws_ok('select count(*) from public.google_tokens', '42501', null,
  'logado nunca lê tokens do Google');

-- ---------- Usuário bloqueado ----------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated","aal":"aal1"}', true);
select ok(not public.is_membro(), 'bloqueado não é membro');
select is((select count(*) from public.indicador_valores)::int, 0,
  'bloqueado não vê valores');

-- ---------- Membro da equipe ----------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal1","amr":[{"method":"oauth"}]}', true);
select ok((select count(*) from public.indicadores) > 0, 'membro vê indicadores');
select ok(not public.is_admin(), 'membro não é admin');
select is((select count(*) from public.perfis)::int, 1,
  'membro vê só o próprio perfil');
select throws_ok(
  $$insert into public.metas_inflacao (ano, centro, tolerancia) values (2099, 3, 1.5)$$,
  '42501', null, 'membro não grava metas');

-- ---------- Admin sem MFA (aal1) ----------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal1","amr":[{"method":"password"}]}', true);
select ok(not public.is_admin(), 'admin sem MFA não tem poderes de admin');

-- ---------- Admin com senha + MFA (aal2) ----------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal2","amr":[{"method":"totp"},{"method":"password"}]}', true);
select ok(public.is_admin(), 'admin com senha + MFA é admin');

-- Admin com MFA mas login Google (sem senha) não é admin.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal2","amr":[{"method":"totp"},{"method":"oauth"}]}', true);
select ok(not public.is_admin(), 'login Google nunca dá poder de admin');

select * from finish();
rollback;

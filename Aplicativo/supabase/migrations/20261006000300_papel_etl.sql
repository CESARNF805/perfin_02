-- Papel de banco usado SOMENTE pelo script de coleta (GitHub Actions).
-- Criado sem senha: defina a senha manualmente no SQL Editor do Supabase:
--   alter role etl_indicadores with password '<senha forte>';
-- A senha nunca deve ser escrita em arquivos do projeto.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'etl_indicadores') then
    create role etl_indicadores login noinherit;
  end if;
end
$$;

grant usage on schema public to etl_indicadores;

grant select on public.indicadores to etl_indicadores;
grant update (ultima_coleta_em, ultima_coleta_status, ultima_coleta_mensagem)
  on public.indicadores to etl_indicadores;
grant select, insert, update on public.indicador_valores to etl_indicadores;
grant select, insert, update on public.expectativas_focus to etl_indicadores;

create policy etl_indicadores_select on public.indicadores
  for select to etl_indicadores using (true);
create policy etl_indicadores_update on public.indicadores
  for update to etl_indicadores using (true) with check (true);

create policy etl_valores_select on public.indicador_valores
  for select to etl_indicadores using (true);
create policy etl_valores_insert on public.indicador_valores
  for insert to etl_indicadores with check (true);
create policy etl_valores_update on public.indicador_valores
  for update to etl_indicadores using (true) with check (true);

create policy etl_focus_select on public.expectativas_focus
  for select to etl_indicadores using (true);
create policy etl_focus_insert on public.expectativas_focus
  for insert to etl_indicadores with check (true);
create policy etl_focus_update on public.expectativas_focus
  for update to etl_indicadores using (true) with check (true);

-- Review: o usuário pode inserir em relatorios via API; valida no banco que os campos
-- apontam para o Google Sheets (impede link javascript: ou externo na tela e no rascunho do Gmail).
alter table public.relatorios
  add constraint relatorios_planilha_url_google
    check (planilha_url like 'https://docs.google.com/%'),
  add constraint relatorios_planilha_id_formato
    check (planilha_id ~ '^[A-Za-z0-9_-]{10,}$');

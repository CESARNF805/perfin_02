## O que muda
<!-- Resumo em 1–3 frases. -->

Refs #<!-- número da issue -->

## Como foi validado
- [ ] `npm run lint`, `typecheck`, `test` e `build` (pasta afetada)
- [ ] Teste novo que reproduz o bug ou cobre a funcionalidade
- [ ] Preview da Vercel conferido (se mexe em tela)

## Checklist das rules (`.claude/rules/`)
- [ ] Sem chave, senha ou token no diff (só `.env.example` com valores fictícios)
- [ ] Regras de negócio fora dos componentes (`services/`, `lib/`)
- [ ] RLS mantido; migration nova tem teste em `Aplicativo/supabase/tests/`
- [ ] Documentação atualizada em `Documentacao/`
- [ ] `Aplicativo/` e `Website/` sem código misturado

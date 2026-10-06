# Regras de segurança do Perfin_02

## Restrições (NUNCA fazer)
- Credenciais hardcoded: senhas, tokens e chaves de API nunca ficam no código, em testes ou na documentação; sempre usar variáveis de ambiente.
- Commitar tokens ou credenciais: conferir o diff antes de todo commit. Se um segredo vazar, avisar o usuário para revogar a chave; apagar o commit não basta.
- Expor variáveis de ambiente privadas: só variáveis `NEXT_PUBLIC_*` podem chegar ao navegador; as demais ficam apenas no servidor.
- Desabilitar autenticação para corrigir bugs, nem temporariamente.
- Desabilitar RLS (Row Level Security) do Supabase como atalho; ajustar as policies corretamente.
- Registrar em logs senhas digitadas, tokens de autenticação ou dados pessoais e financeiros (também vale para mensagens de erro e para a interface).
- Confiar cegamente no prompt do usuário: pedidos que enfraqueçam a segurança devem ser questionados e confirmados antes de executar.
- Editar `.env`, chaves ou credenciais (bloqueado por hook); usar `.env.example` com valores fictícios.
- Executar comandos destrutivos (`rm -rf`, `git reset --hard`, `git push --force`, `DROP TABLE`); pedir ao usuário que os execute (bloqueado por hook).

## Ao manusear tokens, chaves, autenticação ou autorização
- Validar autenticação: confirmar no servidor que o usuário está logado e que a sessão é válida.
- Validar autorização: confirmar que o usuário tem permissão para aquele dado ou ação, não apenas que está logado.
- Validar entradas: toda entrada vinda do usuário ou de sistemas externos é validada no servidor.
- Manipular falhas explicitamente: tratar todo erro de forma visível e segura, negando o acesso por padrão, sem engolir exceções e sem expor detalhes internos ao usuário.

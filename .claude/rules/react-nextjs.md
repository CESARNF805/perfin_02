# Regras de React/Next.js do Perfin_02

## Componentes
- Um componente por arquivo, com uma única responsabilidade. Se ele faz muitas coisas, dividir.
- Componentes só exibem dados e reagem a eventos; cálculos e regras de negócio ficam fora deles (ver `architecture.md`).
- Nomes de componentes em PascalCase (`ResumoCarteira.tsx`); hooks começam com `use` (`useCarteira.ts`).
- Antes de criar um componente, procurar se já existe um parecido para reutilizar ou estender.

## Next.js (App Router)
- Usar Server Components por padrão; colocar `"use client"` só quando precisar de estado, eventos ou APIs do navegador.
- Buscar dados no servidor sempre que possível, não em `useEffect` no cliente.
- Toda rota com dados deve tratar carregamento e erro (`loading.tsx`, `error.tsx`) e o estado vazio.
- Usar `next/link` para navegação e `next/image` para imagens.

## Estado e hooks
- Manter o estado o mais local possível; estado global só quando vários pontos distantes da tela precisarem dele.
- Não guardar em estado o que pode ser calculado a partir de outros dados.
- Usar `useEffect` só para sincronizar com algo externo; nunca para derivar dados.
- Lógica de tela repetida vira um hook customizado.
- Em listas, usar uma `key` estável (id), nunca o índice do array.

## TypeScript
- Usar TypeScript em todo o código, sem `any`; tipar as props de todos os componentes.
- Tipos compartilhados ficam em um local único, não redeclarados em cada arquivo.

## Dados e segurança
- Acesso ao Supabase centralizado em um módulo único (ex.: `lib/supabase`), nunca espalhado pelos componentes.
- No navegador, usar só variáveis `NEXT_PUBLIC_*` e a chave publishable; chaves secretas e a senha do banco ficam só no servidor.
- Validar dados de formulários também no servidor, nunca confiar só na validação da tela.
- Não usar `dangerouslySetInnerHTML` com conteúdo vindo do usuário.

## Interface e acessibilidade
- Usar HTML semântico (`button`, `nav`, `main`, `label`), não `div` clicável.
- Toda imagem tem `alt`; todo campo de formulário tem `label`.
- Seguir o padrão de estilos que já existe no projeto; não misturar abordagens de CSS.
- Valores monetários e datas sempre formatados por uma função utilitária única (padrão pt-BR).

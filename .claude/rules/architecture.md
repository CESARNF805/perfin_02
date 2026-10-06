# Regras de arquitetura do Perfin_02

- Entender e preservar a arquitetura existente antes de propor qualquer alteração.
- Preferir modificar ou aprimorar um módulo existente antes de criar um novo.
- Reutilizar funções e ferramentas já existentes sempre que possível.
- Não introduzir novas dependências sem explicar os motivos (o que resolvem e por que o que já existe não serve).
- Regras de negócio e lógica nunca ficam no código React/Next.js (componentes, páginas, hooks de UI); ficam em módulos próprios (ex.: `services/`, `lib/`) que a interface apenas chama.
- Evitar arquivos com mais de 400 linhas; se passar disso, dividir em módulos.
- Evitar funções com mais de 50 linhas; extrair partes em funções menores com nomes claros.

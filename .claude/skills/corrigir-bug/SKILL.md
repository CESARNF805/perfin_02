---
name: corrigir-bug
description: Processo padrão do Perfin_02 para investigar e corrigir um bug. Use quando o usuário relatar um erro ou comportamento incorreto.
---

# Processo: corrigir bug

1. **Entender**: registre o comportamento esperado, o comportamento atual e os passos para reproduzir.
2. **Localizar**: encontre a causa raiz no código, não só o sintoma.
3. **Reproduzir**: acione o agent `tester` para criar um teste que falhe por causa do bug.
4. **Corrigir**: aplique a menor correção que resolva a causa raiz.
5. **Verificar**: rode o teste do bug e a suíte relacionada; todos devem passar.
6. **Review**: acione o agent `reviewer` sobre a correção.
7. **Resumo**: informe a causa, a correção, os arquivos alterados e o resultado dos testes.

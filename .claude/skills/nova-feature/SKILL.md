---
name: nova-feature
description: Processo padrão do Perfin_02 para implementar uma funcionalidade ou mudança, do requisito ao review. Use quando o usuário pedir uma nova feature ou uma alteração relevante.
---

# Processo: nova feature

Siga as etapas na ordem. Não pule etapas.

1. **Análise**: acione o agent `architect` com o requisito. Ele entrega impacto, arquivos envolvidos, riscos e plano de implementação.
2. **Validação**: apresente o plano ao usuário e aguarde a aprovação antes de implementar.
3. **Implementação**: acione o agent adequado (`frontend` para interfaces) seguindo o plano aprovado.
4. **Testes**: acione o agent `tester` sobre o que foi implementado. Se ele encontrar bugs, volte à etapa 3.
5. **Review**: acione o agent `reviewer`. Corrija os achados **Críticos** e **Importantes** e repita o review.
6. **Documentação**: use a skill `documentar-feature`.
7. **Resumo**: informe ao usuário o que mudou, os arquivos alterados, o resultado dos testes e as pendências.

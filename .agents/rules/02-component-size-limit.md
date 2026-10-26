---
trigger: always_on
description: Impede criação de arquivos monolíticos acima de 200 linhas.
---
- Nenhum arquivo .ts ou .vue pode exceder 200-250 linhas (150 linhas em apps/client/src/canvas/).
- Extraia subcomponentes para packages/ui-cordel e lógica para composables use*.ts.

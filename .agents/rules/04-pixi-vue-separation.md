---
trigger: glob
globs: ["apps/client/src/**/*.ts", "apps/client/src/**/*.vue"]
description: Garante separação estrita entre cenas PixiJS v8 e HUD Vue 3.
---
- Arquivos em apps/client/src/canvas/ não devem exceder 150 linhas e não devem importar componentes Vue.
- O motor de combate (@beakbreaker/combat-core) comunica-se com a cena PixiJS exclusivamente via fila de eventos (BattleEvent[]).
- Utilize ObjectPool para popups de xilogravura (XiloHitPopup) e efeitos visuais para evitar pausas de GC em aparelhos de 2 GB RAM.

---
trigger: glob
globs: ["packages/combat-core/**/*.ts"]
description: Garante determinismo de ponto fixo no motor de combate.
---
- Proibido usar Math.random() ou Date.now(). Use sempre SeededPRNG.
- Toda divisão deve usar Math.floor().
- Proibido importar qualquer pacote de UI ou DOM.

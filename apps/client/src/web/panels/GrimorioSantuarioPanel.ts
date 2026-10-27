import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { SANCTUARY_RECIPES } from '@beakbreaker/game-data';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export const SANCTUARY_LEVEL_TO_SEDE: Record<number, number> = {
  1: 6, 2: 7, 3: 8, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12,
};

export const LINHAGENS_MATRIZES = [
  'Matriz Brasa', 'Matriz Sol', 'Matriz Lua', 'Matriz Mata',
  'Matriz Correnteza', 'Matriz Assombração', 'Matriz Cangaço', 'Matriz Armorial',
] as const;

export const SANCTUARY_24_RECEITAS = SANCTUARY_RECIPES;

export function getMinSedeForSanctuaryLevel(level: number): number {
  return SANCTUARY_LEVEL_TO_SEDE[level] ?? 6;
}

export interface CaldeiraoSynthesisResult {
  recipeId: string;
  recipeName: string;
  level: number;
  matrizA: string;
  matrizB: string;
  success: boolean;
  isMitico: boolean;
  message: string;
}

export const GrimorioSantuarioPanel = defineComponent({
  name: 'GrimorioSantuarioPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    playerSedeLevel: { type: Number, required: false },
    initialLevel: { type: Number, default: 1 },
    onSynthesized: { type: Function as PropType<(res: CaldeiraoSynthesisResult) => void>, required: false },
  },
  setup(props) {
    const selectedLevel = ref<number>(props.initialLevel ?? 1);
    const selectedMatrizA = ref<string>('Matriz Sol');
    const selectedMatrizB = ref<string>('Matriz Brasa');
    const selectedRecipeId = ref<string>('sanct_1_1');
    const isBubbling = ref<boolean>(false);
    const resultMessage = ref<string>('Selecione as matrizes e misture no caldeirão para sintetizar a receita ancestral.');

    const playerSede = computed(() => props.playerSedeLevel ?? props.runtime?.farm.getScene().getSedeLevel() ?? 12);
    const levelRecipes = computed(() => SANCTUARY_RECIPES.filter((r) => r.sanctuaryLevel === selectedLevel.value));
    const activeRecipe = computed(() => levelRecipes.value.find((r) => r.id === selectedRecipeId.value) ?? levelRecipes.value[0]);
    const minSede = computed(() => getMinSedeForSanctuaryLevel(selectedLevel.value));
    const isLevelUnlocked = computed(() => playerSede.value >= minSede.value);

    const handleSelectLevel = (lvl: number) => {
      selectedLevel.value = lvl;
      const first = SANCTUARY_RECIPES.find((r) => r.sanctuaryLevel === lvl);
      if (first) selectedRecipeId.value = first.id;
    };

    const handleMisturarCaldeirao = () => {
      if (!isLevelUnlocked.value) {
        resultMessage.value = `Sede insuficiente: Nível ${selectedLevel.value} exige Sede ${minSede.value} (Sede atual: ${playerSede.value}).`;
        return;
      }
      isBubbling.value = true;
      setTimeout(() => { isBubbling.value = false; }, 300);

      const target = activeRecipe.value;
      const isMitico = target.name.includes('Mítico') || selectedLevel.value === 8;
      cordelAudio.playTrianguloReward();
      if (isMitico) cordelAudio.playGaloCantoSupreme();

      resultMessage.value = `Caldeirão ♨️: Síntese Ancestral Concluída! ${target.name} gerado a partir de ${selectedMatrizA.value} + ${selectedMatrizB.value}!`;
      props.onSynthesized?.({
        recipeId: target.id, recipeName: target.name, level: selectedLevel.value,
        matrizA: selectedMatrizA.value, matrizB: selectedMatrizB.value, success: true, isMitico, message: resultMessage.value,
      });
    };

    return () => h('div', {
      class: 'cordel-card', 'data-testid': 'grimorio-santuario-panel',
      style: {
        border: '3px solid #5C3A21', borderRadius: '8px', padding: '12px',
        backgroundImage: "linear-gradient(rgba(253, 248, 237, 0.90), rgba(253, 248, 237, 0.94)), url('/assets/pranchas/santuario-arvore-backdrop.webp')",
        backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 8px #3E2723, 0 4px 8px rgba(0,0,0,0.15)',
      },
    }, [
      h('h3', 'Santuário Genético da Serra (Prancha 11) — Grimório Ancestral'),
      h('p', { style: { fontSize: '13px', margin: '4px 0 10px 0' } },
        `Grimório de Cordel das 24 Receitas Ancestrais (Níveis 1 a 8, Sede 6 a 12) | Sede do Jogador: ${playerSede.value}`),
      h('div', { 'data-testid': 'sanctuary-level-selector', style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' } },
        [1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
          const req = getMinSedeForSanctuaryLevel(lvl);
          const isCurrent = selectedLevel.value === lvl;
          return h('button', {
            key: lvl, type: 'button', 'data-testid': `sanctuary-level-btn-${lvl}`,
            style: {
              padding: '6px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
              border: isCurrent ? '2px solid #D7263D' : '1px solid #1B1B1B',
              backgroundColor: isCurrent ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
            },
            onClick: () => handleSelectLevel(lvl),
          }, `Nv. ${lvl} (Sede ${req})`);
        }),
      ),
      h('div', { 'data-testid': 'grimorio-recipes-catalog', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' } },
        levelRecipes.value.map((rec) => {
          const isSelected = activeRecipe.value.id === rec.id;
          const unlocked = playerSede.value >= rec.requiredSedeLevel;
          return h('div', {
            key: rec.id, 'data-testid': `recipe-card-${rec.id}`,
            style: {
              border: isSelected ? '2px solid #D7263D' : '1px solid #1B1B1B',
              backgroundColor: isSelected ? '#FFF8E7' : CORDEL_PALETTE.cremePapel,
              padding: '8px', cursor: 'pointer', borderRadius: '4px',
            },
            onClick: () => { selectedRecipeId.value = rec.id; },
          }, [
            h('div', { style: { fontWeight: 'bold', fontSize: '14px', color: rec.name.includes('Mítico') ? '#7C3AED' : CORDEL_PALETTE.tintaXilo } }, rec.name),
            h('div', { 'data-testid': `recipe-seal-${rec.id}`, style: { fontSize: '11px', fontWeight: 'bold', color: unlocked ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.vermelhoCrista, margin: '2px 0' } },
              `Selo: Sede ${rec.requiredSedeLevel} Mínima (${unlocked ? 'Desbloqueado' : 'Bloqueado'})`),
            h('div', { style: { fontSize: '12px', color: '#555' } }, rec.description),
          ]);
        }),
      ),
      h('div', {
        'data-testid': 'caldeirao-mistico-area',
        style: { border: '2px dashed #5C3A21', borderRadius: '6px', padding: '10px', backgroundColor: '#FFFDF8', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.05)' },
      }, [
        h('h4', { style: { margin: '0 0 8px 0' } }, '♨️ Caldeirão Místico da Serra (Mistura Genética)'),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('label', { style: { fontWeight: 'bold', fontSize: '13px' } }, 'Slot Matriz 1:'),
          h('select', {
            'data-testid': 'matriz-slot-1', value: selectedMatrizA.value,
            style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: '#FFF' },
            onChange: (e: any) => { selectedMatrizA.value = e.target.value; },
          }, LINHAGENS_MATRIZES.map((m) => h('option', { key: m, value: m }, m))),
          h('label', { style: { fontWeight: 'bold', fontSize: '13px', marginLeft: '6px' } }, 'Slot Matriz 2:'),
          h('select', {
            'data-testid': 'matriz-slot-2', value: selectedMatrizB.value,
            style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: '#FFF' },
            onChange: (e: any) => { selectedMatrizB.value = e.target.value; },
          }, LINHAGENS_MATRIZES.map((m) => h('option', { key: m, value: m }, m))),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-misturar-caldeirao',
            style: {
              backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B',
              padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleMisturarCaldeirao,
          }, 'MISTURAR NO CALDEIRÃO ♨️'),
          isBubbling.value ? h('span', { 'data-testid': 'caldeirao-anim-fx', style: { fontWeight: 'bold', color: CORDEL_PALETTE.vermelhoCrista } }, '🫧 ♨️ BORBULHAS DO CALDEIRÃO EM XILO! ♨️ 🫧') : null,
        ]),
        h('p', { 'data-testid': 'caldeirao-result-message', style: { marginTop: '8px', fontStyle: 'italic', fontSize: '13px' } }, resultMessage.value),
      ]),
    ]);
  },
});

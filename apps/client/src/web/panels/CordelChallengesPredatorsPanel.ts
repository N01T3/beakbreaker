import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { CORDEL_PUZZLE_FOLHETOS } from '@beakbreaker/game-data';
import {
  executeCordelPuzzle,
  repelPredator,
  PREDATORS,
  type CordelBattleOutcome,
  type PredatorRepelResult,
} from '@beakbreaker/genetics-engine';
import type { WebRuntime } from '../createWebRuntime.js';

const folheto = CORDEL_PUZZLE_FOLHETOS[0]!;

export const CordelChallengesPredatorsPanel = defineComponent({
  name: 'CordelChallengesPredatorsPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const puzzleOutcome = ref<CordelBattleOutcome | null>(null);
    const puzzleStatus = ref('Trio emprestado pronto para o desafio (Custo: 0 Fôlego).');
    const predatorOutcome = ref<PredatorRepelResult | null>(null);
    const predatorStatus = ref('Defesas rurais posicionadas para proteger a criação.');

    const handleSolvePuzzle = () => {
      const outcome = executeCordelPuzzle(folheto.id, { seed: 2 });
      puzzleOutcome.value = outcome;
      if (outcome.victory) {
        puzzleStatus.value = `Desafio Superado com Honra! Vitória em ${outcome.durationTicks} ticks (0 Fôlego gasto) | +${outcome.rewards?.goldenFeathers ?? 120} Penas Douradas e +${outcome.rewards?.wildOrbs ?? 30} Orbes Curinga!`;
      } else {
        puzzleStatus.value = 'Desafio não concluído nesta tentativa. Ajuste as posições do trio!';
      }
    };

    const handleRepelPredator = () => {
      const result = repelPredator(
        'raposa_caatinga',
        { espantalhoLevel: 3, estilingueLevel: 2, cataVentoLevel: 2 },
        [{ roosterId: 'w_lata', name: 'Galo de Lata', vigor: 800, forca: 220, velocidade: 110 }],
        3,
      );
      predatorOutcome.value = result;
      if (result.repelled) {
        predatorStatus.value = `Predador Raposa da Caatinga espantado com sucesso! (Defesa ${result.defenseScore}/${result.requiredScore}) | Resgatado: +${result.drops.rescuedCorn} Milho e +${result.drops.goldenFeathers} Penas Douradas!`;
      } else {
        predatorStatus.value = 'Defesa insuficiente para espantar o predador!';
      }
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'cordel-challenges-predators-panel', style: { marginTop: '10px' } }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'Minigames Rurais: Desafios de Cordel & Defesa contra Predadores'),
        h('div', { class: 'cordel-card', 'data-testid': 'cordel-folheto-card', style: { backgroundColor: CORDEL_PALETTE.cremePapel, marginBottom: '10px' } }, [
          h('h5', { style: { margin: '0 0 4px 0', color: CORDEL_PALETTE.tintaXilo } }, `Folheto: ${folheto.title} (Custo: 0 Fôlego)`),
          h('p', { style: { fontStyle: 'italic', margin: '4px 0', fontSize: '13px' } }, `"${folheto.rhymeVerse.slice(0, 2).join(' / ')}..."`),
          h('p', { style: { fontSize: '12px', margin: '4px 0' } }, [
            h('strong', 'Trio Emprestado: '),
            folheto.borrowedTeam.map((u) => `${u.name} (Nv ${u.level} - ${u.row})`).join(', '),
          ]),
          h('button', {
            type: 'button', 'data-testid': 'button-solve-cordel-puzzle',
            style: {
              backgroundColor: CORDEL_PALETTE.azulAnil, color: CORDEL_PALETTE.cremePapel,
              border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleSolvePuzzle,
          }, 'Resolver Desafio de Cordel (0 Fôlego)'),
          h('p', { style: { fontWeight: 'bold', fontSize: '13px', marginTop: '6px', color: CORDEL_PALETTE.verdeMata } }, puzzleStatus.value),
        ]),
        h('div', { class: 'cordel-card', 'data-testid': 'predator-alert-banner', style: { backgroundColor: '#FFF5F5', border: '2px solid #C0392B' } }, [
          h('h5', { style: { margin: '0 0 4px 0', color: CORDEL_PALETTE.vermelhoCrista } }, `⚠️ Alerta no Terreiro: ${PREDATORS.raposa_caatinga.name} à espreita!`),
          h('p', { style: { margin: '4px 0', fontSize: '13px' } }, `${PREDATORS.raposa_caatinga.description} Ameaça: ${PREDATORS.raposa_caatinga.threatPower} pts.`),
          h('button', {
            type: 'button', 'data-testid': 'button-repel-predator',
            style: {
              backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel,
              border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleRepelPredator,
          }, 'Espantar Predador com Defesas Rurais'),
          h('p', { style: { fontWeight: 'bold', fontSize: '13px', marginTop: '6px', color: CORDEL_PALETTE.tintaXilo } }, predatorStatus.value),
        ]),
      ]);
  },
});

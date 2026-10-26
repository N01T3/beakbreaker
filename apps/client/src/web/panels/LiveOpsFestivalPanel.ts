import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';

const LABYRINTH_PATH_TILES = ['1_0', '1_1', '2_1', '2_2', '3_2', '4_2', '4_3', '4_4'] as const;

export const LiveOpsFestivalPanel = defineComponent({
  name: 'LiveOpsFestivalPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const stepIndex = ref(0);
    const currentNode = ref('0_0');
    const fogClearedCount = ref(props.runtime.liveOps.labyrinthScene.getRevealedCount());
    const rewardStatus = ref(
      'Roda da Feira (2h) pronta | Loteria de Sexta & TV Sertão Ao Vivo disponíveis',
    );
    const ticketDayCounter = ref(1);

    const handleLabyrinthStep = () => {
      const scene = props.runtime.liveOps.labyrinthScene;
      if (scene.getTokensBalance() < 25) {
        scene.setTokensBalance(200);
      }
      const targetTileId =
        LABYRINTH_PATH_TILES[stepIndex.value % LABYRINTH_PATH_TILES.length] ?? '1_0';
      stepIndex.value += 1;
      const stepRes = scene.revealAndStep(targetTileId);
      currentNode.value = stepRes.tile?.tileId ?? targetTileId;
      fogClearedCount.value = scene.getRevealedCount();
    };

    const handleSpinWheel = () => {
      const spinRes = props.runtime.liveOps.spinSaoJoaoWheel(120);
      if (spinRes.allowed) {
        rewardStatus.value = `Roda da Feira (2h): Ganhou +${spinRes.amount} ${spinRes.rewardType} | Temporada: ${props.runtime.liveOps.getActiveSeasonName()}`;
      }
    };

    const handleWatchTvSertao = () => {
      const tickets = props.runtime.liveOps.claimFridayLotteryTicket(ticketDayCounter.value);
      ticketDayCounter.value = Math.min(5, ticketDayCounter.value + 1);
      const latestTicket = tickets[tickets.length - 1] ?? 'BILHETE_SEXTA_1';
      rewardStatus.value = `TV Sertão Ao Vivo Assistida: +1 Bilhete (${latestTicket}) | Total na Loteria do Sertão: ${tickets.length}/5`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'liveops-festival-panel' }, [
        h('h3', 'Labirinto de São João, Neblina do Sertão, Roda da Feira & TV Sertão'),
        h(
          'p',
          { 'data-testid': 'labyrinth-status' },
          `Casa Atual no Labirinto: ${currentNode.value} | Quadrantes de Neblina Revelados: ${fogClearedCount.value} | Fichas: ${props.runtime.liveOps.labyrinthScene.getTokensBalance()}`,
        ),
        h(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          [
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-labyrinth-step',
                style: {
                  backgroundColor: CORDEL_PALETTE.amareloMilho,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleLabyrinthStep,
              },
              'Avançar Casa no Labirinto',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-spin-wheel',
                style: {
                  backgroundColor: CORDEL_PALETTE.vermelhoCrista,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleSpinWheel,
              },
              'Girar Roda da Feira',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-watch-tv-sertao',
                style: {
                  backgroundColor: CORDEL_PALETTE.verdeMata,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleWatchTvSertao,
              },
              'Assistir TV Sertão Ao Vivo (+Bilhete)',
            ),
          ],
        ),
        h('p', { 'data-testid': 'festival-reward-status' }, rewardStatus.value),
      ]);
  },
});

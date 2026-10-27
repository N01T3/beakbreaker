import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface RaceCheckpoint {
  lap: number;
  name: string;
  badge: string;
}

export const RACE_CHECKPOINTS: readonly RaceCheckpoint[] = [
  { lap: 5, name: 'Baú do Sertão', badge: 'V5' },
  { lap: 10, name: 'Baú do Peregrino', badge: 'V10' },
  { lap: 15, name: 'BAÚ VIP DO SERTÃO', badge: 'V15 (VIP)' },
  { lap: 18, name: 'Chegada da Glória', badge: 'V18 (640 Orbes)' },
];

export const HeroRaceTrackPanel = defineComponent({
  name: 'HeroRaceTrackPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialLap: { type: Number, default: 7 },
  },
  setup(props) {
    const lap = ref(props.initialLap ?? 7);
    const node = ref(2);
    const lastDice = ref(4);
    const isVipClaimed = ref(false);
    const raceStatus = ref('Galo Corredor na terra do sertão! Lance o dado para avançar na pista.');

    const handleRollDice = () => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      lastDice.value = rolled;
      cordelAudio.playBerimbauTwang();

      let nextNode = node.value + rolled;
      let nextLap = lap.value;
      while (nextNode > 5 && nextLap < 18) {
        nextNode -= 5;
        nextLap += 1;
      }
      if (nextLap >= 18) {
        nextLap = 18;
        nextNode = Math.min(5, nextNode);
      }
      lap.value = nextLap;
      node.value = nextNode;

      if (props.runtime) {
        props.runtime.state.heroRaceLap = nextLap;
        props.runtime.liveOps.heroRaceScene.advanceNode('p_1', rolled);
      }
      raceStatus.value = `Dado rolou ${rolled}! Galo avançou para Volta ${nextLap}/18 (Nó ${nextNode}/5).`;
    };

    const handleClaimVipChest = () => {
      isVipClaimed.value = true;
      cordelAudio.playTrianguloReward();
      raceStatus.value = 'BAÚ VIP DO SERTÃO resgatado! Ave Heróica Lendária desbloqueada no terreiro!';
    };

    return () => {
      const progressPct = Math.min(100, Math.round((lap.value / 18) * 100));

      return h('div', {
        class: 'cordel-card',
        'data-testid': 'hero-race-track-panel',
        style: { border: '3px solid #1B1B1B', padding: '14px', background: '#F8F4EC' },
      }, [
        h('div', {
          style: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '2px dashed #1B1B1B', paddingBottom: '6px',
          },
        }, [
          h('h3', {
            'data-testid': 'race-title',
            style: { margin: 0, color: CORDEL_PALETTE.tintaXilo },
          }, 'Corrida de Heróis: Pista Sertaneja'),
          h('span', {
            'data-testid': 'race-lap-counter',
            class: 'cordel-badge',
            style: { backgroundColor: CORDEL_PALETTE.amareloMilho, padding: '4px 8px', fontWeight: 'bold' },
          }, `Volta ${lap.value}/18`),
        ]),
        h('div', {
          'data-testid': 'race-circuit-view',
          style: {
            margin: '12px 0', padding: '12px', border: '2px solid #1B1B1B', borderRadius: '6px',
            backgroundColor: '#D2A679', backgroundImage: 'radial-gradient(#8B4513 10%, transparent 11%)',
            backgroundSize: '16px 16px', position: 'relative',
          },
        }, [
          h('div', {
            style: { display: 'flex', justifyContent: 'space-between', color: '#FFF', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' },
          }, [
            h('span', '🏜️ Circuito de Terra Batida do Sertão'),
            h('span', { 'data-testid': 'race-node-info' }, `Nó ${node.value}/5 | Dado: 🎲 ${lastDice.value}`),
          ]),
          h('div', {
            style: {
              height: '24px', width: '100%', backgroundColor: '#5C3818',
              border: '2px solid #1B1B1B', borderRadius: '12px', position: 'relative',
            },
          }, [
            h('div', {
              style: {
                height: '100%', width: `${progressPct}%`, backgroundColor: CORDEL_PALETTE.amareloMilho,
                borderRadius: '10px', transition: 'width 0.3s ease',
              },
            }),
            h('div', {
              'data-testid': 'race-runner-rooster',
              style: {
                position: 'absolute', top: '-4px', left: `calc(${Math.min(92, progressPct)}% - 10px)`,
                fontSize: '22px', transition: 'left 0.3s ease',
              },
            }, '🐓'),
          ]),
          h('div', {
            style: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', fontWeight: 'bold' },
          }, RACE_CHECKPOINTS.map((cp) =>
            h('div', {
              key: cp.lap,
              'data-testid': `checkpoint-lap-${cp.lap}`,
              style: {
                backgroundColor: lap.value >= cp.lap ? CORDEL_PALETTE.verdeMata : '#ECE0C8',
                color: lap.value >= cp.lap ? '#FFF' : '#333',
                padding: '3px 6px', borderRadius: '4px', border: '1px solid #1B1B1B', textAlign: 'center',
              },
            }, [
              h('div', `Volta ${cp.lap}`),
              h('div', cp.badge),
            ]),
          )),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' } }, [
          h('button', {
            type: 'button',
            'data-testid': 'btn-roll-dice-race',
            style: {
              flex: 1, backgroundColor: CORDEL_PALETTE.amareloMilho, color: CORDEL_PALETTE.tintaXilo,
              border: '2px solid #1B1B1B', padding: '10px 14px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleRollDice,
          }, 'AVANÇAR COM DADO 🎲'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-claim-vip-chest',
            style: {
              flex: 1, backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel,
              border: '2px solid #1B1B1B', padding: '10px 14px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleClaimVipChest,
          }, isVipClaimed.value ? 'BAÚ VIP DO SERTÃO (RESGATADO)' : 'BAÚ VIP DO SERTÃO'),
        ]),
        h('p', {
          'data-testid': 'race-status-message',
          style: {
            margin: '10px 0 0 0', fontSize: '13px', fontWeight: 'bold', textAlign: 'center',
            color: CORDEL_PALETTE.tintaXilo,
          },
        }, raceStatus.value),
      ]);
    };
  },
});

import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export const LABYRINTH_RANDOM_EVENTS = ['Desafio de Canto', 'Tesouro de Milho', 'Fogueira Revigorante'] as const;

export const ARRAIAL_WHEEL_SLICES = [
  '500 Milho', '50 Penas Douradas', '20 Orbes Curinga', 'Ficha Junina',
  '1.000 Milho', '100 Penas Douradas', 'Poção de Canto', 'Baú do Arraial',
] as const;

export const LabirintoRodaVisualPanel = defineComponent({
  name: 'LabirintoRodaVisualPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const playerStep = ref(0);
    const labMessage = ref('Labirinto coberto de névoa. Fogueiras acesas aquecem o caminho.');
    const activeEvent = ref<string>('Fogueira Revigorante');
    const tickets = ref(3);
    const recentPrizes = ref<string[]>(['100 Penas Douradas', '500 Milho']);
    const wheelMessage = ref('Bilheteria pronta: Roda do Arraial com 8 fatias e bandeirolas juninas.');
    const selectedSlice = ref(0);

    const handleJogarLabirinto = () => {
      playerStep.value = 0;
      activeEvent.value = 'Fogueira Revigorante';
      labMessage.value = 'Labirinto de São João iniciado! Fogueira acesa ilumina a grade de pedras.';
      cordelAudio.playZabumbaTabSwitch();
    };

    const handleMoverPasso = () => {
      playerStep.value = (playerStep.value + 1) % 8;
      const ev = LABYRINTH_RANDOM_EVENTS[playerStep.value % LABYRINTH_RANDOM_EVENTS.length]!;
      activeEvent.value = ev;
      if (ev === 'Tesouro de Milho') cordelAudio.playHarvestMilho();
      else cordelAudio.playZabumbaTabSwitch();
      labMessage.value = `Passo ${playerStep.value + 1}/8: Pedra explorada! Evento acionado: ${ev}!`;
    };

    const handleGirarRoda = () => {
      if (tickets.value <= 0) tickets.value = 3;
      tickets.value -= 1;
      const idx = Math.floor(Math.random() * ARRAIAL_WHEEL_SLICES.length);
      selectedSlice.value = idx;
      const prize = ARRAIAL_WHEEL_SLICES[idx]!;
      recentPrizes.value = [prize, ...recentPrizes.value.slice(0, 3)];
      cordelAudio.playSanfonaVictory();
      wheelMessage.value = `Roda girou e parou na fatia #${idx + 1}: ${prize}!`;
    };

    return () =>
      h('div', {
        class: 'cordel-card', 'data-testid': 'labirinto-roda-visual-panel',
        style: { border: '3px solid #1B1B1B', padding: '12px', background: CORDEL_PALETTE.cremePapel },
      }, [
        h('h3', { style: { margin: '0 0 10px 0', color: CORDEL_PALETTE.tintaXilo } },
          'Eventos de São João: Labirinto das Fogueiras & Roda do Arraial'),
        h('div', {
          'data-testid': 'labirinto-sao-joao-card',
          style: { border: '2px solid #1B1B1B', padding: '10px', background: '#F4ECE1', marginBottom: '12px' },
        }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
            h('strong', 'Labirinto de São João (Grade de Pedras com Névoa)'),
            h('span', { class: 'cordel-badge', style: { background: CORDEL_PALETTE.amareloMilho, padding: '2px 6px', fontWeight: 'bold' } },
              `Passo ${playerStep.value + 1}/8`),
          ]),
          h('div', { 'data-testid': 'stone-grid-labyrinth', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: '8px 0' } },
            Array.from({ length: 8 }).map((_, i) => {
              const isCurrent = playerStep.value === i;
              const hasFire = i % 2 === 0;
              return h('div', {
                key: i, 'data-testid': `labyrinth-tile-${i}`,
                style: {
                  padding: '8px 4px', textAlign: 'center', border: '1px solid #1B1B1B', borderRadius: '4px',
                  background: isCurrent ? CORDEL_PALETTE.amareloMilho : (i <= playerStep.value ? '#DDD0BE' : '#B8B0A2'),
                  fontWeight: 'bold', fontSize: '11px',
                },
              }, [
                h('div', isCurrent ? '🧭 Galo' : (hasFire ? '🔥 Fogueira de São João acesa' : '🌫️ Névoa')),
                h('div', { style: { fontSize: '9px', color: '#444' } }, `Pedra #${i + 1}`),
              ]);
            })),
          h('p', { 'data-testid': 'labyrinth-event-display', style: { margin: '6px 0', fontSize: '12px', fontWeight: 'bold', color: CORDEL_PALETTE.terracota } },
            `Evento da Casa: ${activeEvent.value}`),
          h('div', { style: { display: 'flex', gap: '8px' } }, [
            h('button', {
              type: 'button', 'data-testid': 'btn-jogar-labirinto',
              style: { flex: 1, background: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '8px', fontWeight: 'bold', cursor: 'pointer' },
              onClick: handleJogarLabirinto,
            }, 'JOGAR LABIRINTO'),
            h('button', {
              type: 'button', 'data-testid': 'btn-mover-passo',
              style: { flex: 1, background: CORDEL_PALETTE.verdeMata, color: '#FFF', border: '2px solid #1B1B1B', padding: '8px', fontWeight: 'bold', cursor: 'pointer' },
              onClick: handleMoverPasso,
            }, 'MOVER PASSO 🧭'),
          ]),
          h('p', { 'data-testid': 'labirinto-status-msg', style: { margin: '6px 0 0 0', fontSize: '12px', fontStyle: 'italic' } }, labMessage.value),
        ]),
        h('div', { 'data-testid': 'roda-arraial-card', style: { border: '2px solid #1B1B1B', padding: '10px', background: '#FFF7E6' } }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
            h('strong', '🎪 Roda do Arraial (8 Fatias com Bandeirolas Juninas 🎏)'),
            h('span', { 'data-testid': 'tickets-counter', class: 'cordel-badge', style: { background: CORDEL_PALETTE.vermelhoCrista, color: '#FFF', padding: '2px 6px', fontWeight: 'bold' } },
              `Bilheteria: ${tickets.value} Ingressos`),
          ]),
          h('div', { 'data-testid': 'wheel-slices-grid', style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: '8px 0' } },
            ARRAIAL_WHEEL_SLICES.map((slice, idx) =>
              h('div', {
                key: idx, 'data-testid': `wheel-slice-${idx}`,
                style: {
                  padding: '6px 2px', textAlign: 'center', border: selectedSlice.value === idx ? '2px solid #B8332A' : '1px dashed #1B1B1B',
                  background: selectedSlice.value === idx ? '#FFE0B2' : '#FFFDF7', fontSize: '11px', fontWeight: 'bold',
                },
              }, `${idx + 1}. ${slice}`))),
          h('button', {
            type: 'button', 'data-testid': 'btn-girar-roda',
            style: { width: '100%', background: CORDEL_PALETTE.vermelhoCrista, color: '#FFF', border: '2px solid #1B1B1B', padding: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' },
            onClick: handleGirarRoda,
          }, 'GIRAR RODA (1 Ingresso)'),
          h('p', { 'data-testid': 'wheel-status-msg', style: { margin: '6px 0', fontSize: '12px', fontWeight: 'bold' } }, wheelMessage.value),
          h('div', { 'data-testid': 'recent-wheel-prizes', style: { fontSize: '12px', background: '#F0E6D2', padding: '6px', border: '1px solid #1B1B1B' } }, [
            h('span', { style: { fontWeight: 'bold' } }, 'Histórico Recente de Prêmios: '),
            h('span', recentPrizes.value.join(' | ')),
          ]),
        ]),
      ]);
  },
});

import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface DuplicateRoosterOption {
  id: string;
  name: string;
  defaultNg: number;
}

export const DEFAULT_DUPLICATES: DuplicateRoosterOption[] = [
  { id: 'rooster_01', name: 'Galo de Lata (Repetido)', defaultNg: 1 },
  { id: 'rooster_05', name: 'Brisa do Rio (Repetido)', defaultNg: 30 },
  { id: 'rooster_12', name: 'Mandacaru Bravo (Repetido)', defaultNg: 1 },
];

export const ArvoreDaVidaOrbesPanel = defineComponent({
  name: 'ArvoreDaVidaOrbesPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialOrbs: { type: Number, default: 0 },
    initialWildcards: { type: Number, default: 40 },
    onRecycled: { type: Function as PropType<(info: { roosterId: string; ng: number; orbs: number }) => void> },
    onSummoned: { type: Function as PropType<(roosterName: string) => void> },
  },
  setup(props) {
    const selectedRoosterId = ref(DEFAULT_DUPLICATES[0]!.id);
    const selectedNg = ref<number>(1);
    const orbsBalance = ref<number>(props.initialOrbs);
    const wildcardOrbs = ref<number>(props.initialWildcards);
    const isHappyHourActive = ref<boolean>(false);
    const summonResult = ref<string | null>(null);
    const recycleFeedback = ref<string>('Selecione um galo repetido para reciclar na Árvore da Vida.');

    const canSummon = computed(() => {
      const spec = orbsBalance.value;
      const wild = wildcardOrbs.value;
      if (spec >= 100) return true;
      if (props.runtime?.genetics) {
        return props.runtime.genetics.canSummonWithWildcardOrbs(spec, wild, isHappyHourActive.value);
      }
      return isHappyHourActive.value ? (spec + wild >= 100) : (spec >= 80 && spec + wild >= 100);
    });

    const toggleHappyHour = () => {
      isHappyHourActive.value = !isHappyHourActive.value;
      if (isHappyHourActive.value) cordelAudio.playSanfonaVictory();
    };

    const handleRecycle = (targetNg: 1 | 30) => {
      selectedNg.value = targetNg;
      const orbsAwarded = props.runtime?.genetics
        ? props.runtime.genetics.calculateTreeOfLifeExtractionOrbs(targetNg)
        : (targetNg === 30 ? 100 : 40);
      orbsBalance.value += orbsAwarded;
      cordelAudio.playHarvestMilho();
      recycleFeedback.value = `Reciclado no NG ${targetNg}! +${orbsAwarded} Orbes da Árvore da Vida concedidos.`;
      props.onRecycled?.({ roosterId: selectedRoosterId.value, ng: targetNg, orbs: orbsAwarded });
    };

    const handleSummon = () => {
      if (!canSummon.value) return;
      if (orbsBalance.value >= 100) {
        orbsBalance.value -= 100;
      } else {
        const diff = 100 - orbsBalance.value;
        orbsBalance.value = 0;
        wildcardOrbs.value = Math.max(0, wildcardOrbs.value - diff);
      }
      cordelAudio.playGaloCantoSupreme();
      const summoned = '#18 Trovão do Sertão (Lendário Inédito)';
      summonResult.value = `Convocação Mística Concluída! Galo Obtido: ${summoned}`;
      props.onSummoned?.(summoned);
    };

    return () => {
      const progressValue = Math.min(100, orbsBalance.value + (isHappyHourActive.value ? wildcardOrbs.value : Math.min(20, wildcardOrbs.value)));
      return h('div', {
        class: 'cordel-card', 'data-testid': 'arvore-da-vida-orbes-panel',
        style: {
          border: '3px solid #5C3A21', borderRadius: '8px', padding: '12px',
          backgroundImage: "linear-gradient(rgba(253, 248, 237, 0.90), rgba(253, 248, 237, 0.94)), url('/assets/pranchas/santuario-arvore-backdrop.webp')",
          backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 8px #3E2723, 0 4px 8px rgba(0,0,0,0.15)',
        },
      }, [
        h('h3', { style: { marginTop: 0 } }, 'Árvore da Vida — Reciclagem & Orbes Curinga (Prancha 11)'),
        h('div', {
          'data-testid': 'happy-hour-banner',
          style: {
            padding: '10px', marginBottom: '12px', border: `2px solid ${isHappyHourActive.value ? CORDEL_PALETTE.amareloMilho : '#444'}`,
            backgroundColor: isHappyHourActive.value ? '#FFF9E6' : CORDEL_PALETTE.cremePapel,
            boxShadow: isHappyHourActive.value ? '0 0 12px #F4B400' : 'none',
          },
        }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }, [
            h('strong', { 'data-testid': 'happy-hour-badge', style: { color: isHappyHourActive.value ? '#B45309' : '#1B1B1B' } },
              isHappyHourActive.value ? '🌟 HAPPY HOUR DE ORBES CURINGA (100% Curingas Liberado!)' : 'Regra Padrão: 80% Galo / 20% Curinga'),
            h('button', {
              type: 'button', 'data-testid': 'toggle-happy-hour',
              style: { padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid #1B1B1B', backgroundColor: isHappyHourActive.value ? CORDEL_PALETTE.amareloMilho : '#EEE' },
              onClick: toggleHappyHour,
            }, isHappyHourActive.value ? 'Desativar Happy Hour' : 'Ativar Happy Hour (Qua/Sex)'),
          ]),
          h('p', { style: { fontSize: '13px', margin: '4px 0 0 0' } },
            isHappyHourActive.value ? 'Quarta e Sexta: Use até 100% de Orbes Curinga para qualquer convocação ou estrela!'
              : 'Dias comuns: Exige 80% de orbes da própria ave e no máximo 20% de orbes curinga.'),
        ]),
        h('div', { 'data-testid': 'arvore-reciclagem-card', style: { border: '2px solid #1B1B1B', padding: '10px', marginBottom: '12px', backgroundColor: '#FFF' } }, [
          h('h4', { style: { margin: '0 0 6px 0' } }, 'Reciclagem de Galos Repetidos'),
          h('p', { style: { fontSize: '13px', margin: '0 0 8px 0', color: '#555' } },
            'Regras do GDD: reciclar galo repetido no NG 1 entrega 40 Orbes; alimentar com Milho até NG 30 entrega 100 Orbes!'),
          h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
            h('label', { style: { fontWeight: 'bold', fontSize: '13px' } }, 'Galo Repetido:'),
            h('select', {
              'data-testid': 'select-duplicate-rooster', value: selectedRoosterId.value,
              style: { padding: '4px 8px', border: '1px solid #1B1B1B' },
              onChange: (e: Event) => { selectedRoosterId.value = (e.target as HTMLSelectElement).value; },
            }, DEFAULT_DUPLICATES.map((d) => h('option', { key: d.id, value: d.id }, d.name))),
          ]),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
            h('button', {
              type: 'button', 'data-testid': 'btn-recycle-ng1',
              style: { padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel },
              onClick: () => handleRecycle(1),
            }, 'Reciclar no NG 1 (+40 Orbes)'),
            h('button', {
              type: 'button', 'data-testid': 'btn-recycle-ng30',
              style: { padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.amareloMilho },
              onClick: () => handleRecycle(30),
            }, 'Reciclar no NG 30 (+100 Orbes com Milho)'),
          ]),
          h('p', { 'data-testid': 'recycle-feedback', style: { fontSize: '13px', marginTop: '6px', fontWeight: 'bold', color: CORDEL_PALETTE.verdeMata } }, recycleFeedback.value),
        ]),
        h('div', { 'data-testid': 'convocacao-mistica-card', style: { border: '2px solid #1B1B1B', padding: '10px', backgroundColor: '#FFF' } }, [
          h('h4', { style: { margin: '0 0 6px 0' } }, 'Convocação Mística (100 Orbes)'),
          h('div', { 'data-testid': 'orbs-balance-label', style: { fontSize: '14px', marginBottom: '6px' } },
            `Saldo: ${orbsBalance.value} Orbes da Ave | ${wildcardOrbs.value} Orbes Curinga`),
          h('div', { 'data-testid': 'orbs-progress-wrapper', style: { border: '2px solid #1B1B1B', height: '22px', backgroundColor: '#EEE', position: 'relative', marginBottom: '8px' } }, [
            h('div', {
              'data-testid': 'orbs-progress-bar',
              style: { width: `${progressValue}%`, height: '100%', backgroundColor: CORDEL_PALETTE.amareloMilho, transition: 'width 0.3s' },
            }),
            h('span', {
              'data-testid': 'orbs-progress-text',
              style: { position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: '12px', fontWeight: 'bold', lineHeight: '22px' },
            }, `${progressValue}/100 Orbes para Convocar Galo Inédito`),
          ]),
          h('button', {
            type: 'button', 'data-testid': 'btn-summon-rooster',
            disabled: !canSummon.value,
            style: {
              padding: '10px 16px', fontWeight: 'bold', cursor: canSummon.value ? 'pointer' : 'not-allowed',
              border: '2px solid #1B1B1B', backgroundColor: canSummon.value ? CORDEL_PALETTE.vermelhoCrista : '#CCC',
              color: canSummon.value ? '#FFF' : '#666',
            },
            onClick: handleSummon,
          }, 'CONVOCAR GALO INÉDITO (100 Orbes)'),
          summonResult.value ? h('p', { 'data-testid': 'summon-result', style: { fontWeight: 'bold', marginTop: '8px', color: CORDEL_PALETTE.azulAnil } }, summonResult.value) : null,
        ]),
      ]);
    };
  },
});

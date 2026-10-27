import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  buildRoosterLineageTree,
  calculateMaxWildOrbsAllowed,
  createPedigreeNode,
  evaluatePedigreeBonus,
  isWildOrbHappyHourActive,
  type PedigreeNode,
} from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

export const PedigreeLineagePanel = defineComponent({
  name: 'PedigreeLineagePanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const isPureSelected = ref<boolean>(true);
    const simulatedDay = ref<'qua' | 'sex' | 'ter'>('qua');

    const simulatedTimestamp = computed(() => {
      if (simulatedDay.value === 'qua') return Date.UTC(2026, 9, 28, 12, 0);
      if (simulatedDay.value === 'sex') return Date.UTC(2026, 9, 30, 12, 0);
      return Date.UTC(2026, 9, 27, 12, 0);
    });

    const isHappyHour = computed(() => isWildOrbHappyHourActive(simulatedTimestamp.value));
    const maxWildOrbs = computed(() => calculateMaxWildOrbsAllowed(1000, simulatedTimestamp.value));

    const currentBird = computed<PedigreeNode>(() => {
      if (isPureSelected.value) {
        const g1Paternal = createPedigreeNode({ roosterId: 'avo_p', roosterNumber: 1, name: 'Galo de Lata #01', primaryElement: 'Brasa' });
        const g1Maternal = createPedigreeNode({ roosterId: 'avo_m', roosterNumber: 2, name: 'Faísca Ancestral #02', primaryElement: 'Brasa' });
        const pai = createPedigreeNode({ roosterId: 'pai_puro', name: 'Brasa Soberana', primaryElement: 'Brasa', father: g1Paternal, mother: g1Maternal });
        const mae = createPedigreeNode({ roosterId: 'mae_pura', name: 'Labareda Mansa', primaryElement: 'Brasa', father: g1Paternal, mother: g1Maternal });
        return createPedigreeNode({ roosterId: 'ave_pura', name: 'Atleta do Sertão Soberano', primaryElement: 'Brasa', father: pai, mother: mae });
      }
      const pai = createPedigreeNode({ roosterId: 'pai_hibrido', name: 'Brasa Forte', primaryElement: 'Brasa', generation: 1 });
      const mae = createPedigreeNode({ roosterId: 'mae_hibrida', name: 'Brisa do Rio', primaryElement: 'Correnteza', generation: 1 });
      return createPedigreeNode({ roosterId: 'ave_hibrida', name: 'Galo Relâmpago Mestiço', primaryElement: 'Brasa', secondaryElement: 'Correnteza', father: pai, mother: mae });
    });

    const tree = computed(() => buildRoosterLineageTree(currentBird.value));
    const bonus = computed(() => evaluatePedigreeBonus(currentBird.value));

    const handleToggleLineage = () => {
      isPureSelected.value = !isPureSelected.value;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'pedigree-lineage-panel' }, [
        h('h3', 'Genealogia, Árvore de Linhagem & Selo de Origem'),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-toggle-rooster-lineage',
            style: {
              backgroundColor: isPureSelected.value ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.amareloMilho,
              color: isPureSelected.value ? '#FFFFFF' : CORDEL_PALETTE.tintaXilo,
              border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleToggleLineage,
          }, isPureSelected.value ? 'Exibindo: Linhagem Pura' : 'Exibindo: Linhagem Híbrida'),
          h('div', {
            'data-testid': 'lineage-status-badge',
            style: {
              backgroundColor: tree.value.isPureLineage ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel,
              color: tree.value.isPureLineage ? '#FFFFFF' : CORDEL_PALETTE.tintaXilo,
              border: '2px solid #1B1B1B', padding: '4px 8px', fontWeight: 'bold',
            },
          }, tree.value.isPureLineage
            ? `Selo: Linhagem Pura (+${bonus.value}% bônus de produção de milho no poleiro)`
            : 'Linhagem Híbrida / Mestiça (Sem bônus de pureza de poleiro)'),
        ]),
        h('div', {
          'data-testid': 'pedigree-tree-view',
          style: { border: '2px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, padding: '10px', marginBottom: '10px' },
        }, [
          h('div', { style: { fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' } },
            `Ave: ${currentBird.value.name} (Elemento: ${currentBird.value.primaryElement}${currentBird.value.secondaryElement ? ' / ' + currentBird.value.secondaryElement : ''}) - Geração G${currentBird.value.generation}`),
          h('div', { style: { marginLeft: '12px', marginBottom: '4px' } },
            `├─ Pai: ${currentBird.value.father?.name ?? 'Ancestral'} (${currentBird.value.father?.primaryElement ?? '-'}) | Mãe: ${currentBird.value.mother?.name ?? 'Ancestral'} (${currentBird.value.mother?.primaryElement ?? '-'}`),
          currentBird.value.father?.father
            ? h('div', { style: { marginLeft: '24px', color: '#555' } },
                `└─ Avós: ${currentBird.value.father.father.name} & ${currentBird.value.father.mother?.name ?? 'Ancestral'}`)
            : null,
        ]),
        h('div', {
          'data-testid': 'happy-hour-banner',
          style: {
            backgroundColor: isHappyHour.value ? CORDEL_PALETTE.amareloMilho : '#F5E9D3',
            border: '2px dashed #1B1B1B', padding: '8px 12px', borderRadius: '4px',
          },
        }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' } }, [
            h('span', { style: { fontWeight: 'bold' } },
              isHappyHour.value
                ? `🎉 HAPPY HOUR DE ORBES CURINGAS ATIVO! Quartas e Sextas: até 100% de uso liberado (${maxWildOrbs.value}/1.000 orbes)!`
                : `📅 Dia Comum: Limite de 20% de Orbes Curingas (${maxWildOrbs.value}/1.000 orbes). Retorne quarta ou sexta para 100%!`),
            h('div', { style: { display: 'flex', gap: '4px' } }, [
              h('button', {
                type: 'button', 'data-testid': 'btn-day-qua',
                style: { backgroundColor: simulatedDay.value === 'qua' ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, color: simulatedDay.value === 'qua' ? '#FFF' : '#000', border: '1px solid #1B1B1B', padding: '2px 6px', cursor: 'pointer' },
                onClick: () => { simulatedDay.value = 'qua'; },
              }, 'Quarta'),
              h('button', {
                type: 'button', 'data-testid': 'btn-day-sex',
                style: { backgroundColor: simulatedDay.value === 'sex' ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, color: simulatedDay.value === 'sex' ? '#FFF' : '#000', border: '1px solid #1B1B1B', padding: '2px 6px', cursor: 'pointer' },
                onClick: () => { simulatedDay.value = 'sex'; },
              }, 'Sexta'),
              h('button', {
                type: 'button', 'data-testid': 'btn-day-ter',
                style: { backgroundColor: simulatedDay.value === 'ter' ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, color: simulatedDay.value === 'ter' ? '#FFF' : '#000', border: '1px solid #1B1B1B', padding: '2px 6px', cursor: 'pointer' },
                onClick: () => { simulatedDay.value = 'ter'; },
              }, 'Terça'),
            ]),
          ]),
        ]),
      ]);
  },
});

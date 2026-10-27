import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  BARN_PROTECTION_TABLE,
  getBarnProtectionConfig,
  calculateLootableCorn,
  calculateMaxNg,
  calculateAstralNgBonus,
  calculateCornPerMinute,
  calculateMinutesToLevelUp,
  calculateTrainingProgress,
  type TrainingProgressResult,
} from '@beakbreaker/genetics-engine';
import type { WebRuntime } from '../createWebRuntime.js';

export function calculateTrainingCost(currentNg: number, minutes: number): number {
  return calculateCornPerMinute(currentNg) * minutes;
}

export function calculateLazyTraining(
  currentNg: number,
  minutes: number,
  availableCorn: number,
  sedeLevel: number,
  stars = 0,
): TrainingProgressResult {
  return calculateTrainingProgress({
    currentNg,
    sedeLevel,
    stars,
    startTimeMs: 0,
    nowMs: minutes * 60_000,
    availableCorn,
  });
}

export const BarnTrainingPanel = defineComponent({
  name: 'BarnTrainingPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialSedeLevel: { type: Number, default: 1 },
    initialStoredCorn: { type: Number, default: 50_000 },
    initialNg: { type: Number, default: 5 },
    initialStars: { type: Number, default: 0 },
  },
  setup(props) {
    const sedeLevel = ref(props.runtime?.farm.getScene().getSedeLevel() ?? props.initialSedeLevel);
    const storedCorn = ref(props.runtime?.state.storedPerchMilho ?? props.initialStoredCorn);
    const currentNg = ref(props.initialNg);
    const stars = ref(props.initialStars);
    const trainingMinutes = ref(30);

    const barnConfig = computed(() => getBarnProtectionConfig(sedeLevel.value));
    const maxNgCap = computed(() => calculateMaxNg(sedeLevel.value, stars.value));
    const astralBonus = computed(() => calculateAstralNgBonus(stars.value));
    const lootableResult = computed(() => calculateLootableCorn(storedCorn.value, sedeLevel.value));
    const costPerMin = computed(() => calculateCornPerMinute(currentNg.value));
    const trainingCost = computed(() => calculateTrainingCost(currentNg.value, trainingMinutes.value));

    const trainingStatus = ref('Pronto para treino lazy no Centro de Treinamento');
    const barnStatus = ref('');

    const handleStartTraining = () => {
      const res = calculateLazyTraining(
        currentNg.value,
        trainingMinutes.value,
        storedCorn.value,
        sedeLevel.value,
        stars.value,
      );
      currentNg.value = res.finalNg;
      storedCorn.value = res.remainingCorn;
      trainingStatus.value = `Treino concluído: NG ${res.initialNg} -> ${res.finalNg} (+${res.levelsGained}) | Milho gasto: ${res.cornConsumed} (${res.stoppedReason})`;
    };

    const handleHarvestSafeBarn = () => {
      const loot = lootableResult.value;
      barnStatus.value = `Celeiro Sede ${sedeLevel.value}: ${loot.protectedCorn.toLocaleString()} Milho protegido contra saques | Saqueável: ${loot.lootableCorn.toLocaleString()} (Máx 20%: ${loot.maxStealableCorn20Pct.toLocaleString()})`;
    };

    const handleSetSedeLevel = (lvl: number) => {
      sedeLevel.value = Math.max(1, Math.min(12, lvl));
      handleHarvestSafeBarn();
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'barn-training-panel', style: { border: '2px solid #1B1B1B', padding: '12px', margin: '10px 0', backgroundColor: CORDEL_PALETTE.cremePapel } }, [
        h('h3', { style: { color: CORDEL_PALETTE.tintaXilo, margin: '0 0 8px 0' } }, 'Celeiro Seguro & Centro de Treinamento'),
        h('div', { class: 'barn-section', 'data-testid': 'barn-protection-section', style: { marginBottom: '12px', padding: '8px', border: '1px solid #1B1B1B', backgroundColor: '#fff' } }, [
          h('h4', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.terracota } }, `Proteção de Milho do Celeiro (Sede Nível ${sedeLevel.value}/12)`),
          h('p', { 'data-testid': 'barn-protection-stats', style: { margin: '4px 0' } }, [
            'Milho Protegido: ',
            h('strong', `${barnConfig.value.protectedCorn.toLocaleString()} Milho`),
            ` | Capacidade Máxima: ${barnConfig.value.maxCapacity.toLocaleString()} Milho (até 5M no Nv. 12)`,
          ]),
          h('p', { 'data-testid': 'barn-lootable-stats', style: { margin: '4px 0' } }, `Armazenado: ${storedCorn.value.toLocaleString()} | Saqueável: ${lootableResult.value.lootableCorn.toLocaleString()}`),
          h('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' } }, [
            h('button', { type: 'button', 'data-testid': 'btn-calc-barn-harvest', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: handleHarvestSafeBarn }, 'Calcular Colheita Segura'),
            h('button', { type: 'button', 'data-testid': 'btn-sede-12-preview', style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => handleSetSedeLevel(12) }, 'Simular Sede 12 (5M Protegido)'),
          ]),
          barnStatus.value ? h('p', { 'data-testid': 'barn-status-display', style: { color: CORDEL_PALETTE.verdeMata, fontWeight: 'bold', margin: '6px 0 0 0' } }, barnStatus.value) : null,
        ]),
        h('div', { class: 'training-section', 'data-testid': 'training-center-section', style: { padding: '8px', border: '1px solid #1B1B1B', backgroundColor: '#fff' } }, [
          h('h4', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.azulAnil } }, 'Centro de Treinamento de Aves (Ganho Lazy NG)'),
          h('p', { 'data-testid': 'training-cap-display', style: { margin: '4px 0' } }, `NG Atual: ${currentNg.value} | Teto Máximo NG: ${maxNgCap.value} (Sede ${sedeLevel.value} * 5 + Astral ${astralBonus.value})`),
          h('p', { 'data-testid': 'training-cost-display', style: { margin: '4px 0' } }, `Consumo: ${costPerMin.value} Milho/min | Treino ${trainingMinutes.value} min = Custo ${trainingCost.value.toLocaleString()} Milho`),
          h('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' } }, [
            h('button', { type: 'button', 'data-testid': 'btn-start-training', style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: handleStartTraining }, 'Iniciar Treino (Lazy NG)'),
            h('button', { type: 'button', 'data-testid': 'btn-training-60min', style: { backgroundColor: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => { trainingMinutes.value = 60; } }, 'Definir 60 Minutos'),
          ]),
          h('p', { 'data-testid': 'training-status-display', style: { color: CORDEL_PALETTE.tintaXilo, fontWeight: 'bold', margin: '6px 0 0 0' } }, trainingStatus.value),
        ]),
      ]);
  },
});

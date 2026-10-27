import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  getStarUpgradeCost,
  getUnlockedPassives,
  getStarStatBonusPercent,
  getNgCapBonus,
  canAwakenStar,
  isSlotUnlocked,
  LAPIDARY_RECIPES,
  type LapidaryType,
  type LapidaryJob,
  startLapidaryJob,
  claimLapidaryReward,
  SLOT_UNLOCK_SEDE,
} from '@beakbreaker/genetics-engine';
import type { WebRuntime } from '../createWebRuntime.js';

export const AstralLapidaryPanel = defineComponent({
  name: 'AstralLapidaryPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const targetStar = ref<number>(6);
    const orbsAvailable = ref<number>(3500);
    const essencesAvailable = ref<number>(3);
    const sedeLevel = ref<number>(10);
    const cornAvailable = ref<number>(500_000);
    const selectedRecipeType = ref<LapidaryType>('lapidacao_profunda');
    const activeJobs = ref<LapidaryJob[]>([]);
    const awakeningStatus = ref<string>('Selecione uma estrela astral (6★ a 10★) para evoluir.');
    const lapidaryStatus = ref<string>('3 Slots de Lapidação: Sede 8 (4h), Sede 10 (8h) e Sede 12 (24h).');

    const cost = computed(() => getStarUpgradeCost(targetStar.value));
    const statBonus = computed(() => getStarStatBonusPercent(targetStar.value));
    const ngBonus = computed(() => getNgCapBonus(targetStar.value));
    const passives = computed(() => getUnlockedPassives(targetStar.value));
    const canEvolve = computed(() => canAwakenStar(targetStar.value - 1, orbsAvailable.value, essencesAvailable.value));

    const handleAwaken = () => {
      if (!canEvolve.value) {
        awakeningStatus.value = `Recursos insuficientes para ${targetStar.value}★! Exige ${cost.value.orbs} Orbes e ${cost.value.astralEssences} Essências Astrais.`;
        return;
      }
      orbsAvailable.value -= cost.value.orbs;
      essencesAvailable.value -= cost.value.astralEssences;
      awakeningStatus.value = `Despertar Astral ${targetStar.value}★ Concluído! (+${statBonus.value}% atributos, +${ngBonus.value} NG Cap). Passiva: ${passives.value.join(', ') || 'Sem nova passiva'}`;
    };

    const handleStartJob = (slotId: number) => {
      try {
        const res = startLapidaryJob({
          slotId, type: selectedRecipeType.value, sedeLevel: sedeLevel.value,
          availableCorn: cornAvailable.value, activeJobs: activeJobs.value,
        });
        activeJobs.value = [...activeJobs.value, res.job];
        if (res.remainingCorn !== undefined) cornAvailable.value = res.remainingCorn;
        const rec = LAPIDARY_RECIPES[selectedRecipeType.value];
        lapidaryStatus.value = `Lapidação iniciada no Slot ${slotId}: ${rec.name} (${rec.durationMinutes / 60}h) | Chance Essência: ${(rec.astralEssenceChance * 100).toFixed(0)}%`;
      } catch (err: unknown) {
        lapidaryStatus.value = `Falha: ${err instanceof Error ? err.message : String(err)}`;
      }
    };

    const handleClaimJob = (slotId: number) => {
      const job = activeJobs.value.find((j) => j.slotId === slotId);
      if (!job) return;
      const reward = claimLapidaryReward(job, job.startTimeMs + job.durationMs + 1000, () => 0.05);
      activeJobs.value = activeJobs.value.filter((j) => j.slotId !== slotId);
      if (reward.gotAstralEssence) essencesAvailable.value += reward.astralEssenceCount;
      lapidaryStatus.value = `Joia extraída: ${reward.guaranteedItem}${reward.gotAstralEssence ? ' + 1 Essência Astral!' : ''}`;
    };

    const handleToggleSede = () => {
      sedeLevel.value = sedeLevel.value === 8 ? 10 : sedeLevel.value === 10 ? 12 : 8;
    };

    const recipes = Object.values(LAPIDARY_RECIPES);

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'astral-lapidary-panel' }, [
        h('h3', 'Despertar Astral (6★ a 10★) & Lapidação de Gemas Primordiais'),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('span', { style: { fontWeight: 'bold' } }, 'Alvo Astral:'),
          ([6, 7, 8, 9, 10] as const).map((s) =>
            h('button', {
              key: s, type: 'button', 'data-testid': `btn-star-${s}`,
              style: {
                backgroundColor: targetStar.value === s ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.cremePapel,
                color: targetStar.value === s ? '#FFFFFF' : CORDEL_PALETTE.tintaXilo,
                border: '2px solid #1B1B1B', padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer',
              },
              onClick: () => { targetStar.value = s; },
            }, `${s}★`),
          ),
          h('button', {
            type: 'button', 'data-testid': 'btn-awaken-star',
            style: {
              backgroundColor: canEvolve.value ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel,
              color: canEvolve.value ? '#FFFFFF' : CORDEL_PALETTE.tintaXilo,
              border: '2px solid #1B1B1B', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleAwaken,
          }, `Evoluir para ${targetStar.value}★`),
        ]),
        h('p', { 'data-testid': 'astral-upgrade-info' },
          `Custo ${targetStar.value}★: ${cost.value.orbs} Orbes e ${cost.value.astralEssences} Essências Astrais | Bônus: +${statBonus.value}% Atributos (+${ngBonus.value} NG Cap) | Desbloqueio: ${cost.value.unlockedPassive ?? 'Sem passiva neste nível'}`),
        h('p', { 'data-testid': 'awakening-status-text', style: { fontStyle: 'italic', color: CORDEL_PALETTE.vermelhoCrista } }, awakeningStatus.value),
        h('hr', { style: { borderColor: CORDEL_PALETTE.tintaXilo, margin: '10px 0' } }),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('span', { style: { fontWeight: 'bold' } }, `Nível da Sede: ${sedeLevel.value}`),
          h('button', {
            type: 'button', 'data-testid': 'btn-toggle-sede',
            style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer' },
            onClick: handleToggleSede,
          }, 'Alternar Sede (8 / 10 / 12)'),
          h('span', `Milho: ${cornAvailable.value.toLocaleString()} | Essências: ${essencesAvailable.value}`),
        ]),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' } },
          recipes.map((r) =>
            h('button', {
              key: r.type, type: 'button', 'data-testid': `btn-recipe-${r.type}`,
              style: {
                backgroundColor: selectedRecipeType.value === r.type ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                border: '2px solid #1B1B1B', padding: '4px 8px', cursor: 'pointer',
              },
              onClick: () => { selectedRecipeType.value = r.type; },
            }, `${r.name} (${r.durationMinutes / 60}h | ${(r.astralEssenceChance * 100).toFixed(0)}% Essência)`),
          ),
        ),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          ([1, 2, 3] as const).map((slotId) => {
            const unlocked = isSlotUnlocked(slotId, sedeLevel.value);
            const job = activeJobs.value.find((j) => j.slotId === slotId);
            return h('div', {
              key: slotId, 'data-testid': `lapidary-slot-${slotId}`,
              style: {
                border: '2px solid #1B1B1B', padding: '6px 10px',
                backgroundColor: unlocked ? CORDEL_PALETTE.cremePapel : '#E0D0C0', minWidth: '150px',
              },
            }, [
              h('div', { style: { fontWeight: 'bold' } }, `Slot ${slotId} (Sede ${SLOT_UNLOCK_SEDE[slotId]})`),
              !unlocked
                ? h('span', { style: { color: '#888' } }, 'Bloqueado')
                : job
                  ? h('button', {
                      type: 'button', 'data-testid': `btn-claim-slot-${slotId}`,
                      style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: '#FFF', border: '1px solid #1B1B1B', padding: '3px 6px', marginTop: '4px', cursor: 'pointer' },
                      onClick: () => handleClaimJob(slotId),
                    }, 'Coletar Joia')
                  : h('button', {
                      type: 'button', 'data-testid': `btn-start-slot-${slotId}`,
                      style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '1px solid #1B1B1B', padding: '3px 6px', marginTop: '4px', cursor: 'pointer' },
                      onClick: () => handleStartJob(slotId),
                    }, 'Iniciar Trabalho'),
            ]);
          }),
        ),
        h('p', { 'data-testid': 'lapidary-status-text', style: { marginTop: '8px' } }, lapidaryStatus.value),
      ]);
  },
});

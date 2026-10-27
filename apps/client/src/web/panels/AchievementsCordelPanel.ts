import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  CORDEL_ACHIEVEMENTS_50,
  type CordelAchievementCategory,
  type CordelAchievementSpec,
} from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

export const AchievementsCordelPanel = defineComponent({
  name: 'AchievementsCordelPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup() {
    const selectedCategory = ref<CordelAchievementCategory>('CRIACAO');
    const claimedIds = ref<string[]>([]);
    const completedIds = ref<string[]>([
      'ach_cri_01', 'ach_cri_02', 'ach_com_01', 'ach_faz_01', 'ach_col_01',
    ]);
    const claimedCrownsTotal = ref(0);
    const statusMessage = ref('50 Conquistas em estrofes de Cordel prontas');

    const categories: readonly { key: CordelAchievementCategory; label: string }[] = [
      { key: 'CRIACAO', label: 'Criação (12)' },
      { key: 'COMBATE', label: 'Combate (15)' },
      { key: 'FAZENDA', label: 'Fazenda (12)' },
      { key: 'COLECAO', label: 'Coleção (11)' },
    ];

    const filtered = computed(() =>
      CORDEL_ACHIEVEMENTS_50.filter((a) => a.category === selectedCategory.value),
    );

    const handleClaim = (ach: CordelAchievementSpec) => {
      if (claimedIds.value.includes(ach.id)) {
        statusMessage.value = `Conquista "${ach.name}" já foi resgatada!`;
        return;
      }
      claimedIds.value.push(ach.id);
      claimedCrownsTotal.value += 20;
      statusMessage.value = `Resgatou "${ach.name}": +20 Coroas e +${ach.reward.goldenFeathers} Penas Douradas!`;
    };

    const tabBtn = (cat: CordelAchievementCategory) => ({
      backgroundColor: selectedCategory.value === cat ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
      color: '#1B1B1B', border: '2px solid #1B1B1B', padding: '6px 10px', fontWeight: 'bold', cursor: 'pointer',
    });

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'achievements-cordel-panel' }, [
        h('h3', `Conquistas de Cordel (${CORDEL_ACHIEVEMENTS_50.length} Estrofes)`),
        h('p', { 'data-testid': 'total-crowns-display' },
          `Coroas Resgatadas: ${claimedCrownsTotal.value} 👑 | Conquistas Coletadas: ${claimedIds.value.length}/50`),
        h('div', { 'data-testid': 'category-tabs', style: { display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' } },
          categories.map((c) =>
            h('button', {
              key: c.key, type: 'button', 'data-testid': `btn-cat-${c.key.toLowerCase()}`,
              style: tabBtn(c.key), onClick: () => { selectedCategory.value = c.key; },
            }, c.label),
          ),
        ),
        h('div', { 'data-testid': 'achievements-list', style: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' } },
          filtered.value.map((ach) => {
            const isClaimed = claimedIds.value.includes(ach.id);
            const isDone = completedIds.value.includes(ach.id) || isClaimed;

            return h('div', {
              key: ach.id, 'data-testid': `achievement-item-${ach.id}`,
              style: {
                padding: '6px 10px', border: '1px solid #1B1B1B',
                backgroundColor: isClaimed ? '#E5E7EB' : CORDEL_PALETTE.cremePapel,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              },
            }, [
              h('div', [
                h('strong', ach.name),
                h('p', { style: { margin: '2px 0', fontSize: '13px' } }, `"${ach.description}"`),
                h('span', { style: { fontSize: '12px', color: CORDEL_PALETTE.terracota } },
                  `Recompensa: +20 Coroas, +${ach.reward.goldenFeathers} Penas | Alvo: ${ach.targetValue}`),
              ]),
              h('button', {
                type: 'button', 'data-testid': `btn-claim-${ach.id}`,
                disabled: isClaimed || !isDone,
                style: {
                  backgroundColor: isClaimed ? '#9CA3AF' : isDone ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel,
                  color: isDone ? CORDEL_PALETTE.cremePapel : '#1B1B1B',
                  border: '2px solid #1B1B1B', padding: '4px 8px', fontWeight: 'bold', cursor: isDone && !isClaimed ? 'pointer' : 'default',
                },
                onClick: () => handleClaim(ach),
              }, isClaimed ? 'Resgatado ✓' : isDone ? 'Resgatar Coroas' : 'Em Progresso'),
            ]);
          }),
        ),
        h('p', { 'data-testid': 'achievements-cordel-status', style: { fontStyle: 'italic', marginTop: '6px' } }, statusMessage.value),
      ]);
  },
});

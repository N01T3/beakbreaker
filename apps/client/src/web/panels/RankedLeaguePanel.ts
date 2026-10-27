import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { RankedLeagueSystem, type SeasonRewards } from '@beakbreaker/combat-core';
import type { WebRuntime } from '../createWebRuntime.js';

export function formatLeagueDivisionName(trophies: number): string {
  const div = RankedLeagueSystem.getLeagueDivision(trophies);
  return div.name === 'Bronze do Brejo'
    ? trophies < 200 ? 'Bronze do Brejo I' : 'Bronze do Brejo II'
    : div.name;
}

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.cremePapel) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B',
  padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer',
});

const badgeStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B',
  padding: '6px 12px', fontWeight: 'bold', display: 'inline-block',
});

export const RankedLeaguePanel = defineComponent({
  name: 'RankedLeaguePanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialTrophies: { type: Number, default: 1250 },
    initialStreak: { type: Number, default: 0 },
  },
  setup(props) {
    const trophies = ref(props.initialTrophies);
    const winStreak = ref(props.initialStreak);
    const opponentTrophies = ref(1250);
    const lastMatchResult = ref('Aguardando próximo duelo na Arena do Sertão...');
    const lastDelta = ref<number | null>(null);

    const division = computed(() => RankedLeagueSystem.getLeagueDivision(trophies.value));
    const divisionTitle = computed(() => formatLeagueDivisionName(trophies.value));
    const seasonRewards = computed<SeasonRewards>(() =>
      RankedLeagueSystem.getSeasonEndRewards(trophies.value),
    );
    const hasStreakBonus = computed(() => winStreak.value >= 3);

    const simulateMatch = (won: boolean) => {
      const delta = RankedLeagueSystem.calculateMatchTrophies(
        trophies.value, opponentTrophies.value, won, winStreak.value,
      );
      trophies.value = Math.max(0, trophies.value + delta);
      lastDelta.value = delta;
      if (won) {
        winStreak.value += 1;
        const streakText = winStreak.value >= 3 ? ' [+10 Bônus de Sequência!]' : '';
        lastMatchResult.value = `Vitória no Duelo! +${delta} Troféus${streakText}`;
      } else {
        winStreak.value = 0;
        lastMatchResult.value = `Derrota no Duelo! ${delta} Troféus (Sequência zerada)`;
      }
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'ranked-league-panel' }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'Liga Ranqueada do Sertão'),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' } }, [
          h('span', { 'data-testid': 'ranked-division-name', style: badgeStyle(CORDEL_PALETTE.amareloMilho) }, `Divisão: ${divisionTitle.value}`),
          h('span', { 'data-testid': 'ranked-trophies-elo', style: badgeStyle(CORDEL_PALETTE.cremePapel) }, `Troféus ELO: ${trophies.value}`),
          h('span', {
            'data-testid': 'ranked-win-streak',
            style: badgeStyle(hasStreakBonus.value ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, hasStreakBonus.value ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo),
          }, `Vitórias em Série: ${winStreak.value}${hasStreakBonus.value ? ' (Bônus +10 Ativo)' : ''}`),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-simulate-ranked-match',
            style: btnStyle(CORDEL_PALETTE.vermelhoCrista),
            onClick: () => simulateMatch(true),
          }, 'Simular Duelo Ranqueado (Vitória)'),
          h('button', {
            type: 'button', 'data-testid': 'btn-simulate-ranked-defeat',
            style: btnStyle(CORDEL_PALETTE.tintaXilo),
            onClick: () => simulateMatch(false),
          }, 'Simular Derrota Ranqueada'),
        ]),
        h('p', { 'data-testid': 'ranked-match-result', style: { fontWeight: 'bold', color: CORDEL_PALETTE.tintaXilo, margin: '6px 0' } }, lastMatchResult.value),
        h('div', {
          'data-testid': 'season-chest-rewards',
          style: { padding: '8px 12px', border: '2px dashed #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, marginTop: '8px' },
        }, [
          h('strong', { style: { display: 'block', marginBottom: '4px' } }, `Baú de Fim de Temporada (${division.value.name}):`),
          h('span', { 'data-testid': 'season-reward-penas', style: { marginRight: '16px' } }, `Penas Douradas: ${seasonRewards.value.penasDouradas}`),
          h('span', { 'data-testid': 'season-reward-orbes' }, `Orbes Curinga: ${seasonRewards.value.orbesCuringa}`),
        ]),
      ]);
  },
});

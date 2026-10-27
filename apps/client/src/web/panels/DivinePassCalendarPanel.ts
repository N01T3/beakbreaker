import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  DIVINE_PASS_LEVELS,
  LOGIN_CALENDAR_28_DAYS,
  DIVINE_PASS_CONFIG,
  LOGIN_CALENDAR_CONFIG,
  getDivinePassRewards,
  getLoginCalendarReward,
} from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

export const DivinePassCalendarPanel = defineComponent({
  name: 'DivinePassCalendarPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const activeView = ref<'PASSE' | 'CALENDARIO'>('PASSE');
    const claimedPassLevels = ref<number[]>([]);
    const claimedLoginDays = ref<number[]>([]);
    const currentLoginDay = ref(1);
    const statusMessage = ref('Passe Divino & Calendário de 28 Dias prontos');

    const currentPassLevel = computed(() => props.runtime.liveOps.getDivinePassLevel());
    const isCoronelActive = computed(() => props.runtime.liveOps.isGoldenPassActive());

    const handleAdvancePass = () => {
      const lvl = props.runtime.liveOps.advanceDivinePass(1);
      statusMessage.value = `Passe Divino avançou para o Nível ${lvl}!`;
    };

    const handleUnlockCoronel = () => {
      props.runtime.liveOps.unlockGoldenPass();
      statusMessage.value = 'Trilha do Coronel ativada! Ave Sazonal no Nível 30 liberada.';
    };

    const handleClaimPassLevel = () => {
      const lvl = currentPassLevel.value;
      if (claimedPassLevels.value.includes(lvl)) {
        statusMessage.value = `Nível ${lvl} já resgatado!`;
        return;
      }
      claimedPassLevels.value.push(lvl);
      const rewards = getDivinePassRewards(lvl);
      const bonus = lvl === 30 ? ' | Ave Sazonal Garantida!' : lvl === 40 ? ' | Moldura do Coronel!' : '';
      statusMessage.value = `Nível ${lvl} resgatado (${isCoronelActive.value ? 'Coronel' : 'Retirante'}): +${rewards?.retirante.milho ?? 0} Milho${bonus}`;
    };

    const handleClaimDailyLogin = () => {
      const day = currentLoginDay.value;
      if (claimedLoginDays.value.includes(day)) {
        statusMessage.value = `Dia ${day} já resgatado!`;
        return;
      }
      claimedLoginDays.value.push(day);
      const reward = getLoginCalendarReward(day) ?? LOGIN_CALENDAR_28_DAYS[day - 1];
      const legBonus = reward?.legendaryRoosterGuaranteed ? ' | Atleta Lendário Garantido!' : '';
      statusMessage.value = `Dia ${day} resgatado: ${reward?.description ?? 'Recompensa recebida'}${legBonus}`;
      if (currentLoginDay.value < LOGIN_CALENDAR_CONFIG.totalDays) {
        currentLoginDay.value += 1;
      }
    };

    const btnStyle = (bg: string, fg = '#1B1B1B') => ({
      backgroundColor: bg,
      color: fg,
      border: '2px solid #1B1B1B',
      padding: '6px 12px',
      fontWeight: 'bold',
      cursor: 'pointer',
    });

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'divine-pass-calendar-panel' }, [
        h('h3', `Passe Divino (${DIVINE_PASS_LEVELS.length} Níveis) & Calendário de Login (${LOGIN_CALENDAR_28_DAYS.length} Dias)`),
        h('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-view-pass',
            style: btnStyle(activeView.value === 'PASSE' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
            onClick: () => { activeView.value = 'PASSE'; },
          }, 'Passe Divino (40 Níveis)'),
          h('button', {
            type: 'button', 'data-testid': 'btn-view-calendar',
            style: btnStyle(activeView.value === 'CALENDARIO' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
            onClick: () => { activeView.value = 'CALENDARIO'; },
          }, 'Calendário 28 Dias'),
        ]),
        activeView.value === 'PASSE'
          ? h('div', { 'data-testid': 'pass-section' }, [
              h('p', { 'data-testid': 'pass-level-display' },
                `Nível: ${currentPassLevel.value}/${DIVINE_PASS_CONFIG.totalLevels} | Trilha Ativa: ${isCoronelActive.value ? 'Coronel (VIP)' : 'Retirante (Grátis)'}`),
              h('p', { 'data-testid': 'seasonal-rooster-highlight', style: { color: CORDEL_PALETTE.vermelhoCrista, fontWeight: 'bold' } },
                'Nível 30: Ave Sazonal do Mês Garantida na Trilha Coronel! (Nível 40: Moldura Exclusiva)'),
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-advance-pass-level',
                  style: btnStyle(CORDEL_PALETTE.amareloMilho), onClick: handleAdvancePass,
                }, 'Avançar Nível (+1)'),
                h('button', {
                  type: 'button', 'data-testid': 'btn-claim-pass-level',
                  style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: handleClaimPassLevel,
                }, `Resgatar Nível ${currentPassLevel.value}`),
                !isCoronelActive.value
                  ? h('button', {
                      type: 'button', 'data-testid': 'btn-unlock-coronel',
                      style: btnStyle(CORDEL_PALETTE.vermelhoCrista, CORDEL_PALETTE.cremePapel), onClick: handleUnlockCoronel,
                    }, 'Desbloquear Trilha do Coronel (800 Coroas)')
                  : null,
              ]),
            ])
          : h('div', { 'data-testid': 'calendar-section' }, [
              h('p', { 'data-testid': 'daily-login-status' },
                `Dia Atual: ${currentLoginDay.value}/${LOGIN_CALENDAR_CONFIG.totalDays} | Total Resgatados: ${claimedLoginDays.value.length}`),
              h('p', { 'data-testid': 'day-28-highlight', style: { color: CORDEL_PALETTE.vermelhoCrista, fontWeight: 'bold' } },
                'Dia 28: Atleta Lendário Garantido! (Marcos especiais nos Dias 7, 14, 21 e 28)'),
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-claim-daily-login',
                  style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: handleClaimDailyLogin,
                }, `Resgatar Dia ${currentLoginDay.value}`),
              ]),
            ]),
        h('p', { 'data-testid': 'pass-calendar-status', style: { fontStyle: 'italic', marginTop: '6px' } }, statusMessage.value),
      ]);
  },
});

import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { GROWTH_FUND_TIERS, GROWTH_FUND_PRICE_BRL } from '@beakbreaker/game-data';
import {
  addDailyMissionTicket,
  evaluateWeeklyLottery,
  drawWeeklyLotteryNumbers,
  type VillageLotteryTicket,
} from '@beakbreaker/genetics-engine';
import type { WebRuntime } from '../createWebRuntime.js';

export const GrowthFundLotteryPanel = defineComponent({
  name: 'GrowthFundLotteryPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const claimedFreeLevels = ref<number[]>([]);
    const fundStatus = ref('Evolua a Sede da Fazenda para resgatar as faixas Grátis e Coronel.');
    const tickets = ref<VillageLotteryTicket[]>([
      { ticketId: 'ticket_1', dayOfWeek: 1, numbers: [3, 7, 12, 18, 25] },
      { ticketId: 'ticket_2', dayOfWeek: 2, numbers: [5, 10, 15, 20, 28] },
    ]);
    const lotteryMessage = ref('Aguardando sorteio oficial de domingo às 20h.');

    const handleClaimTier = (level: number) => {
      if (claimedFreeLevels.value.includes(level)) {
        fundStatus.value = `Faixa da Sede Nível ${level} já foi resgatada anteriormente.`;
        return;
      }
      claimedFreeLevels.value.push(level);
      const tier = GROWTH_FUND_TIERS.find((t) => t.sedeLevel === level) ?? GROWTH_FUND_TIERS[0]!;
      fundStatus.value = `Resgate realizado (Sede Nv ${level})! +${tier.freeReward.milho.toLocaleString('pt-BR')} Milho e +${tier.freeReward.goldenFeathers} Penas Douradas!`;
    };

    const handleAddTicket = () => {
      if (tickets.value.length >= 7) {
        lotteryMessage.value = 'Limite de 7 bilhetes semanais da vila atingido!';
        return;
      }
      const updated = addDailyMissionTicket(tickets.value, [2, 8, 14, 21, 29]);
      tickets.value = [...updated];
      lotteryMessage.value = `Novo bilhete semanal registrado com sucesso! Total: ${tickets.value.length}/7 bilhetes.`;
    };

    const handleSimulateSundayDraw = () => {
      const drawn = drawWeeklyLotteryNumbers(777);
      const res = evaluateWeeklyLottery(tickets.value, drawn);
      lotteryMessage.value = `Sorteio de Domingo Realizado! Dezenas: [${drawn.join(', ')}] | Melhor acerto: ${res.bestMatchCount} | Prêmio Total: +${res.totalCornWon.toLocaleString('pt-BR')} Milho e +${res.totalFeathersWon} Penas!`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'growth-fund-lottery-panel', style: { marginTop: '10px' } }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'Fundo de Crescimento da Sede & Loteria Semanal da Vila'),
        h('div', { class: 'cordel-card', style: { backgroundColor: CORDEL_PALETTE.cremePapel, marginBottom: '10px' } }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } }, [
            h('h5', { style: { margin: 0, color: CORDEL_PALETTE.tintaXilo } }, 'Fundo de Crescimento da Sede (12 Níveis)'),
            h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho } }, `Passe Coronel: R$ ${GROWTH_FUND_PRICE_BRL.toFixed(2)}`),
          ]),
          h('div', { style: { maxHeight: '140px', overflowY: 'auto', border: '1px solid #1B1B1B', padding: '4px' } },
            GROWTH_FUND_TIERS.slice(0, 4).map((tier) =>
              h('div', {
                key: tier.sedeLevel, 'data-testid': 'growth-fund-tier-row',
                style: { display: 'flex', justifyContent: 'space-between', padding: '4px', borderBottom: '1px dashed #ccc', fontSize: '12px' },
              }, [
                h('span', `Sede Nv ${tier.sedeLevel}`),
                h('span', `Grátis: ${tier.freeReward.milho.toLocaleString('pt-BR')} Milho`),
                h('span', `Coronel: +${tier.premiumReward.goldenFeathers} Penas / +${tier.premiumReward.coroas} Coroas`),
                h('span', claimedFreeLevels.value.includes(tier.sedeLevel) ? '✓ Resgatado' : 'Disponível'),
              ]),
            ),
          ),
          h('div', { style: { marginTop: '8px' } }, [
            h('button', {
              type: 'button', 'data-testid': 'button-claim-fund-tier',
              style: {
                backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel,
                border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
              },
              onClick: () => handleClaimTier(1),
            }, 'Resgatar Faixa Grátis (Sede Nível 1)'),
            h('p', { style: { fontWeight: 'bold', fontSize: '13px', margin: '6px 0 0 0', color: CORDEL_PALETTE.tintaXilo } }, fundStatus.value),
          ]),
        ]),
        h('div', { class: 'cordel-card', style: { backgroundColor: '#F9F6F0' } }, [
          h('h5', { style: { margin: '0 0 4px 0', color: CORDEL_PALETTE.tintaXilo } }, 'Loteria Semanal da Vila (Missões & Sorteio de Domingo 20h)'),
          h('p', {
            'data-testid': 'village-lottery-status',
            style: { margin: '4px 0', fontSize: '13px', fontWeight: 'bold' },
          }, `Bilhetes Acumulados: ${tickets.value.length}/7 | Sorteio: Domingo às 20h | Status: ${lotteryMessage.value}`),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' } }, [
            h('button', {
              type: 'button', 'data-testid': 'button-buy-lottery-ticket',
              style: {
                backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B',
                padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
              },
              onClick: handleAddTicket,
            }, 'Obter Bilhete Semanal (+1 Bilhete)'),
            h('button', {
              type: 'button', 'data-testid': 'button-simulate-lottery-draw',
              style: {
                backgroundColor: CORDEL_PALETTE.azulAnil, color: CORDEL_PALETTE.cremePapel,
                border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
              },
              onClick: handleSimulateSundayDraw,
            }, 'Simular Sorteio de Domingo (20h)'),
          ]),
        ]),
      ]);
  },
});

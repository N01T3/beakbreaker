import { defineComponent, h, ref, type PropType } from 'vue';
import {
  CORDEL_PALETTE,
  CordelWoodFrame,
  PityProgressBar,
  calculateExplicitPullOdds,
} from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../services/AudioService.js';
import type { WebRuntime } from './createWebRuntime.js';
import { PixCheckoutPanel } from './panels/PixCheckoutPanel.js';
import { StoreMonetizationOffersPanel } from './panels/StoreMonetizationOffersPanel.js';
import { GrowthFundLotteryPanel } from './panels/GrowthFundLotteryPanel.js';
import { ChocadeiraBannerPanel } from './panels/ChocadeiraBannerPanel.js';
import { HeroRaceTrackPanel } from './panels/HeroRaceTrackPanel.js';

export const StoreTabView = defineComponent({
  name: 'StoreTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    currentPity: { type: Number, required: true },
    onPullChocadeira: { type: Function as PropType<(pulls: number) => void>, required: true },
    onGrantCoroas: { type: Function as PropType<(coroas: number) => void>, required: true },
  },
  setup(props) {
    const customLimitReais = ref(500);
    const activeSubTab = ref<'loja_pix' | 'chocadeira' | 'corrida'>('loja_pix');

    const handleBuyPixPackage = () => {
      const txId = `tx_${Date.now()}`;
      const res = props.runtime.storeCtrl.purchaseCoroasPackage(
        txId, 'Pacote Cordel Pix (+15% Coroas)', 2_990, 300, true,
      );
      if (res.ok && res.record) {
        props.onGrantCoroas(res.record.coroasGranted);
        props.runtime.state.lastStoreStatus = `Compra aprovada via Pix Web: +${res.record.coroasGranted} Coroas (+15% bônus)!`;
      } else {
        props.runtime.state.lastStoreStatus = `Bloqueado pelo Limite Mensal ECA Digital (${res.reason})`;
      }
      props.runtime.state.remainingBudgetCents = props.runtime.storeCtrl.getRemainingMonthlyBudgetBrlCents();
      props.runtime.state.transactionsCount = props.runtime.storeCtrl.getTransactionsLast90Days().length;
    };

    const handleUpdateLimit = () => {
      const cents = Math.max(1_000, Math.floor(customLimitReais.value * 100));
      props.runtime.storeCtrl.setMonthlyLimitBrlCents(cents);
      props.runtime.state.monthlyLimitCents = cents;
      props.runtime.state.remainingBudgetCents = props.runtime.storeCtrl.getRemainingMonthlyBudgetBrlCents();
    };

    const subTabBtn = (id: 'loja_pix' | 'chocadeira' | 'corrida', label: string, testId: string) =>
      h('button', {
        type: 'button',
        'data-testid': testId,
        style: {
          backgroundColor: activeSubTab.value === id ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.cremePapel,
          color: activeSubTab.value === id ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo,
          border: '2px solid #1B1B1B',
          padding: '8px 12px',
          fontWeight: 'bold',
          cursor: 'pointer',
        },
        onClick: () => {
          cordelAudio.playZabumbaTabSwitch();
          activeSubTab.value = id;
        },
      }, label);

    return () => {
      const odds = calculateExplicitPullOdds(props.currentPity);
      const txs = props.runtime.storeCtrl.getTransactionsLast90Days();

      return h(
        CordelWoodFrame,
        {
          title: 'Chocadeira (Pity 80) & Loja Web Pix (+15% Coroas)',
          subtitle: 'Conformidade Total com o ECA Digital (Lei 15.211/2025) e Marco Legal dos Jogos',
        },
        {
          default: () => [
            h('div', { 'data-testid': 'tab-content-loja' }, [
              h('div', {
                'data-testid': 'store-subtabs-nav',
                style: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
              }, [
                subTabBtn('loja_pix', 'Loja PIX', 'tab-btn-loja-pix'),
                subTabBtn('chocadeira', 'Chocadeira Destaque', 'tab-btn-chocadeira'),
                subTabBtn('corrida', 'Corrida de Heróis', 'tab-btn-corrida'),
              ]),
              activeSubTab.value === 'chocadeira'
                ? h(ChocadeiraBannerPanel, {
                    'data-testid': 'chocadeira-banner-panel',
                    runtime: props.runtime,
                    currentPity: props.currentPity,
                    onPullChocadeira: props.onPullChocadeira,
                  })
                : activeSubTab.value === 'corrida'
                ? h(HeroRaceTrackPanel, {
                    'data-testid': 'hero-race-track-panel',
                    runtime: props.runtime,
                    initialLap: props.runtime.state.heroRaceLap ?? 7,
                  })
                : [
                    h('div', { class: 'cordel-card', 'data-testid': 'chocadeira-panel' }, [
                      h('h3', { 'data-testid': 'chocadeira-pity-counter' }, `Chocadeira Real — Contador de Pity: ${props.currentPity}/80`),
                      h('p', { 'data-testid': 'chocadeira-explicit-odds' }, `Probabilidades Explícitas: Base Lendário 2% (Atual: ${odds.legendaryPct.toFixed(1)}%) | Soft Pity tiro 61 (+5%/tiro) | Hard Pity 80/80`),
                      h(PityProgressBar, { currentPity: props.currentPity }),
                      h('div', { style: { display: 'flex', gap: '10px', marginTop: '10px' } }, [
                        h('button', {
                          type: 'button', 'data-testid': 'btn-pull-1x',
                          style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '10px 16px', fontWeight: 'bold' },
                          onClick: () => props.onPullChocadeira(1),
                        }, 'Chocar 1x Ovo (+1 Pity)'),
                        h('button', {
                          type: 'button', 'data-testid': 'btn-pull-10x',
                          style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '10px 16px', fontWeight: 'bold' },
                          onClick: () => props.onPullChocadeira(10),
                        }, 'Chocar 10x Ovos (+10 Pity)'),
                      ]),
                    ]),
                    h('div', { class: 'cordel-card', 'data-testid': 'eca-spending-limit-panel' }, [
                      h('h3', 'Limite Mensal de Gastos (ECA Digital) & Loja Web Pix (+15% Coroas)'),
                      h('p', { 'data-testid': 'spending-limit-display' }, `Limite Mensal: R$ ${(props.runtime.state.monthlyLimitCents / 100).toFixed(2)} | Disponível: R$ ${(props.runtime.state.remainingBudgetCents / 100).toFixed(2)}`),
                      h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
                        h('button', {
                          type: 'button', 'data-testid': 'btn-buy-pix-coroas',
                          style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '8px 14px', fontWeight: 'bold' },
                          onClick: handleBuyPixPackage,
                        }, 'Comprar Pacote Pix Web (R$ 29,90 -> 345 Coroas [+15%])'),
                        h('button', { type: 'button', 'data-testid': 'btn-apply-spending-limit', onClick: handleUpdateLimit }, 'Atualizar Limite Mensal ECA Digital'),
                      ]),
                      h('p', { 'data-testid': 'store-tx-status' }, props.runtime.state.lastStoreStatus),
                      h('p', { 'data-testid': 'history-90-days' }, `Histórico de Transações (90 dias): ${txs.length} registro(s)`),
                    ]),
                    h(StoreMonetizationOffersPanel, {
                      runtime: props.runtime,
                      currentPity: props.currentPity,
                      onGrantCoroas: props.onGrantCoroas,
                    }),
                    h(PixCheckoutPanel, {
                      runtime: props.runtime,
                      currentPity: props.currentPity,
                      onGrantCoroas: props.onGrantCoroas,
                    }),
                    h(GrowthFundLotteryPanel, { runtime: props.runtime }),
                  ],
            ]),
          ],
        },
      );
    };
  },
});

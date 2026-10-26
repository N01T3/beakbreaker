import { defineComponent, h } from 'vue';
import {
  CORDEL_PALETTE,
  HUB_TABS,
  WoodcutHeader,
  type HubTabId,
} from '@beakbreaker/ui-cordel';
import { useGameStore } from '../stores/useGameStore.js';
import { createWebRuntime } from './createWebRuntime.js';
import { FtueGateView } from './FtueGateView.js';
import { FarmTabView } from './FarmTabView.js';
import { ArenaTabView } from './ArenaTabView.js';
import { RoostersTabView } from './RoostersTabView.js';
import { ClanTabView } from './ClanTabView.js';
import { StoreTabView } from './StoreTabView.js';

export const BeakBreakerWebApp = defineComponent({
  name: 'BeakBreakerWebApp',
  setup() {
    const store = useGameStore();
    const runtime = createWebRuntime();

    const handleTabChange = (tab: HubTabId) => {
      store.setActiveTab(tab);
    };

    const renderActiveTab = () => {
      if (store.activeHubTab === 'Fazenda') {
        return h(FarmTabView, {
          runtime,
          onAddMilho: (amount: number) => store.addMilho(amount),
          onUpgradeSede: (level: number) => {
            store.sedeLevel = level;
          },
        });
      }
      if (store.activeHubTab === 'Lutar') {
        return h(ArenaTabView, { runtime });
      }
      if (store.activeHubTab === 'Galos') {
        return h(RoostersTabView, { runtime });
      }
      if (store.activeHubTab === 'Bando') {
        return h(ClanTabView, { runtime });
      }
      return h(StoreTabView, {
        runtime,
        currentPity: store.currentPity,
        onPullChocadeira: (pulls: number) => {
          store.advancePity(pulls, false);
        },
        onGrantCoroas: (coroas: number) => {
          store.coroas += coroas;
        },
      });
    };

    return () =>
      h('div', { 'data-testid': 'beakbreaker-web-shell', style: { padding: '12px' } }, [
        h('div', { 'data-testid': 'header-bar' }, [
          h(WoodcutHeader, {
            playerName: store.playerName,
            breederLevel: store.breederLevel,
            sedeLevel: store.sedeLevel,
            milho: store.milho,
            penasDouradas: store.penasDouradas,
            coroas: store.coroas,
            folego: store.folego,
            maxFolego: store.maxFolego,
            onOpenStore: () => handleTabChange('Loja'),
          }),
          h(
            'div',
            {
              'data-testid': 'milho-balance',
              style: {
                marginTop: '6px',
                padding: '4px 10px',
                backgroundColor: CORDEL_PALETTE.amareloMilho,
                border: '2px solid #1B1B1B',
                fontWeight: 'bold',
                display: 'inline-block',
              },
            },
            `Saldo de Milho: ${store.milho}`,
          ),
        ]),
        h('div', { style: { marginTop: '12px' } }, [
          h(FtueGateView, {
            runtime,
            onFtueReady: () => {
              store.setAgeVerified(true);
            },
          }),
        ]),
        h('main', { 'data-testid': 'active-tab-stage', style: { marginTop: '12px' } }, [
          renderActiveTab(),
        ]),
        h(
          'nav',
          {
            'data-testid': 'cordel-bottom-nav',
            style: {
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              padding: '10px',
              backgroundColor: CORDEL_PALETTE.tintaXilo,
              border: '3px solid #1B1B1B',
            },
          },
          HUB_TABS.map((tab) =>
            h(
              'button',
              {
                key: tab,
                type: 'button',
                'data-testid': `nav-tab-${tab}`,
                style: {
                  backgroundColor:
                    store.activeHubTab === tab
                      ? CORDEL_PALETTE.amareloMilho
                      : CORDEL_PALETTE.cremePapel,
                  color: CORDEL_PALETTE.tintaXilo,
                  border: '2px solid #1B1B1B',
                  padding: '10px 6px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                },
                onClick: () => handleTabChange(tab),
              },
              tab,
            ),
          ),
        ),
      ]);
  },
});

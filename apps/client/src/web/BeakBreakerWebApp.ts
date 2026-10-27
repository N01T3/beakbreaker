import { defineComponent, h, ref } from 'vue';
import {
  CORDEL_PALETTE,
  HUB_TABS,
  WoodcutHeader,
  type HubTabId,
} from '@beakbreaker/ui-cordel';
import { useGameStore } from '../stores/useGameStore.js';
import { createWebRuntime } from './createWebRuntime.js';
import { cordelAudio } from '../services/AudioService.js';
import { FtueGateView } from './FtueGateView.js';
import { FarmTabView } from './FarmTabView.js';
import { ArenaTabView } from './ArenaTabView.js';
import { RoostersTabView } from './RoostersTabView.js';
import { ClanTabView } from './ClanTabView.js';
import { StoreTabView } from './StoreTabView.js';
import { CordelStageCanvas } from '../canvas/stage/CordelStageCanvas.js';
import { PlatformBridgeBar } from './PlatformBridgeBar.js';

export const BeakBreakerWebApp = defineComponent({
  name: 'BeakBreakerWebApp',
  setup() {
    const store = useGameStore();
    const runtime = createWebRuntime();
    const isAudioMuted = ref(cordelAudio.isMuted());

    const handleToggleAudio = () => {
      cordelAudio.setMuted(!cordelAudio.isMuted());
      isAudioMuted.value = cordelAudio.isMuted();
    };

    const handleTabChange = (tab: HubTabId) => {
      store.setActiveTab(tab);
      cordelAudio.playZabumbaTabSwitch();
    };

    const renderActiveTab = () => {
      if (store.activeHubTab === 'Fazenda') {
        return h(FarmTabView, {
          runtime,
          onAddMilho: (amount: number) => {
            cordelAudio.playTrianguloReward();
            store.addMilho(amount);
          },
          onUpgradeSede: (level: number) => {
            store.sedeLevel = level;
          },
        });
      }
      if (store.activeHubTab === 'Lutar') return h(ArenaTabView, { runtime });
      if (store.activeHubTab === 'Galos') return h(RoostersTabView, { runtime });
      if (store.activeHubTab === 'Bando') return h(ClanTabView, { runtime });
      return h(StoreTabView, {
        runtime,
        currentPity: store.currentPity,
        onPullChocadeira: (pulls: number) => {
          cordelAudio.playTrianguloReward();
          store.advancePity(pulls, false);
        },
        onGrantCoroas: (coroas: number) => {
          cordelAudio.playTrianguloReward();
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
            isMuted: isAudioMuted.value,
            onOpenStore: () => handleTabChange('Loja'),
            onToggleAudio: handleToggleAudio,
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
          h(PlatformBridgeBar),
        ]),
        h('div', { style: { marginTop: '12px' } }, [
          h(FtueGateView, { runtime, onFtueReady: () => { store.setAgeVerified(true); } }),
        ]),
        h('div', { style: { marginTop: '12px' } }, [
          h(CordelStageCanvas, {
            activeTab: store.activeHubTab,
            sedeLevel: store.sedeLevel,
            storedMilho: runtime.state.storedPerchMilho,
            activeTowers: runtime.state.unlockedTowers.length,
            roosterCount: runtime.roosters40.length,
            unitBars: runtime.state.unitBars,
            popups: runtime.state.activePopups,
            heroRaceLap: runtime.state.heroRaceLap,
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

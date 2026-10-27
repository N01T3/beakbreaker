import { defineComponent, h, ref } from 'vue';
import {
  CORDEL_PALETTE,
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

const TAB_ITEMS: Array<{ id: HubTabId; icon: string; label: string }> = [
  { id: 'Fazenda', icon: '🌾', label: 'Fazenda' },
  { id: 'Lutar', icon: '⚔️', label: 'Lutar' },
  { id: 'Galos', icon: '🐓', label: 'Galos' },
  { id: 'Bando', icon: '🏰', label: 'Bando' },
  { id: 'Loja', icon: '🏪', label: 'Loja' },
];

export const BeakBreakerWebApp = defineComponent({
  name: 'BeakBreakerWebApp',
  setup() {
    const store = useGameStore();
    const runtime = createWebRuntime();
    const isAudioMuted = ref(cordelAudio.isMuted());

    const handleToggleAudio = () => {
      const nextMuted = !cordelAudio.isMuted();
      cordelAudio.setMuted(nextMuted);
      isAudioMuted.value = nextMuted;
      if (!nextMuted) cordelAudio.playTrianguloReward();
    };

    const handleTabChange = (tab: HubTabId) => {
      store.setActiveTab(tab);
      cordelAudio.playZabumbaTabSwitch();
    };

    const renderActiveTab = () => {
      if (store.activeHubTab === 'Fazenda') {
        return h(FarmTabView, {
          runtime,
          onAddMilho: (amount: number) => { cordelAudio.playTrianguloReward(); store.addMilho(amount); },
          onUpgradeSede: (level: number) => { store.sedeLevel = level; },
        });
      }
      if (store.activeHubTab === 'Lutar') return h(ArenaTabView, { runtime });
      if (store.activeHubTab === 'Galos') return h(RoostersTabView, { runtime });
      if (store.activeHubTab === 'Bando') return h(ClanTabView, { runtime });
      return h(StoreTabView, {
        runtime, currentPity: store.currentPity,
        onPullChocadeira: (pulls: number) => { cordelAudio.playTrianguloReward(); store.advancePity(pulls, false); },
        onGrantCoroas: (coroas: number) => { cordelAudio.playTrianguloReward(); store.coroas += coroas; },
      });
    };

    return () =>
      h('div', {
        'data-testid': 'beakbreaker-web-shell',
        style: {
          maxWidth: '480px', width: '100%', margin: '0 auto', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '10px 8px 16px 8px',
        },
      }, [
        h('div', { 'data-testid': 'header-bar' }, [
          h(WoodcutHeader, {
            playerName: store.playerName,
            breederLevel: store.breederLevel >= 12 ? store.breederLevel : 12,
            sedeLevel: store.sedeLevel >= 12 ? store.sedeLevel : 12,
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
                marginTop: '6px', padding: '4px 10px', backgroundColor: CORDEL_PALETTE.amareloMilho,
                border: '2px solid #1B1B1B', boxShadow: '2px 2px 0 #1B1B1B', fontWeight: 'bold', display: 'inline-block',
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
            sedeLevel: store.sedeLevel >= 12 ? store.sedeLevel : 12,
            storedMilho: runtime.state.storedPerchMilho,
            activeTowers: runtime.state.unlockedTowers.length,
            roosterCount: runtime.roosters40.length,
            unitBars: runtime.state.unitBars,
            popups: runtime.state.activePopups,
            heroRaceLap: runtime.state.heroRaceLap,
          }),
        ]),
        h('main', { 'data-testid': 'active-tab-stage', style: { marginTop: '12px', flex: '1' } }, [
          renderActiveTab(),
        ]),
        h(
          'nav',
          {
            'data-testid': 'cordel-bottom-nav',
            style: {
              position: 'sticky', bottom: 0, zIndex: 40, marginTop: '16px',
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
              padding: '8px 4px', backgroundColor: CORDEL_PALETTE.tintaXilo,
              border: '3px solid #1B1B1B', boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.4)',
            },
          },
          TAB_ITEMS.map((item) => {
            const isActive = store.activeHubTab === item.id;
            return h(
              'button',
              {
                key: item.id,
                type: 'button',
                'data-testid': `nav-tab-${item.id}`,
                style: {
                  backgroundColor: isActive ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                  color: CORDEL_PALETTE.tintaXilo,
                  border: '2px solid #1B1B1B',
                  boxShadow: isActive ? '0 -3px 0 #1B1B1B, 2px 4px 0 #1B1B1B' : '2px 2px 0 #1B1B1B',
                  transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                  padding: '8px 2px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                },
                onClick: () => handleTabChange(item.id),
              },
              [
                h('span', { style: { fontSize: '18px', lineHeight: 1 } }, item.icon),
                h('span', { style: { fontWeight: '900', fontSize: '11px' } }, item.label),
              ],
            );
          }),
        ),
      ]);
  },
});

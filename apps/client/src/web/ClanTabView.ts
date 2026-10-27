import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE, CordelWoodFrame } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import { LiveOpsFestivalPanel } from './panels/LiveOpsFestivalPanel.js';
import { DivinePassCalendarPanel } from './panels/DivinePassCalendarPanel.js';
import { ClanTechMarketPanel } from './panels/ClanTechMarketPanel.js';
import { AchievementsCordelPanel } from './panels/AchievementsCordelPanel.js';
import { UFRankingProfilePanel } from './panels/UFRankingProfilePanel.js';
import { SocialVitrineCordelPanel } from './panels/SocialVitrineCordelPanel.js';
import { LabirintoRodaVisualPanel } from './panels/LabirintoRodaVisualPanel.js';
import { cordelAudio } from '../services/AudioService.js';

const CLAN_SUBTABS = [
  { id: 'bando', label: '🏕️ Bando & Guerra', testId: 'clan-subtab-bando' },
  { id: 'passe', label: '🎟️ Passe & Eventos', testId: 'clan-subtab-passe' },
  { id: 'labirinto', label: '🎡 Labirinto & Roda', testId: 'clan-subtab-labirinto' },
  { id: 'vitrine', label: '📜 Vitrine Social', testId: 'clan-subtab-vitrine' },
] as const;

export const ClanTabView = defineComponent({
  name: 'ClanTabView',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: true } },
  setup(props) {
    const activeSubTab = ref<'bando' | 'passe' | 'labirinto' | 'vitrine'>('bando');
    const capturedTerritory = ref('forte_do_cangaco');
    const showVitrine = ref(true);

    const handleAttackColossus = () => {
      const res = props.runtime.clan.recordRaidDamage(7_500_000);
      props.runtime.state.colossusHp = res.remainingHp;
      props.runtime.state.colossusPhase = res.phase;
    };
    const handleAdvanceRace = () => {
      const updated = props.runtime.liveOps.heroRaceScene.advanceNode('p_1', 5);
      if (updated) props.runtime.state.heroRaceLap = updated.lap;
    };
    const handleCaptureNode = (nodeId: string) => {
      props.runtime.clan.getWarMap().captureNode(nodeId, 'bando_lampiao');
      capturedTerritory.value = nodeId;
    };

    return () => {
      const nodes = props.runtime.clan.getWarMap().getAllNodes().slice(0, 4);

      return h(CordelWoodFrame, {
        title: 'Bando (Clã 30 Membros) & Eventos LiveOps',
        subtitle: `Temporada Ativa: ${props.runtime.liveOps.getActiveSeasonName()}`,
      }, {
        default: () => [
          h('div', { 'data-testid': 'tab-content-bando' }, [
            h('div', { style: { display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' } },
              CLAN_SUBTABS.map((tab) => h('button', {
                key: tab.id, type: 'button', 'data-testid': tab.testId,
                class: `game-btn ${activeSubTab.value === tab.id ? 'btn-gold' : ''}`,
                style: {
                  flex: '1 0 auto', padding: '8px 10px', fontSize: '11px',
                  backgroundColor: activeSubTab.value === tab.id ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                  color: CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B',
                },
                onClick: () => { activeSubTab.value = tab.id; cordelAudio.playZabumbaTabSwitch(); },
              }, tab.label))),
            h('div', { style: { display: activeSubTab.value === 'bando' ? 'block' : 'none' } }, [
              h('div', {
                class: 'cordel-card', 'data-testid': 'bando-sede-backdrop',
                style: { backgroundImage: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url('/assets/pranchas/bando-cla-backdrop.webp')", backgroundSize: 'cover', backgroundPosition: 'center', padding: '12px 14px', borderRadius: '6px', border: '2px solid #1B1B1B', marginBottom: '10px', color: '#FFF8E7' },
              }, [
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' } }, [
                  h('div', [
                    h('h3', { style: { margin: '0 0 2px 0', color: '#FFE082' } }, '🏕️ Sede do Bando: Acampamento Sertanejo'),
                    h('p', { style: { margin: 0, fontSize: '12px' } }, 'Prancha 15: Convivência dos 30 Irmãos do Cangaço & Estratégias do Sertão'),
                  ]),
                  h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, color: '#1B1B1B', fontWeight: 'bold' } }, '30/30 Irmãos'),
                ]),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'colossus-raid-panel' }, [
                h('h3', 'Raid do Galo Colosso (3 Fases: Brasa -> Lua -> Fúria)'),
                h('p', { 'data-testid': 'colossus-status' }, `HP Restante: ${props.runtime.state.colossusHp.toLocaleString('pt-BR')} | Fase: ${props.runtime.state.colossusPhase}`),
                h('button', { type: 'button', 'data-testid': 'btn-raid-attack', class: 'game-btn btn-red', style: { padding: '8px 14px' }, onClick: handleAttackColossus }, 'Atacar Galo Colosso (-7.5M HP)'),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'territory-war-panel' }, [
                h('h3', `Guerra de Territórios (${props.runtime.clan.getWarMap().getVillageCount()} Vilarejos + Fortes)`),
                h('p', `Último Território Dominado: ${capturedTerritory.value}`),
                h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                  nodes.map((node) => h('button', { key: node.id, type: 'button', class: 'game-btn', 'data-testid': `btn-capture-${node.id}`, onClick: () => handleCaptureNode(node.id) }, `Conquistar ${node.name} (+${node.pointsPerHour} pts/h)`))),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'hero-race-panel' }, [
                h('h3', `Corrida de Heróis (${props.runtime.state.heroRaceLap}/18 Voltas — Garantia Ave Heroica Volta 15)`),
                h('button', { type: 'button', 'data-testid': 'btn-advance-hero-race', class: 'game-btn btn-gold', style: { padding: '8px 14px' }, onClick: handleAdvanceRace }, 'Avançar +1 Volta na Corrida'),
              ]),
            ]),
            h('div', { style: { display: activeSubTab.value === 'passe' ? 'block' : 'none' } }, [
              h(LiveOpsFestivalPanel, { runtime: props.runtime }),
              h(DivinePassCalendarPanel, { runtime: props.runtime }),
              h(ClanTechMarketPanel, { runtime: props.runtime }),
              h(AchievementsCordelPanel, { runtime: props.runtime }),
            ]),
            h('div', { style: { display: activeSubTab.value === 'labirinto' ? 'block' : 'none' } }, [
              h(LabirintoRodaVisualPanel, { runtime: props.runtime }),
            ]),
            h('div', { style: { display: activeSubTab.value === 'vitrine' ? 'block' : 'none' } }, [
              h(UFRankingProfilePanel, { runtime: props.runtime }),
              h('div', { style: { margin: '8px 0' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-toggle-vitrine-cordel', class: 'game-btn',
                  style: { backgroundColor: showVitrine.value ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel, padding: '6px 12px' },
                  onClick: () => { showVitrine.value = !showVitrine.value; },
                }, showVitrine.value ? 'Ocultar Vitrine' : 'Exibir Vitrine'),
              ]),
              showVitrine.value ? h(SocialVitrineCordelPanel, { runtime: props.runtime }) : null,
            ]),
          ]),
        ],
      });
    };
  },
});

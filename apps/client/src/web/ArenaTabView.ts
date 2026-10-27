import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE, CordelWoodFrame, DualCombatBar } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import { cordelAudio } from '../services/AudioService.js';
import { ArenaHUD } from '../canvas/scenes/arena/ArenaHUD.js';
import { ArenaTacticalCardsPanel } from './panels/ArenaTacticalCardsPanel.js';
import { ArenaTeamSynergyPanel } from './panels/ArenaTeamSynergyPanel.js';
import { RankedLeaguePanel } from './panels/RankedLeaguePanel.js';
import { ClimaticTowerPanel } from './panels/ClimaticTowerPanel.js';
import { AlternativeCombatModesPanel } from './panels/AlternativeCombatModesPanel.js';
import { CampaignTorreVisualPanel } from './panels/CampaignTorreVisualPanel.js';
import { TVSertaoReplayPanel } from './panels/TVSertaoReplayPanel.js';
import { ModoHistoriaDialogoPanel } from './panels/ModoHistoriaDialogoPanel.js';
import { useGameStore } from '../stores/useGameStore.js';

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B', padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer',
});

const MODE_DEFS = [
  { key: 'arena', label: 'Arena 3v3', testId: 'btn-select-mode-arena' },
  { key: 'campanha', label: 'Estrada do Sertão & Torre', testId: 'btn-select-mode-estrada-torre' },
  { key: 'tvsertao', label: 'TV Sertão', testId: 'btn-select-mode-tv-sertao' },
  { key: 'historia', label: 'Modo História', testId: 'btn-select-mode-historia' },
] as const;

export const ArenaTabView = defineComponent({
  name: 'ArenaTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    onDesistir: { type: Function as PropType<() => void> },
  },
  setup(props) {
    const selectedMode = ref<'arena' | 'campanha' | 'tvsertao' | 'historia'>('arena');
    const campaignStage = ref(1);
    const towerFloor = ref(props.runtime.pve.getCurrentTowerFloor());
    const handleAdvanceTower = () => { towerFloor.value = props.runtime.pve.advanceTowerFloor(); };
    const handleClearCampaign = () => {
      props.runtime.pve.recordCampaignClear(campaignStage.value, 3);
      campaignStage.value = Math.min(90, campaignStage.value + 1);
    };
    const handleRetreat = () => {
      try { useGameStore().setActiveTab('Fazenda'); } catch {}
      props.onDesistir?.();
    };
    const handleSpeed = (s: number | string) => {
      if (s === 1 || s === 2 || s === 3) props.runtime.setBattleSpeed(s);
      else if (s === 0 || s === 'pause') props.runtime.setBattleSpeed(1);
    };

    return () => {
      const speed = props.runtime.state.battleSpeed;
      const stageInfo = props.runtime.pve.getCampaignStageInfo(campaignStage.value);
      const towerSpec = props.runtime.pve.getTowerFloorSpec(towerFloor.value);

      return h(CordelWoodFrame, {
        title: 'Arena 3v3 & Jornada PvE (Campanha 90 Fases / Torre 100F)',
        subtitle: `Motor Determinístico @beakbreaker/combat-core | Velocidade ${speed}x`,
      }, {
        default: () => [
          h('div', { 'data-testid': 'tab-content-lutar' }, [
            h('div', {
              class: 'cordel-card arena-combate-stage',
              'data-testid': 'arena-combate-stage',
              style: {
                position: 'relative',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.32)), url('/assets/pranchas/arena-combate-backdrop.webp')`,
                backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px',
                border: '3px solid #1B1B1B', padding: '8px', boxShadow: '4px 4px 0 #1B1B1B', overflow: 'hidden',
              },
            }, [
              h('img', { src: '/assets/pranchas/arena-combate-backdrop.webp', alt: 'Arena Prancha 09', 'data-testid': 'arena-combate-backdrop', style: { display: 'none' } }),
              h(ArenaHUD, {
                currentSpeed: speed, timerSeconds: 47, torcidaCount: props.runtime.state.torcidaTriggeredCount,
                onTorcida: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); },
                onSelectSpeed: handleSpeed, onDesistir: handleRetreat,
              }),
              h('div', {
                'data-testid': 'arena-combat-field',
                style: { minHeight: '110px', margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' },
              }, [
                h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } }, [
                  h('span', { class: 'cordel-badge', style: { backgroundColor: '#1D7846', color: '#FFF', fontSize: '9px' } }, '🛡️ VOCÊ (Trio)'),
                  h('div', { style: { display: 'flex', gap: '3px', alignItems: 'center' } }, [
                    h('img', { src: '/assets/roosters/trovao_sprite_transparent.png', alt: 'Trovão', style: { width: '52px', height: '52px', objectFit: 'contain' } }),
                    h('img', { src: '/assets/roosters/card_05.webp', alt: 'Brisa', style: { width: '34px', height: '42px', objectFit: 'contain', borderRadius: '4px' } }),
                    h('img', { src: '/assets/roosters/card_13.webp', alt: 'Pedra', style: { width: '34px', height: '42px', objectFit: 'contain', borderRadius: '4px' } }),
                  ]),
                ]),
                h('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
                  h('img', { src: '/assets/roosters/arena_starburst_pah.webp', alt: 'PAH!', style: { width: '48px', height: '48px', objectFit: 'contain' } }),
                  h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, color: '#1B1B1B', fontWeight: '900', fontSize: '11px' } }, props.runtime.state.activePopups[0] ?? '⚔️ DUELO 3v3'),
                ]),
                h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' } }, [
                  h('span', { class: 'cordel-badge', style: { backgroundColor: '#D7263D', color: '#FFF', fontSize: '9px' } }, '🦅 SERTÃO (Inimigo)'),
                  h('div', { style: { display: 'flex', gap: '3px', alignItems: 'center' } }, [
                    h('img', { src: '/assets/roosters/card_11.webp', alt: 'Cangaceiro', style: { width: '34px', height: '42px', objectFit: 'contain', borderRadius: '4px' } }),
                    h('img', { src: '/assets/roosters/card_03.webp', alt: 'Caboré', style: { width: '34px', height: '42px', objectFit: 'contain', borderRadius: '4px' } }),
                    h('img', { src: '/assets/roosters/card_14.webp', alt: 'Vaqueiro', style: { width: '34px', height: '42px', objectFit: 'contain', borderRadius: '4px' } }),
                  ]),
                ]),
              ]),
              h(ArenaTacticalCardsPanel, {
                currentSpeed: speed, torcidaCount: props.runtime.state.torcidaTriggeredCount,
                onSpecialTap: () => { cordelAudio.playXiloHitSfx(); props.runtime.runArenaBattle3v3(); },
                onTorcida: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); },
                onSelectSpeed: handleSpeed, onDesistir: handleRetreat,
              }),
            ]),
            h('div', { class: 'cordel-card', 'data-testid': 'arena-controls', style: { marginTop: '10px' } }, [
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-start-battle-3v3',
                  style: btnStyle(CORDEL_PALETTE.vermelhoCrista, CORDEL_PALETTE.cremePapel),
                  onClick: () => { cordelAudio.playXiloHitSfx(); props.runtime.runArenaBattle3v3(); },
                }, 'Executar Duelo 3v3'),
                ([1, 2, 3] as const).map((mult) =>
                  h('button', {
                    key: mult, type: 'button', 'data-testid': `btn-speed-${mult}x`,
                    style: btnStyle(speed === mult ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
                    onClick: () => props.runtime.setBattleSpeed(mult),
                  }, `${mult}x`),
                ),
                h('button', { type: 'button', 'data-testid': 'btn-cycle-speed', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => props.runtime.cycleBattleSpeed() }, `Velocidade Atual: ${speed}x`),
                h('button', { type: 'button', 'data-testid': 'btn-torcida', style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); } }, `Torcida (+Canto) [${props.runtime.state.torcidaTriggeredCount}]`),
              ]),
              h('div', { 'data-testid': 'xilo-popup-container', style: { marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                props.runtime.state.activePopups.map((txt, idx) =>
                  h('span', { key: idx, 'data-testid': 'xilo-popup-balloon', class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, fontSize: '15px', padding: '6px 12px' } }, txt),
                ),
              ),
              props.runtime.state.lastBattleWinner ? h('p', { 'data-testid': 'battle-result-banner', style: { fontWeight: 'bold' } }, `Resultado 3v3: Vitória Time ${props.runtime.state.lastBattleWinner} (${props.runtime.state.lastBattleTicks} ticks)`) : null,
            ]),
            h('div', { class: 'cordel-grid', 'data-testid': 'arena-combat-bars', style: { marginTop: '10px' } },
              props.runtime.state.unitBars.map((unit) =>
                h('div', { key: unit.id, class: 'cordel-card' }, [
                  h('strong', `${unit.name} (${unit.roosterClass})`),
                  h('p', `Vigor: ${unit.vigor}/${unit.maxVigor} | Canto: ${unit.canto}/1000`),
                  h(DualCombatBar, { vigor: unit.vigor, maxVigor: unit.maxVigor, canto: unit.canto }),
                ]),
              ),
            ),
            h('div', { class: 'cordel-grid', style: { marginTop: '10px' } }, [
              h('div', { class: 'cordel-card', 'data-testid': 'campaign-panel' }, [
                h('h4', `Campanha Estrada do Sertão: Fase ${stageInfo.stageNumber}/90 (Cap. ${stageInfo.chapterNumber}/6)`),
                h('button', { type: 'button', 'data-testid': 'btn-campaign-advance', onClick: handleClearCampaign }, 'Concluir Fase 3★ (-6 Fôlego)'),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'tower-panel' }, [
                h('h4', `Torre do Mandacaru: Andar ${towerSpec.floor}/100 (Clima: ${towerSpec.modifier} | 0 Fôlego)`),
                h('button', { type: 'button', 'data-testid': 'btn-tower-advance', onClick: handleAdvanceTower }, 'Subir Andar da Torre'),
              ]),
            ]),
            h(ArenaTeamSynergyPanel, { runtime: props.runtime }),
            h(RankedLeaguePanel, { runtime: props.runtime }),
            h(ClimaticTowerPanel, { runtime: props.runtime }),
            h(AlternativeCombatModesPanel, { runtime: props.runtime }),
            h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' } },
              MODE_DEFS.map((m) =>
                h('button', {
                  key: m.key, type: 'button', 'data-testid': m.testId,
                  style: btnStyle(selectedMode.value === m.key ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
                  onClick: () => { selectedMode.value = m.key; if (m.key !== 'arena') cordelAudio.playZabumbaTabSwitch(); },
                }, m.label),
              ),
            ),
            h(CampaignTorreVisualPanel, { runtime: props.runtime }),
            h(TVSertaoReplayPanel, { runtime: props.runtime }),
            h(ModoHistoriaDialogoPanel, { runtime: props.runtime }),
          ]),
        ],
      });
    };
  },
});

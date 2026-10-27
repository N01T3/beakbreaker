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
import { useGameStore } from '../stores/useGameStore.js';

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B',
  padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer',
});

export const ArenaTabView = defineComponent({
  name: 'ArenaTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    onDesistir: { type: Function as PropType<() => void> },
  },
  setup(props) {
    const selectedMode = ref<'arena' | 'campanha'>('arena');
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
            h(ArenaHUD, {
              currentSpeed: speed,
              timerSeconds: 47,
              torcidaCount: props.runtime.state.torcidaTriggeredCount,
              onTorcida: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); },
              onSelectSpeed: handleSpeed,
              onDesistir: handleRetreat,
            }),
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
                h('button', {
                  type: 'button', 'data-testid': 'btn-cycle-speed',
                  style: btnStyle(CORDEL_PALETTE.cremePapel),
                  onClick: () => props.runtime.cycleBattleSpeed(),
                }, `Velocidade Atual: ${speed}x`),
                h('button', {
                  type: 'button', 'data-testid': 'btn-torcida',
                  style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel),
                  onClick: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); },
                }, `Torcida (+Canto) [${props.runtime.state.torcidaTriggeredCount}]`),
              ]),
              h('div', { 'data-testid': 'xilo-popup-container', style: { marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                props.runtime.state.activePopups.map((txt, idx) =>
                  h('span', {
                    key: idx, 'data-testid': 'xilo-popup-balloon', class: 'cordel-badge',
                    style: { backgroundColor: CORDEL_PALETTE.amareloMilho, fontSize: '15px', padding: '6px 12px' },
                  }, txt),
                ),
              ),
              props.runtime.state.lastBattleWinner ? h('p', {
                'data-testid': 'battle-result-banner', style: { fontWeight: 'bold' },
              }, `Resultado 3v3: Vitória Time ${props.runtime.state.lastBattleWinner} (${props.runtime.state.lastBattleTicks} ticks)`) : null,
            ]),
            h(ArenaTacticalCardsPanel, {
              currentSpeed: speed,
              torcidaCount: props.runtime.state.torcidaTriggeredCount,
              onSpecialTap: () => { cordelAudio.playXiloHitSfx(); props.runtime.runArenaBattle3v3(); },
              onTorcida: () => { cordelAudio.playTorcidaCheer(); props.runtime.triggerTorcida(); },
              onSelectSpeed: handleSpeed,
            }),
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
            h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
              h('button', {
                type: 'button', 'data-testid': 'btn-select-mode-arena',
                style: btnStyle(selectedMode.value === 'arena' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
                onClick: () => { selectedMode.value = 'arena'; },
              }, 'Arena 3v3'),
              h('button', {
                type: 'button', 'data-testid': 'btn-select-mode-estrada-torre',
                style: btnStyle(selectedMode.value === 'campanha' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
                onClick: () => { selectedMode.value = 'campanha'; },
              }, 'Estrada do Sertão & Torre'),
            ]),
            h(CampaignTorreVisualPanel, { runtime: props.runtime }),
          ]),
        ],
      });
    };
  },
});

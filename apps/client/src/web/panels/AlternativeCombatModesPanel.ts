import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  createCombatUnitFromSpec,
  DueloAmistosoEngine,
  ArenaNiveladaEngine,
  ReiDoTerreiroEngine,
  TorneioArraialEngine,
  type TorneioParticipant,
} from '@beakbreaker/combat-core';
import { LAUNCH_ROOSTERS } from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.cremePapel) => ({
  backgroundColor: bg,
  color: fg,
  border: '2px solid #1B1B1B',
  padding: '8px 12px',
  fontWeight: 'bold',
  cursor: 'pointer',
});

export const AlternativeCombatModesPanel = defineComponent({
  name: 'AlternativeCombatModesPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const resultText = ref('Escolha um modo alternativo de duelo sertanejo para iniciar.');

    const runDueloAmistoso = () => {
      const athleteA = createCombatUnitFromSpec(LAUNCH_ROOSTERS[0]!, {
        id: 'duelo_atleta_a', team: 'A', slotIndex: 0,
      });
      const athleteB = createCombatUnitFromSpec(LAUNCH_ROOSTERS[1]!, {
        id: 'duelo_atleta_b', team: 'B', slotIndex: 0,
      });
      const res = DueloAmistosoEngine.simulate({ seed: 42, athleteA, athleteB, maxTicks: 900 });
      resultText.value = `Duelo 1x1 Amistoso Finalizado: Vencedor Time ${res.winner} em ${res.durationSeconds}s (${res.durationTicks} ticks, 0 troféus em jogo)`;
    };

    const runArenaNivelada = () => {
      const teamA = [0, 4, 8].map((idx, i) =>
        createCombatUnitFromSpec(LAUNCH_ROOSTERS[idx]!, { id: `niv_a_${i}`, team: 'A', slotIndex: i as 0 | 1 | 2 }),
      );
      const teamB = [1, 5, 9].map((idx, i) =>
        createCombatUnitFromSpec(LAUNCH_ROOSTERS[idx]!, { id: `niv_b_${i}`, team: 'B', slotIndex: i as 0 | 1 | 2 }),
      );
      const res = ArenaNiveladaEngine.simulate({ seed: 100, teamA, teamB });
      resultText.value = `Arena Nivelada Balanceada: Vencedor Time ${res.winner} em ${res.durationTicks} ticks (Todos Nv 30 sem equipamento)`;
    };

    const runReiDoTerreiro = () => {
      const champ = [createCombatUnitFromSpec(LAUNCH_ROOSTERS[0]!, { id: 'rei_c', team: 'A', slotIndex: 0 })];
      const challengers = [1, 2, 3].map((idx) => [
        createCombatUnitFromSpec(LAUNCH_ROOSTERS[idx]!, { id: `chal_${idx}`, team: 'B', slotIndex: 0 }),
      ]);
      const res = ReiDoTerreiroEngine.simulate({ seed: 777, championTeam: champ, challengers });
      resultText.value = `Rei do Terreiro: Sequência de ${res.winStreak} vitórias consecutivas! Recompensas: ${res.rewards.milho} Milho e ${res.rewards.penas} Penas Douradas`;
    };

    const runTorneioArraial = () => {
      const participants: TorneioParticipant[] = Array.from({ length: 8 }, (_, i) => ({
        id: `arraial_p_${i + 1}`,
        name: `Rancho ${i + 1}`,
        team: [createCombatUnitFromSpec(LAUNCH_ROOSTERS[i % LAUNCH_ROOSTERS.length]!, {
          id: `arr_unit_${i}`, team: 'A', slotIndex: 0,
        })],
      }));
      const res = TorneioArraialEngine.simulate({ seed: 888, participants });
      const premio = res.standings[0]?.premio;
      resultText.value = `Torneio do Arraial: Campeão ${res.campeao.name}! Título "${premio?.titulo}" e Prêmio de ${premio?.milho} Milho`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'alternative-combat-modes-panel', style: { marginTop: '10px' } }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'Modos Alternativos de Duelo Sertanejo'),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'button-duelo-1x1',
            style: btnStyle(CORDEL_PALETTE.vermelhoCrista),
            onClick: runDueloAmistoso,
          }, 'Duelo Amistoso 1x1 (45s)'),
          h('button', {
            type: 'button', 'data-testid': 'button-arena-nivelada',
            style: btnStyle(CORDEL_PALETTE.azulAnil),
            onClick: runArenaNivelada,
          }, 'Arena Nivelada (Nv 30)'),
          h('button', {
            type: 'button', 'data-testid': 'button-rei-terreiro',
            style: btnStyle(CORDEL_PALETTE.amareloMilho, CORDEL_PALETTE.tintaXilo),
            onClick: runReiDoTerreiro,
          }, 'Rei do Terreiro (Sobrevivência)'),
          h('button', {
            type: 'button', 'data-testid': 'button-torneio-arraial',
            style: btnStyle(CORDEL_PALETTE.verdeMata),
            onClick: runTorneioArraial,
          }, 'Torneio do Arraial (8 Chaves)'),
        ]),
        h('p', {
          'data-testid': 'alt-modes-result',
          style: { fontWeight: 'bold', color: CORDEL_PALETTE.tintaXilo, margin: '6px 0', padding: '6px', border: '1px dashed #1B1B1B' },
        }, resultText.value),
      ]);
  },
});

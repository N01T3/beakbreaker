import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  ClimaticModifierSystem,
  CombatReplaySerializer,
  TVReplayDecoder,
  type CombatReplaySpec,
} from '@beakbreaker/combat-core';
import type { WebRuntime } from '../createWebRuntime.js';

export interface ModifierOption {
  readonly id: string;
  readonly label: string;
  readonly effect: string;
}

export const CLIMATIC_TOWER_MODIFIERS: readonly ModifierOption[] = [
  { id: 'Seca', label: 'Seca', effect: 'Seca Esturricada: Dano contínuo de Seca e cura reduzida em 20% (-200‰).' },
  { id: 'Chuva', label: 'Chuva', effect: 'Chuva Torrencial: Golpes do elemento Correnteza ganham +25% de amplificação.' },
  { id: 'Noite', label: 'Noite', effect: 'Noite Enluarada: Bônus para Galo Cantador e afinidade Lua (+150 Canto inicial).' },
  { id: 'Ventania', label: 'Ventania', effect: 'Ventania Nordestina: Evasão reduzida e Atiradores perdem 15% de precisão.' },
  { id: 'Sol a Pino', label: 'Sol a Pino', effect: 'Sol a Pino: Calor extremo dobra o dano de Queimadura (2.0x / +100%).' },
  { id: 'Neblina', label: 'Neblina', effect: 'Neblina da Serra: Evasão elevada; todos iniciam com Furtivo por 30 ticks.' },
  { id: 'Muralha', label: 'Muralha', effect: 'Muralha de Pedra: Unidades da linha de frente ganham +25% de Defesa.' },
  { id: 'Assombração', label: 'Assombração', effect: 'Assombração do Sertão: Atletas da classe Assassino causam +20% de dano.' },
  { id: 'Fúria do Coronel', label: 'Fúria do Coronel', effect: 'Fúria do Coronel: Desafiantes do Time B causam +30% de dano adicional.' },
  { id: 'Fé na Sanfona', label: 'Fé na Sanfona', effect: 'Fé na Sanfona: Toque do acordeom acelera o ganho de Canto em +5%.' },
  { id: 'Espinheiro', label: 'Espinheiro', effect: 'Espinheiro Bravo: Barreira vegetal reflete 15% do dano sofrido de volta.' },
  { id: 'Festa no Arraial', label: 'Festa no Arraial', effect: 'Festa no Arraial: Clima festivo autoriza até 2 Torcidas por duelo.' },
];

export function buildSampleReplaySpec(climaticModifier: string): CombatReplaySpec {
  return {
    version: 5, seed: 20261027, mode: '3v3', climaticModifier,
    teamASpecIds: ['rooster_01', 'rooster_02', 'rooster_03'],
    teamBSpecIds: ['rooster_04', 'rooster_05', 'rooster_06'],
    torcidaTriggers: [{ tick: 20, team: 'A' }],
    cortaCantoTriggers: [{ tick: 45, targetUnitId: 'B_0' }],
    expectedWinner: 'A', expectedTicks: 410,
  };
}

export const ClimaticTowerPanel = defineComponent({
  name: 'ClimaticTowerPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialModifier: { type: String, default: 'Seca' },
  },
  setup(props) {
    const selectedModifierId = ref(props.initialModifier);
    const replayPayload = ref('');
    const replayInfo = ref('Nenhum replay inspecionado ainda');
    const replaySizeSummary = ref('');

    const currentModifier = computed(() =>
      CLIMATIC_TOWER_MODIFIERS.find((m) => m.id === selectedModifierId.value) ?? CLIMATIC_TOWER_MODIFIERS[0]!,
    );

    const handleInspectReplay = () => {
      const spec = buildSampleReplaySpec(currentModifier.value.label);
      const encoded = CombatReplaySerializer.serializeToBase64(spec);
      replayPayload.value = encoded;
      const byteSize = new TextEncoder().encode(encoded).length;
      const kbSize = (byteSize / 1024).toFixed(2);
      const decoded = TVReplayDecoder.decodeFromBase64(encoded);
      replaySizeSummary.value = `${byteSize} B (${kbSize} KB) [< 1.5 KB Conforme]`;
      replayInfo.value = `Modo: ${decoded.mode} | Vencedor: Time ${decoded.expectedWinner} | Ticks: ${decoded.expectedTicks} | Clima: ${decoded.climaticModifier}`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'climatic-tower-panel' }, [
        h('h4', { style: { color: CORDEL_PALETTE.azulAnil, margin: '0 0 8px 0' } }, 'Torre dos Santos — Modificadores Climáticos'),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('label', { style: { fontWeight: 'bold' } }, 'Clima Ativo:'),
          h('select', {
            'data-testid': 'select-climatic-modifier',
            value: selectedModifierId.value,
            style: { border: '2px solid #1B1B1B', padding: '6px 10px', backgroundColor: CORDEL_PALETTE.cremePapel, fontWeight: 'bold' },
            onChange: (e: Event) => { selectedModifierId.value = (e.target as HTMLSelectElement).value; },
          }, CLIMATIC_TOWER_MODIFIERS.map((m) => h('option', { key: m.id, value: m.id }, m.label))),
          h('span', {
            'data-testid': 'active-modifier-badge',
            class: 'cordel-badge',
            style: { backgroundColor: CORDEL_PALETTE.amareloMilho, color: CORDEL_PALETTE.tintaXilo, padding: '4px 8px', fontWeight: 'bold' },
          }, currentModifier.value.label),
        ]),
        h('div', {
          'data-testid': 'climatic-effect-card',
          style: { padding: '8px 12px', border: '2px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, marginBottom: '10px' },
        }, [
          h('strong', { style: { display: 'block', marginBottom: '4px' } }, 'Efeito de Combate:'),
          h('p', { 'data-testid': 'climatic-effect-description', style: { margin: 0, fontStyle: 'italic' } }, currentModifier.value.effect),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-inspect-replay',
            style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer' },
            onClick: handleInspectReplay,
          }, 'Inspecionar Replay TV Sertão (< 1.5 KB)'),
          replaySizeSummary.value
            ? h('span', { 'data-testid': 'replay-size-badge', style: { fontWeight: 'bold', color: CORDEL_PALETTE.tintaXilo } }, replaySizeSummary.value)
            : null,
        ]),
        replayPayload.value
          ? h('div', {
              'data-testid': 'replay-inspection-info',
              style: { padding: '8px 12px', border: '2px dashed #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, fontSize: '13px' },
            }, [
              h('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, 'Decodificação TV Sertão:'),
              h('p', { 'data-testid': 'replay-decoded-details', style: { margin: 0 } }, replayInfo.value),
            ])
          : null,
      ]);
  },
});

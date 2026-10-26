import { defineComponent, h, ref, computed, type PropType } from 'vue';
import type { RoosterClass, RoosterSpec } from '@beakbreaker/game-data';
import {
  InterruptSystem,
  SynergyResolver,
  createCombatUnitFromSpec,
} from '@beakbreaker/combat-core';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface TrioPreset {
  name: string;
  classes: readonly RoosterClass[];
  roosters: RoosterSpec[];
}

const PRESET_BLUEPRINTS: ReadonlyArray<{ name: string; classes: readonly RoosterClass[] }> = [
  { name: 'Trio Forró de Brasa', classes: ['Atirador', 'Bruiser', 'Assassino'] },
  { name: 'Trio Muralha do Sertão', classes: ['Tanque', 'Suporte', 'Bruiser'] },
  { name: 'Trio Relâmpago & Sombra', classes: ['Assassino', 'Controle', 'Atirador'] },
];

/** Monta os trios escolhendo um galo de cada classe (classes distintas). */
export function buildTrioPresets(roosters: readonly RoosterSpec[]): TrioPreset[] {
  return PRESET_BLUEPRINTS.map((bp) => {
    const picked: RoosterSpec[] = [];
    for (const cls of bp.classes) {
      const found = roosters.find((r) => r.roosterClass === cls && !picked.includes(r));
      if (found) picked.push(found);
    }
    return { name: bp.name, classes: picked.map((r) => r.roosterClass), roosters: picked };
  });
}

export interface CortaCantoResult {
  interrupted: boolean;
  windupTicksBefore: number;
  cantoAfter: number;
}

/** Simula o Corta-Canto: inimigo com Canto cheio é interrompido no meio da conjuração. */
export function simulateCortaCanto(spec: RoosterSpec): CortaCantoResult {
  const unit = createCombatUnitFromSpec(spec, { id: 'B_0', team: 'B', slotIndex: 0 });
  unit.canto = 1000;
  InterruptSystem.startSpecialWindup(unit);
  for (let i = 0; i < 3; i += 1) InterruptSystem.advanceWindupTick(unit);
  const windupTicksBefore = unit.castWindupRemainingTicks;
  const interrupted = InterruptSystem.triggerCortaCanto(unit);
  return { interrupted, windupTicksBefore, cantoAfter: unit.canto };
}

const btnStyle = {
  border: '2px solid #1B1B1B',
  padding: '8px 12px',
  fontWeight: 'bold',
  backgroundColor: '#F4E9D0',
};

export const ArenaTeamSynergyPanel = defineComponent({
  name: 'ArenaTeamSynergyPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const presets = buildTrioPresets(props.runtime.roosters40);
    const activeIdx = ref(0);
    const cortaStatus = ref('Aguardando conjuração inimiga...');

    const activePreset = computed(() => presets[activeIdx.value % presets.length]);
    const synergy = computed(() =>
      SynergyResolver.evaluateClasses(activePreset.value?.classes ?? []),
    );

    const handleCycle = () => {
      activeIdx.value = (activeIdx.value + 1) % presets.length;
    };

    const handleCortaCanto = () => {
      const enemySpec = props.runtime.roosters40[0];
      if (!enemySpec) return;
      const res = simulateCortaCanto(enemySpec);
      cortaStatus.value = res.interrupted
        ? `Interrompido! ${enemySpec.name} perdeu a conjuração (faltavam ${res.windupTicksBefore} ticks) | Canto: ${res.cantoAfter}/1000`
        : `Falhou: sem conjuração ativa | Canto: ${res.cantoAfter}/1000`;
      cordelAudio.playCortaCantoSfx();
      props.runtime.state.activePopups.unshift('CORTA-CANTO!');
    };

    return () => {
      const preset = activePreset.value;
      const syn = synergy.value;
      const summary = syn.isMonoclassBlocked
        ? 'Bloqueado: trio monoclasse não ativa sinergias'
        : syn.activeSynergies.length > 0
          ? `Sinergias ativas: ${syn.activeSynergies.map((s) => s.name).join(', ')}`
          : 'Nenhuma sinergia ativa';

      return h('div', { class: 'cordel-card', 'data-testid': 'arena-synergy-panel' }, [
        h('h4', 'Sinergias de Trio & Corta-Canto'),
        h('p', { 'data-testid': 'active-trio-name', style: { fontWeight: 'bold' } }, preset?.name ?? '—'),
        h(
          'p',
          preset ? preset.roosters.map((r) => `${r.name} (${r.roosterClass})`).join(' • ') : '',
        ),
        h('p', { 'data-testid': 'active-synergy-summary' }, summary),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
          h(
            'button',
            { type: 'button', 'data-testid': 'btn-cycle-trio', style: btnStyle, onClick: handleCycle },
            'Trocar Trio',
          ),
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'btn-corta-canto',
              style: { ...btnStyle, backgroundColor: '#C0392B', color: '#F4E9D0' },
              onClick: handleCortaCanto,
            },
            'Corta-Canto!',
          ),
        ]),
        h('p', { 'data-testid': 'corta-canto-status', style: { marginTop: '8px' } }, cortaStatus.value),
      ]);
    };
  },
});

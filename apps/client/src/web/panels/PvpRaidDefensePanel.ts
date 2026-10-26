import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { PvpController } from '../../features/pvp/PvpController.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface RuralDefenseItem {
  id: string;
  name:
    | 'Cerca de Mandacaru'
    | 'Cachorro Vira-Lata'
    | 'Ganso Sentinela'
    | 'Espantalho de Xilo';
  active: boolean;
}

export const PvpRaidDefensePanel = defineComponent({
  name: 'PvpRaidDefensePanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const pvpCtrl =
      (props.runtime as WebRuntime & { pvp?: PvpController }).pvp ?? new PvpController();

    const defenses = ref<RuralDefenseItem[]>([
      { id: 'def_mandacaru', name: 'Cerca de Mandacaru', active: true },
      { id: 'def_cachorro', name: 'Cachorro Vira-Lata', active: true },
      { id: 'def_ganso', name: 'Ganso Sentinela', active: true },
      { id: 'def_espantalho', name: 'Espantalho de Xilo', active: false },
    ]);

    const raidStatusText = ref(
      'Pronto para Saque 2 Ondas (Onda 1 + Onda 2) | Trava Anticonluio 72h ativa',
    );
    const raidCounter = ref(0);

    const handleToggleDefense = () => {
      const allActive = defenses.value.every((d) => d.active);
      defenses.value = defenses.value.map((d, idx) => ({
        ...d,
        active: allActive ? idx < 3 : true,
      }));
    };

    const handleExecuteFarmRaid = () => {
      raidCounter.value += 1;
      const raidLoot = pvpCtrl.calculateTwoWaveSaqueLoot(10_000, true, true);
      const systemBonusMilho = Math.floor(raidLoot.stolenMilho * 1.5);
      pvpCtrl.registerIncomingSaque('raid_72h_lock', 'invasor_sertao_01', raidLoot.stolenMilho);
      raidStatusText.value = `Saque 2 Ondas #${raidCounter.value} Concluído: Base ${raidLoot.stolenMilho} Milho -> +50% Bônus do Sistema = ${systemBonusMilho} Milho | Escudo Defensor: ${raidLoot.defenderShieldHoursGranted}h`;
    };

    const handleTestRevengeLock = () => {
      pvpCtrl.registerIncomingSaque('raid_unico_72h', 'invasor_cangaco', 1200);
      const firstAttempt = pvpCtrl.executeRevenge72h('raid_unico_72h');
      const secondAttempt = pvpCtrl.executeRevenge72h('raid_unico_72h');
      raidStatusText.value = `Revanche Única (72h): 1ª Tentativa +50% = ${firstAttempt.recoveredMilhoWithBonus} Milho | 2ª Tentativa Bloqueada (Trava Anticonluio 72h): ${
        !secondAttempt.ok ? 'TRAVADA (OK)' : 'FALHA'
      }`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'pvp-raid-panel' }, [
        h('h3', '4 Defesas Rurais da Fazenda & Saque 2 Ondas (Trava 72h)'),
        h(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' } },
          defenses.value.map((def) =>
            h(
              'span',
              {
                key: def.id,
                class: 'cordel-badge',
                style: {
                  padding: '4px 8px',
                  border: '2px solid #1B1B1B',
                  backgroundColor: def.active
                    ? CORDEL_PALETTE.amareloMilho
                    : CORDEL_PALETTE.cremePapel,
                  fontWeight: 'bold',
                },
              },
              `${def.name}: ${def.active ? 'ATIVA' : 'INATIVA'}`,
            ),
          ),
        ),
        h(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          [
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-toggle-defense',
                style: {
                  backgroundColor: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleToggleDefense,
              },
              'Alternar / Ativar 4 Defesas Rurais',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-execute-farm-raid',
                style: {
                  backgroundColor: CORDEL_PALETTE.vermelhoCrista,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleExecuteFarmRaid,
              },
              'Executar Saque 2 Ondas',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-test-revenge-lock',
                style: {
                  backgroundColor: CORDEL_PALETTE.verdeMata,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleTestRevengeLock,
              },
              'Testar Revanche Única (Trava 72h)',
            ),
          ],
        ),
        h('p', { 'data-testid': 'farm-raid-status' }, raidStatusText.value),
      ]);
  },
});

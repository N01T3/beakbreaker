import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import {
  INFIRMARY_POTIONS,
  INFIRMARY_REST_SPEC,
  BASE_REST_TIME_MINUTES,
  STRAW_BED_REST_TIME_MINUTES,
  getInfirmaryBedCapacity,
  getPotionById,
  type InfirmaryPotionSpec,
} from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

export const InfirmaryPotionsPanel = defineComponent({
  name: 'InfirmaryPotionsPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialSedeLevel: { type: Number, default: 1 },
    initialVigor: { type: Number, default: 50 },
    maxVigor: { type: Number, default: 100 },
  },
  setup(props) {
    const sedeLevel = ref(props.runtime?.farm.getScene().getSedeLevel() ?? props.initialSedeLevel);
    const roosterVigor = ref(props.initialVigor);
    const maxVigor = ref(props.maxVigor);
    const occupiedBeds = ref(1);
    const bedCapacity = computed(() => getInfirmaryBedCapacity(sedeLevel.value));
    const activeBuffs = ref<string[]>([]);
    const feedbackMessage = ref('Enfermaria pronta para acolher e tratar as aves do Sertão.');

    const handleApplyPotion = (potionId: string) => {
      const potion = getPotionById(potionId);
      if (!potion) return;

      if (potion.effectType === 'cura_vigor') {
        const heal = Math.round((maxVigor.value * potion.effectValue) / 100);
        roosterVigor.value = Math.min(maxVigor.value, roosterVigor.value + heal);
        feedbackMessage.value = `${potion.name} aplicado! Vigor restaurado para ${roosterVigor.value}/${maxVigor.value} (+${heal} PV).`;
      } else {
        if (!activeBuffs.value.includes(potion.name)) {
          activeBuffs.value.push(potion.name);
        }
        feedbackMessage.value = `${potion.name} administrado! (${potion.description})`;
      }
    };

    const handleUpgradeBeds = (level: number) => {
      sedeLevel.value = level;
      feedbackMessage.value = `Enfermaria atualizada para Sede Nv.${level}: Capacidade de ${bedCapacity.value} leitos.`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'infirmary-potions-panel', style: { border: '2px solid #1B1B1B', padding: '12px', margin: '10px 0', backgroundColor: CORDEL_PALETTE.cremePapel } }, [
        h('h3', { style: { color: CORDEL_PALETTE.tintaXilo, margin: '0 0 8px 0' } }, 'Enfermaria Rural & Botica do Sertão'),
        h('div', { class: 'infirmary-beds-section', style: { marginBottom: '10px', padding: '8px', border: '1px solid #1B1B1B', backgroundColor: '#fff' } }, [
          h('h4', { style: { margin: '0 0 4px 0', color: CORDEL_PALETTE.verdeMata } }, `Leitos da Enfermaria (Sede Nível ${sedeLevel.value})`),
          h('p', { 'data-testid': 'infirmary-beds-display', style: { margin: '4px 0' } }, [
            'Capacidade: ',
            h('strong', `${occupiedBeds.value}/${bedCapacity.value} Leitos ocupados`),
            ` (Progresso: 2 leitos nv 1-5, 4 leitos nv 6-11, 6 leitos nv 12)`,
          ]),
          h('p', { 'data-testid': 'infirmary-recovery-display', style: { margin: '4px 0' } }, `Tempo de Recuperação: ${STRAW_BED_REST_TIME_MINUTES} min (Cama de Palha de Milho Acelerada) vs ${BASE_REST_TIME_MINUTES} min (Descanso Padrão)`),
          h('p', { 'data-testid': 'infirmary-vigor-display', style: { margin: '4px 0', fontWeight: 'bold' } }, `Vigor da Ave Atleta: ${roosterVigor.value}/${maxVigor.value} PV`),
          h('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' } }, [
            h('button', { type: 'button', 'data-testid': 'btn-infirmary-sede-6', style: { backgroundColor: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => handleUpgradeBeds(6) }, 'Sede 6 (4 Leitos)'),
            h('button', { type: 'button', 'data-testid': 'btn-infirmary-sede-12', style: { backgroundColor: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => handleUpgradeBeds(12) }, 'Sede 12 (6 Leitos)'),
          ]),
        ]),
        h('div', { class: 'potions-section', style: { padding: '8px', border: '1px solid #1B1B1B', backgroundColor: '#fff' } }, [
          h('h4', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.terracota } }, 'Botica de Remédios Naturais e Poções'),
          h('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' } }, [
            h('button', { type: 'button', 'data-testid': 'btn-apply-arnica', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => handleApplyPotion('unguento_arnica') }, 'Pomada de Arnica (Recuperar Vigor)'),
            h('button', { type: 'button', 'data-testid': 'btn-apply-garrafada', style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => handleApplyPotion('garrafada_do_sertao') }, 'Garrafada do Sertão (+15% Força)'),
          ]),
          h('div', { class: 'potions-grid', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' } },
            INFIRMARY_POTIONS.map((potion) =>
              h('div', { key: potion.id, 'data-testid': `potion-card-${potion.id}`, style: { border: '1px dashed #1B1B1B', padding: '6px', fontSize: '13px' } }, [
                h('strong', potion.name),
                h('div', { style: { color: '#666', fontSize: '11px' } }, `Custo: ${potion.milhoCost} Milho`),
                h('p', { style: { margin: '2px 0 4px 0', fontSize: '11px' } }, potion.description),
                h('button', { type: 'button', 'data-testid': `btn-use-${potion.id}`, style: { backgroundColor: CORDEL_PALETTE.cremePapel, border: '1px solid #1B1B1B', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }, onClick: () => handleApplyPotion(potion.id) }, 'Usar Remédio'),
              ]),
            ),
          ),
          h('p', { 'data-testid': 'infirmary-feedback', style: { color: CORDEL_PALETTE.verdeMata, fontWeight: 'bold', margin: '8px 0 0 0' } }, feedbackMessage.value),
        ]),
      ]);
  },
});

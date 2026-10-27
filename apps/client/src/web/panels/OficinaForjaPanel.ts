import { defineComponent, h, ref, computed, reactive, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export type EquipmentSlotId = 'crista' | 'caneleira_prata' | 'penacho' | 'amuleto_couro';
export interface OficinaSetInfo { id: string; name: string; bonus: string; xiloSymbol: string; }

export const OFICINA_8_CONJUNTOS: OficinaSetInfo[] = [
  { id: 'BrasaViva', name: 'Brasa Viva', bonus: '+45% dano crítico', xiloSymbol: '🔥' },
  { id: 'CouroDeGibao', name: 'Couro de Gibão', bonus: '-15% dano sofrido', xiloSymbol: '🥋' },
  { id: 'Mandacaru', name: 'Mandacaru', bonus: '12% Espinhos', xiloSymbol: '🌵' },
  { id: 'VentoDoArraial', name: 'Vento do Arraial', bonus: '+15% Velocidade', xiloSymbol: '🌪️' },
  { id: 'LuarDoSertao', name: 'Luar do Sertão', bonus: '+150 Canto inicial', xiloSymbol: '🌙' },
  { id: 'AguasDoVelhoChico', name: 'Águas do Velho Chico', bonus: '+20% cura', xiloSymbol: '💧' },
  { id: 'ArmorialReal', name: 'Armorial Real', bonus: '+12% Vigor/Defesa', xiloSymbol: '🛡️' },
  { id: 'CangacoDeAco', name: 'Cangaço de Aço', bonus: 'ignora 20% Defesa', xiloSymbol: '⚔️' },
];

export const EQUIPMENT_SLOTS_OFICIAL = [
  { id: 'crista' as const, name: 'Crista', icon: '👑', stat: 'Força', perLevel: 15 },
  { id: 'caneleira_prata' as const, name: 'Caneleira de Prata', icon: '⚡', stat: 'Velocidade', perLevel: 10 },
  { id: 'penacho' as const, name: 'Penacho', icon: '🪶', stat: 'Vigor', perLevel: 120 },
  { id: 'amuleto_couro' as const, name: 'Amuleto de Couro', icon: '📿', stat: 'Defesa', perLevel: 12 },
];

export function getRefineSuccessRate(lvl: number): number {
  return lvl <= 5 ? 1.0 : lvl <= 8 ? 0.75 : lvl <= 11 ? 0.50 : lvl <= 14 ? 0.30 : 0.15;
}

export interface RefineAttemptResult {
  slot: EquipmentSlotId; previousLevel: number; newLevel: number;
  success: boolean; protectedByFerradura: boolean; costMilho: number; costPenas: number;
}

export const OficinaForjaPanel = defineComponent({
  name: 'OficinaForjaPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    onRefined: { type: Function as PropType<(res: RefineAttemptResult) => void>, required: false },
    rollGenerator: { type: Function as PropType<() => number>, required: false },
  },
  setup(props) {
    const selectedSlot = ref<EquipmentSlotId>('crista');
    const selectedSet = ref<string>('BrasaViva');
    const ferraduraAtiva = ref<boolean>(false);
    const isStriking = ref<boolean>(false);
    const milhoBalance = ref<number>(50_000);
    const penasBalance = ref<number>(100);
    const statusMessage = ref<string>('Selecione uma peça e golpeie a bigorna para refinar (+1 a +15).');
    const slotLevels = reactive<Record<EquipmentSlotId, number>>({ crista: 4, caneleira_prata: 7, penacho: 3, amuleto_couro: 11 });

    const activePiece = computed(() => EQUIPMENT_SLOTS_OFICIAL.find((p) => p.id === selectedSlot.value)!);
    const currentLevel = computed(() => slotLevels[selectedSlot.value]);
    const targetLevel = computed(() => Math.min(15, currentLevel.value + 1));
    const nextSuccessRate = computed(() => getRefineSuccessRate(targetLevel.value));
    const costMilho = computed(() => targetLevel.value * 500);
    const costPenas = computed(() => Math.max(1, Math.floor(targetLevel.value / 3)));

    const handleGolpear = () => {
      if (currentLevel.value >= 15) {
        statusMessage.value = `A peça ${activePiece.value.name} já atingiu o nível Mestre +15!`;
        return;
      }
      if (milhoBalance.value < costMilho.value || penasBalance.value < costPenas.value) {
        statusMessage.value = `Recursos insuficientes! Requer ${costMilho.value} Milho e ${costPenas.value} Penas Douradas.`;
        return;
      }
      milhoBalance.value -= costMilho.value;
      penasBalance.value -= costPenas.value;
      cordelAudio.playBerimbauTwang();
      isStriking.value = true;
      setTimeout(() => { isStriking.value = false; }, 250);

      const roll = props.rollGenerator ? props.rollGenerator() : Math.random();
      const success = roll < nextSuccessRate.value;
      const prev = currentLevel.value;
      let next = prev;
      let wasProtected = false;

      if (success) {
        next = targetLevel.value;
        slotLevels[selectedSlot.value] = next;
        cordelAudio.playSanfonaVictory();
        statusMessage.value = `Sucesso na Bigorna! ${activePiece.value.name} evoluiu para +${next}!`;
      } else {
        cordelAudio.playApitoCortaCanto();
        if (ferraduraAtiva.value) {
          wasProtected = true;
          statusMessage.value = `Falha no golpe! A 🧲 Ferradura da Sorte protegeu seu nível (+${prev}).`;
        } else {
          next = Math.max(0, prev - 1);
          slotLevels[selectedSlot.value] = next;
          statusMessage.value = `Falha no refino! A peça regrediu para +${next}.`;
        }
      }
      if (props.runtime?.state) props.runtime.state.refineLevel = next;
      props.onRefined?.({ slot: selectedSlot.value, previousLevel: prev, newLevel: next, success, protectedByFerradura: wasProtected, costMilho: costMilho.value, costPenas: costPenas.value });
    };

    return () => h('div', {
      class: 'cordel-card', 'data-testid': 'oficina-forja-panel',
      style: {
        border: '3px solid #5C3A21', borderRadius: '8px', padding: '12px',
        backgroundImage: "linear-gradient(rgba(253, 248, 237, 0.90), rgba(253, 248, 237, 0.94)), url('/assets/pranchas/oficina-forja-backdrop.webp')",
        backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 8px #3E2723, 0 4px 8px rgba(0,0,0,0.15)',
      },
    }, [
      h('h3', 'Oficina Sertaneja — Bigorna de Refino +15 & Catálogo de Conjuntos'),
      h('div', { 'data-testid': 'oficina-sets-catalog', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', marginBottom: '12px' } },
        OFICINA_8_CONJUNTOS.map((s) => h('div', {
          key: s.id, 'data-testid': `set-card-${s.id}`,
          style: {
            border: selectedSet.value === s.id ? '2px solid #D7263D' : '1px solid #1B1B1B',
            backgroundColor: selectedSet.value === s.id ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
            padding: '4px 6px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
          },
          onClick: () => { selectedSet.value = s.id; },
        }, [h('div', { style: { fontWeight: 'bold' } }, `${s.xiloSymbol} ${s.name}`), h('div', { style: { color: CORDEL_PALETTE.terracota } }, s.bonus)])),
      ),
      h('div', {
        'data-testid': 'bigorna-sertaneja-area',
        style: { border: '2px dashed #5C3A21', borderRadius: '6px', padding: '10px', backgroundColor: '#FFFDF8', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.05)' },
      }, [
        h('h4', { style: { margin: '0 0 8px 0' } }, '⚒️ Bigorna Sertaneja de Refino (+0 a +15)'),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' } },
          EQUIPMENT_SLOTS_OFICIAL.map((slot) => h('button', {
            key: slot.id, type: 'button', 'data-testid': `slot-btn-${slot.id}`,
            style: { backgroundColor: selectedSlot.value === slot.id ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '6px 10px', fontWeight: 'bold', cursor: 'pointer' },
            onClick: () => { selectedSlot.value = slot.id; },
          }, `${slot.icon} ${slot.name} (+${slotLevels[slot.id]})`)),
        ),
        h('div', { 'data-testid': 'refine-stats-display', style: { marginBottom: '8px' } }, [
          h('span', { 'data-testid': 'refine-level-badge', style: { fontSize: '18px', fontWeight: 'bold', marginRight: '8px' } }, `Nível Atual: +${currentLevel.value}`),
          h('span', { 'data-testid': 'refine-stat-bonus', style: { color: CORDEL_PALETTE.verdeMata, fontWeight: 'bold' } }, `Bônus: +${currentLevel.value * activePiece.value.perLevel} ${activePiece.value.stat}`),
          currentLevel.value === 15 ? h('span', { 'data-testid': 'max-refine-badge', style: { marginLeft: '8px', color: '#D7263D', fontWeight: 'bold' } }, '⭐ NÍVEL MÁXIMO +15') : null,
        ]),
        h('div', { 'data-testid': 'refine-chances-table', style: { fontSize: '12px', backgroundColor: '#EFE6D5', padding: '6px', border: '1px solid #1B1B1B', marginBottom: '8px' } }, [
          h('div', { style: { fontWeight: 'bold' } }, 'Tabela Transparente de Refino:'),
          h('div', '+1 a +5: 100% (Garantido) | +6 a +8: 75% | +9 a +11: 50% | +12 a +14: 30% | +15: 15%'),
          h('div', { 'data-testid': 'current-chance-label', style: { marginTop: '4px', fontWeight: 'bold', color: CORDEL_PALETTE.azulAnil } },
            currentLevel.value < 15 ? `Chance para +${targetLevel.value}: ${(nextSuccessRate.value * 100).toFixed(0)}%` : 'Equipamento já no ápice!'),
        ]),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-toggle-ferradura',
            style: { backgroundColor: ferraduraAtiva.value ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, color: ferraduraAtiva.value ? '#FFFFFF' : CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B', padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer' },
            onClick: () => { ferraduraAtiva.value = !ferraduraAtiva.value; },
          }, ferraduraAtiva.value ? '🧲 Ferradura da Sorte: ATIVA' : '🧲 Ferradura da Sorte: INATIVA'),
          h('span', { 'data-testid': 'ferradura-status-text', style: { fontSize: '12px' } }, ferraduraAtiva.value ? 'Protegido contra perda de nível!' : 'Sem proteção (pode regredir se falhar).'),
        ]),
        h('div', { 'data-testid': 'forge-cost-info', style: { fontSize: '13px', marginBottom: '8px' } },
          `Custo: ${costMilho.value} Milho e ${costPenas.value} Penas Douradas | Saldo: ${milhoBalance.value.toLocaleString()} Milho / ${penasBalance.value} Penas`),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-golpear-bigorna', disabled: currentLevel.value >= 15,
            style: { backgroundColor: currentLevel.value >= 15 ? '#CCC' : CORDEL_PALETTE.amareloMilho, border: isStriking.value ? '3px solid #D7263D' : '2px solid #1B1B1B', padding: '8px 16px', fontWeight: 'bold', cursor: currentLevel.value >= 15 ? 'not-allowed' : 'pointer' },
            onClick: handleGolpear,
          }, 'GOLPEAR BIGORNA (+Refino) ⚒️'),
          isStriking.value ? h('span', { 'data-testid': 'bigorna-anim-fx', style: { fontWeight: 'bold', color: '#D7263D' } }, '💥 PAH! GOLPE NA BIGORNA!') : null,
        ]),
        h('p', { 'data-testid': 'forge-status-message', style: { marginTop: '8px', fontStyle: 'italic', color: CORDEL_PALETTE.terracota } }, statusMessage.value),
      ]),
    ]);
  },
});

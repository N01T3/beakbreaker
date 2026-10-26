import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE } from '../tokens/cordelTokens.js';

export type CordelEquipmentSetId =
  | 'BrasaViva'
  | 'CouroDeGibao'
  | 'Mandacaru'
  | 'VentoDoArraial'
  | 'LuarDoSertao'
  | 'AguasDoVelhoChico'
  | 'ArmorialReal'
  | 'CangacoDeAco';

export interface EquipmentSetVisualMeta {
  id: CordelEquipmentSetId;
  name: string;
  icon: string;
  effectSummary: string;
}

export const EQUIPMENT_SET_VISUALS: Record<CordelEquipmentSetId, EquipmentSetVisualMeta> = {
  BrasaViva: {
    id: 'BrasaViva',
    name: 'Brasa Viva',
    icon: 'icon-set-brasa-viva',
    effectSummary: 'Crítico 1,95x',
  },
  CouroDeGibao: {
    id: 'CouroDeGibao',
    name: 'Couro de Gibão',
    icon: 'icon-set-couro-gibao',
    effectSummary: '-15% Dano Crítico Sofrido',
  },
  Mandacaru: {
    id: 'Mandacaru',
    name: 'Mandacaru',
    icon: 'icon-set-mandacaru',
    effectSummary: '12% Espinhos',
  },
  VentoDoArraial: {
    id: 'VentoDoArraial',
    name: 'Vento do Arraial',
    icon: 'icon-set-vento-arraial',
    effectSummary: '+15% Velocidade',
  },
  LuarDoSertao: {
    id: 'LuarDoSertao',
    name: 'Luar do Sertão',
    icon: 'icon-set-luar-sertao',
    effectSummary: '+150 Canto Inicial',
  },
  AguasDoVelhoChico: {
    id: 'AguasDoVelhoChico',
    name: 'Águas do Velho Chico',
    icon: 'icon-set-velho-chico',
    effectSummary: '+20% Cura Recebida/Feita',
  },
  ArmorialReal: {
    id: 'ArmorialReal',
    name: 'Armorial Real',
    icon: 'icon-set-armorial-real',
    effectSummary: '+12% Vigor e Defesa',
  },
  CangacoDeAco: {
    id: 'CangacoDeAco',
    name: 'Cangaço de Aço',
    icon: 'icon-set-cangaco-aco',
    effectSummary: 'Ignora 20% da Defesa',
  },
};

export interface EquipmentSlotProps {
  slotIndex: 1 | 2 | 3 | 4;
  setId?: CordelEquipmentSetId;
  refineLevel?: number;
}

export interface EquipmentSlotModel {
  slotIndex: 1 | 2 | 3 | 4;
  isEmpty: boolean;
  setId?: CordelEquipmentSetId;
  setName: string;
  icon: string;
  refineLevel: number;
  refineLabel: string;
  isMaxRefined: boolean;
  borderColor: string;
  borderClass: string;
}

export function buildEquipmentSlot(props: EquipmentSlotProps): EquipmentSlotModel {
  const refineLevel = Math.min(15, Math.max(0, Math.floor(props.refineLevel ?? 0)));
  if (!props.setId) {
    return {
      slotIndex: props.slotIndex,
      isEmpty: true,
      setName: 'Vazio',
      icon: 'icon-slot-empty',
      refineLevel: 0,
      refineLabel: '+0',
      isMaxRefined: false,
      borderColor: CORDEL_PALETTE.tintaXilo,
      borderClass: CORDEL_BORDERS.xiloFrame,
    };
  }

  const meta = EQUIPMENT_SET_VISUALS[props.setId];
  const isMaxRefined = refineLevel === 15;

  return {
    slotIndex: props.slotIndex,
    isEmpty: false,
    setId: props.setId,
    setName: meta.name,
    icon: meta.icon,
    refineLevel,
    refineLabel: `+${refineLevel}`,
    isMaxRefined,
    borderColor: isMaxRefined ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.tintaXilo,
    borderClass: CORDEL_BORDERS.xiloFrame,
  };
}

export const EquipmentSlot = defineComponent({
  name: 'EquipmentSlot',
  props: {
    slotIndex: { type: Number as PropType<1 | 2 | 3 | 4>, required: true },
    setId: { type: String as PropType<CordelEquipmentSetId>, default: undefined },
    refineLevel: { type: Number, default: 0 },
  },
  emits: ['inspect'],
  setup(props, { emit }) {
    return () => {
      const model = buildEquipmentSlot(props);
      return h(
        'div',
        {
          class: `equipment-slot ${model.borderClass} ${model.isMaxRefined ? 'equipment-slot--max' : ''}`,
          style: { borderColor: model.borderColor },
          onClick: () => emit('inspect', model.slotIndex),
        },
        [
          h('span', { class: `equipment-slot__icon ${model.icon}` }, model.setName),
          !model.isEmpty
            ? h('strong', { class: 'equipment-slot__refine' }, model.refineLabel)
            : null,
        ],
      );
    };
  },
});

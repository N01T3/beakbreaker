import { defineComponent, h } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';
import { buildResourcePill, ResourcePill } from '../atoms/ResourcePill.js';

export interface WoodcutHeaderProps {
  playerName: string;
  breederLevel: number;
  sedeLevel: number;
  milho: number;
  penasDouradas: number;
  coroas: number;
  folego: number;
  maxFolego?: number;
  isMuted?: boolean;
  avatar?: string;
}

export interface WoodcutHeaderModel {
  playerName: string;
  avatar: string;
  levelNumber: number;
  breederBadge: string;
  sedeBadge: string;
  borderClass: string;
  backgroundColor: string;
  fontFamily: string;
  isMuted: boolean;
  audioIcon: string;
  audioLabel: string;
  resources: {
    milho: ReturnType<typeof buildResourcePill>;
    penasDouradas: ReturnType<typeof buildResourcePill>;
    coroas: ReturnType<typeof buildResourcePill>;
    folego: ReturnType<typeof buildResourcePill>;
  };
}

export function buildWoodcutHeader(props: WoodcutHeaderProps): WoodcutHeaderModel {
  const nc = Math.max(1, Math.min(60, Math.floor(props.breederLevel)));
  const sede = Math.max(1, Math.min(12, Math.floor(props.sedeLevel)));
  const isMuted = Boolean(props.isMuted);

  return {
    playerName: props.playerName,
    avatar: props.avatar ?? '🤠',
    levelNumber: nc,
    breederBadge: `NC ${nc}`,
    sedeBadge: `Sede ${sede}`,
    borderClass: CORDEL_BORDERS.xiloFrame,
    backgroundColor: CORDEL_PALETTE.tintaXilo,
    fontFamily: CORDEL_TYPOGRAPHY.woodcutSerif,
    isMuted,
    audioIcon: isMuted ? '🔇' : '🔊',
    audioLabel: isMuted ? 'Mudo' : 'Som Ativo',
    resources: {
      milho: buildResourcePill({ currency: 'milho', amount: props.milho }),
      penasDouradas: buildResourcePill({ currency: 'penasDouradas', amount: props.penasDouradas }),
      coroas: buildResourcePill({ currency: 'coroas', amount: props.coroas, showPlusButton: true }),
      folego: buildResourcePill({ currency: 'folego', amount: props.folego, cap: props.maxFolego ?? 120 }),
    },
  };
}

const badgeStyle = (bg: string) => ({
  backgroundColor: bg,
  color: CORDEL_PALETTE.cremePapel,
  padding: '2px 6px',
  border: '1px solid #1B1B1B',
  fontWeight: 'bold' as const,
  fontSize: '11px',
});

export const WoodcutHeader = defineComponent({
  name: 'WoodcutHeader',
  props: {
    playerName: { type: String, required: true },
    breederLevel: { type: Number, required: true },
    sedeLevel: { type: Number, required: true },
    milho: { type: Number, required: true },
    penasDouradas: { type: Number, required: true },
    coroas: { type: Number, required: true },
    folego: { type: Number, required: true },
    maxFolego: { type: Number, default: 120 },
    isMuted: { type: Boolean, default: false },
    avatar: { type: String, default: '🤠' },
  },
  emits: ['openStore', 'toggleAudio'],
  setup(props, { emit }) {
    return () => {
      const model = buildWoodcutHeader(props);
      const headerStyle = {
        backgroundColor: model.backgroundColor,
        color: CORDEL_PALETTE.cremePapel,
        boxShadow: CORDEL_BORDERS.xiloShadow,
        border: '3px solid #1B1B1B',
        padding: '8px 12px',
        display: 'flex',
        flexWrap: 'wrap' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
      };
      const audioBtnStyle = {
        backgroundColor: model.isMuted ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.amareloMilho,
        color: CORDEL_PALETTE.tintaXilo,
        border: '2px solid #1B1B1B',
        boxShadow: '2px 2px 0 #1B1B1B',
        padding: '3px 8px',
        fontWeight: 'bold' as const,
        fontFamily: CORDEL_TYPOGRAPHY.displayFont,
        fontSize: '12px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      };

      return h('header', { class: `woodcut-header ${model.borderClass}`, style: headerStyle }, [
        h('div', { class: 'woodcut-header__identity', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          h('span', { class: 'woodcut-header__avatar', 'data-testid': 'player-leather-hat-avatar', style: { fontSize: '20px', lineHeight: 1 } }, model.avatar),
          h('strong', { class: 'woodcut-header__name', style: { fontFamily: model.fontFamily, fontSize: '15px' } }, model.playerName),
          h('span', { class: 'woodcut-header__nc', 'data-testid': 'badge-hud-trainer-level', style: badgeStyle(CORDEL_PALETTE.terracota) }, `Nível ${model.levelNumber}`),
          h('span', { class: 'woodcut-header__sede', style: badgeStyle(CORDEL_PALETTE.verdeMata) }, model.sedeBadge),
          h('button', {
            type: 'button',
            'data-testid': 'button-audio-toggle',
            class: 'woodcut-header__audio-toggle button-audio-toggle',
            style: audioBtnStyle,
            onClick: () => emit('toggleAudio'),
          }, [h('span', { class: 'audio-icon' }, model.audioIcon), h('span', { class: 'audio-indicator' }, model.audioLabel)]),
        ]),
        h('div', { class: 'woodcut-header__resources', style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
          h(ResourcePill, { currency: 'milho', amount: props.milho }),
          h(ResourcePill, { currency: 'penasDouradas', amount: props.penasDouradas }),
          h(ResourcePill, { currency: 'coroas', amount: props.coroas, showPlusButton: true, onAdd: () => emit('openStore') }),
          h(ResourcePill, { currency: 'folego', amount: props.folego, cap: props.maxFolego }),
        ]),
      ]);
    };
  },
});

import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_PALETTE, type CordelElementType } from '@beakbreaker/ui-cordel';

export interface TacticalAthleteCard {
  slotIndex: 0 | 1 | 2;
  name: string;
  element: CordelElementType | 'Brasa' | 'Mata' | 'Correnteza';
  energyPercent: number;
  canto: number;
  maxCanto?: number;
  roosterClass?: string;
  portraitEmoji?: string;
}

const ELEMENT_THEMES: Record<string, { border: string; bg: string; text: string }> = {
  Brasa: { border: '#D7263D', bg: '#FFF1F2', text: '#D7263D' },
  Mata: { border: '#1D7846', bg: '#F0FDF4', text: '#1D7846' },
  Correnteza: { border: '#1E3A8A', bg: '#EFF6FF', text: '#1E3A8A' },
};

const DEFAULT_ATHLETES: TacticalAthleteCard[] = [
  { slotIndex: 0, name: 'Trovão', element: 'Brasa', energyPercent: 84, canto: 1000, maxCanto: 1000, roosterClass: 'Bruiser', portraitEmoji: '🐓' },
  { slotIndex: 1, name: 'Brisa', element: 'Correnteza', energyPercent: 31, canto: 650, maxCanto: 1000, roosterClass: 'Assassino', portraitEmoji: '🪶' },
  { slotIndex: 2, name: 'Pedra', element: 'Mata', energyPercent: 100, canto: 400, maxCanto: 1000, roosterClass: 'Tanque', portraitEmoji: '🛡️' },
];

export const ArenaTacticalCardsPanel = defineComponent({
  name: 'ArenaTacticalCardsPanel',
  props: {
    athletes: { type: Array as PropType<TacticalAthleteCard[]>, default: () => DEFAULT_ATHLETES },
    currentSpeed: { type: [Number, String] as PropType<number | string>, default: 1 },
    torcidaCount: { type: Number, default: 1 },
    onSpecialTap: { type: Function as PropType<(slot: number) => void> },
    onTorcida: { type: Function as PropType<() => void> },
    onSelectSpeed: { type: Function as PropType<(spd: number | string) => void> },
    onDesistir: { type: Function as PropType<() => void> },
  },
  setup(props) {
    const renderCard = (card: TacticalAthleteCard) => {
      const theme = ELEMENT_THEMES[card.element] ?? ELEMENT_THEMES.Brasa;
      const isSpecialReady = card.canto >= (card.maxCanto ?? 1000);
      const cantoPct = Math.min(100, Math.round((card.canto / (card.maxCanto ?? 1000)) * 100));

      return h('div', {
        key: card.slotIndex,
        'data-testid': `card-atleta-slot-${card.slotIndex}`,
        style: {
          flex: 1, minWidth: '100px', backgroundColor: theme.bg,
          border: `3px solid ${theme.border}`, borderRadius: '6px',
          padding: '6px', position: 'relative', display: 'flex',
          flexDirection: 'column', alignItems: 'center', boxShadow: '2px 2px 0 #1B1B1B',
        },
      }, [
        h('div', {
          'data-testid': 'athlete-portrait',
          style: {
            width: '42px', height: '42px', borderRadius: '50%', backgroundColor: CORDEL_PALETTE.cremePapel,
            border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', marginBottom: '4px',
          },
        }, card.portraitEmoji ?? '🐓'),
        h('strong', { style: { fontSize: '12px', color: CORDEL_PALETTE.tintaXilo } }, card.name),
        h('span', {
          style: { fontSize: '9px', fontWeight: 'bold', color: theme.text, textTransform: 'uppercase', marginBottom: '3px' },
        }, `${card.element} • ${card.roosterClass ?? 'Atleta'}`),
        h('div', { style: { width: '100%', fontSize: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' } }, [
          h('span', 'Energia:'),
          h('span', `${card.energyPercent}%`),
        ]),
        h('div', { style: { width: '100%', height: '5px', background: '#DDD', border: '1px solid #1B1B1B', borderRadius: '2px', overflow: 'hidden' } }, [
          h('div', { style: { width: `${card.energyPercent}%`, height: '100%', background: theme.border } }),
        ]),
        h('div', { style: { width: '100%', height: '4px', marginTop: '2px', background: '#DDD', border: '1px solid #1B1B1B', borderRadius: '2px', overflow: 'hidden' } }, [
          h('div', { style: { width: `${cantoPct}%`, height: '100%', background: isSpecialReady ? CORDEL_PALETTE.amareloMilho : '#1E3A8A' } }),
        ]),
        isSpecialReady
          ? h('button', {
              type: 'button', 'data-testid': 'btn-toque-especial',
              onClick: () => props.onSpecialTap?.(card.slotIndex),
              style: {
                marginTop: '5px', width: '100%', backgroundColor: CORDEL_PALETTE.amareloMilho,
                color: CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B', borderRadius: '4px',
                padding: '4px 2px', fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                boxShadow: '0 0 10px #F4B400, 0 0 4px #D7263D',
              },
            }, '⚡ TOQUE!')
          : h('span', { style: { marginTop: '5px', fontSize: '10px', color: '#666', fontStyle: 'italic' } }, `Canto ${cantoPct}%`),
      ]);
    };

    const renderSpeedBtn = (key: string, val: number | string, label: string) => {
      const active = String(props.currentSpeed) === String(val);
      return h('button', {
        key, type: 'button', 'data-testid': `btn-speed-${key}`,
        onClick: () => props.onSelectSpeed?.(val),
        style: {
          width: '26px', height: '26px', borderRadius: '50%',
          backgroundColor: active ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
          color: CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B', fontWeight: 'bold',
          cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
      }, label);
    };

    return () =>
      h('div', {
        'data-testid': 'arena-tactical-cards-panel',
        style: {
          border: '3px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel,
          padding: '8px', borderRadius: '4px', marginTop: '10px',
        },
      }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } }, [
          h('h4', { style: { margin: 0, fontSize: '13px', color: CORDEL_PALETTE.tintaXilo, fontWeight: 'bold' } }, 'Cartas Táticas de Ação (Trio de Atletas)'),
          h('button', {
            type: 'button', 'data-testid': 'btn-torcida-cheer', onClick: () => props.onTorcida?.(),
            style: {
              backgroundColor: '#8B4513', color: '#F5E9D3', border: '2px solid #1B1B1B',
              boxShadow: 'inset 0 0 3px #000, 2px 2px 0 #1B1B1B', padding: '3px 8px',
              fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', borderRadius: '4px',
            },
          }, `📢 Torcida [${props.torcidaCount}]`),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'space-around' } },
          props.athletes.slice(0, 3).map((a) => renderCard(a)),
        ),
        h('div', {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #1B1B1B' },
        }, [
          h('button', {
            type: 'button', 'data-testid': 'link-desistir-fazenda', onClick: () => props.onDesistir?.(),
            style: { background: 'none', border: 'none', color: '#C0652E', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
          }, 'Desistir e voltar à fazenda'),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
            h('span', { style: { fontSize: '11px', fontWeight: 'bold' } }, 'Velocidade:'),
            h('div', { 'data-testid': 'speed-selector-group', style: { display: 'flex', gap: '3px' } }, [
              renderSpeedBtn('x1', 1, 'x1'), renderSpeedBtn('x2', 2, 'x2'), renderSpeedBtn('x3', 3, 'x3'),
              renderSpeedBtn('x0', 0, 'x0'), renderSpeedBtn('pause', 'pause', '⏸'),
            ]),
          ]),
        ]),
      ]);
  },
});

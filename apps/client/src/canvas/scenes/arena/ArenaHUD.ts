import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';

export interface HudUnitBar {
  name: string;
  vigor: number;
  maxVigor: number;
  canto: number;
  maxCanto?: number;
}

export const ArenaHUD = defineComponent({
  name: 'ArenaHUD',
  props: {
    timerSeconds: { type: Number, default: 47 },
    playerTeamName: { type: String, default: 'VOCÊ' },
    enemyTeamName: { type: String, default: 'BANDO DO SERTÃO' },
    playerUnits: {
      type: Array as PropType<HudUnitBar[]>,
      default: () => [
        { name: 'Trovão', vigor: 840, maxVigor: 1000, canto: 1000 },
        { name: 'Brisa', vigor: 310, maxVigor: 1000, canto: 650 },
        { name: 'Pedra', vigor: 920, maxVigor: 1000, canto: 400 },
      ],
    },
    enemyUnits: {
      type: Array as PropType<HudUnitBar[]>,
      default: () => [
        { name: 'Carcará', vigor: 750, maxVigor: 1000, canto: 500 },
        { name: 'Sereno', vigor: 620, maxVigor: 1000, canto: 300 },
        { name: 'Mandacaru', vigor: 880, maxVigor: 1000, canto: 700 },
      ],
    },
    currentSpeed: { type: [Number, String] as PropType<number | string>, default: 1 },
    torcidaCount: { type: Number, default: 1 },
    onTorcida: { type: Function as PropType<() => void> },
    onSelectSpeed: { type: Function as PropType<(spd: number | string) => void> },
    onDesistir: { type: Function as PropType<() => void> },
  },
  setup(props) {
    const formatTimer = (sec: number) => {
      const s = Math.max(0, Math.floor(sec));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    const renderDualBars = (units: HudUnitBar[], vColor: string, cColor: string, isRight = false) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
        units.map((u, idx) => {
          const vP = Math.min(100, Math.round((u.vigor / Math.max(1, u.maxVigor)) * 100));
          const cP = Math.min(100, Math.round((u.canto / Math.max(1, u.maxCanto ?? 1000)) * 100));
          return h('div', { key: `${u.name}-${idx}`, style: { textAlign: isRight ? 'right' : 'left' } }, [
            h('span', { style: { fontSize: '10px', fontWeight: 'bold' } }, u.name),
            h('div', { style: { height: '6px', background: '#222', border: '1px solid #1B1B1B', borderRadius: '2px', overflow: 'hidden' } }, [
              h('div', { style: { width: `${vP}%`, height: '100%', background: vColor } }),
            ]),
            h('div', { style: { height: '4px', marginTop: '1px', background: '#222', border: '1px solid #1B1B1B', borderRadius: '2px', overflow: 'hidden' } }, [
              h('div', { style: { width: `${cP}%`, height: '100%', background: cColor } }),
            ]),
          ]);
        }),
      );

    const renderSpeedBtn = (key: string, val: number | string, label: string) => {
      const active = String(props.currentSpeed) === String(val);
      return h('button', {
        key, type: 'button', 'data-testid': `btn-speed-${key}`,
        onClick: () => props.onSelectSpeed?.(val),
        style: {
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: active ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
          color: CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B', fontWeight: 'bold',
          cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
      }, label);
    };

    return () =>
      h('div', { 'data-testid': 'arena-hud', style: { border: '3px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, padding: '8px' } }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } }, [
          h('div', { 'data-testid': 'hud-player-team', style: { flex: 1 } }, [
            h('h4', { style: { margin: '0 0 2px 0', color: '#1D7846', fontWeight: 'bold' } }, props.playerTeamName),
            renderDualBars(props.playerUnits, '#1D7846', '#1E3A8A'),
          ]),
          h('div', {
            'data-testid': 'medallion-timer',
            style: {
              width: '62px', height: '62px', borderRadius: '50%', backgroundColor: '#5C3A21',
              border: '3px solid #1B1B1B', boxShadow: 'inset 0 0 8px #1B1B1B', color: '#F5E9D3',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            },
          }, [
            h('span', { style: { fontSize: '9px', letterSpacing: '0.5px' } }, 'TEMPO'),
            h('strong', { 'data-testid': 'cronometro-circular', style: { fontSize: '15px', fontFamily: 'Lilita One, sans-serif' } }, formatTimer(props.timerSeconds)),
          ]),
          h('div', { 'data-testid': 'hud-enemy-team', style: { flex: 1, textAlign: 'right' } }, [
            h('h4', { style: { margin: '0 0 2px 0', color: '#D7263D', fontWeight: 'bold' } }, props.enemyTeamName),
            renderDualBars(props.enemyUnits, '#D7263D', '#F4B400', true),
          ]),
        ]),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #1B1B1B' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-torcida-cheer', onClick: () => props.onTorcida?.(),
            style: {
              backgroundColor: '#8B4513', color: '#F5E9D3', border: '2px solid #1B1B1B',
              boxShadow: 'inset 0 0 4px #000, 2px 2px 0 #1B1B1B', padding: '4px 10px',
              fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', borderRadius: '4px',
            },
          }, `📢 Torcida [${props.torcidaCount}]`),
          h('div', { 'data-testid': 'speed-selector-group', style: { display: 'flex', gap: '4px', alignItems: 'center' } }, [
            renderSpeedBtn('x1', 1, 'x1'), renderSpeedBtn('x2', 2, 'x2'), renderSpeedBtn('x3', 3, 'x3'),
            renderSpeedBtn('x0', 0, 'x0'), renderSpeedBtn('pause', 'pause', '⏸'),
          ]),
        ]),
        h('div', { style: { textAlign: 'center', marginTop: '4px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'link-desistir-fazenda', onClick: () => props.onDesistir?.(),
            style: { background: 'none', border: 'none', color: '#C0652E', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
          }, 'Desistir e voltar à fazenda'),
        ]),
      ]);
  },
});

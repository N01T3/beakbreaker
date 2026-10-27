import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
});

const REPLAY_EVENTS = [
  { tick: 18, tag: 'CRÍTICO', desc: 'Tick 18: Golpe Crítico! Lampião causou 940 de dano com Bico Flamejante.' },
  { tick: 45, tag: 'CORTA-CANTO', desc: 'Tick 45: Corta-Canto! Interrupção tática impediu Canto adversário.' },
  { tick: 88, tag: 'FINALIZAÇÃO', desc: 'Tick 88: Finalização Épica! Vitória do Time Lampião no Duelo do Supremo.' },
];

export const TVSertaoReplayPanel = defineComponent({
  name: 'TVSertaoReplayPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    initialMode: { type: String as PropType<'aovivo' | 'replay'>, default: 'aovivo' },
  },
  setup(props, { expose }) {
    const activeMode = ref<'aovivo' | 'replay'>(props.initialMode ?? 'aovivo');
    const bolaoSeconds = ref(300);
    const selectedWinner = ref<'azul' | 'vermelho' | null>(null);
    const palpiteStatus = ref('');
    const emoteFeedback = ref('Reaja ao vivo com os emotes de cordel!');
    const currentTick = ref(45);
    const isPlaying = ref(false);
    const playbackSpeed = ref<0.5 | 1 | 2 | 4>(1);
    const shareCode = '#sertao-replay-lampiao-v5';
    const copyFeedback = ref('');

    const formattedTimer = computed(() => {
      const m = String(Math.floor(bolaoSeconds.value / 60)).padStart(2, '0');
      const s = String(bolaoSeconds.value % 60).padStart(2, '0');
      return `${m}:${s}`;
    });

    const selectMode = (m: 'aovivo' | 'replay') => { activeMode.value = m; cordelAudio.playZabumbaTabSwitch(); };

    const handleConfirmPalpite = () => {
      if (!selectedWinner.value) { palpiteStatus.value = 'Selecione Time Azul ou Vermelho para dar seu palpite!'; return; }
      const tn = selectedWinner.value === 'azul' ? 'Time Azul' : 'Time Vermelho';
      palpiteStatus.value = `Palpite de 500 Milho registrado no ${tn}! Recompensa: 1.000 Milho (2x).`;
      cordelAudio.playTrianguloReward();
    };

    const triggerEmote = (label: string, playSound: () => void, feedback: string) => { playSound(); emoteFeedback.value = feedback; };

    const handleCopy = () => {
      copyFeedback.value = `Código ${shareCode} copiado com sucesso!`;
      cordelAudio.playTrianguloReward();
      try { navigator?.clipboard?.writeText(shareCode); } catch {}
    };

    expose?.({
      activeMode, bolaoSeconds, selectedWinner, palpiteStatus, emoteFeedback, currentTick, isPlaying,
      playbackSpeed, shareCode, copyFeedback, formattedTimer, selectMode, handleConfirmPalpite, triggerEmote, handleCopy,
    });

    const emotes = [
      { id: 'zabumba', fn: () => cordelAudio.playZabumbaTabSwitch(), fb: '🥁 Zabumba ecoou pelo arraial!', label: '🥁 Zabumba' },
      { id: 'apito', fn: () => cordelAudio.playApitoCortaCanto(), fb: '🎺 Apito de Corta-Canto soou alto!', label: '🎺 Apito' },
      { id: 'torcida', fn: () => cordelAudio.playTorcidaCheer(), fb: '📢 Torcida animada cantando em coro!', label: '📢 Torcida' },
      { id: 'chapeu', fn: () => cordelAudio.playGaloCantoSupreme(), fb: '🤠 Chapéu de couro balançando no sertão!', label: '🤠 Chapéu de Couro' },
      { id: 'espiga', fn: () => cordelAudio.playHarvestMilho(), fb: '🌽 Chuva de espigas de milho dourado!', label: '🌽 Espiga' },
    ];

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'tv-sertao-replay-panel', style: { marginTop: '10px' } }, [
        h('div', {
          'data-testid': 'tv-sertao-backdrop-banner',
          style: {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url('/assets/pranchas/tv-sertao-backdrop.webp')`,
            backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '6px',
            border: '2px solid #1B1B1B', padding: '10px', color: '#F5E9D3', marginBottom: '8px', textAlign: 'center',
          },
        }, [
          h('img', { src: '/assets/pranchas/tv-sertao-backdrop.webp', alt: 'TV Sertão Backdrop', 'data-testid': 'tv-sertao-backdrop', style: { display: 'none' } }),
          h('h4', { style: { color: CORDEL_PALETTE.amareloMilho, margin: '0 0 2px 0', textShadow: '2px 2px 0 #000' } }, 'TV Sertão & Player Interativo de Replay (Prancha 19)'),
          h('p', { style: { margin: 0, fontSize: '11px', textShadow: '1px 1px 2px #000' } }, 'Transmissões em Alta Definição • Bolão Comunitário de 500 Milho • Linha do Tempo Scrubber'),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', marginBottom: '10px' } }, [
          h('button', { type: 'button', 'data-testid': 'btn-mode-aovivo', style: btnStyle(activeMode.value === 'aovivo' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel), onClick: () => selectMode('aovivo') }, '📺 Transmissão Ao Vivo (Supremo Sertão)'),
          h('button', { type: 'button', 'data-testid': 'btn-mode-replay', style: btnStyle(activeMode.value === 'replay' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel), onClick: () => selectMode('replay') }, '📼 Replay Interativo de Combate'),
        ]),
        activeMode.value === 'aovivo' ? h('div', { 'data-testid': 'tv-sertao-aovivo-section' }, [
          h('div', { class: 'cordel-card', 'data-testid': 'top-ranking-broadcast', style: { backgroundColor: CORDEL_PALETTE.cremePapel } }, [
            h('strong', { style: { display: 'block', fontSize: '13px' } }, '🔴 AO VIVO: Duelo do Topo Nacional — Liga Supremo Sertão'),
            h('p', { style: { margin: '4px 0' } }, 'Time Lampião (PB - 4.250 Troféus) vs Bando da Caatinga (PE - 4.190 Troféus)'),
            h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel } }, 'Melhor de 3 • Placar: 2 x 1 (Rodada Decisiva)'),
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'bolao-comunitario-card', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.tintaXilo } }, '🌽 Bolão do Sertão (Palpite Comunitário a cada 5 min)'),
            h('div', { 'data-testid': 'bolao-timer', style: { fontWeight: 'bold', marginBottom: '6px' } }, `Cronômetro do Bolão: ${formattedTimer.value}`),
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [
              h('button', { type: 'button', 'data-testid': 'btn-select-time-azul', style: btnStyle(selectedWinner.value === 'azul' ? CORDEL_PALETTE.azulAnil : CORDEL_PALETTE.cremePapel, selectedWinner.value === 'azul' ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo), onClick: () => { selectedWinner.value = 'azul'; cordelAudio.playZabumbaTabSwitch(); } }, 'Time Azul (Lampião)'),
              h('button', { type: 'button', 'data-testid': 'btn-select-time-vermelho', style: btnStyle(selectedWinner.value === 'vermelho' ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.cremePapel, selectedWinner.value === 'vermelho' ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo), onClick: () => { selectedWinner.value = 'vermelho'; cordelAudio.playZabumbaTabSwitch(); } }, 'Time Vermelho (Caatinga)'),
              h('button', { type: 'button', 'data-testid': 'btn-confirmar-palpite', style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: handleConfirmPalpite }, 'Confirmar Palpite de 500 Milho (2x Recompensa)'),
            ]),
            palpiteStatus.value ? h('p', { 'data-testid': 'palpite-feedback', style: { margin: '6px 0 0 0', fontWeight: 'bold' } }, palpiteStatus.value) : null,
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'emotes-bar', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Barra de Emotes de Cordel:'),
            h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
              emotes.map((e) => h('button', { key: e.id, type: 'button', 'data-testid': `btn-emote-${e.id}`, style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote(e.id, e.fn, e.fb) }, e.label)),
            ),
            h('p', { 'data-testid': 'emote-feedback-display', style: { margin: '6px 0 0 0', fontStyle: 'italic', fontSize: '13px' } }, emoteFeedback.value),
          ]),
        ]) : h('div', { 'data-testid': 'tv-sertao-replay-section' }, [
          h('div', { class: 'cordel-card', 'data-testid': 'replay-timeline-card' }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Linha do Tempo Deslizante do Replay:'),
            h('div', { 'data-testid': 'replay-elapsed-time', style: { fontWeight: 'bold', marginBottom: '4px' } }, `Tempo Decorrido: ${(currentTick.value / 20).toFixed(1)}s / 5.0s (${currentTick.value}/100 ticks)`),
            h('input', { type: 'range', min: 0, max: 100, value: currentTick.value, 'data-testid': 'replay-timeline-slider', style: { width: '100%', cursor: 'pointer' }, onInput: (e: Event) => { currentTick.value = Number((e.target as HTMLInputElement).value); } }),
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' } }, [
              h('button', { type: 'button', 'data-testid': 'btn-replay-play-pause', style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: () => { isPlaying.value = !isPlaying.value; cordelAudio.playZabumbaTabSwitch(); } }, isPlaying.value ? '⏸️ Pausar' : '▶️ Reproduzir'),
              h('button', { type: 'button', 'data-testid': 'btn-replay-rewind', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => { currentTick.value = Math.max(0, currentTick.value - 20); } }, '⏪ -5s'),
              h('button', { type: 'button', 'data-testid': 'btn-replay-forward', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => { currentTick.value = Math.min(100, currentTick.value + 20); } }, '⏩ +5s'),
              ([0.5, 1, 2, 4] as const).map((spd) => h('button', { key: spd, type: 'button', 'data-testid': `btn-replay-speed-${spd}x`, style: btnStyle(playbackSpeed.value === spd ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel), onClick: () => { playbackSpeed.value = spd; cordelAudio.playZabumbaTabSwitch(); } }, `${spd}x`)),
            ]),
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'replay-events-log', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Log de Eventos do Duelo:'),
            h('ul', { style: { margin: '0', paddingLeft: '20px' } },
              REPLAY_EVENTS.map((ev) => h('li', { key: ev.tick, 'data-testid': 'replay-event-item', style: { margin: '3px 0', fontWeight: currentTick.value >= ev.tick ? 'bold' : 'normal', color: ev.tag === 'CRÍTICO' ? CORDEL_PALETTE.vermelhoCrista : ev.tag === 'CORTA-CANTO' ? CORDEL_PALETTE.azulAnil : CORDEL_PALETTE.verdeMata } }, ev.desc)),
            ),
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'replay-share-card', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 4px 0' } }, 'Compartilhar Duelo do Sertão:'),
            h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
              h('code', { 'data-testid': 'replay-share-code', style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel, fontWeight: 'bold' } }, shareCode),
              h('button', { type: 'button', 'data-testid': 'btn-copy-replay-code', style: btnStyle(CORDEL_PALETTE.amareloMilho), onClick: handleCopy }, 'Copiar Código'),
            ]),
            copyFeedback.value ? h('p', { 'data-testid': 'copy-code-feedback', style: { margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' } }, copyFeedback.value) : null,
          ]),
        ]),
      ]);
  },
});

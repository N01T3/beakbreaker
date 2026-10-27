import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B',
  padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
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

    const selectMode = (m: 'aovivo' | 'replay') => {
      activeMode.value = m;
      cordelAudio.playZabumbaTabSwitch();
    };

    const handleConfirmPalpite = () => {
      if (!selectedWinner.value) {
        palpiteStatus.value = 'Selecione Time Azul ou Vermelho para dar seu palpite!';
        return;
      }
      const timeNome = selectedWinner.value === 'azul' ? 'Time Azul' : 'Time Vermelho';
      palpiteStatus.value = `Palpite de 500 Milho registrado no ${timeNome}! Recompensa: 1.000 Milho (2x).`;
      cordelAudio.playTrianguloReward();
    };

    const triggerEmote = (label: string, playSound: () => void, feedback: string) => {
      playSound();
      emoteFeedback.value = feedback;
    };

    const handleCopy = () => {
      copyFeedback.value = `Código ${shareCode} copiado com sucesso!`;
      cordelAudio.playTrianguloReward();
      try { navigator?.clipboard?.writeText(shareCode); } catch {}
    };

    expose?.({
      activeMode, bolaoSeconds, selectedWinner, palpiteStatus, emoteFeedback,
      currentTick, isPlaying, playbackSpeed, shareCode, copyFeedback, formattedTimer,
      selectMode, handleConfirmPalpite, triggerEmote, handleCopy,
    });

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'tv-sertao-replay-panel', style: { marginTop: '10px' } }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'TV Sertão & Player Interativo de Replay (Prancha 19)'),
        h('div', { style: { display: 'flex', gap: '8px', marginBottom: '10px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-mode-aovivo',
            style: btnStyle(activeMode.value === 'aovivo' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
            onClick: () => selectMode('aovivo'),
          }, '📺 Transmissão Ao Vivo (Supremo Sertão)'),
          h('button', {
            type: 'button', 'data-testid': 'btn-mode-replay',
            style: btnStyle(activeMode.value === 'replay' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
            onClick: () => selectMode('replay'),
          }, '📼 Replay Interativo de Combate'),
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
              h('button', {
                type: 'button', 'data-testid': 'btn-select-time-azul',
                style: btnStyle(selectedWinner.value === 'azul' ? CORDEL_PALETTE.azulAnil : CORDEL_PALETTE.cremePapel, selectedWinner.value === 'azul' ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo),
                onClick: () => { selectedWinner.value = 'azul'; cordelAudio.playZabumbaTabSwitch(); },
              }, 'Time Azul (Lampião)'),
              h('button', {
                type: 'button', 'data-testid': 'btn-select-time-vermelho',
                style: btnStyle(selectedWinner.value === 'vermelho' ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.cremePapel, selectedWinner.value === 'vermelho' ? CORDEL_PALETTE.cremePapel : CORDEL_PALETTE.tintaXilo),
                onClick: () => { selectedWinner.value = 'vermelho'; cordelAudio.playZabumbaTabSwitch(); },
              }, 'Time Vermelho (Caatinga)'),
              h('button', {
                type: 'button', 'data-testid': 'btn-confirmar-palpite',
                style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel),
                onClick: handleConfirmPalpite,
              }, 'Confirmar Palpite de 500 Milho (2x Recompensa)'),
            ]),
            palpiteStatus.value ? h('p', { 'data-testid': 'palpite-feedback', style: { margin: '6px 0 0 0', fontWeight: 'bold' } }, palpiteStatus.value) : null,
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'emotes-bar', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Barra de Emotes de Cordel:'),
            h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, [
              h('button', { type: 'button', 'data-testid': 'btn-emote-zabumba', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote('zabumba', () => cordelAudio.playZabumbaTabSwitch(), '🥁 Zabumba ecoou pelo arraial!') }, '🥁 Zabumba'),
              h('button', { type: 'button', 'data-testid': 'btn-emote-apito', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote('apito', () => cordelAudio.playApitoCortaCanto(), '🎺 Apito de Corta-Canto soou alto!') }, '🎺 Apito'),
              h('button', { type: 'button', 'data-testid': 'btn-emote-torcida', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote('torcida', () => cordelAudio.playTorcidaCheer(), '📢 Torcida animada cantando em coro!') }, '📢 Torcida'),
              h('button', { type: 'button', 'data-testid': 'btn-emote-chapeu', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote('chapeu', () => cordelAudio.playGaloCantoSupreme(), '🤠 Chapéu de couro balançando no sertão!') }, '🤠 Chapéu de Couro'),
              h('button', { type: 'button', 'data-testid': 'btn-emote-espiga', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => triggerEmote('espiga', () => cordelAudio.playHarvestMilho(), '🌽 Chuva de espigas de milho dourado!') }, '🌽 Espiga'),
            ]),
            h('p', { 'data-testid': 'emote-feedback-display', style: { margin: '6px 0 0 0', fontStyle: 'italic', fontSize: '13px' } }, emoteFeedback.value),
          ]),
        ]) : h('div', { 'data-testid': 'tv-sertao-replay-section' }, [
          h('div', { class: 'cordel-card', 'data-testid': 'replay-timeline-card' }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Linha do Tempo Deslizante do Replay:'),
            h('div', { 'data-testid': 'replay-elapsed-time', style: { fontWeight: 'bold', marginBottom: '4px' } }, `Tempo Decorrido: ${(currentTick.value / 20).toFixed(1)}s / 5.0s (${currentTick.value}/100 ticks)`),
            h('input', {
              type: 'range', min: 0, max: 100, value: currentTick.value, 'data-testid': 'replay-timeline-slider',
              style: { width: '100%', cursor: 'pointer' },
              onInput: (e: Event) => { currentTick.value = Number((e.target as HTMLInputElement).value); },
            }),
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' } }, [
              h('button', { type: 'button', 'data-testid': 'btn-replay-play-pause', style: btnStyle(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel), onClick: () => { isPlaying.value = !isPlaying.value; cordelAudio.playZabumbaTabSwitch(); } }, isPlaying.value ? '⏸️ Pausar' : '▶️ Reproduzir'),
              h('button', { type: 'button', 'data-testid': 'btn-replay-rewind', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => { currentTick.value = Math.max(0, currentTick.value - 20); } }, '⏪ -5s'),
              h('button', { type: 'button', 'data-testid': 'btn-replay-forward', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: () => { currentTick.value = Math.min(100, currentTick.value + 20); } }, '⏩ +5s'),
              ([0.5, 1, 2, 4] as const).map((spd) =>
                h('button', {
                  key: spd, type: 'button', 'data-testid': `btn-replay-speed-${spd}x`,
                  style: btnStyle(playbackSpeed.value === spd ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
                  onClick: () => { playbackSpeed.value = spd; cordelAudio.playZabumbaTabSwitch(); },
                }, `${spd}x`),
              ),
            ]),
          ]),
          h('div', { class: 'cordel-card', 'data-testid': 'replay-events-log', style: { marginTop: '8px' } }, [
            h('h5', { style: { margin: '0 0 6px 0' } }, 'Log de Eventos do Duelo:'),
            h('ul', { style: { margin: '0', paddingLeft: '20px' } },
              REPLAY_EVENTS.map((ev) =>
                h('li', {
                  key: ev.tick, 'data-testid': 'replay-event-item',
                  style: {
                    margin: '3px 0',
                    fontWeight: currentTick.value >= ev.tick ? 'bold' : 'normal',
                    color: ev.tag === 'CRÍTICO' ? CORDEL_PALETTE.vermelhoCrista : ev.tag === 'CORTA-CANTO' ? CORDEL_PALETTE.azulAnil : CORDEL_PALETTE.verdeMata,
                  },
                }, ev.desc),
              ),
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

import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface StoryChapter {
  id: number; region: string; title: string;
  speaker: { name: string; avatar: string; role: string };
  verses: string[];
  choices: { text: string; bonus: string; reaction: string }[];
  reward: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1, region: 'Cariri', title: 'Vô Tonho e o Legado',
    speaker: { name: 'Vô Tonho', avatar: '👴🤠', role: 'Mentor do Sertão' },
    verses: ['No Cariri sagrado onde o barro vira arte,\nCriei o galo altivo com vigor e coração.\nNão há máquina fria que dobre essa linhagem,\nO fôlego de ouro vence toda provação.',
      'Menino, guarde bem as lições do terreiro,\nO juiz rural apita, o torneio vai começar,\nTradição de família que corre pelas veias,\nCom respeito e brio nos pódios a cantar!'],
    choices: [{ text: 'Honrar a Tradição', bonus: '+300 Milho', reaction: 'Vô Tonho sorri: "O chão dos avós é a raiz da vitória!"' }, { text: 'Desafiar com Fôlego', bonus: '+1 Fôlego', reaction: 'Vô Tonho acena: "Coragem sertaneja não teme calor!"' }],
    reward: '+500 Milho, +1 Fôlego',
  },
  {
    id: 2, region: 'Caruaru', title: 'Zabumba Gigante',
    speaker: { name: 'Cantador', avatar: '📜', role: 'Poeta Repentista' },
    verses: ['Na feira de Caruaru bate forte o zabumbeiro,\nO galo marca o ritmo no toque do baião.\nO juiz rural vigia o fôlego da disputa,\nQuem tem ginga e arte conquista o sertão.',
      'Traga seu campeão com plumagem afinada,\nNo compasso do triângulo o canto vai brilhar,\nSeja mestre do compasso ou veloz no ataque,\nA arquibancada inteira vai aplaudir e festejar!'],
    choices: [{ text: 'Tocar o Zabumba', bonus: '+300 Milho', reaction: 'Cantador rima: "O compasso do galo é poesia e paixão!"' }, { text: 'Acelerar o Ritmo', bonus: '+1 Fôlego', reaction: 'Cantador festeja: "A ligeireza no terreiro ninguém vai parar!"' }],
    reward: '+500 Milho, +1 Fôlego',
  },
  {
    id: 3, region: 'Velho Chico', title: 'Barqueira do Rio',
    speaker: { name: 'Cantador', avatar: '📜', role: 'Poeta Repentista' },
    verses: ['As águas do São Francisco refletem a alvorada,\nA barca corta o leito com força e precisão.\nO galo de ribeira tem asas de esperança,\nE bebe da coragem em cada embarcação.',
      'Na margem do torneio o público se agrupa,\nO sol estala o couro, mas sobra devoção,\nMostre a calma do remador diante da correnteza,\nQue a glória das águas coroa o campeão!'],
    choices: [{ text: 'Seguir a Correnteza', bonus: '+300 Milho', reaction: 'Cantador entoa: "As águas mansas levam ao triunfo certo!"' }, { text: 'Remar contra a Maré', bonus: '+1 Fôlego', reaction: 'Cantador celebra: "Força brava que domina o ribeirão!"' }],
    reward: '+500 Milho, +1 Fôlego',
  },
  {
    id: 4, region: 'Serra da Capivara', title: 'Caipora Ancestral',
    speaker: { name: 'Galo Campeão', avatar: '🐓', role: 'Sentinela da Caatinga' },
    verses: ['Nas pedras milenares da serra encantada,\nPinturas do passado sussurram ao luar.\nO galo sentinela não teme sombra ou vento,\nSeu canto ecoa longe pra terra despertar.',
      'Aqui a natureza testou a resistência,\nFôlego ancestral guardado em segredo,\nErga o bico com brio, respeite a grande mata,\nE mostre no torneio que não conhece medo!'],
    choices: [{ text: 'Invocar Ancestralidade', bonus: '+300 Milho', reaction: 'O Galo Campeão solta um canto potente!' }, { text: 'Afinar o Fôlego', bonus: '+1 Fôlego', reaction: 'Penas eriçam com vigor místico do sertão!' }],
    reward: '+500 Milho, +1 Fôlego',
  },
  {
    id: 5, region: 'Mar de Jangadas', title: 'Jangadeiro do Vento',
    speaker: { name: 'Cantador', avatar: '📜', role: 'Poeta Repentista' },
    verses: ['O sal da brisa forte acaricia as dunas,\nA vela de algodão enfrenta o alto-mar.\nO galo do litoral traz asas de gaivota,\nNo torneio das praias pronto a triunfar.',
      'O juiz rural levanta a bandeira da disputa,\nA torcida entoa um canto de louvor,\nO vento que sopra a vela conduz a trajetória,\nDe quem honra o esporte com lealdade e amor!'],
    choices: [{ text: 'Içar as Velas', bonus: '+300 Milho', reaction: 'O mar se abre em festa ao sopro da vitória!' }, { text: 'Aprender com a Brisa', bonus: '+1 Fôlego', reaction: 'Fôlego renovado pela maresia arretada!' }],
    reward: '+500 Milho, +1 Fôlego',
  },
  {
    id: 6, region: 'Raso da Catarina', title: 'Galo de Ferro do Coronel Ferrabrás',
    speaker: { name: 'Coronel Ferrabrás', avatar: '🎩', role: 'Monopolista das Máquinas' },
    verses: ['Chegou ao fim da linha, roceiro deslumbrado!\nMinha engrenagem ferve, meu autômato é perfeito!\nSem alma e sem cansaço meu galo mecanizado,\nVai esmagar o sonho que guarda no seu peito!',
      'Pois saiba, Coronel, que o metal frio enferruja,\nO coração de carne tem brio e tradição!\nO juiz rural confere o fôlego e as regras,\nE a fibra do sertão derruba a opressão!'],
    choices: [{ text: 'Rejeitar a Máquina', bonus: '+500 Milho', reaction: 'Ferrabrás bufa: "Malditos roceiros e sua coragem!"' }, { text: 'Provar Brio Orgânico', bonus: '+2 Fôlego', reaction: 'A torcida vibra e o autômato treme nas bases!' }],
    reward: '+1.000 Milho, +2 Fôlego',
  },
];

const btnStyle = (bg: string, fg: string = CORDEL_PALETTE.tintaXilo) => ({
  backgroundColor: bg, color: fg, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
});

export const ModoHistoriaDialogoPanel = defineComponent({
  name: 'ModoHistoriaDialogoPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup(props, { expose }) {
    const currentChapterIndex = ref(0);
    const currentVerseIndex = ref(0);
    const selectedChoiceIndex = ref<number | null>(null);
    const choiceFeedback = ref('');
    const isCompleted = ref(false);

    const chapter = computed(() => STORY_CHAPTERS[currentChapterIndex.value]);
    const verseText = computed(() => chapter.value.verses[currentVerseIndex.value] ?? '');

    const selectChapter = (idx: number) => {
      currentChapterIndex.value = idx; currentVerseIndex.value = 0;
      selectedChoiceIndex.value = null; choiceFeedback.value = '';
      isCompleted.value = false; cordelAudio.playZabumbaTabSwitch();
    };

    const advanceVerse = () => {
      if (currentVerseIndex.value < chapter.value.verses.length - 1) {
        currentVerseIndex.value++;
        cordelAudio.playZabumbaTabSwitch();
      } else {
        isCompleted.value = true;
        cordelAudio.playSanfonaVictory();
      }
    };

    const skipChapter = () => {
      currentVerseIndex.value = chapter.value.verses.length - 1;
      isCompleted.value = true; cordelAudio.playTrianguloReward();
    };

    const selectChoice = (idx: number) => {
      selectedChoiceIndex.value = idx;
      const c = chapter.value.choices[idx];
      choiceFeedback.value = `${c.reaction} [Bônus: ${c.bonus}]`;
      cordelAudio.playTrianguloReward();
    };

    expose({
      currentChapterIndex, currentVerseIndex, selectedChoiceIndex,
      choiceFeedback, isCompleted, selectChapter, advanceVerse, skipChapter, selectChoice,
      chapters: STORY_CHAPTERS,
    });

    return () => {
      const c = chapter.value;
      return h('div', { class: 'cordel-card', 'data-testid': 'modo-historia-dialogo-panel', style: { marginTop: '10px' } }, [
        h('h3', { style: { margin: '0 0 8px 0', color: CORDEL_PALETTE.terracota } }, '📜 Modo História — Diálogos de Cordel'),
        h('div', { 'data-testid': 'chapter-selector', style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' } },
          STORY_CHAPTERS.map((ch, idx) =>
            h('button', {
              key: ch.id, type: 'button', 'data-testid': `btn-chapter-${ch.id}`,
              style: btnStyle(currentChapterIndex.value === idx ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel),
              onClick: () => selectChapter(idx),
            }, `Cap ${ch.id}: ${ch.region}`),
          ),
        ),
        h('div', { 'data-testid': 'portrait-speaker', class: 'cordel-card', style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', border: '3px solid #5C3A21', background: '#FFF8DC' } }, [
          h('div', { style: { fontSize: '36px', lineHeight: 1 } }, c.speaker.avatar),
          h('div', [h('span', { class: 'cordel-badge', style: { background: CORDEL_PALETTE.terracota, color: '#FFF', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold' } }, c.speaker.role),
            h('div', { style: { fontWeight: 'bold', fontSize: '16px', marginTop: '2px' } }, c.speaker.name),
            h('small', { style: { color: '#666' } }, `${c.title} (${c.region})`)]),
        ]),
        h('div', { 'data-testid': 'dialogue-box', style: { background: CORDEL_PALETTE.cremePapel, border: '2px dashed #1B1B1B', borderRadius: '4px', padding: '12px', margin: '10px 0', minHeight: '80px' } }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } }, [
            h('span', { 'data-testid': 'verse-counter', style: { fontWeight: 'bold', fontSize: '13px', color: CORDEL_PALETTE.vermelhoCrista } }, `Verso ${currentVerseIndex.value + 1}/${c.verses.length}`),
            h('span', { style: { fontSize: '12px', color: '#666' } }, 'Métrica de Cordel'),
          ]),
          h('p', { 'data-testid': 'verse-text', style: { whiteSpace: 'pre-line', fontStyle: 'italic', margin: 0, fontSize: '15px', lineHeight: '1.4' } }, verseText.value),
        ]),
        h('div', { 'data-testid': 'choices-container', style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' } },
          c.choices.map((ch, idx) =>
            h('button', {
              key: idx, type: 'button', 'data-testid': `btn-choice-${idx}`,
              style: btnStyle(selectedChoiceIndex.value === idx ? CORDEL_PALETTE.verdeMata : CORDEL_PALETTE.cremePapel, selectedChoiceIndex.value === idx ? '#FFF' : undefined),
              onClick: () => selectChoice(idx),
            }, `${ch.text} (${ch.bonus})`),
          ),
        ),
        choiceFeedback.value ? h('p', { 'data-testid': 'choice-feedback', class: 'cordel-badge', style: { background: CORDEL_PALETTE.amareloMilho, padding: '6px', display: 'block', margin: '6px 0' } }, choiceFeedback.value) : null,
        h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-advance-verse',
            style: btnStyle(CORDEL_PALETTE.vermelhoCrista, CORDEL_PALETTE.cremePapel),
            onClick: advanceVerse,
          }, isCompleted.value ? 'REVER VERSOS ➔' : 'AVANÇAR VERSO ➔'),
          h('button', { type: 'button', 'data-testid': 'btn-skip-chapter', style: btnStyle(CORDEL_PALETTE.cremePapel), onClick: skipChapter }, 'PULAR >>'),
        ]),
        isCompleted.value ? h('div', {
          'data-testid': 'chapter-complete-banner', class: 'cordel-card',
          style: { marginTop: '10px', background: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', textAlign: 'center', padding: '10px' },
        }, [h('h4', { style: { margin: '0 0 4px 0' } }, `🎉 Capítulo ${c.id} Concluído: ${c.title}!`),
          h('p', { style: { margin: 0, fontWeight: 'bold' } }, `Recompensa de Vitória: ${c.reward}`)]) : null,
      ]);
    };
  },
});

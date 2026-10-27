export type StoryCharacterId = 'vo_tonho' | 'coronel_ferrabras' | 'narrador' | 'galo_campeao';
export type StoryScene = 'prologo' | 'desafio_chefe' | 'vitoria';
export type StorySfx =
  | 'sfx_zabumba_tab'
  | 'sfx_corta_canto'
  | 'sfx_galo_supreme'
  | 'sfx_sanfona_victory'
  | 'sfx_triangulo_reward'
  | 'sfx_berimbau_twang';

export interface StoryCharacter {
  id: StoryCharacterId;
  name: string;
  role: string;
  emoji: string;
  color: string;
}

export interface StoryChoice {
  text: string;
  reactionTrait: string;
  bonusMilho: number;
  bonusFolego: number;
}

export interface StoryDialogueNode {
  id: string;
  chapter: number;
  scene: StoryScene;
  speakerId: StoryCharacterId;
  verses: string[];
  sfx: StorySfx;
  choices?: StoryChoice[];
}

export const STORY_CHARACTERS: Record<StoryCharacterId, StoryCharacter> = {
  vo_tonho: { id: 'vo_tonho', name: 'Vô Tonho', role: 'Patriarca do Terreiro', emoji: '👴', color: '#E07A5F' },
  coronel_ferrabras: { id: 'coronel_ferrabras', name: 'Coronel Ferrabrás', role: 'Magnata Industrial', emoji: '🎩', color: '#8E2800' },
  narrador: { id: 'narrador', name: 'Cantador do Sertão', role: 'Menestrel de Cordel', emoji: '📜', color: '#F4A261' },
  galo_campeao: { id: 'galo_campeao', name: 'Galo Campeão', role: 'Atleta Lendário', emoji: '🐓', color: '#E76F51' },
};

export const STORY_CHAPTERS = [
  { chapter: 1, title: 'O Chamado do Terreiro', region: 'Cariri', boss: 'Valentão do Cariri' },
  { chapter: 2, title: 'O Forró Ameaçado', region: 'Caruaru', boss: 'Zabumba Gigante' },
  { chapter: 3, title: 'As Correntes do Velho Chico', region: 'Velho Chico', boss: 'Barqueira do Rio' },
  { chapter: 4, title: 'Os Mistérios da Caipora', region: 'Serra da Capivara', boss: 'Caipora Ancestral' },
  { chapter: 5, title: 'As Jangadas ao Vento', region: 'Mar de Jangadas', boss: 'Jangadeiro do Vento' },
  { chapter: 6, title: 'O Duelo do Raso Profundo', region: 'Raso da Catarina', boss: 'Galo de Ferro' },
] as const;

export const STORY_DIALOGUES: StoryDialogueNode[] = [
  // Cap 1: Cariri
  {
    id: 'ch1_prologo', chapter: 1, scene: 'prologo', speakerId: 'vo_tonho', sfx: 'sfx_berimbau_twang',
    verses: ['Meu neto, tome as rédeas', 'Deste terreiro ancestral', 'Cuide bem de cada atleta', 'Com carinho sem igual', 'Pois no circuito esportivo', 'Nosso canto é triunfal!'],
    choices: [{ text: 'Cuidarei do terreiro, Vô!', reactionTrait: 'Honra', bonusMilho: 100, bonusFolego: 20 }],
  },
  {
    id: 'ch1_desafio', chapter: 1, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_corta_canto',
    verses: ['Sou o Coronel Ferrabrás', 'Mando em todo o Cariri', 'Seu terreiro não tem chance', 'Contra os craques que escolhi', 'No duelo deste tablado', 'Nenhum frango vence aqui!'],
    choices: [{ text: 'Nossos atletas têm mais raça!', reactionTrait: 'Coragem', bonusMilho: 80, bonusFolego: 15 }],
  },
  {
    id: 'ch1_vitoria', chapter: 1, scene: 'vitoria', speakerId: 'galo_campeao', sfx: 'sfx_sanfona_victory',
    verses: ['Com técnica e muito fôlego', 'Erguemos nossa bandeira', 'Mostrando que o bom atleta', 'Vence com fibra altaneira', 'O Cariri se orgulha', 'Desta vitória primeira!'],
  },
  // Cap 2: Caruaru
  {
    id: 'ch2_prologo', chapter: 2, scene: 'prologo', speakerId: 'narrador', sfx: 'sfx_zabumba_tab',
    verses: ['Na feira de Caruaru', 'Onde o forró contagia', 'Os mestres do artesanato', 'Pedem força e harmonia', 'Pois um zabumba gigante', 'Ameaça a cantoria!'],
    choices: [{ text: 'Defenderemos o forró!', reactionTrait: 'Cultura', bonusMilho: 120, bonusFolego: 20 }],
  },
  {
    id: 'ch2_desafio', chapter: 2, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_corta_canto',
    verses: ['O Zabumba vai tocar', 'Com estrondo e vibração', 'Meus atletas desse jogo', 'Dominam o pelotão', 'Venha ao centro da arena', 'Se tiver disposição!'],
    choices: [{ text: 'Nosso ritmo é imbatível!', reactionTrait: 'Ritmo', bonusMilho: 100, bonusFolego: 25 }],
  },
  {
    id: 'ch2_vitoria', chapter: 2, scene: 'vitoria', speakerId: 'galo_campeao', sfx: 'sfx_triangulo_reward',
    verses: ['O forró bateu bem forte', 'No compasso do terreiro', 'A cadência do Zabumba', 'Não tombou nosso guerreiro', 'Seguimos pela estrada', 'Com o troféu de pioneiro!'],
  },
  // Cap 3: Velho Chico
  {
    id: 'ch3_prologo', chapter: 3, scene: 'prologo', speakerId: 'narrador', sfx: 'sfx_berimbau_twang',
    verses: ['Nas margens do Velho Chico', 'Água sagrada a brotar', 'A Barqueira traz segredos', 'De como no rio navegar', 'Exigindo dos atletas', 'Ritmo puro ao duelar!'],
    choices: [{ text: 'Respeitamos as águas sagradas!', reactionTrait: 'Harmonia', bonusMilho: 150, bonusFolego: 20 }],
  },
  {
    id: 'ch3_desafio', chapter: 3, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_zabumba_tab',
    verses: ['As correntes deste rio', 'Vão travar sua esperança', 'A Barqueira é implacável', 'Na agilidade e na dança', 'Seu trio perde o equilíbrio', 'E fraqueja na cobrança!'],
    choices: [{ text: 'Nossos atletas vencem a correnteza!', reactionTrait: 'Resistência', bonusMilho: 120, bonusFolego: 30 }],
  },
  {
    id: 'ch3_vitoria', chapter: 3, scene: 'vitoria', speakerId: 'vo_tonho', sfx: 'sfx_sanfona_victory',
    verses: ['O Chico nos deu a bênção', 'Com fôlego renovado', 'A Barqueira reconhece', 'Nosso treino dedicado', 'Com respeito à tradição', 'O troféu foi conquistado!'],
  },
  // Cap 4: Serra da Capivara
  {
    id: 'ch4_prologo', chapter: 4, scene: 'prologo', speakerId: 'narrador', sfx: 'sfx_berimbau_twang',
    verses: ['Na Serra da Capivara', 'Entre cânions e lajedos', 'A Caipora guarda a mata', 'E seus milenares segredos', 'Desafiando os valentes', 'Que não conhecem os medos!'],
    choices: [{ text: 'Buscamos o poder ancestral!', reactionTrait: 'Sabedoria', bonusMilho: 180, bonusFolego: 25 }],
  },
  {
    id: 'ch4_desafio', chapter: 4, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_corta_canto',
    verses: ['A Caipora é a guardiã', 'Com destreza colossal', 'Nenhum golpe de seu time', 'Pode contra o meu rival', 'Neste santuário antigo', 'Vão sofrer derrota final!'],
    choices: [{ text: 'Nossa velocidade vai surpreender!', reactionTrait: 'Agilidade', bonusMilho: 150, bonusFolego: 35 }],
  },
  {
    id: 'ch4_vitoria', chapter: 4, scene: 'vitoria', speakerId: 'galo_campeao', sfx: 'sfx_galo_supreme',
    verses: ['O santuário ancestral', 'Reconhece o nosso valor', 'Coroando nossos atletas', 'Com vigor e esplendor', 'Pela força da Caipora', 'Somos mestres com fervor!'],
  },
  // Cap 5: Mar de Jangadas
  {
    id: 'ch5_prologo', chapter: 5, scene: 'prologo', speakerId: 'vo_tonho', sfx: 'sfx_berimbau_twang',
    verses: ['No Mar de Jangadas brancas', 'O vento sopra a cantar', 'Sinergia em trio perfeito', 'É o segredo pra ganhar', 'Unam classes e elementos', 'Para as ondas superar!'],
    choices: [{ text: 'Ajustaremos a sinergia de trio!', reactionTrait: 'Tática', bonusMilho: 200, bonusFolego: 30 }],
  },
  {
    id: 'ch5_desafio', chapter: 5, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_zabumba_tab',
    verses: ['O Jangadeiro do Vento', 'Tem manobras de trovão', 'Acrobacias na praia', 'Vão jogar vocês no chão', 'Desistam deste certame', 'Pois aqui sou campeão!'],
    choices: [{ text: 'Nenhum vento quebra nossa postura!', reactionTrait: 'Foco', bonusMilho: 180, bonusFolego: 40 }],
  },
  {
    id: 'ch5_vitoria', chapter: 5, scene: 'vitoria', speakerId: 'galo_campeao', sfx: 'sfx_triangulo_reward',
    verses: ['Superamos a ventania', 'Com estratégia afiada', 'Três atletas combinados', 'Numa tática sagrada', 'Rumo ao Raso derradeiro', 'Com a taça prateada!'],
  },
  // Cap 6: Raso da Catarina
  {
    id: 'ch6_prologo', chapter: 6, scene: 'prologo', speakerId: 'narrador', sfx: 'sfx_berimbau_twang',
    verses: ['No Raso da Catarina', 'Terra de sol e calor', 'Chega o instante supremo', 'Do duelo de maior valor', 'O cinturão do sertão', 'Chama o grande vencedor!'],
    choices: [{ text: 'Lutaremos com o coração!', reactionTrait: 'Destino', bonusMilho: 250, bonusFolego: 40 }],
  },
  {
    id: 'ch6_desafio', chapter: 6, scene: 'desafio_chefe', speakerId: 'coronel_ferrabras', sfx: 'sfx_corta_canto',
    verses: ['Meu temido Galo de Ferro', 'Tem blindagem sem igual', 'Nenhum atleta de fibra', 'Vence um monstro de metal', 'Curvem-se ao meu poder', 'No confronto magistral!'],
    choices: [{ text: 'A tradição supera o metal!', reactionTrait: 'Coração', bonusMilho: 200, bonusFolego: 50 }],
  },
  {
    id: 'ch6_vitoria', chapter: 6, scene: 'vitoria', speakerId: 'galo_campeao', sfx: 'sfx_galo_supreme',
    verses: ['Vencemos a engrenagem', 'Com honra e união', 'O terreiro está a salvo', 'Com o título em nossa mão', 'E o cinturão dourado', 'Consagra nosso campeão!'],
  },
];

export function getChapterDialogues(chapter: number): StoryDialogueNode[] {
  return STORY_DIALOGUES.filter((d) => d.chapter === chapter);
}

export function getAllStoryChapters(): readonly { chapter: number; title: string; region: string; boss: string }[] {
  return STORY_CHAPTERS;
}

export function getCharacterById(id: StoryCharacterId): StoryCharacter {
  const character = STORY_CHARACTERS[id];
  if (!character) {
    throw new Error(`Personagem não encontrado: ${id}`);
  }
  return character;
}

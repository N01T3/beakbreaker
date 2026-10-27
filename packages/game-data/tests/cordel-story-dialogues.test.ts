import { describe, expect, it } from 'vitest';
import {
  STORY_CHARACTERS,
  STORY_CHAPTERS,
  STORY_DIALOGUES,
  getAllStoryChapters,
  getChapterDialogues,
  getCharacterById,
  type StoryCharacterId,
} from '../src/cordel-story-dialogues.js';

describe('Cordel Story Dialogues Specification (Modo História)', () => {
  it('contém exatamente 6 capítulos na Estrada do Sertão', () => {
    const chapters = getAllStoryChapters();
    expect(chapters).toHaveLength(6);
    expect(STORY_CHAPTERS).toHaveLength(6);

    const expectedRegions = ['Cariri', 'Caruaru', 'Velho Chico', 'Serra da Capivara', 'Mar de Jangadas', 'Raso da Catarina'];
    const expectedBosses = ['Valentão do Cariri', 'Zabumba Gigante', 'Barqueira do Rio', 'Caipora Ancestral', 'Jangadeiro do Vento', 'Galo de Ferro'];

    chapters.forEach((ch, idx) => {
      expect(ch.chapter).toBe(idx + 1);
      expect(ch.region).toBe(expectedRegions[idx]);
      expect(ch.boss).toBe(expectedBosses[idx]);
      expect(ch.title).toBeTruthy();
    });
  });

  it('valida os 4 personagens principais e seus metadados', () => {
    const ids: StoryCharacterId[] = ['vo_tonho', 'coronel_ferrabras', 'narrador', 'galo_campeao'];
    for (const id of ids) {
      const char = getCharacterById(id);
      expect(char.id).toBe(id);
      expect(char.name).toBeTruthy();
      expect(char.role).toBeTruthy();
      expect(char.emoji).toBeTruthy();
      expect(char.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(STORY_CHARACTERS[id]).toEqual(char);
    }

    expect(() => getCharacterById('inexistente' as StoryCharacterId)).toThrow();
  });

  it('possui 18 nós narrativos (3 cenas por capítulo)', () => {
    expect(STORY_DIALOGUES).toHaveLength(18);

    for (let c = 1; c <= 6; c++) {
      const nodes = getChapterDialogues(c);
      expect(nodes).toHaveLength(3);

      const scenes = nodes.map((n) => n.scene);
      expect(scenes).toEqual(['prologo', 'desafio_chefe', 'vitoria']);

      for (const node of nodes) {
        expect(node.chapter).toBe(c);
        expect(node.verses.length).toBeGreaterThanOrEqual(4);
        expect(node.sfx).toBeTruthy();
        expect(node.speakerId).toBeTruthy();

        if (node.choices) {
          expect(node.choices.length).toBeGreaterThanOrEqual(1);
          for (const choice of node.choices) {
            expect(choice.text).toBeTruthy();
            expect(choice.reactionTrait).toBeTruthy();
            expect(choice.bonusMilho).toBeGreaterThan(0);
            expect(choice.bonusFolego).toBeGreaterThan(0);
          }
        }
      }
    }

    expect(getChapterDialogues(99)).toEqual([]);
  });

  it('utiliza todos os 6 efeitos sonoros (SFX) exigidos', () => {
    const sfxSet = new Set(STORY_DIALOGUES.map((d) => d.sfx));
    expect(sfxSet.has('sfx_zabumba_tab')).toBe(true);
    expect(sfxSet.has('sfx_corta_canto')).toBe(true);
    expect(sfxSet.has('sfx_galo_supreme')).toBe(true);
    expect(sfxSet.has('sfx_sanfona_victory')).toBe(true);
    expect(sfxSet.has('sfx_triangulo_reward')).toBe(true);
    expect(sfxSet.has('sfx_berimbau_twang')).toBe(true);
  });

  it('cumpre blindagem jurídica Lei 9.605/98 (zero termos proibidos)', () => {
    const forbiddenWords = ['r' + 'inha', 'r' + 'inhadeiro', 'g' + 'alista', 'e' + 'spora', 'a' + 'posta'];
    const bannedPattern = new RegExp(`\\b(${forbiddenWords.join('|')})\\b`, 'i');

    for (const d of STORY_DIALOGUES) {
      for (const verse of d.verses) {
        expect(verse).not.toMatch(bannedPattern);
      }
      if (d.choices) {
        for (const choice of d.choices) {
          expect(choice.text).not.toMatch(bannedPattern);
          expect(choice.reactionTrait).not.toMatch(bannedPattern);
        }
      }
    }

    for (const ch of getAllStoryChapters()) {
      expect(ch.title).not.toMatch(bannedPattern);
      expect(ch.region).not.toMatch(bannedPattern);
      expect(ch.boss).not.toMatch(bannedPattern);
    }
  });
});

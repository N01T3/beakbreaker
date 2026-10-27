import { describe, expect, it } from 'vitest';
import {
  calculateMatchTrophies,
  getLeagueDivision,
  getLeagueTier,
  getSeasonEndRewards,
  LEAGUE_DIVISIONS,
  RankedLeagueSystem,
} from '../src/index.js';

describe('RankedLeagueSystem - Liga Ranqueada do Sertão', () => {
  describe('6 Divisões Oficiais', () => {
    it('possui exatamente 6 divisões oficiais configuradas', () => {
      expect(LEAGUE_DIVISIONS).toHaveLength(6);
      expect(RankedLeagueSystem.DIVISIONS).toBe(LEAGUE_DIVISIONS);
    });

    it('identifica corretamente cada uma das 6 faixas de troféus', () => {
      expect(getLeagueTier(0)).toBe('Bronze do Brejo');
      expect(getLeagueTier(399)).toBe('Bronze do Brejo');
      expect(getLeagueTier(400)).toBe('Prata da Caatinga');
      expect(getLeagueTier(999)).toBe('Prata da Caatinga');
      expect(getLeagueTier(1000)).toBe('Ouro do Sertão');
      expect(getLeagueTier(1799)).toBe('Ouro do Sertão');
      expect(getLeagueTier(1800)).toBe('Diamante Mandacaru');
      expect(getLeagueTier(2799)).toBe('Diamante Mandacaru');
      expect(getLeagueTier(2800)).toBe('Lenda do Agreste');
      expect(getLeagueTier(3999)).toBe('Lenda do Agreste');
      expect(getLeagueTier(4000)).toBe('Supremo Sertão');
      expect(getLeagueTier(6500)).toBe('Supremo Sertão');
    });

    it('trata valores negativos e decimais com segurança', () => {
      expect(getLeagueTier(-50)).toBe('Bronze do Brejo');
      expect(getLeagueTier(399.9)).toBe('Bronze do Brejo');
      expect(getLeagueTier(400.1)).toBe('Prata da Caatinga');
    });

    it('recupera o objeto de configuração da divisão via getLeagueDivision', () => {
      const ouro = getLeagueDivision(1250);
      expect(ouro.name).toBe('Ouro do Sertão');
      expect(ouro.minTrophies).toBe(1000);
      expect(ouro.maxTrophies).toBe(1799);
      expect(ouro.rewards).toEqual({ penasDouradas: 800, orbesCuringa: 10 });
    });
  });

  describe('Recompensas Quinzenais de Fim de Temporada', () => {
    it('entrega 100 Penas Douradas no Bronze do Brejo', () => {
      expect(getSeasonEndRewards(250)).toEqual({ penasDouradas: 100, orbesCuringa: 0 });
    });

    it('entrega 300 Penas Douradas na Prata da Caatinga', () => {
      expect(getSeasonEndRewards(750)).toEqual({ penasDouradas: 300, orbesCuringa: 0 });
    });

    it('entrega 800 Penas e 10 Orbes Curinga no Ouro do Sertão', () => {
      expect(getSeasonEndRewards(1500)).toEqual({ penasDouradas: 800, orbesCuringa: 10 });
    });

    it('entrega 1.500 Penas e 30 Orbes Curinga no Diamante Mandacaru', () => {
      expect(getSeasonEndRewards(2200)).toEqual({ penasDouradas: 1500, orbesCuringa: 30 });
    });

    it('entrega 2.500 Penas e 60 Orbes Curinga na Lenda do Agreste', () => {
      expect(getSeasonEndRewards(3500)).toEqual({ penasDouradas: 2500, orbesCuringa: 60 });
    });

    it('entrega 4.000 Penas e 100 Orbes Curinga no Supremo Sertão', () => {
      expect(getSeasonEndRewards(4500)).toEqual({ penasDouradas: 4000, orbesCuringa: 100 });
    });
  });

  describe('Cálculo de Troféus por Partida', () => {
    it('calcula vitória base sem diferença e sem streak (+30)', () => {
      expect(calculateMatchTrophies(500, 500, true, 0)).toBe(30);
      expect(calculateMatchTrophies(500, 500, true, 1)).toBe(30);
      expect(calculateMatchTrophies(500, 500, true, 2)).toBe(30);
    });

    it('aplica bônus de Win Streak a partir de 3 vitórias consecutivas (+10 troféus)', () => {
      expect(calculateMatchTrophies(500, 500, true, 3)).toBe(40);
      expect(calculateMatchTrophies(500, 500, true, 5)).toBe(40);
      expect(calculateMatchTrophies(500, 500, true, 10)).toBe(40);
    });

    it('escala vitória pela diferença de troféus', () => {
      // Oponente com +100 troféus -> +2 de bônus
      expect(calculateMatchTrophies(500, 600, true, 0)).toBe(32);
      // Oponente com -100 troféus -> -2 de penalidade
      expect(calculateMatchTrophies(600, 500, true, 0)).toBe(28);
      // Vitória com oponente superior e streak ativa
      expect(calculateMatchTrophies(500, 600, true, 3)).toBe(42);
    });

    it('amortiza derrota para -10 troféus em divisões abaixo de Ouro', () => {
      // Bronze (200 troféus)
      expect(calculateMatchTrophies(200, 200, false, 0)).toBe(-10);
      // Prata (600 troféus)
      expect(calculateMatchTrophies(600, 600, false, 0)).toBe(-10);
      expect(calculateMatchTrophies(999, 999, false, 0)).toBe(-10);
    });

    it('aplica derrota base de -20 troféus a partir do Ouro', () => {
      expect(calculateMatchTrophies(1000, 1000, false, 0)).toBe(-20);
      expect(calculateMatchTrophies(1500, 1500, false, 0)).toBe(-20);
      expect(calculateMatchTrophies(2500, 2500, false, 0)).toBe(-20);
      expect(calculateMatchTrophies(4200, 4200, false, 0)).toBe(-20);
    });

    it('protege divisões iniciais contra troféus negativos', () => {
      expect(calculateMatchTrophies(0, 100, false, 0)).toBe(0);
      expect(calculateMatchTrophies(6, 100, false, 0)).toBe(-6);
    });

    it('funciona equivalentemente via métodos estáticos da classe RankedLeagueSystem', () => {
      expect(RankedLeagueSystem.getLeagueTier(1500)).toBe('Ouro do Sertão');
      expect(RankedLeagueSystem.calculateMatchTrophies(1500, 1500, true, 3)).toBe(40);
      expect(RankedLeagueSystem.getSeasonEndRewards(1500).penasDouradas).toBe(800);
    });
  });
});

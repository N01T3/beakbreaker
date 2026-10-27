import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import fs from 'node:fs';
import path from 'node:path';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { ClanTabView } from '../src/web/ClanTabView.js';
import { DivinePassCalendarPanel } from '../src/web/panels/DivinePassCalendarPanel.js';
import {
  ClanTechMarketPanel,
  ClanTechMarketEngine,
  CLAN_TECH_TREE,
  CLAN_ORB_COOLDOWN_MS,
  CLAN_DAILY_DONATIONS_LIMIT,
} from '../src/web/panels/ClanTechMarketPanel.js';
import { AchievementsCordelPanel } from '../src/web/panels/AchievementsCordelPanel.js';
import {
  DIVINE_PASS_LEVELS,
  LOGIN_CALENDAR_28_DAYS,
  CORDEL_ACHIEVEMENTS_50,
} from '@beakbreaker/game-data';

describe('Painéis de UI: Passe Divino, Mercado do Clã & Conquistas de Cordel', () => {
  it('DivinePassCalendarPanel — renderiza 40 níveis do Passe Divino e 28 dias de Login', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(DivinePassCalendarPanel, { runtime }));

    expect(html).toContain('data-testid="divine-pass-calendar-panel"');
    expect(html).toContain('data-testid="pass-level-display"');
    expect(html).toContain('data-testid="seasonal-rooster-highlight"');
    expect(html).toContain('Nível 30: Ave Sazonal do Mês');
    expect(html).toContain('data-testid="btn-advance-pass-level"');
    expect(html).toContain('data-testid="btn-claim-pass-level"');
    expect(html).toContain('data-testid="btn-unlock-coronel"');

    expect(DIVINE_PASS_LEVELS).toHaveLength(40);
    expect(LOGIN_CALENDAR_28_DAYS).toHaveLength(28);
    expect(LOGIN_CALENDAR_28_DAYS[27]?.legendaryRoosterGuaranteed).toBe(true);
  });

  it('DivinePassCalendarPanel — avança níveis, resgata recompensas e alterna calendário', () => {
    const runtime = createWebRuntime();
    const panel = (DivinePassCalendarPanel.setup as any)({ runtime }, { emit: () => {} });
    expect(panel()).toBeDefined();

    expect(runtime.liveOps.getDivinePassLevel()).toBe(1);
    runtime.liveOps.advanceDivinePass(1);
    expect(runtime.liveOps.getDivinePassLevel()).toBe(2);

    expect(runtime.liveOps.isGoldenPassActive()).toBe(false);
    runtime.liveOps.unlockGoldenPass();
    expect(runtime.liveOps.isGoldenPassActive()).toBe(true);
  });

  it('ClanTechMarketPanel — exibe 10 tecnologias e gerencia Feira de Orbes', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ClanTechMarketPanel, { runtime }));

    expect(html).toContain('data-testid="clan-tech-market-panel"');
    expect(html).toContain('data-testid="tech-tree-list"');
    expect(html).toContain('data-testid="market-cooldown-status"');
    expect(html).toContain('data-testid="btn-donate-tech"');
    expect(html).toContain('data-testid="btn-request-orbs"');
    expect(html).toContain('data-testid="btn-donate-orbs"');

    expect(CLAN_TECH_TREE).toHaveLength(10);
    expect(CLAN_TECH_TREE[0]?.name).toBe('Celeiro Solidário');
    expect(CLAN_TECH_TREE[9]?.name).toBe('Sertão Soberano');
    expect(CLAN_ORB_COOLDOWN_MS).toBe(8 * 3600 * 1000);
    expect(CLAN_DAILY_DONATIONS_LIMIT).toBe(5);
  });

  it('ClanTechMarketEngine — simula doação de milho, cooldown de 8h e limite de doações', () => {
    const engine = new ClanTechMarketEngine(1);
    const initialTree = engine.getTechTree();
    expect(initialTree[0]?.unlocked).toBe(true);
    expect(initialTree[1]?.unlocked).toBe(false);

    const resMilho = engine.donateMilho(1000);
    expect(resMilho.clanLevel).toBe(2);
    expect(engine.getTechTree()[1]?.unlocked).toBe(true);

    const now = 100_000_000;
    const req1 = engine.requestOrbs('#1 Galo Campina', 'Comum', now);
    expect(req1.success).toBe(true);

    const reqEarly = engine.requestOrbs('#1 Galo Campina', 'Comum', now + 4 * 3600 * 1000);
    expect(reqEarly.success).toBe(false);
    expect(reqEarly.reason).toBe('COOLDOWN_8H_ATIVO');

    for (let i = 0; i < 5; i++) {
      const don = engine.donateOrb();
      expect(don.success).toBe(true);
      expect(don.medals).toBe(50);
    }
    const don6 = engine.donateOrb();
    expect(don6.success).toBe(false);
    expect(don6.reason).toBe('LIMITE_DIARIO_ATINGIDO');
  });

  it('AchievementsCordelPanel — exibe 50 conquistas por categoria e resgate de Coroas', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(AchievementsCordelPanel, { runtime }));

    expect(html).toContain('data-testid="achievements-cordel-panel"');
    expect(html).toContain('data-testid="total-crowns-display"');
    expect(html).toContain('data-testid="category-tabs"');
    expect(html).toContain('data-testid="btn-cat-criacao"');
    expect(html).toContain('data-testid="btn-cat-combate"');
    expect(html).toContain('data-testid="btn-cat-fazenda"');
    expect(html).toContain('data-testid="btn-cat-colecao"');

    expect(CORDEL_ACHIEVEMENTS_50).toHaveLength(50);
    const cats = ['CRIACAO', 'COMBATE', 'FAZENDA', 'COLECAO'] as const;
    const counts = cats.map((c) => CORDEL_ACHIEVEMENTS_50.filter((a) => a.category === c).length);
    expect(counts).toEqual([12, 15, 12, 11]);
  });

  it('ClanTabView — integra todos os painéis e mantém compatibilidade com tab-content-bando', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ClanTabView, { runtime }));

    expect(html).toContain('data-testid="tab-content-bando"');
    expect(html).toContain('data-testid="colossus-raid-panel"');
    expect(html).toContain('data-testid="territory-war-panel"');
    expect(html).toContain('data-testid="hero-race-panel"');
    expect(html).toContain('data-testid="liveops-festival-panel"');
    expect(html).toContain('data-testid="divine-pass-calendar-panel"');
    expect(html).toContain('data-testid="clan-tech-market-panel"');
    expect(html).toContain('data-testid="achievements-cordel-panel"');
  });

  it('Garante estritamente < 180 linhas e zero termos proibidos pela Lei 9.605/98', () => {
    const files = [
      'apps/client/src/web/panels/DivinePassCalendarPanel.ts',
      'apps/client/src/web/panels/ClanTechMarketPanel.ts',
      'apps/client/src/web/panels/AchievementsCordelPanel.ts',
      'apps/client/src/web/ClanTabView.ts',
    ];
    const root = path.resolve(__dirname, '../../..');
    const terms = ['r' + 'inha', 'gal' + 'ista', 'ap' + 'osta', 'esp' + 'ora', 'r' + 'inhadeiro'];
    const forbiddenRegex = new RegExp(`(${terms.join('|')})`, 'i');

    for (const f of files) {
      const fullPath = path.join(root, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(180);

      const match = content.match(forbiddenRegex);
      expect(match).toBeNull();
    }
  });
});

import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { AlternativeCombatModesPanel } from '../src/web/panels/AlternativeCombatModesPanel.js';
import { UFRankingProfilePanel } from '../src/web/panels/UFRankingProfilePanel.js';
import { CordelChallengesPredatorsPanel } from '../src/web/panels/CordelChallengesPredatorsPanel.js';
import { GrowthFundLotteryPanel } from '../src/web/panels/GrowthFundLotteryPanel.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import { FarmTabView } from '../src/web/FarmTabView.js';
import { ClanTabView } from '../src/web/ClanTabView.js';
import { StoreTabView } from '../src/web/StoreTabView.js';

describe('Painéis Estendidos v5.0 — UI & Integração E2E', () => {
  it('renderiza AlternativeCombatModesPanel com os 4 modos e executa simulações', async () => {
    const html = await renderToString(h(AlternativeCombatModesPanel));
    expect(html).toContain('data-testid="alternative-combat-modes-panel"');
    expect(html).toContain('data-testid="button-duelo-1x1"');
    expect(html).toContain('data-testid="button-arena-nivelada"');
    expect(html).toContain('data-testid="button-rei-terreiro"');
    expect(html).toContain('data-testid="button-torneio-arraial"');
    expect(html).toContain('data-testid="alt-modes-result"');

    const panel = (AlternativeCombatModesPanel as any).setup({}, { emit: () => {} });
    expect(panel).toBeDefined();
    const vnode = panel();
    expect(vnode).toBeDefined();
  });

  it('renderiza UFRankingProfilePanel com vitrine, ranking de 27 UFs e visita ao amigo', async () => {
    const html = await renderToString(h(UFRankingProfilePanel));
    expect(html).toContain('data-testid="uf-ranking-profile-panel"');
    expect(html).toContain('data-testid="player-showcase-trio"');
    expect(html).toContain('Título: Supremo Sertão');
    expect(html).toContain('Moldura: Ouro Cangaço');
    expect(html).toContain('Poder Total do Trio: 16.800');
    expect(html).toContain('data-testid="uf-ranking-table"');
    expect(html).toContain('Pernambuco');
    expect(html).toContain('data-testid="button-visit-friend-farm"');
    expect(html).toContain('data-testid="friendship-bonus-result"');
  });

  it('renderiza CordelChallengesPredatorsPanel com folheto (0 fôlego) e alerta de predador', async () => {
    const html = await renderToString(h(CordelChallengesPredatorsPanel));
    expect(html).toContain('data-testid="cordel-challenges-predators-panel"');
    expect(html).toContain('data-testid="cordel-folheto-card"');
    expect(html).toContain('Revolta do Cariri (Custo: 0 Fôlego)');
    expect(html).toContain('data-testid="button-solve-cordel-puzzle"');
    expect(html).toContain('data-testid="predator-alert-banner"');
    expect(html).toContain('Raposa da Caatinga');
    expect(html).toContain('data-testid="button-repel-predator"');
  });

  it('renderiza GrowthFundLotteryPanel com faixas da Sede e loteria semanal', async () => {
    const html = await renderToString(h(GrowthFundLotteryPanel));
    expect(html).toContain('data-testid="growth-fund-lottery-panel"');
    expect(html).toContain('data-testid="growth-fund-tier-row"');
    expect(html).toContain('data-testid="button-claim-fund-tier"');
    expect(html).toContain('data-testid="village-lottery-status"');
    expect(html).toContain('data-testid="button-buy-lottery-ticket"');
    expect(html).toContain('data-testid="button-simulate-lottery-draw"');
  });

  it('integra os 4 novos painéis nas respectivas abas do jogo', async () => {
    const runtime = createWebRuntime();

    const arenaHtml = await renderToString(h(ArenaTabView, { runtime }));
    expect(arenaHtml).toContain('data-testid="alternative-combat-modes-panel"');

    const farmHtml = await renderToString(h(FarmTabView, {
      runtime, onAddMilho: () => {}, onUpgradeSede: () => {},
    }));
    expect(farmHtml).toContain('data-testid="cordel-challenges-predators-panel"');

    const clanHtml = await renderToString(h(ClanTabView, { runtime }));
    expect(clanHtml).toContain('data-testid="uf-ranking-profile-panel"');

    const storeHtml = await renderToString(h(StoreTabView, {
      runtime, currentPity: 10, onPullChocadeira: () => {}, onGrantCoroas: () => {},
    }));
    expect(storeHtml).toContain('data-testid="growth-fund-lottery-panel"');
  });
});

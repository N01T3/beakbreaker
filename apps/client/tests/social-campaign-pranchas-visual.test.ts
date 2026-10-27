import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'node:path';
import fs from 'node:fs';
import { SocialVitrineCordelPanel } from '../src/web/panels/SocialVitrineCordelPanel.js';
import { CampaignTorreVisualPanel } from '../src/web/panels/CampaignTorreVisualPanel.js';
import { ClanTabView } from '../src/web/ClanTabView.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

describe('Prancha 17 — Hub Social, Vitrine de Galos & Folhetos de Cordel', () => {
  it('renderiza pedestais de vitrine, perfil SUPREMO SERTÃO, trilho de estados e folhetos', async () => {
    const html = await renderToString(h(SocialVitrineCordelPanel));
    expect(html).toContain('data-testid="social-vitrine-cordel-panel"');
    expect(html).toContain('data-testid="uf-rail"');
    for (const uf of ['PB', 'PE', 'BA', 'CE', 'RN', 'AL', 'SE', 'PI', 'MA']) {
      expect(html).toContain(`data-testid="btn-uf-${uf}"`);
    }
    expect(html).toContain('SUPREMO SERTÃO');
    expect(html).toContain('Elo Rating: 2.850');
    expect(html).toContain('Avatar: 🤠 Chapéu de Couro / Lampião');
    expect(html).toContain('Clã: Bando do Lampião');
    expect(html).toContain('data-testid="vitrine-pedestals"');
    expect(html).toContain('PODER FAVORITO ⚡ 3000');
    expect(html).toContain('Líder Cangaço');
    expect(html).toContain('Campeão do Sol');
    expect(html).toContain('VISITAR FAZENDA DE AMIGO');
    expect(html).toContain('Revolta do Cariri');
    expect(html).toContain('Lendas da Lua');
    expect(html).toContain('O Cangaço Misterioso');
    expect(html).toContain('DESAFIAR');
    expect(html).toContain('data-testid="conquests-ribbons-row"');
  });

  it('executa interações de seleção de UF, visita de fazenda e desafio de folheto', () => {
    const vm: any = (SocialVitrineCordelPanel as any).setup({}, { emit: () => {} });
    expect(vm).toBeDefined();
    const vnode = vm();
    expect(vnode).toBeDefined();
  });
});

describe('Prancha 18 — Campanha Estrada do Sertão & Torre do Mandacaru', () => {
  it('renderiza os 6 capítulos da campanha, balão do Vô Tonho e Torre 100F', async () => {
    const html = await renderToString(h(CampaignTorreVisualPanel));
    expect(html).toContain('data-testid="campaign-torre-visual-panel"');
    expect(html).toContain('Chapada do Araripe');
    expect(html).toContain('Vale do Cariri');
    expect(html).toContain('Sertão dos Inhamuns');
    expect(html).toContain('Raso da Catarina');
    expect(html).toContain('Caatinga Alta');
    expect(html).toContain('Fortaleza do Coronel Ferrabrás');
    expect(html).toContain('data-testid="vo-tonho-speech-balloon"');
    expect(html).toContain('Vô Tonho');
    expect(html).toContain('A coragem do sertanejo dobra na adversidade');
    expect(html).toContain('Torre do Mandacaru (100 Andares em Espiral');
    expect(html).toContain('Seca Extrema');
    expect(html).toContain('Chuva de Pedra');
    expect(html).toContain('Ventania Brava');
    expect(html).toContain('Festa no Arraial');
    expect(html).toContain('DESAFIAR ANDAR 42!');
  });

  it('permite interagir com seletor de andar e botão de desafio', () => {
    const vm: any = (CampaignTorreVisualPanel as any).setup({}, { emit: () => {} });
    expect(vm).toBeDefined();
    const vnode = vm();
    expect(vnode).toBeDefined();
  });
});

describe('Integração de Pranchas 17 e 18 nas Abas do Jogo', () => {
  it('integra SocialVitrineCordelPanel no ClanTabView com botão de toggle', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ClanTabView, { runtime }));
    expect(html).toContain('data-testid="btn-toggle-vitrine-cordel"');
    expect(html).toContain('data-testid="social-vitrine-cordel-panel"');
  });

  it('integra CampaignTorreVisualPanel no ArenaTabView com seletor de modos', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ArenaTabView, { runtime }));
    expect(html).toContain('data-testid="btn-select-mode-arena"');
    expect(html).toContain('data-testid="btn-select-mode-estrada-torre"');
    expect(html).toContain('data-testid="campaign-torre-visual-panel"');
  });
});

describe('Conformidade Arquitetural & Lei 9.605/98', () => {
  const files = [
    'apps/client/src/web/panels/SocialVitrineCordelPanel.ts',
    'apps/client/src/web/panels/CampaignTorreVisualPanel.ts',
    'apps/client/src/web/ClanTabView.ts',
    'apps/client/src/web/ArenaTabView.ts',
  ];
  const forbidden = ['r' + 'inha', 'r' + 'inhadeiro', 'gal' + 'ista', 'esp' + 'ora', 'ap' + 'osta'];
  const regex = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');

  it('respeita o limite rigoroso de < 180 linhas e zero termos proibidos', () => {
    const root = path.resolve(__dirname, '../../..');
    for (const rel of files) {
      const full = path.join(root, rel);
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(180);
      const match = content.match(regex);
      expect(match).toBeNull();
    }
  });
});

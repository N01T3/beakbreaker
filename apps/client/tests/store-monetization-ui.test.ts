import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../src/services/ApiClient.js';
import { StoreMonetizationOffersPanel, VIP_PERKS } from '../src/web/panels/StoreMonetizationOffersPanel.js';
import { StoreTabView } from '../src/web/StoreTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

interface VNodeLike { props?: Record<string, any>; children?: any; }

function findVNode(node: any, testId: string): VNodeLike | null {
  if (!node || typeof node !== 'object') return null;
  if (node.props?.['data-testid'] === testId) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const res = findVNode(child, testId);
      if (res) return res;
    }
  }
  return null;
}

function collectText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node.children === 'string') return node.children;
  if (Array.isArray(node.children)) return node.children.map(collectText).join(' ');
  return '';
}

describe('StoreMonetizationOffersPanel (GDD v5.0 Monetização Ética)', () => {
  it('monta o painel de ofertas com todos os módulos essenciais', () => {
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const vnode = setupFn({ currentPity: 0 }, { emit: vi.fn() })();
    expect(findVNode(vnode, 'store-monetization-offers-panel')).toBeDefined();
    expect(findVNode(vnode, 'golden-vault-card')).toBeDefined();
    expect(findVNode(vnode, 'farmer-card')).toBeDefined();
    expect(findVNode(vnode, 'orb-club-card')).toBeDefined();
    expect(findVNode(vnode, 'vip-panel')).toBeDefined();
    expect(findVNode(vnode, 'flash-pity-offer-card')).toBeDefined();
  });

  it('gerencia o ciclo do Cofre Dourado (acumular até 500 e quebrar via Pix)', async () => {
    const granted: number[] = [];
    const mockApi = { request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }) } as unknown as ApiClient;
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({ currentPity: 10, apiClient: mockApi, onGrantCoroas: (c: number) => granted.push(c) }, { emit: vi.fn() });

    let vnode = render();
    const btnAccumulate = findVNode(vnode, 'btn-accumulate-vault');
    const btnBreak = findVNode(vnode, 'btn-break-vault');

    await btnBreak?.props?.onClick();
    expect(granted).toHaveLength(0);
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('precisa de 500 Coroas');

    for (let i = 0; i < 10; i++) await btnAccumulate?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vault-crowns-display'))).toContain('500/500 Coroas');

    await btnBreak?.props?.onClick();
    expect(granted).toContain(500);
    vnode = render();
    expect(collectText(findVNode(vnode, 'vault-crowns-display'))).toContain('0/500 Coroas');
    expect(mockApi.request).toHaveBeenCalledWith('/api/store/golden-vault/smash', expect.anything(), expect.objectContaining({ method: 'POST' }));
  });

  it('gerencia a assinatura e diárias do Cartão do Fazendeiro', async () => {
    const granted: number[] = [];
    const mockApi = { request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }) } as unknown as ApiClient;
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({ apiClient: mockApi, onGrantCoroas: (c: number) => granted.push(c) }, { emit: vi.fn() });

    let vnode = render();
    await findVNode(vnode, 'btn-claim-farmer-daily')?.props?.onClick();
    expect(granted).toHaveLength(0);

    findVNode(vnode, 'btn-subscribe-farmer')?.props?.onClick();
    expect(granted).toContain(300);
    vnode = render();
    expect(collectText(findVNode(vnode, 'farmer-status-display'))).toContain('Ativo');

    await findVNode(vnode, 'btn-claim-farmer-daily')?.props?.onClick();
    expect(granted).toContain(60);
  });

  it('controla a adesão e coletas do Clube dos Orbes', () => {
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({}, { emit: vi.fn() });

    let vnode = render();
    findVNode(vnode, 'btn-claim-orb-daily')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('Ative o Clube');

    findVNode(vnode, 'btn-subscribe-orb-club')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'orb-club-status-display'))).toContain('Ativo');

    findVNode(vnode, 'btn-claim-orb-daily')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('+15 orbes diários');
  });

  it('exibe progressão VIP de 1 a 15 com benefícios cosméticos e teto justo', () => {
    expect(Object.keys(VIP_PERKS)).toHaveLength(15);
    expect(VIP_PERKS[1]).toBe('Moldura Cordel Bronze');
    expect(VIP_PERKS[15]).toContain('Teto VIP');

    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({}, { emit: vi.fn() });

    let vnode = render();
    findVNode(vnode, 'btn-next-vip')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 2/15');
    expect(collectText(findVNode(vnode, 'vip-perk-display'))).toBe(VIP_PERKS[2]);

    findVNode(vnode, 'btn-prev-vip')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 1/15');

    findVNode(vnode, 'btn-prev-vip')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 1/15');
  });

  it('ativa Oferta Relâmpago exclusivamente na faixa de pity 58 a 65 da Chocadeira', async () => {
    const mockApi = { request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }) } as unknown as ApiClient;
    const setupFn = StoreMonetizationOffersPanel.setup as any;

    let render = setupFn({ currentPity: 50, apiClient: mockApi }, { emit: vi.fn() });
    let vnode = render();
    expect(findVNode(vnode, 'flash-offer-inactive')).toBeDefined();
    expect(findVNode(vnode, 'flash-offer-active')).toBeNull();

    render = setupFn({ currentPity: 60, apiClient: mockApi }, { emit: vi.fn() });
    vnode = render();
    expect(findVNode(vnode, 'flash-offer-active')).toBeDefined();
    expect(findVNode(vnode, 'btn-buy-flash-offer')).toBeDefined();

    await findVNode(vnode, 'btn-buy-flash-offer')?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('10 ovos com 40% de desconto');

    render = setupFn({ currentPity: 70, apiClient: mockApi }, { emit: vi.fn() });
    vnode = render();
    expect(findVNode(vnode, 'flash-offer-inactive')).toBeDefined();
    expect(findVNode(vnode, 'flash-offer-active')).toBeNull();
  });

  it('integra o painel de ofertas harmoniosamente dentro do StoreTabView', () => {
    const runtime = createWebRuntime();
    const setupFn = StoreTabView.setup as any;
    const vnode = setupFn({ runtime, currentPity: 62, onPullChocadeira: vi.fn(), onGrantCoroas: vi.fn() })();
    expect(vnode).toBeDefined();
    expect(findVNode(vnode, 'store-monetization-offers-panel')).toBeDefined();
  });
});

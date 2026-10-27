import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../src/services/ApiClient.js';
import { StoreMonetizationOffersPanel, VIP_PERKS } from '../src/web/panels/StoreMonetizationOffersPanel.js';
import { StoreTabView } from '../src/web/StoreTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

interface VNodeLike {
  props?: Record<string, any>;
  children?: any;
}

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
  if (Array.isArray(node.children)) {
    return node.children.map(collectText).join(' ');
  }
  return '';
}

describe('StoreMonetizationOffersPanel (GDD v5.0 Monetização Ética)', () => {
  it('monta o painel de ofertas com todos os módulos essenciais', () => {
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({ currentPity: 0 }, { emit: vi.fn() });
    const vnode = render();

    expect(findVNode(vnode, 'store-monetization-offers-panel')).toBeDefined();
    expect(findVNode(vnode, 'golden-vault-card')).toBeDefined();
    expect(findVNode(vnode, 'farmer-card')).toBeDefined();
    expect(findVNode(vnode, 'orb-club-card')).toBeDefined();
    expect(findVNode(vnode, 'vip-panel')).toBeDefined();
    expect(findVNode(vnode, 'flash-pity-offer-card')).toBeDefined();
  });

  it('gerencia o ciclo do Cofre Dourado (acumular até 500 e quebrar via Pix)', async () => {
    const granted: number[] = [];
    const mockApi = {
      request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    } as unknown as ApiClient;

    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn(
      {
        currentPity: 10,
        apiClient: mockApi,
        onGrantCoroas: (c: number) => granted.push(c),
      },
      { emit: vi.fn() },
    );

    let vnode = render();
    const btnAccumulate = findVNode(vnode, 'btn-accumulate-vault');
    const btnBreak = findVNode(vnode, 'btn-break-vault');

    // Tentativa de quebrar cofre vazio
    await btnBreak?.props?.onClick();
    expect(granted).toHaveLength(0);
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('precisa de 500 Coroas');

    // Acumula até encher o cofre (10x +50 = 500)
    for (let i = 0; i < 10; i++) {
      await btnAccumulate?.props?.onClick();
    }
    vnode = render();
    expect(collectText(findVNode(vnode, 'vault-crowns-display'))).toContain('500/500 Coroas');

    // Quebra o cofre cheio
    await btnBreak?.props?.onClick();
    expect(granted).toContain(500);
    vnode = render();
    expect(collectText(findVNode(vnode, 'vault-crowns-display'))).toContain('0/500 Coroas');
    expect(mockApi.request).toHaveBeenCalledWith(
      '/api/store/golden-vault/smash',
      expect.anything(),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('gerencia a assinatura e diárias do Cartão do Fazendeiro', async () => {
    const granted: number[] = [];
    const mockApi = {
      request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    } as unknown as ApiClient;

    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn(
      {
        apiClient: mockApi,
        onGrantCoroas: (c: number) => granted.push(c),
      },
      { emit: vi.fn() },
    );

    let vnode = render();
    const btnClaim = findVNode(vnode, 'btn-claim-farmer-daily');
    const btnSub = findVNode(vnode, 'btn-subscribe-farmer');

    // Não permite coletar diária antes da assinatura
    await btnClaim?.props?.onClick();
    expect(granted).toHaveLength(0);

    // Ativa assinatura
    btnSub?.props?.onClick();
    expect(granted).toContain(300); // 300 coroas imediatas
    vnode = render();
    expect(collectText(findVNode(vnode, 'farmer-status-display'))).toContain('Ativo');

    // Coleta diária
    await btnClaim?.props?.onClick();
    expect(granted).toContain(60); // 60 coroas diárias
  });

  it('controla a adesão e coletas do Clube dos Orbes', () => {
    const setupFn = StoreMonetizationOffersPanel.setup as any;
    const render = setupFn({}, { emit: vi.fn() });

    let vnode = render();
    const btnClaim = findVNode(vnode, 'btn-claim-orb-daily');
    const btnSub = findVNode(vnode, 'btn-subscribe-orb-club');

    btnClaim?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('Ative o Clube');

    btnSub?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'orb-club-status-display'))).toContain('Ativo');

    btnClaim?.props?.onClick();
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
    const btnNext = findVNode(vnode, 'btn-next-vip');
    const btnPrev = findVNode(vnode, 'btn-prev-vip');

    // Avança para VIP 2
    btnNext?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 2/15');
    expect(collectText(findVNode(vnode, 'vip-perk-display'))).toBe(VIP_PERKS[2]);

    // Retrocede para VIP 1
    btnPrev?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 1/15');

    // Tenta descer abaixo de 1 (limite inferior)
    btnPrev?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'vip-level-display'))).toContain('VIP 1/15');
  });

  it('ativa Oferta Relâmpago exclusivamente na faixa de pity 58 a 65 da Chocadeira', async () => {
    const mockApi = {
      request: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    } as unknown as ApiClient;
    const setupFn = StoreMonetizationOffersPanel.setup as any;

    // Pity 50 -> Inativa
    let render = setupFn({ currentPity: 50, apiClient: mockApi }, { emit: vi.fn() });
    let vnode = render();
    expect(findVNode(vnode, 'flash-offer-inactive')).toBeDefined();
    expect(findVNode(vnode, 'flash-offer-active')).toBeNull();

    // Pity 60 -> Ativa com 40% de desconto por 1 hora
    render = setupFn({ currentPity: 60, apiClient: mockApi }, { emit: vi.fn() });
    vnode = render();
    expect(findVNode(vnode, 'flash-offer-active')).toBeDefined();
    expect(findVNode(vnode, 'btn-buy-flash-offer')).toBeDefined();

    // Comprar oferta relâmpago
    const btnBuy = findVNode(vnode, 'btn-buy-flash-offer');
    await btnBuy?.props?.onClick();
    vnode = render();
    expect(collectText(findVNode(vnode, 'offer-status-message'))).toContain('10 ovos com 40% de desconto');

    // Pity 70 -> Inativa novamente
    render = setupFn({ currentPity: 70, apiClient: mockApi }, { emit: vi.fn() });
    vnode = render();
    expect(findVNode(vnode, 'flash-offer-inactive')).toBeDefined();
    expect(findVNode(vnode, 'flash-offer-active')).toBeNull();
  });

  it('integra o painel de ofertas harmoniosamente dentro do StoreTabView', () => {
    const runtime = createWebRuntime();
    const setupFn = StoreTabView.setup as any;
    const render = setupFn({
      runtime,
      currentPity: 62,
      onPullChocadeira: vi.fn(),
      onGrantCoroas: vi.fn(),
    });

    const vnode = render();
    expect(vnode).toBeDefined();
    const offerPanel = findVNode(vnode, 'store-monetization-offers-panel');
    expect(offerPanel).toBeDefined();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../src/services/ApiClient.js';

describe('ApiClient HTTP & Offline Fallback', () => {
  let client: ApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new ApiClient('https://api.beakbreaker.gg/v5');
    client.clearRequestLog();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('performs HTTP GET requests and parses JSON response', async () => {
    const mockData = { id: 'rooster_01', name: 'Sertão Valente', level: 10 };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockData),
    } as unknown as Response);

    const fallback = { id: 'fallback', name: 'Offline Roost', level: 1 };
    const res = await client.request('/roosters/rooster_01', fallback);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.beakbreaker.gg/v5/roosters/rooster_01',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data).toEqual(mockData);
    expect(res.isFallback).toBe(false);

    const log = client.getRequestLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toEqual({ path: '/roosters/rooster_01', method: 'GET', idempotencyKey: undefined });
  });

  it('includes Authorization Bearer header when token is configured', async () => {
    client.setAuthToken('sertao_jwt_token_999');
    expect(client.getAuthToken()).toBe('sertao_jwt_token_999');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ verified: true }),
    } as unknown as Response);

    await client.request('/auth/verify', { verified: false });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sertao_jwt_token_999',
        }),
      }),
    );

    client.setAuthToken(null);
    expect(client.getAuthToken()).toBeNull();
  });

  it('sends X-Idempotency-Key and JSON body on mutating requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ orderId: 'ord_123', status: 'PAID' }),
    } as unknown as Response);

    const payload = { milhoAmount: 500, crowns: 10 };
    const res = await client.request('/store/purchase', { orderId: 'fallback', status: 'PENDING' }, {
      method: 'POST',
      body: payload,
      idempotencyKey: 'idem_key_777',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.beakbreaker.gg/v5/store/purchase',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Idempotency-Key': 'idem_key_777',
        }),
        body: JSON.stringify(payload),
      }),
    );
    expect(res.status).toBe(201);
    expect(res.idempotencyKey).toBe('idem_key_777');
  });

  it('manages custom baseUrl and clears request logs', async () => {
    client.setBaseUrl('https://custom-gateway.sertao.gg/v2/');
    expect(client.getBaseUrl()).toBe('https://custom-gateway.sertao.gg/v2/');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ping: 'pong' }),
    } as unknown as Response);

    await client.request('health', { ping: 'offline' });
    expect(globalThis.fetch).toHaveBeenCalledWith('https://custom-gateway.sertao.gg/v2/health', expect.any(Object));

    expect(client.getRequestLog().length).toBeGreaterThan(0);
    client.clearRequestLog();
    expect(client.getRequestLog()).toHaveLength(0);
  });

  it('returns graceful fallback payload on network connection refusal without throwing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

    const fallback = { offlineReady: true, cachedFighter: 'Galo Valente' };
    const res = await client.request('/arena/duel-queue', fallback);

    expect(res.ok).toBe(false);
    expect(res.status).toBe(0);
    expect(res.isFallback).toBe(true);
    expect(res.data).toEqual(fallback);
    expect(res.error).toContain('ECONNREFUSED');
  });

  it('returns graceful fallback payload when server returns status >= 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    } as unknown as Response);

    const fallback = { status: 'DEGRADED', retryAfterSec: 30 };
    const res = await client.request('/liveops/events', fallback);

    expect(res.ok).toBe(false);
    expect(res.status).toBe(503);
    expect(res.isFallback).toBe(true);
    expect(res.data).toEqual(fallback);
  });

  it('re-throws network error when useOfflineFallback is explicitly false', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));

    await expect(
      client.request('/critical/payment', { status: 'fallback' }, { useOfflineFallback: false }),
    ).rejects.toThrow('Network disconnected');
  });
});

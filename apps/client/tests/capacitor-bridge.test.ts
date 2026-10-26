// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CapacitorBridgeService,
  SNAPSHOT_STORAGE_KEY,
  isValidProgressSnapshot,
} from '../src/services/CapacitorBridgeService.js';

describe('CapacitorBridgeService (Node / fallback em memória)', () => {
  it('detecta plataforma web quando Capacitor não existe', () => {
    const bridge = new CapacitorBridgeService();
    expect(bridge.getPlatform()).toBe('web');
    expect(bridge.getPlatformLabel()).toBe('Web → Capacitor Ready');
  });

  it('incrementa hapticCount mesmo sem navigator.vibrate', () => {
    const bridge = new CapacitorBridgeService();
    expect(bridge.hapticCount).toBe(0);
    bridge.triggerWoodcutHaptic('light');
    bridge.triggerWoodcutHaptic('medium');
    const result = bridge.triggerWoodcutHaptic('heavy');
    expect(typeof result).toBe('boolean');
    expect(bridge.hapticCount).toBe(3);
  });

  it('salva e carrega snapshot via fallback em memória', () => {
    const bridge = new CapacitorBridgeService();
    expect(SNAPSHOT_STORAGE_KEY).toBe('beakbreaker.snapshot.v1');
    expect(bridge.loadProgressSnapshot()).toBeNull();
    const saved = bridge.saveProgressSnapshot({
      milho: 1234,
      coroas: 77,
      sedeLevel: 3,
      currentPity: 42,
      ageVerified: true,
    });
    expect(typeof saved.savedAt).toBe('string');
    const loaded = bridge.loadProgressSnapshot();
    expect(loaded).toEqual(saved);
    bridge.clearProgressSnapshot();
    expect(bridge.loadProgressSnapshot()).toBeNull();
  });

  it('retorna null para dados inválidos', () => {
    const bridge = new CapacitorBridgeService();
    bridge.writeRawSnapshotForTesting('{não é json');
    expect(bridge.loadProgressSnapshot()).toBeNull();
    bridge.writeRawSnapshotForTesting(JSON.stringify({ milho: 'muito', coroas: 1 }));
    expect(bridge.loadProgressSnapshot()).toBeNull();
    expect(isValidProgressSnapshot(null)).toBe(false);
    expect(
      isValidProgressSnapshot({ milho: 1, coroas: 1, sedeLevel: 1, currentPity: 0, ageVerified: false }),
    ).toBe(true);
  });
});

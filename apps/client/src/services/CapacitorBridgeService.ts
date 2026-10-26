// Ponte de plataforma: Web -> Capacitor (Android/iOS).
// Seguro para Node (testes): todo acesso a window/navigator/localStorage é protegido.

export type BridgePlatform = 'web' | 'android' | 'ios';
export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface ProgressSnapshot {
  milho: number;
  coroas: number;
  sedeLevel: number;
  currentPity: number;
  ageVerified: boolean;
  savedAt?: string;
}

export const SNAPSHOT_STORAGE_KEY = 'beakbreaker.snapshot.v1';

export const HAPTIC_DURATIONS_MS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
};

interface CapacitorGlobal {
  getPlatform?: () => string;
}

function getGlobal(): Record<string, unknown> {
  return globalThis as unknown as Record<string, unknown>;
}

function getSafeLocalStorage(): Storage | null {
  try {
    const ls = getGlobal().localStorage as Storage | undefined;
    if (!ls || typeof ls.getItem !== 'function') return null;
    return ls;
  } catch {
    return null;
  }
}

export function isValidProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const isNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  return (
    isNum(v.milho) &&
    isNum(v.coroas) &&
    isNum(v.sedeLevel) &&
    isNum(v.currentPity) &&
    typeof v.ageVerified === 'boolean' &&
    (v.savedAt === undefined || typeof v.savedAt === 'string')
  );
}

export class CapacitorBridgeService {
  public hapticCount = 0;
  private readonly memoryStore = new Map<string, string>();

  getPlatform(): BridgePlatform {
    try {
      const win = getGlobal().window as Record<string, unknown> | undefined;
      const cap = (win?.Capacitor ?? getGlobal().Capacitor) as CapacitorGlobal | undefined;
      const platform = cap?.getPlatform?.();
      if (platform === 'android' || platform === 'ios') return platform;
    } catch {
      // ignora: cai para web
    }
    return 'web';
  }

  getPlatformLabel(): string {
    const platform = this.getPlatform();
    if (platform === 'android') return 'Android';
    if (platform === 'ios') return 'iOS';
    return 'Web → Capacitor Ready';
  }

  triggerWoodcutHaptic(intensity: HapticIntensity): boolean {
    this.hapticCount += 1;
    try {
      const nav = getGlobal().navigator as Navigator | undefined;
      if (nav && typeof nav.vibrate === 'function') {
        return nav.vibrate(HAPTIC_DURATIONS_MS[intensity]);
      }
    } catch {
      // vibração indisponível
    }
    return false;
  }

  private writeRaw(key: string, value: string): void {
    const ls = getSafeLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch {
        // cota cheia ou bloqueado: usa memória
      }
    }
    this.memoryStore.set(key, value);
  }

  private readRaw(key: string): string | null {
    const ls = getSafeLocalStorage();
    if (ls) {
      try {
        const stored = ls.getItem(key);
        if (stored !== null) return stored;
      } catch {
        // cai para memória
      }
    }
    return this.memoryStore.get(key) ?? null;
  }

  saveProgressSnapshot(snapshot: ProgressSnapshot): ProgressSnapshot {
    const record: ProgressSnapshot = {
      milho: snapshot.milho,
      coroas: snapshot.coroas,
      sedeLevel: snapshot.sedeLevel,
      currentPity: snapshot.currentPity,
      ageVerified: snapshot.ageVerified,
      savedAt: snapshot.savedAt ?? new Date().toISOString(),
    };
    this.writeRaw(SNAPSHOT_STORAGE_KEY, JSON.stringify(record));
    return record;
  }

  loadProgressSnapshot(): ProgressSnapshot | null {
    const raw = this.readRaw(SNAPSHOT_STORAGE_KEY);
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValidProgressSnapshot(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  clearProgressSnapshot(): void {
    const ls = getSafeLocalStorage();
    if (ls) {
      try {
        ls.removeItem(SNAPSHOT_STORAGE_KEY);
      } catch {
        // ignora
      }
    }
    this.memoryStore.delete(SNAPSHOT_STORAGE_KEY);
  }

  /** Uso interno/testes: grava texto bruto na chave do snapshot. */
  writeRawSnapshotForTesting(raw: string): void {
    this.writeRaw(SNAPSHOT_STORAGE_KEY, raw);
  }
}

export const capacitorBridge = new CapacitorBridgeService();

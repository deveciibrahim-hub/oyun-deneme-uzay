// Kalıcı kayıt (altın, açılan gezegenler, yükseltmeler, ayarlar).
// Şimdilik localStorage; ileride Capacitor Preferences'a taşınabilir.

export type Lang = 'tr' | 'en';

export interface SaveData {
  gold: number;
  unlocked: number; // oynanabilir en yüksek gezegen indeksi
  upgrades: Record<string, number>;
  lang: Lang | null;
  sound: boolean;
  seenHintOrbit: boolean;
  seenHintTransit: boolean;
  bestWave: Record<string, number>;
}

const KEY = 'uzay_save_v1';

function defaults(): SaveData {
  return {
    gold: 0,
    unlocked: 0,
    upgrades: {},
    lang: null,
    sound: true,
    seenHintOrbit: false,
    seenHintTransit: false,
    bestWave: {}
  };
}

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export const Save = {
  data: read(),

  persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* depolama kapalıysa oyun yine çalışır */
    }
  },

  addGold(n: number): void {
    this.data.gold = Math.max(0, Math.round(this.data.gold + n));
    this.persist();
  },

  level(id: string): number {
    return this.data.upgrades[id] ?? 0;
  },

  unlock(index: number): void {
    if (index > this.data.unlocked) {
      this.data.unlocked = index;
      this.persist();
    }
  },

  reset(): void {
    this.data = defaults();
    this.persist();
  }
};

import type { TKey } from '../core/i18n';
import type { RunBonus } from './upgrades';

// Dalga aralarında seçilen roguelite kartlar (sadece o gezegen için geçerli)
export interface CardDef {
  id: string;
  nameKey: TKey;
  descKey: TKey;
  color: number;
  apply: (b: RunBonus, ctx: CardContext) => void;
  available?: (b: RunBonus, ctx: CardContext) => boolean;
}

export interface CardContext {
  repairPlanet: (n: number) => void;
  chargeNuke: () => void;
  addShield: (n: number) => void;
  barrelsNow: number;
}

export const CARDS: CardDef[] = [
  { id: 'rapid', nameKey: 'c_rapid', descKey: 'c_rapid_d', color: 0x00f0ff, apply: (b) => { b.fireRateMul *= 0.85; } },
  { id: 'power', nameKey: 'c_power', descKey: 'c_power_d', color: 0xff2a6d, apply: (b) => { b.damage += 1; } },
  { id: 'twin', nameKey: 'c_twin', descKey: 'c_twin_d', color: 0x7cff6b, apply: (b) => { b.barrels += 1; }, available: (_b, c) => c.barrelsNow < 3 },
  { id: 'missile', nameKey: 'c_missile', descKey: 'c_missile_d', color: 0xffcc00, apply: (b) => { b.missile += 1; } },
  { id: 'shield', nameKey: 'c_shield', descKey: 'c_shield_d', color: 0x4fc3ff, apply: (_b, c) => { c.addShield(1); } },
  { id: 'repair', nameKey: 'c_repair', descKey: 'c_repair_d', color: 0x00ff88, apply: (_b, c) => { c.repairPlanet(30); } },
  { id: 'pierce', nameKey: 'c_pierce', descKey: 'c_pierce_d', color: 0xc77dff, apply: (b) => { b.pierce += 1; } },
  { id: 'engine', nameKey: 'c_engine', descKey: 'c_engine_d', color: 0xff9f1c, apply: (b) => { b.orbitMul *= 1.25; } },
  { id: 'nuke', nameKey: 'c_nuke', descKey: 'c_nuke_d', color: 0xff5500, apply: (_b, c) => { c.chargeNuke(); } }
];

export function pickCards(b: RunBonus, ctx: CardContext, n = 3): CardDef[] {
  const pool = CARDS.filter((c) => !c.available || c.available(b, ctx));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

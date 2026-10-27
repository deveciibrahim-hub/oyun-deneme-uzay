import type { TKey } from '../core/i18n';
import { Save } from '../core/save';

export interface UpgradeDef {
  id: string;
  nameKey: TKey;
  descKey: TKey;
  max: number;
  baseCost: number;
  costMul: number;
  icon: string;
}

// Kalıcı (altınla alınan) yükseltmeler — eski sürümün mağazası korunarak genişletildi.
export const UPGRADES: UpgradeDef[] = [
  { id: 'fireRate', nameKey: 'u_fireRate', descKey: 'u_fireRate_d', max: 8, baseCost: 50, costMul: 1.5, icon: '⚡' },
  { id: 'damage', nameKey: 'u_damage', descKey: 'u_damage_d', max: 6, baseCost: 80, costMul: 1.6, icon: '✦' },
  { id: 'twin', nameKey: 'u_twin', descKey: 'u_twin_d', max: 1, baseCost: 150, costMul: 1, icon: '⇈' },
  { id: 'missile', nameKey: 'u_missile', descKey: 'u_missile_d', max: 4, baseCost: 200, costMul: 1.7, icon: '➶' },
  { id: 'shield', nameKey: 'u_shield', descKey: 'u_shield_d', max: 3, baseCost: 100, costMul: 1.8, icon: '◎' },
  { id: 'armor', nameKey: 'u_armor', descKey: 'u_armor_d', max: 5, baseCost: 80, costMul: 1.5, icon: '⬢' },
  { id: 'orbit', nameKey: 'u_orbit', descKey: 'u_orbit_d', max: 4, baseCost: 40, costMul: 1.6, icon: '↻' }
];

export function upgradeCost(u: UpgradeDef, level: number): number {
  return Math.round(u.baseCost * Math.pow(u.costMul, level));
}

// Bir bölüm içindeki geçici (kart) bonusları
export interface RunBonus {
  fireRateMul: number;
  damage: number;
  barrels: number;
  missile: number;
  shield: number;
  pierce: number;
  orbitMul: number;
}

export function emptyBonus(): RunBonus {
  return { fireRateMul: 1, damage: 0, barrels: 0, missile: 0, shield: 0, pierce: 0, orbitMul: 1 };
}

export interface ShipStats {
  fireInterval: number; // ms
  damage: number;
  barrels: number; // 1..3
  missileLevel: number;
  startShield: number;
  planetMaxHp: number;
  orbitSpeed: number; // rad/sn (klavye ve maks dönüş)
  pierce: number;
}

export function computeStats(b: RunBonus): ShipStats {
  const L = (id: string) => Save.level(id);
  return {
    fireInterval: Math.max(90, 360 * Math.pow(0.88, L('fireRate')) * b.fireRateMul),
    damage: 1 + L('damage') + b.damage,
    barrels: Math.min(3, 1 + L('twin') + b.barrels),
    missileLevel: Math.min(6, L('missile') + b.missile),
    startShield: L('shield') + b.shield,
    planetMaxHp: 100 + 20 * L('armor'),
    orbitSpeed: 3.2 * (1 + 0.15 * L('orbit')) * b.orbitMul,
    pierce: b.pierce
  };
}

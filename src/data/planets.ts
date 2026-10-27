import type { TKey } from '../core/i18n';

export type PlanetStyle = 'earth' | 'craters' | 'bands' | 'smooth';

export interface PlanetDef {
  id: string;
  nameKey: TKey;
  radius: number;
  colors: [string, string, string]; // açık, orta, koyu
  glow: string;
  style: PlanetStyle;
  ring?: boolean;
  bandColors?: string[];
}

// Bizim güneş sistemimiz — içten dışa. Dünya'dan başlayıp istilayı dış gezegenlere doğru püskürtüyoruz.
export const PLANETS: PlanetDef[] = [
  { id: 'earth', nameKey: 'p_earth', radius: 150, colors: ['#6fb8ff', '#1565c0', '#041633'], glow: '#3fb6ff', style: 'earth' },
  { id: 'mars', nameKey: 'p_mars', radius: 132, colors: ['#ff9c70', '#c1440e', '#3a0f04'], glow: '#ff7043', style: 'craters' },
  { id: 'jupiter', nameKey: 'p_jupiter', radius: 172, colors: ['#f6dcb4', '#c58b53', '#3d2410'], glow: '#ffcc88', style: 'bands', bandColors: ['#e8c39a', '#b5763f', '#f3e1c5', '#9c5b2e', '#d9a46e'] },
  { id: 'saturn', nameKey: 'p_saturn', radius: 158, colors: ['#fbe9b7', '#d6b46a', '#46371a'], glow: '#ffe7a0', style: 'bands', ring: true, bandColors: ['#efd79a', '#c9a55c', '#f6e6bd'] },
  { id: 'uranus', nameKey: 'p_uranus', radius: 145, colors: ['#c8fffb', '#4fd1d9', '#0b3c45'], glow: '#7ffff4', style: 'smooth' },
  { id: 'neptune', nameKey: 'p_neptune', radius: 145, colors: ['#8aa2ff', '#2a3fd6', '#08104a'], glow: '#5a7bff', style: 'bands', bandColors: ['#3b52e0', '#5b74ff', '#2234b8'] }
];

export type EnemyKind = 'meteor' | 'fire' | 'ice' | 'armored' | 'fighter' | 'kamikaze' | 'boss';

export interface WavePlan {
  count: number;
  interval: number; // saniye
  weights: Partial<Record<EnemyKind, number>>;
  boss: boolean;
}

export function waveCount(p: number): number {
  return 4 + Math.floor(p / 2);
}

export function wavePlan(p: number, w: number): WavePlan {
  const total = waveCount(p);
  const weights: Partial<Record<EnemyKind, number>> = { meteor: 1 };
  if (w >= 2 || p >= 1) weights.fire = 0.3;
  if (p >= 1) weights.ice = 0.25;
  if (p >= 2) weights.armored = 0.2;
  if (w >= 3 || p >= 1) weights.fighter = 0.15 + 0.05 * p;
  if (p >= 1) weights.kamikaze = 0.15 + 0.04 * p;
  return {
    count: 9 + 4 * w + 5 * p,
    interval: Math.max(0.28, 1.2 - 0.08 * w - 0.08 * p),
    weights,
    boss: w === total
  };
}

export interface EnemyStats { hp: number; dmg: number; gold: number; speed: number; scale: number; radius: number; }

// Gezegen ilerledikçe: hız +%8, can +%35, gezegene verilen hasar +%12 (her gezegen için)
export function enemyStats(kind: EnemyKind, p: number): EnemyStats {
  const sp = 1 + 0.08 * p;
  const hpM = 1 + 0.35 * p;
  const dM = 1 + 0.12 * p;
  const hp = (n: number) => Math.max(1, Math.round(n * hpM));
  const dm = (n: number) => Math.round(n * dM);
  switch (kind) {
    case 'meteor': return { hp: hp(1), dmg: dm(8), gold: 3, speed: 85 * sp, scale: 0.8 + Math.random() * 0.4, radius: 38 };
    case 'fire': return { hp: hp(1), dmg: dm(10), gold: 4, speed: 140 * sp, scale: 0.75, radius: 38 };
    case 'ice': return { hp: hp(3), dmg: dm(10), gold: 6, speed: 60 * sp, scale: 0.95, radius: 38 };
    case 'armored': return { hp: hp(6), dmg: dm(18), gold: 10, speed: 48 * sp, scale: 1.35, radius: 38 };
    case 'fighter': return { hp: hp(3), dmg: dm(3), gold: 8, speed: 160 * sp, scale: 1, radius: 40 };
    case 'kamikaze': return { hp: hp(2), dmg: dm(14), gold: 6, speed: 190 * sp, scale: 1, radius: 28 };
    case 'boss': return { hp: 50 + 45 * p, dmg: dm(5), gold: 60 + 20 * p, speed: 90, scale: 1, radius: 110 };
  }
}

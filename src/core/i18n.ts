import { Save, Lang } from './save';

const tr = {
  title: 'DÜNYA SAVUNMASI',
  subtitle: 'Güneş sistemini istilaya karşı koru',
  shop: 'MAĞAZA',
  back: 'GERİ',
  play: 'SAVUN',
  locked: 'KİLİTLİ',
  gold: 'Altın',
  wave: 'Dalga',
  planetHp: 'Gezegen',
  hull: 'Gövde',
  pause: 'DURAKLATILDI',
  resume: 'DEVAM',
  map: 'HARİTA',
  retry: 'TEKRAR',
  next: 'YOLCULUĞA ÇIK',
  continueTo: 'DEVAM',
  nuke: 'NÜKLEER',
  chooseCard: 'GÜÇLENDİRME SEÇ',
  planetSafe: 'GEZEGEN GÜVENDE!',
  planetLost: 'GEZEGEN DÜŞTÜ',
  shipLost: 'GEMİ YOK OLDU',
  arrived: 'VARDIK!',
  earned: 'Kazanılan altın',
  watchAd: '2X ALTIN (REKLAM)',
  adDone: 'Altın ikiye katlandı',
  toPlanet: '{p} yolunda',
  hintOrbit: 'Ekranda sağa-sola kaydır:\ngemi yörüngede döner.\nAteş otomatik.',
  hintTransit: 'Sağa-sola kaydır.\nMeteorlardan kaç, düşmanı vur!',
  boss: 'ANA GEMİ',
  maxed: 'MAKS',
  owned: 'ALINDI',
  sound: 'SES',
  on: 'AÇIK',
  off: 'KAPALI',
  lang: 'DİL',
  allClear: 'GÜNEŞ SİSTEMİ KURTARILDI!',
  waveIncoming: 'DALGA {n}',
  bossIncoming: 'ANA GEMİ YAKLAŞIYOR!',
  // gezegenler
  p_earth: 'Dünya', p_mars: 'Mars', p_jupiter: 'Jüpiter', p_saturn: 'Satürn', p_uranus: 'Uranüs', p_neptune: 'Neptün',
  // kalıcı yükseltmeler
  u_fireRate: 'Ateş Hızı', u_fireRate_d: 'Lazer daha sık ateşlenir',
  u_damage: 'Lazer Gücü', u_damage_d: 'Her atış +1 hasar',
  u_twin: 'Çift Lazer', u_twin_d: 'Kalıcı çift namlu',
  u_missile: 'Güdümlü Füze', u_missile_d: 'Otomatik hedef bulan füze',
  u_shield: 'Gemi Kalkanı', u_shield_d: 'Her bölüme +1 kalkanla başla',
  u_armor: 'Gezegen Zırhı', u_armor_d: 'Gezegen canı +20',
  u_orbit: 'Motor', u_orbit_d: 'Gemi daha hızlı döner',
  // kartlar
  c_rapid: 'Seri Ateş', c_rapid_d: 'Ateş hızı +%15',
  c_power: 'Aşırı Yük', c_power_d: 'Hasar +1',
  c_twin: 'Ek Namlu', c_twin_d: '+1 namlu',
  c_missile: 'Füze Bölmesi', c_missile_d: 'Füze seviyesi +1',
  c_shield: 'Kalkan Hücresi', c_shield_d: '+1 kalkan katmanı',
  c_repair: 'Onarım Dronları', c_repair_d: 'Gezegen +30 can',
  c_pierce: 'Delici Işın', c_pierce_d: 'Mermiler +1 hedef deler',
  c_engine: 'Hızlı Motor', c_engine_d: 'Dönüş hızı +%25',
  c_nuke: 'Hazır Nükleer', c_nuke_d: 'Nükleer hemen dolar'
};

type Dict = typeof tr;
export type TKey = keyof Dict;

const en: Dict = {
  title: 'EARTH DEFENSE',
  subtitle: 'Defend the solar system from the invasion',
  shop: 'SHOP',
  back: 'BACK',
  play: 'DEFEND',
  locked: 'LOCKED',
  gold: 'Gold',
  wave: 'Wave',
  planetHp: 'Planet',
  hull: 'Hull',
  pause: 'PAUSED',
  resume: 'RESUME',
  map: 'MAP',
  retry: 'RETRY',
  next: 'LAUNCH',
  continueTo: 'CONTINUE',
  nuke: 'NUKE',
  chooseCard: 'CHOOSE AN UPGRADE',
  planetSafe: 'PLANET SAVED!',
  planetLost: 'PLANET FELL',
  shipLost: 'SHIP DESTROYED',
  arrived: 'ARRIVED!',
  earned: 'Gold earned',
  watchAd: '2X GOLD (AD)',
  adDone: 'Gold doubled',
  toPlanet: 'En route to {p}',
  hintOrbit: 'Swipe left-right:\nyour ship orbits the planet.\nFiring is automatic.',
  hintTransit: 'Swipe left-right.\nDodge meteors, shoot enemies!',
  boss: 'MOTHERSHIP',
  maxed: 'MAX',
  owned: 'OWNED',
  sound: 'SOUND',
  on: 'ON',
  off: 'OFF',
  lang: 'LANG',
  allClear: 'SOLAR SYSTEM SAVED!',
  waveIncoming: 'WAVE {n}',
  bossIncoming: 'MOTHERSHIP INBOUND!',
  p_earth: 'Earth', p_mars: 'Mars', p_jupiter: 'Jupiter', p_saturn: 'Saturn', p_uranus: 'Uranus', p_neptune: 'Neptune',
  u_fireRate: 'Fire Rate', u_fireRate_d: 'Lasers fire more often',
  u_damage: 'Laser Power', u_damage_d: '+1 damage per shot',
  u_twin: 'Twin Laser', u_twin_d: 'Permanent double barrel',
  u_missile: 'Homing Missile', u_missile_d: 'Auto-targeting missiles',
  u_shield: 'Ship Shield', u_shield_d: 'Start each level with +1 shield',
  u_armor: 'Planet Armor', u_armor_d: 'Planet HP +20',
  u_orbit: 'Engine', u_orbit_d: 'Ship rotates faster',
  c_rapid: 'Rapid Fire', c_rapid_d: 'Fire rate +15%',
  c_power: 'Overcharge', c_power_d: 'Damage +1',
  c_twin: 'Extra Barrel', c_twin_d: '+1 barrel',
  c_missile: 'Missile Bay', c_missile_d: 'Missile level +1',
  c_shield: 'Shield Cell', c_shield_d: '+1 shield layer',
  c_repair: 'Repair Drones', c_repair_d: 'Planet +30 HP',
  c_pierce: 'Piercing Beam', c_pierce_d: 'Shots pierce +1 target',
  c_engine: 'Fast Engine', c_engine_d: 'Rotation speed +25%',
  c_nuke: 'Ready Nuke', c_nuke_d: 'Nuke charges instantly'
};

const dicts: Record<Lang, Dict> = { tr, en };

export function currentLang(): Lang {
  if (Save.data.lang) return Save.data.lang;
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'tr').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}

export function t(key: TKey, vars?: Record<string, string | number>): string {
  let s = dicts[currentLang()][key] ?? String(key);
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

export function toggleLang(): void {
  Save.data.lang = currentLang() === 'tr' ? 'en' : 'tr';
  Save.persist();
}

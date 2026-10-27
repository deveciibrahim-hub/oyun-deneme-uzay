// Tüm görseller kodla (Canvas 2D) üretilir — neon tarz. Gerçek asset gelince aynı anahtarlarla değiştirilebilir.
import Phaser from 'phaser';
import { PLANETS, PlanetDef } from '../data/planets';

type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void;

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return;
  const ct = scene.textures.createCanvas(key, w, h);
  if (!ct) return;
  const c = ct.getContext();
  c.save();
  draw(c, w, h);
  c.restore();
  ct.refresh();
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function glowCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function meteor(c: CanvasRenderingContext2D, w: number, h: number, seed: number, fill: string, stroke: string, glow: string | null, kind: string): void {
  const r = rng(seed);
  const cx = w / 2, cy = h / 2, R = 38;
  const pts: [number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = R * (0.78 + r() * 0.3);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  if (glow) { c.shadowColor = glow; c.shadowBlur = 16; }
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  const g = c.createRadialGradient(cx - 12, cy - 12, 4, cx, cy, R);
  g.addColorStop(0, fill);
  g.addColorStop(1, stroke);
  c.fillStyle = g;
  c.fill();
  c.shadowBlur = 0;
  c.lineWidth = 3;
  c.strokeStyle = stroke;
  c.stroke();
  c.save();
  c.clip();
  if (kind === 'armored') {
    c.strokeStyle = 'rgba(200,215,235,0.5)';
    c.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 16, cy - R); c.lineTo(cx + i * 16 + 10, cy + R); c.stroke(); }
    c.fillStyle = '#c9d4e3';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * 50, cy + (r() - 0.5) * 50, 3, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'ice') {
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + (r() - 0.5) * 80, cy + (r() - 0.5) * 80); c.stroke(); }
  } else {
    for (let i = 0; i < 5; i++) {
      const x = cx + (r() - 0.5) * 50, y = cy + (r() - 0.5) * 50, rr = 4 + r() * 7;
      c.fillStyle = kind === 'fire' ? 'rgba(255,220,120,0.55)' : 'rgba(0,0,0,0.28)';
      c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
}

function drawPlanet(c: CanvasRenderingContext2D, w: number, h: number, p: PlanetDef): void {
  const cx = w / 2, cy = h / 2, R = p.radius;
  const r = rng(p.id.length * 977 + R);
  // atmosfer parlaması
  const halo = c.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
  halo.addColorStop(0, p.glow + 'aa');
  halo.addColorStop(1, p.glow + '00');
  c.fillStyle = halo;
  c.beginPath(); c.arc(cx, cy, R * 1.35, 0, Math.PI * 2); c.fill();

  if (p.ring) drawRing(c, cx, cy, R, 'back');

  c.save();
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
  const base = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
  base.addColorStop(0, p.colors[0]);
  base.addColorStop(0.55, p.colors[1]);
  base.addColorStop(1, p.colors[2]);
  c.fillStyle = base;
  c.fillRect(cx - R, cy - R, R * 2, R * 2);

  if (p.style === 'earth') {
    c.fillStyle = 'rgba(70,180,90,0.85)';
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      const x = cx + (r() - 0.5) * R * 1.6, y = cy + (r() - 0.5) * R * 1.6;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2, rr = R * (0.12 + r() * 0.2);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        k ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath(); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.ellipse(cx + (r() - 0.5) * R * 1.8, cy + (r() - 0.5) * R * 1.8, R * (0.15 + r() * 0.25), R * 0.06, r() * 0.6 - 0.3, 0, Math.PI * 2);
      c.fill();
    }
  } else if (p.style === 'craters') {
    for (let i = 0; i < 14; i++) {
      const x = cx + (r() - 0.5) * R * 1.8, y = cy + (r() - 0.5) * R * 1.8, rr = R * (0.04 + r() * 0.1);
      c.fillStyle = 'rgba(60,15,5,0.35)';
      c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,200,170,0.25)'; c.lineWidth = 2; c.stroke();
    }
  } else if (p.style === 'bands') {
    const bands = p.bandColors ?? [p.colors[0]];
    let y = cy - R;
    let i = 0;
    while (y < cy + R) {
      const hgt = R * (0.08 + r() * 0.16);
      c.fillStyle = bands[i % bands.length] + '99';
      c.beginPath();
      c.moveTo(cx - R, y);
      for (let x = -R; x <= R; x += R / 8) c.lineTo(cx + x, y + Math.sin(x * 0.05 + i) * 4);
      c.lineTo(cx + R, y + hgt); c.lineTo(cx - R, y + hgt); c.closePath(); c.fill();
      y += hgt; i++;
    }
    if (p.id === 'jupiter') {
      c.fillStyle = 'rgba(190,80,40,0.8)';
      c.beginPath(); c.ellipse(cx + R * 0.3, cy + R * 0.35, R * 0.2, R * 0.11, 0, 0, Math.PI * 2); c.fill();
    }
  } else {
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath(); c.ellipse(cx, cy - R * 0.3, R, R * 0.2, 0, 0, Math.PI * 2); c.fill();
  }
  // gece tarafı gölgesi
  const shade = c.createRadialGradient(cx - R * 0.5, cy - R * 0.5, R * 0.6, cx, cy, R * 1.5);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,10,0.75)');
  c.fillStyle = shade;
  c.fillRect(cx - R, cy - R, R * 2, R * 2);
  c.restore();

  c.strokeStyle = p.glow + 'cc';
  c.lineWidth = 3;
  c.beginPath(); c.arc(cx, cy, R, Math.PI * 1.05, Math.PI * 1.65); c.stroke();

  if (p.ring) drawRing(c, cx, cy, R, 'front');
}

function drawRing(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, part: 'back' | 'front'): void {
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.35);
  c.beginPath();
  if (part === 'back') c.rect(-R * 2.2, -R * 1.2, R * 4.4, R * 1.2);
  else c.rect(-R * 2.2, 0, R * 4.4, R * 1.2);
  c.clip();
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = `rgba(240,215,150,${0.55 - i * 0.1})`;
    c.lineWidth = 9 - i * 1.5;
    c.beginPath();
    c.ellipse(0, 0, R * (1.45 + i * 0.13), R * (0.36 + i * 0.035), 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

export function planetTextureSize(p: PlanetDef): number {
  return Math.ceil(p.radius * (p.ring ? 4.6 : 2.8));
}

export function buildTextures(scene: Phaser.Scene): void {
  // Oyuncu gemisi (yukarı bakar)
  tex(scene, 'ship', 110, 130, (c, w, h) => {
    c.translate(w / 2, h / 2);
    glowCircle(c, 0, 40, 26, 'rgba(255,170,40,0.9)', 'rgba(255,80,0,0)');
    c.shadowColor = '#00f0ff'; c.shadowBlur = 20;
    c.beginPath();
    c.moveTo(0, -52); c.lineTo(16, -10); c.lineTo(44, 30); c.lineTo(40, 40); c.lineTo(14, 28);
    c.lineTo(0, 36); c.lineTo(-14, 28); c.lineTo(-40, 40); c.lineTo(-44, 30); c.lineTo(-16, -10); c.closePath();
    const g = c.createLinearGradient(0, -52, 0, 40);
    g.addColorStop(0, '#9ff8ff'); g.addColorStop(0.5, '#00a8e8'); g.addColorStop(1, '#063a6b');
    c.fillStyle = g; c.fill();
    c.shadowBlur = 0;
    c.lineWidth = 3; c.strokeStyle = '#d9fdff'; c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(0, -8, 7, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff2a6d';
    c.fillRect(-38, 26, 8, 8); c.fillRect(30, 26, 8, 8);
  });

  tex(scene, 'bullet', 18, 48, (c, w, h) => {
    c.shadowColor = '#00f0ff'; c.shadowBlur = 10;
    c.fillStyle = '#bffcff';
    c.beginPath(); c.roundRect(5, 5, w - 10, h - 10, 4); c.fill();
  });
  tex(scene, 'bulletP', 20, 52, (c, w, h) => {
    c.shadowColor = '#ff2a6d'; c.shadowBlur = 12;
    c.fillStyle = '#ffd1e0';
    c.beginPath(); c.roundRect(5, 5, w - 10, h - 10, 4); c.fill();
  });
  tex(scene, 'ebullet', 30, 30, (c, w, h) => {
    glowCircle(c, w / 2, h / 2, 14, 'rgba(255,255,255,1)', 'rgba(255,40,80,0)');
    glowCircle(c, w / 2, h / 2, 7, 'rgba(255,240,240,1)', 'rgba(255,60,90,0.9)');
  });
  tex(scene, 'missile', 20, 40, (c, w) => {
    glowCircle(c, w / 2, 34, 8, 'rgba(255,200,80,1)', 'rgba(255,100,0,0)');
    c.shadowColor = '#ffcc00'; c.shadowBlur = 8;
    c.fillStyle = '#ffe066';
    c.beginPath(); c.moveTo(w / 2, 2); c.lineTo(w / 2 + 6, 12); c.lineTo(w / 2 + 6, 30); c.lineTo(w / 2 - 6, 30); c.lineTo(w / 2 - 6, 12); c.closePath(); c.fill();
  });
  tex(scene, 'spark', 32, 32, (c, w, h) => glowCircle(c, w / 2, h / 2, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'));
  tex(scene, 'dot', 8, 8, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(4, 4, 3, 0, Math.PI * 2); c.fill(); });
  tex(scene, 'ringFx', 128, 128, (c, w, h) => {
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.shadowColor = '#fff'; c.shadowBlur = 12;
    c.beginPath(); c.arc(w / 2, h / 2, 54, 0, Math.PI * 2); c.stroke();
  });

  // Meteorlar: her türden 3 varyasyon
  const mk: [string, string, string, string | null][] = [
    ['meteor', '#9aa3ad', '#3a3f47', null],
    ['fire', '#ffb05c', '#a8321a', '#ff5a00'],
    ['ice', '#c9fff8', '#2a9a96', '#7ffff4'],
    ['armored', '#8e9bb3', '#2c3446', '#9fb4d8']
  ];
  mk.forEach(([k, f, s, gl], ki) => {
    for (let v = 0; v < 3; v++) tex(scene, `${k}_${v}`, 100, 100, (c, w, h) => meteor(c, w, h, ki * 31 + v * 7 + 3, f, s, gl, k));
  });

  // Düşman avcı (dairesel tabla)
  tex(scene, 'fighter', 120, 96, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.shadowColor = '#ff2a6d'; c.shadowBlur = 18;
    c.fillStyle = '#3b0a2a';
    c.beginPath(); c.ellipse(0, 6, 50, 22, 0, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.lineWidth = 4; c.strokeStyle = '#ff2a6d'; c.stroke();
    c.fillStyle = '#ff7aa8';
    c.beginPath(); c.ellipse(0, -6, 20, 16, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = '#ffe3ee';
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 17, 10, 4, 0, Math.PI * 2); c.fill(); }
  });
  // Kamikaze (yukarı bakan ok — dönüşte hareket yönüne çevrilir)
  tex(scene, 'kamikaze', 76, 90, (c, w, h) => {
    c.translate(w / 2, h / 2);
    glowCircle(c, 0, 32, 16, 'rgba(255,190,60,0.9)', 'rgba(255,90,0,0)');
    c.shadowColor = '#ff9f1c'; c.shadowBlur = 16;
    c.fillStyle = '#5a2a00';
    c.beginPath(); c.moveTo(0, -38); c.lineTo(28, 26); c.lineTo(0, 14); c.lineTo(-28, 26); c.closePath(); c.fill();
    c.shadowBlur = 0; c.lineWidth = 4; c.strokeStyle = '#ff9f1c'; c.stroke();
    c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(0, -4, 6, 0, Math.PI * 2); c.fill();
  });
  // Ana gemi (boss)
  tex(scene, 'boss', 320, 230, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.shadowColor = '#c400ff'; c.shadowBlur = 30;
    c.fillStyle = '#2a0838';
    c.beginPath();
    c.moveTo(0, -90); c.lineTo(70, -40); c.lineTo(140, -10); c.lineTo(120, 40); c.lineTo(60, 30);
    c.lineTo(30, 90); c.lineTo(-30, 90); c.lineTo(-60, 30); c.lineTo(-120, 40); c.lineTo(-140, -10); c.lineTo(-70, -40); c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.lineWidth = 5; c.strokeStyle = '#ff2a6d'; c.stroke();
    c.strokeStyle = 'rgba(200,120,255,0.6)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-100, 0); c.lineTo(100, 0); c.moveTo(-50, -40); c.lineTo(-20, 60); c.moveTo(50, -40); c.lineTo(20, 60); c.stroke();
    glowCircle(c, 0, 5, 38, 'rgba(255,255,255,1)', 'rgba(255,0,60,0)');
    glowCircle(c, 0, 5, 20, 'rgba(255,220,220,1)', 'rgba(255,0,60,1)');
  });

  // Güçlendirme kapsülleri
  const pu = (key: string, col: string, label: string) =>
    tex(scene, key, 84, 84, (c, w, h) => {
      c.shadowColor = col; c.shadowBlur = 16;
      c.fillStyle = 'rgba(10,15,30,0.9)';
      c.beginPath(); c.arc(w / 2, h / 2, 30, 0, Math.PI * 2); c.fill();
      c.lineWidth = 5; c.strokeStyle = col; c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = '#ffffff'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, w / 2, h / 2 + 1);
    });
  pu('pu_double', '#00f0ff', '2X');
  pu('pu_damage', '#ff2a6d', '+5');
  pu('pu_gold', '#ffd700', '$');

  // Yıldız alanı (kayan arka plan için)
  tex(scene, 'starfield', 540, 960, (c, w, h) => {
    const r = rng(42);
    for (let i = 0; i < 140; i++) {
      const s = r() < 0.85 ? 1 + r() * 1.2 : 2 + r() * 1.5;
      c.fillStyle = `rgba(${200 + r() * 55},${210 + r() * 45},255,${0.25 + r() * 0.7})`;
      c.beginPath(); c.arc(r() * w, r() * h, s, 0, Math.PI * 2); c.fill();
    }
  });
  tex(scene, 'nebula', 512, 512, (c, w, h) => {
    const r = rng(7);
    for (let i = 0; i < 6; i++) {
      const x = r() * w, y = r() * h, rr = 120 + r() * 160;
      const cols = ['rgba(120,40,200,0.10)', 'rgba(0,140,255,0.08)', 'rgba(255,40,120,0.06)'];
      glowCircle(c, x, y, rr, cols[i % 3], 'rgba(0,0,0,0)');
    }
  });

  // Gezegenler
  for (const p of PLANETS) {
    const s = planetTextureSize(p);
    tex(scene, `planet_${p.id}`, s, s, (c, w, h) => drawPlanet(c, w, h, p));
  }
  // Harita için küçük ikonlar (aynı çizim, küçük ölçek)
  tex(scene, 'lock', 64, 64, (c) => {
    c.strokeStyle = '#8899aa'; c.lineWidth = 6;
    c.beginPath(); c.arc(32, 26, 12, Math.PI, 0); c.stroke();
    c.fillStyle = '#8899aa'; c.beginPath(); c.roundRect(14, 26, 36, 28, 6); c.fill();
  });
}

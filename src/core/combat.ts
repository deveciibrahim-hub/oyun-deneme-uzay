// Yörünge ve geçiş sahnelerinin ortak savaş sistemi: mermiler, düşmanlar, füzeler, patlamalar.
// Hepsi nesne havuzu (object pooling) ile — sürekli yeni nesne yaratılmaz, mobilde takılma olmaz.
import Phaser from 'phaser';
import { EnemyKind, enemyStats } from '../data/planets';
import { Sfx } from './sfx';

export class Enemy extends Phaser.Physics.Arcade.Image {
  kind: EnemyKind = 'meteor';
  hp = 1;
  maxHp = 1;
  dmg = 0;
  gold = 0;
  rad = 30;
  spin = 0;
  speed = 0;
  state = 0; // davranış durumu (0: yaklaş, 1: yörünge/dolaş)
  fireAt = 0;
  orbitA = 0;
  orbitR = 0;
  orbitDir = 1;
  born = 0;
  flashUntil = 0;
}

export class Shot extends Phaser.Physics.Arcade.Image {
  dmg = 1;
  pierce = 0;
  hits = new Set<Enemy>();
}

export class Missile extends Phaser.Physics.Arcade.Image {
  dmg = 3;
  target: Enemy | null = null;
  life = 0;
}

export interface CombatHooks {
  onKill: (e: Enemy, byNuke: boolean) => void;
}

const TINTS: Record<string, number> = {
  meteor: 0xbbbbbb, fire: 0xff6a00, ice: 0x7ffff4, armored: 0x9fb4d8,
  fighter: 0xff2a6d, kamikaze: 0xff9f1c, boss: 0xc400ff
};

export class Combat {
  scene: Phaser.Scene;
  shots: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  eshots: Phaser.Physics.Arcade.Group;
  missiles: Phaser.Physics.Arcade.Group;
  pickups: Phaser.Physics.Arcade.Group;
  sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  hooks: CombatHooks;
  planetIndex: number;

  constructor(scene: Phaser.Scene, planetIndex: number, hooks: CombatHooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.planetIndex = planetIndex;
    this.shots = scene.physics.add.group({ classType: Shot, maxSize: 220, runChildUpdate: false });
    this.enemies = scene.physics.add.group({ classType: Enemy, maxSize: 160 });
    this.eshots = scene.physics.add.group({ maxSize: 160 });
    this.missiles = scene.physics.add.group({ classType: Missile, maxSize: 40 });
    this.pickups = scene.physics.add.group({ maxSize: 20 });
    this.sparks = scene.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 420 },
      lifespan: { min: 250, max: 700 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    }).setDepth(20);

    scene.physics.add.overlap(this.shots, this.enemies, (a, b) => this.onShotHit(a as Shot, b as Enemy), (a, b) => {
      const s = a as Shot, e = b as Enemy;
      return s.active && e.active && !s.hits.has(e);
    });
  }

  // --- Mermi ---
  fireShot(x: number, y: number, angle: number, dmg: number, pierce: number, power: boolean): void {
    const s = this.shots.get(x, y, power ? 'bulletP' : 'bullet') as Shot | null;
    if (!s) return;
    s.setTexture(power ? 'bulletP' : 'bullet');
    s.enableBody(true, x, y, true, true);
    s.setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    s.setRotation(angle + Math.PI / 2);
    s.dmg = dmg;
    s.pierce = pierce;
    s.hits.clear();
    (s.body as Phaser.Physics.Arcade.Body).setCircle(8, 1, 16);
    this.scene.physics.velocityFromRotation(angle, 1500, (s.body as Phaser.Physics.Arcade.Body).velocity);
  }

  private onShotHit(s: Shot, e: Enemy): void {
    s.hits.add(e);
    this.damage(e, s.dmg, s.x, s.y);
    if (s.pierce > 0) s.pierce--;
    else s.disableBody(true, true);
  }

  // --- Düşman ---
  spawn(kind: EnemyKind, x: number, y: number): Enemy | null {
    const tex = kind === 'fighter' || kind === 'kamikaze' || kind === 'boss' ? kind : `${kind}_${Phaser.Math.Between(0, 2)}`;
    const e = this.enemies.get(x, y, tex) as Enemy | null;
    if (!e) return null;
    const st = enemyStats(kind, this.planetIndex);
    e.setTexture(tex);
    e.enableBody(true, x, y, true, true);
    e.kind = kind;
    e.hp = e.maxHp = st.hp;
    e.dmg = st.dmg;
    e.gold = st.gold;
    e.speed = st.speed;
    e.setScale(st.scale);
    e.rad = st.radius * st.scale;
    e.spin = kind === 'meteor' || kind === 'fire' || kind === 'ice' || kind === 'armored' ? Phaser.Math.FloatBetween(-1.5, 1.5) : 0;
    e.state = 0;
    e.fireAt = this.scene.time.now + Phaser.Math.Between(900, 2000);
    e.orbitDir = Math.random() < 0.5 ? -1 : 1;
    e.born = this.scene.time.now;
    e.setDepth(kind === 'boss' ? 6 : 5);
    e.setRotation(0);
    e.clearTint();
    e.setAlpha(1);
    const body = e.body as Phaser.Physics.Arcade.Body;
    body.setCircle(st.radius, e.width / 2 - st.radius, e.height / 2 - st.radius);
    body.setVelocity(0, 0);
    return e;
  }

  damage(e: Enemy, dmg: number, hx: number, hy: number, byNuke = false): boolean {
    if (!e.active) return false;
    e.hp -= dmg;
    this.sparks.explode(3, hx, hy);
    if (e.hp <= 0) {
      this.kill(e, byNuke);
      return true;
    }
    Sfx.hit();
    e.setTint(0xff9090);
    e.flashUntil = this.scene.time.now + 70;
    return false;
  }

  kill(e: Enemy, byNuke = false): void {
    if (!e.active) return;
    const big = e.kind === 'boss' || e.kind === 'armored';
    this.explode(e.x, e.y, TINTS[e.kind] ?? 0xffffff, big ? 40 : 14, e.kind === 'boss' ? 2.2 : 1);
    if (e.kind === 'boss') Sfx.big(); else Sfx.explode();
    e.disableBody(true, true);
    this.hooks.onKill(e, byNuke);
  }

  remove(e: Enemy): void {
    e.disableBody(true, true);
  }

  explode(x: number, y: number, tint: number, count: number, scale = 1): void {
    this.sparks.setParticleTint(tint);
    this.sparks.setParticleScale(0.9 * scale, 0);
    this.sparks.explode(count, x, y);
    this.sparks.setParticleTint(0xffffff);
    this.sparks.setParticleScale(0.9, 0);
    const ring = this.scene.add.image(x, y, 'ringFx').setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setScale(0.2 * scale).setDepth(19);
    this.scene.tweens.add({ targets: ring, scale: 1.1 * scale, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
  }

  activeEnemies(): Enemy[] {
    return (this.enemies.getChildren() as Enemy[]).filter((e) => e.active);
  }

  // --- Düşman mermisi ---
  enemyFire(x: number, y: number, angle: number, speed: number, dmg: number): void {
    const b = this.eshots.get(x, y, 'ebullet') as Phaser.Physics.Arcade.Image | null;
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    b.setData('dmg', dmg);
    this.scene.physics.velocityFromRotation(angle, speed, (b.body as Phaser.Physics.Arcade.Body).velocity);
  }

  // --- Füze ---
  launchMissile(x: number, y: number, angle: number, dmg: number): void {
    const m = this.missiles.get(x, y, 'missile') as Missile | null;
    if (!m) return;
    m.enableBody(true, x, y, true, true);
    m.setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    m.dmg = dmg;
    m.life = 3200;
    m.target = null;
    m.setRotation(angle + Math.PI / 2);
    this.scene.physics.velocityFromRotation(angle, 420, (m.body as Phaser.Physics.Arcade.Body).velocity);
    Sfx.missile();
  }

  private nearest(x: number, y: number): Enemy | null {
    let best: Enemy | null = null, bd = Infinity;
    for (const e of this.activeEnemies()) {
      const d = Phaser.Math.Distance.Squared(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // Her kare: mermi/füze sınır kontrolü, füze güdümü, düşman dönüşü ve vuruş parlaması
  update(dt: number, bounds: Phaser.Geom.Rectangle): void {
    const now = this.scene.time.now;
    for (const s of this.shots.getChildren() as Shot[]) {
      if (s.active && !bounds.contains(s.x, s.y)) s.disableBody(true, true);
    }
    for (const b of this.eshots.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (b.active && !bounds.contains(b.x, b.y)) b.disableBody(true, true);
    }
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.active) continue;
      if (e.spin) e.rotation += e.spin * (dt / 1000);
      if (e.flashUntil && now > e.flashUntil) { e.clearTint(); e.flashUntil = 0; }
    }
    for (const m of this.missiles.getChildren() as Missile[]) {
      if (!m.active) continue;
      m.life -= dt;
      if (m.life <= 0 || !bounds.contains(m.x, m.y)) { m.disableBody(true, true); continue; }
      // hedef öldüyse yeniden hedef seç (eski sürümdeki "yanlış asteroidi silme" hatası burada yok)
      if (!m.target || !m.target.active) m.target = this.nearest(m.x, m.y);
      const body = m.body as Phaser.Physics.Arcade.Body;
      if (m.target) {
        const want = Phaser.Math.Angle.Between(m.x, m.y, m.target.x, m.target.y);
        const cur = Math.atan2(body.velocity.y, body.velocity.x);
        const next = Phaser.Math.Angle.RotateTo(cur, want, 6 * (dt / 1000));
        const sp = Math.min(1100, body.velocity.length() + 900 * (dt / 1000));
        this.scene.physics.velocityFromRotation(next, sp, body.velocity);
        m.setRotation(next + Math.PI / 2);
        if (Phaser.Math.Distance.Between(m.x, m.y, m.target.x, m.target.y) < m.target.rad + 14) {
          this.damage(m.target, m.dmg, m.x, m.y);
          this.explode(m.x, m.y, 0xffcc00, 8, 0.6);
          m.disableBody(true, true);
        }
      }
    }
  }

  // Güçlendirme kapsülü
  dropPickup(x: number, y: number, kind: 'double' | 'damage' | 'gold'): Phaser.Physics.Arcade.Image | null {
    const p = this.pickups.get(x, y, `pu_${kind}`) as Phaser.Physics.Arcade.Image | null;
    if (!p) return null;
    p.setTexture(`pu_${kind}`);
    p.enableBody(true, x, y, true, true);
    p.setData('kind', kind).setDepth(9).setScale(1);
    this.scene.tweens.add({ targets: p, scale: 1.15, yoyo: true, repeat: -1, duration: 400 });
    return p;
  }

  clearAll(includeBoss: boolean): Enemy[] {
    const killed: Enemy[] = [];
    for (const e of this.activeEnemies()) {
      if (e.kind === 'boss' && !includeBoss) continue;
      killed.push(e);
    }
    return killed;
  }
}

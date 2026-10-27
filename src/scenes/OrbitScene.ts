// ANA BÖLÜM: Gezegen savunması — gemi gezegenin etrafında 360° döner, ateş otomatik.
import Phaser from 'phaser';
import { Combat, Enemy } from '../core/combat';
import { t } from '../core/i18n';
import { Save } from '../core/save';
import { Sfx } from '../core/sfx';
import { COLORS, banner, bar, button, starBackground, txt, Button, panel } from '../core/ui';
import { CardContext, pickCards } from '../data/cards';
import { EnemyKind, PLANETS, PlanetDef, waveCount, wavePlan } from '../data/planets';
import { RunBonus, ShipStats, computeStats, emptyBonus } from '../data/upgrades';

type State = 'play' | 'cards' | 'pause' | 'end';

const NUKE_TIME = 75000; // ms
const BUFF_TIME = 10000;

export class OrbitScene extends Phaser.Scene {
  private p = 0;
  private def!: PlanetDef;
  private cx = 0;
  private cy = 0;
  private orbitR = 0;
  private planet!: Phaser.GameObjects.Image;
  private ship!: Phaser.GameObjects.Image;
  private shieldG!: Phaser.GameObjects.Graphics;
  private angle = -Math.PI / 2;
  private targetAngle = -Math.PI / 2;
  private combat!: Combat;
  private bonus!: RunBonus;
  private stats!: ShipStats;
  private planetHp = 100;
  private planetMax = 100;
  private shield = 0;
  private nukeCharge = 0;
  private wave = 0;
  private waveTotal = 4;
  private toSpawn = 0;
  private spawnTimer = 0;
  private spawnInterval = 1000;
  private weights: Partial<Record<EnemyKind, number>> = {};
  private waveActive = false;
  private bossPending = false;
  private boss: Enemy | null = null;
  private runGold = 0;
  private lastShot = 0;
  private lastMissile = 0;
  private buffDouble = 0;
  private buffDamage = 0;
  private state: State = 'play';
  private lastX = 0;
  private bg!: { update: (dt: number, speed: number) => void };
  private hud!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private buffText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private nukeBtn!: Button;
  private overlay: Phaser.GameObjects.Container | null = null;
  private hint: Phaser.GameObjects.Text | null = null;
  private keys!: { left: Phaser.Input.Keyboard.Key[]; right: Phaser.Input.Keyboard.Key[] };
  private bounds!: Phaser.Geom.Rectangle;

  constructor() {
    super('Orbit');
  }

  init(data: { planet?: number }): void {
    this.p = Phaser.Math.Clamp(data.planet ?? 0, 0, PLANETS.length - 1);
    this.def = PLANETS[this.p];
    this.state = 'play';
    this.wave = 0;
    this.runGold = 0;
    this.boss = null;
    this.bossPending = false;
    this.waveActive = false;
    this.buffDouble = 0;
    this.buffDamage = 0;
    this.nukeCharge = 0.35;
    this.angle = this.targetAngle = -Math.PI / 2;
    this.overlay = null;
    this.hint = null;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cx = width / 2;
    this.cy = height * 0.5 + 40;
    this.orbitR = this.def.radius + 150;
    this.bounds = new Phaser.Geom.Rectangle(-250, -250, width + 500, height + 500);
    this.physics.world.setBounds(-400, -400, width + 800, height + 800);

    this.bg = starBackground(this, false);

    // yörünge çizgisi
    const og = this.add.graphics().setDepth(1);
    og.lineStyle(2, COLORS.cyan, 0.12);
    og.strokeCircle(this.cx, this.cy, this.orbitR);
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      og.fillStyle(COLORS.cyan, 0.25);
      og.fillCircle(this.cx + Math.cos(a) * this.orbitR, this.cy + Math.sin(a) * this.orbitR, 2);
    }

    this.planet = this.add.image(this.cx, this.cy, `planet_${this.def.id}`).setDepth(2);
    this.tweens.add({ targets: this.planet, scale: 1.015, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.InOut' });

    this.ship = this.add.image(0, 0, 'ship').setDepth(10).setScale(0.85);
    this.shieldG = this.add.graphics().setDepth(11);

    this.combat = new Combat(this, this.p, { onKill: (e, byNuke) => this.onKill(e, byNuke) });

    this.bonus = emptyBonus();
    this.stats = computeStats(this.bonus);
    this.planetMax = this.stats.planetMaxHp;
    this.planetHp = this.planetMax;
    this.shield = this.stats.startShield;
    this.waveTotal = waveCount(this.p);

    this.buildHud();
    this.setupInput();

    this.game.events.on('blur', this.onBlur, this);
    this.events.once('shutdown', () => this.game.events.off('blur', this.onBlur, this));

    banner(this, t(this.def.nameKey).toUpperCase(), '#7ff9ff', this.cy + this.def.radius + 190);
    if (!Save.data.seenHintOrbit) {
      this.hint = txt(this, width / 2, height - 330, t('hintOrbit'), 40, '#bfefff', { stroke: '#000', strokeThickness: 6, lineSpacing: 8 }).setDepth(60);
      this.tweens.add({ targets: this.hint, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });
    }
    this.time.delayedCall(2200, () => this.startWave(1));
    this.placeShip();
  }

  // ---------- Giriş ----------
  private setupInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      Sfx.unlock();
      this.lastX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.state !== 'play') return;
      const dx = p.x - this.lastX;
      this.lastX = p.x;
      // sağa kaydır = saat yönünde
      this.targetAngle += dx * 0.0085;
      if (this.hint && Math.abs(dx) > 2) this.dismissHint();
    });
    const kb = this.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb
      ? { left: [kb.addKey(K.LEFT), kb.addKey(K.A)], right: [kb.addKey(K.RIGHT), kb.addKey(K.D)] }
      : { left: [], right: [] };
    kb?.on('keydown-N', () => this.fireNuke());
    kb?.on('keydown-ESC', () => this.openPause());
  }

  private dismissHint(): void {
    if (!this.hint) return;
    const h = this.hint;
    this.hint = null;
    Save.data.seenHintOrbit = true;
    Save.persist();
    this.tweens.killTweensOf(h);
    this.tweens.add({ targets: h, alpha: 0, duration: 300, onComplete: () => h.destroy() });
  }

  // ---------- HUD ----------
  private buildHud(): void {
    const { width, height } = this.scale;
    this.hud = this.add.graphics().setDepth(40);
    txt(this, 50, 96, t(this.def.nameKey).toUpperCase(), 38, '#8ab4f8').setOrigin(0, 0.5).setDepth(41);
    this.hpText = txt(this, 50 + width * 0.52 + 14, 150, '', 30, '#ffffff').setOrigin(0, 0.5).setDepth(41);
    this.waveText = txt(this, width / 2 + 60, 96, '', 36, '#ffd700').setDepth(41);
    this.goldText = txt(this, width - 50, 150, '', 40, '#ffd700').setOrigin(1, 0.5).setDepth(41);
    this.bossText = txt(this, width / 2, 214, t('boss'), 28, '#ff9fd0').setDepth(41).setVisible(false);
    this.buffText = txt(this, width - 50, height - 130, '', 32, '#ffffff', { align: 'right', lineSpacing: 6 }).setOrigin(1, 0.5).setDepth(41);

    const pause = button(this, width - 80, 96, 96, 80, 'II', () => this.openPause(), { size: 40 });
    pause.setDepth(42);

    this.nukeBtn = button(this, 210, height - 130, 330, 120, `☢ ${t('nuke')}`, () => this.fireNuke(), { color: COLORS.pink, size: 42 });
    this.nukeBtn.setDepth(42);
  }

  private drawHud(): void {
    const { width, height } = this.scale;
    const g = this.hud;
    g.clear();
    const ratio = this.planetHp / this.planetMax;
    const col = ratio > 0.5 ? 0x00ff88 : ratio > 0.25 ? 0xffcc00 : 0xff3355;
    bar(g, 50, 136, width * 0.52, 28, ratio, col);
    this.hpText.setText(`${Math.max(0, Math.ceil(this.planetHp))}${this.shield > 0 ? `  ◎${this.shield}` : ''}`);
    this.waveText.setText(`${t('wave')} ${Math.max(1, this.wave)}/${this.waveTotal}`);
    this.goldText.setText(`${Save.data.gold + this.runGold} ●`);

    if (this.boss && this.boss.active) {
      this.bossText.setVisible(true);
      bar(g, 120, 236, width - 240, 22, this.boss.hp / this.boss.maxHp, 0xff2a6d, 0x220011);
    } else this.bossText.setVisible(false);

    // nükleer dolum göstergesi
    const ready = this.nukeCharge >= 1;
    this.nukeBtn.setEnabled(ready && this.state === 'play');
    g.fillStyle(COLORS.pink, 0.35);
    g.fillRoundedRect(45, height - 70, 330 * Math.min(1, this.nukeCharge), 10, 5);

    const lines: string[] = [];
    if (this.buffDouble > 0) lines.push(`2X ${Math.ceil(this.buffDouble / 1000)}s`);
    if (this.buffDamage > 0) lines.push(`+5 ${Math.ceil(this.buffDamage / 1000)}s`);
    this.buffText.setText(lines.join('\n'));
  }

  // ---------- Dalga ----------
  private startWave(w: number): void {
    if (this.state === 'end') return;
    this.wave = w;
    const plan = wavePlan(this.p, w);
    this.toSpawn = plan.count;
    this.spawnInterval = plan.interval * 1000;
    this.spawnTimer = 400;
    this.weights = plan.weights;
    this.bossPending = plan.boss;
    this.waveActive = true;
    banner(this, t('waveIncoming', { n: w }));
  }

  private pickKind(): EnemyKind {
    const entries = Object.entries(this.weights) as [EnemyKind, number][];
    const total = entries.reduce((s, [, v]) => s + v, 0);
    let r = Math.random() * total;
    for (const [k, v] of entries) {
      r -= v;
      if (r <= 0) return k;
    }
    return 'meteor';
  }

  private spawnEnemy(kind: EnemyKind): void {
    const { width, height } = this.scale;
    const a = Math.random() * Math.PI * 2;
    // ekran kenarına olan uzaklık (o yönde) + küçük pay: düşman hemen kenarın dışında doğar
    const ca = Math.cos(a), sa = Math.sin(a);
    const tx = ca > 0 ? (width - this.cx) / ca : ca < 0 ? -this.cx / ca : Infinity;
    const ty = sa > 0 ? (height - this.cy) / sa : sa < 0 ? -this.cy / sa : Infinity;
    const R = Math.min(tx, ty) + (kind === 'boss' ? 170 : 70);
    const x = this.cx + Math.cos(a) * R;
    const y = this.cy + Math.sin(a) * R;
    const e = this.combat.spawn(kind, x, y);
    if (!e) return;
    const body = e.body as Phaser.Physics.Arcade.Body;
    if (kind === 'meteor' || kind === 'fire' || kind === 'ice' || kind === 'armored') {
      const toC = Phaser.Math.Angle.Between(x, y, this.cx, this.cy) + Phaser.Math.FloatBetween(-0.06, 0.06);
      this.physics.velocityFromRotation(toC, e.speed, body.velocity);
    }
    if (kind === 'boss') {
      this.boss = e;
      banner(this, t('bossIncoming'), '#ff7ab8');
      this.cameras.main.shake(500, 0.006);
    }
  }

  // ---------- Döngü ----------
  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    this.bg.update(dt, 0);
    if (this.state !== 'play') {
      this.drawHud();
      return;
    }
    const s = dt / 1000;

    // hareket
    const kbDir = (this.keys.right.some((k) => k.isDown) ? 1 : 0) - (this.keys.left.some((k) => k.isDown) ? 1 : 0);
    if (kbDir) this.targetAngle += kbDir * this.stats.orbitSpeed * s;
    const maxStep = this.stats.orbitSpeed * 2.4 * s;
    const diff = this.targetAngle - this.angle;
    this.angle += Phaser.Math.Clamp(diff, -maxStep, maxStep);
    this.placeShip();

    // ateş
    const barrels = Math.min(3, this.stats.barrels + (this.buffDouble > 0 ? 1 : 0));
    const dmg = this.stats.damage + (this.buffDamage > 0 ? 5 : 0);
    if (time - this.lastShot >= this.stats.fireInterval) {
      this.lastShot = time;
      this.fireVolley(barrels, dmg);
    }
    if (this.stats.missileLevel > 0 && time - this.lastMissile >= Math.max(450, 1700 - 250 * (this.stats.missileLevel - 1))) {
      if (this.combat.activeEnemies().length > 0) {
        this.lastMissile = time;
        this.combat.launchMissile(this.ship.x, this.ship.y, this.angle + Phaser.Math.FloatBetween(-0.5, 0.5), 3 + this.stats.missileLevel);
      }
    }

    // doğma
    if (this.waveActive) {
      if (this.toSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnEnemy(this.pickKind());
          this.toSpawn--;
          this.spawnTimer = this.spawnInterval * Phaser.Math.FloatBetween(0.6, 1.3);
        }
      } else if (this.bossPending) {
        this.bossPending = false;
        this.spawnEnemy('boss');
      }
    }

    this.updateEnemies(time, s);
    this.updateEnemyShots();
    this.updatePickups();
    this.combat.update(dt, this.bounds);

    if (this.buffDouble > 0) this.buffDouble -= dt;
    if (this.buffDamage > 0) this.buffDamage -= dt;
    if (this.nukeCharge < 1) this.nukeCharge = Math.min(1, this.nukeCharge + dt / NUKE_TIME);

    // dalga bitti mi?
    if (this.waveActive && this.toSpawn === 0 && !this.bossPending && this.combat.activeEnemies().length === 0) {
      this.waveActive = false;
      if (this.wave >= this.waveTotal) this.victory();
      else this.time.delayedCall(700, () => this.showCards());
    }
    this.drawHud();
  }

  private placeShip(): void {
    this.ship.setPosition(this.cx + Math.cos(this.angle) * this.orbitR, this.cy + Math.sin(this.angle) * this.orbitR);
    this.ship.setRotation(this.angle + Math.PI / 2);
    const g = this.shieldG;
    g.clear();
    if (this.shield > 0) {
      const pulse = 0.5 + Math.sin(this.time.now / 150) * 0.25;
      g.lineStyle(5, COLORS.cyan, pulse);
      g.strokeCircle(this.ship.x, this.ship.y, 58);
      if (this.shield > 1) { g.lineStyle(3, COLORS.cyan, pulse * 0.6); g.strokeCircle(this.ship.x, this.ship.y, 68); }
    }
  }

  private fireVolley(barrels: number, dmg: number): void {
    const a = this.angle;
    const x = this.ship.x + Math.cos(a) * 40;
    const y = this.ship.y + Math.sin(a) * 40;
    const power = dmg > this.stats.damage;
    const px = -Math.sin(a), py = Math.cos(a);
    if (barrels === 1) this.combat.fireShot(x, y, a, dmg, this.stats.pierce, power);
    else if (barrels === 2) {
      this.combat.fireShot(x + px * 20, y + py * 20, a, dmg, this.stats.pierce, power);
      this.combat.fireShot(x - px * 20, y - py * 20, a, dmg, this.stats.pierce, power);
    } else {
      this.combat.fireShot(x, y, a, dmg, this.stats.pierce, power);
      this.combat.fireShot(x + px * 16, y + py * 16, a + 0.13, dmg, this.stats.pierce, power);
      this.combat.fireShot(x - px * 16, y - py * 16, a - 0.13, dmg, this.stats.pierce, power);
    }
    Sfx.shoot();
  }

  private updateEnemies(time: number, s: number): void {
    const R = this.def.radius;
    for (const e of this.combat.activeEnemies()) {
      const d = Phaser.Math.Distance.Between(e.x, e.y, this.cx, this.cy);
      const body = e.body as Phaser.Physics.Arcade.Body;

      if (e.kind === 'kamikaze') {
        const to = Phaser.Math.Angle.Between(e.x, e.y, this.cx, this.cy);
        const wobble = Math.sin((time - e.born) / 260) * 0.5;
        this.physics.velocityFromRotation(to + wobble, e.speed, body.velocity);
        e.setRotation(to + wobble + Math.PI / 2);
      } else if (e.kind === 'fighter' || e.kind === 'boss') {
        const hold = e.kind === 'boss' ? this.orbitR + 270 : this.orbitR + 170;
        if (e.state === 0) {
          const to = Phaser.Math.Angle.Between(e.x, e.y, this.cx, this.cy);
          this.physics.velocityFromRotation(to, e.speed, body.velocity);
          if (d <= hold) {
            e.state = 1;
            e.orbitA = Phaser.Math.Angle.Between(this.cx, this.cy, e.x, e.y);
            e.orbitR = d;
            body.setVelocity(0, 0);
          }
        } else {
          e.orbitA += e.orbitDir * (e.kind === 'boss' ? 0.16 : 0.32) * s;
          e.setPosition(this.cx + Math.cos(e.orbitA) * e.orbitR, this.cy + Math.sin(e.orbitA) * e.orbitR);
          body.reset(e.x, e.y);
          if (time >= e.fireAt) {
            const to = Phaser.Math.Angle.Between(e.x, e.y, this.cx, this.cy);
            if (e.kind === 'boss') {
              for (const off of [-0.18, 0, 0.18]) this.combat.enemyFire(e.x, e.y, to + off, 380, e.dmg);
              if (Math.random() < 0.35) this.spawnMeteorNear(e.x, e.y);
              e.fireAt = time + 1500;
            } else {
              this.combat.enemyFire(e.x, e.y, to, 360, e.dmg);
              e.fireAt = time + Phaser.Math.Between(1800, 2600);
            }
          }
        }
        if (e.kind === 'fighter') e.setRotation(Phaser.Math.Angle.Between(e.x, e.y, this.cx, this.cy) - Math.PI / 2);
      }

      // gezegene çarpma
      if (e.kind !== 'boss' && d <= R + e.rad * 0.55) {
        this.hitPlanet(e.dmg, e.x, e.y);
        this.combat.explode(e.x, e.y, 0xff5522, 16);
        this.combat.remove(e);
        continue;
      }
      // gemiye çarpma (kalkan varsa düşman yok olur)
      if (e.kind !== 'boss' && this.shield > 0 && Phaser.Math.Distance.Between(e.x, e.y, this.ship.x, this.ship.y) < e.rad + 40) {
        this.shield--;
        this.cameras.main.shake(120, 0.004);
        this.combat.kill(e);
      }
    }
  }

  private spawnMeteorNear(x: number, y: number): void {
    const e = this.combat.spawn('meteor', x, y);
    if (!e) return;
    const to = Phaser.Math.Angle.Between(x, y, this.cx, this.cy) + Phaser.Math.FloatBetween(-0.3, 0.3);
    this.physics.velocityFromRotation(to, e.speed * 1.4, (e.body as Phaser.Physics.Arcade.Body).velocity);
  }

  private updateEnemyShots(): void {
    for (const b of this.combat.eshots.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (!b.active) continue;
      // gemi mermiyi gövdesiyle durdurur — iyi konumlanmanın ödülü
      if (Phaser.Math.Distance.Between(b.x, b.y, this.ship.x, this.ship.y) < 44) {
        this.combat.explode(b.x, b.y, 0x00f0ff, 6, 0.5);
        b.disableBody(true, true);
        continue;
      }
      if (Phaser.Math.Distance.Between(b.x, b.y, this.cx, this.cy) < this.def.radius) {
        this.hitPlanet(b.getData('dmg') ?? 3, b.x, b.y);
        b.disableBody(true, true);
      }
    }
  }

  private updatePickups(): void {
    for (const p of this.combat.pickups.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (!p.active) continue;
      if (Phaser.Math.Distance.Between(p.x, p.y, this.ship.x, this.ship.y) < 80) {
        const kind = p.getData('kind');
        if (kind === 'double') this.buffDouble = BUFF_TIME;
        else if (kind === 'damage') this.buffDamage = BUFF_TIME;
        else { this.runGold += 15; this.floatText(p.x, p.y, '+15', '#ffd700'); }
        Sfx.pickup();
        this.tweens.killTweensOf(p);
        p.disableBody(true, true);
      } else if (Phaser.Math.Distance.Between(p.x, p.y, this.cx, this.cy) < this.def.radius) {
        this.tweens.killTweensOf(p);
        p.disableBody(true, true);
      }
    }
  }

  private hitPlanet(dmg: number, x: number, y: number): void {
    if (this.state !== 'play') return;
    this.planetHp -= dmg;
    Sfx.planetHit();
    this.cameras.main.shake(140, 0.005);
    this.planet.setTint(0xff7777);
    this.time.delayedCall(90, () => this.planet.clearTint());
    if (navigator.vibrate) try { navigator.vibrate(25); } catch { /* yok say */ }
    if (this.planetHp <= 0) this.defeat();
  }

  private onKill(e: Enemy, _byNuke: boolean): void {
    this.runGold += e.gold;
    if (e.kind === 'boss') {
      this.boss = null;
      this.cameras.main.shake(600, 0.012);
      this.cameras.main.flash(250, 255, 120, 200);
    }
    if (e.gold >= 6 || Math.random() < 0.4) this.floatText(e.x, e.y, `+${e.gold}`, '#ffd700');
    if (e.kind !== 'boss' && Math.random() < 0.09) {
      const r = Math.random();
      const kind = r < 0.4 ? 'double' : r < 0.75 ? 'damage' : 'gold';
      const pu = this.combat.dropPickup(e.x, e.y, kind);
      if (pu) {
        const to = Phaser.Math.Angle.Between(e.x, e.y, this.cx, this.cy);
        this.physics.velocityFromRotation(to, 60, (pu.body as Phaser.Physics.Arcade.Body).velocity);
      }
    }
  }

  private floatText(x: number, y: number, s: string, color: string): void {
    const tx = txt(this, x, y, s, 30, color, { stroke: '#000', strokeThickness: 4 }).setDepth(30);
    this.tweens.add({ targets: tx, y: y - 60, alpha: 0, duration: 700, onComplete: () => tx.destroy() });
  }

  // ---------- Nükleer ----------
  private fireNuke(): void {
    if (this.state !== 'play' || this.nukeCharge < 1) return;
    this.nukeCharge = 0;
    Sfx.big();
    this.cameras.main.flash(400, 255, 240, 220);
    this.cameras.main.shake(500, 0.01);
    for (const e of this.combat.activeEnemies()) {
      if (e.kind === 'boss') this.combat.damage(e, Math.ceil(e.maxHp * 0.25), e.x, e.y, true);
      else this.combat.kill(e, true);
    }
    for (const b of this.combat.eshots.getChildren() as Phaser.Physics.Arcade.Image[]) if (b.active) b.disableBody(true, true);
  }

  // ---------- Kartlar ----------
  private showCards(): void {
    if (this.state !== 'play') return;
    this.state = 'cards';
    this.physics.pause();
    const { width, height } = this.scale;
    const ctx: CardContext = {
      repairPlanet: (n) => { this.planetHp = Math.min(this.planetMax, this.planetHp + n); },
      chargeNuke: () => { this.nukeCharge = 1; },
      addShield: (n) => { this.shield += n; },
      barrelsNow: this.stats.barrels
    };
    const cards = pickCards(this.bonus, ctx);
    const c = this.add.container(0, 0).setDepth(80);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000008, 0.72).setInteractive();
    c.add(dim);
    c.add(txt(this, width / 2, height * 0.24, t('chooseCard'), 56, '#ffd700', { stroke: '#000', strokeThickness: 6 }));
    cards.forEach((card, i) => {
      const y = height * 0.36 + i * 270;
      const b = button(this, width / 2, y, 880, 230, '', () => {
        Sfx.card();
        card.apply(this.bonus, ctx);
        this.stats = computeStats(this.bonus);
        c.destroy();
        this.state = 'play';
        this.physics.resume();
        this.time.delayedCall(500, () => this.startWave(this.wave + 1));
      }, { color: card.color });
      const name = txt(this, 0, -36, t(card.nameKey), 50, '#ffffff');
      const desc = txt(this, 0, 34, t(card.descKey), 36, '#bcd3ff');
      b.add([name, desc]);
      b.setScale(0.7).setAlpha(0);
      this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 260, delay: i * 90, ease: 'Back.Out' });
      c.add(b);
    });
    this.overlay = c;
  }

  // ---------- Duraklat ----------
  private onBlur(): void {
    if (this.state === 'play') this.openPause();
  }

  private openPause(): void {
    if (this.state !== 'play') return;
    this.state = 'pause';
    this.physics.pause();
    this.time.paused = true;
    const { width, height } = this.scale;
    const c = this.add.container(0, 0).setDepth(90);
    c.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000008, 0.75).setInteractive());
    c.add(panel(this, width / 2, height / 2, 760, 700, COLORS.cyan));
    c.add(txt(this, width / 2, height / 2 - 250, t('pause'), 60, '#00f0ff'));
    c.add(button(this, width / 2, height / 2 - 90, 560, 130, t('resume'), () => {
      c.destroy();
      this.time.paused = false;
      this.physics.resume();
      this.state = 'play';
    }));
    c.add(button(this, width / 2, height / 2 + 70, 560, 130, t('retry'), () => {
      this.time.paused = false;
      this.scene.restart({ planet: this.p });
    }, { color: COLORS.gold }));
    c.add(button(this, width / 2, height / 2 + 230, 560, 130, t('map'), () => {
      this.time.paused = false;
      Save.addGold(this.runGold);
      this.scene.start('Menu');
    }, { color: COLORS.grey }));
  }

  // ---------- Son ----------
  private victory(): void {
    if (this.state === 'end') return;
    this.state = 'end';
    const bonus = 50 + 25 * this.p;
    const total = this.runGold + bonus;
    Save.addGold(total);
    if (this.p + 1 < PLANETS.length) Save.unlock(this.p + 1);
    Sfx.win();
    banner(this, t('planetSafe'), '#00ff88');
    this.time.delayedCall(1800, () => this.scene.start('Result', { mode: 'orbit', success: true, planet: this.p, gold: total }));
  }

  private defeat(): void {
    if (this.state === 'end') return;
    this.state = 'end';
    this.planetHp = 0;
    Save.addGold(this.runGold);
    Sfx.lose();
    this.cameras.main.shake(900, 0.015);
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 140, () => {
        const a = Math.random() * Math.PI * 2, r = Math.random() * this.def.radius;
        this.combat.explode(this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r, 0xff4400, 30, 1.6);
      });
    }
    this.tweens.add({ targets: this.planet, alpha: 0.35, duration: 900 });
    this.time.delayedCall(1800, () => this.scene.start('Result', { mode: 'orbit', success: false, planet: this.p, gold: this.runGold }));
  }
}

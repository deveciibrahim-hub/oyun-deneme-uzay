// ARA BÖLÜM: Gezegenden gezegene yolculuk — eski sürümdeki dikey görünüm. Gemi altta, ateş yukarı.
import Phaser from 'phaser';
import { Combat, Enemy } from '../core/combat';
import { t } from '../core/i18n';
import { Save } from '../core/save';
import { Sfx } from '../core/sfx';
import { COLORS, banner, bar, button, panel, starBackground, txt } from '../core/ui';
import { EnemyKind, PLANETS } from '../data/planets';
import { ShipStats, computeStats, emptyBonus } from '../data/upgrades';

type State = 'play' | 'pause' | 'end';

export class TransitScene extends Phaser.Scene {
  private from = 0;
  private to = 1;
  private ship!: Phaser.GameObjects.Image;
  private shieldG!: Phaser.GameObjects.Graphics;
  private combat!: Combat;
  private stats!: ShipStats;
  private targetX = 0;
  private lastX = 0;
  private hull = 3;
  private hullMax = 3;
  private shield = 0;
  private invuln = 0;
  private elapsed = 0;
  private duration = 40000;
  private spawnTimer = 800;
  private runGold = 0;
  private lastShot = 0;
  private lastMissile = 0;
  private state: State = 'play';
  private bg!: { update: (dt: number, speed: number) => void };
  private hud!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private distText!: Phaser.GameObjects.Text;
  private hullText!: Phaser.GameObjects.Text;
  private destination!: Phaser.GameObjects.Image;
  private keys!: { left: Phaser.Input.Keyboard.Key[]; right: Phaser.Input.Keyboard.Key[] };
  private bounds!: Phaser.Geom.Rectangle;
  private hint: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Transit');
  }

  init(data: { from?: number; to?: number }): void {
    this.from = data.from ?? 0;
    this.to = Phaser.Math.Clamp(data.to ?? this.from + 1, 0, PLANETS.length - 1);
    this.state = 'play';
    this.elapsed = 0;
    this.runGold = 0;
    this.invuln = 0;
    this.spawnTimer = 800;
    this.hint = null;
  }

  create(): void {
    const { width, height } = this.scale;
    this.bounds = new Phaser.Geom.Rectangle(-200, -300, width + 400, height + 500);
    this.physics.world.setBounds(-400, -400, width + 800, height + 800);
    this.bg = starBackground(this, true);
    this.duration = (35 + 4 * this.to) * 1000;

    // hedef gezegen yukarıda küçük başlar, yaklaştıkça büyür
    this.destination = this.add.image(width / 2, -40, `planet_${PLANETS[this.to].id}`).setDepth(-10).setScale(0.25).setAlpha(0.85);

    this.stats = computeStats(emptyBonus());
    this.hullMax = this.hull = 4;
    this.shield = this.stats.startShield;
    this.ship = this.add.image(width / 2, height - 360, 'ship').setDepth(10);
    this.targetX = width / 2;
    this.shieldG = this.add.graphics().setDepth(11);
    this.combat = new Combat(this, this.to, { onKill: (e) => this.onKill(e) });

    this.buildHud();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { Sfx.unlock(); this.lastX = p.x; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.state !== 'play') return;
      this.targetX += (p.x - this.lastX) * 1.25;
      this.lastX = p.x;
      if (this.hint) this.dismissHint();
    });
    const kb = this.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb ? { left: [kb.addKey(K.LEFT), kb.addKey(K.A)], right: [kb.addKey(K.RIGHT), kb.addKey(K.D)] } : { left: [], right: [] };
    kb?.on('keydown-ESC', () => this.openPause());

    this.game.events.on('blur', this.onBlur, this);
    this.events.once('shutdown', () => this.game.events.off('blur', this.onBlur, this));

    banner(this, t('toPlanet', { p: t(PLANETS[this.to].nameKey) }).toUpperCase(), '#7ff9ff');
    if (!Save.data.seenHintTransit) {
      this.hint = txt(this, width / 2, height - 200, t('hintTransit'), 40, '#bfefff', { stroke: '#000', strokeThickness: 6 }).setDepth(60);
    }
  }

  private dismissHint(): void {
    if (!this.hint) return;
    this.hint.destroy();
    this.hint = null;
    Save.data.seenHintTransit = true;
    Save.persist();
  }

  private buildHud(): void {
    const { width } = this.scale;
    this.hud = this.add.graphics().setDepth(40);
    this.distText = txt(this, 50, 96, '', 36, '#8ab4f8').setOrigin(0, 0.5).setDepth(41);
    this.hullText = txt(this, 50, 150, '', 40, '#ff5577').setOrigin(0, 0.5).setDepth(41);
    this.goldText = txt(this, width - 50, 150, '', 40, '#ffd700').setOrigin(1, 0.5).setDepth(41);
    button(this, width - 80, 96, 96, 80, 'II', () => this.openPause(), { size: 40 }).setDepth(42);
  }

  private drawHud(): void {
    const { width } = this.scale;
    const g = this.hud;
    g.clear();
    const prog = Math.min(1, this.elapsed / this.duration);
    bar(g, 50, 196, width - 100, 18, prog, COLORS.cyan, 0x001833);
    const km = Math.max(0, Math.round((1 - prog) * 12000 * (this.to + 1)));
    this.distText.setText(`${t('toPlanet', { p: t(PLANETS[this.to].nameKey) })} · ${km.toLocaleString()} km`);
    this.hullText.setText('♥'.repeat(Math.max(0, this.hull)) + '♡'.repeat(Math.max(0, this.hullMax - this.hull)) + (this.shield > 0 ? `  ◎${this.shield}` : ''));
    this.goldText.setText(`${Save.data.gold + this.runGold} ●`);
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    const s = dt / 1000;
    this.bg.update(dt, this.state === 'play' ? 900 : 120);
    if (this.state !== 'play') { this.drawHud(); return; }
    const { width, height } = this.scale;

    this.elapsed += dt;
    const prog = Math.min(1, this.elapsed / this.duration);
    this.destination.setScale(0.25 + prog * 0.9).setY(-40 + prog * 260);

    // hareket
    const kbDir = (this.keys.right.some((k) => k.isDown) ? 1 : 0) - (this.keys.left.some((k) => k.isDown) ? 1 : 0);
    if (kbDir) this.targetX += kbDir * 1100 * s;
    this.targetX = Phaser.Math.Clamp(this.targetX, 60, width - 60);
    const maxStep = 2200 * s;
    this.ship.x += Phaser.Math.Clamp(this.targetX - this.ship.x, -maxStep, maxStep);
    this.ship.setRotation(Phaser.Math.Clamp((this.targetX - this.ship.x) * 0.004, -0.35, 0.35));

    // ateş
    if (time - this.lastShot >= this.stats.fireInterval) {
      this.lastShot = time;
      const a = -Math.PI / 2, x = this.ship.x, y = this.ship.y - 50;
      if (this.stats.barrels === 1) this.combat.fireShot(x, y, a, this.stats.damage, 0, false);
      else if (this.stats.barrels === 2) { this.combat.fireShot(x - 20, y, a, this.stats.damage, 0, false); this.combat.fireShot(x + 20, y, a, this.stats.damage, 0, false); }
      else { this.combat.fireShot(x, y, a, this.stats.damage, 0, false); this.combat.fireShot(x - 16, y, a - 0.13, this.stats.damage, 0, false); this.combat.fireShot(x + 16, y, a + 0.13, this.stats.damage, 0, false); }
      Sfx.shoot();
    }
    if (this.stats.missileLevel > 0 && time - this.lastMissile >= Math.max(450, 1700 - 250 * (this.stats.missileLevel - 1)) && this.combat.activeEnemies().length) {
      this.lastMissile = time;
      this.combat.launchMissile(this.ship.x, this.ship.y, -Math.PI / 2 + Phaser.Math.FloatBetween(-0.4, 0.4), 3 + this.stats.missileLevel);
    }

    // doğma (bitişe 3 sn kala durur)
    if (this.elapsed < this.duration - 3000) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
        this.spawnTimer = Math.max(380, 1100 - 60 * this.to) * Phaser.Math.FloatBetween(0.7, 1.3);
      }
    }

    this.updateEnemies(time, s, width, height);
    this.updateEnemyShots();
    this.combat.update(dt, this.bounds);
    if (this.invuln > 0) { this.invuln -= dt; this.ship.setAlpha(Math.floor(this.invuln / 80) % 2 ? 0.35 : 1); } else this.ship.setAlpha(1);
    this.drawShield();

    if (this.elapsed >= this.duration && this.combat.activeEnemies().length === 0) this.arrive();
    else if (this.elapsed >= this.duration + 6000) this.arrive();
    this.drawHud();
  }

  private spawn(): void {
    const { width } = this.scale;
    const p = this.to;
    const pool: [EnemyKind, number][] = [['meteor', 1], ['fire', 0.3], ['fighter', p <= 1 ? 0.12 : 0.25]];
    if (p >= 2) pool.push(['ice', 0.2], ['kamikaze', 0.2]);
    if (p >= 3) pool.push(['armored', 0.15]);
    const total = pool.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    let kind: EnemyKind = 'meteor';
    for (const [k, w] of pool) { r -= w; if (r <= 0) { kind = k; break; } }

    const x = Phaser.Math.Between(70, width - 70);
    const e = this.combat.spawn(kind, x, -80);
    if (!e) return;
    const body = e.body as Phaser.Physics.Arcade.Body;
    if (kind === 'fighter') {
      e.orbitR = Phaser.Math.Between(260, 620); // duracağı yükseklik
      body.setVelocity(0, e.speed * 1.4);
      e.setRotation(0);
    } else if (kind === 'kamikaze') {
      const a = Phaser.Math.Angle.Between(x, -80, this.ship.x, this.ship.y);
      this.physics.velocityFromRotation(a, e.speed * 1.2, body.velocity);
      e.setRotation(a + Math.PI / 2);
    } else {
      body.setVelocity(Phaser.Math.Between(-50, 50), e.speed * 2.2 + Phaser.Math.Between(0, 100));
    }
  }

  private updateEnemies(time: number, s: number, width: number, height: number): void {
    for (const e of this.combat.activeEnemies()) {
      const body = e.body as Phaser.Physics.Arcade.Body;
      if (e.kind === 'fighter') {
        if (e.state === 0 && e.y >= e.orbitR) { e.state = 1; body.setVelocity(e.orbitDir * 170, 0); e.orbitA = time; }
        if (e.state === 1) {
          if (e.x < 80 || e.x > width - 80) body.setVelocityX(-body.velocity.x);
          if (time >= e.fireAt) {
            this.combat.enemyFire(e.x, e.y + 30, Math.PI / 2, 460, 1);
            e.fireAt = time + Phaser.Math.Between(1300, 2000);
          }
          if (time - e.orbitA > 6500) { e.state = 2; body.setVelocity(body.velocity.x, 380); }
        }
        e.setRotation(Math.PI);
      }
      if (e.y > height + 120 || e.x < -150 || e.x > width + 150) { this.combat.remove(e); continue; }
      if (this.invuln <= 0 && Phaser.Math.Distance.Between(e.x, e.y, this.ship.x, this.ship.y) < e.rad + 22) {
        this.combat.kill(e);
        this.hurt();
      }
    }
  }

  private updateEnemyShots(): void {
    for (const b of this.combat.eshots.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (!b.active) continue;
      if (this.invuln <= 0 && Phaser.Math.Distance.Between(b.x, b.y, this.ship.x, this.ship.y) < 30) {
        b.disableBody(true, true);
        this.hurt();
      }
    }
  }

  private hurt(): void {
    if (this.state !== 'play') return;
    this.invuln = 1200;
    this.cameras.main.shake(180, 0.008);
    if (navigator.vibrate) try { navigator.vibrate(40); } catch { /* yok say */ }
    if (this.shield > 0) { this.shield--; Sfx.hit(); return; }
    this.hull--;
    Sfx.planetHit();
    if (this.hull <= 0) this.fail();
  }

  private drawShield(): void {
    const g = this.shieldG;
    g.clear();
    if (this.shield > 0) {
      g.lineStyle(5, COLORS.cyan, 0.5 + Math.sin(this.time.now / 150) * 0.25);
      g.strokeCircle(this.ship.x, this.ship.y, 66);
    }
  }

  private onKill(e: Enemy): void {
    this.runGold += e.gold;
  }

  private onBlur(): void {
    if (this.state === 'play') this.openPause();
  }

  private openPause(): void {
    if (this.state !== 'play') return;
    this.state = 'pause';
    this.physics.pause();
    const { width, height } = this.scale;
    const c = this.add.container(0, 0).setDepth(90);
    c.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000008, 0.75).setInteractive());
    c.add(panel(this, width / 2, height / 2, 760, 560, COLORS.cyan));
    c.add(txt(this, width / 2, height / 2 - 180, t('pause'), 60, '#00f0ff'));
    c.add(button(this, width / 2, height / 2 - 20, 560, 130, t('resume'), () => { c.destroy(); this.physics.resume(); this.state = 'play'; }));
    c.add(button(this, width / 2, height / 2 + 150, 560, 130, t('map'), () => { Save.addGold(this.runGold); this.scene.start('Menu'); }, { color: COLORS.grey }));
  }

  private arrive(): void {
    if (this.state === 'end') return;
    this.state = 'end';
    Save.addGold(this.runGold);
    Save.unlock(this.to);
    Sfx.win();
    banner(this, t('arrived'), '#00ff88');
    this.tweens.add({ targets: this.ship, y: -200, duration: 1200, ease: 'Cubic.In' });
    this.time.delayedCall(1500, () => this.scene.start('Result', { mode: 'transit', success: true, planet: this.to, from: this.from, gold: this.runGold }));
  }

  private fail(): void {
    if (this.state === 'end') return;
    this.state = 'end';
    Save.addGold(this.runGold);
    Sfx.lose();
    this.combat.explode(this.ship.x, this.ship.y, 0x00f0ff, 40, 1.8);
    this.ship.setVisible(false);
    this.time.delayedCall(1400, () => this.scene.start('Result', { mode: 'transit', success: false, planet: this.to, from: this.from, gold: this.runGold }));
  }
}

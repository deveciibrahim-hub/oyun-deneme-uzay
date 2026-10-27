// Ana menü = Güneş sistemi haritası. Dünya altta, Neptün en üstte.
import Phaser from 'phaser';
import { currentLang, t, toggleLang } from '../core/i18n';
import { Save } from '../core/save';
import { Sfx } from '../core/sfx';
import { COLORS, button, starBackground, txt } from '../core/ui';
import { PLANETS } from '../data/planets';

export class MenuScene extends Phaser.Scene {
  private bg!: { update: (dt: number, speed: number) => void };

  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.bg = starBackground(this, false);

    // güneş (sol alt köşeden taşan parıltı)
    const sun = this.add.graphics().setDepth(-5);
    for (let i = 10; i > 0; i--) {
      sun.fillStyle(0xffb347, 0.035 * (11 - i));
      sun.fillCircle(-60, height + 60, 120 + i * 45);
    }
    sun.fillStyle(0xfff1c1, 1);
    sun.fillCircle(-60, height + 60, 150);

    txt(this, width / 2, 130, t('title'), 84, '#00f0ff', { stroke: '#002233', strokeThickness: 10 });
    txt(this, width / 2, 215, t('subtitle'), 36, '#a0aab8', { fontStyle: 'normal' });

    // harita
    const top = 340, bottom = height - 470;
    const n = PLANETS.length;
    const pts = PLANETS.map((_, i) => {
      const y = bottom - (i / (n - 1)) * (bottom - top);
      const x = width / 2 + (i % 2 === 0 ? -1 : 1) * width * 0.2;
      return { x, y };
    });
    const path = this.add.graphics();
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const unlocked = i + 1 <= Save.data.unlocked;
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        path.fillStyle(unlocked ? COLORS.cyan : 0x445566, unlocked ? 0.7 : 0.4);
        path.fillCircle(Phaser.Math.Linear(a.x, b.x, k / steps), Phaser.Math.Linear(a.y, b.y, k / steps), 4);
      }
    }

    PLANETS.forEach((p, i) => {
      const { x, y } = pts[i];
      const unlocked = i <= Save.data.unlocked;
      const icon = this.add.image(x, y, `planet_${p.id}`);
      const target = 150;
      icon.setScale(target / (p.radius * 2));
      if (!unlocked) { icon.setTint(0x333344); icon.setAlpha(0.7); }
      const label = txt(this, x, y + 112, t(p.nameKey), 38, unlocked ? '#ffffff' : '#667788');
      if (!unlocked) this.add.image(x, y, 'lock').setScale(0.9);
      if (i === Save.data.unlocked) {
        const ring = this.add.image(x, y, 'ringFx').setTint(COLORS.cyan).setScale(1.6).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: ring, scale: 1.9, alpha: 0.2, yoyo: true, repeat: -1, duration: 900 });
        txt(this, x + (i % 2 === 0 ? 1 : -1) * 230, y, `▶ ${t('play')}`, 40, '#00f0ff');
      }
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerup', () => {
        if (!unlocked) { this.tweens.add({ targets: [icon, label], x: '+=8', yoyo: true, repeat: 2, duration: 40 }); return; }
        Sfx.unlock();
        Sfx.click();
        this.scene.start('Orbit', { planet: i });
      });
    });

    // alt çubuk
    const by = height - 140;
    txt(this, width / 2, by - 120, `${Save.data.gold} ● ${t('gold')}`, 46, '#ffd700', { stroke: '#000', strokeThickness: 6 });
    button(this, width / 2, by, 380, 120, `🛒 ${t('shop')}`, () => this.scene.start('Shop'), { color: COLORS.gold, size: 46 });
    const snd = button(this, width - 140, by, 210, 100, `${t('sound')}: ${Save.data.sound ? t('on') : t('off')}`, () => {
      Save.data.sound = !Save.data.sound;
      Save.persist();
      snd.setLabel(`${t('sound')}: ${Save.data.sound ? t('on') : t('off')}`);
    }, { size: 28, color: COLORS.grey });
    button(this, 140, by, 210, 100, `${t('lang')}: ${currentLang().toUpperCase()}`, () => {
      toggleLang();
      this.scene.restart();
    }, { size: 28, color: COLORS.grey });
  }

  update(_t: number, dt: number): void {
    this.bg.update(dt, 0);
  }
}

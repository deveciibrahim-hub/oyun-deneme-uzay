// Kalıcı yükseltme mağazası (altınla)
import Phaser from 'phaser';
import { t } from '../core/i18n';
import { Save } from '../core/save';
import { Sfx } from '../core/sfx';
import { COLORS, button, panel, starBackground, txt, Button } from '../core/ui';
import { UPGRADES, upgradeCost } from '../data/upgrades';

export class ShopScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private rows: { btn: Button; pips: Phaser.GameObjects.Graphics; refresh: () => void }[] = [];
  private bg!: { update: (dt: number, speed: number) => void };

  constructor() {
    super('Shop');
  }

  create(): void {
    const { width, height } = this.scale;
    this.bg = starBackground(this, false);
    this.rows = [];
    txt(this, width / 2, 110, t('shop'), 72, '#ffd700', { stroke: '#000', strokeThickness: 8 });
    this.goldText = txt(this, width / 2, 195, '', 46, '#ffd700');

    const rowH = 172;
    const startY = 320;
    const avail = height - 230 - startY;
    const gap = Math.min(rowH + 14, avail / UPGRADES.length);

    UPGRADES.forEach((u, i) => {
      const y = startY + i * gap;
      panel(this, width / 2, y, width - 80, rowH - 10);
      txt(this, 100, y, u.icon, 56, '#00f0ff');
      txt(this, 160, y - 32, t(u.nameKey), 40, '#ffffff').setOrigin(0, 0.5);
      txt(this, 160, y + 14, t(u.descKey), 28, '#9fb0c8', { fontStyle: 'normal' }).setOrigin(0, 0.5);
      const pips = this.add.graphics();
      const btn = button(this, width - 190, y, 230, 110, '', () => this.buy(u.id), { color: COLORS.gold, size: 36 });
      const refresh = () => {
        const lvl = Save.level(u.id);
        pips.clear();
        for (let k = 0; k < u.max; k++) {
          pips.fillStyle(k < lvl ? COLORS.cyan : 0x2a3446, 1);
          pips.fillRoundedRect(160 + k * 34, y + 44, 26, 12, 4);
        }
        if (lvl >= u.max) btn.setLabel(u.max === 1 ? t('owned') : t('maxed')).setEnabled(false);
        else {
          const c = upgradeCost(u, lvl);
          btn.setLabel(`${c} ●`).setEnabled(Save.data.gold >= c);
        }
      };
      this.rows.push({ btn, pips, refresh });
    });

    button(this, width / 2, height - 120, 420, 120, t('back'), () => this.scene.start('Menu'), { color: COLORS.cyan });
    this.refresh();
  }

  private buy(id: string): void {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return;
    const lvl = Save.level(id);
    if (lvl >= u.max) return;
    const c = upgradeCost(u, lvl);
    if (Save.data.gold < c) return;
    Save.data.gold -= c;
    Save.data.upgrades[id] = lvl + 1;
    Save.persist();
    Sfx.pickup();
    this.refresh();
  }

  private refresh(): void {
    this.goldText.setText(`${Save.data.gold} ● ${t('gold')}`);
    this.rows.forEach((r) => r.refresh());
  }

  update(_t: number, dt: number): void {
    this.bg.update(dt, 0);
  }
}

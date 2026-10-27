// Bölüm sonu ekranı: kazanç, 2x altın (ödüllü reklam), sonraki adım.
import Phaser from 'phaser';
import { Ads } from '../core/ads';
import { t } from '../core/i18n';
import { Save } from '../core/save';
import { COLORS, button, panel, starBackground, txt } from '../core/ui';
import { PLANETS } from '../data/planets';

interface ResultData {
  mode: 'orbit' | 'transit';
  success: boolean;
  planet: number;
  from?: number;
  gold: number;
}

export class ResultScene extends Phaser.Scene {
  private bg!: { update: (dt: number, speed: number) => void };

  constructor() {
    super('Result');
  }

  create(d: ResultData): void {
    const { width, height } = this.scale;
    this.bg = starBackground(this, false);
    const cy = height / 2;
    const last = d.planet >= PLANETS.length - 1;

    let title: string;
    let color: string;
    if (d.mode === 'orbit') {
      title = d.success ? (last ? t('allClear') : t('planetSafe')) : t('planetLost');
      color = d.success ? '#00ff88' : '#ff2a6d';
    } else {
      title = d.success ? `${t('arrived')}` : t('shipLost');
      color = d.success ? '#00ff88' : '#ff2a6d';
    }

    this.add.image(width / 2, cy - 430, `planet_${PLANETS[d.planet].id}`).setScale(0.75).setAlpha(d.success ? 1 : 0.4);
    panel(this, width / 2, cy + 120, width - 120, 860, d.success ? COLORS.green : COLORS.pink);
    txt(this, width / 2, cy - 220, title, title.length > 16 ? 56 : 72, color, { stroke: '#000', strokeThickness: 8, wordWrap: { width: width - 160 } });
    txt(this, width / 2, cy - 120, t(PLANETS[d.planet].nameKey), 44, '#8ab4f8');
    txt(this, width / 2, cy - 30, `${t('earned')}: ${d.gold} ●`, 46, '#ffd700');

    const adBtn = button(this, width / 2, cy + 90, 640, 120, `▶ ${t('watchAd')}`, async () => {
      adBtn.setEnabled(false);
      const ok = await Ads.showRewarded();
      if (ok) {
        Save.addGold(d.gold);
        adBtn.setLabel(t('adDone'));
      }
    }, { color: COLORS.gold, size: 38 });
    if (d.gold <= 0) adBtn.setEnabled(false);

    let y = cy + 250;
    if (d.mode === 'orbit' && d.success && !last) {
      button(this, width / 2, y, 640, 130, `🚀 ${t('next')}`, () => this.scene.start('Transit', { from: d.planet, to: d.planet + 1 }), { color: COLORS.cyan, size: 48 });
      y += 160;
    } else if (d.mode === 'orbit' && !d.success) {
      button(this, width / 2, y, 640, 130, t('retry'), () => this.scene.start('Orbit', { planet: d.planet }), { color: COLORS.gold, size: 48 });
      y += 160;
    } else if (d.mode === 'transit' && d.success) {
      button(this, width / 2, y, 640, 130, `${t('continueTo')} ▶`, () => this.scene.start('Orbit', { planet: d.planet }), { color: COLORS.cyan, size: 48 });
      y += 160;
    } else if (d.mode === 'transit' && !d.success) {
      button(this, width / 2, y, 640, 130, t('retry'), () => this.scene.start('Transit', { from: d.from ?? d.planet - 1, to: d.planet }), { color: COLORS.gold, size: 48 });
      y += 160;
    }
    button(this, width / 2, y, 640, 120, t('map'), () => this.scene.start('Menu'), { color: COLORS.grey, size: 42 });
  }

  update(_t: number, dt: number): void {
    this.bg.update(dt, 0);
  }
}

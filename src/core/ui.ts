import Phaser from 'phaser';
import { Sfx } from './sfx';

export const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

export const COLORS = {
  cyan: 0x00f0ff,
  blue: 0x0066ff,
  pink: 0xff2a6d,
  gold: 0xffd700,
  green: 0x00ff88,
  panel: 0x0a0f1e,
  panelEdge: 0x1e3a5f,
  grey: 0x3a4456
};

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, size: number, color = '#ffffff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      fontStyle: 'bold',
      align: 'center',
      ...extra
    })
    .setOrigin(0.5)
    .setResolution(Math.min(2, window.devicePixelRatio || 1));
}

export interface Button extends Phaser.GameObjects.Container {
  setEnabled(on: boolean): Button;
  setLabel(s: string): Button;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  opts: { color?: number; textColor?: string; size?: number; fill?: number } = {}
): Button {
  const color = opts.color ?? COLORS.cyan;
  const fill = opts.fill ?? 0x0a1426;
  const g = scene.add.graphics();
  const t = txt(scene, 0, 0, label, opts.size ?? 44, opts.textColor ?? '#ffffff');
  const c = scene.add.container(x, y, [g, t]) as Button;
  let enabled = true;
  const draw = (pressed: boolean) => {
    g.clear();
    const col = enabled ? color : COLORS.grey;
    g.fillStyle(col, enabled ? (pressed ? 0.45 : 0.18) : 0.1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.lineStyle(4, col, enabled ? 1 : 0.5);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.fillStyle(fill, 0.0);
  };
  draw(false);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', () => { if (enabled) draw(true); });
  c.on('pointerout', () => draw(false));
  c.on('pointerup', () => {
    draw(false);
    if (!enabled) return;
    Sfx.click();
    onClick();
  });
  c.setEnabled = (on: boolean) => { enabled = on; t.setAlpha(on ? 1 : 0.5); draw(false); return c; };
  c.setLabel = (s: string) => { t.setText(s); return c; };
  return c;
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, edge = COLORS.panelEdge, alpha = 0.9): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.panel, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 24);
  g.lineStyle(3, edge, 1);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 24);
  return g;
}

export function bar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, ratio: number, color: number, back = 0x330010): void {
  ratio = Phaser.Math.Clamp(ratio, 0, 1);
  g.fillStyle(back, 0.8);
  g.fillRoundedRect(x, y, w, h, h / 2);
  if (ratio > 0) {
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, Math.max(h, w * ratio), h, h / 2);
  }
  g.lineStyle(2, 0xffffff, 0.35);
  g.strokeRoundedRect(x, y, w, h, h / 2);
}

export function banner(scene: Phaser.Scene, s: string, color = '#ffd700', y?: number): void {
  const { width, height } = scene.scale;
  const b = txt(scene, width / 2, y ?? height * 0.36, s, 78, color, { stroke: '#000000', strokeThickness: 8 }).setDepth(50).setAlpha(0).setScale(0.8);
  scene.tweens.add({ targets: b, alpha: 1, scale: 1, duration: 260, ease: 'Back.Out', yoyo: true, hold: 1300, onComplete: () => b.destroy() });
}

// Arka plan: yıldızlar + bulutsu, isteğe bağlı kayma
export function starBackground(scene: Phaser.Scene, scroll: boolean): { update: (dt: number, speed: number) => void } {
  const { width, height } = scene.scale;
  scene.add.image(width / 2, height / 2, 'nebula').setDisplaySize(width * 1.4, height * 1.2).setAlpha(0.9).setDepth(-20);
  const far = scene.add.tileSprite(width / 2, height / 2, width, height, 'starfield').setDepth(-19).setAlpha(0.6).setTileScale(1.4);
  const near = scene.add.tileSprite(width / 2, height / 2, width, height, 'starfield').setDepth(-18).setTileScale(2.2);
  near.tilePositionX = 200;
  return {
    update: (dt: number, speed: number) => {
      if (!scroll) { far.tilePositionY -= dt * 0.002; near.tilePositionY -= dt * 0.004; return; }
      far.tilePositionY -= (dt / 1000) * speed * 0.35;
      near.tilePositionY -= (dt / 1000) * speed * 0.7;
    }
  };
}

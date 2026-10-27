import Phaser from 'phaser';
import { buildTextures } from '../core/textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    buildTextures(this);
    // Test/hata ayıklama için doğrudan sahne açma: ?scene=Orbit&planet=2
    const q = new URLSearchParams(location.search);
    const scene = q.get('scene');
    if (scene === 'Orbit') this.scene.start('Orbit', { planet: Number(q.get('planet') ?? 0) });
    else if (scene === 'Transit') this.scene.start('Transit', { from: Number(q.get('planet') ?? 0), to: Number(q.get('planet') ?? 0) + 1 });
    else if (scene === 'Shop') this.scene.start('Shop');
    else this.scene.start('Menu');
  }
}

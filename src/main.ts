import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ShopScene } from './scenes/ShopScene';
import { OrbitScene } from './scenes/OrbitScene';
import { TransitScene } from './scenes/TransitScene';
import { ResultScene } from './scenes/ResultScene';
import { Save } from './core/save';

// Mantıksal çözünürlük 1080x1920 (dikey). EXPAND: uzun ekranlı telefonlarda (Honor 600 ~19.5:9) boşluk bırakmadan genişler.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#03030a',
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, MenuScene, ShopScene, OrbitScene, TransitScene, ResultScene]
});

// Otomatik testler (bot denge testi) için
(window as unknown as { __game: Phaser.Game; __save: typeof Save }).__game = game;
(window as unknown as { __save: typeof Save }).__save = Save;

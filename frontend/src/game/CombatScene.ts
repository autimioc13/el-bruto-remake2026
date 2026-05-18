import Phaser from 'phaser';
import type { CombatEvent } from '../types';

export interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  rank: string;
  weaponType?: string | null;
  petType?: string | null;
  imgEl?: HTMLImageElement;
  weaponImgEl?: HTMLImageElement;
  petImgEl?: HTMLImageElement;
}

export interface CombatSceneConfig {
  logData: CombatEvent[];
  attackerName: string;
  defenderName: string;
  winnerId: string;
  attackerConfig: CharacterConfig;
  defenderConfig: CharacterConfig;
  onComplete: (winnerId: string) => void;
}

export class CombatScene extends Phaser.Scene {
  private cfg!: CombatSceneConfig;
  private attackerContainer!: Phaser.GameObjects.Container;
  private defenderContainer!: Phaser.GameObjects.Container;
  private attackerHpBar!: Phaser.GameObjects.Rectangle;
  private defenderHpBar!: Phaser.GameObjects.Rectangle;
  private attackerMaxHp = 100;
  private defenderMaxHp = 100;
  private currentAtkHp = 100;
  private currentDefHp = 100;
  private eventIndex = 0;
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super('CombatScene'); }

  init(config: CombatSceneConfig) {
    this.cfg = config;
    const firstAtkHp = config.logData.find(e => e.attacker_hp !== undefined)?.attacker_hp;
    const firstDefHp = config.logData.find(e => e.defender_hp !== undefined)?.defender_hp;
    if (firstAtkHp !== undefined) this.attackerMaxHp = firstAtkHp + (config.logData[0]?.damage || 0);
    if (firstDefHp !== undefined) this.defenderMaxHp = firstDefHp + (config.logData[0]?.damage || 0);
    this.currentAtkHp = this.attackerMaxHp;
    this.currentDefHp = this.defenderMaxHp;
  }

  preload() {
    // No async loading here — images are pre-loaded in Arena.tsx and passed as HTMLImageElement
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Register pre-loaded images synchronously into Phaser's texture manager
    const addImg = (key: string, el?: HTMLImageElement) => {
      if (el && el.complete && el.naturalWidth > 0 && !this.textures.exists(key)) {
        this.textures.addImage(key, el);
      }
    };
    addImg('atk_char', this.cfg.attackerConfig.imgEl);
    addImg('def_char', this.cfg.defenderConfig.imgEl);
    addImg('atk_weapon', this.cfg.attackerConfig.weaponImgEl);
    addImg('def_weapon', this.cfg.defenderConfig.weaponImgEl);
    addImg('atk_pet', this.cfg.attackerConfig.petImgEl);
    addImg('def_pet', this.cfg.defenderConfig.petImgEl);

    // Arena background
    this.add.rectangle(W / 2, H / 2, W, H, 0x120900);
    this.add.rectangle(W / 2, H * 0.78, W, H * 0.44, 0x1e0f00);
    // Floor line
    this.add.rectangle(W / 2, H * 0.56, W, 2, 0x5a3800, 0.6);
    // Vignette-like dark edges (just dark rects on sides)
    this.add.rectangle(0, H / 2, 40, H, 0x000000, 0.5).setOrigin(0, 0.5);
    this.add.rectangle(W, H / 2, 40, H, 0x000000, 0.5).setOrigin(1, 0.5);

    this.attackerContainer = this.createFighterContainer(W * 0.25, H * 0.5, 'atk_char', 'atk_weapon', 'atk_pet', false);
    this.defenderContainer = this.createFighterContainer(W * 0.75, H * 0.5, 'def_char', 'def_weapon', 'def_pet', true);

    // Name labels
    this.add.text(W * 0.25, H * 0.18, this.cfg.attackerName, {
      fontSize: '15px', color: '#f5c842', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);
    this.add.text(W * 0.75, H * 0.18, this.cfg.defenderName, {
      fontSize: '15px', color: '#f5c842', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5);

    // HP bar backgrounds
    this.add.rectangle(W * 0.25, H * 0.29, 122, 12, 0x111111).setOrigin(0.5);
    this.add.rectangle(W * 0.75, H * 0.29, 122, 12, 0x111111).setOrigin(0.5);
    // HP bar borders
    this.add.rectangle(W * 0.25, H * 0.29, 124, 14, 0x4a3000).setOrigin(0.5).setDepth(-1);
    this.add.rectangle(W * 0.75, H * 0.29, 124, 14, 0x4a3000).setOrigin(0.5).setDepth(-1);
    // HP bars
    this.attackerHpBar = this.add.rectangle(W * 0.25 - 61, H * 0.29, 120, 10, 0x22cc44).setOrigin(0, 0.5);
    this.defenderHpBar = this.add.rectangle(W * 0.75 - 61, H * 0.29, 120, 10, 0x22cc44).setOrigin(0, 0.5);

    // Status text box
    this.statusText = this.add.text(W / 2, H * 0.88, '', {
      fontSize: '13px', color: '#f0d090',
      backgroundColor: '#1a0d00',
      padding: { x: 12, y: 6 },
      shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 3, fill: true },
    }).setOrigin(0.5);

    this.time.addEvent({ delay: 550, callback: this.processNextEvent, callbackScope: this, loop: true });
  }

  private createFighterContainer(x: number, y: number, charKey: string, weaponKey: string, petKey: string, flip: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    if (this.textures.exists(charKey)) {
      const sprite = this.add.image(0, 0, charKey).setScale(1.4);
      if (flip) sprite.setFlipX(true);
      container.add(sprite);
    } else {
      // Styled fallback — colored silhouette
      const body = this.add.rectangle(0, 5, 36, 52, flip ? 0x991b1b : 0x1d4ed8);
      const head = this.add.rectangle(0, -34, 28, 28, flip ? 0xb91c1c : 0x2563eb);
      container.add([body, head]);
    }

    if (this.textures.exists(weaponKey)) {
      const wSprite = this.add.image(flip ? -38 : 38, 8, weaponKey).setScale(0.75);
      if (flip) wSprite.setFlipX(true);
      container.add(wSprite);
    }

    if (this.textures.exists(petKey)) {
      const pSprite = this.add.image(flip ? 50 : -50, 12, petKey).setScale(0.9);
      container.add(pSprite);
    }

    return container;
  }

  private processNextEvent() {
    if (this.eventIndex >= this.cfg.logData.length) {
      this.time.removeAllEvents();
      this.time.delayedCall(1400, () => this.cfg.onComplete(this.cfg.winnerId));
      return;
    }

    const event = this.cfg.logData[this.eventIndex++];
    const isAtk = event.actor === 'attacker';
    const mover = isAtk ? this.attackerContainer : this.defenderContainer;
    const target = isAtk ? this.defenderContainer : this.attackerContainer;
    const actorName = isAtk ? this.cfg.attackerName : this.cfg.defenderName;

    if (event.action === 'dodge') {
      this.statusText.setText(`💨 ${actorName} esquiva!`);
      this.tweens.add({ targets: mover, y: mover.y - 22, duration: 130, yoyo: true, ease: 'Sine.easeOut' });
      return;
    }

    const originX = mover.x;
    this.tweens.add({
      targets: mover,
      x: isAtk ? mover.x + 55 : mover.x - 55,
      duration: 110, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => {
        mover.x = originX;
        const isCrit = event.action === 'critical';
        const label = isCrit ? '💥 ¡CRÍTICO!' : '⚔ ataca';
        this.statusText.setText(`${actorName} ${label} −${event.damage} HP`);
        if (isCrit) this.statusText.setColor('#ff6b35');
        else this.statusText.setColor('#f0d090');
        this.cameras.main.shake(90, 0.005);
        this.tweens.add({ targets: target, alpha: 0.15, duration: 90, yoyo: true });

        if (event.defender_hp !== undefined) {
          this.currentDefHp = event.defender_hp;
          const pct = Math.max(0, this.currentDefHp / this.defenderMaxHp);
          this.defenderHpBar.scaleX = pct;
          this.defenderHpBar.setFillStyle(pct > 0.5 ? 0x22cc44 : pct > 0.25 ? 0xf59e0b : 0xef4444);
        }
        if (event.attacker_hp !== undefined) {
          this.currentAtkHp = event.attacker_hp;
          const pct = Math.max(0, this.currentAtkHp / this.attackerMaxHp);
          this.attackerHpBar.scaleX = pct;
          this.attackerHpBar.setFillStyle(pct > 0.5 ? 0x22cc44 : pct > 0.25 ? 0xf59e0b : 0xef4444);
        }
      },
    });
  }
}

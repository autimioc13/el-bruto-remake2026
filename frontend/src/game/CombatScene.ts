import Phaser from 'phaser';
import type { CombatEvent } from '../types';
import { characterSVG, svgToDataUrl } from '../sprites/characters';
import { WEAPON_SVGS } from '../sprites/weapons';
import { PET_SVGS } from '../sprites/pets';

export interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  rank: string;
  weaponType?: string | null;
  petType?: string | null;
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
    const atkSvg = characterSVG(this.cfg.attackerConfig.skinColor, this.cfg.attackerConfig.hairColor, this.cfg.attackerConfig.rank);
    const defSvg = characterSVG(this.cfg.defenderConfig.skinColor, this.cfg.defenderConfig.hairColor, this.cfg.defenderConfig.rank);
    this.textures.addBase64('atk_char', svgToDataUrl(atkSvg).replace('data:image/svg+xml;base64,', ''));
    this.textures.addBase64('def_char', svgToDataUrl(defSvg).replace('data:image/svg+xml;base64,', ''));

    if (this.cfg.attackerConfig.weaponType && WEAPON_SVGS[this.cfg.attackerConfig.weaponType]) {
      this.textures.addBase64('atk_weapon', btoa(unescape(encodeURIComponent(WEAPON_SVGS[this.cfg.attackerConfig.weaponType]))));
    }
    if (this.cfg.defenderConfig.weaponType && WEAPON_SVGS[this.cfg.defenderConfig.weaponType]) {
      this.textures.addBase64('def_weapon', btoa(unescape(encodeURIComponent(WEAPON_SVGS[this.cfg.defenderConfig.weaponType]))));
    }
    if (this.cfg.attackerConfig.petType && PET_SVGS[this.cfg.attackerConfig.petType]) {
      this.textures.addBase64('atk_pet', btoa(unescape(encodeURIComponent(PET_SVGS[this.cfg.attackerConfig.petType]))));
    }
    if (this.cfg.defenderConfig.petType && PET_SVGS[this.cfg.defenderConfig.petType]) {
      this.textures.addBase64('def_pet', btoa(unescape(encodeURIComponent(PET_SVGS[this.cfg.defenderConfig.petType]))));
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0xd4a017);
    this.add.rectangle(W / 2, H * 0.75, W, H * 0.5, 0xa0522d);

    this.attackerContainer = this.createFighterContainer(W * 0.25, H * 0.55, 'atk_char', 'atk_weapon', 'atk_pet', false);
    this.defenderContainer = this.createFighterContainer(W * 0.75, H * 0.55, 'def_char', 'def_weapon', 'def_pet', true);

    this.add.text(W * 0.25, H * 0.2, this.cfg.attackerName, { fontSize: '16px', color: '#3b1f00', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W * 0.75, H * 0.2, this.cfg.defenderName, { fontSize: '16px', color: '#3b1f00', fontStyle: 'bold' }).setOrigin(0.5);

    this.add.rectangle(W * 0.25, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);
    this.add.rectangle(W * 0.75, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);
    this.attackerHpBar = this.add.rectangle(W * 0.25 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);
    this.defenderHpBar = this.add.rectangle(W * 0.75 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);

    this.statusText = this.add.text(W / 2, H * 0.85, '', {
      fontSize: '14px', color: '#3b1f00', backgroundColor: '#f5e6c8', padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.time.addEvent({ delay: 500, callback: this.processNextEvent, callbackScope: this, loop: true });
  }

  private createFighterContainer(x: number, y: number, charKey: string, weaponKey: string, petKey: string, flip: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    if (this.textures.exists(charKey)) {
      const sprite = this.add.image(0, 0, charKey).setScale(1.2);
      if (flip) sprite.setFlipX(true);
      container.add(sprite);
    } else {
      container.add(this.add.rectangle(0, 0, 50, 80, flip ? 0xff4444 : 0x4444ff));
    }

    if (this.textures.exists(weaponKey)) {
      const wSprite = this.add.image(flip ? -35 : 35, 10, weaponKey).setScale(0.7);
      if (flip) wSprite.setFlipX(true);
      container.add(wSprite);
    }

    if (this.textures.exists(petKey)) {
      const pSprite = this.add.image(flip ? 45 : -45, 15, petKey).setScale(0.85);
      container.add(pSprite);
    }

    return container;
  }

  private processNextEvent() {
    if (this.eventIndex >= this.cfg.logData.length) {
      this.time.removeAllEvents();
      this.time.delayedCall(1200, () => this.cfg.onComplete(this.cfg.winnerId));
      return;
    }

    const event = this.cfg.logData[this.eventIndex++];
    const isAtk = event.actor === 'attacker';
    const mover = isAtk ? this.attackerContainer : this.defenderContainer;
    const target = isAtk ? this.defenderContainer : this.attackerContainer;
    const actorName = isAtk ? this.cfg.attackerName : this.cfg.defenderName;

    if (event.action === 'dodge') {
      this.statusText.setText(`${actorName} esquiva!`);
      this.tweens.add({ targets: mover, y: mover.y - 18, duration: 120, yoyo: true });
      return;
    }

    const originX = mover.x;
    this.tweens.add({
      targets: mover,
      x: isAtk ? mover.x + 50 : mover.x - 50,
      duration: 120, yoyo: true,
      onComplete: () => {
        mover.x = originX;
        const label = event.action === 'critical' ? 'CRÍTICO' : 'ataca';
        this.statusText.setText(`${actorName} ${label}! −${event.damage} HP`);
        this.cameras.main.shake(80, 0.004);
        this.tweens.add({ targets: target, alpha: 0.2, duration: 80, yoyo: true });

        if (event.defender_hp !== undefined) {
          this.currentDefHp = event.defender_hp;
          this.defenderHpBar.scaleX = Math.max(0, this.currentDefHp / this.defenderMaxHp);
        }
        if (event.attacker_hp !== undefined) {
          this.currentAtkHp = event.attacker_hp;
          this.attackerHpBar.scaleX = Math.max(0, this.currentAtkHp / this.attackerMaxHp);
        }
      },
    });
  }
}

import Phaser from 'phaser';
import type { CombatEvent } from '../types';

export interface CombatSceneConfig {
  logData: CombatEvent[];
  attackerName: string;
  defenderName: string;
  winnerId: string;
  onComplete: (winnerId: string) => void;
}

export class CombatScene extends Phaser.Scene {
  private cfg!: CombatSceneConfig;
  private attackerSprite!: Phaser.GameObjects.Rectangle;
  private defenderSprite!: Phaser.GameObjects.Rectangle;
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

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0xd4a017);
    this.add.rectangle(W / 2, H * 0.75, W, H * 0.5, 0xa0522d);

    this.attackerSprite = this.add.rectangle(W * 0.25, H * 0.55, 60, 90, 0x4444ff);
    this.defenderSprite = this.add.rectangle(W * 0.75, H * 0.55, 60, 90, 0xff4444);

    this.add.text(W * 0.25, H * 0.2, this.cfg.attackerName, {
      fontSize: '18px', color: '#3b1f00', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W * 0.75, H * 0.2, this.cfg.defenderName, {
      fontSize: '18px', color: '#3b1f00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.rectangle(W * 0.25, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);
    this.add.rectangle(W * 0.75, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);

    this.attackerHpBar = this.add.rectangle(W * 0.25 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);
    this.defenderHpBar = this.add.rectangle(W * 0.75 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);

    this.statusText = this.add.text(W / 2, H * 0.85, '', {
      fontSize: '15px', color: '#3b1f00',
      backgroundColor: '#f5e6c8',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 500,
      callback: this.processNextEvent,
      callbackScope: this,
      loop: true,
    });
  }

  private processNextEvent() {
    if (this.eventIndex >= this.cfg.logData.length) {
      this.time.removeAllEvents();
      this.time.delayedCall(1200, () => this.cfg.onComplete(this.cfg.winnerId));
      return;
    }

    const event = this.cfg.logData[this.eventIndex++];
    const isAtk = event.actor === 'attacker';
    const sprite = isAtk ? this.attackerSprite : this.defenderSprite;
    const targetSprite = isAtk ? this.defenderSprite : this.attackerSprite;
    const actorName = isAtk ? this.cfg.attackerName : this.cfg.defenderName;

    if (event.action === 'dodge') {
      this.statusText.setText(`${actorName} esquiva!`);
      this.tweens.add({ targets: sprite, y: sprite.y - 18, duration: 120, yoyo: true });
      return;
    }

    const originX = sprite.x;
    this.tweens.add({
      targets: sprite,
      x: isAtk ? sprite.x + 50 : sprite.x - 50,
      duration: 120,
      yoyo: true,
      onComplete: () => {
        sprite.x = originX;
        const label = event.action === 'critical' ? 'CRÍTICO' : 'ataca';
        this.statusText.setText(`${actorName} ${label}! −${event.damage} HP`);
        this.cameras.main.shake(80, 0.004);
        this.tweens.add({ targets: targetSprite, alpha: 0.2, duration: 80, yoyo: true });

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

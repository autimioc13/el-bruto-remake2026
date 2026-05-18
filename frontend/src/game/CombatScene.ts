import Phaser from 'phaser';
import type { CombatEvent } from '../types';

export interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  rank: string;
  hairStyle?: string;
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
  winnerName: string;
  attackerConfig: CharacterConfig;
  defenderConfig: CharacterConfig;
  onComplete: (winnerId: string) => void;
}

const FLOOR_Y = 0.64;
const ATK_X   = 0.24;
const DEF_X   = 0.76;

export class CombatScene extends Phaser.Scene {
  private cfg!: CombatSceneConfig;
  private atkSprite!: Phaser.GameObjects.Container;
  private defSprite!: Phaser.GameObjects.Container;
  private atkHpBar!: Phaser.GameObjects.Rectangle;
  private defHpBar!: Phaser.GameObjects.Rectangle;
  private atkMaxHp = 100;
  private defMaxHp = 100;
  private atkHp = 100;
  private defHp = 100;
  private eventIndex = 0;
  private statusText!: Phaser.GameObjects.Text;
  private timer!: Phaser.Time.TimerEvent;
  private atkIdle?: Phaser.Tweens.Tween;
  private defIdle?: Phaser.Tweens.Tween;
  private busy = false;

  constructor() { super('CombatScene'); }

  init(cfg: CombatSceneConfig) {
    this.cfg = cfg;
    let mAtk = 0, mDef = 0;
    for (const e of cfg.logData) {
      if (e.attacker_hp !== undefined) mAtk = Math.max(mAtk, e.attacker_hp + (e.actor === 'defender' ? (e.damage ?? 0) : 0));
      if (e.defender_hp !== undefined) mDef = Math.max(mDef, e.defender_hp + (e.actor === 'attacker' ? (e.damage ?? 0) : 0));
    }
    this.atkMaxHp = mAtk || 100;
    this.defMaxHp = mDef || 100;
    this.atkHp = this.atkMaxHp;
    this.defHp = this.defMaxHp;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const fY = H * FLOOR_Y;
    const aX = W * ATK_X;
    const dX = W * DEF_X;

    this.buildArena(W, H, fY);

    const reg = (key: string, el?: HTMLImageElement) => {
      if (el?.complete && el.naturalWidth > 0 && !this.textures.exists(key))
        this.textures.addImage(key, el);
    };
    reg('atk_char',   this.cfg.attackerConfig.imgEl);
    reg('def_char',   this.cfg.defenderConfig.imgEl);
    reg('atk_weapon', this.cfg.attackerConfig.weaponImgEl);
    reg('def_weapon', this.cfg.defenderConfig.weaponImgEl);
    reg('atk_pet',    this.cfg.attackerConfig.petImgEl);
    reg('def_pet',    this.cfg.defenderConfig.petImgEl);

    this.atkSprite = this.makeFighter(aX, fY, 'atk_char', 'atk_weapon', 'atk_pet', false);
    this.defSprite = this.makeFighter(dX, fY, 'def_char', 'def_weapon', 'def_pet', true);

    this.buildHUD(W, H);

    this.statusText = this.add.text(W / 2, H * 0.915, '', {
      fontSize: '13px', color: '#f5d070', fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(20);

    this.atkIdle = this.makeIdle(this.atkSprite);
    this.defIdle = this.makeIdle(this.defSprite, 800);

    this.timer = this.time.addEvent({ delay: 650, callback: this.tick, callbackScope: this, loop: true });
  }

  // ─── Arena background ──────────────────────────────────────────────────────

  private buildArena(W: number, H: number, fY: number) {
    const g = this.add.graphics();

    // Sky
    g.fillStyle(0x0d0500); g.fillRect(0, 0, W, H);

    // Stone-wall tiers
    const tiers: [number, number, number][] = [
      [0,         fY * 0.50, 0x1a0b04],
      [fY * 0.50, fY * 0.28, 0x1f1005],
      [fY * 0.78, fY * 0.22, 0x261405],
    ];
    for (const [y, h, c] of tiers) { g.fillStyle(c); g.fillRect(0, y, W, h); }

    // Stone brick texture
    g.lineStyle(1, 0x3a1a06, 0.4);
    for (let y = 8; y < fY; y += 16) g.lineBetween(0, y, W, y);
    for (let col = 0; col < W; col += 56) {
      const off = (Math.floor(col / 56) % 2) * 8;
      for (let y = off; y < fY; y += 16) g.lineBetween(col, y, col + 56, y);
    }

    // Crowd silhouettes
    g.fillStyle(0x060200, 0.9);
    for (let i = 0; i < 38; i++) {
      const cx = (i + 0.5) * (W / 38);
      const cy = fY * 0.25 + Math.sin(i * 2.3) * 5 + Math.sin(i * 0.9) * 3;
      const r  = 8 + Math.sin(i * 1.7) * 2.5;
      g.fillCircle(cx, cy, r);
      g.fillRect(cx - r * 0.4, cy, r * 0.9, r * 1.1);
    }

    // Sand/dirt floor
    g.fillStyle(0x3d1e00); g.fillRect(0, fY, W, H - fY);
    g.fillStyle(0x4a2400, 0.6); g.fillRect(0, fY, W, 20);
    // Arena floor shadows
    g.fillStyle(0x000000, 0.4); g.fillRect(0, fY - 10, W, 18);
    // Floor line highlight
    g.lineStyle(2, 0x7a4800, 0.9); g.lineBetween(0, fY, W, fY);

    // Torches
    this.makeTorch(g, W * 0.07, fY * 0.62);
    this.makeTorch(g, W * 0.93, fY * 0.62);

    // Dark edge columns
    g.fillStyle(0x040200, 0.9); g.fillRect(0, 0, 22, H);
    g.fillStyle(0x040200, 0.9); g.fillRect(W - 22, 0, 22, H);

    // Arch top ornament lines
    g.lineStyle(2, 0x5a3000, 0.5);
    g.lineBetween(22, 0, 22, H);
    g.lineBetween(W - 22, 0, W - 22, H);

    // Animated torch flicker (tween alpha on an overlay)
    const glow1 = this.add.ellipse(W * 0.07, fY * 0.62, 80, 80, 0xff6600, 0.08).setDepth(1);
    const glow2 = this.add.ellipse(W * 0.93, fY * 0.62, 80, 80, 0xff6600, 0.08).setDepth(1);
    this.tweens.add({ targets: [glow1, glow2], alpha: 0.15, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private makeTorch(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0xff6600, 0.06); g.fillCircle(x, y, 50);
    g.fillStyle(0xff8800, 0.10); g.fillCircle(x, y, 28);
    g.fillStyle(0xffcc00, 0.18); g.fillCircle(x, y, 10);
    g.fillStyle(0x5a3000); g.fillRect(x - 3, y + 2, 6, 18);
    g.fillStyle(0xff4400); g.fillTriangle(x, y - 14, x - 7, y + 2, x + 7, y + 2);
    g.fillStyle(0xffcc00); g.fillTriangle(x, y - 8,  x - 4, y + 2, x + 4, y + 2);
  }

  // ─── Fighter setup ─────────────────────────────────────────────────────────

  private makeFighter(x: number, fY: number, charKey: string, wpnKey: string, petKey: string, flip: boolean) {
    // Drop shadow
    this.add.ellipse(x, fY + 5, 58, 12, 0x000000, 0.45).setDepth(2);

    const c = this.add.container(x, fY).setDepth(5);

    if (this.textures.exists(charKey)) {
      const img = this.add.image(0, 0, charKey);
      // Scale to ~95px tall, feet at origin
      const s = 95 / img.height;
      img.setScale(s).setOrigin(0.5, 1);
      if (flip) img.setFlipX(true);
      c.add(img);
    } else {
      const col = flip ? 0x991b1b : 0x1d4ed8;
      c.add([
        this.add.rectangle(0, -30, 32, 56, col).setOrigin(0.5, 1),
        this.add.rectangle(0, -85, 28, 28, col),
      ]);
    }

    if (this.textures.exists(wpnKey)) {
      const w = this.add.image(flip ? -44 : 44, -42, wpnKey).setScale(0.72);
      if (flip) w.setFlipX(true);
      c.add(w);
    }
    if (this.textures.exists(petKey)) {
      c.add(this.add.image(flip ? 58 : -58, -22, petKey).setScale(0.85));
    }

    return c;
  }

  private makeIdle(target: Phaser.GameObjects.Container, delay = 0): Phaser.Tweens.Tween {
    return this.tweens.add({
      targets: target, scaleY: 0.95,
      duration: 1700, delay, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD(W: number, H: number) {
    const aX = W * ATK_X;
    const dX = W * DEF_X;
    const nY = H * 0.09;
    const bY = H * 0.18;
    const bW = 148;
    const bH = 13;

    const nameStyle = {
      fontSize: '14px', color: '#f5c842', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 6, fill: true },
    };
    this.add.text(aX, nY, this.cfg.attackerName, nameStyle).setOrigin(0.5).setDepth(10);
    this.add.text(dX, nY, this.cfg.defenderName, nameStyle).setOrigin(0.5).setDepth(10);

    for (const bx of [aX, dX]) {
      this.add.rectangle(bx, bY, bW + 6, bH + 6, 0x000000, 0.8).setDepth(8);
      this.add.rectangle(bx, bY, bW + 2, bH + 2, 0x5a3000).setDepth(9);
      this.add.rectangle(bx, bY, bW, bH, 0x1a1a1a).setDepth(10);
    }

    this.atkHpBar = this.add.rectangle(aX - bW / 2, bY, bW, bH, 0x22cc44).setOrigin(0, 0.5).setDepth(11);
    this.defHpBar = this.add.rectangle(dX - bW / 2, bY, bW, bH, 0x22cc44).setOrigin(0, 0.5).setDepth(11);
  }

  // ─── Event loop ────────────────────────────────────────────────────────────

  private tick() {
    if (this.busy) return;
    if (this.eventIndex >= this.cfg.logData.length) {
      this.timer.remove();
      this.time.delayedCall(300, () => this.endScene());
      return;
    }
    const ev = this.cfg.logData[this.eventIndex++]!;
    this.playEvent(ev);
  }

  private playEvent(ev: CombatEvent) {
    const isAtk  = ev.actor === 'attacker';
    const mover  = isAtk ? this.atkSprite : this.defSprite;
    const target = isAtk ? this.defSprite : this.atkSprite;
    const name   = isAtk ? this.cfg.attackerName : this.cfg.defenderName;

    if (ev.action === 'dodge') {
      this.statusText.setText(`💨 ${name} esquiva!`).setColor('#a8d8ff');
      this.tweens.add({ targets: mover, y: mover.y - 30, duration: 150, yoyo: true, ease: 'Sine.easeOut' });
      return;
    }

    const isCrit = ev.action === 'critical';
    this.busy = true;

    // Pause idle on mover
    (isAtk ? this.atkIdle : this.defIdle)?.pause();
    this.tweens.killTweensOf(mover);

    const oX = mover.x;
    const dir = isAtk ? 1 : -1;
    const lunge = isCrit ? 95 : 70;

    this.tweens.add({
      targets: mover,
      x: oX + dir * lunge,
      duration: isCrit ? 90 : 110,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Impact
        this.impactBurst(target.x, target.y - 52, isCrit);
        this.tweens.add({ targets: target, alpha: 0.18, duration: 85, yoyo: true });
        this.cameras.main.shake(isCrit ? 180 : 80, isCrit ? 0.013 : 0.005);
        if (isCrit) this.screenFlash(0xff4400, 0.16);

        const dmg = ev.damage ?? 0;
        this.floatDamage(target.x, target.y - 60, dmg, isCrit);

        const label = isCrit ? '💥 ¡CRÍTICO!' : '⚔ ataca';
        this.statusText.setText(`${name}  ${label}  −${dmg} HP`).setColor(isCrit ? '#ff8844' : '#f5d070');

        this.applyHp(ev);

        // Return
        this.tweens.add({
          targets: mover, x: oX,
          duration: 190, ease: 'Sine.easeOut',
          onComplete: () => {
            mover.x = oX;
            if (isAtk) this.atkIdle = this.makeIdle(mover);
            else       this.defIdle = this.makeIdle(mover);
            this.busy = false;
          },
        });
      },
    });
  }

  private applyHp(ev: CombatEvent) {
    const BAR = 148;
    if (ev.defender_hp !== undefined) {
      this.defHp = ev.defender_hp;
      const p = Math.max(0, this.defHp / this.defMaxHp);
      this.tweens.add({ targets: this.defHpBar, scaleX: p, duration: 260, ease: 'Sine.easeOut' });
      this.defHpBar.setFillStyle(p > 0.5 ? 0x22cc44 : p > 0.25 ? 0xf59e0b : 0xef4444);
    }
    if (ev.attacker_hp !== undefined) {
      this.atkHp = ev.attacker_hp;
      const p = Math.max(0, this.atkHp / this.atkMaxHp);
      this.tweens.add({ targets: this.atkHpBar, scaleX: p, duration: 260, ease: 'Sine.easeOut' });
      this.atkHpBar.setFillStyle(p > 0.5 ? 0x22cc44 : p > 0.25 ? 0xf59e0b : 0xef4444);
    }
  }

  // ─── Visual effects ────────────────────────────────────────────────────────

  private impactBurst(x: number, y: number, crit: boolean) {
    const g = this.add.graphics().setDepth(25);
    const color = crit ? 0xff4400 : 0xffffff;
    const r = crit ? 28 : 18;
    g.fillStyle(color, 0.9);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const a2 = a + Math.PI / 8;
      const a3 = a + Math.PI / 4;
      g.fillTriangle(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a2) * r * 0.35, y + Math.sin(a2) * r * 0.35);
      g.fillTriangle(x, y, x + Math.cos(a2) * r * 0.35, y + Math.sin(a2) * r * 0.35, x + Math.cos(a3) * r, y + Math.sin(a3) * r);
    }
    // Center glow
    g.fillStyle(0xffffff, 0.8); g.fillCircle(x, y, r * 0.28);
    this.tweens.add({ targets: g, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 320, ease: 'Sine.easeOut', onComplete: () => g.destroy() });
  }

  private floatDamage(x: number, y: number, dmg: number, crit: boolean) {
    const t = this.add.text(x + Phaser.Math.Between(-10, 10), y, `−${dmg}`, {
      fontSize: crit ? '24px' : '17px',
      color: crit ? '#ff5500' : '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 1, offsetY: 2, color: '#000', blur: 5, fill: true },
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 950, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  private screenFlash(color: number, alpha: number) {
    const { width: W, height: H } = this.scale;
    const r = this.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(50);
    this.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }

  // ─── End scene ─────────────────────────────────────────────────────────────

  private endScene() {
    const W = this.scale.width;
    const H = this.scale.height;
    const atkWins = this.cfg.winnerName === this.cfg.attackerName;
    const winner = atkWins ? this.atkSprite : this.defSprite;
    const loser  = atkWins ? this.defSprite : this.atkSprite;

    // Kill idles
    this.atkIdle?.stop(); this.defIdle?.stop();

    // Loser falls
    this.tweens.add({
      targets: loser,
      scaleY: 0, y: loser.y + 18,
      alpha: 0, duration: 480, ease: 'Sine.easeIn',
    });

    // Winner victory bounce x3
    this.tweens.add({
      targets: winner,
      y: winner.y - 35,
      duration: 220, yoyo: true, repeat: 2, ease: 'Sine.easeOut',
    });

    this.time.delayedCall(550, () => {
      this.screenFlash(0xffcc00, 0.14);

      // Dark banner
      this.add.rectangle(W / 2, H / 2, W, 66, 0x000000, 0.78).setDepth(45);
      // Crown icon
      this.add.text(W / 2, H / 2 - 18, '👑', { fontSize: '18px' }).setOrigin(0.5).setDepth(46);
      // Winner text
      this.add.text(W / 2, H / 2 + 8, `¡${this.cfg.winnerName.toUpperCase()} GANA!`, {
        fontSize: '26px', color: '#f59e0b', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 3, color: '#000', blur: 10, fill: true },
      }).setOrigin(0.5).setDepth(46);
    });

    this.time.delayedCall(2400, () => this.cfg.onComplete(this.cfg.winnerId));
  }
}

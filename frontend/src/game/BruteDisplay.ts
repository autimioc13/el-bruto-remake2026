/**
 * Ported from labrute-react/client/src/utils/BruteDisplay.ts
 * Uses labrute-static-fla-parser (original Flash assets) + PixiJS v6
 */
import type { FramePart, Symbol as LaBruteSymbol, Svg } from 'labrute-static-fla-parser';
import type { OutlineFilter as OutlineFilterType } from '@pixi/filter-outline';
import type * as PIXIType from 'pixi.js';
import { readBodyString } from '../utils/bruteBody';
import { readColorString, type BruteColors } from '../utils/bruteColors';

type BruteBodyParts = ReturnType<typeof readBodyString>;

type SvgsToLoad = { svg: Svg; count: number }[];

// Lazy-loaded PixiJS modules (only loaded when needed)
let PIXI: typeof PIXIType;
let OutlineFilter: typeof OutlineFilterType;
let Symbol460: LaBruteSymbol;
let Symbol752: LaBruteSymbol;
let modulesLoaded = false;

export async function loadBruteModules() {
  if (modulesLoaded) return;
  const [pixiMod, filterMod, parserMod] = await Promise.all([
    import('pixi.js'),
    import('@pixi/filter-outline'),
    import('labrute-static-fla-parser'),
  ]);
  PIXI = pixiMod as any;
  OutlineFilter = filterMod.OutlineFilter as any;
  Symbol460 = (parserMod as any).Symbol460;
  Symbol752 = (parserMod as any).Symbol752;
  modulesLoaded = true;
}

function matrixFromObj(t: FramePart['transform'], scale = 1) {
  return new PIXI.Matrix(t?.a??1, t?.b??0, t?.c??0, t?.d??1, (t?.tx??0)*scale, (t?.ty??0)*scale);
}

const COLOR_OFFSET_SHADER = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec3 offset;
uniform vec3 mult;
void main(void){
  vec4 color = texture2D(uSampler, vTextureCoord);
  gl_FragColor = vec4(vec3(
    (color.r/color.a)*mult.r + offset.r/255.0,
    (color.g/color.a)*mult.g + offset.g/255.0,
    (color.b/color.a)*mult.b + offset.b/255.0
  )*color.a, color.a);
}`;

export class BruteDisplay {
  gender: 'male' | 'female';
  #colors: BruteColors;
  #parts: BruteBodyParts;
  readonly #looking: 'left' | 'right';
  container: PIXIType.Container;
  svgs: PIXIType.Sprite[] = [];
  #pendingSvgs = 0;
  #usedSvgs: Record<string, number> = {};
  #scale: number;
  #onLoad: (() => void) | undefined;

  constructor(
    gender: 'male' | 'female',
    colorsString: string,
    bodyString: string,
    looking: 'left' | 'right' = 'left',
    scale = 1,
  ) {
    this.gender = gender;
    this.#colors = readColorString(colorsString);
    this.#parts = readBodyString(bodyString);
    this.#looking = looking;
    this.#scale = scale;
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    this.#initialize();
  }

  #initialize() {
    const maleC = new PIXI.Container();
    maleC.sortableChildren = true; maleC.name = 'male';
    const femaleC = new PIXI.Container();
    femaleC.sortableChildren = true; femaleC.name = 'female';
    this.container.addChild(maleC);
    this.container.addChild(femaleC);

    const svgsToLoad: SvgsToLoad = [];
    const symbol = this.gender === 'male' ? Symbol460 : Symbol752;
    const activeC = this.gender === 'male' ? maleC : femaleC;

    this.#initContainers(svgsToLoad, activeC, symbol.parts, symbol.frames?.[0]);
    this.#loadSvgs(svgsToLoad);

    if (this.#looking === 'right') this.container.scale.x = -1;
    this.container.filters = [new OutlineFilter(2, 0x000000) as unknown as PIXIType.Filter];

    this.#usedSvgs = {};
    this.#displayFrame(activeC, symbol);
  }

  #initContainers = (
    svgsToLoad: SvgsToLoad,
    parent: PIXIType.Container,
    parts: LaBruteSymbol['parts'],
    frame: FramePart[] = [],
  ) => {
    frame.forEach((fp, i) => {
      const sym = parts?.find(p => p.name === fp.name);
      if (!sym) return;

      if (sym.type === 'svg') {
        const ex = svgsToLoad.find(s => s.svg.name === sym.name);
        if (ex) ex.count++; else svgsToLoad.push({ svg: sym as Svg, count: 1 });
      } else {
        const c = new PIXI.Container();
        c.sortableChildren = true; c.name = sym.name; c.visible = false;
        c.zIndex = frame.length - i;
        parent.addChild(c);

        const framesToLoad = sym.partIdx
          ? [this.#parts[sym.partIdx.substring(1) as keyof BruteBodyParts] ?? 0]
          : [0];

        for (const fi of framesToLoad) {
          const cf = sym.frames?.[fi];
          if (cf) this.#initContainers(svgsToLoad, c, sym.parts, cf);
        }
      }
    });
  };

  #loadSvgs = (svgsToLoad: SvgsToLoad) => {
    for (const { svg, count } of svgsToLoad) {
      for (let i = 0; i < count; i++) {
        const scale = svg.scale ?? 1;
        const sprite = new PIXI.Sprite(
          PIXI.Texture.from((svg as any).svg, { resourceOptions: { scale: this.#scale * scale } })
        );
        sprite.name = svg.name;
        sprite.scale.set(1 / scale);
        sprite.visible = false;
        if ((svg as any).offset) {
          sprite.x = -((svg as any).offset.x ?? 0) * this.#scale;
          sprite.y = -((svg as any).offset.y ?? 0) * this.#scale;
        }
        if (!sprite.texture.valid) {
          this.#pendingSvgs++;
          sprite.texture.baseTexture.once('loaded', () => {
            this.#pendingSvgs--;
            if (this.#pendingSvgs <= 0 && this.#onLoad) this.#onLoad();
          });
        }
        this.container.addChild(sprite);
        this.svgs.push(sprite);
      }
    }
    if (this.#pendingSvgs === 0 && this.#onLoad) this.#onLoad();
  };

  #displayFrame = (
    parent: PIXIType.Container,
    symbol: LaBruteSymbol | Svg,
    colorIdx?: string,
    zIndex?: number,
  ) => {
    if (symbol.type === 'svg') {
      const sprite = this.svgs.filter(s => s.name === symbol.name)[this.#usedSvgs[symbol.name] ?? 0];
      if (!sprite) return;
      if (symbol.name === 'Symbol45') { sprite.visible = false; return; }
      sprite.visible = true;
      if (colorIdx) {
        const colorName = colorIdx.substring(1) as keyof BruteColors;
        const color = this.#colors[colorName];
        if (color) sprite.tint = parseInt(color.replace('#',''), 16);
      }
      sprite.zIndex = zIndex ?? 0;
      parent.addChild(sprite);
      this.#usedSvgs[symbol.name] = (this.#usedSvgs[symbol.name] ?? 0) + 1;
    } else {
      const usedSym: string[] = [];
      const frameToLoad = symbol.partIdx
        ? (this.#parts[symbol.partIdx.substring(1) as keyof BruteBodyParts] ?? 0)
        : 0;
      const frameParts = symbol.frames?.[frameToLoad] ?? [];
      const usedCont: Record<string, number> = {};

      for (let i = 0; i < frameParts.length; i++) {
        const fp = frameParts[i]!;
        const identicCount = usedSym.filter(s => s === fp.name).length;
        const fpSym = symbol.parts?.filter(p => p.name === fp.name)[identicCount];
        if (!fpSym) continue;

        if (fpSym.type === 'svg') {
          this.#displayFrame(parent, fpSym, colorIdx, frameParts.length - i);
          continue;
        }

        const fpCont = parent.children.filter(
          c => c instanceof PIXI.Container && c.name === fp.name
        )[usedCont[fp.name] ?? 0] as PIXIType.Container | undefined;
        if (!fpCont) continue;

        if (fp.transform) fpCont.transform.setFromMatrix(matrixFromObj(fp.transform, this.#scale));
        if ((fp as any).colorOffset) {
          const co = (fp as any).colorOffset;
          fpCont.filters = [new PIXI.Filter(undefined, COLOR_OFFSET_SHADER, {
            offset: new Float32Array([co.r??0, co.g??0, co.b??0]),
            mult: new Float32Array([1,1,1]),
          })];
        }
        if (fp.alpha !== undefined) fpCont.alpha = fp.alpha;
        fpCont.visible = true;
        usedCont[fp.name] = (usedCont[fp.name] ?? 0) + 1;
        usedSym.push(fp.name);

        this.#displayFrame(fpCont, fpSym, (fpSym as any).colorIdx ?? colorIdx);
      }
    }
  };

  onLoad(cb: () => void) {
    if (this.#pendingSvgs === 0) { cb(); return; }
    this.#onLoad = cb;
  }

  destroy() {
    this.svgs.forEach(s => { if (!s.destroyed) s.destroy(); });
    this.svgs = [];
    this.container.destroy({ children: true });
  }
}

import { useEffect, useRef, useState } from 'react';

interface Props {
  gender: 'male' | 'female';
  body: string;      // 11-char hex string
  colors: string;    // 96-char hex string (16 zones × 6 chars)
  looking?: 'left' | 'right';
  size?: number;
  animate?: boolean;
  style?: React.CSSProperties;
}

const BREATHE: React.CSSProperties = {
  animation: 'brute-breathe 3.2s ease-in-out infinite',
  transformOrigin: 'center bottom',
};

// Singleton Pixi renderer (max 3 as in original)
let pixiRenderer: any = null;
let pixiReady = false;
const pendingRenders: Array<() => void> = [];

async function getRenderer() {
  if (pixiReady) return pixiRenderer;

  const PIXI = await import('pixi.js');

  pixiRenderer = new (PIXI as any).Renderer({
    backgroundAlpha: 0,
    width: 800,
    height: 1000,
    antialias: true,
    autoDensity: true,
    resolution: 1,
  });
  pixiReady = true;

  // Flush pending
  pendingRenders.forEach(fn => fn());
  pendingRenders.length = 0;

  return pixiRenderer;
}

type RenderJob = { gender: Props['gender']; body: string; colors: string; resolve: (url: string) => void };
const renderQueue: RenderJob[] = [];
let rendering = false;

async function processQueue() {
  if (rendering || renderQueue.length === 0) return;
  rendering = true;

  const job = renderQueue.shift()!;
  try {
    const renderer = await getRenderer();
    const { loadBruteModules, BruteDisplay } = await import('../game/BruteDisplay');
    await loadBruteModules();

    const display = new BruteDisplay(job.gender, job.colors, job.body, 'left', 2);
    display.onLoad(() => {
      try {
        renderer.render(display.container);
        const img = renderer.plugins.extract.image(display.container, 'image/png', 1) as HTMLImageElement;
        display.destroy();
        job.resolve(img.src);
      } catch {
        display.destroy();
        job.resolve('');
      }
      rendering = false;
      processQueue();
    });
  } catch {
    job.resolve('');
    rendering = false;
    processQueue();
  }
}

export function renderBrute(gender: Props['gender'], body: string, colors: string): Promise<string> {
  return new Promise(resolve => {
    renderQueue.push({ gender, body, colors, resolve });
    processQueue();
  });
}

const cache = new Map<string, string>();

export default function BruteRenderer({
  gender, body, colors, looking = 'left', size = 60, animate = true, style,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const keyRef = useRef('');

  useEffect(() => {
    const key = `${gender}|${body}|${colors}|${looking}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    if (cache.has(key)) { setSrc(cache.get(key)!); return; }

    setSrc(null);
    renderBrute(gender, body, colors).then(url => {
      if (url) {
        cache.set(key, url);
        setSrc(url);
      }
    });
  }, [gender, body, colors, looking]);

  if (!src) {
    return (
      <div style={{
        width: size, height: size * 1.5,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4,
        ...style,
      }}>
        ⚔
      </div>
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size * 1.5}
      alt={gender}
      style={{
        imageRendering: 'pixelated',
        transform: looking === 'right' ? 'scaleX(-1)' : undefined,
        ...(animate ? BREATHE : {}),
        ...style,
      }}
    />
  );
}

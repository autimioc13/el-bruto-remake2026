import { characterSVG } from '../sprites/characters';

interface Props {
  skinColor: string;
  hairColor: string;
  rank?: string;
  hairStyle?: string;
  size?: number;
  animate?: boolean;
}

const BREATHE_STYLE: React.CSSProperties = {
  animation: 'brute-breathe 3.2s ease-in-out infinite',
  transformOrigin: 'center bottom',
  display: 'block',
};

const BREATHE_KEYFRAMES = `
@keyframes brute-breathe {
  0%, 100% { transform: scaleY(1) translateY(0px); }
  45%       { transform: scaleY(0.97) translateY(0.6px); }
  55%       { transform: scaleY(0.97) translateY(0.6px); }
}
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = BREATHE_KEYFRAMES;
  document.head.appendChild(style);
}

export default function CharacterSprite({
  skinColor,
  hairColor,
  rank = 'Bruto',
  hairStyle = 'short',
  size = 60,
  animate = true,
}: Props) {
  if (animate) injectKeyframes();

  const svg = characterSVG(skinColor, hairColor, rank, hairStyle);
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return (
    <img
      src={dataUrl}
      width={size}
      height={size * 1.5}
      alt={rank}
      style={{
        imageRendering: 'pixelated',
        ...(animate ? BREATHE_STYLE : {}),
      }}
    />
  );
}

import { characterSVG } from '../sprites/characters';

interface Props {
  skinColor: string;
  hairColor: string;
  rank?: string;
  size?: number;
}

export default function CharacterSprite({ skinColor, hairColor, rank = 'Bruto', size = 60 }: Props) {
  const svg = characterSVG(skinColor, hairColor, rank);
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return <img src={dataUrl} width={size} height={size * 1.5} alt={rank} style={{ imageRendering: 'pixelated' }} />;
}

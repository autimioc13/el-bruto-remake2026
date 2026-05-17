import type { Character } from '../types';

interface Props {
  character: Character;
  onChallenge?: () => void;
}

export default function CharacterCard({ character, onChallenge }: Props) {
  return (
    <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 w-44 text-center">
      <div className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-amber-700"
        style={{ background: character.appearance.skin_color }} />
      <h3 className="font-bold text-amber-900 truncate">{character.name}</h3>
      <p className="text-sm text-amber-700">Nivel {character.level}</p>
      <p className="text-xs text-amber-600">{character.wins}V — {character.losses}D</p>
      {onChallenge && (
        <button onClick={onChallenge}
          className="mt-2 w-full py-1 bg-red-700 text-white font-bold rounded text-sm hover:bg-red-800">
          ¡Retar!
        </button>
      )}
    </div>
  );
}

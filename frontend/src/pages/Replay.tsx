import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import { CombatScene } from '../game/CombatScene';
import type { CombatSceneConfig } from '../game/CombatScene';
import api from '../api/client';

export default function Replay() {
  const { combatId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [done, setDone] = useState(false);
  const [combatData, setCombatData] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!combatId) return;
    api.get(`/combat/${combatId}`)
      .then(({ data }) => setCombatData(data))
      .catch(() => setError('Combate no encontrado o acceso denegado'));
  }, [combatId]);

  useEffect(() => {
    if (!combatData || !containerRef.current || gameRef.current) return;

    const cfg: CombatSceneConfig = {
      logData: combatData.log_data,
      attackerName: combatData.attacker_name,
      defenderName: combatData.defender_name,
      winnerId: combatData.winner_id,
      winnerName: combatData.winner_name ?? '',
      attackerConfig: {
        skinColor: combatData.attacker_appearance?.skin_color ?? '#FDBCB4',
        hairColor: combatData.attacker_appearance?.hair_color ?? '#000000',
        rank: combatData.attacker_rank ?? 'Bruto',
        weaponType: combatData.attacker_weapon_type ?? null,
        petType: combatData.attacker_pet_type ?? null,
      },
      defenderConfig: {
        skinColor: combatData.defender_appearance?.skin_color ?? '#FDBCB4',
        hairColor: combatData.defender_appearance?.hair_color ?? '#000000',
        rank: combatData.defender_rank ?? 'Bruto',
        weaponType: combatData.defender_weapon_type ?? null,
        petType: combatData.defender_pet_type ?? null,
      },
      onComplete: () => {
        setDone(true);
        gameRef.current?.destroy(true);
        gameRef.current = null;
      },
    };

    const game = new Phaser.Game({
      type: Phaser.AUTO, width: 640, height: 360,
      parent: containerRef.current, backgroundColor: '#d4a017', scene: [],
    });
    game.scene.add('CombatScene', CombatScene, false);
    game.events.once(Phaser.Core.Events.READY, () => game.scene.start('CombatScene', cfg));
    gameRef.current = game;
    return () => { game.destroy(true); gameRef.current = null; };
  }, [combatData]);

  if (error) return (
    <div className="min-h-screen bg-amber-900 flex items-center justify-center">
      <div className="text-amber-200 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-900 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-amber-200">Replay</h1>
      {combatData && !done && (
        <div className="flex gap-8 text-amber-200 text-lg font-bold mb-2">
          <span>{combatData.attacker_name}</span><span>VS</span><span>{combatData.defender_name}</span>
        </div>
      )}
      {!done && <div ref={containerRef} className="border-4 border-amber-600 rounded shadow-2xl" />}
      {done && (
        <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-amber-900 mb-2">Ganador: {combatData?.winner_id}</h2>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => navigate('/profile')}
              className="px-6 py-2 bg-amber-800 text-white font-bold rounded hover:bg-amber-900">
              Mi perfil
            </button>
            <button onClick={() => navigate('/ranking')}
              className="px-6 py-2 bg-amber-700 text-white font-bold rounded hover:bg-amber-800">
              Ranking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

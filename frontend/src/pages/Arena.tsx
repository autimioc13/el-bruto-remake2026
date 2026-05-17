import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import { CombatScene } from '../game/CombatScene';
import type { CombatSceneConfig } from '../game/CombatScene';
import api from '../api/client';

interface CombatData {
  log_data: any[];
  winner_id: string;
  attacker_name: string;
  defender_name: string;
  level_up: string | null;
}

export default function Arena() {
  const { combatId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [done, setDone] = useState<{ winnerId: string; levelUp: string | null } | null>(null);
  const [combatData, setCombatData] = useState<CombatData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!combatId) return;
    api.get(`/combat/${combatId}`).then(({ data }) => setCombatData(data));
  }, [combatId]);

  useEffect(() => {
    if (!combatData || !containerRef.current || gameRef.current) return;

    const cfg: CombatSceneConfig = {
      logData: combatData.log_data,
      attackerName: combatData.attacker_name,
      defenderName: combatData.defender_name,
      winnerId: combatData.winner_id,
      onComplete: (winnerId) => {
        setDone({ winnerId, levelUp: combatData.level_up });
        gameRef.current?.destroy(true);
        gameRef.current = null;
      },
    };

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 640,
      height: 360,
      parent: containerRef.current,
      backgroundColor: '#d4a017',
      scene: [],
    });

    game.scene.add('CombatScene', CombatScene, false);
    game.events.once(Phaser.Core.Events.READY, () => {
      game.scene.start('CombatScene', cfg);
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [combatData]);

  return (
    <div className="min-h-screen bg-amber-900 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-amber-200">¡COMBATE!</h1>

      {!done && combatData && (
        <div className="flex gap-8 text-amber-200 text-lg font-bold mb-2">
          <span>{combatData.attacker_name}</span>
          <span>VS</span>
          <span>{combatData.defender_name}</span>
        </div>
      )}

      {!done && <div ref={containerRef} className="border-4 border-amber-600 rounded shadow-2xl" />}

      {done && (
        <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-10 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-amber-900 mb-2">¡Combate terminado!</h2>
          <p className="text-amber-700 mb-4">
            Ganador: <span className="font-bold">{done.winnerId}</span>
          </p>
          {done.levelUp && (
            <p className="text-green-700 font-bold text-xl mb-4">
              ¡Subiste de nivel! {done.levelUp}
            </p>
          )}
          <button onClick={() => navigate('/profile')}
            className="px-8 py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900 text-lg">
            Volver a mi perfil
          </button>
        </div>
      )}
    </div>
  );
}

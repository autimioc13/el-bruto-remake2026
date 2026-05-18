import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import { CombatScene } from '../game/CombatScene';
import type { CombatSceneConfig } from '../game/CombatScene';
import api from '../api/client';

interface CombatData {
  log_data: any[];
  winner_id: string;
  winner_name: string;
  attacker_name: string;
  defender_name: string;
  attacker_appearance?: { skin_color: string; hair_color: string };
  defender_appearance?: { skin_color: string; hair_color: string };
  attacker_weapon_type?: string | null;
  defender_weapon_type?: string | null;
  attacker_pet_type?: string | null;
  defender_pet_type?: string | null;
  attacker_rank?: string;
  defender_rank?: string;
  level_up: { type: string; label: string } | null;
}

function buildGame(container: HTMLDivElement, combatData: CombatData, onComplete: (id: string) => void): Phaser.Game {
  const cfg: CombatSceneConfig = {
    logData: combatData.log_data,
    attackerName: combatData.attacker_name,
    defenderName: combatData.defender_name,
    winnerId: combatData.winner_id,
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
    onComplete,
  };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 640, height: 360,
    parent: container,
    backgroundColor: '#1a0e00',
    scene: [],
  });
  game.scene.add('CombatScene', CombatScene, false);
  game.events.once(Phaser.Core.Events.READY, () => game.scene.start('CombatScene', cfg));
  return game;
}

export default function Arena() {
  const { combatId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [done, setDone] = useState<{ winnerName: string; levelUp: { type: string; label: string } | null } | null>(null);
  const [combatData, setCombatData] = useState<CombatData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!combatId) return;
    api.get(`/combat/${combatId}`).then(({ data }) => setCombatData(data));
  }, [combatId]);

  useEffect(() => {
    if (!combatData || !containerRef.current || gameRef.current) return;
    gameRef.current = buildGame(containerRef.current, combatData, (_winnerId) => {
      setDone({ winnerName: combatData.winner_name, levelUp: combatData.level_up });
      gameRef.current?.destroy(true);
      gameRef.current = null;
    });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, [combatData]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4"
      style={{ background: 'linear-gradient(180deg, #0a0800 0%, #1a0600 100%)' }}>

      {!done && (
        <>
          <div className="text-center">
            <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">⚔ Arena de Combate ⚔</p>
            <h1 className="font-black text-5xl"
              style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
              COMBATE
            </h1>
          </div>

          {combatData && (
            <div className="flex items-center gap-6 text-lg font-black">
              <span className="text-amber-300">{combatData.attacker_name}</span>
              <span className="text-red-600 text-2xl">VS</span>
              <span className="text-amber-300">{combatData.defender_name}</span>
            </div>
          )}

          <div ref={containerRef}
            className="rounded-xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(245,158,11,0.2), 0 0 0 2px rgba(180,130,20,0.3)' }} />
        </>
      )}

      {done && (
        <div className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(20,14,4,0.98)',
            border: '1px solid rgba(180,130,20,0.3)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
          }}>
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-4">Resultado</p>
          <h2 className="font-black text-4xl mb-2"
            style={{ color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            ¡COMBATE TERMINADO!
          </h2>

          <div className="my-6 py-4 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-stone-500 text-sm mb-1">Ganador</p>
            <p className="text-2xl font-black text-amber-400">{done.winnerName}</p>
          </div>

          {done.levelUp && (
            <div className="mb-6 p-3 rounded-xl"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <p className="text-green-400 font-bold text-sm">🎉 ¡Subiste de nivel!</p>
              <p className="text-green-300 font-black">{done.levelUp.label}</p>
            </div>
          )}

          <button onClick={() => navigate('/profile')}
            className="w-full py-4 font-black text-stone-900 rounded-xl transition-all hover:opacity-90 active:scale-95 text-lg"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 24px rgba(245,158,11,0.35)',
            }}>
            Volver a mi perfil
          </button>
        </div>
      )}
    </div>
  );
}

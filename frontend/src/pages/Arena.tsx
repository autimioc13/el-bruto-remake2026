import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Phaser from 'phaser';
import { CombatScene } from '../game/CombatScene';
import type { CombatSceneConfig } from '../game/CombatScene';
import { characterSVG } from '../sprites/characters';
import { WEAPON_SVGS } from '../sprites/weapons';
import { PET_SVGS } from '../sprites/pets';
import { renderBrute } from '../components/BruteRenderer';
import api from '../api/client';

interface CombatData {
  log_data: any[];
  winner_id: string;
  winner_name: string;
  attacker_name: string;
  defender_name: string;
  attacker_appearance?: { skin_color: string; hair_color: string; hair_style?: string; gender?: 'male'|'female'; body?: string; colors?: string };
  defender_appearance?: { skin_color: string; hair_color: string; hair_style?: string; gender?: 'male'|'female'; body?: string; colors?: string };
  attacker_weapon_type?: string | null;
  defender_weapon_type?: string | null;
  attacker_pet_type?: string | null;
  defender_pet_type?: string | null;
  attacker_rank?: string;
  defender_rank?: string;
  level_up: { type: string; label: string } | null;
}

function loadSvgAsImg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function bruteToImg(gender: 'male'|'female', body: string, colors: string): Promise<HTMLImageElement> {
  try {
    const src = await renderBrute(gender, body, colors);
    if (!src) throw new Error('empty');
    return await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(new Image());
      img.src = src;
    });
  } catch {
    return new Image();
  }
}

async function preloadSprites(combatData: CombatData): Promise<CombatSceneConfig['attackerConfig'] & { def: CombatSceneConfig['defenderConfig'] }> {
  const atkApp = combatData.attacker_appearance;
  const defApp = combatData.defender_appearance;

  // Use authentic Flash-asset render when body/colors present, else fall back to SVG sprite
  const atkImgLoad: Promise<HTMLImageElement> = (atkApp?.body && atkApp?.colors)
    ? bruteToImg(atkApp.gender ?? 'male', atkApp.body, atkApp.colors)
    : loadSvgAsImg(characterSVG(atkApp?.skin_color ?? '#FDBCB4', atkApp?.hair_color ?? '#000000', combatData.attacker_rank ?? 'Bruto', atkApp?.hair_style ?? 'short'));

  const defImgLoad: Promise<HTMLImageElement> = (defApp?.body && defApp?.colors)
    ? bruteToImg(defApp.gender ?? 'male', defApp.body, defApp.colors)
    : loadSvgAsImg(characterSVG(defApp?.skin_color ?? '#FDBCB4', defApp?.hair_color ?? '#000000', combatData.defender_rank ?? 'Bruto', defApp?.hair_style ?? 'short'));

  const loads: Promise<HTMLImageElement | undefined>[] = [atkImgLoad, defImgLoad];

  const atkWpn = combatData.attacker_weapon_type && WEAPON_SVGS[combatData.attacker_weapon_type];
  const defWpn = combatData.defender_weapon_type && WEAPON_SVGS[combatData.defender_weapon_type];
  const atkPet = combatData.attacker_pet_type && PET_SVGS[combatData.attacker_pet_type];
  const defPet = combatData.defender_pet_type && PET_SVGS[combatData.defender_pet_type];

  if (atkWpn) loads.push(loadSvgAsImg(atkWpn)); else loads.push(Promise.resolve(undefined));
  if (defWpn) loads.push(loadSvgAsImg(defWpn)); else loads.push(Promise.resolve(undefined));
  if (atkPet) loads.push(loadSvgAsImg(atkPet)); else loads.push(Promise.resolve(undefined));
  if (defPet) loads.push(loadSvgAsImg(defPet)); else loads.push(Promise.resolve(undefined));

  const [atkImg, defImg, atkWpnImg, defWpnImg, atkPetImg, defPetImg] = await Promise.all(loads);

  return {
    skinColor: atkApp?.skin_color ?? '#FDBCB4',
    hairColor: atkApp?.hair_color ?? '#000000',
    hairStyle: atkApp?.hair_style ?? 'short',
    rank: combatData.attacker_rank ?? 'Bruto',
    weaponType: combatData.attacker_weapon_type ?? null,
    petType: combatData.attacker_pet_type ?? null,
    imgEl: atkImg as HTMLImageElement,
    weaponImgEl: atkWpnImg as HTMLImageElement | undefined,
    petImgEl: atkPetImg as HTMLImageElement | undefined,
    def: {
      skinColor: defApp?.skin_color ?? '#FDBCB4',
      hairColor: defApp?.hair_color ?? '#000000',
      hairStyle: defApp?.hair_style ?? 'short',
      rank: combatData.defender_rank ?? 'Bruto',
      weaponType: combatData.defender_weapon_type ?? null,
      petType: combatData.defender_pet_type ?? null,
      imgEl: defImg as HTMLImageElement,
      weaponImgEl: defWpnImg as HTMLImageElement | undefined,
      petImgEl: defPetImg as HTMLImageElement | undefined,
    },
  };
}

async function buildGame(
  container: HTMLDivElement,
  combatData: CombatData,
  onComplete: (id: string) => void,
): Promise<Phaser.Game> {
  const sprites = await preloadSprites(combatData);

  const cfg: CombatSceneConfig = {
    logData: combatData.log_data,
    attackerName: combatData.attacker_name,
    defenderName: combatData.defender_name,
    winnerId: combatData.winner_id,
    winnerName: combatData.winner_name,
    attackerConfig: {
      skinColor: sprites.skinColor,
      hairColor: sprites.hairColor,
      rank: sprites.rank,
      hairStyle: sprites.hairStyle,
      weaponType: sprites.weaponType,
      petType: sprites.petType,
      imgEl: sprites.imgEl,
      weaponImgEl: sprites.weaponImgEl,
      petImgEl: sprites.petImgEl,
    },
    defenderConfig: sprites.def,
    onComplete,
  };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 640, height: 360,
    parent: container,
    backgroundColor: '#120900',
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
    let cancelled = false;
    buildGame(containerRef.current, combatData, (_winnerId) => {
      if (cancelled) return;
      setDone({ winnerName: combatData.winner_name, levelUp: combatData.level_up });
      gameRef.current?.destroy(true);
      gameRef.current = null;
    }).then((game) => {
      if (cancelled) { game.destroy(true); return; }
      gameRef.current = game;
    });
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
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

          {!combatData && (
            <p className="text-amber-700 text-sm animate-pulse">Cargando combate...</p>
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

          <div className="flex gap-3">
            <button onClick={() => navigate('/ranking')}
              className="flex-1 py-4 font-black text-white rounded-xl transition-all hover:opacity-90 active:scale-95 text-sm"
              style={{
                background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
                boxShadow: '0 4px 16px rgba(153,27,27,0.4)',
              }}>
              ⚔ Más rivales
            </button>
            <button onClick={() => navigate('/profile')}
              className="flex-1 py-4 font-black text-stone-900 rounded-xl transition-all hover:opacity-90 active:scale-95 text-sm"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}>
              Mi perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

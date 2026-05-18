import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import BruteRenderer from '../components/BruteRenderer';
import { SKIN_M, SKIN_F, HAIR_M, HAIR_F, makeColorsString } from '../utils/bruteColors';
import { getRandomBody } from '../utils/bruteBody';

type Gender = 'male' | 'female';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export default function CreateCharacter() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [skinColor, setSkinColor] = useState(SKIN_M[4]!);
  const [hairColor, setHairColor] = useState(HAIR_M[0]!);
  const [body, setBody] = useState(() => getRandomBody('male'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const skinPalette = gender === 'male' ? SKIN_M : SKIN_F;
  const hairPalette = gender === 'male' ? HAIR_M : HAIR_F;
  const colors = useMemo(() => makeColorsString(skinColor, hairColor), [skinColor, hairColor]);

  const switchGender = (g: Gender) => {
    setGender(g);
    const skins = g === 'male' ? SKIN_M : SKIN_F;
    const hairs = g === 'male' ? HAIR_M : HAIR_F;
    setSkinColor(skins[4]!);
    setHairColor(hairs[0]!);
    setBody(getRandomBody(g));
  };

  const randomize = () => {
    setSkinColor(pick(skinPalette));
    setHairColor(pick(hairPalette));
    setBody(getRandomBody(gender));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/characters', {
        name,
        gender,
        hair_color: hairColor,
        skin_color: skinColor,
        hair_style: 'short',
        body,
        colors,
      });
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear personaje');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0800 0%, #1a0e00 40%, #2a0a08 100%)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <p className="text-amber-700 text-xs font-bold tracking-[0.3em] uppercase mb-2">⚔ Arena de Combate ⚔</p>
          <h1 className="text-4xl font-black text-amber-400"
            style={{ textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            Crea tu Bruto
          </h1>
        </div>

        <div className="rounded-2xl p-6"
          style={{
            background: 'rgba(20,14,4,0.97)',
            border: '1px solid rgba(180,130,20,0.25)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(245,158,11,0.06)',
          }}>

          {/* Live preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-xl p-5 flex items-center justify-center mb-3"
              style={{
                background: 'rgba(0,0,0,0.45)',
                border: '2px solid rgba(180,130,20,0.35)',
                minWidth: 110,
                minHeight: 140,
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
              }}>
              <BruteRenderer gender={gender} body={body} colors={colors} size={80} animate />
            </div>
            <button type="button" onClick={randomize}
              className="px-5 py-2 text-sm font-black rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              }}>
              🎲 Aspecto Aleatorio
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Gender */}
            <div>
              <label className="block text-amber-600 font-bold text-xs mb-2 uppercase tracking-widest">Género</label>
              <div className="flex gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button key={g} type="button" onClick={() => switchGender(g)}
                    className="flex-1 py-2 font-black text-sm rounded-lg transition-all"
                    style={{
                      background: gender === g ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${gender === g ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.08)'}`,
                      color: gender === g ? '#f59e0b' : '#6b7280',
                    }}>
                    {g === 'male' ? '♂ Masculino' : '♀ Femenino'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-amber-600 font-bold text-xs mb-2 uppercase tracking-widest">Nombre del Bruto</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="Ponle un nombre feroz..."
                className="w-full p-3 rounded-lg text-stone-100 text-sm outline-none transition-all placeholder:text-stone-600"
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,130,20,0.3)' }}
                required
              />
            </div>

            {/* Skin color */}
            <div>
              <label className="block text-amber-600 font-bold text-xs mb-2 uppercase tracking-widest">Color de Piel</label>
              <div className="flex gap-2 flex-wrap">
                {skinPalette.map((c) => (
                  <button key={c} type="button" onClick={() => setSkinColor(c)}
                    style={{
                      background: c,
                      boxShadow: skinColor === c ? `0 0 14px ${c}, 0 0 0 2px rgba(245,158,11,0.8)` : '0 0 0 2px rgba(255,255,255,0.1)',
                    }}
                    className={`w-9 h-9 rounded-full transition-all ${skinColor === c ? 'scale-110' : 'hover:scale-105'}`} />
                ))}
              </div>
            </div>

            {/* Hair color */}
            <div>
              <label className="block text-amber-600 font-bold text-xs mb-2 uppercase tracking-widest">Color de Pelo</label>
              <div className="flex gap-2 flex-wrap">
                {hairPalette.map((c) => (
                  <button key={c} type="button" onClick={() => setHairColor(c)}
                    style={{
                      background: c,
                      boxShadow: hairColor === c
                        ? `0 0 14px ${c === '#fff9ae' || c === '#fff2df' || c === '#ffaa1e' ? '#aaa' : c}, 0 0 0 2px rgba(245,158,11,0.8)`
                        : '0 0 0 2px rgba(255,255,255,0.12)',
                    }}
                    className={`w-9 h-9 rounded-full transition-all ${hairColor === c ? 'scale-110' : 'hover:scale-105'}`} />
                ))}
              </div>
            </div>

            <p className="text-stone-600 text-xs italic text-center">
              ✨ Tus stats iniciales serán una sorpresa — ¡como en el original!
            </p>

            {error && (
              <div className="text-sm rounded-lg p-3"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-stone-900 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 text-lg"
              style={{
                background: loading ? '#78350f' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 24px rgba(245,158,11,0.35)',
              }}>
              {loading ? '...' : '⚔ ¡CREAR MI BRUTO!'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

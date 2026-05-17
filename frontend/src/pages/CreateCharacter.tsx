import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const HAIR_COLORS = ['#000000', '#8B4513', '#FFD700', '#FF4500', '#808080'];
const SKIN_COLORS = ['#FDBCB4', '#D4956A', '#8D5524', '#4A2912'];
const HAIR_STYLES = ['short', 'long', 'mohawk', 'bald'];

export default function CreateCharacter() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [skinColor, setSkinColor] = useState(SKIN_COLORS[0]);
  const [hairStyle, setHairStyle] = useState(HAIR_STYLES[0]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/characters', {
        name, gender,
        hair_color: hairColor,
        skin_color: skinColor,
        hair_style: hairStyle,
      });
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear personaje');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-8 w-[480px] shadow-xl">
        <h2 className="text-3xl font-bold text-center text-amber-900 mb-6">Crea tu Bruto</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-amber-800 font-bold mb-1">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
              required
            />
          </div>

          <div>
            <label className="block text-amber-800 font-bold mb-1">Género</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-2 font-bold rounded ${gender === g ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                  {g === 'male' ? 'Masculino' : 'Femenino'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-800 font-bold mb-1">Color de pelo</label>
            <div className="flex gap-2">
              {HAIR_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setHairColor(c)}
                  style={{ background: c }}
                  className={`w-10 h-10 rounded-full border-4 ${hairColor === c ? 'border-amber-900' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-800 font-bold mb-1">Color de piel</label>
            <div className="flex gap-2">
              {SKIN_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setSkinColor(c)}
                  style={{ background: c }}
                  className={`w-10 h-10 rounded-full border-4 ${skinColor === c ? 'border-amber-900' : 'border-transparent'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-800 font-bold mb-1">Peinado</label>
            <div className="flex gap-2 flex-wrap">
              {HAIR_STYLES.map((s) => (
                <button key={s} type="button" onClick={() => setHairStyle(s)}
                  className={`px-3 py-1 font-bold rounded capitalize ${hairStyle === s ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="text-amber-700 text-sm italic">
            * Tus stats iniciales serán asignados aleatoriamente ¡como en el original!
          </p>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit"
            className="w-full py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900 text-lg">
            ¡Crear mi Bruto!
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Landing() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { email, password });
      if (!data.session) {
        setError('Cuenta creada. Revisa tu email para confirmar antes de entrar.');
        return;
      }
      localStorage.setItem('session', JSON.stringify(data.session));
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0800 0%, #1a0e00 40%, #2a0a08 100%)' }}>

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-amber-700 text-xs font-bold tracking-[0.3em] uppercase mb-3">⚔ Arena de Combate ⚔</p>
          <h1 className="font-black tracking-wider leading-none mb-3"
            style={{
              fontSize: '5rem',
              color: '#f59e0b',
              textShadow: '0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2)',
            }}>
            EL<br />BRUTO
          </h1>
          <p className="text-stone-600 text-sm tracking-widest">Lucha · Sube de nivel · Conquista</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{
            background: 'rgba(20,14,4,0.95)',
            border: '1px solid rgba(180,130,20,0.25)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(245,158,11,0.08)',
          }}>
          {/* Tabs */}
          <div className="flex mb-5 rounded-lg p-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-bold rounded-md transition-all"
                style={mode === m
                  ? { background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#1c1008' }
                  : { color: '#6b7280' }}>
                {m === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email" placeholder="Email" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg text-stone-100 text-sm outline-none transition-all"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,130,20,0.3)' }}
            />
            <input
              type="password" placeholder="Contraseña" value={password} required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg text-stone-100 text-sm outline-none transition-all"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,130,20,0.3)' }}
            />

            {error && (
              <div className="text-sm rounded-lg p-3"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-stone-900 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 text-lg mt-2"
              style={{
                background: loading ? '#78350f' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 24px rgba(245,158,11,0.35)',
              }}>
              {loading ? '...' : mode === 'login' ? '⚔ ENTRAR AL ARENA' : '⚔ CREAR MI BRUTO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

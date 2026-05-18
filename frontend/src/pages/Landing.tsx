import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Landing() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-8 w-96 shadow-xl">
        <h1 className="text-4xl font-bold text-center text-amber-900 mb-2">EL BRUTO</h1>
        <p className="text-center text-amber-700 mb-6">¡El mejor juego de combate!</p>

        <div className="flex mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 font-bold ${mode === 'login' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 font-bold ${mode === 'register' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900"
          >
            {mode === 'login' ? '¡Entrar al Arena!' : '¡Crear cuenta!'}
          </button>
        </form>
      </div>
    </div>
  );
}

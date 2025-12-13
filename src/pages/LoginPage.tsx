import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, Phone } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Validation
    if (!phone || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { phone, password });
      login(response.data.token, response.data.user);
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'AGENT') {
        navigate('/agent-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const serverError = err.response?.data?.error;
      const status = err.response?.status;
      
      if (serverError) {
        setError(serverError);
      } else if (status === 401) {
        setError('Numéro ou code PIN incorrect');
      } else if (status === 403) {
        setError('Compte désactivé. Contactez le support.');
      } else if (err.message === 'Network Error') {
        setError('Pas de connexion internet');
      } else {
        setError('Connexion impossible. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-black px-4 font-sans text-white">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface/30 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-10 text-center">
          <img 
            src="/fiafio_logo.png" 
            alt="Fiafio" 
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain shadow-[0_0_30px_rgba(212,255,0,0.3)]"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white">Bon Retour</h1>
          <p className="mt-2 text-gray-400">Entrez vos identifiants pour accéder à Fiafio</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="group relative">
              <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Numéro de Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-black/20 px-12 py-3.5 text-white placeholder-gray-600 outline-none transition-all focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="group relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 transition-colors group-focus-within:text-primary" />
              <input
                type="password"
                placeholder="Code PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full rounded-2xl border border-white/5 bg-black/20 px-12 py-3.5 text-white placeholder-gray-600 outline-none transition-all focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-4 text-center text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-4 font-bold text-background shadow-[0_4px_20px_rgba(212,255,0,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se Connecter'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Pas encore de compte ?{' '}
            <button 
              type="button"
              onClick={() => navigate('/register')} 
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </button>
          </p>
        </div>

        {/* <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          <p className="mb-2 font-mono">IDENTIFIANTS DÉMO</p>
          <div className="space-y-1">
             <p><span className="text-primary">Admin:</span> +237600000000 / 1234</p>
             <p><span className="text-primary">Agent:</span> +237611111111 / 1234</p>
             <p><span className="text-primary">User:</span> +237622222222 / 1234</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}

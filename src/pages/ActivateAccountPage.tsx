import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';

type Status = 'LOADING' | 'SUCCESS' | 'ERROR';

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('LOADING');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const called = useRef(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage("Lien d'activation invalide. Aucun token trouvé.");
      return;
    }

    if (called.current) return;
    called.current = true;

    const activate = async () => {
      try {
        const res = await api.post('/auth/activate', { token });
        setStatus('SUCCESS');
        setMessage(res.data.message || 'Compte activé avec succès !');
      } catch (err: any) {
        // If we get an error but we're already in success state from a previous call (StrictMode race)
        // although called.current should prevent this, it's safer to check.
        setStatus('ERROR');
        setMessage(
          err.response?.data?.error ||
          "Le lien d'activation est invalide ou a expiré."
        );
      }
    };

    activate();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-black px-4 font-sans text-white">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface/30 p-10 shadow-2xl backdrop-blur-xl text-center">
        <img 
          src="/fiafio_logo.png" 
          alt="Fiafio" 
          onClick={() => navigate('/')}
          className="mx-auto mb-10 h-24 w-24 cursor-pointer rounded-2xl object-contain shadow-[0_0_40px_rgba(212,255,0,0.4)] transition-transform hover:scale-110 active:scale-95"
        />
        {status === 'LOADING' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Activation en cours...</h1>
            <p className="mt-2 text-gray-400">Veuillez patienter pendant que nous activons votre compte.</p>
          </>
        )}

        {status === 'SUCCESS' && (
          <>
            <div className="relative mx-auto mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-400">Compte Activé !</h1>
            <p className="mt-2 text-gray-400">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-8 w-full rounded-2xl bg-primary py-4 font-bold text-background shadow-[0_4px_20px_rgba(212,255,0,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Se connecter
            </button>
          </>
        )}

        {status === 'ERROR' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-red-400">Erreur d'activation</h1>
            <p className="mt-2 text-gray-400">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-8 w-full rounded-2xl bg-white/10 py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="inline h-4 w-4 mr-2" />
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

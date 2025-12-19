import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, Phone, ArrowLeft, RefreshCcw } from 'lucide-react';
import OTPInput from '../components/OTPInput';

type Step = 'CREDENTIALS' | 'OTP';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('CREDENTIALS');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCredentialsSubmit = async () => {
    if (!phone || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { phone, password });
      
      if (response.data.requiresOTP) {
        setExpiresAt(new Date(response.data.expiresAt));
        setStep('OTP');
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

  const handleOTPComplete = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { phone, code });
      login(response.data.token, response.data.user);
      
      // Redirect based on role and merchant status
      const role = response.data.user.role;
      const hasMerchant = response.data.user.hasMerchant;
      
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'AGENT') {
        navigate('/agent-dashboard');
      } else if (hasMerchant) {
        navigate('/merchant');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/resend-otp', { phone });
      setExpiresAt(new Date(response.data.expiresAt));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de renvoyer le code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-black px-4 font-sans text-white">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-surface/30 p-8 shadow-2xl backdrop-blur-xl">
        {step === 'CREDENTIALS' ? (
          <>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleCredentialsSubmit()}
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
                onClick={handleCredentialsSubmit}
                disabled={loading}
                className="w-full rounded-2xl bg-primary py-4 font-bold text-background shadow-[0_4px_20px_rgba(212,255,0,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Continuer'}
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
          </>
        ) : (
          <>
            {/* OTP Step */}
            <button
              type="button"
              onClick={() => { setStep('CREDENTIALS'); setError(''); }}
              className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Vérification OTP</h2>
              <p className="mt-2 text-gray-400">
                Entrez le code envoyé au <span className="text-white font-medium">{phone}</span>
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="mb-6 text-center">
              <div className={`text-3xl font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-primary'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {timeLeft > 0 ? 'Temps restant' : 'Code expiré'}
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <OTPInput 
                onComplete={handleOTPComplete} 
                disabled={loading || timeLeft === 0}
                error={error}
              />
            </div>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="mx-auto flex items-center gap-2 text-sm text-gray-400 hover:text-primary disabled:opacity-50"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Renvoyer le code
            </button>

            {loading && (
              <p className="mt-4 text-center text-sm text-gray-500">Vérification...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

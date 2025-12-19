import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, Briefcase, ArrowLeft, CheckCircle, AlertTriangle, Building, Code, RefreshCcw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

type Step = 'TYPE' | 'INFO' | 'OTP' | 'SUCCESS';
type UserType = 'CLIENT' | 'AGENT' | 'MERCHANT';


export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('TYPE');
  const [userType, setUserType] = useState<UserType>('CLIENT');
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Agent float will be handled in agent-specific pages
  const [businessName, setBusinessName] = useState('');
  
  // OTP State
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Terms agreement checkbox handled in form below

  // Countdown timer for OTP
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

  const handleNext = () => {
    setError('');
    
    if (step === 'TYPE') {
      setStep('INFO');
    } else if (step === 'INFO') {
      // Validate
      if (!phone || !fullName || !password) {
        setError('Tous les champs sont requis');
        return;
      }
      if (userType === 'MERCHANT' && !businessName) {
        setError('Le nom de l\'entreprise est requis');
        return;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 4) {
        setError('Le PIN doit avoir au moins 4 chiffres');
        return;
      }
      
      if (userType === 'AGENT') {
        // Agents go directly to register - activation will be done on dashboard
        handleRegister();
      } else {
        handleRegister();
      }
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        phone,
        fullName,
        password,
        role: userType === 'MERCHANT' ? 'CLIENT' : userType, // Merchants start as clients
        initialFloat: undefined, // Agents will activate from dashboard
        createMerchant: userType === 'MERCHANT',
        businessName: userType === 'MERCHANT' ? businessName : undefined,
      });

      // Registration successful - go to OTP step
      if (res.data.requiresOTP) {
        setExpiresAt(new Date(res.data.expiresAt));
        setStep('OTP');
      }
    } catch (err: any) {
      // Parse error message for clearer feedback
      const serverError = err.response?.data?.error;
      const status = err.response?.status;
      
      if (serverError) {
        setError(serverError);
      } else if (status === 409) {
        setError('Ce numéro de téléphone est déjà utilisé');
      } else if (status === 400) {
        setError('Informations invalides. Vérifiez vos données.');
      } else if (status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (err.message === 'Network Error') {
        setError('Pas de connexion internet');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { phone, code });
      login(res.data.token, res.data.user);
      setStep('SUCCESS');
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
      const res = await api.post('/auth/resend-otp', { phone });
      setExpiresAt(new Date(res.data.expiresAt));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de renvoyer le code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-surface to-black px-4 py-8 font-sans text-white">
      {/* Background Glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Back Button */}
        {step !== 'SUCCESS' && step !== 'OTP' && (
          <button
            onClick={() => {
              if (step === 'TYPE') navigate('/');
              else if (step === 'INFO') setStep('TYPE');
            }}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <img 
            src="/fiafio_logo.png" 
            alt="Fiafio" 
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain shadow-[0_0_30px_rgba(212,255,0,0.3)]"
          />
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 'TYPE' && 'Créer un Compte'}
            {step === 'INFO' && 'Vos Informations'}
            {step === 'OTP' && 'Vérification'}
            {step === 'SUCCESS' && 'Bienvenue !'}
          </h1>
          <p className="mt-2 text-gray-400">
            {step === 'TYPE' && 'Choisissez votre type de compte'}
            {step === 'INFO' && 'Remplissez vos informations personnelles'}
            {step === 'OTP' && 'Entrez le code reçu par SMS'}
            {step === 'SUCCESS' && 'Votre compte a été créé avec succès'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step: Choose Type */}
        {step === 'TYPE' && (
          <div className="space-y-4">
            <button
              onClick={() => setUserType('CLIENT')}
              className={`flex w-full items-center gap-4 rounded-2xl border p-6 transition ${
                userType === 'CLIENT'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-surface/50 hover:border-white/20'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                userType === 'CLIENT' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
              }`}>
                <User className="h-7 w-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Particulier</h3>
                <p className="text-sm text-gray-400">Envoyer et recevoir de l'argent</p>
              </div>
              {userType === 'CLIENT' && (
                <CheckCircle className="ml-auto h-6 w-6 text-primary" />
              )}
            </button>

            <button
              onClick={() => setUserType('AGENT')}
              className={`flex w-full items-center gap-4 rounded-2xl border p-6 transition ${
                userType === 'AGENT'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-surface/50 hover:border-white/20'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                userType === 'AGENT' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
              }`}>
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Agent Fiafio</h3>
                <p className="text-sm text-gray-400">Effectuer des dépôts et retraits pour clients</p>
              </div>
              {userType === 'AGENT' && (
                <CheckCircle className="ml-auto h-6 w-6 text-primary" />
              )}
            </button>

            <button
              onClick={() => setUserType('MERCHANT')}
              className={`flex w-full items-center gap-4 rounded-2xl border p-6 transition ${
                userType === 'MERCHANT'
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-surface/50 hover:border-white/20'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                userType === 'MERCHANT' ? 'bg-primary text-black' : 'bg-surface text-gray-400'
              }`}>
                <Code className="h-7 w-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Marchand</h3>
                <p className="text-sm text-gray-400">Accepter les paiements via API</p>
              </div>
              {userType === 'MERCHANT' && (
                <CheckCircle className="ml-auto h-6 w-6 text-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02]"
            >
              Continuer
            </button>

            <p className="text-center text-sm text-gray-500">
              Déjà inscrit ?{' '}
              <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                Se connecter
              </button>
            </p>
          </div>
        )}

        {/* Step: User Info */}
        {step === 'INFO' && (
          <div className="space-y-4">
            <div className="group relative">
              <User className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
                autoFocus
              />
            </div>

            <div className="group relative">
              <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
              <input
                type="tel"
                placeholder="Numéro de téléphone (+237...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
              />
            </div>

            <div className="group relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
              <input
                type="password"
                placeholder="Code PIN (4+ chiffres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
              />
            </div>

            <div className="group relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
              <input
                type="password"
                placeholder="Confirmer le PIN"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
              />
            </div>

            {userType === 'MERCHANT' && (
              <div className="group relative">
                <Building className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Inscription...' : userType === 'AGENT' ? 'Continuer' : 'Créer mon compte'}
            </button>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === 'OTP' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => { setStep('INFO'); setError(''); }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Vérification OTP</h2>
              <p className="mt-2 text-gray-400">
                Entrez le code envoyé au <span className="text-white font-medium">{phone}</span>
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-primary'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {timeLeft > 0 ? 'Temps restant' : 'Code expiré'}
              </p>
            </div>

            {/* OTP Input */}
            <OTPInput 
              onComplete={handleOTPComplete} 
              disabled={loading || timeLeft === 0}
              error={error}
            />

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
              <p className="text-center text-sm text-gray-500">Vérification...</p>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-6">
            <div className="relative mx-auto">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-black">
                <CheckCircle className="h-12 w-12" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Compte créé !</h2>
              <p className="mt-2 text-gray-400">
                {userType === 'AGENT' && 'Activez votre compte en effectuant votre premier dépôt float.'}
                {userType === 'MERCHANT' && 'Votre compte marchand est prêt. Accédez à vos clés API.'}
                {userType === 'CLIENT' && 'Vous pouvez maintenant utiliser Fiafio.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (userType === 'MERCHANT') {
                  navigate('/merchant');
                } else if (userType === 'AGENT') {
                  navigate('/agent-dashboard');
                } else {
                  navigate('/dashboard');
                }
              }}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02]"
            >
              {userType === 'MERCHANT' ? 'Accéder au dashboard marchand' : 
               userType === 'AGENT' ? 'Accéder au dashboard agent' : 
               'Accéder au tableau de bord'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

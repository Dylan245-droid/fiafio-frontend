import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, Briefcase, ArrowLeft, CheckCircle, AlertTriangle, CreditCard, Building } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

type Step = 'TYPE' | 'INFO' | 'AGENT_RULES' | 'PAYMENT' | 'SUCCESS';
type UserType = 'CLIENT' | 'AGENT';

const MINIMUM_AGENT_FLOAT = 250_000; // 250,000 XAF minimum

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
  const [floatAmount, setFloatAmount] = useState(MINIMUM_AGENT_FLOAT.toString());
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToRules, setAgreeToRules] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);

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
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 4) {
        setError('Le PIN doit avoir au moins 4 chiffres');
        return;
      }
      
      if (userType === 'AGENT') {
        setStep('AGENT_RULES');
      } else {
        handleRegister();
      }
    } else if (step === 'AGENT_RULES') {
      if (!agreeToRules) {
        setError('Vous devez accepter les conditions pour continuer');
        return;
      }
      setStep('PAYMENT');
    } else if (step === 'PAYMENT') {
      if (Number(floatAmount) < MINIMUM_AGENT_FLOAT) {
        setError(`Le dépôt minimum est de ${formatCurrency(MINIMUM_AGENT_FLOAT)}`);
        return;
      }
      handleRegister();
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
        role: userType,
        initialFloat: userType === 'AGENT' ? Number(floatAmount) : undefined,
      });

      // Auto-login after registration
      login(res.data.token, res.data.user);
      setStep('SUCCESS');
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-surface to-black px-4 py-8 font-sans text-white">
      {/* Background Glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Back Button */}
        {step !== 'SUCCESS' && (
          <button
            onClick={() => {
              if (step === 'TYPE') navigate('/login');
              else if (step === 'INFO') setStep('TYPE');
              else if (step === 'AGENT_RULES') setStep('INFO');
              else if (step === 'PAYMENT') setStep('AGENT_RULES');
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
            {step === 'AGENT_RULES' && 'Conditions Agent'}
            {step === 'PAYMENT' && 'Dépôt Initial'}
            {step === 'SUCCESS' && 'Bienvenue !'}
          </h1>
          <p className="mt-2 text-gray-400">
            {step === 'TYPE' && 'Choisissez votre type de compte'}
            {step === 'INFO' && 'Remplissez vos informations personnelles'}
            {step === 'AGENT_RULES' && 'Lisez et acceptez les conditions'}
            {step === 'PAYMENT' && 'Effectuez votre dépôt de float initial'}
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

        {/* Step: Agent Rules */}
        {step === 'AGENT_RULES' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-surface/50 border border-white/10 p-6 space-y-4">
              <h3 className="font-bold text-lg text-white">📋 Règles de Progression</h3>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🆕</span>
                  <div>
                    <p className="font-medium text-white">Niveau 1: Nouvel Agent</p>
                    <p className="text-gray-400">Limite: 500,000 XAF/jour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-white">Niveau 2: Confirmé (15 transactions)</p>
                    <p className="text-gray-400">Limite: 2,000,000 XAF/jour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-medium text-white">Niveau 3: Vérifié (100 transactions)</p>
                    <p className="text-gray-400">Limite: 5,000,000 XAF/jour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium text-white">Niveau 4: Super Agent (500 transactions)</p>
                    <p className="text-gray-400">Limite: 20,000,000 XAF/jour</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Commission: <strong className="text-primary">1.2%</strong> sur les retraits</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-primary" />
                  <span>Dépôt minimum: <strong className="text-primary">{formatCurrency(MINIMUM_AGENT_FLOAT)}</strong></span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-yellow-500/10 p-4 text-sm text-yellow-400">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Le float est VOTRE capital. Il vous sera intégralement restitué si vous quittez.
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToRules}
                onChange={(e) => setAgreeToRules(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-white/20 bg-surface text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-300">
                J'ai lu et j'accepte les conditions d'utilisation et les règles de progression des agents Fiafio.
              </span>
            </label>

            <button
              type="button"
              onClick={handleNext}
              disabled={!agreeToRules}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
            >
              Continuer vers le paiement
            </button>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'PAYMENT' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-6 text-center">
              <p className="text-gray-400 mb-2">Dépôt initial (Float)</p>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  min={MINIMUM_AGENT_FLOAT}
                  step={10000}
                  className="w-48 bg-transparent text-center text-4xl font-bold text-primary outline-none"
                />
                <span className="text-xl text-gray-400">XAF</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Minimum: {formatCurrency(MINIMUM_AGENT_FLOAT)}</p>
            </div>

            <div className="rounded-2xl bg-surface/50 border border-white/10 p-6">
              <h3 className="font-medium text-white mb-4">💳 Méthode de paiement (Simulation)</h3>
              
              <div className="space-y-3">
                <button type="button" className="w-full flex items-center gap-4 rounded-xl border border-primary/50 bg-primary/10 p-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    OM
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">Orange Money</p>
                    <p className="text-sm text-gray-400">Simulé - Approbation instantanée</p>
                  </div>
                  <CheckCircle className="ml-auto h-5 w-5 text-primary" />
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                🔒 Environnement de test - Aucun paiement réel effectué
              </p>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Traitement...' : `Payer ${formatCurrency(Number(floatAmount))}`}
            </button>
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
                {userType === 'AGENT' 
                  ? `Votre float de ${formatCurrency(Number(floatAmount))} a été crédité.`
                  : 'Vous pouvez maintenant utiliser Fiafio.'
                }
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02]"
            >
              Accéder au tableau de bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

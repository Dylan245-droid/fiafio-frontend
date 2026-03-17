import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, Briefcase, ArrowLeft, CheckCircle, AlertTriangle, Building, Code, Mail } from 'lucide-react';
import api from '../services/api';
type Step = 'TYPE' | 'INFO' | 'ACTIVATION_SENT' | 'SUCCESS';
type UserType = 'CLIENT' | 'AGENT' | 'MERCHANT';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('TYPE');
  const [userType, setUserType] = useState<UserType>('CLIENT');
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Agent float will be handled in agent-specific pages
  const [businessName, setBusinessName] = useState('');
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect country from phone prefix
  useEffect(() => {
    if (phone.startsWith('+237')) setCountry('CM');
    else if (phone.startsWith('+225')) setCountry('CI');
    else if (phone.startsWith('+241')) setCountry('GA');
    else if (phone.startsWith('+221')) setCountry('SN');
    else if (phone.startsWith('+33')) setCountry('FR');
  }, [phone]);

  const handleNext = () => {
    setError('');
    
    if (step === 'TYPE') {
      setStep('INFO');
    } else if (step === 'INFO') {
      // Validate
      if (!phone || !email || !firstName || !lastName || !password) {
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
        email,
        firstName,
        lastName,
        country,
        password,
        role: userType === 'MERCHANT' ? 'CLIENT' : userType, // Merchants start as clients
        initialFloat: undefined, // Agents will activate from dashboard
        createMerchant: userType === 'MERCHANT',
        businessName: userType === 'MERCHANT' ? businessName : undefined,
      });

      // Registration successful - account needs activation
      if (res.data.requiresActivation) {
        setStep('ACTIVATION_SENT');
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


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-surface to-black px-4 py-8 font-sans text-white">
      {/* Background Glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Back Button */}
        {step !== 'SUCCESS' && step !== 'ACTIVATION_SENT' && (
          <button
            onClick={() => {
              if (step === 'TYPE') navigate(-1);
              else if (step === 'INFO') setStep('TYPE');
            }}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        )}

        {/* Header */}
        <div className="mb-10 text-center">
          <img 
            src="/fiafio_logo.png" 
            alt="Fiafio" 
            onClick={() => navigate('/')}
            className="mx-auto mb-6 h-24 w-24 cursor-pointer rounded-2xl object-contain shadow-[0_0_40px_rgba(212,255,0,0.4)] transition-transform hover:scale-110 active:scale-95"
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            {step === 'TYPE' && 'Créer un Compte'}
            {step === 'INFO' && 'Vos Informations'}
            {step === 'ACTIVATION_SENT' && 'Vérifiez votre email'}
            {step === 'SUCCESS' && 'Bienvenue !'}
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            {step === 'TYPE' && 'Choisissez votre type de compte'}
            {step === 'INFO' && 'Remplissez vos informations personnelles'}
            {step === 'ACTIVATION_SENT' && 'Un email d\'activation vous a été envoyé'}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="group relative">
                <User className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
                  autoFocus
                />
              </div>
              <div className="group relative">
                <User className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none transition focus:border-primary/50 focus:bg-black/40"
                />
              </div>
            </div>

            <div className="group relative">
              <Building className="absolute left-4 top-4 h-5 w-5 text-gray-500 transition group-focus-within:text-primary" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white outline-none transition focus:border-primary/50 focus:bg-black/40 appearance-none cursor-pointer"
              >
                <option value="" disabled>Sélectionner votre pays</option>
                <option value="CM">Cameroun (+237)</option>
                <option value="CI">Côte d'Ivoire (+225)</option>
                <option value="GA">Gabon (+241)</option>
                <option value="SN">Sénégal (+221)</option>
                <option value="FR">France (+33)</option>
                <option value="UNKNOWN">Autre</option>
              </select>
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
              <div className="absolute left-4 top-4 h-5 w-5 flex items-center justify-center">
                 <span className="text-gray-500 font-bold">@</span>
              </div>
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

        {/* Step: Activation Email Sent */}
        {step === 'ACTIVATION_SENT' && (
          <div className="text-center space-y-6">
            <div className="relative mx-auto">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Mail className="h-12 w-12" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Email envoyé !</h2>
              <p className="mt-2 text-gray-400">
                Nous avons envoyé un lien d'activation à <span className="text-white font-medium">{email}</span>.
                Cliquez sur le lien pour activer votre compte.
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4 text-sm text-gray-400">
              <p>Pensez à vérifier vos <strong className="text-white">spams</strong> si vous ne trouvez pas l'email.</p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-lg transition hover:scale-[1.02]"
            >
              Aller à la connexion
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

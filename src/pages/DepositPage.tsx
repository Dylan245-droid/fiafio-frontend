import { useState } from 'react';
import { ArrowLeft, Smartphone, CreditCard, Wallet, Check, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

type PaymentMethod = 
  | 'AIRTEL_MONEY' 
  | 'MOOV_MONEY' 
  | 'ORANGE_MONEY' 
  | 'WAVE' 
  | 'CREDIT_CARD' 
  | 'PAYPAL';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  type: 'mobile_money' | 'card' | 'online';
  color: string;
  available: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'ORANGE_MONEY', name: 'Orange Money', icon: '🍊', type: 'mobile_money', color: 'bg-orange-500', available: true },
  { id: 'AIRTEL_MONEY', name: 'Airtel Money', icon: '📱', type: 'mobile_money', color: 'bg-red-500', available: true },
  { id: 'MOOV_MONEY', name: 'Moov Money', icon: '💙', type: 'mobile_money', color: 'bg-blue-600', available: true },
  { id: 'WAVE', name: 'Wave', icon: '🌊', type: 'mobile_money', color: 'bg-sky-500', available: true },
  { id: 'CREDIT_CARD', name: 'Carte Bancaire', icon: '💳', type: 'card', color: 'bg-purple-600', available: true },
  { id: 'PAYPAL', name: 'PayPal', icon: '🅿️', type: 'online', color: 'bg-blue-700', available: true },
];

type Step = 'method' | 'amount' | 'phone' | 'processing' | 'success' | 'redirect';

export default function DepositPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const selectedOption = PAYMENT_OPTIONS.find(o => o.id === selectedMethod);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    if (!amount || Number(amount) < 500) {
      setError('Montant minimum: 500 XAF');
      return;
    }
    setError('');
    
    // For mobile money, need phone number
    if (selectedOption?.type === 'mobile_money') {
      setStep('phone');
    } else {
      // For card/PayPal, go straight to processing
      processPayment();
    }
  };

  const processPayment = async () => {
    setStep('processing');
    setLoading(true);
    setError('');

    try {
      if (selectedOption?.type === 'mobile_money') {
        // Mobile Money: Direct API integration (simulated for now)
        const res = await api.post('/topup/mobile-money', {
          provider: selectedMethod,
          amount: Number(amount),
          phone: phone,
        });
        
        if (res.data.success) {
          setStep('success');
        } else {
          setError(res.data.error || 'Échec du paiement');
          setStep('amount');
        }
      } else {
        // Card/PayPal: LemonSqueezy checkout
        const res = await api.post('/topup/checkout', {
          method: selectedMethod,
          amount: Number(amount),
        });
        
        if (res.data.checkoutUrl) {
          setCheckoutUrl(res.data.checkoutUrl);
          setStep('redirect');
        } else {
          setError(res.data.error || 'Échec de création du paiement');
          setStep('amount');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de paiement');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => step === 'method' ? navigate('/dashboard') : setStep('method')}
          className="rounded-full bg-surface p-2 text-gray-400 hover:bg-accent hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Recharger Mon Compte</h1>
          <p className="text-sm text-gray-400">Ajoutez des fonds à votre portefeuille</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 p-4 text-center text-red-500">
          {error}
        </div>
      )}

      {/* Step: Select Method */}
      {step === 'method' && (
        <div className="space-y-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-300">Choisissez un moyen de paiement</h2>
          
          {/* Mobile Money */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Smartphone className="h-4 w-4" />
              <span>Mobile Money</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.filter(o => o.type === 'mobile_money').map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleMethodSelect(option.id)}
                  disabled={!option.available}
                  className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-primary/50 hover:bg-accent disabled:opacity-50 ${
                    selectedMethod === option.id ? 'border-primary bg-primary/10' : ''
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-semibold">{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card & Online */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <CreditCard className="h-4 w-4" />
              <span>Carte & Paiement en ligne</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.filter(o => o.type === 'card' || o.type === 'online').map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleMethodSelect(option.id)}
                  disabled={!option.available}
                  className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-primary/50 hover:bg-accent disabled:opacity-50 ${
                    selectedMethod === option.id ? 'border-primary bg-primary/10' : ''
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-semibold">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Enter Amount */}
      {step === 'amount' && selectedOption && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedOption.color}`}>
                <span className="text-2xl">{selectedOption.icon}</span>
              </div>
              <div>
                <p className="font-bold">{selectedOption.name}</p>
                <p className="text-sm text-gray-400">
                  {selectedOption.type === 'mobile_money' ? 'Mobile Money' : 'Paiement en ligne'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">Montant à recharger</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 text-center text-3xl font-bold text-white outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-center text-sm text-gray-500">Minimum: 500 XAF</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`rounded-xl py-3 font-semibold transition ${
                  amount === quickAmount.toString()
                    ? 'bg-primary text-black'
                    : 'bg-surface text-white hover:bg-accent'
                }`}
              >
                {new Intl.NumberFormat('fr-FR').format(quickAmount)}
              </button>
            ))}
          </div>

          <button
            onClick={handleAmountSubmit}
            disabled={!amount || Number(amount) < 500}
            className="w-full rounded-2xl bg-primary py-4 font-bold text-black transition hover:bg-primary/90 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Step: Phone Number (Mobile Money only) */}
      {step === 'phone' && selectedOption && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedOption.icon}</span>
                <span className="font-bold">{selectedOption.name}</span>
              </div>
              <span className="font-bold text-primary">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">Numéro {selectedOption.name}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 text-lg text-white placeholder-gray-500 outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-sm text-gray-500">
              Vous recevrez une demande de confirmation sur ce numéro
            </p>
          </div>

          <button
            onClick={processPayment}
            disabled={!phone || phone.length < 9}
            className="w-full rounded-2xl bg-primary py-4 font-bold text-black transition hover:bg-primary/90 disabled:opacity-50"
          >
            Payer {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}
          </button>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-16 w-16 animate-spin text-primary" />
          <p className="text-lg font-semibold">Traitement en cours...</p>
          <p className="text-sm text-gray-400">Veuillez patienter</p>
        </div>
      )}

      {/* Step: Redirect to LemonSqueezy */}
      {step === 'redirect' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ExternalLink className="h-10 w-10 text-primary" />
          </div>
          <p className="mb-2 text-lg font-semibold">Redirection vers le paiement</p>
          <p className="mb-6 text-sm text-gray-400">
            Vous allez être redirigé vers notre partenaire de paiement sécurisé
          </p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-primary px-8 py-4 font-bold text-black transition hover:bg-primary/90"
          >
            Ouvrir la page de paiement
          </a>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm text-gray-400 hover:text-white"
          >
            Retour au tableau de bord
          </button>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <p className="mb-2 text-2xl font-bold text-green-500">Recharge Réussie!</p>
          <p className="mb-2 text-4xl font-bold">
            +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}
          </p>
          <p className="mb-6 text-sm text-gray-400">
            Votre compte a été crédité avec succès
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-2xl bg-primary px-8 py-4 font-bold text-black transition hover:bg-primary/90"
          >
            Retour au tableau de bord
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, AlertCircle, Delete } from 'lucide-react';
import api from '../services/api';

export default function QRWithdrawPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txRef, setTxRef] = useState('');

  const agentId = searchParams.get('agent');

  useEffect(() => {
    if (!agentId) {
      setError('QR Code invalide');
      setLoading(false);
      return;
    }

    // Fetch agent info
    const fetchAgent = async () => {
      try {
        const res = await api.get(`/users/find?q=${agentId}`);
        if (res.data && res.data.role === 'AGENT') {
          setAgent(res.data);
        } else {
          setError('Agent non trouvé');
        }
      } catch (err) {
        setError('Agent non trouvé');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  const handleKeypad = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (amount.length < 10) {
      setAmount(prev => prev + key);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Montant invalide');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await api.post('/transfers/withdraw', {
        agentPhone: agent.phone,
        amount: Number(amount),
      });
      setTxRef(res.data.transaction?.reference || '');
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du retrait');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  const fee = Math.round(Number(amount) * 0.02);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-white">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-black">
            <CheckCircle className="h-12 w-12" />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold">Retrait Réussi !</h2>
        <p className="mt-2 text-green-500">{formatCurrency(Number(amount) - fee)}</p>
        <p className="text-sm text-gray-400">Passez voir {agent?.fullName} pour récupérer votre argent</p>
        {txRef && <p className="mt-4 font-mono text-sm text-gray-500">Réf: {txRef}</p>}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-8 w-full max-w-xs rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
        >
          Retour
        </button>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-white">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="mt-4 text-xl font-bold">{error}</h2>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-2xl bg-surface px-8 py-3 font-medium hover:bg-surface/80"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <div className="mx-auto max-w-md space-y-6">
        {/* Agent Info */}
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-white">{agent?.fullName}</p>
              <p className="text-sm text-gray-400">Agent Fiafio</p>
              <p className="font-mono text-xs text-orange-500">{agent?.uniqueId}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-400">{error}</div>
        )}

        {/* Amount Display */}
        <div className="py-6 text-center">
          <p className="text-5xl font-bold text-orange-500">
            {amount ? new Intl.NumberFormat('fr-FR').format(Number(amount)) : '0'}
            <span className="ml-2 text-2xl text-gray-500">XAF</span>
          </p>
          {Number(amount) > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              Frais: {formatCurrency(fee)} · Vous recevez: {formatCurrency(Number(amount) - fee)}
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="mx-auto max-w-xs">
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypad(num.toString())}
                className="flex h-16 items-center justify-center rounded-2xl bg-surface/50 text-xl font-semibold text-white hover:bg-surface active:scale-95"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeypad('0')}
              className="flex h-16 items-center justify-center rounded-2xl bg-surface/50 text-xl font-semibold text-white hover:bg-surface"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypad('backspace')}
              className="flex h-16 items-center justify-center text-gray-400 hover:text-white"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={processing || !amount || Number(amount) <= 0}
            className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black disabled:opacity-50"
          >
            {processing ? 'Traitement...' : 'Retirer'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Banknote, ArrowDownLeft, Delete, AlertTriangle, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

type Mode = 'MENU' | 'DEPOSIT' | 'WITHDRAW';
type Step = 'CUSTOMER' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

interface Customer {
  id: number;
  phone: string;
  uniqueId?: string;
  fullName: string | null;
}

const FEE_PERCENTAGE = 0.02; // 2% for withdrawal

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('MENU');
  const [step, setStep] = useState<Step>('CUSTOMER');
  const [customerQuery, setCustomerQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [txRef, setTxRef] = useState('');

  const fee = mode === 'WITHDRAW' ? Math.round(Number(amount) * FEE_PERCENTAGE) : 0;

  const resetFlow = () => {
    setStep('CUSTOMER');
    setCustomerQuery('');
    setCustomer(null);
    setAmount('');
    setError('');
    setTxRef('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/users/find', { query: customerQuery });
      setCustomer(res.data.user);
      setStep('AMOUNT');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Client non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/transfers/deposit', {
        customerPhone: customer?.phone,
        amount: Number(amount),
        description: 'Dépôt Cash-In Agent'
      });
      setTxRef(res.data.transaction.reference);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du dépôt');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/transfers/withdraw', {
        agentPhone: user?.phone,
        amount: Number(amount),
        description: `Retrait agent pour ${customer?.fullName}`
      });
      setTxRef(res.data.transaction?.reference || 'DEMO-REF');
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du retrait');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      if (val === '0' && amount === '') return;
      setAmount(prev => prev + val);
    }
  };

  if (mode === 'MENU') {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans text-white">
        <div className="p-4">
          <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
          >
              <ArrowLeft className="h-4 w-4" />
              Retour
          </button>
        </div>

        <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
          <div className="space-y-8 pt-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">Opérations Agent</h2>
              <p className="mt-2 text-gray-400">Sélectionnez une action à effectuer</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => { setMode('DEPOSIT'); resetFlow(); }}
                className="flex w-full items-center gap-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-left transition hover:bg-green-500/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                  <ArrowDownLeft className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Dépôt (Cash-In)</h3>
                  <p className="text-sm text-gray-400">Recevoir espèces, créditer le portefeuille client</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('WITHDRAW'); resetFlow(); }}
                className="flex w-full items-center gap-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6 text-left transition hover:bg-orange-500/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  <Banknote className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Retrait (Cash-Out)</h3>
                  <p className="text-sm text-gray-400">Donner espèces, débiter le portefeuille client</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDeposit = mode === 'DEPOSIT';
  const color = isDeposit ? 'green' : 'orange';

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <div className="p-4">
        <button 
            onClick={() => step === 'CUSTOMER' || step === 'SUCCESS' ? setMode('MENU') : setStep('CUSTOMER')}
            className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
            <ArrowLeft className="h-4 w-4" />
            Retour
        </button>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
        {error && step !== 'CONFIRM' && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-center text-red-500">
             {error}
            </div>
        )}

        {step === 'CUSTOMER' && (
          <div className="space-y-8 pt-10">
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-${color}-500/10 text-${color}-500`}>
                {isDeposit ? <ArrowDownLeft className="h-8 w-8" /> : <Banknote className="h-8 w-8" />}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">{isDeposit ? 'Dépôt' : 'Retrait'}</h2>
              <p className="mt-2 text-gray-400">Rechercher le client</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="group relative">
                <Search className={`absolute left-4 top-4 h-6 w-6 text-gray-500 transition-colors group-focus-within:text-${color}-500`} />
                <input
                  type="text"
                  placeholder="Téléphone ou ID du client"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  className={`w-full rounded-2xl border border-white/10 bg-surface/50 px-14 py-4 text-lg text-white placeholder-gray-600 outline-none transition-all focus:border-${color}-500/50 focus:bg-black/40 focus:ring-1 focus:ring-${color}-500/50`}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !customerQuery}
                className={`w-full rounded-2xl bg-${color}-500 py-4 font-bold text-black shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50`}
              >
                {loading ? 'Recherche...' : 'Trouver le client'}
              </button>
            </form>

            <div className="flex justify-center gap-4">
               {['USER01', 'USER02', '+237622222222'].map(p => (
                   <button key={p} onClick={() => setCustomerQuery(p)} className={`rounded-full bg-surface px-4 py-2 text-xs text-gray-400 hover:text-${color}-500`}>
                       {p}
                   </button>
               ))}
            </div>
          </div>
        )}

        {step === 'AMOUNT' && (
          <div className="flex h-full flex-col justify-between pb-8">
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-${color}-500/20 text-${color}-500`}>
                  <User className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">{isDeposit ? 'Dépôt pour' : 'Retrait pour'}</h3>
                <p className="text-xl font-bold text-white">{customer?.fullName}</p>
                <p className="text-sm text-gray-500 font-mono">{customer?.uniqueId || customer?.phone}</p>
              </div>

              <div className="py-8">
                  <p className={`text-5xl font-bold tracking-tighter text-${color}-500`}>
                      {amount ? new Intl.NumberFormat('fr-FR').format(Number(amount)) : '0'} 
                      <span className="ml-2 text-2xl text-gray-500">XAF</span>
                  </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xs">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeypad(num.toString())}
                            className={`flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-${color}-500/20`}
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeypad('0')}
                        className={`flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-${color}-500/20`}
                    >
                        0
                    </button>
                    <button
                        onClick={() => handleKeypad('backspace')}
                        className="flex h-20 w-full items-center justify-center rounded-2xl bg-transparent text-gray-400 transition-colors hover:text-white"
                    >
                        <Delete className="h-8 w-8" />
                    </button>
                </div>

                <button
                  onClick={() => setStep('CONFIRM')}
                  disabled={!amount || Number(amount) <= 0}
                  className={`w-full rounded-2xl bg-${color}-500 py-4 font-bold text-black shadow-lg shadow-${color}-500/20 transition-transform hover:scale-[1.02] disabled:opacity-50`}
                >
                  Vérifier
                </button>
            </div>
          </div>
        )}

        {step === 'CONFIRM' && (
          <div className="space-y-8 pt-6">
            <h2 className="text-center text-3xl font-bold text-white">Confirmer {isDeposit ? 'le dépôt' : 'le retrait'}</h2>

            <div className="overflow-hidden rounded-3xl bg-surface p-1">
                <div className="rounded-[20px] border border-white/5 bg-black/40 p-6">
                    <div className="mb-6 text-center">
                        <p className="text-gray-400">{isDeposit ? 'Le client reçoit' : 'Le client retire'}</p>
                        <p className={`text-4xl font-bold text-${color}-500`}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-gray-400">Client</span>
                            <div className="text-right">
                                <p className="font-bold text-white">{customer?.fullName}</p>
                                <p className="text-xs text-gray-500">{customer?.uniqueId}</p>
                            </div>
                        </div>
                        {!isDeposit && (
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                               <span className="text-gray-400">Frais (2%)</span>
                               <span className="font-bold text-red-400">-{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(fee)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pb-4">
                             <span className="text-gray-400">{isDeposit ? 'Vous recevez (espèces)' : 'Vous donnez (espèces)'}</span>
                             <span className="font-bold text-white">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <button
              onClick={isDeposit ? handleDeposit : handleWithdraw}
              disabled={loading}
              className={`w-full rounded-2xl bg-${color}-500 py-4 font-bold text-black shadow-[0_0_30px_rgba(${isDeposit ? '34,197,94' : '249,115,22'},0.2)] transition-transform hover:scale-[1.02] active:scale-[0.95]`}
            >
              {loading ? 'Traitement...' : `Confirmer ${isDeposit ? 'le dépôt' : 'le retrait'}`}
            </button>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
            <div className="relative">
                 <div className={`absolute inset-0 animate-ping rounded-full bg-${color}-500/20 opacity-75`}></div>
                 <div className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-${color}-500 text-black`}>
                    <CheckCircle className="h-12 w-12" />
                 </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">{isDeposit ? 'Dépôt' : 'Retrait'} Réussi !</h2>
              <p className={`text-xl text-${color}-500`}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
              <p className="text-gray-400">{isDeposit ? 'Crédité à' : 'Débité de'} {customer?.fullName}</p>
              <p className="text-sm text-gray-500 font-mono">Réf: {txRef}</p>
            </div>

            <button
              onClick={() => setMode('MENU')}
              className="w-full max-w-xs rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
            >
              Terminé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


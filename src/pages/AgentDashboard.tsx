import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowDownLeft, Banknote, Wallet, History, RefreshCcw, LogOut,
  TrendingUp, Award, QrCode,
  Search, CheckCircle, Delete, ArrowLeft, User, AlertTriangle,
  Bell, XCircle, Clock, Eye, DollarSign, ShieldCheck
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import ThemeToggle from '../components/ThemeToggle';

interface Transaction {
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  direction: 'IN' | 'OUT';
  description: string;
}

interface AgentStats {
  level: {
    key: number;
    name: string;
    badge: string;
    daysActive: number;
    daysUntilNextLevel: number;
    transactionsUntilNextLevel: number;
    nextLevel: string | null;
    isStagnating: boolean;
    stagnationReason: string | null;
  };
  limits: {
    daily: number;
    perTransaction: number;
    todayUsed: number;
    remaining: number;
    percentage: number;
  };
  float: {
    balance: number;
    minimum: number;
    canOperate: boolean;
    blockReason: string | null;
  };
  commissions: {
    today: number;
    week: number;
    month: number;
  };
  kycLevel: number;
  totalTransactions: number;
  activation: {
    status: 'PENDING_FLOAT' | 'ACTIVE' | 'SUSPENDED' | null;
    deadline: string | null;
    daysRemaining: number | null;
  };
}

interface Customer {
  id: number;
  phone: string;
  uniqueId?: string;
  fullName: string | null;
}

type View = 'DASHBOARD' | 'DEPOSIT' | 'ACTIVATE' | 'MY_QR';
type Step = 'CUSTOMER' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('DASHBOARD');
  const [step, setStep] = useState<Step>('CUSTOMER');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [floatBalance, setFloatBalance] = useState(0);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  const [selectedWithdrawalReq, setSelectedWithdrawalReq] = useState<any | null>(null);

  // Pending requests
  const [pendingFloatRequests, setPendingFloatRequests] = useState<any[]>([]);
  const [pendingCancellations, setPendingCancellations] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);

  // Transaction flow
  const [customerQuery, setCustomerQuery] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [txRef, setTxRef] = useState('');
  const [processing, setProcessing] = useState(false);

  const fee = 0; // Deposit has no fee

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [accRes, txRes, statsRes, floatReqRes, cancellationRes, withdrawalReqRes] = await Promise.all([
        api.get('/accounts/balance'),
        api.get('/accounts/history?limit=5'),
        api.get('/agent/stats'),
        api.get('/float-requests/pending').catch(() => ({ data: { requests: [] } })),
        api.get('/agent/cancellation-requests').catch(() => ({ data: { requests: [] } })),
        api.get('/withdrawal-requests/pending').catch(() => ({ data: { requests: [] } })),
      ]);
      
      const accounts = accRes.data.accounts;
      setFloatBalance(accounts.find((a: any) => a.type === 'AGENT_FLOAT')?.balance || 0);
      setTransactions(txRes.data.transactions);
      setStats(statsRes.data);
      setPendingFloatRequests(floatReqRes.data.requests || []);
      setPendingCancellations(cancellationRes.data.requests || []);
      setPendingWithdrawals(withdrawalReqRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetFlow = () => {
    setStep('CUSTOMER');
    setCustomerQuery('');
    setCustomer(null);
    setAmount('');
    setError('');
    setTxRef('');
  };

  const handleSearch = async () => {
    if (!customerQuery) return;
    setProcessing(true);
    setError('');
    
    try {
      const res = await api.post('/users/find', { query: customerQuery });
      setCustomer(res.data.user);
      setStep('AMOUNT');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Client non trouvé');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransaction = async () => {
    setProcessing(true);
    setError('');

    try {
      const endpoint = view === 'DEPOSIT' ? '/transfers/deposit' : '/transfers/withdraw';
      const payload = view === 'DEPOSIT' 
        ? { customerPhone: customer?.phone, amount: Number(amount), description: 'Dépôt Cash-In Agent' }
        : { agentPhone: user?.phone, amount: Number(amount), description: `Retrait agent pour ${customer?.fullName}` };
      
      const res = await api.post(endpoint, payload);
      setTxRef(res.data.transaction?.reference || 'REF-' + Date.now());
      setStep('SUCCESS');
      fetchData(); // Refresh balances
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de l\'opération');
    } finally {
      setProcessing(false);
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

  const formatCurrency = (n: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // QR Code View
  if (view === 'MY_QR') {
    const qrUrl = `${window.location.origin}/qr-withdraw?agent=${user?.uniqueId}`;
    
    return (
      <div className="min-h-screen bg-background p-4 font-sans text-white">
        <button 
          type="button"
          onClick={() => setView('DASHBOARD')}
          className="mb-6 flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mx-auto max-w-md space-y-6 text-center">
          <div>
            <QrCode className="mx-auto h-12 w-12 text-orange-500" />
            <h2 className="mt-4 text-2xl font-bold">Mon QR Code Retrait</h2>
            <p className="mt-2 text-gray-400">Les clients scannent ce code pour retirer de l'argent chez vous</p>
          </div>

          <div className="mx-auto flex items-center justify-center rounded-3xl bg-white p-6">
            <QRCodeSVG 
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <p className="text-sm text-gray-400">{user?.fullName}</p>
            <p className="font-mono text-primary">{user?.uniqueId}</p>
          </div>

          <p className="text-xs text-gray-500">
            Le client ouvre sa caméra et scanne le code. Il sera redirigé vers une page où il pourra entrer le montant à retirer.
          </p>
        </div>
      </div>
    );
  }

  // Activation Flow
  if (view === 'ACTIVATE') {
    const handleActivate = async () => {
      if (!amount || Number(amount) < 100000) {
        setError('Montant minimum: 100 000 XAF');
        return;
      }
      setProcessing(true);
      setError('');
      try {
        await api.post('/agent/activate', { amount: Number(amount) });
        setStep('SUCCESS');
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Échec de l\'activation');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="min-h-screen bg-background p-4 font-sans text-white">
        <button 
          type="button"
          onClick={() => { setView('DASHBOARD'); setAmount(''); setError(''); }}
          className="mb-6 flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mx-auto max-w-md">
          {step !== 'SUCCESS' ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
                  <Award className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Activer Votre Compte</h2>
                <p className="mt-2 text-gray-400">Premier dépôt float (min 100 000 XAF)</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-400">{error}</div>
              )}

              <div className="py-6 text-center">
                <p className="text-5xl font-bold text-yellow-500">
                  {amount ? new Intl.NumberFormat('fr-FR').format(Number(amount)) : '0'}
                  <span className="ml-2 text-2xl text-gray-500">XAF</span>
                </p>
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
                  onClick={handleActivate}
                  disabled={processing || !amount || Number(amount) < 100000}
                  className="w-full rounded-2xl bg-yellow-500 py-4 font-bold text-black disabled:opacity-50"
                >
                  {processing ? 'Traitement...' : 'Activer Mon Compte'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-6">
              <div className="relative mx-auto w-fit">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-black">
                  <CheckCircle className="h-12 w-12" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Compte Activé !</h2>
                <p className="text-green-500">{formatCurrency(Number(amount))}</p>
                <p className="text-gray-400">Vous pouvez maintenant effectuer des opérations</p>
              </div>
              <button
                type="button"
                onClick={() => { setView('DASHBOARD'); setAmount(''); setStep('CUSTOMER'); }}
                className="w-full rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
              >
                Commencer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Transaction flow screens
  if (view !== 'DASHBOARD') {
    const isDeposit = view === 'DEPOSIT';

    return (
      <div className="min-h-screen bg-background p-4 font-sans text-white">
        {/* Back button */}
        <button 
          type="button"
          onClick={() => step === 'SUCCESS' ? setView('DASHBOARD') : step === 'CUSTOMER' ? setView('DASHBOARD') : setStep('CUSTOMER')}
          className="mb-6 flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mx-auto max-w-md">
          {/* Customer Search */}
          {step === 'CUSTOMER' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isDeposit ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                  {isDeposit ? <ArrowDownLeft className="h-8 w-8" /> : <Banknote className="h-8 w-8" />}
                </div>
                <h2 className="text-2xl font-bold">{isDeposit ? 'Dépôt (Cash-In)' : 'Retrait (Cash-Out)'}</h2>
                <p className="mt-2 text-gray-400">Rechercher le client</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-400">{error}</div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Téléphone ou ID client"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full rounded-2xl border border-white/10 bg-surface/50 px-12 py-4 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={processing || !customerQuery}
                  className={`w-full rounded-2xl py-4 font-bold text-black disabled:opacity-50 ${isDeposit ? 'bg-green-500' : 'bg-orange-500'}`}
                >
                  {processing ? 'Recherche...' : 'Trouver le client'}
                </button>
              </div>
            </div>
          )}

          {/* Amount Entry */}
          {step === 'AMOUNT' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full ${isDeposit ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                  <User className="h-7 w-7" />
                </div>
                <p className="text-gray-400">{isDeposit ? 'Dépôt pour' : 'Retrait pour'}</p>
                <p className="text-xl font-bold text-white">{customer?.fullName}</p>
                <p className="font-mono text-sm text-gray-500">{customer?.uniqueId || customer?.phone}</p>
              </div>

              <div className="py-6 text-center">
                <p className={`text-5xl font-bold ${isDeposit ? 'text-green-500' : 'text-orange-500'}`}>
                  {amount ? new Intl.NumberFormat('fr-FR').format(Number(amount)) : '0'}
                  <span className="ml-2 text-2xl text-gray-500">XAF</span>
                </p>
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
                  onClick={() => setStep('CONFIRM')}
                  disabled={!amount || Number(amount) <= 0}
                  className={`w-full rounded-2xl py-4 font-bold text-black disabled:opacity-50 ${isDeposit ? 'bg-green-500' : 'bg-orange-500'}`}
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {step === 'CONFIRM' && (
            <div className="space-y-6">
              <h2 className="text-center text-2xl font-bold">Confirmer {isDeposit ? 'le dépôt' : 'le retrait'}</h2>

              <div className="rounded-3xl border border-white/10 bg-surface/30 p-6">
                <div className="mb-6 text-center">
                  <p className="text-gray-400">{isDeposit ? 'Le client reçoit' : 'Le client retire'}</p>
                  <p className={`text-4xl font-bold ${isDeposit ? 'text-green-500' : 'text-orange-500'}`}>
                    {formatCurrency(Number(amount))}
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-gray-400">Client</span>
                    <div className="text-right">
                      <p className="font-medium text-white">{customer?.fullName}</p>
                      <p className="text-xs text-gray-500">{customer?.uniqueId}</p>
                    </div>
                  </div>
                  {!isDeposit && fee > 0 && (
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-gray-400">Frais (2%)</span>
                      <span className="text-red-400">-{formatCurrency(fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">{isDeposit ? 'Vous recevez (espèces)' : 'Vous donnez (espèces)'}</span>
                    <span className="font-bold text-white">{formatCurrency(Number(amount))}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleTransaction}
                disabled={processing}
                className={`w-full rounded-2xl py-4 font-bold text-black disabled:opacity-50 ${isDeposit ? 'bg-green-500' : 'bg-orange-500'}`}
              >
                {processing ? 'Traitement...' : `Confirmer ${isDeposit ? 'le dépôt' : 'le retrait'}`}
              </button>
            </div>
          )}

          {/* Success */}
          {step === 'SUCCESS' && (
            <div className="py-10 text-center space-y-6">
              <div className="relative mx-auto w-fit">
                <div className={`absolute inset-0 animate-ping rounded-full ${isDeposit ? 'bg-green-500/20' : 'bg-orange-500/20'}`} />
                <div className={`relative flex h-24 w-24 items-center justify-center rounded-full text-black ${isDeposit ? 'bg-green-500' : 'bg-orange-500'}`}>
                  <CheckCircle className="h-12 w-12" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">{isDeposit ? 'Dépôt' : 'Retrait'} Réussi !</h2>
                <p className={`text-xl ${isDeposit ? 'text-green-500' : 'text-orange-500'}`}>{formatCurrency(Number(amount))}</p>
                <p className="text-gray-400">{isDeposit ? 'Crédité à' : 'Débité de'} {customer?.fullName}</p>
                <p className="mt-2 font-mono text-sm text-gray-500">Réf: {txRef}</p>
              </div>

              <button
                type="button"
                onClick={() => { setView('DASHBOARD'); resetFlow(); }}
                className="w-full rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
              >
                Terminé
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-background p-4 font-sans text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header Premium 2026 - Simplified */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-surface/20 border border-white/5 backdrop-blur-md gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#111]">
                  <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                Agent Protocol
                {((stats?.kycLevel ?? 0) >= 2 && stats?.activation?.status === 'ACTIVE') && (
                  <span className="ml-2 bg-primary px-2 py-0.5 rounded text-[9px] font-mono text-black">
                    {user?.uniqueId}
                  </span>
                )}
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
                {user?.fullName?.split(' ')[0]}
                <span className="ml-2 opacity-30 text-xs font-mono tracking-widest">{stats?.level?.badge}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <ThemeToggle />
            <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block" />
            <button 
              type="button"
              onClick={fetchData} 
              className="rounded-xl bg-white/5 p-3 text-gray-400 hover:bg-primary/20 hover:text-primary transition-all border border-white/5"
            >
              <RefreshCcw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              type="button"
              onClick={handleLogout} 
              className="rounded-xl bg-white/5 p-3 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

      {/* Activation Steps Card for PENDING_FLOAT agents */}
      {stats?.activation?.status === 'PENDING_FLOAT' && (
        <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-yellow-400">Activez votre compte agent</h3>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Pour garantir la sécurité de tous, {(stats?.kycLevel ?? 0) < 2 ? "deux étapes simples sont nécessaires" : "une dernière étape est nécessaire"} pour commencer vos opérations :
          </p>

          <div className="space-y-3 mb-4">
            {/* Step 1: KYC */}
            {(stats?.kycLevel ?? 0) < 2 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-400">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">Vérification KYC niveau 2</p>
                  <p className="text-xs text-gray-500">Pièce d'identité + Selfie pour valider votre identité</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/kyc')}
                  className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/30"
                >
                  Vérifier
                </button>
              </div>
            )}

            {/* Step 2: First Float Deposit */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-bold text-yellow-400">
                {(stats?.kycLevel ?? 0) < 2 ? "2" : "1"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">Premier dépôt float de 100 000 FCFA</p>
                <p className="text-xs text-gray-500">Capital de démarrage pour vos opérations</p>
              </div>
              <button
                type="button"
                onClick={() => setView('ACTIVATE')}
                className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/30"
              >
                Déposer
              </button>
            </div>
          </div>

          {stats.activation.daysRemaining !== null && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  <span className="font-bold">{stats.activation.daysRemaining}</span> jour(s) restant(s)
                </span>
              </div>
              <span className="text-xs text-gray-500">avant suspension</span>
            </div>
          )}
        </div>
      )}

      {/* Suspended Banner */}
      {stats?.activation?.status === 'SUSPENDED' && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-400">Compte suspendu</p>
              <p className="text-sm text-gray-400">
                Le délai d'activation a expiré. Contactez le support Fiafio pour réactiver votre compte.
              </p>
            </div>
          </div>
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            {/* Float Balance Card - Premium Design */}
            <div className="mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/60 p-6 sm:p-10 text-black relative shadow-2xl shadow-primary/10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full" />
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 px-2 rounded-lg bg-black/10 text-[10px] font-black uppercase tracking-widest">
                  Agent Float Balance
                </div>
                {loading && <RefreshCcw className="w-3 h-3 animate-spin opacity-50" />}
              </div>
              <div className="text-4xl sm:text-6xl font-black tracking-tighter mb-8">
                {formatCurrency(floatBalance)}
              </div>
              
              <div className={`flex gap-3 relative z-10 ${stats?.activation?.status !== 'ACTIVE' ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  type="button"
                  onClick={() => stats?.activation?.status === 'ACTIVE' && navigate('/float-request')}
                  className="flex-1 rounded-2xl bg-black text-white py-5 text-xs font-black uppercase tracking-widest hover:bg-black/80 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20"
                >
                  💰 Demander Float
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="w-16 h-16 rounded-2xl bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all border border-white/10"
                >
                  <History className="h-6 w-6" />
                </button>
              </div>

              {/* Status indicator */}
              <div className="mt-6 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${stats?.activation?.status === 'ACTIVE' ? 'bg-black/40 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {stats?.activation?.status === 'ACTIVE' ? 'System fully operational' : 'Account Restricted'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             {/* Quick Actions simplified for desktop side */}
             <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/agent-commissions')}
                  className="flex flex-col items-center gap-3 rounded-[2rem] border border-white/5 bg-surface/20 p-6 text-center transition hover:bg-primary/10 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Earnings</span>
                </button>
                <button
                  onClick={() => {
                    if ((stats?.kycLevel ?? 0) < 2 || stats?.activation?.status !== 'ACTIVE') {
                      alert("Veuillez d'abord valider votre KYC Niveau 2 et effectuer votre premier dépôt pour accéder au QR Mode.");
                      return;
                    }
                    setView('MY_QR');
                  }}
                  className={`flex flex-col items-center gap-3 rounded-[2rem] border border-white/5 bg-surface/20 p-6 text-center transition hover:bg-primary/10 group ${
                    ((stats?.kycLevel ?? 0) < 2 || stats?.activation?.status !== 'ACTIVE') ? 'opacity-40 grayscale cursor-not-allowed' : ''
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    ((stats?.kycLevel ?? 0) < 2 || stats?.activation?.status !== 'ACTIVE') ? 'bg-gray-500/20' : 'bg-primary/20'
                  }`}>
                    <QrCode className={`h-6 w-6 ${((stats?.kycLevel ?? 0) < 2 || stats?.activation?.status !== 'ACTIVE') ? 'text-gray-500' : 'text-primary'}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">QR Mode</span>
                </button>
             </div>
          </div>
        </div>

      {/* Requests Management Section - Only fully accessible when active */}
      <div className={`mt-12 mb-6 space-y-3 ${stats?.activation?.status !== 'ACTIVE' ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-white">Gestion des Demandes</h2>
          {stats?.activation?.status !== 'ACTIVE' && (
            <span className="text-xs text-gray-500 ml-auto">🔒 Activez d'abord votre compte</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Float Requests Button */}
          <button
            type="button"
            onClick={() => navigate('/float-request')}
            className="relative flex flex-col items-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center transition hover:bg-yellow-500/20"
          >
            {pendingFloatRequests.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-black">
                {pendingFloatRequests.length}
              </span>
            )}
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="font-bold text-white">Demandes de Float</p>
              <p className="text-xs text-gray-400">
                {pendingFloatRequests.length > 0 
                  ? `${pendingFloatRequests.length} en attente`
                  : 'Aucune demande'
                }
              </p>
            </div>
          </button>

          {/* Cancellation Requests Button */}
          <button
            type="button"
            onClick={() => navigate('/cancellation-requests')}
            className="relative flex flex-col items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center transition hover:bg-red-500/20"
          >
            {pendingCancellations.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingCancellations.length}
              </span>
            )}
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-bold text-white">Annulations</p>
              <p className="text-xs text-gray-400">
                {pendingCancellations.length > 0 
                  ? `${pendingCancellations.length} en attente`
                  : 'Aucune demande'
                }
              </p>
            </div>
          </button>

          {/* Commissions Button */}
          <button
            type="button"
            onClick={() => navigate('/agent-commissions')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center transition hover:bg-green-500/20"
          >
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-bold text-white">Mes Commissions</p>
              <p className="text-xs text-gray-400">Voir mes revenus</p>
            </div>
          </button>


          {/* Withdraw Float Button */}
          <button
            type="button"
            onClick={() => navigate('/agent-float-withdraw')}
            className="relative flex flex-col items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-center transition hover:bg-purple-500/20"
          >
            {pendingWithdrawals.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingWithdrawals.length}
              </span>
            )}
            <Wallet className="h-8 w-8 text-purple-500" />
            <div>
              <p className="font-bold text-white">Demandes de retrait</p>
              <p className="text-xs text-gray-400">
                {pendingWithdrawals.length > 0 
                  ? `${pendingWithdrawals.length} à traiter`
                  : 'Chez un autre agent'
                }
              </p>
            </div>
          </button>
        </div>

        {/* Inline Cancellation Requests if pending */}
        {pendingCancellations.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="mb-3 text-sm font-medium text-red-400">Demandes d'annulation à traiter :</p>
            <div className="space-y-2">
              {pendingCancellations.slice(0, 3).map((req: any) => (
                <div key={req.id} className="flex items-center justify-between rounded-xl bg-surface/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{req.userName || 'Client'}</p>
                    <p className="text-xs text-gray-500">Réf: {req.transactionRef}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTxRef(req.transactionRef)}
                      className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/30"
                      title="Voir la transaction"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const code = prompt('Saisissez le code de confirmation à 6 caractères:');
                        if (!code || code.length !== 6) {
                          alert('Code invalide. Le code doit contenir 6 caractères.');
                          return;
                        }
                        try {
                          await api.post(`/agent/cancellation-requests/${req.id}/approve`, { confirmationCode: code });
                          alert('Annulation approuvée !');
                          fetchData();
                        } catch (e: any) {
                          alert(e.response?.data?.error || 'Échec');
                        }
                      }}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-green-400"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const reason = prompt('Raison du refus ?');
                        try {
                          await api.post(`/agent/cancellation-requests/${req.id}/reject`, { reason });
                          fetchData();
                        } catch (e) { console.error(e); }
                      }}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Withdrawal Requests if pending */}
        {pendingWithdrawals.length > 0 && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
            <p className="mb-3 text-sm font-medium text-orange-400">Demandes de retrait à valider :</p>
            <div className="space-y-2">
              {pendingWithdrawals.slice(0, 3).map((req: any) => (
                <div key={req.id} className="flex items-center justify-between rounded-xl bg-surface/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{req.requesterName || 'Client'}</p>
                    <p className="text-xs text-orange-400 font-bold">{formatCurrency(req.amount)}</p>
                    <p className="text-xs text-gray-500">{req.requesterPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawalReq(req)}
                      className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/30"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const code = prompt('Saisissez le code de confirmation à 6 caractères:');
                        if (!code || code.length !== 6) {
                          alert('Code invalide. Le code doit contenir 6 caractères.');
                          return;
                        }
                        try {
                          await api.post(`/withdrawal-requests/${req.id}/approve`, { confirmationCode: code });
                          alert('Retrait validé ! Remettez l\'argent au client.');
                          fetchData();
                        } catch (e: any) {
                          alert(e.response?.data?.error || 'Échec');
                        }
                      }}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-green-400"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const reason = prompt('Raison du refus ?');
                        try {
                          await api.post(`/withdrawal-requests/${req.id}/reject`, { reason });
                          fetchData();
                        } catch (e) { console.error(e); }
                      }}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-6 space-y-4">
          {/* Daily Volume Progress Card */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-white">Volume du Jour</span>
              </div>
              {stats.limits.remaining === Infinity ? (
                <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                  ∞ Illimité
                </span>
              ) : (
                <span className="text-sm text-gray-400">
                  {stats.limits.percentage}% utilisé
                </span>
              )}
            </div>
            
            <div className="mb-3">
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.limits.todayUsed)}</p>
              {stats.limits.daily === Infinity ? (
                <p className="text-sm text-yellow-400">🏆 Super Agent - Aucune limite quotidienne</p>
              ) : (
                <p className="text-sm text-gray-400">
                  sur {formatCurrency(stats.limits.daily)} · Reste: <span className="text-blue-400 font-medium">{formatCurrency(stats.limits.remaining)}</span>
                </p>
              )}
            </div>

            {/* Progress Bar - only show if not unlimited */}
            {stats.limits.daily !== Infinity && (
              <div className="h-3 overflow-hidden rounded-full bg-surface/50">
                <div 
                  className={`h-full transition-all duration-500 ${
                    stats.limits.percentage >= 90 ? 'bg-red-500' : 
                    stats.limits.percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(stats.limits.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Level Progress */}
          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium text-white">
                  {stats.level.badge} {stats.level.name}
                </span>
              </div>
              {stats.level.nextLevel && (
                <span className="text-xs text-gray-500">
                  Prochain: {stats.level.nextLevel}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Jours d'ancienneté</span>
                <span className="text-white font-medium">
                  {stats.level.daysActive} jours
                </span>
              </div>
              {stats.level.daysUntilNextLevel !== null && stats.level.daysUntilNextLevel > 0 && (
                <>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${Math.min(100, (stats.level.daysActive / (stats.level.daysActive + stats.level.daysUntilNextLevel)) * 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Encore {stats.level.daysUntilNextLevel} jours pour passer au niveau suivant
                  </p>
                </>
              )}
              {stats.level.nextLevel === null && (
                <p className="text-xs text-yellow-500">🏆 Niveau maximum atteint !</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="h-4 w-4" />
                Total Transactions
              </div>
              <p className="mt-1 text-xl font-bold text-white">{stats.totalTransactions}</p>
              <p className="text-xs text-gray-500">
                {stats.level.daysUntilNextLevel !== null && stats.level.daysUntilNextLevel > 0
                  ? `${stats.level.daysUntilNextLevel} jours restants`
                  : 'Niveau max atteint 🏆'
                }
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Wallet className="h-4 w-4" />
                Commissions
              </div>
              <p className="mt-1 text-xl font-bold text-green-500">{formatCurrency(stats.commissions.month)}</p>
              <p className="text-xs text-gray-500">Commission ce mois</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History - Timeline Style */}
      <div className="mb-8 rounded-[2.5rem] border border-white/5 bg-surface/20 p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
              Flux Opérationnel
            </h3>
            <p className="text-[10px] font-mono text-primary/60 uppercase">Dernières transactions</p>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111] bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 text-primary" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.reference} className="relative pl-8 group cursor-pointer" onClick={() => setSelectedTxRef(tx.reference)}>
              {/* Timeline Line */}
              <div className="absolute left-[11px] top-8 -bottom-6 w-[2px] bg-white/5 group-last:hidden" />
              
              {/* Dot */}
              <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-surface/50 border border-white/10 flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${tx.direction === 'IN' ? 'bg-green-500' : 'bg-primary'} animate-pulse`} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none">
                    {tx.type}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {format(new Date(tx.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-black ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                    {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-primary/40' : 'text-yellow-500/40'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
              <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Aucune transaction</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/transactions')}
          className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all"
        >
          Grand Livre Complet
        </button>
      </div>

      {/* Transaction Modal */}
      {selectedTxRef && (
        <TransactionModal 
          reference={selectedTxRef} 
          onClose={() => setSelectedTxRef(null)}
          onCancellationRequested={fetchData}
        />
      )}

      {/* Withdrawal Request Detail Modal */}
      {selectedWithdrawalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-bold text-white">Détails de la demande</h3>
              <button onClick={() => setSelectedWithdrawalReq(null)} className="text-gray-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-orange-500/10 p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">
                  {formatCurrency(selectedWithdrawalReq.amount)}
                </p>
                {selectedWithdrawalReq.fee > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Frais: {formatCurrency(selectedWithdrawalReq.fee)}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Référence</span>
                  <span className="font-mono text-white">{selectedWithdrawalReq.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Demandeur</span>
                  <span className="text-white">{selectedWithdrawalReq.requesterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Téléphone</span>
                  <span className="text-white">{selectedWithdrawalReq.requesterPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{format(new Date(selectedWithdrawalReq.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>

                {selectedWithdrawalReq.message && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-1">Message</p>
                    <p className="text-white italic">"{selectedWithdrawalReq.message}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    const code = prompt('Saisissez le code de confirmation à 6 caractères:');
                    if (!code || code.length !== 6) {
                      alert('Code invalide. Le code doit contenir 6 caractères.');
                      return;
                    }
                    try {
                      await api.post(`/withdrawal-requests/${selectedWithdrawalReq.id}/approve`, { confirmationCode: code });
                      alert('Retrait validé ! Remettez l\'argent au client.');
                      setSelectedWithdrawalReq(null);
                      fetchData();
                    } catch (e: any) {
                      alert(e.response?.data?.error || 'Échec');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-black hover:bg-green-400"
                >
                  <CheckCircle className="h-5 w-5" />
                  Approuver
                </button>
                <button
                  onClick={async () => {
                    const reason = prompt('Raison du refus ?');
                    try {
                      await api.post(`/withdrawal-requests/${selectedWithdrawalReq.id}/reject`, { reason });
                      setSelectedWithdrawalReq(null);
                      fetchData();
                    } catch (e) { console.error(e); }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-400"
                >
                  <XCircle className="h-5 w-5" />
                  Refuser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

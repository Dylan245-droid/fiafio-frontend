import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowDownLeft, Banknote, Wallet, History, RefreshCcw, LogOut,
  TrendingUp, Award, ChevronRight, AlertCircle, QrCode,
  Search, CheckCircle, Delete, ArrowLeft, User, AlertTriangle
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

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

type View = 'DASHBOARD' | 'DEPOSIT' | 'WITHDRAW' | 'ACTIVATE' | 'MY_QR';
type Step = 'CUSTOMER' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

const FEE_PERCENTAGE = 0.02;

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

  // Transaction flow
  const [customerQuery, setCustomerQuery] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [txRef, setTxRef] = useState('');
  const [processing, setProcessing] = useState(false);

  const fee = view === 'WITHDRAW' ? Math.round(Number(amount) * FEE_PERCENTAGE) : 0;

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [accRes, txRes, statsRes] = await Promise.all([
        api.get('/accounts/balance'),
        api.get('/accounts/history?limit=5'),
        api.get('/agent/stats'),
      ]);
      
      const accounts = accRes.data.accounts;
      setFloatBalance(accounts.find((a: any) => a.type === 'AGENT_FLOAT')?.balance || 0);
      setTransactions(txRes.data.transactions);
      setStats(statsRes.data);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 17) return 'Bonsoir';
    return 'Bonjour';
  };

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
      if (!amount || Number(amount) < 250000) {
        setError('Montant minimum: 250 000 XAF');
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
                <p className="mt-2 text-gray-400">Premier dépôt float (min 250 000 XAF)</p>
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
                  disabled={processing || !amount || Number(amount) < 250000}
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.fullName?.split(' ')[0]}
            {stats?.level?.badge && <span className="ml-2">{stats.level.badge}</span>}
          </h1>
          <p className="text-sm text-gray-400">
            Agent ID: <span className="font-mono text-primary">{user?.uniqueId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={fetchData} 
            disabled={refreshing}
            className="rounded-full bg-surface p-2.5 text-gray-400 hover:bg-accent hover:text-primary disabled:opacity-50"
          >
            <RefreshCcw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            type="button"
            onClick={handleLogout} 
            className="rounded-full bg-surface p-2.5 text-gray-400 hover:bg-red-500/20 hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Activation Banner for PENDING_FLOAT agents */}
      {stats?.activation?.status === 'PENDING_FLOAT' && (
        <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-400">Compte en attente d'activation</p>
                <p className="text-sm text-gray-400">
                  Effectuez votre premier dépôt float (min 250 000 XAF) avant le délai.
                  {stats.activation.daysRemaining !== null && (
                    <span className="ml-1 font-bold text-yellow-500">
                      {stats.activation.daysRemaining} jour(s) restant(s)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView('ACTIVATE')}
              className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400"
            >
              Activer
            </button>
          </div>
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
                Le délai d'activation a expiré. Contactez le support Fiafio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Float Balance Card */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-black">
        <div className="flex items-center gap-2 opacity-80">
          <Wallet className="h-5 w-5" />
          <span className="font-medium">Float Disponible</span>
        </div>
        <div className="mt-3 text-4xl font-bold tracking-tighter">
          {loading ? '...' : formatCurrency(floatBalance)}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/float-request')}
            className="flex-1 rounded-xl bg-black/20 py-3 text-sm font-semibold backdrop-blur-sm hover:bg-black/30"
          >
            💰 Demander Float
          </button>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="rounded-xl bg-black/10 px-4 py-3 text-sm font-semibold backdrop-blur-sm hover:bg-black/20"
          >
            <History className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => { setView('DEPOSIT'); resetFlow(); }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center transition hover:bg-green-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">Dépôt</h3>
            <p className="text-xs text-gray-400">Cash-In</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setView('WITHDRAW'); resetFlow(); }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-center transition hover:bg-orange-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">Retrait</h3>
            <p className="text-xs text-gray-400">Cash-Out</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setView('MY_QR')}
          className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-surface/30 p-4 text-center transition hover:bg-surface/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">QR Code</h3>
            <p className="text-xs text-gray-400">Retrait rapide</p>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-6 space-y-4">
          {/* Level Progress */}
          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium text-white">
                  {stats.level.badge} Niveau {stats.level.key}: {stats.level.name}
                </span>
              </div>
              {stats.level.isStagnating && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500">
                  <AlertCircle className="h-3 w-3" />
                  Stagnant
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progression</span>
                <span className="text-white">
                  {stats.totalTransactions} {stats.totalTransactions <= 1 ? 'transaction' : 'transactions'} · {stats.level.transactionsUntilNextLevel} pour niveau suivant
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${stats.limits.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="h-4 w-4" />
                Volume Jour
              </div>
              <p className="mt-1 text-xl font-bold text-white">{formatCurrency(stats.limits.todayUsed)}</p>
              <p className="text-xs text-gray-500">{stats.totalTransactions} opérations total</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Wallet className="h-4 w-4" />
                Commissions
              </div>
              <p className="mt-1 text-xl font-bold text-green-500">{formatCurrency(stats.commissions.month)}</p>
              <p className="text-xs text-gray-500">Ce mois</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Activité Récente</h2>
          <button 
            type="button"
            onClick={() => navigate('/transactions')} 
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Voir tout <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface/50" />
            ))
          ) : transactions.length > 0 ? (
            transactions.slice(0, 4).map((tx) => (
              <div 
                key={tx.reference} 
                onClick={() => setSelectedTxRef(tx.reference)}
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface/50 p-4 transition hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.direction === 'IN' ? <ArrowDownLeft className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{tx.type}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.createdAt), 'd MMM, HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                    {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className={`text-xs ${tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {tx.status === 'COMPLETED' ? 'Terminé' : tx.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Aucune transaction</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {selectedTxRef && (
        <TransactionModal 
          reference={selectedTxRef} 
          onClose={() => setSelectedTxRef(null)}
          onCancellationRequested={fetchData}
        />
      )}
    </div>
  );
}

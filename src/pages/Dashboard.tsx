import { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowUpRight, ArrowDownLeft, Wallet, History, RefreshCcw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import AgentStatsCard from '../components/AgentStatsCard';

interface Transaction {
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  direction: 'IN' | 'OUT';
  description: string;
}

interface Account {
  type: string;
  balance: number;
  currency: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        api.get('/accounts/balance'),
        api.get('/accounts/history?limit=5'),
      ]);
      setAccounts(accRes.data.accounts);
      setTransactions(txRes.data.transactions);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const wallet = accounts.find((a) => a.type === 'WALLET') || { balance: 0 };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 17) return 'Bonsoir';
    return 'Bonjour';
  };

  return (
    <div className="space-y-6 px-4 py-6 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting()}, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-gray-400">ID: <span className="font-mono text-primary">{user?.uniqueId}</span></p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData} 
            className="rounded-full bg-surface p-2 text-gray-400 hover:bg-accent hover:text-primary"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button 
            onClick={handleLogout} 
            className="rounded-full bg-surface p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-500"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-black shadow-lg shadow-primary/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 opacity-80">
            <Wallet className="h-5 w-5" />
            <span className="font-medium">Solde Total</span>
          </div>
          <div className="mt-4 text-4xl font-bold tracking-tighter">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(wallet.balance)}
          </div>
          <div className={`mt-6 grid gap-2 ${user?.role === 'AGENT' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {/* Send button - only for regular users, not agents */}
            {user?.role !== 'AGENT' && (
              <button 
                onClick={() => navigate('/transfer')}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-black/10 py-3 font-semibold backdrop-blur-sm transition hover:bg-black/20"
              >
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-xs">Envoyer</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/deposit')}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-black/10 py-3 font-semibold backdrop-blur-sm transition hover:bg-black/20"
            >
              <ArrowDownLeft className="h-5 w-5" />
              <span className="text-xs">Recharger</span>
            </button>
            <button 
              onClick={() => navigate('/withdraw')}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-black/80 py-3 font-semibold text-white transition hover:bg-black"
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs">Retrait</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agent Operations Button (if agent) */}
      {user?.role === 'AGENT' && (
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/agent')}
            className="flex-1 rounded-2xl border border-dashed border-primary/50 bg-primary/10 py-4 font-semibold text-primary transition hover:bg-primary/20"
          >
            🏦 Opérations Client
          </button>
          <button 
            onClick={() => navigate('/float-request')}
            className="flex-1 rounded-2xl border border-dashed border-blue-500/50 bg-blue-500/10 py-4 font-semibold text-blue-400 transition hover:bg-blue-500/20"
          >
            💰 Demander Recharge
          </button>
        </div>
      )}

      {/* Agent Stats Card (if agent) */}
      {user?.role === 'AGENT' && (
        <AgentStatsCard />
      )}

      {/* Recent Transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Activité Récente</h2>
          <button onClick={() => navigate('/transactions')} className="text-sm text-primary hover:underline">Voir Tout</button>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <div 
                key={tx.reference} 
                onClick={() => setSelectedTxRef(tx.reference)}
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface p-4 transition hover:bg-accent hover:scale-[1.01]"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.direction === 'IN' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tx.type}</h3>
                    <p className="text-sm text-gray-400">{format(new Date(tx.createdAt), 'MMM d, HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block font-bold ${
                    tx.direction === 'IN' ? 'text-green-500' : 'text-white'
                  }`}>
                    {tx.direction === 'IN' ? '+' : '-'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(tx.amount)}
                  </span>
                  <span className={`text-xs ${
                    tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
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

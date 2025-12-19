import { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowUpRight, ArrowDownLeft, Wallet, History, RefreshCcw, LogOut, Clock, Eye, X, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import AgentStatsCard from '../components/AgentStatsCard';
import PaymentRequestsCard from '../components/PaymentRequestsCard';

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
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const [accRes, txRes, cancelRes, withdrawRes] = await Promise.all([
        api.get('/accounts/balance'),
        api.get('/accounts/history?limit=5'),
        api.get('/agent/my-cancellation-requests').catch(() => ({ data: { requests: [] } })),
        api.get('/withdrawal-requests/my').catch(() => ({ data: { requests: [] } })),
      ]);
      setAccounts(accRes.data.accounts);
      setTransactions(txRes.data.transactions);
      setCancellationRequests(cancelRes.data.requests || []);
      setWithdrawalRequests(withdrawRes.data.requests || []);
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
  const merchantAccount = accounts.find((a) => a.type === 'MERCHANT');
  const agentFloatAccount = accounts.find((a) => a.type === 'AGENT_FLOAT');
  
  // Calculate total balance across all account types
  const totalBalance = wallet.balance 
    + (merchantAccount?.balance || 0) 
    + (agentFloatAccount?.balance || 0);

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

      {/* Payment Requests from Merchants */}
      <PaymentRequestsCard onRequestHandled={fetchData} />

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-black shadow-lg shadow-primary/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 opacity-80">
            <Wallet className="h-5 w-5" />
            <span className="font-medium">Solde Total</span>
          </div>
          <div className="mt-4 text-4xl font-bold tracking-tighter">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(totalBalance)}
          </div>
          
          {/* Account breakdown for agents and merchants */}
          {(user?.role === 'AGENT' || merchantAccount) && (
            <div className="mt-4 space-y-2 rounded-xl bg-black/10 p-3">
              {/* Personal Wallet */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black/40"></span>
                  Mon Portefeuille
                </span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('fr-FR').format(wallet.balance)} FCFA
                </span>
              </div>
              
              {/* Agent Float */}
              {agentFloatAccount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Mon Flottant Agent
                    <span className="text-xs opacity-60">(min: 100K)</span>
                  </span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('fr-FR').format(agentFloatAccount.balance)} FCFA
                  </span>
                </div>
              )}
              
              {/* Merchant Account */}
              {merchantAccount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Mes Recettes Business
                  </span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('fr-FR').format(merchantAccount.balance)} FCFA
                  </span>
                </div>
              )}
            </div>
          )}

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

      {/* Merchant Dashboard Button (only for merchants) */}
      {user?.hasMerchant && (
        <button 
          onClick={() => navigate('/merchant')}
          className="w-full rounded-2xl border border-dashed border-purple-500/50 bg-purple-500/10 py-4 font-semibold text-purple-400 transition hover:bg-purple-500/20 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🏪</span>
          Dashboard Marchand
        </button>
      )}

      {/* Agent Stats Card (if agent) */}
      {user?.role === 'AGENT' && (
        <AgentStatsCard />
      )}

      {/* Pending Cancellation Requests (for users) */}
      {cancellationRequests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h3 className="font-medium text-yellow-400">Annulations en attente</h3>
          </div>
          <div className="space-y-2">
            {cancellationRequests.filter(r => r.status === 'PENDING').map((req: any) => (
              <div key={req.id} className="rounded-xl bg-surface/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-400">Réf: {req.transactionRef}</p>
                    <p className="font-medium text-white">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(req.transactionAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Code de confirmation</p>
                    <p className="font-mono text-lg font-bold text-yellow-400 tracking-widest">{req.confirmationCode}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Donnez ce code à l'agent <strong>{req.agentName}</strong> pour valider l'annulation</p>
              </div>
            ))}
          </div>
      </div>
      )}


      {/* Withdrawal Requests Section (for users) - Only PENDING */}
      {withdrawalRequests.filter(r => r.status === 'PENDING').length > 0 && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <h3 className="font-medium text-orange-400">Demandes de retrait en attente</h3>
            </div>
            <span className="text-xs text-gray-500">{withdrawalRequests.filter(r => r.status === 'PENDING').length} demande(s)</span>
          </div>
          <div className="space-y-3">
            {withdrawalRequests.filter(r => r.status === 'PENDING').map((req: any) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
                  case 'APPROVED': return 'text-green-400 bg-green-400/10';
                  case 'REJECTED': return 'text-red-400 bg-red-400/10';
                  case 'EXPIRED': return 'text-gray-400 bg-gray-400/10';
                  case 'CANCELLED': return 'text-orange-400 bg-orange-400/10';
                  default: return 'text-gray-400';
                }
              };
              const getStatusLabel = (status: string) => {
                switch (status) {
                  case 'PENDING': return 'En attente';
                  case 'APPROVED': return 'Approuvée';
                  case 'REJECTED': return 'Refusée';
                  case 'EXPIRED': return 'Expirée';
                  case 'CANCELLED': return 'Annulée';
                  default: return status;
                }
              };

              const handleCancel = async (id: number) => {
                if (!confirm('Annuler cette demande de retrait ?')) return;
                try {
                  await api.post(`/withdrawal-requests/${id}/cancel`);
                  window.location.reload();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Échec de l\'annulation');
                }
              };

              return (
                <div key={req.id} className="rounded-xl bg-surface/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-400">Agent: {req.agentName}</p>
                      <p className="font-medium text-white">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(req.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                      <button
                        onClick={() => setSelectedWithdrawal(req)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {req.status === 'PENDING' && req.confirmationCode && (
                    <div className="rounded-lg bg-orange-500/10 p-2 mb-2">
                      <p className="text-xs text-gray-400 text-center">Code de confirmation</p>
                      <p className="font-mono text-lg font-bold text-orange-400 tracking-widest text-center">{req.confirmationCode}</p>
                      <p className="text-xs text-gray-500 text-center mt-1">Présentez ce code à l'agent</p>
                    </div>
                  )}

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="w-full rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 mt-2"
                    >
                      Annuler la demande
                    </button>
                  )}

                  {req.status === 'REJECTED' && req.responseNote && (
                    <p className="text-xs text-red-400 mt-2">Raison: {req.responseNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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

      {/* Withdrawal Request Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-bold text-white">Détails de la demande</h3>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-orange-500/10 p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(selectedWithdrawal.amount)}
                </p>
                {selectedWithdrawal.fee > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Frais: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(selectedWithdrawal.fee)}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Référence</span>
                  <span className="font-mono text-white">{selectedWithdrawal.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Agent</span>
                  <span className="text-white">{selectedWithdrawal.agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{format(new Date(selectedWithdrawal.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Statut</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    selectedWithdrawal.status === 'PENDING' ? 'text-yellow-400 bg-yellow-400/10' :
                    selectedWithdrawal.status === 'APPROVED' ? 'text-green-400 bg-green-400/10' :
                    selectedWithdrawal.status === 'REJECTED' ? 'text-red-400 bg-red-400/10' :
                    'text-gray-400 bg-gray-400/10'
                  }`}>
                    {selectedWithdrawal.status === 'PENDING' ? 'En attente' :
                     selectedWithdrawal.status === 'APPROVED' ? 'Approuvée' :
                     selectedWithdrawal.status === 'REJECTED' ? 'Refusée' :
                     selectedWithdrawal.status === 'EXPIRED' ? 'Expirée' :
                     selectedWithdrawal.status === 'CANCELLED' ? 'Annulée' : selectedWithdrawal.status}
                  </span>
                </div>

                {selectedWithdrawal.status === 'PENDING' && selectedWithdrawal.confirmationCode && (
                  <div className="border-t border-white/10 pt-3 text-center">
                    <p className="text-gray-400 mb-1">Code de confirmation</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono text-2xl font-bold text-orange-400">{selectedWithdrawal.confirmationCode}</p>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(selectedWithdrawal.confirmationCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    {copied && <p className="text-xs text-green-400 mt-1">Copié !</p>}
                    <p className="text-xs text-gray-500 mt-2">Présentez ce code à l'agent pour valider</p>
                  </div>
                )}

                {selectedWithdrawal.message && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-1">Message</p>
                    <p className="text-white italic">"{selectedWithdrawal.message}"</p>
                  </div>
                )}

                {selectedWithdrawal.responseNote && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-1">Note de l'agent</p>
                    <p className="text-red-400">"{selectedWithdrawal.responseNote}"</p>
                  </div>
                )}
              </div>

              {selectedWithdrawal.status === 'PENDING' && (
                <button
                  onClick={async () => {
                    if (!confirm('Annuler cette demande de retrait ?')) return;
                    try {
                      await api.post(`/withdrawal-requests/${selectedWithdrawal.id}/cancel`);
                      setSelectedWithdrawal(null);
                      fetchData();
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Échec de l\'annulation');
                    }
                  }}
                  className="w-full rounded-xl bg-red-500/20 py-3 font-medium text-red-400 hover:bg-red-500/30"
                >
                  Annuler la demande
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

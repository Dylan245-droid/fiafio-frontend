import { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowUpRight, ArrowDownLeft, Wallet, History, RefreshCcw, LogOut, Clock, Eye, X, Copy, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import AgentStatsCard from '../components/AgentStatsCard';
import PaymentRequestsCard from '../components/PaymentRequestsCard';
import MandateRequestsCard from '../components/MandateRequestsCard';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // React Query hooks for auto-refresh
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions(5);
  
  const accounts = accountsData?.accounts || [];
  const kycLimits = accountsData?.kycLimits || null;
  
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loading = accountsLoading || transactionsLoading;

  // Fetch additional data not covered by React Query
  const fetchAdditionalData = async () => {
    try {
      const [cancelRes, withdrawRes] = await Promise.all([
        api.get('/agent/my-cancellation-requests').catch(() => ({ data: { requests: [] } })),
        api.get('/withdrawal-requests/my').catch(() => ({ data: { requests: [] } })),
      ]);
      setCancellationRequests(cancelRes.data.requests || []);
      setWithdrawalRequests(withdrawRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch additional data', error);
    }
  };

  useEffect(() => {
    fetchAdditionalData();
  }, []);

  // Redirect merchants to their dedicated portal
  useEffect(() => {
    if (user?.hasMerchant) {
      navigate('/merchant', { replace: true });
    }
  }, [user?.hasMerchant, navigate]);

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

  // Refresh all data using React Query
  const handleRefresh = () => {
    refetchAccounts();
    refetchTransactions();
    fetchAdditionalData();
  };


  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header Premium 2026 - Simplified */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-surface/20 border border-white/5 backdrop-blur-md gap-6">
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">User Profile</p>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                {user?.fullName?.split(' ')[0]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <ThemeToggle />
            <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block" />
            <button 
              onClick={handleRefresh} 
              className="rounded-xl bg-white/5 p-3 text-gray-400 hover:bg-primary/20 hover:text-primary transition-all border border-white/5"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button 
              onClick={handleLogout} 
              className="rounded-xl bg-white/5 p-3 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/10"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

      {/* KYC Verification Banner (for level 0 users) */}
      {kycLimits?.kycLevel === 0 && user?.role === 'CLIENT' && (
        <button
          onClick={() => navigate('/kyc')}
          className="w-full mb-6 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-4 text-left transition hover:border-red-500/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-400">Vérification requise</p>
              <p className="text-sm text-gray-400">Vérifiez votre identité pour effectuer des transactions</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-red-400" />
          </div>
        </button>
      )}

      {/* Mandate Requests (Subscriptions) */}
      <MandateRequestsCard onMandateHandled={handleRefresh} />

      {/* Payment Requests from Merchants */}
      <PaymentRequestsCard onRequestHandled={handleRefresh} />

      {/* Main Balance Card - Premium Design */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/60 p-8 text-black shadow-2xl shadow-primary/10 mb-6 font-sans">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 px-2 rounded-lg bg-black/10 text-[10px] font-black uppercase tracking-widest">
              Total Available Balance
            </div>
            {loading && <RefreshCcw className="h-3 w-3 animate-spin opacity-50" />}
          </div>
          <div className="mt-4 text-5xl font-black tracking-tighter truncate leading-tight">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(totalBalance)}
          </div>
          
          {/* Account breakdown for agents and merchants */}
          {(user?.role === 'AGENT' || merchantAccount) && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/10 p-4 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Mon Portefeuille</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('fr-FR').format(wallet.balance)} FCFA
                </p>
              </div>
              
              {merchantAccount && (
                <div className="rounded-2xl bg-black/20 p-4 border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Business Revenue</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('fr-FR').format(merchantAccount.balance)} FCFA
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 relative">
            <div className={`grid ${user?.role === 'AGENT' ? 'grid-cols-2' : 'grid-cols-3'} gap-3 ${kycLimits && kycLimits.kycLevel === 0 && user?.role === 'CLIENT' ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Send button */}
              {user?.role !== 'AGENT' && (
                <button 
                  onClick={() => kycLimits && kycLimits.perTransaction > 0 && navigate('/transfer')}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-black text-white py-4 transition hover:bg-black/80 shadow-xl shadow-black/20"
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Envoyer</span>
                </button>
              )}
              <button 
                onClick={() => navigate('/deposit')}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-semibold transition hover:bg-white/20 backdrop-blur-md"
              >
                <ArrowDownLeft className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recharger</span>
              </button>
              <button 
                onClick={() => kycLimits && kycLimits.perTransaction > 0 && navigate('/withdraw')}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-black py-4 font-semibold text-white transition hover:bg-black/80"
              >
                <Wallet className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Retrait</span>
              </button>
            </div>

            {/* Overlay for KYC Level 0 */}
            {kycLimits && kycLimits.kycLevel === 0 && user?.role === 'CLIENT' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-md p-6">
                <div className="text-center">
                   <p className="text-white text-sm font-black uppercase tracking-widest mb-1">KYC REQUIRED</p>
                   <p className="text-gray-400 text-[10px] font-mono mb-6 uppercase tracking-widest">Identification phase pending</p>
                   <button
                    onClick={() => navigate('/kyc')}
                    className="rounded-full bg-primary px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all font-bold"
                  >
                    Verify Identity
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KYC Limits Card (for clients only) */}
      {kycLimits && user?.role === 'CLIENT' && (
        <div className="rounded-2xl bg-surface/50 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Limites KYC (Niveau {kycLimits.kycLevel})</h3>
            <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded-full">
              {kycLimits.kycLevel === 1 ? 'Basique' : kycLimits.kycLevel === 2 ? 'Vérifié' : 'Premium'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-gray-500">Par transaction</p>
              <p className="font-semibold text-white">{kycLimits.perTransaction.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-gray-500">Restant aujourd'hui</p>
              <p className="font-semibold text-primary">{kycLimits.dailyRemaining.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
          {kycLimits.kycLevel < 3 && (
            <button
              onClick={() => navigate('/kyc')}
              className="w-full mt-3 rounded-xl bg-primary/20 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition"
            >
              🆙 Augmenter mes limites
            </button>
          )}
        </div>
      )}

      {/* Agent Operations Button (if agent) */}
      {user?.role === 'AGENT' && (
        <div className="space-y-3">
          {/* KYC Verification for Agents */}
          <button
            onClick={() => navigate('/kyc')}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 text-left transition hover:border-blue-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <span className="text-lg">🛡️</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-400">Vérification KYC</p>
                <p className="text-sm text-gray-400">Niveau 2 requis pour activer le compte agent</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-blue-400" />
            </div>
          </button>

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

      {/* Recent Activity Section - Timeline Design */}
      <div className="mb-8 rounded-[2.5rem] border border-white/5 bg-surface/20 p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">
              Flux Financier
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
              <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-white/5 group-last:hidden" />
              
              {/* Dot */}
              <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-surface/50 border border-white/10 flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${tx.direction === 'IN' ? 'bg-green-500' : 'bg-primary'} animate-pulse`} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none">
                    {tx.type}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {format(new Date(tx.createdAt), 'dd MMM, HH:mm')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-black ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                    {tx.direction === 'IN' ? '+' : '-'}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(tx.amount)}
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

      {/* Transaction Detail Modal */}
      {selectedTxRef && (
        <TransactionModal 
          reference={selectedTxRef} 
          onClose={() => setSelectedTxRef(null)}
          onCancellationRequested={handleRefresh}
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
                      handleRefresh();
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  AlertTriangle, BrainCircuit, Activity, Users, ShieldAlert, FileText, 
  Wallet, CheckCircle, XCircle, Clock, TrendingUp, Building, LogOut, Filter, DollarSign, BarChart3
} from 'lucide-react';

interface FloatRequest {
  id: number;
  reference: string;
  amount: number;
  requesterName: string;
  requesterPhone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  message: string | null;
  responseNote: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export default function AdminConsole() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FLOAT_REQUESTS' | 'REVENUE' | 'LEDGER' | 'ALERTS' | 'AUDIT'>('DASHBOARD');
  const [stats, setStats] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [filteredLedger, setFilteredLedger] = useState<any[]>([]);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [floatRequests, setFloatRequests] = useState<FloatRequest[]>([]);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [injections, setInjections] = useState<any[]>([]);
  
  // Ledger filters
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');
  
  // Float requests filter
  const [floatFilter, setFloatFilter] = useState<string>('ALL');
  const [allFloatRequests, setAllFloatRequests] = useState<FloatRequest[]>([]);
  
  // Revenue state
  const [revenue, setRevenue] = useState<{
    thisMonth: number;
    lastMonth: number;
    yearToDate: number;
    growth: number;
    monthlyData: { month: string; revenue: number; volume: number; count: number }[];
  } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchVelocity();
    fetchInjections();
    fetchFloatRequests(); // Load on mount for badge count
    fetchRevenue(); // Load revenue on mount for dashboard card
  }, []);

  useEffect(() => {
    if (activeTab === 'LEDGER') fetchLedger();
    if (activeTab === 'ALERTS') fetchAlerts();
    if (activeTab === 'FLOAT_REQUESTS') fetchAllFloatRequests();
    if (activeTab === 'REVENUE') fetchRevenue();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchVelocity = async () => {
    try {
      const res = await api.get('/admin/velocity');
      setVelocity(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchInjections = async () => {
    try {
      const res = await api.get('/admin/treasury/history');
      setInjections(res.data.injections);
    } catch (e) { console.error(e); }
  };

  const fetchLedger = async () => {
    try {
      const res = await api.get('/admin/ledger');
      setLedger(res.data.entries);
      setFilteredLedger(res.data.entries);
    } catch (e) { console.error(e); }
  };

  // Filter ledger when filters change
  useEffect(() => {
    let filtered = [...ledger];
    
    if (ledgerFilter !== 'ALL') {
      filtered = filtered.filter(entry => entry.entryType === ledgerFilter);
    }
    
    if (ledgerSearch) {
      const search = ledgerSearch.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.userName?.toLowerCase().includes(search) ||
        entry.transactionId?.toLowerCase().includes(search) ||
        entry.accountType?.toLowerCase().includes(search)
      );
    }
    
    setFilteredLedger(filtered);
  }, [ledger, ledgerFilter, ledgerSearch]);

  // Reload float requests when filter changes
  useEffect(() => {
    if (activeTab === 'FLOAT_REQUESTS') {
      fetchAllFloatRequests();
    }
  }, [floatFilter]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/admin/alerts');
      setAlerts(res.data.alerts);
    } catch (e) { console.error(e); }
  };

  const fetchFloatRequests = async () => {
    try {
      const res = await api.get('/float-requests/pending');
      setFloatRequests(res.data.requests);
    } catch (e) { console.error(e); }
  };

  const fetchAllFloatRequests = async () => {
    try {
      const res = await api.get(`/float-requests/admin/all?status=${floatFilter}`);
      setAllFloatRequests(res.data.requests);
    } catch (e) { console.error(e); }
  };

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/admin/revenue');
      setRevenue(res.data);
    } catch (e) { console.error(e); }
  };

  const handleApproveFloat = async (id: number) => {
    if (!confirm('Confirmer le transfert de float vers cet agent ?')) return;
    setProcessingId(id);
    try {
      await api.post(`/float-requests/${id}/approve`);
      setSuccessMessage('Demande approuvée avec succès !');
      fetchFloatRequests();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFloat = async (id: number) => {
    const reason = prompt('Raison du refus (optionnel):');
    setProcessingId(id);
    try {
      await api.post(`/float-requests/${id}/reject`, { reason });
      setSuccessMessage('Demande refusée');
      fetchFloatRequests();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur lors du refus');
    } finally {
      setProcessingId(null);
    }
  };

  const runAIAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/admin/ai-audit');
      setAuditResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Console Admin</h1>
          <p className="text-gray-400">Gestion et supervision Fiafio</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            OPÉRATIONNEL
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-black font-medium shadow-lg animate-pulse">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'DASHBOARD', label: 'Tableau de Bord', icon: TrendingUp },
          { key: 'FLOAT_REQUESTS', label: 'Demandes Float', icon: Wallet, badge: floatRequests.length },
          { key: 'REVENUE', label: 'Recettes', icon: DollarSign },
          { key: 'LEDGER', label: 'Grand Livre', icon: FileText },
          { key: 'ALERTS', label: 'Alertes', icon: ShieldAlert, badge: stats?.openAlerts },
          { key: 'AUDIT', label: 'Audit IA', icon: BrainCircuit },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 rounded-full px-5 py-3 font-medium transition ${
              activeTab === tab.key 
                ? 'bg-primary text-black' 
                : 'bg-surface/50 text-gray-400 hover:bg-surface hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-red-500 text-white'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'DASHBOARD' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-transparent p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Building className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Trésorerie Fiafio</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const amount = prompt('Montant à injecter dans la trésorerie (XAF):');
                      if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
                        api.post('/admin/treasury/inject', { amount: Number(amount) })
                          .then(() => {
                            setSuccessMessage(`${formatCurrency(Number(amount))} ajoutés à la trésorerie`);
                            fetchStats();
                            fetchInjections();
                            setTimeout(() => setSuccessMessage(''), 3000);
                          })
                          .catch((e) => alert(e.response?.data?.error || 'Erreur'));
                      }
                    }}
                    className="shrink-0 rounded-lg bg-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/30"
                  >
                    + Recharger
                  </button>
                </div>
                <div className="mt-2 text-xl font-bold text-white md:text-2xl">
                  {formatCurrency(stats?.treasuryBalance || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">Solde actuel</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                <p className="mt-1 text-xs text-gray-500">Inscrits</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Activity className="h-4 w-4" />
                  Transactions
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{stats?.totalTransactions || 0}</div>
                <p className="mt-1 text-xs text-gray-500">Total</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  Volume (24h)
                </div>
                <div className="mt-2 text-2xl font-bold text-primary">
                  {formatCurrency(stats?.todayVolume || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">Aujourd'hui</p>
              </div>
              <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <DollarSign className="h-4 w-4" />
                  Recettes (mois)
                </div>
                <div className="mt-2 text-2xl font-bold text-green-400">
                  {formatCurrency(revenue?.thisMonth || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {revenue && revenue.growth !== 0 && (
                    <span className={revenue.growth > 0 ? 'text-green-400' : 'text-red-400'}>
                      {revenue.growth > 0 ? '+' : ''}{revenue.growth}%
                    </span>
                  )} vs mois dernier
                </p>
              </div>
            </div>

            {/* Velocity Chart */}
            <div className="h-80 w-full rounded-3xl border border-white/5 bg-surface/30 p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Vélocité des Transactions (24h)
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#666" 
                    fontSize={12} 
                    tickFormatter={(v) => v.split(' ')[1]} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#06231D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
                  />
                  <Line type="monotone" dataKey="volume" stroke="#d4ff00" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#d4ff00' }} />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Injection History */}
            {injections.length > 0 && (
              <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Historique Injections Trésorerie
                </h3>
                <div className="space-y-2">
                  {injections.slice(0, 5).map((inj) => (
                    <div key={inj.id} className="flex items-center justify-between rounded-xl bg-black/20 p-3">
                      <div>
                        <p className="text-sm text-white">{inj.description || 'Injection trésorerie'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inj.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">+{formatCurrency(inj.amount)}</p>
                        <p className="text-xs text-gray-500">Solde: {formatCurrency(inj.balanceAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* FLOAT REQUESTS TAB */}
        {activeTab === 'FLOAT_REQUESTS' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400">
              <Wallet className="mr-2 inline h-5 w-5" />
              Historique complet des demandes de recharge float vers Fiafio. Filtrez par statut pour gérer les demandes.
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFloatFilter(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    floatFilter === s 
                      ? s === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : s === 'APPROVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : s === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : s === 'CANCELLED' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : s === 'EXPIRED' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      : 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-surface/50 text-gray-400 hover:bg-surface'
                  }`}
                >
                  {s === 'ALL' ? 'Toutes' : 
                   s === 'PENDING' ? 'En attente' :
                   s === 'APPROVED' ? 'Approuvées' :
                   s === 'REJECTED' ? 'Refusées' :
                   s === 'CANCELLED' ? 'Annulées' : 'Expirées'}
                </button>
              ))}
            </div>

            {allFloatRequests.length === 0 ? (
              <div className="rounded-3xl bg-surface/30 p-16 text-center">
                <Clock className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="text-xl font-bold text-white">Aucune demande {floatFilter !== 'ALL' ? 'avec ce statut' : ''}</h3>
                <p className="text-gray-500">Les demandes de recharge float des agents apparaîtront ici.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {allFloatRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className={`rounded-3xl border bg-surface/30 p-6 ${
                      req.status === 'PENDING' ? 'border-yellow-500/30' :
                      req.status === 'APPROVED' ? 'border-green-500/30' :
                      req.status === 'REJECTED' ? 'border-red-500/30' :
                      req.status === 'CANCELLED' ? 'border-orange-500/30 opacity-60' :
                      'border-white/10 opacity-60'
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{req.requesterName}</h3>
                        <p className="text-sm text-gray-500">{req.requesterPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(req.amount)}</p>
                        <span className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-bold ${
                          req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                          req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                          req.status === 'CANCELLED' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {req.status === 'PENDING' ? 'En attente' :
                           req.status === 'APPROVED' ? 'Approuvée' :
                           req.status === 'REJECTED' ? 'Refusée' :
                           req.status === 'CANCELLED' ? 'Annulée' : 'Expirée'}
                        </span>
                      </div>
                    </div>
                    
                    {req.message && (
                      <p className="mb-4 text-sm text-gray-400 italic border-l-2 border-primary/50 pl-3">
                        "{req.message}"
                      </p>
                    )}

                    {req.responseNote && (
                      <p className="mb-4 text-sm text-gray-400">
                        <span className="font-medium">Réponse:</span> {req.responseNote}
                      </p>
                    )}

                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Réf: {req.reference} · {formatDate(req.createdAt)}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveFloat(req.id)}
                          disabled={processingId === req.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-black hover:bg-green-400 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleRejectFloat(req.id)}
                          disabled={processingId === req.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 py-3 font-bold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'REVENUE' && (
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <DollarSign className="h-4 w-4" />
                  Mois en cours
                </div>
                <div className="mt-2 text-3xl font-bold text-green-400">
                  {formatCurrency(revenue?.thisMonth || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {revenue && revenue.growth !== 0 && (
                    <span className={revenue.growth > 0 ? 'text-green-400' : 'text-red-400'}>
                      {revenue.growth > 0 ? '↑' : '↓'} {Math.abs(revenue.growth)}%
                    </span>
                  )} vs mois dernier
                </p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <BarChart3 className="h-4 w-4" />
                  Mois dernier
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {formatCurrency(revenue?.lastMonth || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">Total des recettes</p>
              </div>
              <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <TrendingUp className="h-4 w-4" />
                  Année en cours
                </div>
                <div className="mt-2 text-3xl font-bold text-primary">
                  {formatCurrency(revenue?.yearToDate || 0)}
                </div>
                <p className="mt-1 text-xs text-gray-500">Cumul annuel</p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400">
              <DollarSign className="mr-2 inline h-5 w-5" />
              Les recettes proviennent des frais de transactions : 40% des frais de retrait (2%) et 60% des frais d'annulation (5%).
            </div>

            {/* Monthly Revenue Chart */}
            <div className="h-80 w-full rounded-3xl border border-white/5 bg-surface/30 p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Recettes Mensuelles (6 derniers mois)
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    fontSize={12} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#666" 
                    fontSize={12} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                    tickFormatter={(v) => `${Math.round(v/1000)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#06231D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
                    formatter={(value: number) => [formatCurrency(value), 'Recettes']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Breakdown Table */}
            {revenue?.monthlyData && revenue.monthlyData.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Mois</th>
                      <th className="px-6 py-4 text-right font-medium">Transactions</th>
                      <th className="px-6 py-4 text-right font-medium">Volume</th>
                      <th className="px-6 py-4 text-right font-medium">Recettes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {revenue.monthlyData.map((month) => (
                      <tr key={month.month} className="text-gray-300 transition hover:bg-white/5">
                        <td className="px-6 py-4 font-medium text-white">{month.month}</td>
                        <td className="px-6 py-4 text-right">{month.count}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(month.volume)}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-400">{formatCurrency(month.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LEDGER TAB */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Filter className="h-4 w-4" />
                Filtres:
              </div>
              <div className="flex gap-2">
                {(['ALL', 'CREDIT', 'DEBIT'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLedgerFilter(type)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      ledgerFilter === type
                        ? type === 'CREDIT' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : type === 'DEBIT'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-surface/50 text-gray-400 hover:bg-surface'
                    }`}
                  >
                    {type === 'ALL' ? 'Tous' : type === 'CREDIT' ? 'Crédits' : 'Débits'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Rechercher (nom, ref, type)..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-surface/50 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50"
              />
              <span className="text-sm text-gray-500">
                {filteredLedger.length} entrée(s)
              </span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Horodatage</th>
                      <th className="px-6 py-4 font-medium">Réf Transaction</th>
                      <th className="px-6 py-4 font-medium">Compte</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 text-right font-medium">Montant</th>
                      <th className="px-6 py-4 text-right font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLedger.map((entry) => (
                      <tr key={entry.id} className="text-gray-300 transition hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-500">{new Date(entry.createdAt).toLocaleTimeString('fr-FR')}</td>
                        <td className="px-6 py-4 font-mono text-xs">{entry.transactionId}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{entry.userName}</span>
                          <span className="block text-xs text-gray-500">{entry.accountType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                            entry.entryType === 'DEBIT' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {entry.entryType === 'DEBIT' ? 'DÉBIT' : 'CRÉDIT'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-gray-600" title={entry.hash}>
                          {entry.hash.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'ALERTS' && (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-500">
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>Aucune alerte. Le système est sain.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-red-950/20 p-6">
                  <div className="absolute left-0 top-0 h-full w-1 bg-red-500"></div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Alerte {alert.type}</h3>
                        <p className="text-xs text-red-400">{formatDate(alert.createdAt)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-black">{alert.severity}</span>
                  </div>
                  <p className="mb-4 text-sm text-gray-300">{alert.description}</p>
                  <div className="rounded-xl bg-black/40 p-3 font-mono text-xs text-gray-500">
                    {JSON.stringify(alert.metadata)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-10 text-center">
              <BrainCircuit className="mx-auto mb-6 h-16 w-16 text-primary" />
              <h3 className="mb-2 text-2xl font-bold text-white">Auditeur IA Gemini</h3>
              <p className="mx-auto mb-8 max-w-lg text-gray-400">
                Analysez les patterns de transactions récentes pour détecter les signatures de blanchiment d'argent (Structuring, Smurfing, Round-tripping).
              </p>
              <button 
                type="button"
                onClick={runAIAudit}
                disabled={loadingAudit}
                className="rounded-2xl bg-primary px-8 py-4 font-bold text-black shadow-[0_0_40px_rgba(212,255,0,0.3)] transition hover:scale-105 disabled:opacity-50"
              >
                {loadingAudit ? 'Analyse en cours...' : 'Lancer l\'Audit'}
              </button>
            </div>

            {auditResult && (
              <div className="rounded-3xl border border-green-500/30 bg-black/40 p-6 font-mono text-sm">
                <div className="mb-4 flex items-center gap-2 text-green-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  <h4 className="font-bold uppercase tracking-widest">Terminal Rapport d'Audit</h4>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p className="text-green-500">$ analyse des vecteurs de transaction...</p>
                  <p className="text-green-500">$ détection de patterns...</p>
                  <div className="mt-4 border-l-2 border-green-500/50 pl-4">
                    <pre className="whitespace-pre-wrap font-sans text-gray-400">
                      {auditResult.prompt}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

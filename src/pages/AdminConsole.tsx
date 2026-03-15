import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  AlertTriangle, BrainCircuit, Activity, Users, ShieldAlert, FileText, 
  Wallet, CheckCircle, XCircle, Clock, TrendingUp, Building, LogOut, Filter, DollarSign, BarChart3, Shield, Eye,
  X, Loader2, BookOpen, ShieldCheck, Search, SearchSlash
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

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
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FLOAT_REQUESTS' | 'KYC' | 'REVENUE' | 'LEDGER' | 'OHADA_LEDGER' | 'PLAN_COMPTABLE' | 'ALERTS' | 'AUDIT'>('DASHBOARD');
  const [stats, setStats] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ohadaLedger, setOhadaLedger] = useState<any[]>([]);
  const [filteredLedger, setFilteredLedger] = useState<any[]>([]);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [floatRequests, setFloatRequests] = useState<FloatRequest[]>([]);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [injections, setInjections] = useState<any[]>([]);
  const [alertStatusFilter, setAlertStatusFilter] = useState<'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | 'ALL'>('OPEN');
  
  // Ledger filters
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // Recharge modal state
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  
  // Float requests filter
  const [floatFilter, setFloatFilter] = useState<string>('ALL');
  const [allFloatRequests, setAllFloatRequests] = useState<FloatRequest[]>([]);
  
  // KYC verification state
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [kycProcessingId, setKycProcessingId] = useState<number | null>(null);
  
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
    if (activeTab === 'OHADA_LEDGER') fetchOhadaLedger();
    if (activeTab === 'ALERTS') fetchAlerts();
    if (activeTab === 'FLOAT_REQUESTS') fetchAllFloatRequests();
    if (activeTab === 'REVENUE') fetchRevenue();
    if (activeTab === 'KYC') fetchKycRequests();
  }, [activeTab, ledgerStartDate, ledgerEndDate, alertStatusFilter]);

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
      const params = new URLSearchParams();
      if (ledgerStartDate) params.append('startDate', ledgerStartDate);
      if (ledgerEndDate) params.append('endDate', ledgerEndDate);
      
      const res = await api.get(`/admin/ledger?${params.toString()}`);
      setLedger(res.data.entries);
      setFilteredLedger(res.data.entries);
    } catch (e) { console.error(e); }
  };

  const fetchOhadaLedger = async () => {
    try {
      const res = await api.get('/admin/accounting/grand-livre');
      setOhadaLedger(res.data.data.data); // Based on Lucide paginate structure
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
      const url = alertStatusFilter === 'ALL' ? '/admin/alerts' : `/admin/alerts?status=${alertStatusFilter}`;
      const res = await api.get(url);
      setAlerts(res.data.alerts);
    } catch (e) { console.error(e); }
  };

  const handleUpdateAlertStatus = async (alertId: number, status: string) => {
    try {
      setProcessingId(alertId);
      await api.put(`/admin/alerts/${alertId}`, { status });
      setSuccessMessage('Statut de l\'alerte mis à jour');
      fetchAlerts();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  const renderAlertMetadata = (alert: any) => {
    let meta = alert.metadata;
    if (!meta) return null;

    // Handle stringified JSON if necessary
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch (e) {
        console.error('Failed to parse metadata', e);
        return <pre className="text-[10px] text-gray-500">{meta}</pre>;
      }
    }

    if (alert.type === 'THRESHOLD') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Montant Transaction:</span>
            <span className="font-bold text-white">{formatCurrency(Number(meta.amount || 0))}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Seuil Configuré:</span>
            <span className="text-red-400">{formatCurrency(Number(meta.threshold || 0))}</span>
          </div>
        </div>
      );
    }

    if (alert.type === 'VELOCITY') {
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Nombre Transactions:</span>
            <span className="font-bold text-white">{meta.count} Tx</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Période:</span>
            <span className="text-blue-400">{meta.period === '1hour' ? '1 heure' : meta.period}</span>
          </div>
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-[10px] text-gray-500">
        {JSON.stringify(meta, null, 2)}
      </pre>
    );
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

  const fetchKycRequests = async () => {
    try {
      const res = await api.get('/kyc/admin/pending');
      setKycRequests(res.data.requests);
    } catch (e) { console.error(e); }
  };

  const handleApproveDoc = async (docId: number) => {
    setKycProcessingId(docId);
    try {
      await api.post(`/kyc/admin/documents/${docId}/review`, { action: 'approve' });
      setSuccessMessage('Document approuvé !');
      fetchKycRequests();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setKycProcessingId(null);
    }
  };

  const handleRejectDoc = async (docId: number) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    setKycProcessingId(docId);
    try {
      await api.post(`/kyc/admin/documents/${docId}/review`, { action: 'reject', reason });
      setSuccessMessage('Document rejeté');
      fetchKycRequests();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setKycProcessingId(null);
    }
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

  const handleInjectTreasury = async () => {
    if (!rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    setIsInjecting(true);
    try {
      await api.post('/admin/treasury/inject', { amount: Number(rechargeAmount) });
      setSuccessMessage(`${formatCurrency(Number(rechargeAmount))} ajoutés à la trésorerie`);
      setShowRechargeModal(false);
      setRechargeAmount('');
      fetchStats();
      fetchInjections();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erreur lors de l\'injection');
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-white">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Console Admin</h1>
          <p className="text-gray-400 text-sm">Gestion et supervision Fiafio</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 border border-green-500/20 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            OPÉRATIONNEL
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
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
          { key: 'KYC', label: 'Vérif KYC', icon: Shield, badge: kycRequests.filter(r => r.documents.some((d: any) => d.status === 'PENDING')).length },
          { key: 'REVENUE', label: 'Recettes', icon: DollarSign },
          { key: 'LEDGER', label: 'Historique Transactions', icon: Activity },
          { key: 'OHADA_LEDGER', label: 'Grand Livre', icon: FileText },
          { key: 'PLAN_COMPTABLE', label: 'Plan Comptable', icon: BookOpen },
          { key: 'ALERTS', label: 'Alertes', icon: ShieldAlert, badge: stats?.openAlerts },
          { key: 'AUDIT', label: 'Audit IA', icon: BrainCircuit },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-3 text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-primary text-black' 
                : 'bg-surface/50 text-gray-400 hover:bg-surface hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
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
                    onClick={() => setShowRechargeModal(true)}
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
            <div className="h-80 min-h-[320px] w-full rounded-3xl border border-white/5 bg-surface/30 p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Vélocité des Transactions (24h)
              </h3>
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
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

        {/* KYC VERIFICATION TAB */}
        {activeTab === 'KYC' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400 text-sm">
              <Shield className="mr-2 inline h-5 w-5" />
              <span className="font-bold">Rappel Exigences :</span>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Niveau 1 :</span> CNI Recto <span className="font-bold">OU</span> Passeport</li>
                <li><span className="font-semibold">Niveau 2 :</span> (CNI Recto + Verso + Selfie) <span className="font-bold">OU</span> (Passeport + Selfie)</li>
                <li><span className="font-semibold">Niveau 3 :</span> Niveau 2 + Justificatif de domicile</li>
              </ul>
            </div>

            {kycRequests.length === 0 ? (
              <div className="rounded-3xl bg-surface/30 p-16 text-center">
                <Shield className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="text-xl font-bold text-white">Aucune demande en attente</h3>
                <p className="text-gray-500">Les nouvelles demandes de vérification apparaîtront ici.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {kycRequests.map((user) => (
                  <div key={user.userId} className="rounded-3xl border border-blue-500/30 bg-surface/30 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{user.fullName || 'Utilisateur'}</h3>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
                        Niveau {user.currentLevel}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {user.documents.map((doc: any) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between rounded-xl bg-black/20 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {doc.type === 'CNI_FRONT' ? 'CNI Recto' : 
                                 doc.type === 'CNI_BACK' ? 'CNI Verso' :
                                 doc.type === 'PASSPORT' ? 'Passeport' :
                                 doc.type === 'SELFIE' ? 'Selfie' : 'Justificatif domicile'}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <a
                              href={`${api.defaults.baseURL}/kyc/admin/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-gray-500/20 p-2 text-gray-400 hover:bg-gray-500/30"
                              title="Voir le document"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleApproveDoc(doc.id)}
                              disabled={kycProcessingId === doc.id}
                              className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDoc(doc.id)}
                              disabled={kycProcessingId === doc.id}
                              className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
              Les recettes incluent les commissions sur transferts (P2P), retraits (Cash-Out) et recharges agents.
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

        {/* OLD LEDGER TAB RENAME TO HISTORIQUE TRANSACTIONS */}
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
              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-surface/50 px-4 py-2 text-sm text-white outline-none focus:border-primary/50"
              />
              <span className="text-gray-500">à</span>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-surface/50 px-4 py-2 text-sm text-white outline-none focus:border-primary/50"
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
                      <th className="px-6 py-4 font-medium">Compte</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 text-right font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLedger.map((entry) => (
                      <tr key={entry.id} className="text-gray-300 transition hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}, {new Date(entry.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NEW OHADA LEDGER TAB */}
        {activeTab === 'OHADA_LEDGER' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Grand Livre (SYSCOHADA)</h3>
              <div className="text-sm text-gray-500">{ohadaLedger.length} écritures</div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Écriture</th>
                      <th className="px-6 py-4 font-medium">Compte</th>
                      <th className="px-6 py-4 font-medium">Libellé</th>
                      <th className="px-6 py-4 text-right font-medium">Débit</th>
                      <th className="px-6 py-4 text-right font-medium">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ohadaLedger.map((line) => (
                      <tr key={line.id} className="text-gray-300 transition hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-500">{new Date(line.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4">
                           <span className="block text-xs font-mono text-primary">{line.entry?.entryNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">{line.account?.code}</span>
                          <span className="block text-xs text-gray-500">{line.account?.label}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 italic">
                          {line.label || line.entry?.description}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-red-400">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-green-400">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                    {ohadaLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-gray-500">
                          Aucune écriture comptable trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'ALL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setAlertStatusFilter(s as any)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    alertStatusFilter === s 
                      ? 'bg-primary text-black' 
                      : 'bg-surface/50 text-gray-400 hover:bg-surface'
                  }`}
                >
                  {s === 'OPEN' ? 'Ouvertes' : 
                   s === 'INVESTIGATING' ? 'En cours' :
                   s === 'RESOLVED' ? 'Résolues' :
                   s === 'FALSE_POSITIVE' ? 'Faux positifs' : 'Toutes'}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {alerts.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-500 bg-surface/20 rounded-3xl border border-white/5">
                  <ShieldAlert className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>Aucune alerte avec ce statut.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`group relative overflow-hidden rounded-3xl border bg-surface/30 p-6 transition-all hover:border-white/10 ${
                    alert.status === 'RESOLVED' || alert.status === 'FALSE_POSITIVE' ? 'opacity-60 grayscale' : 'border-red-500/30'
                  }`}>
                    <div className={`absolute left-0 top-0 h-full w-1 ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600' :
                      alert.severity === 'HIGH' ? 'bg-red-500' :
                      alert.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                    
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm sm:text-base">Alerte {alert.type}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                              alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                              alert.severity === 'HIGH' ? 'bg-red-500 text-black' :
                              alert.severity === 'MEDIUM' ? 'bg-orange-500 text-black' : 'bg-yellow-500 text-black'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          alert.status === 'OPEN' ? 'text-red-400 border border-red-400/20' :
                          alert.status === 'INVESTIGATING' ? 'text-blue-400 border border-blue-400/20' :
                          alert.status === 'RESOLVED' ? 'text-green-400 border border-green-400/20' :
                          'text-gray-400 border border-gray-400/20'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-white mb-2">{alert.description}</p>
                      <div className="rounded-2xl bg-black/40 p-4 border border-white/5 space-y-3">
                        {renderAlertMetadata(alert)}
                        {(alert.userName || alert.transactionRef) && (
                          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center text-[10px]">
                            {alert.userName && (
                              <div className="flex items-center gap-1.5 text-blue-400 bg-blue-400/5 px-2 py-1 rounded-lg">
                                <Users className="h-3 w-3" />
                                <span>{alert.userName}</span>
                              </div>
                            )}
                            {alert.transactionRef && (
                              <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-lg">
                                <Activity className="h-3 w-3" />
                                <span>REF: {alert.transactionRef}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {(alert.status === 'OPEN' || alert.status === 'INVESTIGATING') && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {alert.status === 'OPEN' && (
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, 'INVESTIGATING')}
                            disabled={processingId === alert.id}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                          >
                            <Search className="h-3.5 w-3.5" />
                            Investiguer
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateAlertStatus(alert.id, 'RESOLVED')}
                          disabled={processingId === alert.id}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-black hover:bg-green-400 transition-all shadow-lg"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Résoudre
                        </button>
                        <button
                          onClick={() => handleUpdateAlertStatus(alert.id, 'FALSE_POSITIVE')}
                          disabled={processingId === alert.id}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2.5 text-xs font-bold text-gray-400 hover:bg-white/10 transition-all border border-white/10"
                        >
                          <SearchSlash className="h-3.5 w-3.5" />
                          Faux Positif
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
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

        {/* PLAN COMPTABLE TAB */}
        {activeTab === 'PLAN_COMPTABLE' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-surface/30 p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Plan Comptable (OHADA)</h3>
                  <p className="text-gray-400 text-sm">Référentiel des comptes utilisés pour la comptabilité automatisée</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4">Compte</th>
                      <th className="px-6 py-4">Intitulé</th>
                      <th className="px-6 py-4">Utilisation / Description</th>
                      <th className="px-6 py-4">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                    {[
                      { code: '52100', name: 'Banque', desc: 'Compte de trésorerie principal (Cash-in/Cash-out)', type: 'Actif' },
                      { code: '70610', name: 'Revenus Transferts P2P', desc: 'Commissions sur les transferts entre utilisateurs', type: 'Produit' },
                      { code: '70620', name: 'Revenus Retraits', desc: 'Commissions sur les retraits (Cash-out)', type: 'Produit' },
                      { code: '70630', name: 'Revenus Paiements Marchands', desc: 'Commissions sur les achats chez les marchands', type: 'Produit' },
                      { code: '70640', name: 'Revenus Rechargements', desc: 'Commissions sur les recharges de float', type: 'Produit' },
                      { code: '70650', name: 'Revenus Pénalités', desc: 'Frais d\'annulation et pénalités de transaction', type: 'Produit' },
                    ].map((acc) => (
                      <tr key={acc.code} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 font-mono font-bold text-primary">{acc.code}</td>
                        <td className="px-6 py-4 text-white font-medium">{acc.name}</td>
                        <td className="px-6 py-4 text-xs italic">{acc.desc}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            acc.type === 'Actif' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {acc.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <h4 className="flex items-center gap-2 font-bold text-yellow-500 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Note pour le comptable
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Le système Fiafio utilise une comptabilité à partie double. Chaque transaction génère automatiquement des écritures (AccountingLines) dans le Grand Livre. 
                  Les revenus sont comptabilisés hors taxes au moment de la confirmation de la transaction. Les frais de retrait incluent la part reversée à l'agent local (1.2% du montant total).
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* RECHARGE MODAL */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isInjecting && setShowRechargeModal(false)}
          />
          <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface/90 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <h3 className="text-lg font-bold text-white">Recharger la Trésorerie</h3>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  disabled={isInjecting}
                  className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-8">
                <div className="mb-6 space-y-2">
                  <label className="text-sm font-medium text-gray-400">Montant à injecter (XAF)</label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="number"
                      placeholder="Ex: 1000000"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInjectTreasury()}
                      disabled={isInjecting}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-2xl font-bold text-primary placeholder-primary/20 outline-none focus:border-primary/50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-primary/40">FCFA</div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ces fonds seront créés et ajoutés directement au solde de trésorerie Fiafio.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRechargeModal(false)}
                    disabled={isInjecting}
                    className="flex-1 rounded-2xl bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleInjectTreasury}
                    disabled={isInjecting || !rechargeAmount}
                    className="flex-[2] relative rounded-2xl bg-primary px-6 py-4 font-bold text-black transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    {isInjecting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Injection...</span>
                      </div>
                    ) : (
                      'Confirmer la Recharge'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

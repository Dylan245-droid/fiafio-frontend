import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Key, Receipt, Webhook, Settings,
  Wallet, RefreshCcw, Copy, Check, Eye, EyeOff,
  RotateCcw, Search, Save, ArrowDownLeft, ArrowUpRight, History, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import ThemeToggle from '../components/ThemeToggle';
import type { MerchantData, MerchantTransaction, MerchantTab, MerchantAccount } from './MerchantPortalTypes';
import MerchantPortalMobile from './mobile/merchant/MerchantPortalMobile';
import { ShieldCheck, Clock as ClockIcon, ShieldAlert } from 'lucide-react';




export default function MerchantPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // React Query hooks for auto-refresh
  const { data: accountsData, refetch: refetchAccounts } = useAccounts();
  const { data: recentAccountTransactions = [], refetch: refetchRecentTx } = useTransactions(5);
  
  const accounts = accountsData?.accounts || [];
  
  const [activeTab, setActiveTab] = useState<MerchantTab>('DASHBOARD');
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [loading, setLoading] = useState(true);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  
  // API Keys state
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  
  // Transactions state
  const [txPage, setTxPage] = useState(1);
  const [txMeta, setTxMeta] = useState<any>(null);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [isSandbox, setIsSandbox] = useState(() => {
    return localStorage.getItem('fiafio_sandbox_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fiafio_sandbox_mode', isSandbox.toString());
  }, [isSandbox]);
  
  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    webhookUrl: '',
    defaultCurrency: 'XAF',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refresh function for React Query
  const handleRefresh = () => {
    refetchAccounts();
    refetchRecentTx();
    if (isSandbox) fetchMerchantBalance();
  };

  const [sandboxBalance, setSandboxBalance] = useState({ balance: 0, currency: 'XAF' });

  const fetchMerchantBalance = async () => {
    try {
      const res = await api.get(`/merchant/balance?mode=${isSandbox ? 'test' : 'live'}`);
      if (res.data) {
        setSandboxBalance({ balance: res.data.balance, currency: res.data.currency });
      }
    } catch (err) {
      console.error('Error fetching merchant balance:', err);
    }
  };

  useEffect(() => {
    if (isSandbox) {
      fetchMerchantBalance();
    }
  }, [isSandbox]);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, txPage, txStatus, isSandbox]);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchant/me');
      if (res.data) {
        setMerchant(res.data);
        setSettingsForm({
          businessName: res.data.businessName || '',
          contactEmail: res.data.contactEmail || '',
          contactPhone: res.data.contactPhone || '',
          websiteUrl: res.data.websiteUrl || '',
          webhookUrl: res.data.webhookUrl || '',
          defaultCurrency: res.data.defaultCurrency || 'XAF',
        });
      }
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({ 
        page: txPage.toString(), 
        limit: '10',
        mode: isSandbox ? 'test' : 'live'
      });
      if (txStatus !== 'all') params.append('status', txStatus.toUpperCase());
      
      const res = await api.get(`/merchant/transactions?${params}`);
      if (res.data) {
        setTransactions(res.data.transactions || []);
        // Set pagination meta if available
        if (res.data.meta) {
          setTxMeta(res.data.meta);
        } else {
          // Create simple meta from data
          setTxMeta({ total: res.data.transactions?.length || 0, lastPage: 1 });
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateKeys = async () => {
    if (!confirm('Êtes-vous sûr de vouloir générer de nouvelles clés ? Les anciennes ne seront plus valides.')) return;
    
    setRotating(true);
    try {
      const res = await api.post('/merchant/rotate-keys', { mode: isSandbox ? 'test' : 'live' });
      if (res.data) {
        setMerchant(prev => prev ? { ...prev, ...res.data } : null);
      }
    } catch (err) {
      console.error('Error rotating keys:', err);
    } finally {
      setRotating(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/merchant/settings', settingsForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchMerchantData();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'XAF') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const maskKey = (key: string) => key ? `${key.substring(0, 12)}${'•'.repeat(20)}` : '';

  const tabs = [
    { key: 'DASHBOARD' as MerchantTab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'API_KEYS' as MerchantTab, label: 'Clés API', icon: Key },
    { key: 'TRANSACTIONS' as MerchantTab, label: 'Transactions', icon: Receipt },
    { key: 'WEBHOOKS' as MerchantTab, label: 'Webhooks', icon: Webhook },
    { key: 'SETTINGS' as MerchantTab, label: 'Paramètres', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-white">
      <div className="mx-auto max-w-6xl">
        
        <div className="hidden md:block">
          {/* Desktop Content */}
        {/* Header Premium 2026 - Simplified */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2.5rem] bg-surface/20 border border-white/5 backdrop-blur-md gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#111]">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-1">Business Identity</p>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                {merchant?.businessName || 'Merchant Portal'}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
            {/* Sandbox Toggle */}
            <button
              onClick={() => setIsSandbox(!isSandbox)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                isSandbox 
                  ? 'bg-orange-500/10 border-orange-500/50 text-orange-500 shadow-lg shadow-orange-500/10' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isSandbox ? 'bg-orange-500 animate-pulse' : 'bg-gray-600'}`} />
              {isSandbox ? 'Sandbox Mode' : 'Live Mode'}
            </button>

            <ThemeToggle />
            <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block" />
            <button
              onClick={() => { fetchMerchantData(); handleRefresh(); }}
              className="rounded-xl bg-white/5 p-3 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-white/5"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="rounded-xl bg-white/5 p-3 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/10"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

      {/* Swipable Navigation Tabs */}
      <div className="mb-8 -mx-4 px-4 pt-4 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max gap-3 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20'
                  : 'bg-surface/20 text-gray-400 hover:text-white border border-white/5 backdrop-blur-md'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* KYC Verification Link */}
          <button
            onClick={() => navigate('/kyc')}
            className="w-full mb-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 text-left transition hover:border-blue-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <span className="text-lg">🛡️</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-400">Vérification KYC</p>
                <p className="text-sm text-gray-400">Vérifiez votre identité pour débloquer toutes les fonctionnalités</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-blue-400" />
            </div>
          </button>

          {/* Main Balance Card - Premium Design */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-black shadow-2xl shadow-purple-500/10 mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[60px] rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 px-2 rounded-lg bg-black/10 text-[10px] font-black uppercase tracking-widest">
                  Total Accumulated Balance
                </div>
              </div>
              <div className="mt-4 text-5xl font-black tracking-tighter truncate">
                {isSandbox 
                  ? formatCurrency(sandboxBalance.balance, sandboxBalance.currency)
                  : formatCurrency(
                      (accounts.find(a => a.type === 'WALLET')?.balance || 0) +
                      (accounts.find(a => a.type === 'MERCHANT')?.balance || 0)
                    )
                }
              </div>
              
              {/* Account breakdown */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/10 p-4 border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Personal Wallet</p>
                  <p className="text-xl font-bold">
                    {isSandbox ? '---' : new Intl.NumberFormat('fr-FR').format(accounts.find(a => a.type === 'WALLET')?.balance || 0)} FCFA
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4 border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Business Revenue {isSandbox && '(TEST)'}</p>
                  <p className="text-xl font-bold">
                    {isSandbox 
                      ? new Intl.NumberFormat('fr-FR').format(sandboxBalance.balance)
                      : new Intl.NumberFormat('fr-FR').format(accounts.find(a => a.type === 'MERCHANT')?.balance || 0)
                    } FCFA
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 relative">
                <div className={`grid grid-cols-3 gap-3 ${merchant?.kycStatus !== 'VERIFIED' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button 
                    onClick={() => merchant?.kycStatus === 'VERIFIED' && navigate('/transfer')}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-black text-white py-4 transition hover:bg-black/80"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Envoyer</span>
                  </button>
                  <button 
                    onClick={() => navigate('/deposit')}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-semibold transition hover:bg-white/20"
                  >
                    <ArrowDownLeft className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Recharger</span>
                  </button>
                  <button 
                    onClick={() => merchant?.kycStatus === 'VERIFIED' && navigate('/withdraw')}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-black py-4 font-semibold text-white transition hover:bg-black/80"
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retrait</span>
                  </button>
                </div>

                {/* Overlay for non-verified merchants - Premium Redesign 2026 */}
                {merchant && merchant.kycStatus !== 'VERIFIED' && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-xl p-6 border border-white/5 shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-50" />
                    <div className="relative text-center">
                       <div className="mb-4 flex justify-center">
                         <div className="relative">
                           <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                           <div className="relative h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                             <ShieldAlert className="w-6 h-6 text-purple-400" />
                           </div>
                         </div>
                       </div>
                       <p className="text-white text-xs font-black uppercase tracking-[0.3em] mb-1">KYC Required</p>
                       <p className="text-gray-400 text-[9px] font-mono mb-5 uppercase tracking-wider opacity-80">Identity verification pending</p>
                       <button
                        onClick={() => navigate('/kyc')}
                        className="group/btn relative overflow-hidden rounded-full bg-white text-black px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Verify Now
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-surface border border-white/5 rounded-2xl">
              <div className="p-2.5 bg-blue-500/10 rounded-xl w-fit mb-3">
                <Receipt className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{recentAccountTransactions.length}</div>
              <div className="text-gray-500 text-sm mt-1">Transactions récentes</div>
            </div>

            <div className="p-5 bg-surface border border-white/5 rounded-2xl">
              <div className="p-2.5 bg-green-500/10 rounded-xl w-fit mb-3">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{merchant?.kycStatus || 'PENDING'}</div>
              <div className="text-gray-500 text-sm mt-1">Statut KYC</div>
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Informations rapides {isSandbox && <span className="text-orange-500 text-[10px] ml-2">(SANDBOX)</span>}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">Clé publique</span>
                <span className="text-white font-mono text-xs">{(isSandbox ? merchant?.testPublicKey : merchant?.publicKey)?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">Devise par défaut</span>
                <span className="text-white">{merchant?.defaultCurrency}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">Email</span>
                <span className="text-white">{merchant?.contactEmail || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">Téléphone</span>
                <span className="text-white">{merchant?.contactPhone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Section - Timeline Design */}
          <div className="rounded-[2.5rem] border border-white/5 bg-surface/20 p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">
                  Flux Business Recents
                </h3>
                <p className="text-[10px] font-mono text-purple-500/60 uppercase">Dernières transactions</p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111] bg-purple-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-purple-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {recentAccountTransactions.length > 0 ? (
                recentAccountTransactions.map((tx) => (
                  <div key={tx.reference} className="relative pl-8 group cursor-pointer" onClick={() => setSelectedTxRef(tx.reference)}>
                    {/* Timeline Line */}
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-white/5 group-last:hidden" />
                    
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-surface/50 border border-white/10 flex items-center justify-center z-10 group-hover:border-purple-500/50 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full ${tx.direction === 'IN' ? 'bg-green-500' : 'bg-purple-500'} animate-pulse`} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1 group-hover:text-purple-400 transition-colors truncate max-w-[150px] sm:max-w-none">
                          {tx.type}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          <ClockIcon className="w-3 h-3" />
                          {format(new Date(tx.createdAt), 'dd MMM, HH:mm')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-black ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                          {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-purple-500/40' : 'text-yellow-500/40'}`}>
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Aucune transaction</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('TRANSACTIONS')}
              className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              Historique Complet
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          {/* Public Key */}
          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">Clé Publique ({isSandbox ? 'SANDBOX' : 'LIVE'})</h3>
                <p className="text-gray-600 text-xs">Utilisable côté client</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {isSandbox ? merchant?.testPublicKey : merchant?.publicKey}
              </code>
              <button
                onClick={() => handleCopy((isSandbox ? merchant?.testPublicKey : merchant?.publicKey) || '', 'public')}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-primary transition-colors"
              >
                {copiedKey === 'public' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">Clé Secrète ({isSandbox ? 'SANDBOX' : 'LIVE'})</h3>
                <p className="text-gray-600 text-xs">À garder côté serveur uniquement</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {showSecret 
                  ? (isSandbox ? merchant?.testSecretKey : merchant?.secretKey) 
                  : maskKey((isSandbox ? merchant?.testSecretKey : merchant?.secretKey) || '')}
              </code>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy((isSandbox ? merchant?.testSecretKey : merchant?.secretKey) || '', 'secret')}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-primary transition-colors"
              >
                {copiedKey === 'secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Rotate Keys */}
          <div className="bg-surface border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Régénérer les clés</h3>
                <p className="text-gray-600 text-xs">Les anciennes clés seront invalides immédiatement</p>
              </div>
              <button
                onClick={handleRotateKeys}
                disabled={rotating}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:border-primary/30 outline-none"
              />
            </div>
            <select
              value={txStatus}
              onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}
              className="px-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Complétées</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>

          {/* Transactions List */}
          <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-600">
                <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Aucune transaction pour le moment
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx: any) => (
                  <div 
                    key={tx.reference} 
                    onClick={() => setSelectedTxRef(tx.reference)}
                    className="px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.direction === 'IN' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{tx.type}</div>
                          <div className="text-gray-600 text-xs font-mono">{tx.reference}</div>
                          {tx.description && <div className="text-gray-500 text-xs">{tx.description}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          tx.direction === 'IN' ? 'text-green-500' : 'text-white'
                        }`}>
                          {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                        <div className="text-gray-600 text-xs">{formatDate(tx.createdAt)}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                          tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : 
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {tx.status === 'COMPLETED' ? 'Complété' : tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {txMeta && txMeta.lastPage > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                disabled={txPage === 1}
                className="px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-gray-500 text-sm">
                Page {txPage} sur {txMeta.lastPage}
              </span>
              <button
                onClick={() => setTxPage(p => Math.min(txMeta.lastPage, p + 1))}
                disabled={txPage === txMeta.lastPage}
                className="px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'WEBHOOKS' && (
        <div className="space-y-4">
          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <h3 className="font-medium text-white mb-3">URL du Webhook</h3>
            <p className="text-gray-600 text-xs mb-3">Configurez cette URL dans les paramètres pour recevoir les notifications</p>
            <code className="block bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
              {merchant?.webhookUrl || 'Non configuré'}
            </code>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">Secret de signature ({isSandbox ? 'SANDBOX' : 'LIVE'})</h3>
                <p className="text-gray-600 text-xs">Utilisez ce secret pour vérifier les signatures</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {showWebhookSecret 
                  ? (isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) 
                  : maskKey((isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) || '')}
              </code>
              <button
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy((isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) || '', 'webhook')}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-primary transition-colors"
              >
                {copiedKey === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <h3 className="font-medium text-white mb-3">Événements</h3>
            <div className="space-y-2">
              {['checkout.completed', 'checkout.cancelled'].map(event => (
                <div key={event} className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <code className="text-gray-300 text-sm">{event}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Paramètres enregistrés
            </div>
          )}

          <div className="bg-surface border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="font-medium text-white">Informations de l'entreprise</h3>
            
            <div>
              <label className="block text-gray-500 text-xs mb-1">Nom de l'entreprise</label>
              <input
                type="text"
                value={settingsForm.businessName}
                onChange={(e) => setSettingsForm(f => ({ ...f, businessName: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs mb-1">Email de contact</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm(f => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={settingsForm.contactPhone}
                  onChange={(e) => setSettingsForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-1">Site web</label>
              <input
                type="url"
                value={settingsForm.websiteUrl}
                onChange={(e) => setSettingsForm(f => ({ ...f, websiteUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-1">URL Webhook</label>
              <input
                type="url"
                value={settingsForm.webhookUrl}
                onChange={(e) => setSettingsForm(f => ({ ...f, webhookUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
                placeholder="https://votre-site.com/webhook"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-1">Devise par défaut</label>
              <select
                value={settingsForm.defaultCurrency}
                onChange={(e) => setSettingsForm(f => ({ ...f, defaultCurrency: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-white text-sm focus:border-primary/30 outline-none"
              >
                <option value="XAF">XAF - Franc CFA</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar US</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>

        {/* --- MOBILE VIEW --- */}
        {isMobile && (
          <MerchantPortalMobile 
            merchant={merchant}
            transactions={transactions}
            accounts={accounts as MerchantAccount[]}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSandbox={isSandbox}
            setIsSandbox={setIsSandbox}
            loading={loading}
            handleRefresh={handleRefresh}
            handleLogout={logout}
            setSelectedTxRef={setSelectedTxRef}
            showSecret={showSecret}
            setShowSecret={setShowSecret}
            showWebhookSecret={showWebhookSecret}
            setShowWebhookSecret={setShowWebhookSecret}
            copiedKey={copiedKey}
            handleCopy={handleCopy}
            handleRotateKeys={handleRotateKeys}
            rotating={rotating}
            txPage={txPage}
            setTxPage={setTxPage}
            txMeta={txMeta}
            txStatus={txStatus}
            setTxStatus={setTxStatus}
            txSearch={txSearch}
            setTxSearch={setTxSearch}
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            saving={saving}
            saveSuccess={saveSuccess}
            sandboxBalance={sandboxBalance}
          />
        )}
      {/* Transaction Detail Modal */}
      {selectedTxRef && (
        <TransactionModal 
          reference={selectedTxRef} 
          onClose={() => setSelectedTxRef(null)}
          onCancellationRequested={handleRefresh}
        />
      )}
      </div>
    </div>
  );
}

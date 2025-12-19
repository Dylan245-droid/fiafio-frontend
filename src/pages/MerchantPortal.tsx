import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  LayoutDashboard, Key, Receipt, Webhook, Settings, ArrowLeft,
  Wallet, RefreshCcw, Copy, Check, Eye, EyeOff,
  RotateCcw, Search, Save
} from 'lucide-react';

type Tab = 'DASHBOARD' | 'API_KEYS' | 'TRANSACTIONS' | 'WEBHOOKS' | 'SETTINGS';

interface MerchantData {
  id: number;
  businessName: string;
  publicKey: string;
  secretKey?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  isTestMode: boolean;
  defaultCurrency: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  kycStatus: string;
}

interface Transaction {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: string;
  description: string;
  customerEmail?: string;
  createdAt: string;
  paidAt?: string;
}

export default function MerchantPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    fetchMerchantData();
  }, []);

  useEffect(() => {
    if (activeTab === 'TRANSACTIONS') {
      fetchTransactions();
    }
  }, [activeTab, txPage, txStatus]);

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

      const balanceRes = await api.get('/merchant/balance');
      if (balanceRes.data) {
        setBalance(balanceRes.data.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({ page: txPage.toString(), limit: '10' });
      if (txStatus !== 'all') params.append('status', txStatus);
      
      const res = await api.get(`/merchant/transactions?${params}`);
      if (res.data) {
        setTransactions(res.data.data || []);
        setTxMeta(res.data.meta);
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
      const res = await api.post('/merchant/rotate-keys');
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
    { key: 'DASHBOARD' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'API_KEYS' as Tab, label: 'Clés API', icon: Key },
    { key: 'TRANSACTIONS' as Tab, label: 'Transactions', icon: Receipt },
    { key: 'WEBHOOKS' as Tab, label: 'Webhooks', icon: Webhook },
    { key: 'SETTINGS' as Tab, label: 'Paramètres', icon: Settings },
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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-surface border border-white/10 text-gray-400 hover:text-white hover:border-primary/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{merchant?.businessName || 'Portail Marchand'}</h1>
            <p className="text-gray-500 text-sm">Gestion de votre compte marchand Fiafio</p>
          </div>
        </div>
        <button
          onClick={fetchMerchantData}
          className="p-2.5 bg-surface border border-white/10 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-black'
                : 'bg-surface text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl">
              <div className="p-2.5 bg-primary/20 rounded-xl w-fit mb-3">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-white">{formatCurrency(balance)}</div>
              <div className="text-gray-500 text-sm mt-1">Solde disponible</div>
            </div>

            <div className="p-5 bg-surface border border-white/5 rounded-2xl">
              <div className="p-2.5 bg-blue-500/10 rounded-xl w-fit mb-3">
                <Receipt className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{txMeta?.total || 0}</div>
              <div className="text-gray-500 text-sm mt-1">Total transactions</div>
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
            <h3 className="font-semibold text-white mb-4">Informations rapides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">Clé publique</span>
                <span className="text-white font-mono text-xs">{merchant?.publicKey?.substring(0, 20)}...</span>
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
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          {/* Public Key */}
          <div className="bg-surface border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">Clé Publique</h3>
                <p className="text-gray-600 text-xs">Utilisable côté client</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {merchant?.publicKey}
              </code>
              <button
                onClick={() => handleCopy(merchant?.publicKey || '', 'public')}
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
                <h3 className="font-medium text-white">Clé Secrète</h3>
                <p className="text-gray-600 text-xs">À garder côté serveur uniquement</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {showSecret ? merchant?.secretKey : maskKey(merchant?.secretKey || '')}
              </code>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy(merchant?.secretKey || '', 'secret')}
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
                Aucune transaction pour le moment
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <div key={tx.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">{tx.description || 'Paiement'}</div>
                        <div className="text-gray-600 text-xs font-mono">{tx.id}</div>
                        {tx.customerEmail && <div className="text-gray-500 text-xs">{tx.customerEmail}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-medium">+{formatCurrency(tx.netAmount || tx.amount)}</div>
                        <div className="text-gray-600 text-xs">{formatDate(tx.createdAt)}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          tx.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                          tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {tx.status}
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
                <h3 className="font-medium text-white">Secret de signature</h3>
                <p className="text-gray-600 text-xs">Utilisez ce secret pour vérifier les signatures</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-4 py-3 rounded-xl text-primary font-mono text-sm overflow-x-auto">
                {showWebhookSecret ? merchant?.webhookSecret : maskKey(merchant?.webhookSecret || '')}
              </code>
              <button
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="p-3 bg-background rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy(merchant?.webhookSecret || '', 'webhook')}
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
  );
}

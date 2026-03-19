import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  LayoutDashboard, Key, Receipt, Webhook, Settings,
  Wallet, RefreshCcw, Copy, Check, Eye, EyeOff,
  RotateCcw, Search, Save, ArrowDownLeft, ArrowUpRight, LogOut
} from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import BottomNav from '../../../components/BottomNav';
import type { MerchantData, MerchantTransaction, MerchantTab, MerchantAccount } from '../../MerchantPortalTypes';

interface MerchantPortalMobileProps {
  merchant: MerchantData | null;
  transactions: MerchantTransaction[];
  accounts: MerchantAccount[];
  activeTab: MerchantTab;
  setActiveTab: (tab: MerchantTab) => void;
  isSandbox: boolean;
  setIsSandbox: (val: boolean) => void;
  loading: boolean;
  handleRefresh: () => void;
  handleLogout: () => void;
  setSelectedTxRef: (ref: string) => void;
  // API Keys
  showSecret: boolean;
  setShowSecret: (val: boolean) => void;
  showWebhookSecret: boolean;
  setShowWebhookSecret: (val: boolean) => void;
  copiedKey: string | null;
  handleCopy: (text: string, key: string) => void;
  handleRotateKeys: () => void;
  rotating: boolean;
  // Transactions
  txPage: number;
  setTxPage: (val: number | ((p: number) => number)) => void;
  txMeta: any;
  txStatus: string;
  setTxStatus: (val: string) => void;
  txSearch: string;
  setTxSearch: (val: string) => void;
  // Settings
  settingsForm: any;
  setSettingsForm: (val: any) => void;
  handleSaveSettings: () => void;
  saving: boolean;
  saveSuccess: boolean;
  sandboxBalance: { balance: number, currency: string };
}

const formatCurrency = (amount: number, currency: string = 'XAF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const maskKey = (key: string) => key ? `${key.substring(0, 12)}${'•'.repeat(20)}` : '';

export default function MerchantPortalMobile({
  merchant, transactions, accounts, activeTab, setActiveTab,
  isSandbox, setIsSandbox, loading, handleRefresh, handleLogout,
  setSelectedTxRef, showSecret, setShowSecret, showWebhookSecret,
  setShowWebhookSecret, copiedKey, handleCopy, handleRotateKeys,
  rotating, txPage, setTxPage, txMeta, txStatus, setTxStatus,
  txSearch, setTxSearch, settingsForm, setSettingsForm,
  handleSaveSettings, saving, saveSuccess, sandboxBalance
}: MerchantPortalMobileProps) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'DASHBOARD', label: 'Home', icon: LayoutDashboard },
    { id: 'TRANSACTIONS', label: 'Flux', icon: Receipt },
    { id: 'API_KEYS', label: 'Clés', icon: Key },
    { id: 'WEBHOOKS', label: 'Hooks', icon: Webhook },
    { id: 'SETTINGS', label: 'Profil', icon: Settings },
  ];

  const merchantBalance = Number(accounts.find(a => a.type === 'MERCHANT')?.balance || 0);

  return (
    <>
      <div className="block md:hidden pb-24 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <LayoutDashboard className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 truncate">
              <h1 className="text-lg font-black uppercase tracking-tighter text-white truncate max-w-[150px]">
                {merchant?.businessName || 'Business'}
              </h1>
              <div className="flex items-center gap-1.5" onClick={() => setIsSandbox(!isSandbox)}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isSandbox ? 'bg-orange-500 animate-pulse' : 'bg-purple-500'}`} />
                 <span className={`text-[9px] font-black uppercase tracking-widest ${isSandbox ? 'text-orange-500' : 'text-purple-400'}`}>
                   {isSandbox ? 'Sandbox' : 'Live'}
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-2 text-gray-400 rounded-lg bg-surface/50 border border-white/5">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'DASHBOARD' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            
            {/* KYC Banner */}
            {merchant?.kycStatus !== 'VERIFIED' && (
              <button
                onClick={() => navigate('/kyc')}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-4 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-lg">🛡️</div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-400 text-sm">Vérification KYC</p>
                    <p className="text-[10px] text-gray-400 font-medium">Débloquez vos fonctionnalités business</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-purple-400" />
                </div>
              </button>
            )}

            {/* Main Balance Card */}
            <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 text-black relative shadow-lg">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-[40px] rounded-full" />
               <div className="relative z-10">
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Business Revenue</div>
                 <div className="text-3xl font-black tracking-tighter mb-4 truncate italic">
                    {isSandbox 
                      ? formatCurrency(Number(sandboxBalance.balance), sandboxBalance.currency)
                      : formatCurrency(Number(merchantBalance))
                    }
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="flex flex-col gap-1 w-full relative group">
                      <p className="text-[9px] text-center font-black uppercase tracking-widest text-black/60 px-2 leading-tight">
                        Contactez un agent pour recharger
                      </p>
                      <button 
                        disabled
                        className="w-full flex flex-col items-center justify-center gap-1 rounded-xl bg-black/5 py-3 opacity-40 transition-all border border-white/5"
                      >
                        <ArrowDownLeft className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#EEF2FF]/60">Recharger</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => merchant?.kycStatus === 'VERIFIED' && navigate('/withdraw')}
                      disabled={merchant?.kycStatus !== 'VERIFIED'}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl bg-black/10 py-3 disabled:opacity-30"
                    >
                       <Wallet className="h-4 w-4" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Retrait</span>
                    </button>
                 </div>
               </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-surface/20 border border-white/5 rounded-2xl">
                  <Receipt className="w-4 h-4 text-blue-400 mb-2" />
                  <div className="text-lg font-bold text-white">{transactions.length}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">Activités</div>
               </div>
               <div className="p-4 bg-surface/20 border border-white/5 rounded-2xl" onClick={() => setIsSandbox(!isSandbox)}>
                  <div className={`w-2 h-2 rounded-full mb-2 ${isSandbox ? 'bg-orange-500' : 'bg-green-500'}`} />
                  <div className="text-lg font-bold text-white truncate">{isSandbox ? 'SANDBOX' : 'LIVE'}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">Environnement</div>
               </div>
            </div>

            {/* Recent History Mini-list */}
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Activité Récente</span>
                  <button onClick={() => setActiveTab('TRANSACTIONS')} className="text-[9px] font-black uppercase tracking-widest text-purple-400">Voir tout</button>
               </div>
               <div className="space-y-2">
                 {transactions.slice(0, 3).map(tx => (
                    <div key={tx.id} onClick={() => setSelectedTxRef(tx.reference || tx.id)} className="p-4 rounded-2xl bg-surface/10 border border-white/5 flex items-center justify-between active:bg-surface/20">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-purple-500/10 text-purple-500'}`}>
                             {tx.direction === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-white truncate max-w-[100px]">{tx.type || 'Paiement'}</p>
                             <p className="text-[8px] font-mono text-gray-500">{format(new Date(tx.createdAt), 'dd/MM, HH:mm')}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-white">{formatCurrency(tx.amount)}</p>
                          <p className="text-[7px] font-black uppercase tracking-widest text-gray-600">{tx.status}</p>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
             <h2 className="text-xl font-black uppercase tracking-tighter">Journal Flux</h2>
             
             <div className="flex gap-2">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                   <input 
                      type="text" 
                      placeholder="Rechercher..." 
                      className="w-full pl-8 pr-3 py-2 text-[10px] bg-white/5 border border-white/10 rounded-xl"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                   />
                </div>
                <select 
                  className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-[10px] text-white"
                  value={txStatus}
                  onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}
                >
                   <option value="all">S-TOUS</option>
                   <option value="completed">OK</option>
                   <option value="pending">WAIT</option>
                </select>
             </div>

             <div className="space-y-3">
                {transactions.map(tx => (
                   <div key={tx.id} onClick={() => setSelectedTxRef(tx.reference || tx.id)} className="p-4 rounded-2xl bg-surface/20 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.direction === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">{tx.type}</p>
                            <p className="text-[9px] font-mono text-gray-500 truncate max-w-[80px]">{tx.reference || tx.id}</p>
                         </div>
                      </div>
                      <div className="text-right shrink-0">
                         <p className={`text-xs font-black ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                            {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                         </p>
                         <p className="text-[7px] font-black uppercase tracking-widest text-gray-700">{tx.status}</p>
                      </div>
                   </div>
                ))}

                {txMeta && txMeta.lastPage > 1 && (
                  <div className="flex items-center justify-between pt-4">
                     <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="p-2 text-gray-500 bg-white/5 rounded-lg disabled:opacity-20">PRÉC</button>
                     <span className="text-[10px] font-black text-gray-600 uppercase">Page {txPage} / {txMeta.lastPage}</span>
                     <button onClick={() => setTxPage(p => Math.min(txMeta.lastPage, p + 1))} disabled={txPage === txMeta.lastPage} className="p-2 text-gray-500 bg-white/5 rounded-lg disabled:opacity-20">SUIV</button>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* API_KEYS TAB */}
        {activeTab === 'API_KEYS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
             <h2 className="text-xl font-black uppercase tracking-tighter">Identifiants API</h2>
             
             <div className="space-y-4">
               {/* Public Key */}
               <div className="p-5 rounded-3xl bg-surface/20 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Clé Publique</span>
                     <button onClick={() => handleCopy((isSandbox ? merchant?.testPublicKey : merchant?.publicKey) || '', 'public')} className="text-purple-400">
                        {copiedKey === 'public' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                     </button>
                  </div>
                  <code className="block bg-black/50 p-3 rounded-xl text-primary font-mono text-[10px] break-all leading-relaxed">
                     {isSandbox ? merchant?.testPublicKey : merchant?.publicKey}
                  </code>
               </div>

               {/* Secret Key */}
               <div className="p-5 rounded-3xl bg-surface/20 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Clé Secrète</span>
                     <div className="flex gap-2">
                        <button onClick={() => setShowSecret(!showSecret)} className="text-gray-400">
                           {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleCopy((isSandbox ? merchant?.testSecretKey : merchant?.secretKey) || '', 'secret')} className="text-purple-400">
                           {copiedKey === 'secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>
                  <code className="block bg-black/50 p-3 rounded-xl text-red-400 font-mono text-[10px] break-all leading-relaxed">
                     {showSecret 
                        ? (isSandbox ? merchant?.testSecretKey : merchant?.secretKey) 
                        : maskKey((isSandbox ? merchant?.testSecretKey : merchant?.secretKey) || '')}
                  </code>
               </div>

               {/* Rotate Action */}
               <button onClick={handleRotateKeys} disabled={rotating} className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-500 active:bg-orange-500/20">
                  <RotateCcw className={`w-5 h-5 ${rotating ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-black uppercase tracking-widest">Régénérer les clés</span>
               </button>
             </div>
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {activeTab === 'WEBHOOKS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
             <h2 className="text-xl font-black uppercase tracking-tighter">Webhooks</h2>
             
             <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-surface/20 border border-white/5 space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">URL Destination</p>
                   <p className="text-xs font-mono text-white break-all leading-relaxed">{merchant?.webhookUrl || 'Non configuré'}</p>
                </div>

                <div className="p-5 rounded-3xl bg-surface/20 border border-white/5 space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sign Secret</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowWebhookSecret(!showWebhookSecret)} className="text-gray-400">
                           {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleCopy((isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) || '', 'webhook')} className="text-purple-400">
                           {copiedKey === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                   </div>
                   <code className="block bg-black/50 p-3 rounded-xl text-primary font-mono text-[10px] break-all">
                     {showWebhookSecret 
                        ? (isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) 
                        : maskKey((isSandbox ? merchant?.testWebhookSecret : merchant?.webhookSecret) || '')}
                   </code>
                </div>

                <div className="p-5 rounded-3xl border border-dashed border-white/5 space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Événements activés</p>
                   <div className="flex flex-wrap gap-2">
                      {['checkout.completed', 'checkout.cancelled'].map(ev => (
                        <span key={ev} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-mono text-gray-400">{ev}</span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
             <h2 className="text-xl font-black uppercase tracking-tighter">Paramètres</h2>
             
             {saveSuccess && (
               <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Check className="w-4 h-4" /> Success! Business Info Updated.
               </div>
             )}

             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Business Name</label>
                   <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm"
                      value={settingsForm.businessName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Public Email</label>
                   <input 
                      type="email" 
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Webhook URL</label>
                   <input 
                      type="url" 
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm"
                      value={settingsForm.webhookUrl}
                      placeholder="https://votre-site.com/webhook"
                      onChange={(e) => setSettingsForm({ ...settingsForm, webhookUrl: e.target.value })}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Devise</label>
                   <select 
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white"
                      value={settingsForm.defaultCurrency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                   >
                      <option value="XAF">XAF - Franc CFA</option>
                      <option value="EUR">EUR - Euro</option>
                   </select>
                </div>

                <button onClick={handleSaveSettings} disabled={saving} className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-primary text-black active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4">
                   <Save className="w-5 h-5" />
                   <span className="text-xs font-black uppercase tracking-widest">{saving ? '...' : 'Enregistrer les modifications'}</span>
                </button>

                <button onClick={() => { handleLogout(); navigate('/login'); }} className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-500 mt-2">
                   <LogOut className="w-5 h-5" />
                   <span className="text-xs font-black uppercase tracking-widest">Se déconnecter</span>
                </button>
             </div>
          </div>
        )}

      </div>

      {/* Bottom Nav */}
      <BottomNav 
        activeId={activeTab} 
        onChange={(id: any) => setActiveTab(id)} 
        items={navItems}
      />
    </>
  );
}

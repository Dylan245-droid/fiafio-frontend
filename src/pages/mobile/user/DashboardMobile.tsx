import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  User, RefreshCcw, ArrowUpRight, ArrowDownLeft, Wallet, 
  History as HistoryIcon, LogOut, Clock,
  ShieldCheck, LayoutDashboard, Receipt, UserCircle, Send
} from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import BottomNav from '../../../components/BottomNav';
import PaymentRequestsCard from '../../../components/PaymentRequestsCard';
import MandateRequestsCard from '../../../components/MandateRequestsCard';
import type { Account, KycLimits, Transaction, MobileTab } from '../../DashboardTypes';

interface DashboardMobileProps {
  user: any;
  accounts: Account[];
  transactions: Transaction[];
  kycLimits: KycLimits | null;
  totalBalance: number;
  loading: boolean;
  handleRefresh: () => void;
  handleLogout: () => void;
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  setSelectedTxRef: (ref: string) => void;
  withdrawalRequests: any[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
};

export default function DashboardMobile({
  user, accounts, transactions, kycLimits, totalBalance, loading,
  handleRefresh, handleLogout, activeTab, setActiveTab, setSelectedTxRef,
  withdrawalRequests
}: DashboardMobileProps) {
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'HOME', label: 'Accueil', icon: LayoutDashboard },
    { id: 'TRANSFER', label: 'Transfert', icon: Send },
    { id: 'HISTORY', label: 'Historique', icon: Receipt },
    { id: 'PROFILE', label: 'Compte', icon: UserCircle },
  ];

  const wallet = accounts.find((a) => a.type === 'WALLET') || { balance: 0 };
  const merchantAccount = accounts.find((a) => a.type === 'MERCHANT');

  return (
    <>
      <div className="block md:hidden pb-24 space-y-4">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter text-white">
                {user?.fullName?.split(' ')[0]}
                {user?.uniqueId && (
                  <span className="ml-2 bg-primary/20 px-2 py-0.5 rounded text-[8px] font-mono text-primary align-middle">
                    {user.uniqueId}
                  </span>
                )}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                {user?.role === 'AGENT' ? 'Agent' : 'Utilisateur'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="p-2 text-gray-400 rounded-lg bg-surface/50 border border-white/5">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* HOME TAB */}
        {activeTab === 'HOME' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            
            {/* Mandate & Payment Requests */}
            <MandateRequestsCard onMandateHandled={handleRefresh} />
            <PaymentRequestsCard onRequestHandled={handleRefresh} />

            {/* KYC Banner */}
            {kycLimits?.kycLevel === 0 && user?.role === 'CLIENT' && (
              <button
                onClick={() => navigate('/kyc')}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-4 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-400 text-sm">Vérification requise</p>
                    <p className="text-[10px] text-gray-400">Vérifiez votre identité pour continuer</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                </div>
              </button>
            )}

            {/* Solde Card */}
            <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-5 text-black relative shadow-lg">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Disponible</div>
              <div className="text-3xl font-black tracking-tighter mb-4 truncate italic">
                {formatCurrency(totalBalance)}
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
                  onClick={() => kycLimits && kycLimits.perTransaction > 0 && navigate('/withdraw')}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-black/10 py-3 transition"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Retrait</span>
                </button>
              </div>
            </div>

            {/* Account Breakdown for Agents/Merchants */}
            {(user?.role === 'AGENT' || merchantAccount) && (
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-surface/20 p-4 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Mon Portefeuille</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(wallet.balance)}</p>
                </div>
                {merchantAccount && (
                  <div className="rounded-2xl bg-surface/20 p-4 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Business Revenue</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(merchantAccount.balance)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pending Requests */}
            {withdrawalRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <div 
                className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between active:bg-orange-500/20"
                onClick={() => setActiveTab('HISTORY')}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-bold">Retraits en attente</span>
                </div>
                <span className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-black border-2 border-orange-500/50">
                  {withdrawalRequests.filter(r => r.status === 'PENDING').length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* TRANSFER TAB */}
        {activeTab === 'TRANSFER' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tighter">Transfert & Envoi</h2>
            
            {kycLimits?.kycLevel === 0 && user?.role === 'CLIENT' ? (
              <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-white mb-1">KYC Requis</h4>
                  <p className="text-[10px] leading-relaxed text-gray-400 font-medium italic">
                    L'envoi d'argent est verrouillé jusqu'à la vérification de votre identité.
                  </p>
                  <button onClick={() => navigate('/kyc')} className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary">Vérifier maintenant</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => navigate('/transfer')}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0">
                    <Send className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block text-white">Envoyer de l'argent</span>
                    <span className="text-[10px] text-gray-500 font-medium">À un autre utilisateur instantanément</span>
                  </div>
                </button>
                
                <div className="p-6 rounded-[2rem] bg-surface/20 border border-white/5 border-dashed text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Plus d'options bientôt</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black uppercase tracking-tighter">Historique</h3>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.reference} 
                  className="p-4 rounded-3xl bg-surface/20 border border-white/5 flex items-center justify-between active:scale-[0.98] transition-all" 
                  onClick={() => setSelectedTxRef(tx.reference)}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                        {tx.direction === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                     </div>
                     <div>
                        <p className="text-sm font-bold max-w-[120px] truncate">{tx.type}</p>
                        <p className="text-[9px] font-mono text-gray-500 uppercase">{format(new Date(tx.createdAt), 'dd/MM, HH:mm', { locale: fr })}</p>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                     <p className={`text-sm font-black ${tx.direction === 'IN' ? 'text-green-500' : 'text-white'}`}>
                        {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                     </p>
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{tx.status}</p>
                  </div>
                </div>
              ))}
              
              {transactions.length === 0 && (
                <div className="py-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <HistoryIcon className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Aucune transaction</p>
                </div>
              )}
              
              <button 
                onClick={() => navigate('/transactions')}
                className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500"
              >
                Voir tout l'historique
              </button>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'PROFILE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
             <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Mon Compte</h2>
             
             <div className="p-6 rounded-[2rem] bg-gradient-to-br from-surface to-black border border-white/5 flex items-center gap-4 mb-2">
                <div className="relative shrink-0">
                   <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                   <div className="relative h-14 w-14 rounded-2xl bg-surface border border-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                   </div>
                </div>
                <div className="flex-1 truncate">
                  <h3 className="text-base font-black uppercase tracking-tighter truncate">{user?.fullName}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1 opacity-80 truncate">{user?.phone}</p>
                </div>
             </div>

             {kycLimits && (
               <div className="rounded-3xl bg-surface/10 border border-white/5 p-4 space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Limites KYC</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary">Niveau {kycLimits.kycLevel}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="p-3 rounded-2xl bg-black/20">
                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-1">Transaction</p>
                     <p className="text-xs font-bold text-white">{formatCurrency(kycLimits.perTransaction)}</p>
                   </div>
                   <div className="p-3 rounded-2xl bg-black/20">
                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-1">Restant Jour</p>
                     <p className="text-xs font-bold text-primary">{formatCurrency(kycLimits.dailyRemaining)}</p>
                   </div>
                 </div>
                 <button onClick={() => navigate('/kyc')} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-xl">
                   Upgrade Limites
                 </button>
               </div>
             )}

             <button onClick={() => navigate('/kyc')} className="w-full p-4 rounded-3xl bg-surface/20 border border-white/5 flex items-center justify-between active:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-5 h-5 text-green-500" />
                   <span className="text-sm font-bold">Vérification KYC</span>
                </div>
                <ArrowDownLeft className="w-4 h-4 text-gray-600 -rotate-135" />
             </button>

             {user?.hasMerchant && (
               <button onClick={() => navigate('/merchant')} className="w-full p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between active:bg-purple-500/20 transition-all">
                  <div className="flex items-center gap-3">
                     <span className="text-lg">🏪</span>
                     <span className="text-sm font-bold text-purple-400">Dashboard Marchand</span>
                  </div>
                  <ArrowDownLeft className="w-4 h-4 text-purple-400 -rotate-135" />
               </button>
             )}

             {user?.role === 'AGENT' && (
               <button onClick={() => navigate('/agent')} className="w-full p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between active:bg-blue-500/20 transition-all">
                  <div className="flex items-center gap-3">
                     <span className="text-lg">🏦</span>
                     <span className="text-sm font-bold text-blue-400">Dashboard Agent</span>
                  </div>
                  <ArrowDownLeft className="w-4 h-4 text-blue-400 -rotate-135" />
               </button>
             )}

             <button onClick={handleLogout} className="w-full mt-4 p-4 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-500 active:bg-red-500/20 transition-all">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Déconnexion</span>
             </button>
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

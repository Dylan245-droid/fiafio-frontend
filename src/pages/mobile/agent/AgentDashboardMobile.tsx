import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, RefreshCcw, Award, CheckCircle, AlertTriangle, TrendingUp, ShieldCheck, ArrowDownLeft, Banknote, QrCode, Wallet, History, LogOut, LayoutDashboard, Receipt, UserCircle, Briefcase } from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import BottomNav from '../../../components/BottomNav';
import type { AgentStats, Transaction, View, MobileTab } from '../../AgentDashboardTypes';

interface AgentDashboardMobileProps {
  user: any;
  stats: AgentStats | null;
  floatBalance: number;
  transactions: Transaction[];
  pendingCancellations: any[];
  pendingWithdrawals: any[];
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  view: View;
  setView: (view: View) => void;
  refreshing: boolean;
  fetchData: () => Promise<void>;
  handleLogout: () => void;
  setSelectedTxRef: (ref: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
};

export default function AgentDashboardMobile({
  user, stats, floatBalance, transactions,
  activeTab, setActiveTab, setView,
  refreshing, fetchData, handleLogout, setSelectedTxRef
}: AgentDashboardMobileProps) {
  const navigate = useNavigate();
  const isMobile = true; // mobile view always considers it mobile
  const navItems = [
    { id: 'HOME', label: 'Accueil', icon: LayoutDashboard },
    { id: 'FINANCE', label: 'Finance', icon: Briefcase },
    { id: 'HISTORY', label: 'Historique', icon: Receipt },
    { id: 'PROFILE', label: 'Compte', icon: UserCircle },
  ];

  return (
    <>
              <div className="block md:hidden pb-24 space-y-4">
                
                {/* Mobile Header (Always visible) */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-black" />
                    </div>
                    <div>
                       <h1 className="text-lg font-black uppercase tracking-tighter text-white">
                        {user?.fullName?.split(' ')[0]}
                      </h1>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Niveau {stats?.level?.key || 'AGENT'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 text-gray-400 rounded-lg bg-surface/50 border border-white/5">
                      <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <ThemeToggle />
                  </div>
                </div>
      
                {/* HOME TAB */}
                {activeTab === 'HOME' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {/* Alertes de statut */}
                    {stats?.activation?.status === 'PENDING_FLOAT' && (
                      <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <h3 className="text-base font-bold text-yellow-400">Activation requise</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">1</div>
                            <p className="flex-1 font-medium text-white text-xs">Vérification KYC</p>
                            {(stats?.kycLevel ?? 0) < 2 ? (
                              <button onClick={() => navigate('/kyc')} className="rounded-md bg-blue-500/20 px-2 py-1 text-[10px] font-medium text-blue-400">Vérifier</button>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">2</div>
                            <p className="flex-1 font-medium text-white text-xs">Dépôt Float initial</p>
                            <button onClick={() => setView('ACTIVATE')} className="rounded-md bg-yellow-500/20 px-2 py-1 text-[10px] font-medium text-yellow-400">Déposer</button>
                          </div>
                        </div>
                      </div>
                    )}
      
                    {stats?.activation?.status === 'SUSPENDED' && (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                          <p className="font-bold text-red-400">Compte suspendu</p>
                          <p className="text-xs text-red-300">Veuillez contacter le support.</p>
                        </div>
                      </div>
                    )}
      
                    {/* Solde Card (Mobile friendly size) */}
                    <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-5 text-black relative shadow-lg">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Solde Float</div>
                      <div className="text-3xl font-black tracking-tighter mb-4 truncate">
                        {formatCurrency(floatBalance)}
                      </div>
                      <button
                        type="button"
                        onClick={() => stats?.activation?.status === 'ACTIVE' && navigate('/float-request')}
                        disabled={stats?.activation?.status !== 'ACTIVE'}
                        className="w-full rounded-xl bg-black text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-black/80 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        ⚡ Recharger Float
                      </button>
                    </div>
      
                    {/* Volume Joueur Info */}
                    <div className="rounded-3xl border border-white/5 bg-surface/20 p-5">
                       <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                             <TrendingUp className="h-4 w-4 text-blue-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Volume Quotidien</span>
                          </div>
                          <span className="text-xs font-mono text-gray-500">{stats?.limits.percentage}%</span>
                       </div>
                       <div className="text-2xl font-black mb-1">{formatCurrency(stats?.limits.todayUsed || 0)}</div>
                       
                       {stats?.level.nextLevel && stats?.level.nextLevelLimit && (
                         <p className="text-[10px] font-mono text-primary/60 uppercase mb-3">
                            Limite Prochain Niveau ({stats.level.nextLevel}) : {formatCurrency(stats.level.nextLevelLimit)}
                         </p>
                       )}

                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats?.limits.percentage}%` }} />
                       </div>
                    </div>
                  </div>
                )}
      
                {/* FINANCE TAB */}
                {activeTab === 'FINANCE' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Opérations Finance</h2>
                    
                    {/* Restrictions */}
                    {stats?.activation?.status !== 'ACTIVE' && (
                      <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                        <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-tight text-white mb-1">Action requise</h4>
                          <p className="text-[10px] leading-relaxed text-gray-400 font-medium italic">
                            Les opérations financières sont verrouillées jusqu'à l'activation complète (Niveau KYC & Dépôt initial).
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`grid grid-cols-2 gap-3 ${stats?.activation?.status !== 'ACTIVE' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                         <button onClick={() => setView('DEPOSIT')} className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20">
                            <div className="h-10 w-10 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg">
                               <ArrowDownLeft className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Dépôt Client</span>
                         </button>
                         <button onClick={() => setView('WITHDRAW')} className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20">
                            <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
                               <Banknote className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Retrait Client</span>
                         </button>
                         <button onClick={() => setView('MY_QR')} className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-primary/10 border border-primary/20 hover:bg-primary/20">
                            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                               <QrCode className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Mon QR</span>
                         </button>
                         <button onClick={() => navigate('/float-request')} className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-surface/50 border border-white/5 hover:bg-surface">
                            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                               <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center mt-auto">Recharger<br/>Float</span>
                         </button>
                    </div>
                  </div>
                )}
      
                {/* HISTORY TAB */}
                {activeTab === 'HISTORY' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Historique</h3>
                      <button onClick={() => navigate('/transactions')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Voir tout</button>
                    </div>
      
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.reference} className="p-4 rounded-3xl bg-surface/20 border border-white/5 flex items-center justify-between active:scale-[0.98] transition-all" onClick={() => setSelectedTxRef(tx.reference)}>
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                {tx.direction === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
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
                          <History className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-50" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Aucune transaction</p>
                        </div>
                      )}
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
                          {stats?.activation?.status === 'ACTIVE' ? (
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1 opacity-80 truncate">{user?.phone}</p>
                          ) : (
                             <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1 italic opacity-80">Non activé</p>
                          )}
                        </div>
                     </div>
      
                     <button onClick={() => navigate('/kyc')} className="w-full p-4 rounded-3xl bg-surface/20 border border-white/5 flex items-center justify-between active:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-5 h-5 text-green-500" />
                           <span className="text-sm font-bold">Vérification KYC</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Niveau {user?.kycLevel || 0}</span>
                           <ArrowDownLeft className="w-4 h-4 text-gray-600 -rotate-135" />
                        </div>
                     </button>
      
                     <button onClick={() => navigate('/agent-commissions')} className="w-full p-4 rounded-3xl bg-surface/20 border border-white/5 flex items-center justify-between active:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                           <TrendingUp className="w-5 h-5 text-blue-400" />
                           <span className="text-sm font-bold">Commissions & Gains</span>
                        </div>
                        <ArrowDownLeft className="w-4 h-4 text-gray-600 -rotate-135" />
                     </button>
                     
                     <button onClick={handleLogout} className="w-full mt-4 p-4 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-500 active:bg-red-500/20 transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Déconnexion</span>
                     </button>
                  </div>
                )}
      
              </div>
            {/* Bottom Nav Component (Mobile Only) */}
            {isMobile && (
              <BottomNav 
                activeId={activeTab} 
                onChange={(id) => setActiveTab(id)} 
                items={navItems}
              />
            )}
    </>
  );
}

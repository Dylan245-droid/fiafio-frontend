import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Banknote, Delete, AlertTriangle, Clock, Copy, Search, User } from 'lucide-react';
import api from '../services/api';

type Step = 'AGENT' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

interface Agent {
  id: number;
  phone: string;
  uniqueId: string;
  fullName: string | null;
}

const FEE_PERCENTAGE = 0.02; // 2% fee

export default function WithdrawPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('AGENT');
  const [agentQuery, setAgentQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [amount, setAmount] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [requestRef, setRequestRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [accounts, setAccounts] = useState<{type: string, balance: number}[]>([]);
  const [selectedAccountType, setSelectedAccountType] = useState<'WALLET' | 'MERCHANT'>('WALLET');

  const fee = Math.round(Number(amount) * FEE_PERCENTAGE);
  const total = Number(amount) + fee;

  // Load recent agents from past transactions
  useEffect(() => {
    const loadRecentAgents = async () => {
      try {
        const res = await api.get('/accounts/history?limit=20');
        const txs = res.data.transactions || [];
        // Extract unique agents from past withdrawals
        const agentMap = new Map<number, Agent>();
        txs.forEach((tx: any) => {
          if (tx.type === 'WITHDRAWAL' && tx.agent) {
            agentMap.set(tx.agent.id, {
              id: tx.agent.id,
              phone: tx.agent.phone || '',
              uniqueId: tx.agent.uniqueId || '',
              fullName: tx.agent.fullName,
            });
          }
        });
        setRecentAgents(Array.from(agentMap.values()).slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent agents', e);
      }
    };

    // Load user accounts
    const loadAccounts = async () => {
      try {
        const res = await api.get('/accounts/balance');
        setAccounts(res.data.accounts || []);
      } catch (e) {
        console.error('Failed to load accounts', e);
      }
    };

    loadRecentAgents();
    loadAccounts();
  }, []);

  // Autocomplete agent search
  useEffect(() => {
    if (agentQuery.length >= 2 && !selectedAgent) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/float-requests/agents?query=${agentQuery}`);
          const foundAgents = res.data.agents || [];
          setAgents(foundAgents);
          
          // Auto-select if exact uniqueId match
          const exactMatch = foundAgents.find(
            (a: Agent) => a.uniqueId?.toUpperCase() === agentQuery.toUpperCase()
          );
          if (exactMatch) {
            setSelectedAgent(exactMatch);
            setAgents([]);
          }
        } catch (e) {
          console.error('Agent search failed', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAgents([]);
    }
  }, [agentQuery, selectedAgent]);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentQuery(agent.fullName || agent.uniqueId);
    setAgents([]);
    setStep('AMOUNT');
  };

  const handleCreateRequest = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/withdrawal-requests', {
        agentId: selectedAgent?.id,
        amount: Number(amount),
        message: `Demande de retrait de ${Number(amount).toLocaleString('fr-FR')} FCFA`,
        accountType: selectedAccountType
      });
      setConfirmationCode(res.data.request.confirmationCode);
      setRequestRef(res.data.request.reference);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      setAmount(prev => prev + val);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(confirmationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (n: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  const renderStep = () => {
    switch (step) {
      case 'AGENT':
        return (
          <div className="flex flex-col items-center py-6">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
              <Banknote className="h-8 w-8 text-orange-500" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-white">Retrait (Cash-Out)</h1>
            <p className="mb-6 text-sm text-gray-400">Sélectionner un agent pour créer une demande</p>

            {/* Search Input */}
            <div className="w-full relative mb-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou ID"
                value={agentQuery}
                onChange={(e) => {
                  setAgentQuery(e.target.value);
                  setSelectedAgent(null);
                }}
                className="w-full rounded-2xl border border-white/5 bg-surface py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-orange-500/50"
              />
              
              {/* Autocomplete dropdown */}
              {agents.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/10 bg-surface shadow-lg">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelectAgent(agent)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">{agent.fullName || 'Agent'}</p>
                        <p className="text-xs text-gray-500">{agent.uniqueId} • {agent.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Agents */}
            {recentAgents.length > 0 && !selectedAgent && (
              <div className="w-full">
                <p className="mb-2 text-xs text-gray-500">Agents récents</p>
                <div className="flex flex-wrap gap-2">
                  {recentAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelectAgent(agent)}
                      className="rounded-xl border border-white/10 bg-surface/50 px-3 py-2 text-sm text-white hover:bg-surface"
                    >
                      <span className="font-mono text-orange-400">{agent.uniqueId}</span>
                      <span className="ml-2 text-gray-400">{agent.fullName?.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Agent Card */}
            {selectedAgent && (
              <div className="w-full mt-4">
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedAgent.fullName || 'Agent'}</p>
                      <p className="text-sm text-gray-400">{selectedAgent.uniqueId} • {selectedAgent.phone}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('AMOUNT')}
                  className="mt-4 w-full rounded-2xl bg-orange-500 py-4 font-bold text-black transition-transform hover:scale-[1.02]"
                >
                  Continuer
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 w-full rounded-xl bg-red-500/10 p-4 text-center text-red-500">
                {error}
              </div>
            )}
          </div>
        );

      case 'AMOUNT':
        return (
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 rounded-2xl border border-white/5 bg-surface/50 px-6 py-4 text-center">
              <p className="text-xs text-gray-400">Agent sélectionné</p>
              <p className="font-bold text-white">{selectedAgent?.fullName || 'Agent'}</p>
              <p className="font-mono text-xs text-gray-500">{selectedAgent?.uniqueId}</p>
            </div>

            {/* Account Selection (only for merchants with MERCHANT account) */}
            {accounts.some(a => a.type === 'MERCHANT') && (
              <div className="w-full mb-4">
                <p className="text-xs text-gray-400 mb-2 text-center">Retirer depuis</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAccountType('WALLET')}
                    className={`rounded-xl p-3 text-left border transition ${
                      selectedAccountType === 'WALLET'
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-white/10 bg-surface/50 hover:bg-surface'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Portefeuille</p>
                    <p className="font-bold text-white">
                      {new Intl.NumberFormat('fr-FR').format(accounts.find(a => a.type === 'WALLET')?.balance || 0)} FCFA
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAccountType('MERCHANT')}
                    className={`rounded-xl p-3 text-left border transition ${
                      selectedAccountType === 'MERCHANT'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-surface/50 hover:bg-surface'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Recettes Business</p>
                    <p className="font-bold text-white">
                      {new Intl.NumberFormat('fr-FR').format(accounts.find(a => a.type === 'MERCHANT')?.balance || 0)} FCFA
                    </p>
                  </button>
                </div>
              </div>
            )}

            <div className="py-6 text-center">
              <p className="text-5xl font-bold text-white">
                {amount ? Number(amount).toLocaleString('fr-FR') : '0'}
                <span className="ml-2 text-2xl text-gray-500">XAF</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">Frais: {formatCurrency(fee)}</p>
            </div>

            {/* Keypad */}
            <div className="mx-auto w-full max-w-xs">
              <div className="mb-8 grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypad(num.toString())}
                    className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-orange-500/20"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  type="button"
                  onClick={() => handleKeypad('0')}
                  className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypad('backspace')}
                  className="flex h-20 w-full items-center justify-center rounded-2xl bg-transparent text-gray-400 transition-colors hover:text-white"
                >
                  <Delete className="h-8 w-8" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('CONFIRM')}
                disabled={!amount || Number(amount) < 100}
                className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.95] disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Confirmer la demande</h2>
              <p className="text-sm text-gray-400">L'agent devra valider votre demande</p>
            </div>

            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Montant</span>
                  <span className="font-bold text-white">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-gray-400">Frais (2%)</span>
                  <span className="font-bold text-red-400">-{formatCurrency(fee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total débité</span>
                  <span className="font-bold text-white">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Agent</span>
                  <span className="font-bold text-orange-400">{selectedAgent?.fullName}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-yellow-400 text-sm">
              <Clock className="inline h-4 w-4 mr-2" />
              La demande expire après 24 heures si non traitée
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            )}

            <button
              onClick={handleCreateRequest}
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.95]"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </button>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/20 opacity-75"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-black">
                <CheckCircle className="h-12 w-12" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Demande créée !</h2>
              <p className="text-xl text-orange-500">{formatCurrency(Number(amount))}</p>
              <p className="text-gray-400">Présentez ce code à l'agent pour valider</p>
            </div>

            {/* Confirmation Code Display */}
            <div className="w-full max-w-sm rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
              <p className="mb-2 text-sm text-gray-400">Code de confirmation</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-4xl font-bold tracking-widest text-orange-400">
                  {confirmationCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                >
                  <Copy className="h-5 w-5 text-white" />
                </button>
              </div>
              {copied && <p className="mt-2 text-sm text-green-400">Copié !</p>}
              <p className="mt-4 text-xs text-gray-500">Réf: {requestRef}</p>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400 text-sm">
              L'agent saisira ce code pour valider le retrait et vous remettre l'argent
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-xs rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
            >
              Terminé
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <div className="p-4">
        <button 
          onClick={() => {
            if (step === 'AGENT' || step === 'SUCCESS') {
              navigate('/dashboard');
            } else if (step === 'AMOUNT') {
              setStep('AGENT');
              setSelectedAgent(null);
              setAgentQuery('');
            } else {
              setStep('AMOUNT');
            }
          }}
          className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
        {renderStep()}
      </div>
    </div>
  );
}

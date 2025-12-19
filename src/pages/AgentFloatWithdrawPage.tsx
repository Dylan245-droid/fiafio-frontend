import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, XCircle, User, AlertTriangle, Copy, Eye, X, Info } from 'lucide-react';
import api from '../services/api';

interface Agent {
  id: number;
  uniqueId: string;
  fullName: string;
  phone: string;
}

interface WithdrawalRequest {
  id: number;
  reference: string;
  amount: number;
  fee: number;
  agentName: string;
  agentPhone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  confirmationCode: string | null;
  message: string | null;
  responseNote: string | null;
  createdAt: string;
  expiresAt?: string;
}

interface PendingRequest {
  id: number;
  reference: string;
  amount: number;
  fee: number;
  totalAmount?: number;
  requesterName: string;
  requesterPhone: string;
  message: string | null;
  createdAt: string;
  expiresAt?: string;
}

const MINIMUM_FLOAT = 100000;

export default function AgentFloatWithdrawPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'request' | 'pending' | 'history'>('request');
  
  // Request form state
  const [amount, setAmount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentQuery, setAgentQuery] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastCode, setLastCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Balance state
  const [floatBalance, setFloatBalance] = useState(0);
  const [maxWithdrawable, setMaxWithdrawable] = useState(0);

  // History & pending state
  const [myRequests, setMyRequests] = useState<WithdrawalRequest[]>([]);
  const [pendingToApprove, setPendingToApprove] = useState<PendingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const res = await api.get('/accounts/balance');
        const floatAcc = res.data.accounts.find((a: any) => a.type === 'AGENT_FLOAT');
        if (floatAcc) {
          setFloatBalance(floatAcc.balance);
          setMaxWithdrawable(Math.max(0, floatAcc.balance - MINIMUM_FLOAT));
        }
      } catch (e) {
        console.error('Failed to load balance', e);
      }
    };
    loadBalance();
  }, [success]);

  // Search agents
  useEffect(() => {
    if (agentQuery.length >= 2 && !selectedAgent) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/float-requests/agents?query=${agentQuery}`);
          setAgents(res.data.agents || []);
        } catch (e) {
          console.error('Agent search failed', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAgents([]);
    }
  }, [agentQuery, selectedAgent]);

  // Load my requests and pending approvals
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [historyRes, pendingRes] = await Promise.all([
          api.get('/withdrawal-requests/history'), // All requests (own + received)
          api.get('/withdrawal-requests/pending'),
        ]);
        setMyRequests(historyRes.data.requests || []);
        setPendingToApprove(pendingRes.data.requests || []);
      } catch (e) {
        console.error('Load data failed', e);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/agent/float-withdrawal', {
        targetAgentId: selectedAgent?.id,
        amount: Number(amount),
        message: message || null,
      });
      setSuccess('Demande de retrait créée !');
      setLastCode(res.data.request.confirmationCode);
      setAmount('');
      setMessage('');
      setSelectedAgent(null);
      setAgentQuery('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    const code = prompt('Saisissez le code de confirmation à 6 caractères:');
    if (!code || code.length !== 6) {
      alert('Code invalide. Le code doit contenir 6 caractères.');
      return;
    }
    try {
      await api.post(`/withdrawal-requests/${id}/approve`, { confirmationCode: code });
      setSuccess('Retrait approuvé !');
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de l\'approbation');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Raison du refus (optionnel):') || '';
    try {
      await api.post(`/withdrawal-requests/${id}/reject`, { note: reason });
      setSuccess('Demande refusée');
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du refus');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler cette demande ?')) return;
    try {
      await api.post(`/withdrawal-requests/${id}/cancel`);
      setSuccess('Demande annulée');
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de l\'annulation');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

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

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <div className="p-4">
        <button 
          onClick={() => navigate('/agent-dashboard')}
          className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 px-6 pb-6">
        <h1 className="mb-6 text-center text-2xl font-bold">Demandes de Retrait</h1>

        {/* Tabs */}
        <div className="mb-6 flex rounded-2xl bg-surface p-1">
          <button
            onClick={() => setTab('request')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'request' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Nouvelle demande
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'pending' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            À approuver {pendingToApprove.length > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 text-xs text-white">{pendingToApprove.length}</span>}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'history' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Historique
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-4 text-red-400">
            <p className="text-center font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-green-500/10 p-4">
            <p className="text-center font-medium text-green-400">{success}</p>
            {lastCode && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-400">Code de confirmation:</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono text-2xl font-bold text-purple-400 tracking-widest">{lastCode}</span>
                  <button onClick={() => handleCopyCode(lastCode)} className="rounded p-1 hover:bg-white/10">
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                {copied && <p className="text-xs text-green-400 mt-1">Copié !</p>}
              </div>
            )}
          </div>
        )}

        {/* REQUEST TAB */}
        {tab === 'request' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Balance Info */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Float disponible</span>
                <span className="font-bold text-white">{formatCurrency(floatBalance)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">Maximum retirable</span>
                <span className="font-bold text-purple-400">{formatCurrency(maxWithdrawable)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Solde minimum requis: {formatCurrency(MINIMUM_FLOAT)}
              </p>
            </div>

            {maxWithdrawable <= 0 ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <p>Solde insuffisant pour effectuer un retrait</p>
              </div>
            ) : (
              <>
                {/* Agent Selection */}
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Retirer chez</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Rechercher un agent..."
                      value={selectedAgent ? selectedAgent.fullName : agentQuery}
                      onChange={(e) => {
                        setAgentQuery(e.target.value);
                        setSelectedAgent(null);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-surface py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-purple-500/50"
                    />
                    {agents.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/10 bg-surface shadow-lg">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setAgents([]);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <User className="h-5 w-5 text-purple-400" />
                            <div className="text-left">
                              <p className="font-medium text-white">{agent.fullName}</p>
                              <p className="text-xs text-gray-500">{agent.uniqueId} • {agent.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Montant (min. 10,000 XAF)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={10000}
                    max={maxWithdrawable}
                    className="w-full rounded-xl border border-white/10 bg-surface py-4 px-4 text-white placeholder-gray-600 outline-none focus:border-purple-500/50"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Message (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Raison de la demande..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface py-4 px-4 text-white placeholder-gray-600 outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Info */}
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400 text-sm">
                  <Info className="inline h-4 w-4 mr-2" />
                  0% de frais pour les transferts float entre agents
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedAgent || !amount || Number(amount) < 10000 || Number(amount) > maxWithdrawable}
                  className="w-full rounded-xl bg-purple-500 py-4 font-bold text-white transition hover:bg-purple-400 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </>
            )}
          </form>
        )}

        {/* PENDING TAB */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {loadingData ? (
              <div className="text-center py-10 text-gray-500">Chargement...</div>
            ) : pendingToApprove.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Aucune demande à approuver</div>
            ) : (
              pendingToApprove.map((req) => (
                <div key={req.id} className="rounded-xl border border-white/10 bg-surface p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">{req.requesterName}</p>
                      <p className="text-xs text-gray-500">{req.requesterPhone}</p>
                    </div>
                    <p className="font-bold text-purple-400">{formatCurrency(req.amount)}</p>
                  </div>
                  {req.message && (
                    <p className="text-sm text-gray-400 mb-3 italic">"{req.message}"</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                    <div className="flex items-center gap-2">
                      {/* Eye Button */}
                      <button
                        onClick={() => { setSelectedRequest({ ...req, type: 'pending' }); setShowModal(true); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Approve Button */}
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-400"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      {/* Reject Button */}
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-400"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-4">
            {loadingData ? (
              <div className="text-center py-10 text-gray-500">Chargement...</div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Aucune demande</div>
            ) : (
              myRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-white/10 bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{req.agentName}</p>
                      <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-purple-400">{formatCurrency(req.amount)}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStatusColor(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </div>
                      {/* Eye Button */}
                      <button
                        onClick={() => { setSelectedRequest({ ...req, type: 'history' }); setShowModal(true); }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-white/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-bold text-white">Détails de la demande</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-purple-500/10 p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{formatCurrency(selectedRequest.amount)}</p>
                {selectedRequest.fee > 0 && (
                  <p className="text-sm text-gray-400 mt-1">Frais: {formatCurrency(selectedRequest.fee)}</p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Référence</span>
                  <span className="font-mono text-white">{selectedRequest.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{selectedRequest.type === 'pending' ? 'Demandeur' : 'Agent'}</span>
                  <span className="text-white">{selectedRequest.type === 'pending' ? selectedRequest.requesterName : selectedRequest.agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Téléphone</span>
                  <span className="text-white">{selectedRequest.type === 'pending' ? selectedRequest.requesterPhone : (selectedRequest.agentPhone || '-')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{formatDate(selectedRequest.createdAt)}</span>
                </div>
                {selectedRequest.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Statut</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                )}
                {selectedRequest.message && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-1">Message</p>
                    <p className="text-white italic">"{selectedRequest.message}"</p>
                  </div>
                )}
                {selectedRequest.confirmationCode && selectedRequest.status === 'PENDING' && (
                  <div className="border-t border-white/10 pt-3 text-center">
                    <p className="text-gray-400 mb-1">Code de confirmation</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono text-2xl font-bold text-purple-400">{selectedRequest.confirmationCode}</p>
                      <button onClick={() => handleCopyCode(selectedRequest.confirmationCode)} className="p-1 hover:bg-white/10 rounded">
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
                {selectedRequest.responseNote && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-1">Note de réponse</p>
                    <p className="text-red-400">"{selectedRequest.responseNote}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedRequest.type === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-400"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-400"
                  >
                    <XCircle className="h-5 w-5" />
                    Refuser
                  </button>
                </div>
              )}

              {selectedRequest.type === 'history' && selectedRequest.status === 'PENDING' && (
                <button
                  onClick={() => handleCancel(selectedRequest.id)}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import api from '../services/api';

interface Agent {
  id: number;
  uniqueId: string;
  fullName: string;
  phone: string;
}

interface FloatRequest {
  id?: number;
  reference: string;
  amount: number;
  providerType: 'AGENT' | 'ADMIN';
  providerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  message: string | null;
  responseNote: string | null;
  createdAt: string;
  expiresAt: string;
}

interface PendingRequest {
  id: number;
  reference: string;
  amount: number;
  requesterName: string;
  requesterPhone: string;
  message: string | null;
  createdAt: string;
}

export default function FloatRequestPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'request' | 'pending' | 'history'>('request');
  
  // Request form state
  const [amount, setAmount] = useState('');
  const [providerType, setProviderType] = useState<'ADMIN' | 'AGENT'>('ADMIN');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentQuery, setAgentQuery] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingRequest, setExistingRequest] = useState<{reference: string, amount: number, createdAt: string} | null>(null);
  const [success, setSuccess] = useState('');

  // History & pending state
  const [myRequests, setMyRequests] = useState<FloatRequest[]>([]);
  const [pendingToApprove, setPendingToApprove] = useState<PendingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search agents
  useEffect(() => {
    if (providerType === 'AGENT' && agentQuery.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/float-requests/agents?query=${agentQuery}`);
          const foundAgents = res.data.agents || [];
          setAgents(foundAgents);

          // console.log(foundAgents)
          
          // Auto-select if exact uniqueId match
          const exactMatch = foundAgents.find(
            (a: Agent) => a.uniqueId.toUpperCase() === agentQuery.toUpperCase()
          );
          if (exactMatch && !selectedAgent) {
            setSelectedAgent(exactMatch);
            setAgents([]);
          }
        } catch (e) {
          console.error('Agent search failed', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [agentQuery, providerType]);

  // Load my requests and pending approvals
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [myRes, pendingRes] = await Promise.all([
          api.get('/float-requests/my'),
          api.get('/float-requests/pending'),
        ]);
        setMyRequests(myRes.data.requests);
        setPendingToApprove(pendingRes.data.requests);
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
    setExistingRequest(null);
    setSuccess('');
    setSubmitting(true);

    try {
      // console.log(selectedAgent)
      await api.post('/float-requests', {
        amount: Number(amount),
        providerType,
        providerId: selectedAgent?.id || null,
        message: message || null,
      });
      setSuccess('Demande envoyée avec succès !');
      setAmount('');
      setMessage('');
      setSelectedAgent(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'envoi';
      setError(errorMsg);
      // If there's an existing request, show its details
      if (err.response?.data?.existingRequest) {
        setExistingRequest(err.response.data.existingRequest);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Confirmer cette recharge ?')) return;
    try {
      await api.post(`/float-requests/${id}/approve`);
      setSuccess('Demande approuvée !');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de l\'approbation');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Raison du refus (optionnel):');
    try {
      await api.post(`/float-requests/${id}/reject`, { reason });
      setSuccess('Demande rejetée');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du rejet');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);

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

  const [historyFilter, setHistoryFilter] = useState<string>('ALL');

  const handleCancelRequest = async (reference: string) => {
    if (!confirm('Annuler cette demande ?')) return;
    try {
      // Find the request to get its id
      const req = myRequests.find(r => r.reference === reference);
      if (!req) return;
      await api.delete(`/float-requests/${req.id || reference}`);
      setSuccess('Demande annulée');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de l\'annulation');
    }
  };

  const filteredRequests = historyFilter === 'ALL' 
    ? myRequests 
    : myRequests.filter(r => r.status === historyFilter);

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
        <h1 className="mb-6 text-center text-2xl font-bold">Demande de Recharge Float</h1>

        {/* Tabs */}
        <div className="mb-6 flex rounded-2xl bg-surface p-1">
          <button
            onClick={() => setTab('request')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'request' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Nouvelle demande
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'pending' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            À approuver {pendingToApprove.length > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 text-xs text-white">{pendingToApprove.length}</span>}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 rounded-xl py-3 text-sm font-medium transition ${
              tab === 'history' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Historique
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-4 text-red-400">
            <p className="text-center font-medium">{error}</p>
            {existingRequest && (
              <div className="mt-3 rounded-lg bg-surface/50 p-3 text-sm">
                <p className="text-gray-400">Demande existante :</p>
                <div className="mt-2 flex justify-between">
                  <span className="text-white">Réf: {existingRequest.reference}</span>
                  <span className="font-bold text-white">{formatCurrency(existingRequest.amount)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Créée le {formatDate(existingRequest.createdAt)}
                </p>
                <p className="mt-2 text-xs text-yellow-400">
                  💡 Attendez une réponse ou consultez l'onglet "Historique" pour annuler.
                </p>
              </div>
            )}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl bg-green-500/10 p-4 text-center text-green-400">{success}</div>
        )}

        {/* New Request Tab */}
        {tab === 'request' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Type */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">Demander à</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setProviderType('ADMIN'); setSelectedAgent(null); }}
                  className={`flex-1 rounded-2xl border py-4 text-center transition ${
                    providerType === 'ADMIN' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-white/10 bg-surface text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl">🏦</span>
                  <p className="mt-1 font-medium">Fiafio</p>
                  <p className="text-xs text-gray-500">0% frais</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProviderType('AGENT')}
                  className={`flex-1 rounded-2xl border py-4 text-center transition ${
                    providerType === 'AGENT' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-white/10 bg-surface text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Users className="mx-auto h-8 w-8" />
                  <p className="mt-1 font-medium">Agent</p>
                  <p className="text-xs text-gray-500">0% frais</p>
                </button>
              </div>
            </div>

            {/* Agent Search */}
            {providerType === 'AGENT' && (
              <div>
                <label className="mb-2 block text-sm text-gray-400">Rechercher un agent</label>
                {selectedAgent ? (
                  <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
                    <div>
                      <p className="font-bold text-white">{selectedAgent.fullName}</p>
                      <p className="text-sm text-gray-500">{selectedAgent.uniqueId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAgent(null)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Nom ou ID de l'agent"
                      value={agentQuery}
                      onChange={(e) => setAgentQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-surface px-12 py-4 text-white placeholder-gray-600 outline-none focus:border-primary/50"
                    />
                    {agents.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-2xl bg-surface border border-white/10 shadow-xl overflow-hidden">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => { setSelectedAgent(agent); setAgents([]); setAgentQuery(''); }}
                            className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 last:border-0"
                          >
                            <p className="font-medium text-white">{agent.fullName}</p>
                            <p className="text-sm text-gray-500">{agent.uniqueId} · {agent.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">Montant (min. 10,000 XAF)</label>
              <input
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={10000}
                required
                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 text-xl font-bold text-white placeholder-gray-600 outline-none focus:border-primary/50"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">Message (optionnel)</label>
              <textarea
                placeholder="Raison de la demande..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !amount}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        )}

        {/* Pending to Approve Tab */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {loadingData ? (
              <div className="text-center text-gray-400">Chargement...</div>
            ) : pendingToApprove.length === 0 ? (
              <div className="rounded-2xl bg-surface p-8 text-center text-gray-400">
                <Clock className="mx-auto mb-2 h-12 w-12 text-gray-600" />
                <p>Aucune demande à approuver</p>
              </div>
            ) : (
              pendingToApprove.map((req) => (
                <div key={req.id} className="rounded-2xl bg-surface p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white">{req.requesterName}</p>
                      <p className="text-sm text-gray-500">{req.requesterPhone}</p>
                    </div>
                    <p className="text-xl font-bold text-primary">{formatCurrency(req.amount)}</p>
                  </div>
                  {req.message && (
                    <p className="mb-3 text-sm text-gray-400 italic">"{req.message}"</p>
                  )}
                  <p className="mb-4 text-xs text-gray-500">Réf: {req.reference} · {formatDate(req.createdAt)}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-black hover:bg-green-400"
                    >
                      <CheckCircle className="mr-2 inline h-4 w-4" /> Approuver
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex-1 rounded-xl bg-red-500/20 py-3 font-bold text-red-400 hover:bg-red-500/30"
                    >
                      <XCircle className="mr-2 inline h-4 w-4" /> Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setHistoryFilter(s)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                    historyFilter === s 
                      ? 'bg-primary text-black' 
                      : 'bg-surface text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'Toutes' : getStatusLabel(s)}
                </button>
              ))}
            </div>
            
            {loadingData ? (
              <div className="text-center text-gray-400">Chargement...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-2xl bg-surface p-8 text-center text-gray-400">
                <Send className="mx-auto mb-2 h-12 w-12 text-gray-600" />
                <p>Aucune demande {historyFilter !== 'ALL' ? 'avec ce statut' : ''}</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.reference} className={`rounded-2xl bg-surface p-4 ${req.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white">{formatCurrency(req.amount)}</p>
                      <p className="text-sm text-gray-500">à {req.providerName}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  {req.responseNote && (
                    <p className="text-sm text-gray-400 italic">Réponse: {req.responseNote}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Réf: {req.reference} · {formatDate(req.createdAt)}</p>
                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelRequest(req.reference)}
                      className="mt-3 w-full rounded-xl bg-orange-500/20 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/30"
                    >
                      Annuler cette demande
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

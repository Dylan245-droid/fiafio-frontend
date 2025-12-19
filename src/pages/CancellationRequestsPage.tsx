import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, XCircle, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import api from '../services/api';
import TransactionModal from '../components/TransactionModal';

interface CancellationRequest {
  id: number;
  transactionRef: string;
  userName: string;
  transactionAmount: number;
  feeAmount: number;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function CancellationRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agent/cancellation-requests');
      setRequests(res.data.requests || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    // Prompt for confirmation code
    const code = prompt('Saisissez le code de confirmation à 6 caractères donné par le client:');
    if (!code) {
      setError('Code de confirmation requis');
      return;
    }
    
    if (code.length !== 6) {
      setError('Le code doit contenir exactement 6 caractères');
      return;
    }
    
    setProcessing(id);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/agent/cancellation-requests/${id}/approve`, { confirmationCode: code });
      setSuccess('Annulation approuvée ! Le client a été remboursé.');
      fetchRequests();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Échec de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Raison du refus (optionnel):');
    
    setProcessing(id);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/agent/cancellation-requests/${id}/reject`, { reason });
      setSuccess('Demande refusée');
      fetchRequests();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Échec du refus');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background p-4 font-sans text-white">
      {/* Transaction Modal */}
      {selectedTxRef && (
        <TransactionModal
          reference={selectedTxRef}
          onClose={() => setSelectedTxRef(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/agent-dashboard')}
          className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Demandes d'Annulation</h1>
          <p className="mt-2 text-gray-400">Gérez les demandes d'annulation de retrait</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 p-4 text-green-400">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface/50" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-400">Aucune demande en attente</h2>
            <p className="mt-2 text-sm text-gray-500">
              Les demandes d'annulation de retrait des clients apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-red-500/30 bg-surface p-4">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{req.userName}</p>
                    <p className="text-sm text-gray-500">Réf: {req.transactionRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{formatCurrency(req.transactionAmount)}</p>
                    <p className="text-xs text-red-400">Frais: {formatCurrency(req.feeAmount)}</p>
                  </div>
                </div>

                {/* Reason */}
                {req.reason && (
                  <div className="mb-3 rounded-xl bg-surface/50 p-3">
                    <p className="text-xs text-gray-500">Raison:</p>
                    <p className="text-sm text-gray-300 italic">"{req.reason}"</p>
                  </div>
                )}

                {/* Date */}
                <p className="mb-4 text-xs text-gray-500">Demandé le {formatDate(req.createdAt)}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTxRef(req.transactionRef)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-blue-500/20 px-3 py-3 font-medium text-blue-400 transition hover:bg-blue-500/30"
                    title="Voir la transaction"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processing === req.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-black transition hover:bg-green-400 disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    {processing === req.id ? '...' : 'Approuver'}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={processing === req.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/20 py-3 font-bold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-surface/30 p-4">
          <h3 className="mb-2 font-medium text-white">ℹ️ Comment ça marche</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>• Un client demande l'annulation d'un retrait</li>
            <li>• Vous décidez d'approuver ou refuser</li>
            <li>• Si approuvé: le client est remboursé (moins 5% de frais)</li>
            <li>• Les frais sont partagés: 60% Fiafio, 40% vous</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


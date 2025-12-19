import { useState, useEffect } from 'react';
import { CreditCard, Check, X, Clock, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import api from '../services/api';

interface PaymentRequest {
  id: string;
  merchant: {
    name: string;
    logo: string | null;
  };
  amount: number;
  currency: string;
  description: string;
  expires_at: string;
  created_at: string;
}

interface Props {
  onRequestHandled?: () => void;
}

export default function PaymentRequestsCard({ onRequestHandled }: Props) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payment-requests/pending');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch payment requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expiré';
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '< 1 min';
    return `${minutes} min`;
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    setError('');
    
    try {
      await api.post(`/payment-requests/${requestId}/approve`);
      setRequests(requests.filter(r => r.id !== requestId));
      onRequestHandled?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    setError('');
    
    try {
      await api.post(`/payment-requests/${requestId}/reject`);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface p-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show the card if no pending requests
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-400" />
          <h3 className="font-bold text-white">Demandes de paiement</h3>
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            {requests.length}
          </span>
        </div>
        <button
          onClick={fetchRequests}
          className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-xl bg-white/5 border border-white/10 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {request.merchant.logo ? (
                  <img
                    src={request.merchant.logo}
                    alt={request.merchant.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{request.merchant.name}</p>
                  <p className="text-xs text-gray-500">{request.description}</p>
                </div>
              </div>
              <div className="text-right">
                {/* Calculate fees: 25 XAF + 1.5% */}
                {(() => {
                  const fee = 25 + Math.round(request.amount * 0.015);
                  const total = request.amount + fee;
                  return (
                    <>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(request.amount, request.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        + {formatCurrency(fee, request.currency)} frais
                      </p>
                      <p className="text-lg font-bold text-primary">
                        = {formatCurrency(total, request.currency)}
                      </p>
                    </>
                  );
                })()}
                <div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
                  <Clock className="h-3 w-3" />
                  {getTimeRemaining(request.expires_at)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReject(request.id)}
                disabled={processing === request.id}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
              >
                {processing === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Refuser
                  </>
                )}
              </button>
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processing === request.id}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-black hover:bg-green-400 disabled:opacity-50"
              >
                {processing === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Payer
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

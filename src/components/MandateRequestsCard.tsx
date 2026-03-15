import { useState, useEffect } from 'react';
import { Repeat, Check, Clock, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import api from '../services/api';

interface Mandate {
  id: string;
  reference: string;
  merchant: {
    businessName: string;
    logoUrl: string | null;
  } | null;
  maxAmount: number;
  period: string; // MONTHLY, WEEKLY
  status: string; // PENDING, ACTIVE, etc.
  created_at: string;
}

interface Props {
  onMandateHandled?: () => void;
}

export default function MandateRequestsCard({ onMandateHandled }: Props) {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchMandates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mandates');
      // Filter only pending on client side since the API returns all
      const pendingAndSorted = (res.data || [])
        .filter((m: Mandate) => m.status === 'PENDING')
        .sort((a: Mandate, b: Mandate) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      setMandates(pendingAndSorted);
    } catch (err) {
      console.error('Failed to fetch mandates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandates();
    // Poll every 10 seconds
    const interval = setInterval(fetchMandates, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = async (mandateId: string) => {
    setProcessing(mandateId);
    setError('');
    
    try {
      await api.post(`/mandates/${mandateId}/approve`);
      setMandates(mandates.filter(m => m.id !== mandateId));
      onMandateHandled?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  if (loading && mandates.length === 0) return null;
  if (mandates.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-purple-400" />
          <h3 className="font-bold text-white">Demandes d'Abonnement</h3>
          <span className="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">
            {mandates.length}
          </span>
        </div>
        <button
          onClick={fetchMandates}
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
        {mandates.map((mandate) => (
          <div
            key={mandate.id}
            className="rounded-xl bg-white/5 border border-white/10 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {mandate.merchant?.logoUrl ? (
                  <img
                    src={mandate.merchant.logoUrl}
                    alt={mandate.merchant?.businessName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                    <Repeat className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{mandate.merchant?.businessName || 'Marchand Inconnu'}</p>
                  <p className="text-xs text-gray-400">Prélèvement automatique</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {formatCurrency(mandate.maxAmount)}
                </p>
                <div className="flex items-center justify-end gap-1 text-xs text-purple-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {mandate.period === 'MONTHLY' ? '/ Mois' : mandate.period}
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-3 text-xs text-gray-400">
              En acceptant, vous autorisez ce marchand à prélever jusqu'à <strong>{formatCurrency(mandate.maxAmount)}</strong> par mois sur votre compte Fiafio.
            </div>

            <button
                onClick={() => handleApprove(mandate.id)}
                disabled={processing === mandate.id}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {processing === mandate.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Autoriser l'abonnement
                  </>
                )}
              </button>
          </div>
        ))}
      </div>
    </div>
  );
}

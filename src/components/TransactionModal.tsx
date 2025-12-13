import { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

interface TransactionDetail {
  reference: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  completedAt: string | null;
  direction: 'IN' | 'OUT';
  sender: { id: number; fullName: string; phone: string; uniqueId: string } | null;
  receiver: { id: number; fullName: string; phone: string; uniqueId: string } | null;
  agent: { id: number; fullName: string; phone: string } | null;
  canRequestCancellation: boolean;
}

interface Props {
  reference: string;
  onClose: () => void;
  onCancellationRequested?: () => void;
}

export default function TransactionModal({ reference, onClose, onCancellationRequested }: Props) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await api.get(`/transactions/${reference}`);
        setTransaction(res.data.transaction);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [reference]);

  const handleRequestCancellation = async () => {
    if (!transaction) return;
    setCancelling(true);
    setError('');

    try {
      await api.post('/agent/cancellation-requests', {
        transactionReference: transaction.reference,
      });
      alert('Demande d\'annulation envoyée. Un agent examinera votre demande.');
      onCancellationRequested?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec de la demande d\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = () => {
    switch (transaction?.status) {
      case 'COMPLETED':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'REVERSED':
        return <Ban className="h-8 w-8 text-red-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-background border border-white/10 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-surface hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center text-red-500">
            <AlertTriangle className="mb-2 h-10 w-10" />
            <p>{error}</p>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                transaction.direction === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                {transaction.direction === 'IN' 
                  ? <ArrowDownLeft className="h-8 w-8 text-green-500" />
                  : <ArrowUpRight className="h-8 w-8 text-red-500" />
                }
              </div>
              <p className={`text-3xl font-bold ${
                transaction.direction === 'IN' ? 'text-green-500' : 'text-white'
              }`}>
                {transaction.direction === 'IN' ? '+' : '-'}
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(transaction.amount)}
              </p>
              <p className="mt-1 text-sm text-gray-400">{transaction.type}</p>
            </div>

            {/* Details */}
            <div className="space-y-3 rounded-2xl bg-surface p-4">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-gray-400">Statut</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className={`font-bold ${
                    transaction.status === 'COMPLETED' ? 'text-green-500' :
                    transaction.status === 'REVERSED' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-gray-400">Référence</span>
                <span className="font-mono text-sm text-white">{transaction.reference}</span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-gray-400">Date</span>
                <span className="text-white">{format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>

              {transaction.fee > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400">Frais</span>
                  <span className="text-red-400">-{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(transaction.fee)}</span>
                </div>
              )}

              {transaction.sender && transaction.direction === 'IN' && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400">De</span>
                  <div className="text-right">
                    <p className="text-white">{transaction.sender.fullName}</p>
                    <p className="text-xs text-gray-500">{transaction.sender.uniqueId}</p>
                  </div>
                </div>
              )}

              {transaction.receiver && transaction.direction === 'OUT' && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400">À</span>
                  <div className="text-right">
                    <p className="text-white">{transaction.receiver.fullName}</p>
                    <p className="text-xs text-gray-500">{transaction.receiver.uniqueId}</p>
                  </div>
                </div>
              )}

              {transaction.agent && (
                <div className="flex justify-between pb-3">
                  <span className="text-gray-400">Agent</span>
                  <span className="text-white">{transaction.agent.fullName}</span>
                </div>
              )}

              {transaction.description && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Note</span>
                  <span className="text-gray-300">{transaction.description}</span>
                </div>
              )}
            </div>

            {/* Cancellation Button */}
            {transaction.canRequestCancellation && transaction.direction === 'OUT' && (
              <button
                onClick={handleRequestCancellation}
                disabled={cancelling}
                className="w-full rounded-2xl border border-red-500/50 bg-red-500/10 py-3 font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {cancelling ? 'Traitement...' : '🚫 Demander Annulation (5% frais)'}
              </button>
            )}

            {!transaction.canRequestCancellation && transaction.status === 'COMPLETED' && transaction.direction === 'OUT' && (
              <p className="text-center text-xs text-gray-500">
                Cancellation window expired (30 min limit)
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

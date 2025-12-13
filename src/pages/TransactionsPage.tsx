import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TransactionModal from '../components/TransactionModal';

interface Transaction {
  reference: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  createdAt: string;
  direction: 'IN' | 'OUT';
  description: string;
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'IN' | 'OUT'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/accounts/history?limit=100');
      setTransactions(res.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filter === 'all' || tx.direction === filter;
    const matchesSearch = tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'P2P': 'Transfert',
      'DEPOSIT': 'Dépôt',
      'WITHDRAWAL': 'Retrait',
      'REVERSAL': 'Annulation',
      'FEE': 'Frais',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/agent-dashboard')}
          className="rounded-full bg-surface p-2 text-gray-400 hover:bg-accent hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Historique des Transactions</h1>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par référence, type, montant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-surface px-12 py-3 text-white placeholder-gray-500 outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              filter === 'all' ? 'bg-primary text-black' : 'bg-surface text-gray-400 hover:bg-accent'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilter('IN')}
            className={`flex items-center gap-1 rounded-xl px-4 py-2 font-medium transition ${
              filter === 'IN' ? 'bg-green-500 text-white' : 'bg-surface text-gray-400 hover:bg-accent'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" /> Reçus
          </button>
          <button
            onClick={() => setFilter('OUT')}
            className={`flex items-center gap-1 rounded-xl px-4 py-2 font-medium transition ${
              filter === 'OUT' ? 'bg-red-500 text-white' : 'bg-surface text-gray-400 hover:bg-accent'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" /> Envoyés
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.reference}
              onClick={() => setSelectedTxRef(tx.reference)}
              className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface p-4 transition hover:bg-accent hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  tx.direction === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {tx.direction === 'IN' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{getTypeLabel(tx.type)}</h3>
                  <p className="text-sm text-gray-400">
                    {format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                  </p>
                  <p className="text-xs font-mono text-gray-500">{tx.reference}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`block font-bold ${
                  tx.direction === 'IN' ? 'text-green-500' : 'text-white'
                }`}>
                  {tx.direction === 'IN' ? '+' : '-'}
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(tx.amount)}
                </span>
                <span className={`text-xs ${
                  tx.status === 'COMPLETED' ? 'text-green-500' : 
                  tx.status === 'REVERSED' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {tx.status === 'COMPLETED' ? 'Terminé' : 
                   tx.status === 'REVERSED' ? 'Annulé' : 
                   tx.status === 'PENDING' ? 'En cours' : tx.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Filter className="mx-auto mb-2 h-10 w-10 opacity-50" />
            <p>Aucune transaction trouvée</p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxRef && (
        <TransactionModal
          reference={selectedTxRef}
          onClose={() => setSelectedTxRef(null)}
          onCancellationRequested={fetchTransactions}
        />
      )}
    </div>
  );
}

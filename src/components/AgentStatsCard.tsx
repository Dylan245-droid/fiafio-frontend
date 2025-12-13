import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Zap, Clock, AlertTriangle, ArrowUp } from 'lucide-react';
import api from '../services/api';

interface AgentStats {
  level: {
    key: string;
    name: string;
    badge: string;
    daysActive: number;
    daysUntilNextLevel: number | null;
    transactionsUntilNextLevel: number | null;
    nextLevel: string | null;
    isStagnating: boolean;
    stagnationReason: string | null;
  };
  limits: {
    daily: number;
    perTransaction: number;
    todayUsed: number;
    remaining: number;
    percentage: number;
  };
  float: {
    balance: number;
    minimum: number;
    canOperate: boolean;
    blockReason: string | null;
  };
  commissions: {
    today: number;
    week: number;
    month: number;
  };
  totalTransactions: number;
}

export default function AgentStatsCard() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/agent/stats');
        setStats(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl bg-surface p-6">
        <div className="h-6 w-1/3 rounded bg-white/10 mb-4" />
        <div className="h-4 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-3xl bg-surface p-6 text-center text-red-400">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <p>{error || 'Impossible de charger les statistiques'}</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);

  return (
    <div className="space-y-4">
      {/* Level & Limit Progress */}
      <div className="rounded-3xl bg-gradient-to-br from-surface to-accent p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stats.level.badge}</span>
            <div>
              <h3 className="text-lg font-bold text-white">{stats.level.name}</h3>
              {stats.level.transactionsUntilNextLevel !== null && stats.level.transactionsUntilNextLevel > 0 && (
                <p className="text-sm text-gray-400">
                  <ArrowUp className="mr-1 inline h-3 w-3" />
                  {stats.level.transactionsUntilNextLevel} transactions pour monter
                </p>
              )}
              {stats.level.daysUntilNextLevel !== null && stats.level.daysUntilNextLevel > 0 && (
                <p className="text-xs text-gray-500">
                  <Clock className="mr-1 inline h-3 w-3" />
                  ou {stats.level.daysUntilNextLevel} jours d'ancienneté
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-400">transactions</p>
          </div>
        </div>

        {/* Stagnation Warning */}
        {stats.level.isStagnating && stats.level.stagnationReason && (
          <div className="mb-4 rounded-xl bg-yellow-500/10 p-3 text-sm text-yellow-400">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            {stats.level.stagnationReason}
          </div>
        )}

        {/* Daily Limit Progress Bar */}
        <div className="mb-2">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-400">Limite quotidienne</span>
            <span className="text-white">
              {formatCurrency(stats.limits.todayUsed)} / {formatCurrency(stats.limits.daily)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.limits.percentage >= 90 ? 'bg-red-500' :
                stats.limits.percentage >= 70 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, stats.limits.percentage)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Reste: {formatCurrency(stats.limits.remaining)}
          </p>
        </div>

        {/* Float Warning */}
        {!stats.float.canOperate && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {stats.float.blockReason}
          </div>
        )}
      </div>

      {/* Commissions Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-surface p-4 text-center">
          <Zap className="mx-auto mb-1 h-5 w-5 text-primary" />
          <p className="text-lg font-bold text-green-400">{formatCurrency(stats.commissions.today)}</p>
          <p className="text-xs text-gray-500">Aujourd'hui</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 text-center">
          <TrendingUp className="mx-auto mb-1 h-5 w-5 text-blue-400" />
          <p className="text-lg font-bold text-blue-400">{formatCurrency(stats.commissions.week)}</p>
          <p className="text-xs text-gray-500">Cette semaine</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 text-center">
          <TrendingUp className="mx-auto mb-1 h-5 w-5 text-purple-400" />
          <p className="text-lg font-bold text-purple-400">{formatCurrency(stats.commissions.month)}</p>
          <p className="text-xs text-gray-500">Ce mois</p>
        </div>
      </div>

      {/* Float Balance */}
      <div className="rounded-2xl bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Float disponible</span>
          <span className={`text-xl font-bold ${
            stats.float.balance >= stats.float.minimum ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(stats.float.balance)}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Minimum requis: {formatCurrency(stats.float.minimum)}
        </p>
      </div>
    </div>
  );
}

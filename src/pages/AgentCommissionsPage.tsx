import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, DollarSign, TrendingUp, BarChart3, Clock } from 'lucide-react';

interface RevenueStats {
  thisMonth: number;
  lastMonth: number;
  yearToDate: number;
  growth: number;
  monthlyData: { month: string; revenue: number; count: number }[];
}

export default function AgentCommissionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agent/revenue');
      setRevenue(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-white">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/agent-dashboard')}
          className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-white">Mes Commissions</h1>
        <p className="text-gray-400">Suivez vos revenus sur les transactions</p>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
            <DollarSign className="h-4 w-4" />
            Mois en cours
          </div>
          <div className="mt-2 text-3xl font-bold text-green-400">
            {formatCurrency(revenue?.thisMonth || 0)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {revenue && revenue.growth !== 0 && (
              <span className={revenue.growth > 0 ? 'text-green-400' : 'text-red-400'}>
                {revenue.growth > 0 ? '↑' : '↓'} {Math.abs(revenue.growth)}%
              </span>
            )} vs mois dernier
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-surface/30 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <BarChart3 className="h-4 w-4" />
            Mois dernier
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(revenue?.lastMonth || 0)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Total des commissions</p>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            Année en cours
          </div>
          <div className="mt-2 text-3xl font-bold text-primary">
            {formatCurrency(revenue?.yearToDate || 0)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Cumul annuel</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-400 mb-8">
        <DollarSign className="mr-2 inline h-5 w-5" />
        Vos commissions proviennent des frais de transactions : 60% des frais de retrait (2%) et 40% des frais d'annulation (5%).
      </div>

      {/* Monthly Revenue Chart */}
      <div className="h-80 w-full rounded-3xl border border-white/5 bg-surface/30 p-6 mb-8">
        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
          <Clock className="inline h-4 w-4 mr-2" />
          Commissions Mensuelles (6 derniers mois)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenue?.monthlyData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#666" 
              fontSize={12} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#666" 
              fontSize={12} 
              axisLine={false}
              tickLine={false}
              dx={-10}
              tickFormatter={(v) => `${Math.round(v/1000)}k`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#06231D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
              formatter={(value: number) => [formatCurrency(value), 'Commissions']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6, fill: '#22c55e' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown Table */}
      {revenue?.monthlyData && revenue.monthlyData.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Mois</th>
                <th className="px-6 py-4 text-right font-medium">Transactions</th>
                <th className="px-6 py-4 text-right font-medium">Commissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {revenue.monthlyData.map((month) => (
                <tr key={month.month} className="text-gray-300 transition hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{month.month}</td>
                  <td className="px-6 py-4 text-right">{month.count}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-400">{formatCurrency(month.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Banknote, Delete, AlertTriangle } from 'lucide-react';
import api from '../services/api';

type Step = 'AGENT' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

interface Agent {
  id: number;
  phone: string;
  uniqueId?: string;
  fullName: string | null;
}

const FEE_PERCENTAGE = 0.02; // 2% fee

export default function WithdrawPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('AGENT');
  const [agentQuery, setAgentQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [amount, setAmount] = useState('');
  const [txRef, setTxRef] = useState('');

  const fee = Math.round(Number(amount) * FEE_PERCENTAGE);
  const total = Number(amount) + fee;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/users/find', { query: agentQuery });
      const foundUser = res.data.user;
      // For demo, assume any user can be an agent. In real app, verify role.
      setAgent(foundUser);
      setStep('AMOUNT');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Agent not found');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/transfers/withdraw', {
        agentPhone: agent?.phone,
        amount: Number(amount),
        description: 'Cash-Out Withdrawal'
      });
      setTxRef(res.data.transaction.reference);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      if (val === '0' && amount === '') return;
      setAmount(prev => prev + val);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'AGENT':
        return (
          <div className="space-y-8 pt-10">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <Banknote className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Withdraw Cash</h2>
              <p className="mt-2 text-gray-400">Find an agent to cash out your funds</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="group relative">
                <Search className="absolute left-4 top-4 h-6 w-6 text-gray-500 transition-colors group-focus-within:text-orange-500" />
                <input
                  type="text"
                  placeholder="Agent Phone or ID"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-surface/50 px-14 py-4 text-lg text-white placeholder-gray-600 outline-none transition-all focus:border-orange-500/50 focus:bg-black/40 focus:ring-1 focus:ring-orange-500/50"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !agentQuery}
                className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Find Agent'}
              </button>
            </form>

            <div className="flex justify-center gap-4">
               {['AGENT1', '+237611111111'].map(p => (
                   <button key={p} onClick={() => setAgentQuery(p)} className="rounded-full bg-surface px-4 py-2 text-xs text-gray-400 hover:text-orange-500">
                       {p}
                   </button>
               ))}
            </div>
          </div>
        );

      case 'AMOUNT':
        return (
          <div className="flex h-full flex-col justify-between pb-8">
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  <Banknote className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Withdraw from</h3>
                <p className="text-xl font-bold text-white">{agent?.fullName}</p>
                <p className="text-sm text-gray-500 font-mono">{agent?.uniqueId || agent?.phone}</p>
              </div>

              <div className="py-8">
                  <p className="text-5xl font-bold tracking-tighter text-orange-500">
                      {amount ? new Intl.NumberFormat('fr-FR').format(Number(amount)) : '0'} 
                      <span className="ml-2 text-2xl text-gray-500">XAF</span>
                  </p>
              </div>
            </div>

            {/* Keypad */}
            <div className="mx-auto w-full max-w-xs">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeypad(num.toString())}
                            className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-orange-500/20"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeypad('0')}
                        className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-orange-500/20"
                    >
                        0
                    </button>
                    <button
                        onClick={() => handleKeypad('backspace')}
                        className="flex h-20 w-full items-center justify-center rounded-2xl bg-transparent text-gray-400 transition-colors hover:text-white"
                    >
                        <Delete className="h-8 w-8" />
                    </button>
                </div>

                <button
                  onClick={() => setStep('CONFIRM')}
                  disabled={!amount || Number(amount) <= 0}
                  className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  Review
                </button>
            </div>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-8 pt-6">
            <h2 className="text-center text-3xl font-bold text-white">Confirm Withdrawal</h2>

            <div className="overflow-hidden rounded-3xl bg-surface p-1">
                <div className="rounded-[20px] border border-white/5 bg-black/40 p-6">
                    <div className="mb-6 text-center">
                        <p className="text-gray-400">You will receive</p>
                        <p className="text-4xl font-bold text-orange-500">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-gray-400">Agent</span>
                            <div className="text-right">
                                <p className="font-bold text-white">{agent?.fullName}</p>
                                <p className="text-xs text-gray-500">{agent?.uniqueId}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                             <span className="text-gray-400">Fee (2%)</span>
                             <span className="font-bold text-red-400">-{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(fee)}</span>
                        </div>
                        <div className="flex items-center justify-between pb-4">
                             <span className="text-gray-400">Total Deducted</span>
                             <span className="font-bold text-white">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-4 font-bold text-black shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.95]"
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
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
              <h2 className="text-3xl font-bold text-white">Withdrawal Complete!</h2>
              <p className="text-xl text-orange-500">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
              <p className="text-gray-400">Collect cash from {agent?.fullName}</p>
              <p className="text-sm text-gray-500 font-mono">Ref: {txRef}</p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full max-w-xs rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
            >
              Done
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <div className="p-4">
        <button 
            onClick={() => step === 'AGENT' || step === 'SUCCESS' ? navigate('/dashboard') : setStep('AGENT')}
            className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
            <ArrowLeft className="h-4 w-4" />
            Back
        </button>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
        {error && step !== 'CONFIRM' && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-center text-red-500">
             {error}
            </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
}

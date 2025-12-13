import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CashInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'SUCCESS'>('INPUT');
  const [error, setError] = useState('');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/payments/deposit', {
        amount: Number(amount),
        phone: phone
      });

      if (res.data.data.status === 'success') {
          if (res.data.data.data.auth_url) {
             // Redirect for real flows
             window.location.href = res.data.data.data.auth_url;
          } else {
             setStep('SUCCESS');
          }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-white">
      <div className="p-4">
        <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
            <ArrowLeft className="h-4 w-4" />
            Back
        </button>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
        {step === 'INPUT' && (
            <div className="space-y-8 pt-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                        <CreditCard className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Top Up Wallet</h2>
                    <p className="mt-2 text-gray-400">Add funds via Mobile Money or Card</p>
                </div>

                <form onSubmit={handleDeposit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-400">Amount (XAF)</label>
                        <div className="relative mt-2">
                            <span className="absolute left-4 top-4 text-xl font-bold text-gray-500">FCFA</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 pl-20 text-2xl font-bold text-white outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                                placeholder="0"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-400">Mobile Money Number</label>
                        <div className="relative mt-2">
                             <Smartphone className="absolute left-4 top-4 h-6 w-6 text-gray-500" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-4 pl-14 text-lg text-white outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    <div className="rounded-xl bg-surface/50 p-4 text-xs text-gray-500">
                        <p>Powered by <strong>Flutterwave</strong> (Simulated Mode). No real money will be charged.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        className="w-full rounded-2xl bg-green-500 py-4 font-bold text-black shadow-lg shadow-green-500/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Deposit Funds'}
                    </button>
                </form>
            </div>
        )}

        {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
                <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20 opacity-75"></div>
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-black">
                        <CheckCircle className="h-12 w-12" />
                        </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">Deposit Successful!</h2>
                    <p className="text-xl text-green-500">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}
                    </p>
                    <p className="text-gray-400">Has been added to your wallet.</p>
                </div>

                <div className="w-full rounded-2xl bg-surface p-4 text-left">
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-500">Transaction Ref</span>
                        <span className="font-mono text-white text-sm">DEP-{Date.now().toString().slice(-6)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-500">Payment Method</span>
                        <span className="text-white">Mobile Money</span>
                    </div>
                     <div className="flex justify-between py-2">
                        <span className="text-gray-500">Status</span>
                        <span className="text-green-500 font-bold">COMPLETED</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full max-w-xs rounded-2xl bg-surface py-4 font-semibold text-white hover:bg-surface/80"
                >
                    Done
                </button>
            </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Lock, Phone, CheckCircle, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function PayPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  // Form
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await api.get(`/v1/checkout/sessions/${sessionId}`);
      setSession(res.data);
    } catch (err: any) {
      setError('Invalid or expired payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const res = await api.post(`/v1/checkout/sessions/${sessionId}/pay`, {
        phone,
        pin
      });
      setSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface/30 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
          <p className="mt-2 text-gray-400">Your transaction has been confirmed.</p>
          
          <div className="mt-6 rounded-xl bg-black/40 p-4">
            <p className="text-sm text-gray-500">Transaction ID</p>
            <p className="font-mono text-white">{success.transactionId}</p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 h-64 w-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      {error && !session ? (
         <div className="z-10 rounded-xl bg-red-500/10 p-6 text-center text-red-500 border border-red-500/20">
           <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
           <p>{error}</p>
         </div>
      ) : (
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-surface/50 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="bg-white/5 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(212,255,0,0.3)]">
                    <span className="text-xl font-bold text-background">F</span>
                </div>
                <h2 className="text-lg font-medium text-gray-300">Pay to</h2>
                <h1 className="text-2xl font-bold text-white">{session.businessName}</h1>
            </div>

            <div className="p-8">
                {/* Amount Display */}
                <div className="mb-8 text-center">
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black tracking-tight text-primary">
                            {Number(session.amount).toLocaleString()}
                        </span>
                        <span className="text-xl font-medium text-gray-400">{session.currency}</span>
                    </div>
                    {session.description && (
                         <div className="mt-2 text-sm text-gray-400 bg-white/5 inline-block px-3 py-1 rounded-full">
                            {session.description}
                         </div>
                    )}
                </div>
                
                {/* Form */}
                <form onSubmit={handlePay} className="space-y-5">
                    {error && (
                        <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-500">
                           {error}
                        </div>
                    )}

                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Your Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                            required
                        />
                    </div>

                    <div className="group relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="password"
                            placeholder="Fiafio PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                            required
                            maxLength={4}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-2xl bg-primary py-4 font-bold text-background shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : 'Confirm Payment'}
                    </button>
                    
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                             <ShieldCheck className="h-3 w-3" />
                             <span>Secured by Fiafio Payments</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, User, Delete } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

type Step = 'RECIPIENT' | 'AMOUNT' | 'CONFIRM' | 'SUCCESS';

interface Recipient {
  id: number;
  phone: string;
  uniqueId?: string;
  fullName: string | null;
}

export default function TransferPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('RECIPIENT');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/users/find', { query: phone });
      const foundUser = res.data.user;

      if (user && foundUser.id === user.id) {
          setError("You cannot send money to yourself.");
          return;
      }

      setRecipient(foundUser);
      setStep('AMOUNT');
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/transfers/p2p', {
        receiverPhone: recipient?.phone,
        amount: Number(amount),
        description: description || 'P2P Transfer'
      });
      setStep('SUCCESS');
    } catch (err: any) {
      console.log('Transfer Error:', err.response)
      setError(JSON.stringify(err.response?.data || err.message));
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
      case 'RECIPIENT':
        return (
          <div className="space-y-8 pt-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">Send Money</h2>
              <p className="mt-2 text-gray-400">Find a recipient by phone or ID</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="group relative">
                <Search className="absolute left-4 top-4 h-6 w-6 text-gray-500 transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Enter Phone or ID"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-surface/50 px-14 py-4 text-lg text-white placeholder-gray-600 outline-none transition-all focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full rounded-2xl bg-white py-4 font-bold text-black shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Continue'}
              </button>
            </form>

            <div className="flex justify-center gap-4">
               {['USER01', 'USER02', '+237622222222'].map(p => (
                   <button key={p} onClick={() => setPhone(p)} className="rounded-full bg-surface px-4 py-2 text-xs text-gray-400 hover:text-primary">
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Sending to</h3>
                <p className="text-xl font-bold text-white">{recipient?.fullName}</p>
                 <p className="text-sm text-gray-500 font-mono">{recipient?.uniqueId || recipient?.phone}</p>
              </div>

              <div className="py-8">
                  <p className="text-5xl font-bold tracking-tighter text-primary">
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
                            className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-primary/20"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeypad('0')}
                        className="flex h-20 w-full items-center justify-center rounded-2xl bg-surface/30 text-2xl font-semibold text-white transition-colors hover:bg-surface/60 active:bg-primary/20"
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

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Add a note (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent text-center text-gray-500 placeholder-gray-700 outline-none"
                  />
                  <button
                    onClick={() => setStep('CONFIRM')}
                    disabled={!amount || Number(amount) <= 0}
                    className="w-full rounded-2xl bg-primary py-4 font-bold text-background shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    Review
                  </button>
                </div>
            </div>
          </div>
        );

      case 'CONFIRM':
        return (
          <div className="space-y-8 pt-6">
            <h2 className="text-center text-3xl font-bold text-white">Confirm</h2>

            <div className="overflow-hidden rounded-3xl bg-surface p-1">
                <div className="rounded-[20px] border border-white/5 bg-black/40 p-6">
                    <div className="mb-6 text-center">
                        <p className="text-gray-400">Total Amount</p>
                        <p className="text-4xl font-bold text-primary">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-gray-400">To</span>
                            <div className="text-right">
                                <p className="font-bold text-white">{recipient?.fullName}</p>
                                <p className="text-xs text-gray-500">{recipient?.uniqueId}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                             <span className="text-gray-400">Fee</span>
                             <span className="font-bold text-white">0 XAF</span>
                        </div>
                         {description && (
                            <div className="flex items-center justify-between pb-4">
                                <span className="text-gray-400">Note</span>
                                <span className="text-gray-300">{description}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
              onClick={handleTransfer}
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-black shadow-[0_0_30px_rgba(212,255,0,0.2)] transition-transform hover:scale-[1.02] active:scale-[0.95]"
            >
              {loading ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="flex flex-col items-center justify-center space-y-8 py-10 text-center">
            <div className="relative">
                 <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"></div>
                 <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-background">
                    <CheckCircle className="h-12 w-12" />
                 </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Sent!</h2>
              <p className="text-xl text-primary">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(Number(amount))}</p>
              <p className="text-gray-400">to {recipient?.fullName}</p>
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
            onClick={() => step === 'RECIPIENT' || step === 'SUCCESS' ? navigate('/dashboard') : setStep('RECIPIENT')}
            className="flex items-center gap-2 rounded-full bg-surface/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface hover:text-white"
        >
            <ArrowLeft className="h-4 w-4" />
            Back
        </button>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-6">
        {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-center text-red-500 break-words">
             {error} <br/>
             <span className="text-xs">{JSON.stringify(error)}</span>
            </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
}

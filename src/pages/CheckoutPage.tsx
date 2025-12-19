import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2, AlertTriangle, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CheckoutSession {
  id: string;
  merchant: {
    name: string;
    logo: string | null;
  };
  amount: number;
  currency: string;
  description: string | null;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  success_url: string | null;
  cancel_url: string | null;
  can_be_paid: boolean;
}

export default function CheckoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/v1/checkout/sessions/${sessionId}`);
        setSession(res.data.session);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Session introuvable');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePay = async () => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/checkout/${sessionId}`);
      return;
    }

    setPaying(true);
    setError('');

    try {
      const res = await api.post(`/v1/checkout/sessions/${sessionId}/pay`);
      setSuccess(true);
      
      // Redirect to success URL after short delay
      if (res.data.redirect_url) {
        setTimeout(() => {
          window.location.href = res.data.redirect_url;
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Échec du paiement');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await api.post(`/v1/checkout/sessions/${sessionId}/cancel`);
      if (res.data.redirect_url) {
        window.location.href = res.data.redirect_url;
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Cancel failed', err);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold text-white">Erreur</h1>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-surface px-6 py-3 font-medium text-white hover:bg-accent"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!session) return null;

  // Session expired
  if (session.status === 'expired') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Clock className="mb-4 h-16 w-16 text-orange-500" />
        <h1 className="mb-2 text-2xl font-bold text-white">Session expirée</h1>
        <p className="text-gray-400">Cette session de paiement a expiré.</p>
        {session.cancel_url && (
          <a
            href={session.cancel_url}
            className="mt-6 rounded-xl bg-surface px-6 py-3 font-medium text-white hover:bg-accent"
          >
            Retour au site
          </a>
        )}
      </div>
    );
  }

  // Session cancelled
  if (session.status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <XCircle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold text-white">Paiement annulé</h1>
        <p className="text-gray-400">Cette session de paiement a été annulée.</p>
        {session.cancel_url && (
          <a
            href={session.cancel_url}
            className="mt-6 rounded-xl bg-surface px-6 py-3 font-medium text-white hover:bg-accent"
          >
            Retour au site
          </a>
        )}
      </div>
    );
  }

  // Session already paid
  if (session.status === 'completed' || success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Paiement réussi !</h1>
        <p className="mb-2 text-gray-400">
          Vous avez payé {formatCurrency(session.amount, session.currency)} à {session.merchant.name}
        </p>
        {session.success_url && (
          <>
            <p className="text-sm text-gray-500">Redirection en cours...</p>
            <a
              href={session.success_url}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-black hover:bg-green-400"
            >
              Continuer
            </a>
          </>
        )}
      </div>
    );
  }

  // Pending - show payment form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/50 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          {session.merchant.logo ? (
            <img
              src={session.merchant.logo}
              alt={session.merchant.name}
              className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-8 w-8" />
            </div>
          )}
          <h2 className="text-lg font-medium text-gray-400">{session.merchant.name}</h2>
        </div>

        {/* Amount */}
        <div className="mb-6 rounded-xl bg-primary/10 p-6 text-center">
          <p className="mb-1 text-sm text-gray-400">Montant à payer</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(session.amount, session.currency)}
          </p>
          {session.description && (
            <p className="mt-2 text-sm text-gray-400">{session.description}</p>
          )}
        </div>

        {/* User Info or Login Prompt */}
        {user ? (
          <div className="mb-6 rounded-xl bg-white/5 p-4">
            <p className="mb-1 text-sm text-gray-400">Payer depuis</p>
            <p className="font-medium text-white">{user.fullName || user.phone}</p>
            <p className="text-xs text-gray-500">{user.uniqueId}</p>
          </div>
        ) : (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <p className="text-sm text-blue-400">
              Connectez-vous à votre compte Fiafio pour effectuer le paiement
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePay}
            disabled={paying || !session.can_be_paid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-black transition hover:bg-green-400 disabled:opacity-50"
          >
            {paying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Traitement...
              </>
            ) : user ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Payer {formatCurrency(session.amount, session.currency)}
              </>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5" />
                Se connecter pour payer
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            className="w-full rounded-xl bg-white/5 py-3 font-medium text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            Annuler
          </button>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          🔒 Paiement sécurisé par Fiafio
        </p>
      </div>
    </div>
  );
}

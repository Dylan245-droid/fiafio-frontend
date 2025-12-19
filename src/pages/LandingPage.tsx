import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Globe, ArrowRight, Check, 
  Code, Wallet, BarChart3, Send, CreditCard, BookOpen
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import FloatingShapes from '../components/FloatingShapes';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: Send,
      title: "Transferts Instantanés",
      description: "Envoyez de l'argent en quelques secondes à n'importe qui avec un simple numéro."
    },
    {
      icon: Shield,
      title: "100% Sécurisé",
      description: "Transactions chiffrées et sécurisées. Votre argent est protégé."
    },
    {
      icon: Globe,
      title: "Multi-devises",
      description: "XAF, EUR, USD. Gérez plusieurs devises depuis un seul compte."
    },
    {
      icon: Zap,
      title: "Rapide & Simple",
      description: "Interface intuitive. Pas besoin de compte bancaire."
    },
    {
      icon: Code,
      title: "API Marchands",
      description: "Intégrez Fiafio à votre business et acceptez les paiements en ligne."
    },
    {
      icon: BarChart3,
      title: "Suivi en Temps Réel",
      description: "Historique complet de vos transactions, accessible à tout moment."
    }
  ];

  const accountTypes = [
    { 
      icon: Wallet, 
      title: "Particulier", 
      desc: "Envoyer et recevoir de l'argent",
      color: "bg-blue-500"
    },
    { 
      icon: CreditCard, 
      title: "Agent", 
      desc: "Effectuer dépôts et retraits",
      color: "bg-orange-500"
    },
    { 
      icon: Code, 
      title: "Marchand", 
      desc: "Accepter les paiements en ligne",
      color: "bg-purple-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-black font-sans text-white overflow-hidden">
      {/* Background Glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />
      <div className="pointer-events-none fixed right-0 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" />
      
      {/* 3D Floating Shapes */}
      <FloatingShapes />

      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/fiafio_logo.png" 
                alt="Fiafio" 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain shadow-[0_0_20px_rgba(212,255,0,0.2)]"
              />
              <span className="text-xl sm:text-2xl font-bold">Fiafio</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={() => navigate('/developers')}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-primary transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Docs API
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="hidden sm:block px-4 py-2 sm:px-5 sm:py-2.5 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
              >
                Connexion
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-black rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all hover:scale-105 shadow-lg shadow-primary/20"
              >
                <span className="sm:hidden">Créer</span>
                <span className="hidden sm:inline">Créer un compte</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <ScrollReveal animation="fade-in" delay={0}>
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm mb-8">
              <Zap className="w-4 h-4 mr-2" />
              Paiements mobiles pour l'Afrique
            </div>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              L'argent mobile,{' '}
              <span className="text-primary">
                simplifié
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
              Envoyez, recevez et gérez votre argent en toute simplicité. 
              Particuliers, agents ou marchands — Fiafio s'adapte à vos besoins.
            </p>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/register')}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group px-8 py-4 bg-primary text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/30 flex items-center"
              >
                Commencer maintenant
                <ArrowRight className={`ml-2 w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-surface border border-white/10 hover:border-primary/30 text-white rounded-2xl font-semibold text-lg transition-all"
              >
                J'ai déjà un compte
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* Account Types Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountTypes.map((type, index) => (
            <ScrollReveal key={type.title} animation="scale" delay={400 + index * 100}>
              <div 
                onClick={() => navigate('/register')}
                className="group p-6 bg-surface/50 border border-white/10 rounded-2xl hover:border-primary/30 hover:bg-surface transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{type.title}</h3>
                <p className="text-gray-500 text-sm">{type.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                Pourquoi choisir Fiafio ?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Une solution complète pour vos transactions financières
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={index * 80}>
                <div className="group p-5 bg-surface/50 border border-white/5 rounded-2xl hover:border-primary/20 transition-all h-full">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Consumer Section - Pour les particuliers */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-4">
                POUR LES PARTICULIERS
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Votre argent, simplement
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Les avantages Fiafio pour tous les jours
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { 
                emoji: '💸', 
                title: 'Envoyer de l\'argent', 
                desc: 'Transférez à vos proches instantanément, juste avec leur numéro.' 
              },
              { 
                emoji: '🏪', 
                title: 'Payer vos achats', 
                desc: 'Payez chez les marchands partenaires sans espèces.' 
              },
              { 
                emoji: '💵', 
                title: 'Dépôts & Retraits', 
                desc: 'Déposez ou retirez du cash via nos agents de proximité.' 
              },
              { 
                emoji: '📊', 
                title: 'Gérer votre budget', 
                desc: 'Suivez vos dépenses avec un historique clair et détaillé.' 
              },
            ].map((item, index) => (
              <ScrollReveal key={item.title} animation="fade-up" delay={index * 80}>
                <div className="p-5 bg-surface/50 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all h-full">
                  <span className="text-3xl mb-3 block">{item.emoji}</span>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal animation="fade-up" delay={400}>
            <div className="mt-10 text-center">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                Ouvrir mon compte gratuitement
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Merchant API Section */}
      <section className="relative z-10 py-20 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="slide-left">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center px-3 py-1 bg-primary/20 rounded-full text-primary text-xs font-medium mb-4">
                    API MARCHANDS
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Intégrez Fiafio à votre business
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Acceptez les paiements en ligne avec une API simple. 
                    Frais transparents : <span className="text-primary font-semibold">25 XAF + 1.5%</span> par transaction.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {['API RESTful simple', 'Webhooks en temps réel', 'Dashboard marchand complet', 'Support technique'].map((item) => (
                      <li key={item} className="flex items-center">
                        <Check className="w-4 h-4 text-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-primary text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/30"
                  >
                    Devenir Marchand
                  </button>
                  <button 
                    onClick={() => navigate('/developers')}
                    className="px-8 py-3 border border-primary/50 text-primary rounded-2xl font-semibold transition-all hover:bg-primary/10 flex items-center justify-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    Voir la documentation
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Developer Section */}
      <section className="relative z-10 py-20 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-3 py-1 bg-primary/20 rounded-full text-primary text-xs font-medium mb-4">
                POUR LES DÉVELOPPEURS
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Intégration simple et rapide
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                Notre API RESTful vous permet d'accepter les paiements en quelques lignes de code
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <ScrollReveal animation="slide-left">
              <div className="rounded-2xl bg-black/50 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2 font-mono">checkout.js</span>
                </div>
                <pre className="p-5 overflow-x-auto text-sm">
                  <code className="text-gray-300 font-mono">{`// Créer une session de paiement
const response = await fetch(
  'https://api.fiafio.com/api/v1/checkout/sessions',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'sk_live_xxx'
    },
    body: JSON.stringify({
      amount: 5000,
      currency: 'XAF',
      description: 'Achat #123'
    })
  }
);

const data = await response.json();
// Redirigez vers data.session.checkout_url`}</code>
                </pre>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="slide-right">
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    { icon: Code, title: 'API RESTful', desc: 'Requêtes HTTP simples avec JSON' },
                    { icon: Zap, title: 'Webhooks temps réel', desc: 'Notifications instantanées de paiement' },
                    { icon: Shield, title: 'Mode Test', desc: 'Testez sans frais avant la mise en prod' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{title}</h4>
                        <p className="text-gray-500 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => navigate('/developers')}
                    className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                  >
                    <BookOpen className="w-4 h-4" />
                    Voir la documentation
                  </button>
                  <button 
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-all"
                  >
                    Créer un compte
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <ScrollReveal animation="fade-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-gray-400 mb-8">
              Créez votre compte en moins de 2 minutes et rejoignez la communauté Fiafio.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-primary text-black rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/30"
            >
              Créer mon compte gratuitement
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/fiafio_logo.png" 
                alt="Fiafio" 
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="text-lg font-bold">Fiafio</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={() => navigate('/developers')} className="hover:text-primary transition-colors">
                Documentation API
              </button>
            </div>
            <div className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Fiafio. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

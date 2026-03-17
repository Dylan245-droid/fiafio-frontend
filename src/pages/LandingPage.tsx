import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Shield, ArrowRight, Check,
  Smartphone, Users, ChevronRight,
  Database, Globe, Code, Menu, X
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import FloatingShapes from '../components/FloatingShapes';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper to get dashboard path based on role
  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'AGENT') return '/agent';
    return '/dashboard';
  };

  const [liveStats, setLiveStats] = useState({
    totalUsers: 0,
    monthlyVolume: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/public/stats');
        setLiveStats(res.data);
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();
  }, []);


  // Base offsets for "No Bullshit" scale while using real increments
  const BASE_USERS = 2500;
  const BASE_VOLUME = 150000000; // 150M

  const displayUsersCount = BASE_USERS + liveStats.totalUsers;
  const displayVolumeValue = BASE_VOLUME + liveStats.monthlyVolume;

  const stats = [
    { label: "Utilisateurs", value: `${(displayUsersCount / 1000).toFixed(1)}k+` },
    { label: "Volume Mensuel", value: `${(displayVolumeValue / 1000000).toFixed(0)}M+ XAF` },
    { label: "Disponibilité", value: "99.9%" },
  ];

  const fees = [
    { service: "Dépôt (Cash-In)", fee: "0%", note: "Gratuit partout" },
    { service: "Transfert P2P", fee: "0%", note: "Entre comptes Fiafio" },
    { service: "Retrait (Cash-Out)", fee: "2.0%", note: "1.2% à l'agent local" },
    { service: "Paiement Marchand", fee: "1.5%", note: "+25 XAF par transaction" },
  ];

  const valueProps = [
    {
      role: "Particuliers",
      title: "L'argent mobile, enfin sécurisé.",
      desc: "Envoyez instantanément. Votre solde est protégé par un ledger immuable.",
      features: ["Transferts gratuits", "Paiements QR", "Audit-ready"],
      cta: "Découvrir",
      icon: Users,
      color: "from-blue-500/20 to-cyan-500/10"
    },
    {
      role: "Agents & Réseaux",
      title: "Gérez votre propre business.",
      desc: "Devenez le point central de votre quartier. Commissions garanties à 1.2%.",
      features: ["Commissions instantanées", "Limites illimitées", "Support 24/7"],
      cta: "Devenir Agent",
      icon: Smartphone,
      color: "from-orange-500/20 to-yellow-500/10"
    },
    {
      role: "Entreprises (SAAS)",
      title: "Infrastructure de paiement.",
      desc: "Intégrez Fiafio à votre app. API robuste et webhooks basés sur SHA-256.",
      features: ["API RESTful", "Checkout UI", "Gestion de trésorerie"],
      cta: "Espace Marchand",
      path: "/merchants",
      icon: Database,
      color: "from-primary/20 to-primary/5"
    }
  ];

  const partners = [
    {
      name: "GoTchop",
      logoDark: "/partners/gotchop_dark.png", // logo_dark (Texte blanc) pour Dark mode
      logoLight: "/partners/gotchop_light.png", // logo_light (Texte dark) pour Light mode
      url: "https://food.jool-sup.com",
      type: "image"
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <FloatingShapes />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.3)] group-hover:rotate-6 transition-transform">
              <img src="/fiafio_logo.png" alt="" className="w-6 h-6 sm:w-8 sm:h-8 rounded-md" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">FIAFIO</span>
          </div>

          <div className="hidden lg:flex items-center space-x-8 text-sm font-medium text-gray-400">
            <a href="#transparency" className="hover:text-primary transition-colors">Transparence</a>
            <a href="#ecosystem" className="hover:text-primary transition-colors">Écosystème</a>
            <button onClick={() => navigate('/merchants')} className="hover:text-primary transition-colors">Marchands</button>
            <button onClick={() => navigate('/developers')} className="hover:text-primary transition-colors">Développeurs</button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <button 
                onClick={() => navigate(getDashboardPath())} 
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-black rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Mon Espace
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hidden sm:block px-4 py-2 text-sm font-semibold hover:text-primary transition-colors">
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-black rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Rejoindre
                </button>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 p-6 space-y-6 animate-fade-in themed-mobile-menu">
            <div className="flex flex-col space-y-4 text-lg font-bold text-white">
              <a href="#transparency" onClick={() => setIsMenuOpen(false)} className="hover:text-primary">Transparence</a>
              <a href="#ecosystem" onClick={() => setIsMenuOpen(false)} className="hover:text-primary">Écosystème</a>
              <button onClick={() => { navigate('/merchants'); setIsMenuOpen(false); }} className="text-left hover:text-primary">Marchands</button>
              <button onClick={() => { navigate('/developers'); setIsMenuOpen(false); }} className="text-left hover:text-primary">Développeurs</button>
            </div>
            <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
              {isAuthenticated ? (
                 <button onClick={() => { navigate(getDashboardPath()); setIsMenuOpen(false); }} className="w-full py-3 bg-primary text-black rounded-xl font-bold">Mon Espace</button>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="w-full py-3 bg-white/5 rounded-xl font-bold text-white">Connexion</button>
                  <button onClick={() => { navigate('/register'); setIsMenuOpen(false); }} className="w-full py-3 bg-primary text-black rounded-xl font-bold">Rejoindre</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative pt-16 sm:pt-24 lg:pt-32 pb-12">
        <section className="max-w-7xl mx-auto px-4 text-center">
          <ScrollReveal animation="fade-in" delay={0}>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-mono text-primary mb-6 sm:mb-8 tracking-widest uppercase">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Audit-Ready Infrastructure
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-[1.1] sm:leading-[0.9]">
              L'argent mobile,<br />
              <span className="text-primary italic">enfin auditable.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
              Fiafio n'est pas qu'une app, c'est un protocole financier.
              Double-entry ledger, chaînage SHA-256 et transparence absolue sur les frais.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 bg-primary text-black rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all hover:scale-105 shadow-xl flex items-center justify-center"
              >
                Commencer
                <ArrowRight className={`ml-2 w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </button>
              <div className="flex items-center space-x-4 bg-white/5 p-2 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background bg-gray-800" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-500 px-1 font-medium">Rejoint par +{displayUsersCount.toLocaleString()} utilisateurs</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats Grid - Narrower for better focus */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} animation="fade-up" delay={400 + (i * 100)}>
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Trust / Partners Section - Static and Clear */}
          <div className="mt-12 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-10 items-center flex gap-4">
              <span className="h-px w-8 bg-white/10" />
              Ils nous font confiance
              <span className="h-px w-8 bg-white/10" />
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-20">
              {partners.map((partner: any, index) => (
                <div key={index}>
                  {partner.type === 'image' ? (
                    <a 
                      href={partner.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block"
                    >
                      <img 
                        src={theme === 'dark' ? partner.logoDark : partner.logoLight} 
                        alt={partner.name} 
                        className="h-16 sm:h-20 w-auto object-contain" 
                      />
                    </a>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        {partner.icon && <partner.icon className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{partner.name}</p>
                        {partner.subtitle && <p className="text-[8px] font-mono text-gray-600 uppercase">{partner.subtitle}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency Section */}
        <section id="transparency" className="max-w-7xl mx-auto px-4 mt-16 sm:mt-24">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            <ScrollReveal animation="slide-left">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight">
                  No Bullshit Pricing.<br />
                  <span className="text-primary opacity-50 underline decoration-2 underline-offset-8">Transparence Totale.</span>
                </h2>
                <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl">
                  Nous ne cachons rien derrière des "frais de service" flous.
                  Notre ledger immuable enregistre chaque XAF sortant, pour vous et pour nous.
                </p>
                <div className="flex items-center space-x-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl">
                  <Shield className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
                  <p className="text-xs sm:text-sm text-blue-300 font-medium">
                    <strong>Audit-Ready:</strong> Chaque transaction est hashée en SHA-256 et chaînée. Impossible à falsifier.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="slide-right">
              <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-5 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Grille des frais active</span>
                  <div className="flex space-x-1.5 font-mono text-[10px] text-primary">
                    <Check className="w-3 h-3" /> <span>Real-time Ledger</span>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {fees.map((f) => (
                    <div key={f.service} className="p-4 sm:p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="text-base sm:text-lg font-bold text-white mb-0.5">{f.service}</div>
                        <div className="text-[11px] sm:text-sm text-gray-500">{f.note}</div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-primary">{f.fee}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 sm:p-5 bg-primary/5 text-center italic text-xs sm:text-sm text-primary/70 border-t border-primary/10">
                  Transactions P2P nationales gratuites à vie.
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section id="ecosystem" className="max-w-7xl mx-auto px-4 mt-16 sm:mt-24">
          <div className="text-center mb-12 sm:mb-16 px-4">
            <ScrollReveal animation="fade-up">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4">Un écosystème en expansion.</h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                Fiafio s'adapte à votre réalité. Que vous soyez un particulier, un agent ou une startup technologique.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {valueProps.map((p, i) => (
              <ScrollReveal key={p.role} animation="fade-up" delay={i * 100}>
                <div className={`group relative h-full p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br ${p.color} border border-white/5 hover:border-white/10 transition-all cursor-pointer overflow-hidden flex flex-col`}>
                  <div className="absolute top-0 right-0 p-6 sm:p-8 text-white/5 group-hover:text-white/10 transition-colors hidden sm:block">
                    <p.icon className="w-16 h-16 sm:w-24 sm:h-24 rotate-12" />
                  </div>

                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                      <p.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-[10px] sm:text-sm font-mono text-primary uppercase tracking-widest mb-2">{p.role}</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 group-hover:text-primary transition-colors leading-tight">{p.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {p.desc}
                    </p>
                    <ul className="space-y-3 mb-8">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center text-sm font-medium text-gray-300">
                          <Check className="w-4 h-4 text-primary mr-2 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => p.path ? navigate(p.path) : navigate('/register')}
                      className="w-full py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group-hover:bg-primary group-hover:text-black shadow-lg text-sm sm:text-base"
                    >
                      {p.cta}
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Developer Teaser */}
        <section className="max-w-7xl mx-auto px-4 mt-16 sm:mt-24">
          <div className="p-8 lg:p-12 rounded-3xl sm:rounded-[3rem] bg-[#0A0A0A] border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 blur-[120px]" />
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 items-center relative z-10">
              <ScrollReveal animation="slide-left">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono tracking-widest text-primary mb-6">
                    <Code className="w-3 h-3" />
                    <span>BUILT FOR DEVELOPERS</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 leading-none">L'API de paiement<br /><span className="text-white/80">sans friction.</span></h2>
                  <p className="text-gray-400 text-sm sm:text-lg mb-8 max-w-lg leading-relaxed">
                    Intégrez Fiafio Checkout en quelques minutes. RESTful, webhooks signés et mode Sandbox pour tester sans limites.
                  </p>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <button onClick={() => navigate('/developers')} className="flex-1 sm:flex-none px-6 sm:px-8 py-4 bg-primary text-black rounded-xl sm:rounded-2xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm sm:text-base">
                      Documentation <Globe className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate('/merchants')} className="flex-1 sm:flex-none px-6 sm:px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base">
                      Dashboard
                    </button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="slide-right">
                <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    <span className="text-[10px] font-mono text-gray-500 ml-2">fiafio.sh</span>
                  </div>
                  <div className="p-5 sm:p-8 font-mono text-[11px] sm:text-sm leading-relaxed overflow-x-auto bg-black/40 backdrop-blur-sm">
                    <div className="flex gap-4">
                      <span className="text-gray-700">1</span>
                      <span className="text-primary">curl</span>
                      <span className="text-white">-X POST /sessions \</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-700">2</span>
                      <span className="text-blue-400">  -H "Auth: Bearer sk_..." \</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-700">3</span>
                      <span className="text-orange-400">  -d "amount=5000" \</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-700">4</span>
                      <span className="text-orange-400">  -d "currency=XAF"</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 mt-16 sm:mt-24 text-center pb-8 sm:pb-0">
          <ScrollReveal animation="scale">
            <div className="cta-banner p-10 sm:p-20 rounded-3xl sm:rounded-[3rem] border relative overflow-hidden group shadow-2xl dark:shadow-none">
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.03] transition-opacity" />
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8 relative z-10 leading-tight text-white">Prêt pour la réalité<br />du Mobile Money ?</h2>
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-primary text-black rounded-xl sm:rounded-3xl font-black text-lg sm:text-xl hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10"
              >
                Ouvrir un compte GRATUIT
              </button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img src="/fiafio_logo.png" alt="" className="w-8 h-8" />
                <span className="text-xl font-bold uppercase tracking-widest">FIAFIO</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Infrastructure de paiement mobile de nouvelle génération pour l'Afrique.
                Sécurité cryptographique, transparence totale.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Produit</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary">Fonctionnement</a></li>
                <li><a href="#" className="hover:text-primary">Frais & Limites</a></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-primary">Connexion</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Business</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><button onClick={() => navigate('/merchants')} className="hover:text-primary transition-colors">Marchands</button></li>
                <li><button onClick={() => navigate('/developers')} className="hover:text-primary transition-colors">Développeurs</button></li>
                <li><a href="#" className="hover:text-primary">Devenir Agent</a></li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h4 className="font-bold text-white mb-6">Social</h4>
              <div className="flex space-x-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 cursor-pointer transition-colors" />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-gray-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            <p>© {new Date().getFullYear()} FIAFIO PROTOCOL. ALL RIGHTS RESERVED.</p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Audit Logs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

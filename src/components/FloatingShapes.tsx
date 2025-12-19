import { useEffect, useState } from 'react';

export default function FloatingShapes() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary floating cube */}
      <div
        className="absolute right-[10%] top-[15%] h-24 w-24 opacity-30"
        style={{
          transform: `translateY(${scrollY * 0.1}px) rotateX(${45 + scrollY * 0.05}deg) rotateY(${45 + scrollY * 0.05}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="relative h-full w-full animate-float" style={{ transformStyle: 'preserve-3d' }}>
          {/* Cube faces */}
          <div className="absolute inset-0 border-2 border-primary/40 bg-primary/10 backdrop-blur-sm" 
               style={{ transform: 'translateZ(48px)' }} />
          <div className="absolute inset-0 border-2 border-primary/40 bg-primary/10 backdrop-blur-sm" 
               style={{ transform: 'rotateY(180deg) translateZ(48px)' }} />
          <div className="absolute inset-0 border-2 border-primary/40 bg-primary/10 backdrop-blur-sm" 
               style={{ transform: 'rotateY(90deg) translateZ(48px)' }} />
          <div className="absolute inset-0 border-2 border-primary/40 bg-primary/10 backdrop-blur-sm" 
               style={{ transform: 'rotateY(-90deg) translateZ(48px)' }} />
        </div>
      </div>

      {/* Secondary floating ring */}
      <div
        className="absolute left-[5%] top-[40%] h-32 w-32 opacity-20"
        style={{
          transform: `translateY(${scrollY * -0.08}px) rotate(${scrollY * 0.1}deg)`,
        }}
      >
        <div className="h-full w-full animate-spin-slow rounded-full border-4 border-dashed border-primary/50" />
      </div>

      {/* Floating pyramid/triangle */}
      <div
        className="absolute right-[15%] bottom-[30%] opacity-25"
        style={{
          transform: `translateY(${scrollY * 0.05}px) rotateZ(${scrollY * 0.02}deg)`,
        }}
      >
        <div className="animate-float-delayed">
          <svg width="80" height="80" viewBox="0 0 80 80" className="text-primary">
            <polygon 
              points="40,5 75,70 5,70" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              opacity="0.6"
            />
            <polygon 
              points="40,20 60,60 20,60" 
              fill="currentColor" 
              opacity="0.1"
            />
          </svg>
        </div>
      </div>

      {/* Floating circle */}
      <div
        className="absolute left-[20%] bottom-[20%] h-16 w-16 opacity-20"
        style={{
          transform: `translateY(${scrollY * 0.12}px)`,
        }}
      >
        <div className="h-full w-full animate-pulse rounded-full border-2 border-primary/60 bg-primary/5" />
      </div>

      {/* Small dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-primary/40"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            transform: `translateY(${scrollY * (0.03 + i * 0.02)}px)`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* Keyframes via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate3d(1, 1, 1, 0deg); }
          50% { transform: translateY(-20px) rotate3d(1, 1, 1, 10deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

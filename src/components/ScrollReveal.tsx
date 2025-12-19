import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'scale' | 'slide-left' | 'slide-right';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Animate both ways (entering and leaving)
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  const getAnimationStyles = () => {
    const base = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
    };

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return { ...base, opacity: 0, transform: 'translateY(40px)' };
        case 'fade-in':
          return { ...base, opacity: 0 };
        case 'scale':
          return { ...base, opacity: 0, transform: 'scale(0.9)' };
        case 'slide-left':
          return { ...base, opacity: 0, transform: 'translateX(-50px)' };
        case 'slide-right':
          return { ...base, opacity: 0, transform: 'translateX(50px)' };
        default:
          return { ...base, opacity: 0 };
      }
    }

    return { ...base, opacity: 1, transform: 'translateY(0) translateX(0) scale(1)' };
  };

  return (
    <div ref={ref} style={getAnimationStyles()} className={className}>
      {children}
    </div>
  );
}

// Stagger animation wrapper for lists
interface StaggerContainerProps {
  children: ReactNode[];
  staggerDelay?: number;
  animation?: 'fade-up' | 'fade-in' | 'scale';
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  animation = 'fade-up',
  className = '',
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollReveal key={index} animation={animation} delay={index * staggerDelay}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

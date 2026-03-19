import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: any) => void;
}

export default function BottomNav({ items, activeId, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Dynamic Background Blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-white/5" />
      
      <div className="relative flex items-center justify-around h-20 px-4 pb-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 group transition-all"
            >
              {isActive && (
                <div className="absolute -top-1 w-12 h-1 bg-primary rounded-full blur-[2px] shadow-[0_0_10px_#d4ff00]" />
              )}
              
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-500 group-active:scale-90'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

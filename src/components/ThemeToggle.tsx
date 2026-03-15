import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-full transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-surface hover:bg-accent text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      } ${className}`}
      title={theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        {/* Moon icon */}
        <Moon 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`} 
        />
      </div>
    </button>
  );
}

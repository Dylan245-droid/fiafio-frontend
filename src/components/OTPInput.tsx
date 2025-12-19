import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OTPInput({ 
  length = 6, 
  onComplete, 
  disabled = false,
  error 
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newValues = [...values];
    newValues[index] = value.slice(-1); // Take only last digit
    setValues(newValues);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const code = newValues.join('');
    if (code.length === length && !newValues.includes('')) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData.length === 0) return;

    const newValues = [...values];
    for (let i = 0; i < pastedData.length; i++) {
      newValues[i] = pastedData[i];
    }
    setValues(newValues);

    // Focus appropriate input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Check if complete
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              h-14 w-12 rounded-xl border-2 bg-surface text-center text-2xl font-bold text-white
              transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
              ${error ? 'border-red-500 shake' : 'border-white/10'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

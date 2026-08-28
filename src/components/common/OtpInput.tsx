import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}) => {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Digits array of length 4
  const digits = [
    value[0] || '',
    value[1] || '',
    value[2] || '',
    value[3] || '',
  ];

  useEffect(() => {
    // Auto-focus first empty input or first box on mount
    const firstEmptyIndex = digits.findIndex(d => !d);
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    if (!disabled && inputRefs[targetIndex]?.current) {
      inputRefs[targetIndex].current?.focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Only accept numeric characters
    const numericChar = rawVal.replace(/[^0-9]/g, '');

    if (!numericChar) {
      // User deleted character
      const newDigits = [...digits];
      newDigits[index] = '';
      const newOtp = newDigits.join('');
      onChange(newOtp);
      return;
    }

    // Take the last entered character if multiple were entered in one box
    const char = numericChar.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Auto-advance to next box if available
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    } else {
      // Completed all 4 boxes
      inputRefs[index].current?.blur();
      if (newOtp.length === 4 && onComplete) {
        onComplete(newOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current box is already empty, jump to previous box and clear it
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const newOtp = newDigits.join('');
        onChange(newOtp);
        inputRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numericOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 4);

    if (numericOnly) {
      onChange(numericOnly);
      // Focus appropriate box
      if (numericOnly.length === 4) {
        inputRefs[3].current?.focus();
        if (onComplete) {
          onComplete(numericOnly);
        }
      } else {
        inputRefs[numericOnly.length]?.current?.focus();
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 select-none">
      {[0, 1, 2, 3].map((index) => {
        const isFilled = !!digits[index];
        return (
          <div key={index} className="relative">
            <input
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2} // Allows catching fast typed input before slicing
              value={digits[index]}
              disabled={disabled}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-14 h-16 sm:w-16 sm:h-20 text-center font-mono text-2xl sm:text-3xl font-bold rounded-2xl transition-all duration-200 outline-none
                ${
                  hasError
                    ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : isFilled
                    ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                    : 'bg-slate-900/80 border border-slate-700/80 text-white hover:border-slate-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label={`Digit ${index + 1} of 4`}
            />
            {/* Subtle bottom indicator dot */}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors ${
                isFilled ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

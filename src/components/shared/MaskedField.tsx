// MaskedField Component
// Simple component to display sensitive data with a toggle to reveal/hide
// Solo user app - no audit logging needed, just convenient for screensharing

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedFieldProps {
  /** The full, unmasked value */
  value: string | number | null | undefined;
  /** The masked version to display by default */
  maskedValue: string;
  /** Optional CSS classes */
  className?: string;
  /** Show reveal button (default: true) */
  showToggle?: boolean;
  /** Auto-hide after revealing (in milliseconds, 0 = no auto-hide) */
  autoHideDelay?: number;
}

export function MaskedField({
  value,
  maskedValue,
  className = '',
  showToggle = true,
  autoHideDelay = 0,
}: MaskedFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleToggle = () => {
    setIsRevealed(!isRevealed);

    // Auto-hide after delay if enabled and revealing
    if (!isRevealed && autoHideDelay > 0) {
      setTimeout(() => {
        setIsRevealed(false);
      }, autoHideDelay);
    }
  };

  const displayValue = isRevealed ? (value?.toString() || '') : maskedValue;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-sm">
        {displayValue}
      </span>
      {showToggle && (
        <button
          onClick={handleToggle}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label={isRevealed ? 'Hide sensitive data' : 'Reveal sensitive data'}
          type="button"
        >
          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
      {isRevealed && autoHideDelay > 0 && (
        <span className="text-xs text-yellow-500">
          (auto-hides in {autoHideDelay / 1000}s)
        </span>
      )}
    </div>
  );
}

// Convenience wrapper components for common use cases

interface MaskedAccountNumberProps {
  accountNumber: string | null | undefined;
  className?: string;
}

export function MaskedAccountNumber({ accountNumber, className }: MaskedAccountNumberProps) {
  const masked = accountNumber && accountNumber.length >= 4
    ? '****' + accountNumber.slice(-4)
    : '****';

  return (
    <MaskedField
      value={accountNumber}
      maskedValue={masked}
      className={className}
      autoHideDelay={30000} // 30 seconds
    />
  );
}

interface MaskedCurrencyProps {
  amount: number | null | undefined;
  className?: string;
  showLastDigits?: number;
}

export function MaskedCurrency({ amount, className, showLastDigits = 3 }: MaskedCurrencyProps) {
  if (amount === null || amount === undefined) {
    return <span className={className}>$***</span>;
  }

  const amountStr = Math.abs(amount).toFixed(2);
  const [dollars, cents] = amountStr.split('.');

  let masked = '$***';
  if (dollars.length > showLastDigits) {
    const maskedDollars = '*'.repeat(dollars.length - showLastDigits) + dollars.slice(-showLastDigits);
    masked = `$${amount < 0 ? '-' : ''}${maskedDollars}.${cents}`;
  } else {
    masked = `$${amount < 0 ? '-' : ''}${amountStr}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  return (
    <MaskedField
      value={formatted}
      maskedValue={masked}
      className={className}
      autoHideDelay={30000} // 30 seconds
    />
  );
}

interface MaskedEmailProps {
  email: string | null | undefined;
  className?: string;
}

export function MaskedEmail({ email, className }: MaskedEmailProps) {
  let masked = '***@***.com';
  if (email && email.includes('@')) {
    const [localPart, domain] = email.split('@');
    masked = localPart.length > 1
      ? `${localPart[0]}***@${domain}`
      : `${localPart[0]}***@${domain}`;
  }

  return (
    <MaskedField
      value={email}
      maskedValue={masked}
      className={className}
    />
  );
}

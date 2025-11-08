// Data Masking Utilities
// Used to hide sensitive information in the UI (useful for screensharing, demos, etc.)

/**
 * Masks an account number, showing only the last 4 digits
 * @example maskAccountNumber("123456789") → "****6789"
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '****' + accountNumber.slice(-4);
}

/**
 * Masks an email address, showing first char and domain
 * @example maskEmail("john@example.com") → "j***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) return `${localPart[0]}***@${domain}`;
  return `${localPart[0]}***@${domain}`;
}

/**
 * Masks a credit card number, showing only the last 4 digits
 * @example maskCreditCard("4532123456789012") → "**** **** **** 9012"
 */
export function maskCreditCard(cardNumber: string | null | undefined): string {
  if (!cardNumber || cardNumber.length < 4) return '**** **** **** ****';
  const cleaned = cardNumber.replace(/\s/g, '');
  return '**** **** **** ' + cleaned.slice(-4);
}

/**
 * Masks a social security number, showing only the last 4 digits
 * @example maskSSN("123-45-6789") → "***-**-6789"
 */
export function maskSSN(ssn: string | null | undefined): string {
  if (!ssn || ssn.length < 4) return '***-**-****';
  const lastFour = ssn.replace(/\D/g, '').slice(-4);
  return '***-**-' + lastFour;
}

/**
 * Masks a routing number, showing only the last 4 digits
 * @example maskRoutingNumber("021000021") → "****0021"
 */
export function maskRoutingNumber(routingNumber: string | null | undefined): string {
  if (!routingNumber || routingNumber.length < 4) return '****';
  return '****' + routingNumber.slice(-4);
}

/**
 * Masks a currency amount by hiding most digits
 * @example maskCurrency(123456.78) → "$***456.78"
 */
export function maskCurrency(amount: number | null | undefined, showLastDigits: number = 3): string {
  if (amount === null || amount === undefined) return '$***';
  const amountStr = Math.abs(amount).toFixed(2);
  const [dollars, cents] = amountStr.split('.');

  if (dollars.length <= showLastDigits) {
    return `$${amount < 0 ? '-' : ''}${amountStr}`;
  }

  const maskedDollars = '*'.repeat(dollars.length - showLastDigits) + dollars.slice(-showLastDigits);
  return `$${amount < 0 ? '-' : ''}${maskedDollars}.${cents}`;
}

/**
 * Masks a phone number, showing only the last 4 digits
 * @example maskPhone("555-123-4567") → "***-***-4567"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 4) return '***-***-****';
  const cleaned = phone.replace(/\D/g, '');
  const lastFour = cleaned.slice(-4);
  return '***-***-' + lastFour;
}

/**
 * Generic masking function - shows first and last character with asterisks in between
 * @example maskGeneric("sensitive") → "s*******e"
 */
export function maskGeneric(value: string | null | undefined, showChars: number = 1): string {
  if (!value || value.length <= showChars * 2) return '***';
  const start = value.slice(0, showChars);
  const end = value.slice(-showChars);
  const middle = '*'.repeat(Math.max(3, value.length - showChars * 2));
  return start + middle + end;
}

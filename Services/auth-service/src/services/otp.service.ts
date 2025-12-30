export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOTPExpired(expiryDate?: Date): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}

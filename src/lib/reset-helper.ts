// Default reset cutoff to August 1st 2026 so old 2023 dummy sample data is excluded, but all current 2026 transactions are included!
const DEFAULT_RESET_TIME = '2026-08-01T00:00:00.000Z';

export function getResetTimestamp(): string {
  if (typeof window === 'undefined') return DEFAULT_RESET_TIME;
  try {
    const saved = localStorage.getItem('rossya_reset_timestamp');
    if (saved) return saved;
  } catch (e) {}
  return DEFAULT_RESET_TIME;
}

export function setResetTimestamp(): string {
  const now = new Date().toISOString();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('rossya_reset_timestamp', now);
      window.dispatchEvent(new Event('financials-reset'));
    } catch (e) {
      console.error('Error setting reset timestamp:', e);
    }
  }
  return now;
}

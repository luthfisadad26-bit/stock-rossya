// Default reset cutoff to current time so old sample test data is excluded
const DEFAULT_RESET_TIME = '2026-08-05T17:25:00.000Z';

export function getResetTimestamp(): string {
  if (typeof window === 'undefined') return DEFAULT_RESET_TIME;
  try {
    const saved = localStorage.getItem('rossya_reset_timestamp');
    if (saved) return saved;
    // Set default reset timestamp to current time on first load
    const now = new Date().toISOString();
    localStorage.setItem('rossya_reset_timestamp', now);
    return now;
  } catch (e) {
    return DEFAULT_RESET_TIME;
  }
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

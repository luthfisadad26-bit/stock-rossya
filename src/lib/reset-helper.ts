// Hardcoded cutoff to exclude old 2023 seed data that can't be deleted via anon key.
// All real user data starts from August 2026.
const DATA_CUTOFF = '2026-01-01T00:00:00.000Z';

/**
 * Returns the cutoff timestamp for filtering financial data.
 * Only data created AFTER this timestamp will be shown.
 */
export function getDataCutoff(): string {
  return DATA_CUTOFF;
}

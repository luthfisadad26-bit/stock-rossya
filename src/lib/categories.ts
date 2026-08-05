export const DEFAULT_CATEGORIES = ['Baju Putih', 'Celana', 'Rok', 'Pramuka', 'Aksesoris', 'Batik'];

export function getCustomCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const saved = localStorage.getItem('rossya_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom categories:', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCustomCategories(cats: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('rossya_categories', JSON.stringify(cats));
    window.dispatchEvent(new Event('categories-updated'));
  } catch (e) {
    console.error('Error saving custom categories:', e);
  }
}

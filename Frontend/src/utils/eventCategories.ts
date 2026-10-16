export const EVENT_CATEGORIES = ['Academic', 'Career', 'Club', 'Sports', 'Interest'] as const;

export function normalizeEventCategory(value: unknown): string {
  const normalized = String(value ?? '').trim().toLowerCase();
  return EVENT_CATEGORIES.find(category => category.toLowerCase() === normalized) ?? '';
}

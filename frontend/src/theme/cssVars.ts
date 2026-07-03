export function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const property = name.startsWith('var(') ? name.slice(4, -1).trim() : name
  const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim()
  return value || fallback
}

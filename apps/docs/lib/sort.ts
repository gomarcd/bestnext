export function sortByTitle<T>(items: T[], selector: (item: T) => string) {
  return [...items].sort((a, b) => (selector(a) ?? '').localeCompare(selector(b) ?? ''));
}

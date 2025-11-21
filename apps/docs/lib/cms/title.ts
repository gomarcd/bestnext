import { getPageByPath } from './pages';

export async function getCmsPageTitle(path: string | undefined, fallback: string): Promise<string> {
  if (!path) return fallback;
  const page = await getPageByPath(path);
  return page?.title ?? fallback;
}

const CONTENT_API_URL = 'https://cdn.builder.io/api/v3/content';
const RESULTS_PER_MODEL = 5;
const MIN_QUERY_LENGTH = 2;

export interface SiteLink {
  path: string;
  title: string;
}

export type SearchSiteLinks = (query: string) => Promise<SiteLink[]>;

export interface BuilderSearchContext {
  user?: {
    apiKey?: string;
  };
}

interface ContentEntry {
  data?: { slug?: string; title?: string; url?: string };
  name?: string;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const fetchEntries = async (
  model: string,
  apiKey: string,
  term: string,
): Promise<ContentEntry[]> => {
  const params = new URLSearchParams({
    apiKey,
    fields: 'name,data.title,data.url,data.slug',
    limit: String(RESULTS_PER_MODEL),
    noTargeting: 'true',
    'query.name.$options': 'i',
    'query.name.$regex': escapeRegExp(term),
  });
  const response = await fetch(`${CONTENT_API_URL}/${model}?${params}`);

  if (!response.ok) return [];

  const payload = (await response.json()) as { results?: ContentEntry[] };

  return payload.results ?? [];
};

const pathOf = (model: string, entry: ContentEntry): string => {
  if (model === 'blog-post') {
    const slug = entry.data?.slug;

    return slug ? `/blog/${slug}/` : '';
  }

  return entry.data?.url ?? '';
};

export const createSiteLinkSearch = (context?: BuilderSearchContext): SearchSiteLinks | null => {
  if (!context) return null;

  return async (query) => {
    const apiKey = context.user?.apiKey;
    const term = query.trim();

    if (!apiKey || term.length < MIN_QUERY_LENGTH) return [];

    try {
      const [pages, posts] = await Promise.all([
        fetchEntries('page', apiKey, term),
        fetchEntries('blog-post', apiKey, term),
      ]);

      return [
        ...pages.map((entry) => ({ entry, model: 'page' })),
        ...posts.map((entry) => ({ entry, model: 'blog-post' })),
      ]
        .map(({ entry, model }) => ({
          path: pathOf(model, entry),
          title: entry.data?.title ?? entry.name ?? '',
        }))
        .filter((link) => link.path && link.title);
    } catch {
      return [];
    }
  };
};

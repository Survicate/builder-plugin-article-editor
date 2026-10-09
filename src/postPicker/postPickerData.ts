const CONTENT_API = 'https://cdn.builder.io/api/v3/content/blog-post';
const PAGE_SIZE = 100;

export interface PickablePost {
  id: string;
  publishedAt?: string;
  slug?: string;
  title: string;
}

export interface PostReference {
  '@type': '@builder.io/core:Reference';
  id: string;
  model: 'blog-post';
}

export interface ReferenceLike {
  get?(key: string): unknown;
  id?: unknown;
}

export const referenceId = (value: ReferenceLike | null | undefined): string | null => {
  if (!value) return null;

  const id = typeof value.get === 'function' ? value.get('id') : value.id;

  return typeof id === 'string' && id ? id : null;
};

export const postReference = (id: string): PostReference => ({
  '@type': '@builder.io/core:Reference',
  id,
  model: 'blog-post',
});

interface ContentEntry {
  id: string;
  name?: string;
  data?: { publishDate?: string; publishedAt?: string; slug?: string; title?: string };
}

const firstPublishedTime = (post: PickablePost): number => {
  const time = post.publishedAt ? Date.parse(post.publishedAt) : Number.NaN;

  return Number.isFinite(time) ? time : 0;
};

const toPickablePost = (entry: ContentEntry): PickablePost => ({
  id: entry.id,
  publishedAt: entry.data?.publishedAt ?? entry.data?.publishDate,
  slug: entry.data?.slug,
  title: entry.data?.title ?? entry.name ?? 'Untitled post',
});

const contentUrl = (apiKey: string, params: string): string =>
  `${CONTENT_API}?apiKey=${encodeURIComponent(apiKey)}&cachebust=true&noTargeting=true` +
  `&fields=id,name,data.title,data.slug,data.publishedAt,data.publishDate&${params}`;

export const fetchCategoryPosts = async (
  apiKey: string,
  categoryId: string,
): Promise<PickablePost[]> => {
  const posts: PickablePost[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(
      contentUrl(
        apiKey,
        `limit=${PAGE_SIZE}&offset=${offset}` +
          `&query.data.category.id=${encodeURIComponent(categoryId)}`,
      ),
    );

    if (!response.ok) throw new Error(`Builder content API ${response.status}`);

    const page: ContentEntry[] = (await response.json()).results ?? [];

    posts.push(...page.map(toPickablePost));

    if (page.length < PAGE_SIZE) break;
  }

  return posts.sort((a, b) => firstPublishedTime(b) - firstPublishedTime(a));
};

export const fetchPostTitle = async (apiKey: string, postId: string): Promise<string | null> => {
  const response = await fetch(
    contentUrl(
      apiKey,
      `limit=1&includeUnpublished=true&query.id=${encodeURIComponent(postId)}`,
    ),
  );

  if (!response.ok) return null;

  const entry: ContentEntry | undefined = ((await response.json()).results ?? [])[0];

  return entry ? toPickablePost(entry).title : null;
};

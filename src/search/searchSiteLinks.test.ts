import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSiteLinkSearch } from '@/search/searchSiteLinks';

const context = { user: { apiKey: 'public-key' } };

const respondWith = (results: unknown[]) =>
  vi.fn().mockResolvedValue({ json: () => Promise.resolve({ results }), ok: true });

afterEach(() => vi.unstubAllGlobals());

describe('createSiteLinkSearch', () => {
  it('returns nothing outside the Builder editor', () => {
    expect(createSiteLinkSearch(undefined)).toBeNull();
  });

  it('asks both the pages and the blog posts for matches', async () => {
    const fetchMock = respondWith([]);

    vi.stubGlobal('fetch', fetchMock);

    await createSiteLinkSearch(context)?.('pricing');

    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(urls.some((url) => url.includes('/content/page?'))).toBe(true);
    expect(urls.some((url) => url.includes('/content/blog-post?'))).toBe(true);
    expect(urls[0]).toContain('apiKey=public-key');
    expect(urls[0]).toContain('query.name.%24regex=pricing');
  });

  it('maps pages to their url and posts to their blog path', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            results: [{ data: { title: 'Pricing', url: '/pricing/' }, name: 'Pricing' }],
          }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            results: [{ data: { slug: 'csat-vs-nps', title: 'CSAT vs NPS' }, name: 'csat' }],
          }),
        ok: true,
      });

    vi.stubGlobal('fetch', fetchMock);

    await expect(createSiteLinkSearch(context)?.('cs')).resolves.toEqual([
      { path: '/pricing/', title: 'Pricing' },
      { path: '/blog/csat-vs-nps/', title: 'CSAT vs NPS' },
    ]);
  });

  it('drops entries without a usable address and escapes the search term', async () => {
    const fetchMock = respondWith([{ data: { title: 'No address' }, name: 'x' }]);

    vi.stubGlobal('fetch', fetchMock);

    await expect(createSiteLinkSearch(context)?.('a+b')).resolves.toEqual([]);
    expect(String(fetchMock.mock.calls[0][0])).toContain(encodeURIComponent('a\\+b'));
  });

  it('stays quiet on short queries, missing key and network failures', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'));

    vi.stubGlobal('fetch', failing);

    await expect(createSiteLinkSearch(context)?.('a')).resolves.toEqual([]);
    await expect(createSiteLinkSearch({})?.('pricing')).resolves.toEqual([]);
    await expect(createSiteLinkSearch(context)?.('pricing')).resolves.toEqual([]);
  });
});

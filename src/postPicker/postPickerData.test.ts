import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCategoryPosts,
  fetchPostTitle,
  postReference,
  referenceId,
} from '@/postPicker/postPickerData';

const jsonResponse = (results: unknown[]): Response =>
  ({ json: async () => ({ results }), ok: true }) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('referenceId', () => {
  it('reads the id from a plain reference object', () => {
    expect(referenceId({ id: 'abc' })).toBe('abc');
  });

  it('reads the id from an observable map', () => {
    expect(referenceId(new Map([['id', 'abc']]))).toBe('abc');
  });

  it('returns null for missing or empty references', () => {
    expect(referenceId(undefined)).toBeNull();
    expect(referenceId(null)).toBeNull();
    expect(referenceId({})).toBeNull();
    expect(referenceId({ id: '' })).toBeNull();
  });
});

describe('postReference', () => {
  it('builds a blog post reference', () => {
    expect(postReference('abc')).toEqual({
      '@type': '@builder.io/core:Reference',
      id: 'abc',
      model: 'blog-post',
    });
  });
});

describe('fetchCategoryPosts', () => {
  it('filters by category and sorts newest first published first', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { data: { publishedAt: '2026-01-01', slug: 'old', title: 'Old' }, id: 'old' },
        { data: { publishedAt: '2026-06-01', slug: 'new', title: 'New' }, id: 'new' },
        { id: 'untitled', name: 'Entry name' },
      ]),
    );

    vi.stubGlobal('fetch', fetchMock);

    const posts = await fetchCategoryPosts('key', 'cat-1');

    expect(fetchMock.mock.calls[0][0]).toContain('query.data.category.id=cat-1');
    expect(fetchMock.mock.calls[0][0]).not.toContain('includeUnpublished');
    expect(posts.map((post) => post.id)).toEqual(['new', 'old', 'untitled']);
    expect(posts[2].title).toBe('Entry name');
  });

  it('throws on an API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(fetchCategoryPosts('key', 'cat-1')).rejects.toThrow('500');
  });
});

describe('fetchPostTitle', () => {
  it('resolves the title of any entry, drafts included', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ data: { title: 'Hidden draft' }, id: 'x' }]));

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPostTitle('key', 'x')).resolves.toBe('Hidden draft');
    expect(fetchMock.mock.calls[0][0]).toContain('includeUnpublished=true');
    expect(fetchMock.mock.calls[0][0]).toContain('query.id=x');
  });

  it('returns null when the entry is gone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    await expect(fetchPostTitle('key', 'x')).resolves.toBeNull();
  });
});

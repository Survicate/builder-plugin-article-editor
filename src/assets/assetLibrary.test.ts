import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAssetLibrary } from '@/assets/assetLibrary';

const context = {
  user: { apiKey: 'space-key', authHeaders: { Authorization: 'Bearer test-token' } },
};

const asset = {
  bytes: 86432,
  createdDate: 1790840975456,
  height: 1256,
  id: 'asset-1',
  name: 'cover.webp',
  url: 'https://cdn.builder.io/api/v1/image/assets%2Fcover',
  width: 2400,
};

const respondWith = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok,
    status,
    statusText: ok ? 'OK' : 'Forbidden',
  });

afterEach(() => vi.unstubAllGlobals());

describe('createAssetLibrary', () => {
  it('returns nothing outside the Builder editor', () => {
    expect(createAssetLibrary(undefined)).toBeNull();
  });

  it('asks for a retry while the Builder session is still loading', async () => {
    const library = createAssetLibrary({});

    await expect(library?.list({ limit: 24, offset: 0 })).rejects.toThrow('still loading');
  });

  it('prefers the plugin private key, which the Admin API requires', async () => {
    const fetchMock = respondWith({ data: { assets: [] } });
    const getPluginPrivateKey = vi.fn().mockResolvedValue('plugin-private-key');

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary({ ...context, globalState: { getPluginPrivateKey } });

    await library?.list({ limit: 24, offset: 0 });

    expect(getPluginPrivateKey).toHaveBeenCalledWith('@survicate/builder-plugin-article-editor');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer plugin-private-key');
  });

  it('asks Builder for the plugin key once and reuses it', async () => {
    const fetchMock = respondWith({ data: { assets: [] } });
    const getPluginPrivateKey = vi.fn().mockResolvedValue('plugin-private-key');

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary({ ...context, globalState: { getPluginPrivateKey } });

    await library?.prime?.();
    await library?.list({ limit: 24, offset: 0 });
    await library?.remove('asset-1');

    expect(getPluginPrivateKey).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer plugin-private-key');
  });

  it('fails priming while the Builder session is still loading', async () => {
    const library = createAssetLibrary({});

    await expect(library?.prime?.()).rejects.toThrow('still loading');
  });

  it('falls back to the session headers when no plugin key is issued', async () => {
    const fetchMock = respondWith({ data: { assets: [] } });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary({
      ...context,
      globalState: { getPluginPrivateKey: vi.fn().mockRejectedValue(new Error('nope')) },
    });

    await library?.list({ limit: 24, offset: 0 });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  });

  it('lists newest images first, scoped to the space', async () => {
    const fetchMock = respondWith({ data: { assets: [asset] } });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary(context);
    const assets = await library?.list({ limit: 24, offset: 0 });

    expect(assets).toEqual([asset]);

    const [endpoint, options] = fetchMock.mock.calls[0];

    expect(endpoint).toBe('https://builder.io/api/v2/admin?apiKey=space-key');
    expect(options.headers.Authorization).toBe('Bearer test-token');

    const body = JSON.parse(options.body);

    expect(body.variables.input).toEqual({
      limit: 24,
      offset: 0,
      query: { type: { $regex: '^image/' } },
      sort: { createdDate: -1 },
    });
  });

  it('searches by file name without treating the term as a pattern', async () => {
    const fetchMock = respondWith({ data: { assets: [] } });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary(context);

    await library?.list({ limit: 24, offset: 24, search: ' nps (v2) ' });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(body.variables.input.query.name).toEqual({
      $options: 'i',
      $regex: 'nps \\(v2\\)',
    });
    expect(body.variables.input.offset).toBe(24);
  });

  it('drops incomplete entries instead of rendering broken tiles', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({ data: { assets: [asset, null, { id: 'no-url', name: 'x' }] } }),
    );

    const library = createAssetLibrary(context);

    await expect(library?.list({ limit: 24, offset: 0 })).resolves.toEqual([asset]);
  });

  it('deletes an asset through the admin mutation', async () => {
    const fetchMock = respondWith({ data: { deleteAsset: true } });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary(context);

    await library?.remove('asset-1');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(body.query).toContain('deleteAsset');
    expect(body.variables).toEqual({ id: 'asset-1' });
  });

  it('surfaces the admin error message', async () => {
    vi.stubGlobal('fetch', respondWith({ errors: [{ message: 'Not allowed' }] }));

    const library = createAssetLibrary(context);

    await expect(library?.remove('asset-1')).rejects.toThrow('Not allowed');
  });

  it('treats a delete error for an already-removed asset as success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ errors: [{ message: 'Error deleting asset' }] }),
        ok: true,
        status: 200,
        statusText: 'OK',
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ data: { assets: [] } }),
        ok: true,
        status: 200,
        statusText: 'OK',
      });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary(context);

    await expect(library?.remove('asset-1')).resolves.toBeUndefined();

    const verification = JSON.parse(fetchMock.mock.calls[1][1].body);

    expect(verification.variables.input.query).toEqual({ id: 'asset-1' });
  });

  it('keeps the delete error when the asset survived', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ errors: [{ message: 'Error deleting asset' }] }),
        ok: true,
        status: 200,
        statusText: 'OK',
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ data: { assets: [asset] } }),
        ok: true,
        status: 200,
        statusText: 'OK',
      });

    vi.stubGlobal('fetch', fetchMock);

    const library = createAssetLibrary(context);

    await expect(library?.remove('asset-1')).rejects.toThrow('Error deleting asset');
  });

  it('explains a refused request', async () => {
    vi.stubGlobal('fetch', respondWith({}, false, 403));

    const library = createAssetLibrary(context);

    await expect(library?.list({ limit: 24, offset: 0 })).rejects.toThrow('403');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createImageUploader } from '@/upload/uploadImage';

const context = { user: { authHeaders: { Authorization: 'Bearer test-token' } } };

const file = () => new File(['binary'], 'chart of results.png', { type: 'image/png' });

const respondWith = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok,
    status,
    statusText: ok ? 'OK' : 'Forbidden',
  });

afterEach(() => vi.unstubAllGlobals());

describe('createImageUploader', () => {
  it('returns nothing without a signed-in Builder user', () => {
    expect(createImageUploader(undefined)).toBeNull();
    expect(createImageUploader({})).toBeNull();
    expect(createImageUploader({ user: { authHeaders: {} } })).toBeNull();
  });

  it('sends the file with the user credentials and returns the asset address', async () => {
    const fetchMock = respondWith({ url: 'https://cdn.builder.io/api/v1/image/assets%2Fchart' });

    vi.stubGlobal('fetch', fetchMock);

    const upload = createImageUploader(context);
    const url = await upload?.(file());

    expect(url).toBe('https://cdn.builder.io/api/v1/image/assets%2Fchart');

    const [endpoint, options] = fetchMock.mock.calls[0];

    expect(endpoint).toBe('https://builder.io/api/v1/upload?name=chart%20of%20results.png');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(options.headers['Content-Type']).toBe('image/png');
  });

  it('explains a refused upload instead of inserting a broken image', async () => {
    vi.stubGlobal('fetch', respondWith({}, false, 403));

    const upload = createImageUploader(context);

    await expect(upload?.(file())).rejects.toThrow('403');
  });

  it('fails when Builder accepts the file but returns no address', async () => {
    vi.stubGlobal('fetch', respondWith({}));

    const upload = createImageUploader(context);

    await expect(upload?.(file())).rejects.toThrow('no address');
  });
});

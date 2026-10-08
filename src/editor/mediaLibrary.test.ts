import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AssetLibrary, BuilderAsset } from '@/assets/assetLibrary';
import { openMediaLibrary } from '@/editor/mediaLibrary';

const asset = (overrides: Partial<BuilderAsset> = {}): BuilderAsset => ({
  bytes: 86432,
  height: 1256,
  id: 'asset-1',
  name: 'cover.webp',
  url: 'https://cdn.builder.io/api/v1/image/assets%2Fcover',
  width: 2400,
  ...overrides,
});

const libraryWith = (assets: BuilderAsset[]): AssetLibrary => ({
  list: vi.fn().mockResolvedValue(assets),
  remove: vi.fn().mockResolvedValue(undefined),
});

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve);
  });

const searchInput = (): HTMLInputElement => {
  const field = document.querySelector<HTMLInputElement>('.sv-media__search');

  if (!field) throw new Error('The dialog did not render its search field');

  return field;
};

afterEach(() => {
  document.querySelector('.sv-media')?.remove();
});

describe('openMediaLibrary', () => {
  it('shows each image with its pixel size and weight', async () => {
    openMediaLibrary({ library: libraryWith([asset()]), onPick: () => undefined, title: 'Pick' });
    await flush();

    const tile = document.querySelector('.sv-media__tile');

    expect(tile?.querySelector('.sv-media__name')?.textContent).toBe('cover.webp');
    expect(tile?.querySelector('.sv-media__details')?.textContent).toBe('2400 × 1256 px · 84 kB');

    const thumbnail = tile?.querySelector<HTMLImageElement>('.sv-media__thumbnail');

    expect(thumbnail?.src).toBe('https://cdn.builder.io/api/v1/image/assets%2Fcover?width=240');
  });

  it('serves /file/ and inline addresses verbatim because the CDN cannot resize them', async () => {
    const fileAsset = asset({ url: 'https://cdn.builder.io/api/v1/file/assets%2Fphoto' });
    const inlineAsset = asset({ id: 'asset-2', url: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E' });

    openMediaLibrary({
      library: libraryWith([fileAsset, inlineAsset]),
      onPick: () => undefined,
      title: 'Pick',
    });
    await flush();

    const thumbnails = document.querySelectorAll<HTMLImageElement>('.sv-media__thumbnail');

    expect(thumbnails[0]?.src).toBe('https://cdn.builder.io/api/v1/file/assets%2Fphoto');
    expect(thumbnails[1]?.src).toBe('data:image/svg+xml,%3Csvg%3E%3C/svg%3E');
  });

  it('hands the picked image over with its size and closes', async () => {
    const onPick = vi.fn();

    openMediaLibrary({ library: libraryWith([asset()]), onPick, title: 'Pick' });
    await flush();
    document.querySelector<HTMLButtonElement>('.sv-media__pick')?.click();

    expect(onPick).toHaveBeenCalledWith({
      height: '1256',
      src: 'https://cdn.builder.io/api/v1/image/assets%2Fcover',
      width: '2400',
    });
    expect(document.querySelector('.sv-media')).toBeNull();
  });

  it('only deletes after a second confirming click', async () => {
    const library = libraryWith([asset()]);

    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });
    await flush();

    const remove = document.querySelector<HTMLButtonElement>('.sv-media__delete');

    remove?.click();
    expect(library.remove).not.toHaveBeenCalled();
    expect(remove?.textContent).toBe('Sure?');

    remove?.click();
    await flush();
    expect(library.remove).toHaveBeenCalledWith('asset-1');
    expect(document.querySelector('.sv-media__tile')).toBeNull();
  });

  it('blocks repeated clicks while the delete request runs', async () => {
    let settle = () => undefined as void;
    const library = libraryWith([asset()]);

    library.remove = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        settle = resolve;
      }),
    );
    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });
    await flush();

    const remove = document.querySelector<HTMLButtonElement>('.sv-media__delete');

    remove?.click();
    remove?.click();
    remove?.click();
    expect(library.remove).toHaveBeenCalledTimes(1);
    expect(remove?.disabled).toBe(true);

    settle();
    await flush();
    expect(document.querySelector('.sv-media__tile')).toBeNull();
  });

  it('re-enables the delete button when the request fails', async () => {
    const library = libraryWith([asset()]);

    library.remove = vi.fn().mockRejectedValue(new Error('Error deleting asset'));
    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });
    await flush();

    const remove = document.querySelector<HTMLButtonElement>('.sv-media__delete');

    remove?.click();
    remove?.click();
    await flush();

    expect(remove?.disabled).toBe(false);
    expect(document.querySelector('.sv-media__tile')).not.toBeNull();
    expect(document.querySelector('.sv-media__notice')?.textContent).toContain('Error deleting');
  });

  it('searches after a pause instead of on every keystroke', async () => {
    vi.useFakeTimers();

    const library = libraryWith([]);

    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });

    const search = searchInput();

    search.value = 'nps';
    search.dispatchEvent(new Event('input'));
    expect(library.list).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(library.list).toHaveBeenCalledTimes(2);
    expect(library.list).toHaveBeenLastCalledWith({ limit: 24, offset: 0, search: 'nps' });
    vi.useRealTimers();
  });

  it('pages through a full library with the load more button', async () => {
    const fullPage = Array.from({ length: 24 }, (_, index) =>
      asset({ id: `asset-${index}`, name: `photo-${index}.webp` }),
    );
    const library = libraryWith(fullPage);

    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });
    await flush();

    const more = document.querySelector<HTMLButtonElement>('.sv-media__more');

    expect(more?.hidden).toBe(false);
    more?.click();
    await flush();
    expect(library.list).toHaveBeenLastCalledWith({ limit: 24, offset: 24, search: '' });
    expect(document.querySelectorAll('.sv-media__tile')).toHaveLength(48);
  });

  it('explains when nothing matches and when the library refuses', async () => {
    const library: AssetLibrary = {
      list: vi.fn().mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Not allowed')),
      remove: vi.fn(),
    };

    openMediaLibrary({ library, onPick: () => undefined, title: 'Pick' });
    await flush();
    expect(document.querySelector('.sv-media__notice')?.textContent).toBe(
      'No images match this search',
    );

    const search = searchInput();

    search.value = 'x';
    search.dispatchEvent(new Event('input'));
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    expect(document.querySelector('.sv-media__notice')?.textContent).toBe('Not allowed');
  });

  it('closes on Escape without picking anything', async () => {
    const onPick = vi.fn();

    openMediaLibrary({ library: libraryWith([asset()]), onPick, title: 'Pick' });
    await flush();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(document.querySelector('.sv-media')).toBeNull();
    expect(onPick).not.toHaveBeenCalled();
  });
});

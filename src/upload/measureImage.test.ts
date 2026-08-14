import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureImage } from '@/upload/measureImage';

const blobUrls = { createObjectURL: () => 'blob:fake', revokeObjectURL: () => undefined };

afterEach(() => vi.unstubAllGlobals());

describe('measureImage', () => {
  it('reads the natural size of the picture', async () => {
    class FakeImage {
      naturalHeight = 480;
      naturalWidth = 640;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal('URL', blobUrls);

    await expect(measureImage(new Blob(['x']))).resolves.toEqual({ height: 480, width: 640 });
  });

  it('gives up quietly when the picture cannot be decoded', async () => {
    class BrokenImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }

    vi.stubGlobal('Image', BrokenImage);
    vi.stubGlobal('URL', blobUrls);

    await expect(measureImage(new Blob(['x']))).resolves.toBeNull();
  });

  it('never blocks an upload when blob addresses are unavailable', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => {
        throw new Error('not implemented');
      },
    });

    await expect(measureImage(new Blob(['x']))).resolves.toBeNull();
  });
});

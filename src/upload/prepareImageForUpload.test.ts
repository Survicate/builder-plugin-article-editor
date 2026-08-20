import { describe, expect, it } from 'vitest';
import { prepareImageForUpload } from '@/upload/prepareImageForUpload';

describe('prepareImageForUpload', () => {
  it('passes animated and vector formats through untouched', async () => {
    const gif = new File(['gif'], 'demo.gif', { type: 'image/gif' });
    const svg = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' });

    await expect(prepareImageForUpload(gif)).resolves.toBe(gif);
    await expect(prepareImageForUpload(svg)).resolves.toBe(svg);
  });

  it('falls back to the original file when the canvas pipeline is unavailable', async () => {
    const png = new File(['png-bytes'], 'screenshot.png', { type: 'image/png' });

    await expect(prepareImageForUpload(png)).resolves.toBe(png);
  });
});

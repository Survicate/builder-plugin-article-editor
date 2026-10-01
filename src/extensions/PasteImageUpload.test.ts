import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fileNameForSrc,
  inlineImagesToObjectUrls,
  isForeignImageSrc,
} from '@/extensions/PasteImageUpload';

describe('isForeignImageSrc', () => {
  it('flags inline data images from a Google Docs paste', () => {
    expect(isForeignImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('flags images that still live on another site', () => {
    expect(isForeignImageSrc('https://lh7-us.googleusercontent.com/docsz/chart')).toBe(true);
    expect(isForeignImageSrc('https://assets-global.website-files.com/5f/screen.png')).toBe(true);
  });

  it('leaves images already in the Builder library alone', () => {
    expect(isForeignImageSrc('https://cdn.builder.io/api/v1/image/assets%2Fabc%2Fdef')).toBe(false);
  });

  it('flags object urls made from pasted inline images', () => {
    expect(isForeignImageSrc('blob:https://builder.io/123')).toBe(true);
  });

  it('ignores relative addresses and other schemes', () => {
    expect(isForeignImageSrc('/images/logo.png')).toBe(false);
    expect(isForeignImageSrc('data:text/html,hello')).toBe(false);
  });

  it('never fetches from local or private network addresses', () => {
    expect(isForeignImageSrc('http://localhost:8080/admin.png')).toBe(false);
    expect(isForeignImageSrc('http://127.0.0.1/x.png')).toBe(false);
    expect(isForeignImageSrc('http://10.0.0.5/x.png')).toBe(false);
    expect(isForeignImageSrc('http://192.168.1.1/x.png')).toBe(false);
    expect(isForeignImageSrc('http://172.20.3.4/x.png')).toBe(false);
    expect(isForeignImageSrc('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isForeignImageSrc('http://[::1]/x.png')).toBe(false);
    expect(isForeignImageSrc('http://intranet/x.png')).toBe(false);
    expect(isForeignImageSrc('http://nas.local/x.png')).toBe(false);
  });
});

describe('fileNameForSrc', () => {
  it('keeps the original file name when the address has one', () => {
    expect(fileNameForSrc('https://example.com/media/survey-results.png', 'image/png')).toBe(
      'survey-results.png',
    );
  });

  it('adds an extension when the address has none', () => {
    expect(fileNameForSrc('https://lh7-us.googleusercontent.com/docsz/AD_4nXe', 'image/png')).toBe(
      'AD_4nXe.png',
    );
  });

  it('names inline data images after their type', () => {
    expect(fileNameForSrc('data:image/jpeg;base64,/9j/4AAQ', 'image/jpeg')).toBe(
      'pasted-image.jpeg',
    );
  });

  it('falls back to a safe name when the address cannot be read', () => {
    expect(fileNameForSrc('https://', 'image/svg+xml')).toBe('pasted-image.svg');
  });
});

describe('inlineImagesToObjectUrls', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubObjectUrls = () => {
    let counter = 0;
    const created: Blob[] = [];

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: (blob: Blob) => {
        created.push(blob);
        counter += 1;

        return `blob:https://builder.io/${counter}`;
      },
    });

    return created;
  };

  it('swaps base64 images for object urls and keeps the rest of the markup', () => {
    const created = stubObjectUrls();
    const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const html = `<p>before</p><img alt="shot" src="data:image/png;base64,${pixel}"><p>after</p>`;

    const out = inlineImagesToObjectUrls(html);

    expect(out).toContain('<img alt="shot" src="blob:https://builder.io/1">');
    expect(out).toContain('<p>before</p>');
    expect(out).toContain('<p>after</p>');
    expect(out).not.toContain('base64');
    expect(created[0].type).toBe('image/png');
  });

  it('leaves html without inline images untouched', () => {
    const html = '<p>plain</p><img src="https://cdn.builder.io/x.png">';

    expect(inlineImagesToObjectUrls(html)).toBe(html);
  });

  it('drops the source of an unreadable inline image instead of keeping the bytes', () => {
    stubObjectUrls();

    const out = inlineImagesToObjectUrls('<img src="data:image/png;base64,@@not-base64@@">');

    expect(out).not.toContain('base64');
    expect(out).toContain('<img>');
  });
});

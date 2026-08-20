import { describe, expect, it } from 'vitest';
import { fileNameForSrc, isForeignImageSrc } from '@/extensions/PasteImageUpload';

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

  it('ignores relative addresses and other schemes', () => {
    expect(isForeignImageSrc('/images/logo.png')).toBe(false);
    expect(isForeignImageSrc('blob:https://builder.io/123')).toBe(false);
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

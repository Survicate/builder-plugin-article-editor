import { describe, expect, it } from 'vitest';
import { normalizeImageSize } from '@/extensions/imageSize';

describe('normalizeImageSize', () => {
  it('keeps pixel and percent widths as typed', () => {
    expect(normalizeImageSize('320px')).toBe('320px');
    expect(normalizeImageSize('45%')).toBe('45%');
  });

  it('treats bare numbers as pixels and trims noise', () => {
    expect(normalizeImageSize('320')).toBe('320px');
    expect(normalizeImageSize(' 45 % ')).toBe('45%');
    expect(normalizeImageSize('320PX')).toBe('320px');
  });

  it('clears everything that is not a usable width', () => {
    expect(normalizeImageSize('')).toBeNull();
    expect(normalizeImageSize('wide')).toBeNull();
    expect(normalizeImageSize('0px')).toBeNull();
    expect(normalizeImageSize('150%')).toBeNull();
    expect(normalizeImageSize('20em')).toBeNull();
    expect(normalizeImageSize('-40px')).toBeNull();
  });
});

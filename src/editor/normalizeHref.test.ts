import { describe, expect, it } from 'vitest';
import { normalizeHref } from '@/editor/normalizeHref';

describe('normalizeHref', () => {
  it('leaves a site path alone so it stays relative to the blog', () => {
    expect(normalizeHref('/pricing/')).toBe('/pricing/');
  });

  it('leaves an address that already has a scheme alone', () => {
    expect(normalizeHref('https://survicate.com/blog/')).toBe('https://survicate.com/blog/');
  });

  it('adds https to a bare domain so it does not resolve against the blog', () => {
    expect(normalizeHref('survicate.com/pricing')).toBe('https://survicate.com/pricing');
  });

  it('adds https to a bare domain with no path', () => {
    expect(normalizeHref('www.survicate.com')).toBe('https://www.survicate.com');
  });

  it('turns an email address into a mail link', () => {
    expect(normalizeHref('hello@survicate.com')).toBe('mailto:hello@survicate.com');
  });

  it('keeps an anchor pointing inside the page', () => {
    expect(normalizeHref('#pricing')).toBe('#pricing');
  });

  it('trims what was pasted', () => {
    expect(normalizeHref('  /pricing/  ')).toBe('/pricing/');
  });

  it('treats an empty value as removing the link', () => {
    expect(normalizeHref('   ')).toBe('');
  });
});

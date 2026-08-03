import { describe, expect, it } from 'vitest';
import { cleanPastedHtml } from '@/extensions/PasteCleanup';

describe('cleanPastedHtml', () => {
  it('strips the wrapper Google Docs puts around pasted content', () => {
    const html = '<b id="docs-internal-guid-123"><p>Paragraph</p></b>';

    expect(cleanPastedHtml(html)).toBe('<strong><p>Paragraph</p></strong>');
  });

  it('removes the styled spans Google Docs uses for formatting', () => {
    const html = '<p><span style="font-weight:700;color:#000">Text</span></p>';

    expect(cleanPastedHtml(html)).toBe('<p>Text</p>');
  });

  it('removes Word conditional comments and namespaced tags', () => {
    const html = '<!--[if gte mso 9]><xml>junk</xml><![endif]--><p><o:p>Body</o:p></p>';

    expect(cleanPastedHtml(html)).toBe('<p>Body</p>');
  });

  it('removes Word class names and style blocks', () => {
    const html = '<style>p { color: red }</style><p class="MsoNormal">Body</p>';

    expect(cleanPastedHtml(html)).toBe('<p>Body</p>');
  });

  it('removes inline styles that would fight the blog stylesheet', () => {
    const html = '<p style="margin:0in;font-size:11pt">Body</p>';

    expect(cleanPastedHtml(html)).toBe('<p>Body</p>');
  });

  it('keeps the structure that matters', () => {
    const html = '<h2>Title</h2><ul><li>One</li></ul><a href="https://survicate.com">Link</a>';

    expect(cleanPastedHtml(html)).toBe(html);
  });
});

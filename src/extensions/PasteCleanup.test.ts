import { describe, expect, it } from 'vitest';
import { cleanPastedHtml } from '@/extensions/PasteCleanup';

describe('cleanPastedHtml', () => {
  it('unwraps the Google Docs wrapper instead of bolding the whole paste', () => {
    const html = '<b id="docs-internal-guid-123"><p>Paragraph</p></b>';

    expect(cleanPastedHtml(html)).toBe('<p>Paragraph</p>');
  });

  it('unwraps non-bold b wrappers while keeping genuine bold inside', () => {
    const html =
      '<b style="font-weight:normal" id="docs-internal-guid-9">' +
      '<p>Plain with <b>bold</b> word</p></b>';

    expect(cleanPastedHtml(html)).toBe('<p>Plain with <strong>bold</strong> word</p>');
  });

  it('keeps a b tag that really means bold', () => {
    expect(cleanPastedHtml('<p><b>Bold</b></p>')).toBe('<p><strong>Bold</strong></p>');
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

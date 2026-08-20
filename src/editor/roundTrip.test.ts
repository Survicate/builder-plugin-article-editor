import { describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';

const roundTrip = (html: string) => {
  const element = document.createElement('div');
  const editor = createArticleEditor({
    content: html,
    element,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
  const result = serializeEditor(editor);

  editor.destroy();

  return result;
};

const count = (html: string, selector: string) =>
  new DOMParser().parseFromString(html, 'text/html').querySelectorAll(selector).length;

describe('article round-trip', () => {
  it('keeps survey embeds with every data attribute', () => {
    const embed =
      '<div data-article-embed="survey" data-src="https://respondent.survicate.com/x/preview.html" data-embed-height="600"></div>';
    const result = roundTrip(embed);

    expect(count(result, '[data-article-embed="survey"]')).toBe(1);
    expect(result).toContain('data-src="https://respondent.survicate.com/x/preview.html"');
    expect(result).toContain('data-embed-height="600"');
  });

  it('keeps the embed card attributes the site renderer understands', () => {
    const embed =
      '<div data-article-embed="survey" data-src="https://respondent.survicate.com/x/preview.html"' +
      ' data-embed-variant="page" data-embed-cta-href="https://panel.survicate.com/signup?survey=x"' +
      ' data-embed-cta-label="Use this template" data-embed-caption="NPS template"' +
      ' data-embed-aspect="1024:532" data-embed-poster="https://app.arcade.software/og/x"' +
      ' data-embed-page-url="https://demo.arcade.software/x"></div>';
    const result = roundTrip(embed);

    for (const attribute of [
      'data-embed-variant="page"',
      'data-embed-cta-href=',
      'data-embed-cta-label="Use this template"',
      'data-embed-caption="NPS template"',
      'data-embed-aspect="1024:532"',
      'data-embed-poster=',
      'data-embed-page-url=',
    ]) {
      expect(result).toContain(attribute);
    }
  });

  it('keeps every embed kind used by the migrated posts', () => {
    const kinds = ['survey', 'youtube', 'embedly', 'video', 'linkedin', 'arcade'];
    const html = kinds
      .map(
        (kind) => `<div data-article-embed="${kind}" data-src="https://example.com/${kind}"></div>`,
      )
      .join('');

    expect(count(roundTrip(html), '[data-article-embed]')).toBe(kinds.length);
  });

  it('keeps images with their dimensions and alt text', () => {
    const html =
      '<img src="https://cdn.builder.io/api/v1/image/x" alt="Chart" width="800" height="600">';
    const result = roundTrip(html);

    expect(count(result, 'img[width][height]')).toBe(1);
    expect(result).toContain('alt="Chart"');
  });

  it('keeps the image alignment choice', () => {
    const html =
      '<img src="https://cdn.builder.io/api/v1/image/x" alt="" width="800" height="600" data-align="left">';

    expect(roundTrip(html)).toContain('data-align="left"');
  });

  it('keeps a linked image with its target', () => {
    const html =
      '<a href="https://survicate.com/pricing/" target="_blank">' +
      '<img src="https://cdn.builder.io/api/v1/image/x" alt=""></a>';
    const result = roundTrip(html);

    expect(result).toContain('href="https://survicate.com/pricing/"');
    expect(result).toContain('target="_blank"');
    expect(count(result, 'a > img')).toBe(1);
  });

  it('drops an unsafe address wrapped around a pasted image', () => {
    const html =
      '<a href="javascript%3Aalert(1)"><img src="https://cdn.builder.io/api/v1/image/x" alt=""></a>';

    expect(roundTrip(html.replace('%3A', ':'))).not.toContain('href=');
  });

  it('keeps figures with their captions', () => {
    const html =
      '<figure><img src="https://cdn.builder.io/x" alt=""><figcaption>Caption</figcaption></figure>';
    const result = roundTrip(html);

    expect(count(result, 'figure')).toBe(1);
    expect(count(result, 'figcaption')).toBe(1);
  });

  it('keeps tables with their header row', () => {
    const html =
      '<table><thead><tr><th>Tool</th><th>Price</th></tr></thead><tbody><tr><td>A</td><td>$1</td></tr></tbody></table>';

    expect(roundTrip(html)).toBe(html);
  });

  it('does not add nofollow or a target to internal links', () => {
    const result = roundTrip('<p><a href="/blog/csat-vs-nps/">CSAT and NPS</a></p>');

    expect(result).toBe('<p><a href="/blog/csat-vs-nps/">CSAT and NPS</a></p>');
  });

  it('keeps the target an external link already had', () => {
    const result = roundTrip('<p><a href="https://g2.com/x" target="_blank">Review</a></p>');

    expect(result).toContain('target="_blank"');
    expect(result).not.toContain('nofollow');
  });

  it('keeps headings, lists and quotes', () => {
    const result = roundTrip(
      '<h2>Title</h2><h3>Sub</h3><ul><li>One</li></ul><blockquote><p>Q</p></blockquote>',
    );

    expect(count(result, 'h2')).toBe(1);
    expect(count(result, 'h3')).toBe(1);
    expect(count(result, 'li')).toBe(1);
    expect(count(result, 'blockquote')).toBe(1);
  });
});

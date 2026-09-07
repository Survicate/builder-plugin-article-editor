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

describe('cleanPastedHtml tables', () => {
  it('promotes the first row of a headerless table to a thead', () => {
    const html =
      '<table><tbody><tr><td>Name</td><td>Score</td></tr><tr><td>NPS</td><td>42</td></tr></tbody></table>';

    expect(cleanPastedHtml(html)).toBe(
      '<table><thead><tr><th>Name</th><th>Score</th></tr></thead>' +
        '<tbody><tr><td>NPS</td><td>42</td></tr></tbody></table>',
    );
  });

  it('leaves tables that already have header cells untouched', () => {
    const html =
      '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>NPS</td></tr></tbody></table>';

    expect(cleanPastedHtml(html)).toBe(html);
  });
});

describe('cleanPastedHtml survey embeds', () => {
  const surveyIframe =
    '<iframe src="https://respondent.survicate.com/workspaces/abc/surveys/67e48c15929cd5c0/preview.html?autofocus=false"></iframe>';

  it('converts a pasted survey iframe into an embed card with the suggested CTA', () => {
    expect(cleanPastedHtml(surveyIframe)).toBe(
      '<div data-article-embed="survey" ' +
        'data-src="https://respondent.survicate.com/workspaces/abc/surveys/67e48c15929cd5c0/preview.html?autofocus=false" ' +
        'data-embed-cta-href="https://panel.survicate.com/signup?survey=67e48c15929cd5c0"></div>',
    );
  });

  it('absorbs the Webflow CTA embed that follows the survey iframe', () => {
    const html =
      `<div>${surveyIframe}</div>` +
      '<div style="display: flex; justify-content: center;">' +
      '<a class="article-content-primary" href="https://panel.survicate.com/signup?survey=custom">Grab the template</a></div>';
    const result = cleanPastedHtml(html);

    expect(result).toContain(
      'data-embed-cta-href="https://panel.survicate.com/signup?survey=custom"',
    );
    expect(result).toContain('data-embed-cta-label="Grab the template"');
    expect(result).not.toContain('article-content-primary');
  });

  it('ignores iframes from other hosts', () => {
    const html = '<iframe src="https://example.com/widget"></iframe>';

    expect(cleanPastedHtml(html)).not.toContain('data-article-embed');
  });
});

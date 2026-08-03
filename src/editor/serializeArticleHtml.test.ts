import { describe, expect, it } from 'vitest';
import { serializeArticleHtml } from '@/editor/serializeArticleHtml';

describe('serializeArticleHtml', () => {
  it('restores the thead the blog stylesheet targets', () => {
    const html =
      '<table><tbody><tr><th><p>Name</p></th></tr><tr><td><p>Value</p></td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).toBe(
      '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>',
    );
  });

  it('drops the column group and sizing styles the editor adds', () => {
    const html =
      '<table style="min-width: 75px;"><colgroup><col style="min-width: 25px;"></colgroup><tbody><tr><td style="x">A</td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).toBe('<table><tbody><tr><td>A</td></tr></tbody></table>');
  });

  it('drops colspan and rowspan that carry no meaning', () => {
    const html = '<table><tbody><tr><td colspan="1" rowspan="1">A</td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).toBe('<table><tbody><tr><td>A</td></tr></tbody></table>');
  });

  it('keeps spans that do carry meaning', () => {
    const html = '<table><tbody><tr><td colspan="2">A</td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).toContain('colspan="2"');
  });

  it('unwraps the paragraph the editor puts inside list items', () => {
    expect(serializeArticleHtml('<ul><li><p>Item</p></li></ul>')).toBe('<ul><li>Item</li></ul>');
  });

  it('keeps list items that really hold several blocks', () => {
    const html = '<ul><li><p>First</p><p>Second</p></li></ul>';

    expect(serializeArticleHtml(html)).toBe(html);
  });

  it('leaves an existing thead alone', () => {
    const html =
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).toBe(html);
  });

  it('does not promote a body row that mixes headers and data cells', () => {
    const html = '<table><tbody><tr><th>A</th><td>B</td></tr></tbody></table>';

    expect(serializeArticleHtml(html)).not.toContain('thead');
  });
});

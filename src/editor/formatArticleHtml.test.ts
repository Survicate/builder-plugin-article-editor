import { describe, expect, it } from 'vitest';
import { collapseFormattedHtml, formatArticleHtml } from '@/editor/formatArticleHtml';

describe('formatArticleHtml', () => {
  it('indents block structure while keeping inline content on one line', () => {
    const html =
      '<h2>Heading</h2><ul><li>One</li><li>Two <strong>bold</strong></li></ul><p>Text</p>';

    expect(formatArticleHtml(html)).toBe(
      [
        '<h2>Heading</h2>',
        '<ul>',
        '  <li>One</li>',
        '  <li>Two <strong>bold</strong></li>',
        '</ul>',
        '<p>Text</p>',
      ].join('\n'),
    );
  });

  it('indents nested table structure', () => {
    const html = '<table><tbody><tr><td>Cell</td></tr></tbody></table>';

    expect(formatArticleHtml(html)).toBe(
      [
        '<table>',
        '  <tbody>',
        '    <tr>',
        '      <td>Cell</td>',
        '    </tr>',
        '  </tbody>',
        '</table>',
      ].join('\n'),
    );
  });

  it('collapses back to the serialized form', () => {
    const html = '<h2>Heading</h2><ul><li>One</li></ul><p>Keep <em>inline</em> spacing</p>';

    expect(collapseFormattedHtml(formatArticleHtml(html))).toBe(html);
  });
});

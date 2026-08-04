import { describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';

const roundTrip = (html: string) => {
  const editor = createArticleEditor({
    content: html,
    element: document.createElement('div'),
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
  const result = serializeEditor(editor);

  editor.destroy();

  return result;
};

describe('SpanClass', () => {
  it('keeps a class the blog renderer is allowed to style', () => {
    expect(roundTrip('<p><span class="rating">4.6 / 5</span></p>')).toContain(
      '<span class="rating">4.6 / 5</span>',
    );
  });

  it('keeps spans inside table cells', () => {
    const result = roundTrip(
      '<table><tbody><tr><td><span class="desc">Teams using HubSpot</span></td></tr></tbody></table>',
    );

    expect(result).toContain('<span class="desc">Teams using HubSpot</span>');
  });

  it('drops a span that carries no class', () => {
    expect(roundTrip('<p><span>plain text</span></p>')).toBe('<p>plain text</p>');
  });
});

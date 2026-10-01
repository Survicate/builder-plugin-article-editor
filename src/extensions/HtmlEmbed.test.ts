import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';

let editor: Editor | null = null;
let host: HTMLDivElement | null = null;

const build = (content: string) => {
  host = document.createElement('div');
  document.body.append(host);
  editor = createArticleEditor({
    content,
    element: host,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });

  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
  host?.remove();
  host = null;
});

describe('HtmlEmbed', () => {
  it('round-trips raw markup inside the html embed shell', () => {
    const html =
      '<div data-article-embed="html">' +
      '<iframe src="https://open.spotify.com/embed/episode/x" title="Episode"></iframe>' +
      '</div>';

    expect(serializeEditor(build(html))).toBe(html);
  });

  it('wins over the generic embed card, which would drop the inner markup', () => {
    const html =
      '<div data-article-embed="html"><p>Keep me</p></div>' +
      '<div data-article-embed="survey" data-src="https://respondent.survicate.com/x"></div>';
    const result = serializeEditor(build(html));

    expect(result).toContain('<p>Keep me</p>');
    expect(result).toContain('data-article-embed="survey"');
  });

  it('shows the markup in a textarea and saves edits from it', () => {
    const active = build('<div data-article-embed="html"><em>old</em></div>');
    const code = host?.querySelector<HTMLTextAreaElement>('.sv-embed-card__code');

    expect(code?.value).toBe('<em>old</em>');

    if (!code) throw new Error('The embed card did not render its textarea');

    code.value = '<iframe src="https://example.com/form"></iframe>';
    code.dispatchEvent(new Event('change', { bubbles: true }));

    expect(serializeEditor(active)).toContain(
      '<div data-article-embed="html"><iframe src="https://example.com/form"></iframe></div>',
    );
  });
});

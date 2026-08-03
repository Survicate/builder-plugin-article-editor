import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createArticleEditor } from '@/editor/createArticleEditor';

const mountEditor = (content: string) => {
  const element = document.createElement('div');

  document.body.append(element);

  const onContentError = vi.fn();
  const onUpdate = vi.fn();
  const editor = createArticleEditor({ content, element, onContentError, onUpdate });

  return { editor, onContentError, onUpdate };
};

describe('createArticleEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('round-trips paragraphs and inline marks', () => {
    const { editor } = mountEditor(
      '<p>Plain text with <strong>bold</strong> and <em>italic</em>.</p>',
    );

    expect(editor.getHTML()).toBe(
      '<p>Plain text with <strong>bold</strong> and <em>italic</em>.</p>',
    );
    editor.destroy();
  });

  it('round-trips headings, lists and blockquotes', () => {
    const html =
      '<h2>Heading</h2><ul><li><p>Item</p></li></ul><blockquote><p>Quote</p></blockquote>';
    const { editor } = mountEditor(html);

    expect(editor.getHTML()).toBe(html);
    editor.destroy();
  });

  it('reports content that does not fit the schema instead of failing silently', () => {
    const { editor, onContentError } = mountEditor('<p>Body</p>');

    expect(onContentError).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('notifies about updates with the serialized html', () => {
    const { editor, onUpdate } = mountEditor('<p>Start</p>');

    editor.commands.setContent('<p>Changed</p>');

    expect(onUpdate).toHaveBeenCalledWith('<p>Changed</p>');
    editor.destroy();
  });
});

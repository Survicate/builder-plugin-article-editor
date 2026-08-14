import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { AUTHOR_QUOTE_KIND, parseAuthorQuote } from '@/extensions/AuthorQuote';
import { serializeBlockData } from '@/extensions/blockData';

let editor: Editor | null = null;

const setup = (content: string) => {
  editor = createArticleEditor({
    content,
    element: document.createElement('div'),
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });

  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

const QUOTE = {
  avatar: 'https://cdn.builder.io/api/v1/image/assets%2Fabc%2Feylul',
  name: 'Eylül Nowakowska Beyazıt',
  quote: 'The ideal survey is about matching the length to how much your audience cares.',
  role: 'Sales & Customer Success Director, Survicate',
};

describe('AuthorQuote', () => {
  it('round-trips the block with its author untouched', () => {
    const payload = serializeBlockData(QUOTE).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const active = setup(
      `<p>Before</p><div data-article-block="${AUTHOR_QUOTE_KIND}" data-block-data="${payload}"></div>`,
    );
    const out = serializeEditor(active);
    const dataMatch = out.match(/data-block-data="([^"]*)"/);

    expect(out).toContain(`data-article-block="${AUTHOR_QUOTE_KIND}"`);
    expect(dataMatch).not.toBeNull();

    const decoded = (dataMatch as RegExpMatchArray)[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    expect(parseAuthorQuote(decoded)).toEqual(QUOTE);
  });
});

describe('parseAuthorQuote', () => {
  it('normalizes partial payloads to the full shape', () => {
    expect(parseAuthorQuote('{"quote":"Hi","name":7}')).toEqual({
      avatar: '',
      name: '',
      quote: 'Hi',
      role: '',
    });
  });

  it('answers empty for broken payloads', () => {
    expect(parseAuthorQuote('not json')).toEqual({ avatar: '', name: '', quote: '', role: '' });
    expect(parseAuthorQuote(null)).toEqual({ avatar: '', name: '', quote: '', role: '' });
  });
});

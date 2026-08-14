import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { serializeBlockData } from '@/extensions/blockData';
import { DATA_GRAPH_KIND, parseDataGraph } from '@/extensions/DataGraph';

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

const GRAPH = {
  bars: [
    { label: 'Transactional surveys', value: 84 },
    { label: 'Relationship surveys', value: 61 },
  ],
  title: 'Completion rate by survey type',
};

describe('DataGraph', () => {
  it('round-trips the block with its bars untouched', () => {
    const payload = serializeBlockData(GRAPH).replace(/"/g, '&quot;');
    const active = setup(
      `<div data-article-block="${DATA_GRAPH_KIND}" data-block-data="${payload}"></div>`,
    );
    const out = serializeEditor(active);
    const dataMatch = out.match(/data-block-data="([^"]*)"/);

    expect(out).toContain(`data-article-block="${DATA_GRAPH_KIND}"`);
    expect(dataMatch).not.toBeNull();

    const decoded = (dataMatch as RegExpMatchArray)[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    expect(parseDataGraph(decoded)).toEqual(GRAPH);
  });
});

describe('parseDataGraph', () => {
  it('coerces values to non-negative numbers', () => {
    expect(parseDataGraph('{"title":"T","bars":[{"label":"a","value":"42"}]}')).toEqual({
      bars: [{ label: 'a', value: 42 }],
      title: 'T',
    });
    expect(parseDataGraph('{"bars":[{"label":"a","value":-5},{"label":"b","value":"x"}]}')).toEqual(
      {
        bars: [
          { label: 'a', value: 0 },
          { label: 'b', value: 0 },
        ],
        title: '',
      },
    );
  });

  it('answers empty for broken payloads', () => {
    expect(parseDataGraph('nope')).toEqual({ bars: [], title: '' });
    expect(parseDataGraph(null)).toEqual({ bars: [], title: '' });
  });
});

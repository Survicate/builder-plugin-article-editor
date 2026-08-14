import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import {
  EXPERT_ROUNDTABLE_KIND,
  parseExperts,
  serializeExperts,
} from '@/extensions/ExpertRoundtable';

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

const EXPERTS = [
  {
    avatar: 'https://cdn.builder.io/api/v1/image/assets%2Fabc%2Fmarcus',
    name: 'Marcus Hellström',
    quote: 'Context and timing matter enormously.',
    role: 'Head of CX, Fintech',
  },
  {
    avatar: '',
    name: 'Priya Nambiar',
    quote: 'You need both metrics on the dashboard.',
    role: 'UX Researcher, SaaS',
  },
];

describe('ExpertRoundtable', () => {
  it('round-trips the block with its experts untouched', () => {
    const payload = serializeExperts(EXPERTS);
    const html = `<div data-article-block="${EXPERT_ROUNDTABLE_KIND}" data-block-data="${payload.replace(/"/g, '&quot;')}"></div>`;
    const active = setup(`<p>Before</p>${html}<p>After</p>`);
    const out = serializeEditor(active);
    const dataMatch = out.match(/data-block-data="([^"]*)"/);

    expect(out).toContain(`data-article-block="${EXPERT_ROUNDTABLE_KIND}"`);
    expect(dataMatch).not.toBeNull();

    const decoded = (dataMatch as RegExpMatchArray)[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    expect(parseExperts(decoded)).toEqual(EXPERTS);
  });

  it('inserts as a block through the editor api', () => {
    const active = setup('<p></p>');

    active
      .chain()
      .insertContent({
        attrs: { 'data-block-data': serializeExperts(EXPERTS) },
        type: 'expertRoundtable',
      })
      .run();

    expect(serializeEditor(active)).toContain(`data-article-block="${EXPERT_ROUNDTABLE_KIND}"`);
  });
});

describe('parseExperts', () => {
  it('normalizes partial entries to full expert shapes', () => {
    expect(parseExperts('[{"name":"Ola"},{"quote":"Hi","role":7}]')).toEqual([
      { avatar: '', name: 'Ola', quote: '', role: '' },
      { avatar: '', name: '', quote: 'Hi', role: '' },
    ]);
  });

  it('answers with nothing for broken or non-list payloads', () => {
    expect(parseExperts('not json')).toEqual([]);
    expect(parseExperts('{"name":"Ola"}')).toEqual([]);
    expect(parseExperts('')).toEqual([]);
    expect(parseExperts(null)).toEqual([]);
  });
});

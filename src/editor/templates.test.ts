import { describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { ARTICLE_TEMPLATES, matchTemplates } from '@/editor/templates';

const mountEditor = () => {
  const element = document.createElement('div');

  return createArticleEditor({
    content: '<p></p>',
    element,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
};

describe('matchTemplates', () => {
  it('returns everything when nothing is typed', () => {
    expect(matchTemplates('')).toHaveLength(ARTICLE_TEMPLATES.length);
  });

  it('finds the survey template by its name and by keyword', () => {
    expect(matchTemplates('survey')[0].label).toBe('Survicate survey');
    expect(matchTemplates('nps')[0].label).toBe('Survicate survey');
  });

  it('returns nothing for an unknown query', () => {
    expect(matchTemplates('zzzz')).toHaveLength(0);
  });
});

describe('article templates', () => {
  it('offers every heading level the blog styles, down to h5', () => {
    const editor = mountEditor();

    for (const [label, tag] of [
      ['Heading', '<h2>'],
      ['Sub heading', '<h3>'],
      ['Small heading', '<h4>'],
      ['Smallest heading', '<h5>'],
    ] as const) {
      editor.commands.setContent('<p>Structure</p>');
      editor.commands.selectAll();
      ARTICLE_TEMPLATES.find((template) => template.label === label)?.run(editor);
      expect(serializeEditor(editor)).toContain(tag);
    }

    editor.destroy();
  });

  it('finds the new heading levels by their tag names', () => {
    expect(matchTemplates('h4')[0].label).toBe('Small heading');
    expect(matchTemplates('h5')[0].label).toBe('Smallest heading');
  });

  it('inserts a survey embed the migration pipeline would recognise', () => {
    const editor = mountEditor();
    const survey = ARTICLE_TEMPLATES.find((template) => template.label === 'Survicate survey');

    survey?.run(editor);

    const html = serializeEditor(editor);

    expect(html).toContain('data-article-embed="survey"');
    expect(html).toContain('data-embed-height="600"');
    editor.destroy();
  });

  it('inserts a table that keeps its header row after serialization', () => {
    const editor = mountEditor();
    const table = ARTICLE_TEMPLATES.find((template) => template.label === 'Table');

    table?.run(editor);

    const html = serializeEditor(editor);

    expect(html).toContain('<thead>');
    expect(html).not.toContain('colgroup');
    editor.destroy();
  });

  it('covers every embed kind the blog uses today', () => {
    const embedLabels = ARTICLE_TEMPLATES.filter((template) => template.group === 'Embeds').map(
      (template) => template.label,
    );

    expect(embedLabels).toContain('Survicate survey');
    expect(embedLabels).toContain('YouTube video');
  });
});

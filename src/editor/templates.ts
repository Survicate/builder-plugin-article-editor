import '@/extensions/ImageUpload';
import type { Editor, Range } from '@tiptap/core';

export interface ArticleTemplate {
  group: 'Text' | 'Blocks' | 'Embeds';
  hint: string;
  keywords: string[];
  label: string;
  run: (editor: Editor, range?: Range) => void;
}

const chain = (editor: Editor, range?: Range) =>
  range ? editor.chain().focus().deleteRange(range) : editor.chain().focus();

const insertEmbed = (editor: Editor, kind: string, height: string, range?: Range) =>
  chain(editor, range)
    .insertContent({
      attrs: { 'data-article-embed': kind, 'data-embed-height': height, 'data-src': '' },
      type: 'articleEmbed',
    })
    .run();

export const ARTICLE_TEMPLATES: ArticleTemplate[] = [
  {
    group: 'Text',
    hint: 'Section title',
    keywords: ['h2', 'heading', 'section', 'title'],
    label: 'Heading',
    run: (editor, range) => chain(editor, range).setNode('heading', { level: 2 }).run(),
  },
  {
    group: 'Text',
    hint: 'Smaller title inside a section',
    keywords: ['h3', 'subheading', 'sub'],
    label: 'Sub heading',
    run: (editor, range) => chain(editor, range).setNode('heading', { level: 3 }).run(),
  },
  {
    group: 'Text',
    hint: 'Bulleted list',
    keywords: ['bullet', 'list', 'ul'],
    label: 'Bulleted list',
    run: (editor, range) => chain(editor, range).toggleBulletList().run(),
  },
  {
    group: 'Text',
    hint: 'Numbered list',
    keywords: ['number', 'ordered', 'list', 'ol'],
    label: 'Numbered list',
    run: (editor, range) => chain(editor, range).toggleOrderedList().run(),
  },
  {
    group: 'Blocks',
    hint: 'Highlighted quote card',
    keywords: ['quote', 'blockquote', 'callout'],
    label: 'Quote',
    run: (editor, range) => chain(editor, range).toggleBlockquote().run(),
  },
  {
    group: 'Blocks',
    hint: 'Table with a header row',
    keywords: ['table', 'grid', 'comparison'],
    label: 'Table',
    run: (editor, range) =>
      chain(editor, range).insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run(),
  },
  {
    group: 'Blocks',
    hint: 'Upload a picture from your computer',
    keywords: ['image', 'picture', 'photo', 'screenshot', 'upload'],
    label: 'Image',
    run: (editor, range) => {
      chain(editor, range).run();
      editor.storage.imageUpload.pickAndInsert();
    },
  },
  {
    group: 'Blocks',
    hint: 'Horizontal divider',
    keywords: ['divider', 'rule', 'hr', 'separator'],
    label: 'Divider',
    run: (editor, range) => chain(editor, range).setHorizontalRule().run(),
  },
  {
    group: 'Embeds',
    hint: 'Survey from respondent.survicate.com',
    keywords: ['survey', 'survicate', 'form', 'nps'],
    label: 'Survicate survey',
    run: (editor, range) => insertEmbed(editor, 'survey', '600', range),
  },
  {
    group: 'Embeds',
    hint: 'Video from YouTube',
    keywords: ['youtube', 'video', 'embed'],
    label: 'YouTube video',
    run: (editor, range) => insertEmbed(editor, 'youtube', '315', range),
  },
  {
    group: 'Embeds',
    hint: 'Post from LinkedIn',
    keywords: ['linkedin', 'post', 'social'],
    label: 'LinkedIn post',
    run: (editor, range) => insertEmbed(editor, 'linkedin', '985', range),
  },
  {
    group: 'Embeds',
    hint: 'Interactive Arcade demo',
    keywords: ['arcade', 'demo', 'interactive'],
    label: 'Arcade demo',
    run: (editor, range) => insertEmbed(editor, 'arcade', '600', range),
  },
];

export const matchTemplates = (query: string): ArticleTemplate[] => {
  const needle = query.trim().toLowerCase();

  if (!needle) return ARTICLE_TEMPLATES;

  return ARTICLE_TEMPLATES.filter(
    (template) =>
      template.label.toLowerCase().includes(needle) ||
      template.keywords.some((keyword) => keyword.startsWith(needle)),
  );
};

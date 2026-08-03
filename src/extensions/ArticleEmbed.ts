import { mergeAttributes, Node } from '@tiptap/core';

export const EMBED_LABELS: Record<string, string> = {
  arcade: 'Arcade demo',
  embedly: 'Embedded content',
  linkedin: 'LinkedIn post',
  survey: 'Survicate survey',
  video: 'Video',
  youtube: 'YouTube video',
};

const attributeFromData = (dataName: string) => ({
  parseHTML: (element: HTMLElement) => element.getAttribute(dataName),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[dataName];

    return value === null || value === undefined || value === '' ? {} : { [dataName]: value };
  },
});

export const ArticleEmbed = Node.create({
  addAttributes() {
    return {
      'data-article-embed': attributeFromData('data-article-embed'),
      'data-embed-height': attributeFromData('data-embed-height'),
      'data-embed-title': attributeFromData('data-embed-title'),
      'data-embed-width': attributeFromData('data-embed-width'),
      'data-src': attributeFromData('data-src'),
    };
  },

  addNodeView() {
    return ({ node }) => {
      const kind = (node.attrs['data-article-embed'] as string | null) ?? '';
      const source = (node.attrs['data-src'] as string | null) ?? '';
      const dom = document.createElement('div');
      const label = document.createElement('span');
      const url = document.createElement('span');

      dom.className = 'sv-embed-card';
      dom.dataset.embedKind = kind;
      dom.contentEditable = 'false';
      label.className = 'sv-embed-card__label';
      label.textContent = EMBED_LABELS[kind] ?? 'Embedded content';
      url.className = 'sv-embed-card__url';
      url.textContent = source;
      dom.append(label, url);

      return { dom };
    };
  },

  atom: true,

  draggable: true,

  group: 'block',

  name: 'articleEmbed',

  parseHTML() {
    return [{ priority: 60, tag: 'div[data-article-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

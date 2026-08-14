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
    return ({ editor, getPos, node }) => {
      const kind = (node.attrs['data-article-embed'] as string | null) ?? '';
      const source = (node.attrs['data-src'] as string | null) ?? '';
      const dom = document.createElement('div');
      const label = document.createElement('span');
      const input = document.createElement('input');

      dom.className = 'sv-embed-card';
      dom.dataset.embedKind = kind;
      dom.contentEditable = 'false';
      label.className = 'sv-embed-card__label';
      label.textContent = EMBED_LABELS[kind] ?? 'Embedded content';

      input.className = 'sv-embed-card__input';
      input.placeholder = 'Paste the embed address, starting with https://';
      input.type = 'url';
      input.addEventListener('mousedown', (event) => event.stopPropagation());
      input.addEventListener('keydown', (event) => event.stopPropagation());
      input.addEventListener('change', () => {
        const position = typeof getPos === 'function' ? getPos() : null;
        const value = input.value.trim();

        if (position === null || position === undefined || !value.startsWith('https://')) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'data-src', value);

            return true;
          })
          .run();
      });

      const showInput = () => {
        input.value = source;
        dom.replaceChildren(label, input);
        input.focus();
      };

      if (!source) {
        dom.replaceChildren(label, input);

        return { dom };
      }

      const url = document.createElement('span');
      const edit = document.createElement('button');

      url.className = 'sv-embed-card__url';
      url.textContent = source;
      edit.type = 'button';
      edit.className = 'sv-embed-card__edit';
      edit.textContent = 'Change address';
      edit.addEventListener('mousedown', (event) => event.stopPropagation());
      edit.addEventListener('click', showInput);
      input.addEventListener('blur', () => {
        if (input.value.trim() === source) dom.replaceChildren(label, url, edit);
      });
      dom.replaceChildren(label, url, edit);

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

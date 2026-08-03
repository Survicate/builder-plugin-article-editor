import { mergeAttributes, Node } from '@tiptap/core';

const plainAttribute = (name: string) => ({
  parseHTML: (element: HTMLElement) => element.getAttribute(name),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[name];

    return value === null || value === undefined ? {} : { [name]: value };
  },
});

export const ArticleImage = Node.create({
  addAttributes() {
    return {
      alt: plainAttribute('alt'),
      height: plainAttribute('height'),
      src: plainAttribute('src'),
      width: plainAttribute('width'),
    };
  },

  draggable: true,

  group: 'block',

  name: 'articleImage',

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

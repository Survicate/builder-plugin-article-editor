import { mergeAttributes, Node } from '@tiptap/core';

const plainAttribute = (name: string) => ({
  parseHTML: (element: HTMLElement) => element.getAttribute(name),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[name];

    return value === null || value === undefined ? {} : { [name]: value };
  },
});

const linkAttribute = (name: string) => ({
  parseHTML: (element: HTMLElement) => element.closest('a[href]')?.getAttribute(name) ?? null,
  renderHTML: () => ({}),
});

export const ArticleImage = Node.create({
  addAttributes() {
    return {
      alt: plainAttribute('alt'),
      height: plainAttribute('height'),
      href: linkAttribute('href'),
      src: plainAttribute('src'),
      target: linkAttribute('target'),
      width: plainAttribute('width'),
    };
  },

  draggable: true,

  group: 'block',

  name: 'articleImage',

  parseHTML() {
    return [{ priority: 60, tag: 'a[href] img[src]' }, { tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const image = ['img', mergeAttributes(HTMLAttributes)];
    const href = node.attrs.href as string | null;

    if (!href) return image as never;

    const target = node.attrs.target as string | null;

    return ['a', { href, ...(target === null ? {} : { target }) }, image] as never;
  },

  selectable: true,
});

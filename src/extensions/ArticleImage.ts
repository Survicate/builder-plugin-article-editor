import { mergeAttributes, Node } from '@tiptap/core';
import { dropUnsafeHref } from '@/editor/normalizeHref';

const plainAttribute = (name: string) => ({
  parseHTML: (element: HTMLElement) => element.getAttribute(name),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[name];

    return value === null || value === undefined || value === '' ? {} : { [name]: value };
  },
});

const linkAttribute = (name: string) => ({
  parseHTML: (element: HTMLElement) => element.closest('a[href]')?.getAttribute(name) ?? null,
  renderHTML: () => ({}),
});

const linkHrefAttribute = () => ({
  parseHTML: (element: HTMLElement) =>
    dropUnsafeHref(element.closest('a[href]')?.getAttribute('href') ?? null),
  renderHTML: () => ({}),
});

export const ArticleImage = Node.create({
  addAttributes() {
    return {
      alt: plainAttribute('alt'),
      height: plainAttribute('height'),
      href: linkHrefAttribute(),
      src: plainAttribute('src'),
      target: linkAttribute('target'),
      width: plainAttribute('width'),
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const dom = document.createElement('div');
      const image = document.createElement('img');
      const altField = document.createElement('input');

      dom.className = 'sv-image';
      image.className = 'sv-image__picture';
      image.src = (node.attrs.src as string | null) ?? '';
      image.alt = (node.attrs.alt as string | null) ?? '';

      altField.className = 'sv-image__alt';
      altField.type = 'text';
      altField.placeholder = 'Describe this image for search engines and screen readers';
      altField.value = (node.attrs.alt as string | null) ?? '';
      altField.addEventListener('mousedown', (event) => event.stopPropagation());
      altField.addEventListener('keydown', (event) => event.stopPropagation());
      altField.addEventListener('change', () => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'alt', altField.value.trim());

            return true;
          })
          .run();
      });

      dom.append(image, altField);

      return {
        deselectNode: () => dom.classList.remove('is-selected'),
        dom,
        ignoreMutation: () => true,
        selectNode: () => {
          dom.classList.add('is-selected');
          altField.focus();
        },
        update: (updated) => {
          if (updated.type.name !== node.type.name) return false;

          image.src = (updated.attrs.src as string | null) ?? '';
          image.alt = (updated.attrs.alt as string | null) ?? '';

          if (document.activeElement !== altField) {
            altField.value = (updated.attrs.alt as string | null) ?? '';
          }

          return true;
        },
      };
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

import { mergeAttributes, Node } from '@tiptap/core';
import { dropUnsafeHref, normalizeHref } from '@/editor/normalizeHref';

const ALIGN_CHOICES = [
  { label: '◧', title: 'Text wraps on the right', value: 'left' },
  { label: '▣', title: 'Centered', value: 'center' },
  { label: '◨', title: 'Text wraps on the left', value: 'right' },
  { label: '⬜', title: 'Full width', value: 'full' },
] as const;

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

const stopEditorEvents = (element: HTMLElement) => {
  element.addEventListener('mousedown', (event) => event.stopPropagation());
  element.addEventListener('keydown', (event) => event.stopPropagation());
};

export const ArticleImage = Node.create({
  addAttributes() {
    return {
      align: {
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.align ? { 'data-align': attributes.align } : {},
      },
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
      const controls = document.createElement('div');
      const alignGroup = document.createElement('div');
      const linkField = document.createElement('input');
      const newTabLabel = document.createElement('label');
      const newTabBox = document.createElement('input');

      const setAttributes = (values: Record<string, string | null>) => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            for (const [name, value] of Object.entries(values)) {
              tr.setNodeAttribute(position, name, value);
            }

            return true;
          })
          .run();
      };

      dom.className = 'sv-image';
      dom.dataset.align = (node.attrs.align as string | null) ?? '';
      image.className = 'sv-image__picture';
      image.src = (node.attrs.src as string | null) ?? '';
      image.alt = (node.attrs.alt as string | null) ?? '';

      altField.className = 'sv-image__alt';
      altField.type = 'text';
      altField.placeholder = 'Describe this image for search engines and screen readers';
      altField.value = (node.attrs.alt as string | null) ?? '';
      stopEditorEvents(altField);
      altField.addEventListener('change', () => {
        setAttributes({ alt: altField.value.trim() });
      });

      controls.className = 'sv-image__controls';
      alignGroup.className = 'sv-image__align';

      const alignButtons = ALIGN_CHOICES.map((choice) => {
        const button = document.createElement('button');

        button.className = 'sv-image__align-button';
        button.type = 'button';
        button.textContent = choice.label;
        button.title = choice.title;
        stopEditorEvents(button);
        button.addEventListener('click', () => {
          const current = dom.dataset.align ?? '';

          setAttributes({ align: current === choice.value ? null : choice.value });
        });
        alignGroup.append(button);

        return { button, value: choice.value };
      });

      const reflectAlign = (align: string | null) => {
        dom.dataset.align = align ?? '';

        for (const entry of alignButtons) {
          entry.button.classList.toggle('is-active', entry.value === align);
        }
      };

      linkField.className = 'sv-image__link';
      linkField.type = 'text';
      linkField.placeholder = 'Link this image to an address (optional)';
      linkField.value = (node.attrs.href as string | null) ?? '';
      stopEditorEvents(linkField);
      linkField.addEventListener('change', () => {
        const href = normalizeHref(linkField.value);

        linkField.value = href;
        setAttributes({ href: href || null, ...(href ? {} : { target: null }) });
      });

      newTabBox.type = 'checkbox';
      newTabBox.checked = node.attrs.target === '_blank';
      stopEditorEvents(newTabBox);
      newTabBox.addEventListener('change', () => {
        setAttributes({ target: newTabBox.checked ? '_blank' : null });
      });
      newTabLabel.className = 'sv-image__newtab';
      newTabLabel.append(newTabBox, document.createTextNode('New tab'));

      controls.append(alignGroup, linkField, newTabLabel);
      dom.append(image, altField, controls);
      reflectAlign((node.attrs.align as string | null) ?? null);

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
          reflectAlign((updated.attrs.align as string | null) ?? null);

          if (document.activeElement !== altField) {
            altField.value = (updated.attrs.alt as string | null) ?? '';
          }

          if (document.activeElement !== linkField) {
            linkField.value = (updated.attrs.href as string | null) ?? '';
          }

          newTabBox.checked = updated.attrs.target === '_blank';

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

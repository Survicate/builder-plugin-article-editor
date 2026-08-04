import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Keeps `<span class="...">` wrappers that hand-written article tables rely on.
 * The blog renderer allows a class on spans, so dropping them here would change
 * how a published post looks the moment somebody opens it in the editor.
 */
export const SpanClass = Mark.create({
  addAttributes() {
    return {
      class: {
        parseHTML: (element: HTMLElement) => element.getAttribute('class'),
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes.class;

          return value === null || value === undefined || value === '' ? {} : { class: value };
        },
      },
    };
  },

  name: 'spanClass',

  parseHTML() {
    return [{ tag: 'span[class]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

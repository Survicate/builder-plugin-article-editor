import { Node } from '@tiptap/core';
import { stopsInteractiveEvents } from '@/extensions/blockFields';

/**
 * Raw markup block for one-off embeds the dedicated cards do not cover. The
 * markup lives in an attribute and is only ever shown inside a textarea, so
 * nothing from it runs in the dashboard; the site build sanitizes it before
 * it reaches readers (iframes render, scripts are stripped).
 */
export const HtmlEmbed = Node.create({
  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (element: HTMLElement) => element.innerHTML,
        renderHTML: () => ({}),
      },
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const dom = document.createElement('div');
      const label = document.createElement('span');
      const code = document.createElement('textarea');
      const hint = document.createElement('span');

      dom.className = 'sv-embed-card sv-embed-card--html';
      dom.contentEditable = 'false';
      label.className = 'sv-embed-card__label';
      label.textContent = 'HTML embed';
      hint.className = 'sv-embed-card__hint';
      hint.textContent = 'Rendered as-is on the blog. Iframes work; scripts are stripped.';

      code.className = 'sv-embed-card__code';
      code.placeholder = '<iframe src="https://..."></iframe>';
      code.value = (node.attrs.html as string | null) ?? '';
      code.rows = 5;
      code.spellcheck = false;
      code.addEventListener('mousedown', (event) => event.stopPropagation());
      code.addEventListener('keydown', (event) => event.stopPropagation());
      code.addEventListener('change', () => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'html', code.value.trim());

            return true;
          })
          .run();
      });

      dom.append(label, code, hint);

      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: stopsInteractiveEvents,
        update: (updated) => {
          if (updated.type.name !== 'htmlEmbed') return false;

          if (document.activeElement !== code) {
            code.value = (updated.attrs.html as string | null) ?? '';
          }

          return true;
        },
      };
    };
  },

  atom: true,

  draggable: true,

  group: 'block',

  name: 'htmlEmbed',

  parseHTML() {
    return [{ priority: 70, tag: 'div[data-article-embed="html"]' }];
  },

  renderHTML({ node }) {
    const dom = document.createElement('div');

    dom.setAttribute('data-article-embed', 'html');
    dom.innerHTML = (node.attrs.html as string | null) ?? '';

    return dom as never;
  },

  selectable: true,
});

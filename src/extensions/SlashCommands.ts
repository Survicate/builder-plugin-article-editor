import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { positionNear } from '@/editor/positionNear';
import { createTemplateMenu, type TemplateMenu } from '@/editor/templateMenu';
import { type ArticleTemplate, matchTemplates } from '@/editor/templates';

export const SlashCommands = Extension.create({
  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: '/',
        command: ({ editor, props, range }) => props.run(editor, range),
        debounce: 0,
        editor: this.editor,
        items: ({ query }) => matchTemplates(query),
        render: () => {
          let menu: TemplateMenu | null = null;
          let selected = 0;
          let items: ArticleTemplate[] = [];
          let commandFn: ((template: ArticleTemplate) => void) | null = null;

          const position = (rect: DOMRect | null) => {
            if (menu) positionNear(menu.element, rect);
          };

          return {
            onExit: () => {
              menu?.destroy();
              menu = null;
            },
            onKeyDown: ({ event }) => {
              if (!menu || !items.length) return false;

              if (event.key === 'ArrowDown') {
                selected = (selected + 1) % items.length;
                menu.update(items, selected);

                return true;
              }

              if (event.key === 'ArrowUp') {
                selected = (selected - 1 + items.length) % items.length;
                menu.update(items, selected);

                return true;
              }

              if (event.key === 'Enter') {
                commandFn?.(items[selected]);

                return true;
              }

              return false;
            },
            onStart: ({ clientRect, command, items: nextItems }) => {
              selected = 0;
              items = nextItems;
              commandFn = (template) => command(template);
              menu = createTemplateMenu((template) => commandFn?.(template));
              menu.update(items, selected);
              position(clientRect?.() ?? null);
            },
            onUpdate: ({ clientRect, command, items: nextItems }) => {
              items = nextItems;
              selected = 0;
              commandFn = (template) => command(template);
              menu?.update(items, selected);
              position(clientRect?.() ?? null);
            },
          };
        },
        startOfLine: false,
      }),
    ];
  },

  name: 'slashCommands',
});

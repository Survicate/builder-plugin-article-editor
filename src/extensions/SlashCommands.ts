import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { positionNear } from '@/editor/positionNear';
import { type ArticleTemplate, matchTemplates } from '@/editor/templates';

const MENU_CLASS = 'sv-slash-menu';

interface MenuState {
  destroy: () => void;
  select: (index: number) => void;
  update: (items: ArticleTemplate[], index: number) => void;
}

const createMenu = (onPick: (template: ArticleTemplate) => void): MenuState => {
  const menu = document.createElement('div');
  let current: ArticleTemplate[] = [];

  menu.className = MENU_CLASS;
  document.body.append(menu);

  const update = (items: ArticleTemplate[], index: number) => {
    current = items;
    menu.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('div');

      empty.className = `${MENU_CLASS}__empty`;
      empty.textContent = 'Nothing matches';
      menu.append(empty);

      return;
    }

    let lastGroup = '';

    items.forEach((item, itemIndex) => {
      if (item.group !== lastGroup) {
        const heading = document.createElement('div');

        heading.className = `${MENU_CLASS}__group`;
        heading.textContent = item.group;
        menu.append(heading);
        lastGroup = item.group;
      }

      const button = document.createElement('button');
      const label = document.createElement('span');
      const hint = document.createElement('span');

      button.type = 'button';
      button.className = `${MENU_CLASS}__item${itemIndex === index ? ' is-selected' : ''}`;
      label.className = `${MENU_CLASS}__label`;
      label.textContent = item.label;
      hint.className = `${MENU_CLASS}__hint`;
      hint.textContent = item.hint;
      button.append(label, hint);
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => onPick(item));
      menu.append(button);
    });
  };

  return {
    destroy: () => menu.remove(),
    select: (index) => onPick(current[index]),
    update,
  };
};

const positionMenu = (rect: DOMRect | null) => {
  const menu = document.querySelector<HTMLElement>(`.${MENU_CLASS}`);

  if (menu) positionNear(menu, rect);
};

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
          let menu: MenuState | null = null;
          let selected = 0;
          let items: ArticleTemplate[] = [];
          let commandFn: ((template: ArticleTemplate) => void) | null = null;

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
              menu = createMenu((template) => commandFn?.(template));
              menu.update(items, selected);
              positionMenu(clientRect?.() ?? null);
            },
            onUpdate: ({ clientRect, command, items: nextItems }) => {
              items = nextItems;
              selected = 0;
              commandFn = (template) => command(template);
              menu?.update(items, selected);
              positionMenu(clientRect?.() ?? null);
            },
          };
        },
        startOfLine: false,
      }),
    ];
  },

  name: 'slashCommands',
});

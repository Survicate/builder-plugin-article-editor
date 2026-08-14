import type { Editor } from '@tiptap/core';
import { positionNear } from '@/editor/positionNear';
import { type ArticleTemplate, matchTemplates } from '@/editor/templates';

export const MENU_CLASS = 'sv-slash-menu';

export interface TemplateMenu {
  destroy: () => void;
  element: HTMLElement;
  select: (index: number) => void;
  update: (items: ArticleTemplate[], index: number) => void;
}

export const createTemplateMenu = (onPick: (template: ArticleTemplate) => void): TemplateMenu => {
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
    element: menu,
    select: (index) => onPick(current[index]),
    update,
  };
};

let closeActiveInsertMenu: (() => void) | null = null;

export const openInsertMenu = (editor: Editor, anchor: HTMLElement) => {
  if (closeActiveInsertMenu) {
    closeActiveInsertMenu();

    return;
  }

  const items = matchTemplates('');
  let selected = -1;

  const close = () => {
    closeActiveInsertMenu = null;
    menu.destroy();
    document.removeEventListener('mousedown', closeOnOutsideClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  };

  const closeOnOutsideClick = (event: MouseEvent) => {
    const target = event.target as globalThis.Node;

    if (!menu.element.contains(target) && !anchor.contains(target)) close();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();

      if (!editor.isDestroyed) editor.commands.focus();

      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      menu.update(items, selected);

      return;
    }

    if (event.key === 'Enter' && selected >= 0) {
      event.preventDefault();
      menu.select(selected);
    }
  };

  const menu = createTemplateMenu((template) => {
    close();
    template.run(editor);
  });

  menu.update(items, selected);
  positionNear(menu.element, anchor.getBoundingClientRect());
  document.addEventListener('mousedown', closeOnOutsideClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  closeActiveInsertMenu = close;
};

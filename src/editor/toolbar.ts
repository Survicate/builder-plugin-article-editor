import type { Editor } from '@tiptap/core';

interface ToolbarItem {
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  label: string;
  run: (editor: Editor) => void;
  title: string;
  wide?: boolean;
}

const SEPARATOR = 'separator';

const ITEMS: (ToolbarItem | typeof SEPARATOR)[] = [
  {
    isDisabled: (editor) => !editor.can().undo(),
    label: '↶',
    run: (editor) => editor.chain().focus().undo().run(),
    title: 'Undo',
  },
  {
    isDisabled: (editor) => !editor.can().redo(),
    label: '↷',
    run: (editor) => editor.chain().focus().redo().run(),
    title: 'Redo',
  },
  SEPARATOR,
  {
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    label: 'H2',
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    title: 'Section heading',
    wide: true,
  },
  {
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    label: 'H3',
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    title: 'Sub heading',
    wide: true,
  },
  SEPARATOR,
  {
    isActive: (editor) => editor.isActive('bold'),
    label: 'B',
    run: (editor) => editor.chain().focus().toggleBold().run(),
    title: 'Bold',
  },
  {
    isActive: (editor) => editor.isActive('italic'),
    label: 'I',
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    title: 'Italic',
  },
  SEPARATOR,
  {
    isActive: (editor) => editor.isActive('bulletList'),
    label: '•',
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    title: 'Bulleted list',
  },
  {
    isActive: (editor) => editor.isActive('orderedList'),
    label: '1.',
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    title: 'Numbered list',
    wide: true,
  },
  {
    isActive: (editor) => editor.isActive('blockquote'),
    label: '❝',
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    title: 'Quote',
  },
  SEPARATOR,
  {
    isActive: (editor) => editor.isActive('table'),
    label: '▦',
    run: (editor) =>
      editor.chain().focus().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run(),
    title: 'Insert table',
  },
];

const createButton = (item: ToolbarItem, editor: Editor) => {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = `sv-toolbar__button${item.wide === true ? ' sv-toolbar__button--wide' : ''}`;
  button.textContent = item.label;
  button.title = item.title;
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => item.run(editor));

  return button;
};

export const createToolbar = (editor: Editor): HTMLElement => {
  const toolbar = document.createElement('div');
  const updaters: (() => void)[] = [];

  toolbar.className = 'sv-toolbar';

  ITEMS.forEach((item) => {
    if (item === SEPARATOR) {
      const separator = document.createElement('span');

      separator.className = 'sv-toolbar__separator';
      toolbar.append(separator);

      return;
    }

    const button = createButton(item, editor);

    toolbar.append(button);
    updaters.push(() => {
      button.classList.toggle('is-active', item.isActive?.(editor) === true);
      button.disabled = item.isDisabled?.(editor) === true;
    });
  });

  const update = () => updaters.forEach((updater) => updater());

  editor.on('transaction', update);
  editor.on('selectionUpdate', update);
  update();

  return toolbar;
};

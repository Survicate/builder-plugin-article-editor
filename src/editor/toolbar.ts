import '@/extensions/ImageUpload';
import type { Editor } from '@tiptap/core';
import { openLinkDialog } from '@/editor/linkDialog';

interface ToolbarItem {
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  isHidden?: (editor: Editor) => boolean;
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
  {
    isActive: (editor) => editor.isActive('link'),
    label: 'Link',
    run: (editor) => openLinkDialog(editor),
    title: 'Add or edit a link (⌘K)',
    wide: true,
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
    isHidden: (editor) => editor.isActive('table'),
    label: '▦',
    run: (editor) =>
      editor.chain().focus().insertTable({ cols: 3, rows: 3, withHeaderRow: true }).run(),
    title: 'Insert table',
  },
  {
    label: 'Image',
    run: (editor) => editor.storage.imageUpload.pickAndInsert(),
    title: 'Upload an image from your computer',
    wide: true,
  },
];

const TABLE_ITEMS: ToolbarItem[] = [
  {
    label: '+ row',
    run: (editor) => editor.chain().focus().addRowAfter().run(),
    title: 'Add a row below the current one',
    wide: true,
  },
  {
    label: '+ col',
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
    title: 'Add a column to the right',
    wide: true,
  },
  {
    label: '− row',
    run: (editor) => editor.chain().focus().deleteRow().run(),
    title: 'Delete the current row',
    wide: true,
  },
  {
    label: '− col',
    run: (editor) => editor.chain().focus().deleteColumn().run(),
    title: 'Delete the current column',
    wide: true,
  },
  {
    label: 'Header',
    run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
    title: 'Toggle the header row',
    wide: true,
  },
  {
    label: '✕ table',
    run: (editor) => editor.chain().focus().deleteTable().run(),
    title: 'Delete the whole table',
    wide: true,
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

const createInsertButton = (editor: Editor) => {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'sv-toolbar__insert';
  button.textContent = '+ Insert';
  button.title = 'Insert a template (or type / in the text)';
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => editor.chain().focus().insertContent('/').run());

  return button;
};

export const createToolbar = (editor: Editor): HTMLElement => {
  const toolbar = document.createElement('div');
  const updaters: (() => void)[] = [];

  toolbar.className = 'sv-toolbar';
  toolbar.append(createInsertButton(editor));

  const insertSeparator = document.createElement('span');

  insertSeparator.className = 'sv-toolbar__separator';
  toolbar.append(insertSeparator);

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
      button.hidden = item.isHidden?.(editor) === true;
    });
  });

  const tableGroup = document.createElement('span');

  tableGroup.className = 'sv-toolbar__group';
  TABLE_ITEMS.forEach((item) => tableGroup.append(createButton(item, editor)));
  toolbar.append(tableGroup);
  updaters.push(() => {
    tableGroup.hidden = !editor.isActive('table');
  });

  const update = () => updaters.forEach((updater) => updater());

  editor.on('transaction', update);
  editor.on('selectionUpdate', update);
  update();

  return toolbar;
};

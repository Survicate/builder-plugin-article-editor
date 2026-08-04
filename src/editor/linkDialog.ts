import type { Editor } from '@tiptap/core';
import { normalizeHref } from '@/editor/normalizeHref';
import { positionNear, selectionRect } from '@/editor/positionNear';

const DIALOG_CLASS = 'sv-link-dialog';

export const applyLink = (editor: Editor, rawHref: string) => {
  const href = normalizeHref(rawHref);
  const chain = editor.chain().focus().extendMarkRange('link');

  if (!href) return chain.unsetLink().run();

  if (editor.state.selection.empty) {
    return chain
      .insertContent({ marks: [{ attrs: { href }, type: 'link' }], text: href, type: 'text' })
      .run();
  }

  return chain.setLink({ href }).run();
};

const buildDialog = (currentHref: string, onApply: (href: string) => void, onClose: () => void) => {
  const dialog = document.createElement('div');
  const input = document.createElement('input');
  const actions = document.createElement('div');
  const apply = document.createElement('button');

  dialog.className = DIALOG_CLASS;
  input.className = `${DIALOG_CLASS}__input`;
  input.type = 'text';
  input.placeholder = 'Paste an address or type /pricing/';
  input.value = currentHref;
  actions.className = `${DIALOG_CLASS}__actions`;
  apply.type = 'button';
  apply.className = `${DIALOG_CLASS}__apply`;
  apply.textContent = currentHref ? 'Update' : 'Add link';
  apply.addEventListener('mousedown', (event) => event.preventDefault());
  apply.addEventListener('click', () => onApply(input.value));
  actions.append(apply);

  if (currentHref) {
    const remove = document.createElement('button');

    remove.type = 'button';
    remove.className = `${DIALOG_CLASS}__remove`;
    remove.textContent = 'Remove';
    remove.addEventListener('mousedown', (event) => event.preventDefault());
    remove.addEventListener('click', () => onApply(''));
    actions.append(remove);
  }

  input.addEventListener('keydown', (event) => {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      onApply(input.value);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  });

  dialog.append(input, actions);

  return { dialog, input };
};

export const openLinkDialog = (editor: Editor) => {
  document.querySelector(`.${DIALOG_CLASS}`)?.remove();

  const currentHref = (editor.getAttributes('link').href as string | undefined) ?? '';
  const anchor = selectionRect(editor);

  const close = () => {
    dialog.remove();
    document.removeEventListener('mousedown', closeOnOutsideClick, true);
    editor.commands.focus();
  };

  const closeOnOutsideClick = (event: MouseEvent) => {
    if (!dialog.contains(event.target as globalThis.Node)) close();
  };

  const { dialog, input } = buildDialog(
    currentHref,
    (value) => {
      applyLink(editor, value);
      close();
    },
    () => close(),
  );

  document.body.append(dialog);
  positionNear(dialog, anchor);
  document.addEventListener('mousedown', closeOnOutsideClick, true);
  input.focus();
  input.select();

  return close;
};

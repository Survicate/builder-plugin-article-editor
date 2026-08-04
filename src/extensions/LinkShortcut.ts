import { Extension } from '@tiptap/core';
import { openLinkDialog } from '@/editor/linkDialog';

export const LinkShortcut = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        openLinkDialog(this.editor);

        return true;
      },
    };
  },

  name: 'linkShortcut',
});

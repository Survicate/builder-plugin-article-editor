import { mergeAttributes, Node } from '@tiptap/core';

export const Figcaption = Node.create({
  content: 'inline*',

  group: 'block',

  name: 'figcaption',

  parseHTML() {
    return [{ tag: 'figcaption' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },
});

export const Figure = Node.create({
  content: 'block+',

  defining: true,

  group: 'block',

  name: 'figure',

  parseHTML() {
    return [{ priority: 60, tag: 'figure' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },
});

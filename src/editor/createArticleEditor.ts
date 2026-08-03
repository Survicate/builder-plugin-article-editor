import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export interface CreateArticleEditorOptions {
  content: string;
  element: HTMLElement;
  onContentError: (error: Error) => void;
  onUpdate: (html: string) => void;
}

export const createArticleEditor = ({
  content,
  element,
  onContentError,
  onUpdate,
}: CreateArticleEditorOptions): Editor =>
  new Editor({
    content,
    element,
    emitContentError: true,
    extensions: [StarterKit],
    onContentError: ({ error }) => onContentError(error),
    onUpdate: ({ editor }) => onUpdate(editor.getHTML()),
  });

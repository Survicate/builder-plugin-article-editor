import { Editor } from '@tiptap/core';
import { TableKit } from '@tiptap/extension-table';
import StarterKit from '@tiptap/starter-kit';
import { normalizeIncomingHtml } from '@/editor/normalizeIncomingHtml';
import { serializeArticleHtml } from '@/editor/serializeArticleHtml';
import { ArticleEmbed } from '@/extensions/ArticleEmbed';
import { ArticleImage } from '@/extensions/ArticleImage';
import { Figcaption, Figure } from '@/extensions/Figure';
import { PasteCleanup } from '@/extensions/PasteCleanup';
import { SlashCommands } from '@/extensions/SlashCommands';
import { SpanClass } from '@/extensions/SpanClass';

export interface CreateArticleEditorOptions {
  content: string;
  element: HTMLElement;
  onContentError: (error: Error) => void;
  onUpdate: (html: string) => void;
}

export const ARTICLE_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: {
      HTMLAttributes: { class: null, rel: null, target: null },
      autolink: false,
      openOnClick: false,
    },
  }),
  TableKit.configure({ table: { resizable: true } }),
  ArticleEmbed,
  ArticleImage,
  Figure,
  Figcaption,
  SpanClass,
  SlashCommands,
  PasteCleanup,
];

export const createArticleEditor = ({
  content,
  element,
  onContentError,
  onUpdate,
}: CreateArticleEditorOptions): Editor =>
  new Editor({
    content: normalizeIncomingHtml(content),
    element,
    emitContentError: true,
    extensions: ARTICLE_EXTENSIONS,
    onContentError: ({ error }) => onContentError(error),
    onUpdate: ({ editor }) => onUpdate(serializeArticleHtml(editor.getHTML())),
  });

export const serializeEditor = (editor: Editor): string => serializeArticleHtml(editor.getHTML());

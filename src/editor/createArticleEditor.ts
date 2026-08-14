import { Editor, type Extensions } from '@tiptap/core';
import { TableKit } from '@tiptap/extension-table';
import StarterKit from '@tiptap/starter-kit';
import { normalizeIncomingHtml } from '@/editor/normalizeIncomingHtml';
import { serializeArticleHtml } from '@/editor/serializeArticleHtml';
import { ArticleEmbed } from '@/extensions/ArticleEmbed';
import { ArticleImage } from '@/extensions/ArticleImage';
import { ExpertRoundtable } from '@/extensions/ExpertRoundtable';
import { Figcaption, Figure } from '@/extensions/Figure';
import { ImageUpload } from '@/extensions/ImageUpload';
import { LinkShortcut } from '@/extensions/LinkShortcut';
import { PasteCleanup } from '@/extensions/PasteCleanup';
import { PasteImageUpload } from '@/extensions/PasteImageUpload';
import { SlashCommands } from '@/extensions/SlashCommands';
import { SpanClass } from '@/extensions/SpanClass';
import type { UploadImage } from '@/upload/uploadImage';

export interface CreateArticleEditorOptions {
  content: string;
  element: HTMLElement;
  onContentError: (error: Error) => void;
  onError?: (message: string) => void;
  onStatus?: (message: string | null) => void;
  onUpdate: (html: string) => void;
  uploadImage?: UploadImage | null;
}

interface ExtensionOptions {
  onError?: (message: string) => void;
  onStatus?: (message: string | null) => void;
  uploadImage?: UploadImage | null;
}

export const createArticleExtensions = ({
  onError,
  onStatus,
  uploadImage,
}: ExtensionOptions = {}): Extensions => [
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
  ExpertRoundtable.configure({
    onError: onError ?? (() => undefined),
    upload: uploadImage ?? null,
  }),
  Figure,
  Figcaption,
  SpanClass,
  SlashCommands,
  LinkShortcut,
  ImageUpload.configure({
    onError: onError ?? (() => undefined),
    onStatus: onStatus ?? (() => undefined),
    upload: uploadImage ?? null,
  }),
  PasteCleanup,
  PasteImageUpload.configure({
    onError: onError ?? (() => undefined),
    onStatus: onStatus ?? (() => undefined),
    upload: uploadImage ?? null,
  }),
];

export const ARTICLE_EXTENSIONS = createArticleExtensions();

export const createArticleEditor = ({
  content,
  element,
  onContentError,
  onError,
  onStatus,
  onUpdate,
  uploadImage,
}: CreateArticleEditorOptions): Editor =>
  new Editor({
    content: normalizeIncomingHtml(content),
    element,
    emitContentError: true,
    extensions: createArticleExtensions({ onError, onStatus, uploadImage }),
    onContentError: ({ error }) => onContentError(error),
    onUpdate: ({ editor }) => onUpdate(serializeArticleHtml(editor.getHTML())),
  });

export const serializeEditor = (editor: Editor): string => serializeArticleHtml(editor.getHTML());

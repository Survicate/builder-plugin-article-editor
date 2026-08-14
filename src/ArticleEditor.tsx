import type { Editor } from '@tiptap/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EDITOR_CONTAINER_CLASS, ERROR_DISMISS_MS, ON_CHANGE_DEBOUNCE_MS } from '@/constants';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { normalizeIncomingHtml } from '@/editor/normalizeIncomingHtml';
import { createToolbar } from '@/editor/toolbar';
import {
  type BuilderUploadContext,
  createImageUploader,
  type UploadImage,
} from '@/upload/uploadImage';
import '@/editor/editor-styles.css';

export interface ArticleEditorProps {
  context?: BuilderUploadContext;
  onChange: (value: string) => void;
  /** Overrides the Builder upload, so the local harness can exercise images offline. */
  uploadImage?: UploadImage | null;
  value?: string;
}

export const ArticleEditor = ({
  context,
  onChange,
  uploadImage: uploadImageOverride,
  value,
}: ArticleEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialContentRef = useRef(value ?? '');
  const lastEmittedRef = useRef(value ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useMemo(
    () => uploadImageOverride ?? createImageUploader(context),
    [context, uploadImageOverride],
  );
  const uploadImageRef = useRef(uploadImage);
  const stableUploadRef = useRef<UploadImage>((file) => {
    const upload = uploadImageRef.current;

    if (!upload) {
      return Promise.reject(
        new Error('Uploading images needs the Builder editor, which supplies the login'),
      );
    }

    return upload(file);
  });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    uploadImageRef.current = uploadImage;
  }, [uploadImage]);

  useEffect(() => {
    const host = hostRef.current;
    const toolbarHost = toolbarRef.current;

    if (!host || !toolbarHost) return;

    const editor = createArticleEditor({
      content: initialContentRef.current,
      element: host,
      onContentError: (contentError) =>
        console.warn('[article-editor] content does not match the schema', contentError),
      onError: (message) => {
        clearTimeout(errorTimeoutRef.current);
        setError(message);
        errorTimeoutRef.current = setTimeout(() => setError(null), ERROR_DISMISS_MS);
      },
      onStatus: setStatus,
      onUpdate: (html) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          lastEmittedRef.current = html;
          onChangeRef.current(html);
        }, ON_CHANGE_DEBOUNCE_MS);
      },
      uploadImage: uploadImageRef.current ? stableUploadRef.current : null,
    });

    editorRef.current = editor;
    toolbarHost.prepend(createToolbar(editor));

    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(errorTimeoutRef.current);
      editor.destroy();
      editorRef.current = null;
      toolbarHost.querySelector('.sv-toolbar')?.remove();
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || value === undefined) return;

    if (value === lastEmittedRef.current) return;

    if (editor.isFocused) return;

    if (value === serializeEditor(editor)) {
      lastEmittedRef.current = value;

      return;
    }

    editor.commands.setContent(normalizeIncomingHtml(value), { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!isFullscreen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isFullscreen]);

  const containerClass = isFullscreen
    ? `${EDITOR_CONTAINER_CLASS} ${EDITOR_CONTAINER_CLASS}--fullscreen`
    : EDITOR_CONTAINER_CLASS;

  return (
    <div className={containerClass}>
      <div className="sv-toolbar-host" ref={toolbarRef}>
        <button
          className="sv-toolbar__button sv-toolbar__button--fullscreen"
          onClick={() => setIsFullscreen((current) => !current)}
          title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          type="button"
        >
          {isFullscreen ? '⤡' : '⤢'}
        </button>
      </div>
      {error === null ? null : (
        <p className="sv-editor-notice sv-editor-notice--error" role="alert">
          {error}
        </p>
      )}
      {status === null ? null : (
        <p className="sv-editor-notice" role="status">
          {status}
        </p>
      )}
      <div className="sv-article-editor__scroll" ref={hostRef} />
    </div>
  );
};

import type { Editor } from '@tiptap/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EDITOR_CONTAINER_CLASS, ERROR_DISMISS_MS, ON_CHANGE_DEBOUNCE_MS } from '@/constants';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { normalizeIncomingHtml } from '@/editor/normalizeIncomingHtml';
import { createToolbar } from '@/editor/toolbar';
import {
  type BuilderSearchContext,
  createSiteLinkSearch,
  type SearchSiteLinks,
} from '@/search/searchSiteLinks';
import {
  type BuilderUploadContext,
  createImageUploader,
  type UploadImage,
} from '@/upload/uploadImage';
import '@/editor/editor-styles.css';

export interface ArticleEditorProps {
  context?: BuilderUploadContext & BuilderSearchContext;
  onChange: (value: string) => void;
  /** Overrides the Builder link search, so the local harness can exercise it offline. */
  searchLinks?: SearchSiteLinks | null;
  /** Overrides the Builder upload, so the local harness can exercise images offline. */
  uploadImage?: UploadImage | null;
  value?: string;
}

export const ArticleEditor = ({
  context,
  onChange,
  searchLinks: searchLinksOverride,
  uploadImage: uploadImageOverride,
  value,
}: ArticleEditorProps) => {
  const externalValue = value === undefined || value === null ? undefined : String(value);
  const hostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingHtmlRef = useRef<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialContentRef = useRef(externalValue ?? '');
  const lastEmittedRef = useRef(externalValue ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sourceDraft, setSourceDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useMemo(
    () => uploadImageOverride ?? createImageUploader(context),
    [context, uploadImageOverride],
  );
  const uploadImageRef = useRef(uploadImage);
  const searchLinks = useMemo(
    () => searchLinksOverride ?? createSiteLinkSearch(context),
    [context, searchLinksOverride],
  );
  const searchLinksRef = useRef(searchLinks);
  const stableSearchRef = useRef<SearchSiteLinks>((query) => {
    const search = searchLinksRef.current;

    return search ? search(query) : Promise.resolve([]);
  });
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
    searchLinksRef.current = searchLinks;
  }, [searchLinks]);

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
        pendingHtmlRef.current = html;
        debounceRef.current = setTimeout(() => {
          pendingHtmlRef.current = null;
          lastEmittedRef.current = html;
          onChangeRef.current(html);
        }, ON_CHANGE_DEBOUNCE_MS);
      },
      searchLinks: stableSearchRef.current,
      uploadImage: uploadImageRef.current ? stableUploadRef.current : null,
    });

    editorRef.current = editor;
    toolbarHost.prepend(createToolbar(editor));

    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(errorTimeoutRef.current);

      const pending = pendingHtmlRef.current;

      if (pending !== null) {
        pendingHtmlRef.current = null;
        lastEmittedRef.current = pending;
        onChangeRef.current(pending);
      }

      editor.destroy();
      editorRef.current = null;
      toolbarHost.querySelector('.sv-toolbar')?.remove();
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || externalValue === undefined || sourceDraft !== null) return;

    if (externalValue === lastEmittedRef.current) return;

    if (editor.isFocused) return;

    if (externalValue === serializeEditor(editor)) {
      lastEmittedRef.current = externalValue;

      return;
    }

    editor.commands.setContent(normalizeIncomingHtml(externalValue), { emitUpdate: false });
    lastEmittedRef.current = externalValue;
  }, [externalValue, sourceDraft]);

  const openSourceView = () => {
    const editor = editorRef.current;

    if (editor) setSourceDraft(serializeEditor(editor));
  };

  const applySourceView = () => {
    const editor = editorRef.current;

    if (!editor || sourceDraft === null) return;

    editor.commands.setContent(normalizeIncomingHtml(sourceDraft), { emitUpdate: true });
    setSourceDraft(null);

    const kept = serializeEditor(editor);

    if (kept !== sourceDraft.trim()) {
      setStatus('Some of the pasted markup was adjusted to the article format');
      setTimeout(() => setStatus(null), ERROR_DISMISS_MS);
    }
  };

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
        <button
          className="sv-toolbar__button sv-toolbar__button--source"
          onClick={() => (sourceDraft === null ? openSourceView() : setSourceDraft(null))}
          title={sourceDraft === null ? 'Edit the HTML source' : 'Back to the editor'}
          type="button"
        >
          {'</>'}
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
      <div className="sv-article-editor__scroll" hidden={sourceDraft !== null} ref={hostRef} />
      {sourceDraft !== null && (
        <div className="sv-source-view">
          <textarea
            aria-label="Article HTML source"
            className="sv-source-view__textarea"
            onChange={(event) => setSourceDraft(event.target.value)}
            spellCheck={false}
            value={sourceDraft}
          />
          <div className="sv-source-view__actions">
            <button className="sv-toolbar__button" onClick={applySourceView} type="button">
              Apply
            </button>
            <button
              className="sv-toolbar__button"
              onClick={() => setSourceDraft(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import type { Editor } from '@tiptap/core';
import React, { useEffect, useRef, useState } from 'react';
import { EDITOR_CONTAINER_CLASS, ON_CHANGE_DEBOUNCE_MS } from '@/constants';
import { createArticleEditor } from '@/editor/createArticleEditor';
import { createToolbar } from '@/editor/toolbar';
import '@/editor/editor-styles.css';

export interface ArticleEditorProps {
  onChange: (value: string) => void;
  value?: string;
}

export const ArticleEditor = ({ onChange, value }: ArticleEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialContentRef = useRef(value ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    const toolbarHost = toolbarRef.current;

    if (!host || !toolbarHost) return;

    const editor = createArticleEditor({
      content: initialContentRef.current,
      element: host,
      onContentError: (error) =>
        console.warn('[article-editor] content does not match the schema', error),
      onUpdate: (html) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChangeRef.current(html), ON_CHANGE_DEBOUNCE_MS);
      },
    });

    editorRef.current = editor;
    toolbarHost.prepend(createToolbar(editor));

    return () => {
      clearTimeout(debounceRef.current);
      editor.destroy();
      editorRef.current = null;
      toolbarHost.querySelector('.sv-toolbar')?.remove();
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || value === undefined || value === editor.getHTML()) return;

    editor.commands.setContent(value, { emitUpdate: false });
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
      <div className="sv-article-editor__scroll" ref={hostRef} />
    </div>
  );
};

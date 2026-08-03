import type { Editor } from '@tiptap/core';
import React, { useEffect, useRef } from 'react';
import { EDITOR_CONTAINER_CLASS, ON_CHANGE_DEBOUNCE_MS } from '@/constants';
import { createArticleEditor } from '@/editor/createArticleEditor';
import '@/editor/editor-styles.css';

export interface ArticleEditorProps {
  onChange: (value: string) => void;
  value?: string;
}

export const ArticleEditor = ({ onChange, value }: ArticleEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialContentRef = useRef(value ?? '');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) return;

    const editor = createArticleEditor({
      content: initialContentRef.current,
      element: host,
      onContentError: (error) =>
        console.warn('[article-editor] content does not match schema', error),
      onUpdate: (html) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChangeRef.current(html), ON_CHANGE_DEBOUNCE_MS);
      },
    });

    editorRef.current = editor;

    return () => {
      clearTimeout(debounceRef.current);
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || value === undefined || value === editor.getHTML()) return;

    editor.commands.setContent(value, { emitUpdate: false });
  }, [value]);

  return (
    <div className={EDITOR_CONTAINER_CLASS}>
      <div ref={hostRef} />
    </div>
  );
};

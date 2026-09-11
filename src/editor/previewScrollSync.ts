import type { Editor } from '@tiptap/core';

export const CURSOR_MESSAGE_SOURCE = 'survicate-article-editor';
export const CURSOR_MESSAGE_TYPE = 'cursor-section';

export interface CursorSectionMessage {
  heading: string | null;
  source: typeof CURSOR_MESSAGE_SOURCE;
  type: typeof CURSOR_MESSAGE_TYPE;
}

export const nearestHeadingText = (editor: Editor): string | null => {
  const { doc, selection } = editor.state;
  const cursorBlockIndex = selection.$from.index(0);
  let heading: string | null = null;

  doc.content.forEach((node, _offset, index) => {
    if (index > cursorBlockIndex) return;

    if (node.type.name === 'heading') heading = node.textContent.trim();
  });

  return heading;
};

export const broadcastCursorSection = (heading: string | null): void => {
  const message: CursorSectionMessage = {
    heading,
    source: CURSOR_MESSAGE_SOURCE,
    type: CURSOR_MESSAGE_TYPE,
  };

  document.querySelectorAll('iframe').forEach((frame) => {
    frame.contentWindow?.postMessage(message, '*');
  });
};

export const createCursorSectionNotifier = (editor: Editor, debounceMs: number): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastHeading: string | null | undefined;

  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const heading = nearestHeadingText(editor);

      if (heading === lastHeading) return;

      lastHeading = heading;
      broadcastCursorSection(heading);
    }, debounceMs);
  };

  editor.on('selectionUpdate', notify);

  return () => {
    clearTimeout(timer);
    editor.off('selectionUpdate', notify);
  };
};

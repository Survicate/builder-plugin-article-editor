import type { Editor } from '@tiptap/core';

export const CURSOR_MESSAGE_SOURCE = 'survicate-article-editor';
export const CURSOR_MESSAGE_TYPE = 'cursor-section';

const SIGNATURE_MAX_CHARS = 120;

export interface CursorItemLocator {
  occurrence: number;
  text: string;
}

export interface CursorBlockLocator extends CursorItemLocator {
  listItem?: CursorItemLocator;
}

export interface CursorSectionMessage {
  block: CursorBlockLocator | null;
  heading: string | null;
  source: typeof CURSOR_MESSAGE_SOURCE;
  type: typeof CURSOR_MESSAGE_TYPE;
}

type ResolvedFrom = Editor['state']['selection']['$from'];

const signatureOf = (text: string): string =>
  text.replace(/\s+/g, '').slice(0, SIGNATURE_MAX_CHARS);

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

const listItemLocator = ($from: ResolvedFrom): CursorItemLocator | null => {
  if ($from.depth < 2) return null;

  const item = $from.node(2);

  if (item.type.name !== 'listItem') return null;

  const text = signatureOf(item.textContent);

  if (!text) return null;

  const list = $from.node(1);
  const itemPos = $from.before(2) - $from.start(1);
  let occurrence = 0;
  let matched = false;

  list.descendants((node, pos) => {
    if (matched || pos > itemPos) return false;

    if (node.type.name !== 'listItem') return true;

    if (pos === itemPos) {
      matched = true;

      return false;
    }

    if (signatureOf(node.textContent) === text) occurrence += 1;

    return true;
  });

  return matched ? { occurrence, text } : null;
};

export const cursorBlockLocator = (editor: Editor): CursorBlockLocator | null => {
  const { doc, selection } = editor.state;

  if (!doc.childCount) return null;

  const cursorIndex = Math.min(selection.$from.index(0), doc.childCount - 1);
  let blockIndex = cursorIndex;
  let text = '';

  while (blockIndex >= 0) {
    text = signatureOf(doc.child(blockIndex).textContent);

    if (text) break;

    blockIndex -= 1;
  }

  if (!text) return null;

  let occurrence = 0;

  for (let index = 0; index < blockIndex; index += 1) {
    if (signatureOf(doc.child(index).textContent) === text) occurrence += 1;
  }

  const listItem = blockIndex === cursorIndex ? listItemLocator(selection.$from) : null;

  return listItem ? { listItem, occurrence, text } : { occurrence, text };
};

const collectDescendantFrames = (root: Window, frames: Set<Window>): void => {
  for (let index = 0; index < root.length; index += 1) {
    const frame = (root as unknown as Record<number, Window | undefined>)[index];

    if (!frame || frames.has(frame)) continue;

    frames.add(frame);
    collectDescendantFrames(frame, frames);
  }
};

export const collectReachableFrames = (): Set<Window> => {
  const frames = new Set<Window>();

  document.querySelectorAll('iframe').forEach((frame) => {
    if (frame.contentWindow) frames.add(frame.contentWindow);
  });

  try {
    collectDescendantFrames(window.top ?? window, frames);
  } catch {
    collectDescendantFrames(window, frames);
  }

  return frames;
};

export const broadcastCursorSection = (
  section: Pick<CursorSectionMessage, 'block' | 'heading'>,
): void => {
  const message: CursorSectionMessage = {
    ...section,
    source: CURSOR_MESSAGE_SOURCE,
    type: CURSOR_MESSAGE_TYPE,
  };

  collectReachableFrames().forEach((frame) => {
    try {
      frame.postMessage(message, '*');
    } catch {
      // Sandboxed frames that refuse cross-origin messages are skipped.
    }
  });
};

export const createCursorSectionNotifier = (editor: Editor, debounceMs: number): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastKey: string | undefined;

  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const section = {
        block: cursorBlockLocator(editor),
        heading: nearestHeadingText(editor),
      };
      const key = JSON.stringify(section);

      if (key === lastKey) return;

      lastKey = key;
      broadcastCursorSection(section);
    }, debounceMs);
  };

  editor.on('selectionUpdate', notify);

  return () => {
    clearTimeout(timer);
    editor.off('selectionUpdate', notify);
  };
};

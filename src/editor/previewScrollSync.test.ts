import type { Editor } from '@tiptap/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createArticleEditor } from '@/editor/createArticleEditor';
import {
  broadcastCursorSection,
  createCursorSectionNotifier,
  CURSOR_MESSAGE_SOURCE,
  CURSOR_MESSAGE_TYPE,
  cursorBlockLocator,
  nearestHeadingText,
} from '@/editor/previewScrollSync';

const mountEditor = (content: string) => {
  const element = document.createElement('div');

  document.body.append(element);

  return createArticleEditor({
    content,
    element,
    onContentError: vi.fn(),
    onUpdate: vi.fn(),
  });
};

const selectText = (editor: Editor, needle: string) => {
  let at: number | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (at !== null) return false;

    if (node.isText && node.text?.includes(needle)) at = pos + node.text.indexOf(needle) + 1;

    return true;
  });

  if (at === null) throw new Error(`text not found: ${needle}`);

  editor.commands.setTextSelection(at);
};

describe('nearestHeadingText', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns null before the first heading', () => {
    const editor = mountEditor('<p>Intro</p><h2>Section</h2><p>Body</p>');

    editor.commands.setTextSelection(2);

    expect(nearestHeadingText(editor)).toBeNull();
    editor.destroy();
  });

  it('returns the heading above the cursor', () => {
    const editor = mountEditor(
      '<p>Intro</p><h2>First</h2><p>Body one</p><h2>Second</h2><p>Two</p>',
    );

    editor.commands.focus('end');

    expect(nearestHeadingText(editor)).toBe('Second');
    editor.destroy();
  });

  it('returns the heading itself when the cursor is inside it', () => {
    const editor = mountEditor('<h2>Only section</h2><p>Body</p>');

    editor.commands.setTextSelection(3);

    expect(nearestHeadingText(editor)).toBe('Only section');
    editor.destroy();
  });
});

describe('cursorBlockLocator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('locates the paragraph under the cursor', () => {
    const editor = mountEditor('<p>Intro</p><h2>First</h2><p>Body one</p>');

    selectText(editor, 'Body one');

    expect(cursorBlockLocator(editor)).toEqual({ occurrence: 0, text: 'Bodyone' });
    editor.destroy();
  });

  it('counts repeated signatures before the cursor block', () => {
    const editor = mountEditor('<p>Same</p><p>Other</p><p>Same</p>');

    editor.commands.focus('end');

    expect(cursorBlockLocator(editor)).toEqual({ occurrence: 1, text: 'Same' });
    editor.destroy();
  });

  it('falls back to the previous text block for a text-free selection', () => {
    const editor = mountEditor('<p>Intro</p><hr><p>After</p>');

    editor.commands.setNodeSelection(7);

    expect(cursorBlockLocator(editor)).toEqual({ occurrence: 0, text: 'Intro' });
    editor.destroy();
  });

  it('locates the list item inside a list block', () => {
    const editor = mountEditor('<ul><li><p>Alpha</p></li><li><p>Beta</p></li></ul>');

    selectText(editor, 'Beta');

    expect(cursorBlockLocator(editor)).toEqual({
      listItem: { occurrence: 0, text: 'Beta' },
      occurrence: 0,
      text: 'AlphaBeta',
    });
    editor.destroy();
  });
});

describe('broadcastCursorSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('posts the section message to every iframe', () => {
    const frame = document.createElement('iframe');

    document.body.append(frame);

    const postMessage = vi.fn();

    Object.defineProperty(frame, 'contentWindow', { value: { postMessage } });
    broadcastCursorSection({ block: { occurrence: 0, text: 'First' }, heading: 'First' });

    expect(postMessage).toHaveBeenCalledWith(
      {
        block: { occurrence: 0, text: 'First' },
        heading: 'First',
        source: CURSOR_MESSAGE_SOURCE,
        type: CURSOR_MESSAGE_TYPE,
      },
      '*',
    );
  });
});

describe('createCursorSectionNotifier', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('broadcasts once per block change after the debounce', async () => {
    vi.useFakeTimers();

    const editor = mountEditor('<p>Intro</p><h2>First</h2><p>Body</p>');
    const frame = document.createElement('iframe');

    document.body.append(frame);

    const postMessage = vi.fn();

    Object.defineProperty(frame, 'contentWindow', { value: { postMessage } });

    const dispose = createCursorSectionNotifier(editor, 50);

    editor.commands.setTextSelection(editor.state.doc.content.size - 2);
    vi.advanceTimersByTime(60);

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0].heading).toBe('First');
    expect(postMessage.mock.calls[0][0].block).toEqual({ occurrence: 0, text: 'Body' });

    editor.commands.setTextSelection(editor.state.doc.content.size - 3);
    vi.advanceTimersByTime(60);

    expect(postMessage).toHaveBeenCalledTimes(1);

    dispose();
    editor.destroy();
    vi.useRealTimers();
  });
});

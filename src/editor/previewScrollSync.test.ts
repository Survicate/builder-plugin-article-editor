import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createArticleEditor } from '@/editor/createArticleEditor';
import {
  broadcastCursorSection,
  createCursorSectionNotifier,
  CURSOR_MESSAGE_SOURCE,
  CURSOR_MESSAGE_TYPE,
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

describe('broadcastCursorSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('posts the section message to every iframe', () => {
    const frame = document.createElement('iframe');

    document.body.append(frame);

    const postMessage = vi.fn();

    Object.defineProperty(frame, 'contentWindow', { value: { postMessage } });
    broadcastCursorSection('First');

    expect(postMessage).toHaveBeenCalledWith(
      { heading: 'First', source: CURSOR_MESSAGE_SOURCE, type: CURSOR_MESSAGE_TYPE },
      '*',
    );
  });
});

describe('createCursorSectionNotifier', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('broadcasts once per section change after the debounce', async () => {
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

    editor.commands.setTextSelection(editor.state.doc.content.size - 3);
    vi.advanceTimersByTime(60);

    expect(postMessage).toHaveBeenCalledTimes(1);

    dispose();
    editor.destroy();
    vi.useRealTimers();
  });
});

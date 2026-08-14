import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { applyLink, openLinkDialog } from '@/editor/linkDialog';

let editor: Editor | null = null;

const setup = (content: string) => {
  editor = createArticleEditor({
    content,
    element: document.createElement('div'),
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
  editor.commands.focus();

  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.querySelector('.sv-link-dialog')?.remove();
});

describe('applyLink', () => {
  it('links the selected words', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(active, '/pricing/');

    expect(serializeEditor(active)).toContain('<a href="/pricing/">Read</a>');
  });

  it('adds a scheme to a bare domain before linking', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(active, 'survicate.com/pricing');

    expect(serializeEditor(active)).toContain('href="https://survicate.com/pricing"');
  });

  it('does not add target or rel, which the site adds when it needs them', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(active, 'https://example.com');

    const html = serializeEditor(active);

    expect(html).not.toContain('target=');
    expect(html).not.toContain('rel=');
  });

  it('replaces the whole address when editing from inside a link', () => {
    const active = setup('<p><a href="/old/">Pricing</a></p>');

    active.commands.setTextSelection(3);
    applyLink(active, '/pricing/');

    const html = serializeEditor(active);

    expect(html).toContain('href="/pricing/"');
    expect(html).not.toContain('/old/');
  });

  it('removes the link but keeps the words when the address is cleared', () => {
    const active = setup('<p><a href="/old/">Pricing</a></p>');

    active.commands.setTextSelection(3);
    applyLink(active, '');

    expect(serializeEditor(active)).toBe('<p>Pricing</p>');
  });

  it('writes the address as the text when nothing is selected', () => {
    const active = setup('<p></p>');

    applyLink(active, 'https://survicate.com/blog/');

    expect(serializeEditor(active)).toContain(
      '<a href="https://survicate.com/blog/">https://survicate.com/blog/</a>',
    );
  });

  it('opens in a new tab only when asked to', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(active, 'https://example.com', { newTab: true });

    expect(serializeEditor(active)).toContain('target="_blank"');
  });

  it('marks the link nofollow only when asked to, without smuggling in noopener', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    applyLink(active, 'https://example.com', { nofollow: true });

    const html = serializeEditor(active);

    expect(html).toContain('rel="nofollow"');
    expect(html).not.toContain('noopener');
    expect(html).not.toContain('target=');
  });

  it('clears target and rel when the boxes are unticked on an existing link', () => {
    const active = setup('<p><a href="/old/" rel="nofollow" target="_blank">Pricing</a></p>');

    active.commands.setTextSelection(3);
    applyLink(active, '/old/', {});

    const html = serializeEditor(active);

    expect(html).not.toContain('target=');
    expect(html).not.toContain('rel=');
  });
});

describe('openLinkDialog', () => {
  it('opens empty for a fresh link', () => {
    const active = setup('<p>Read the pricing page</p>');

    active.commands.setTextSelection({ from: 1, to: 5 });
    openLinkDialog(active);

    const input = document.querySelector<HTMLInputElement>('.sv-link-dialog__input');

    expect(input?.value).toBe('');
    expect(document.querySelector('.sv-link-dialog__remove')).toBeNull();
  });

  it('shows the current address and a way to remove it when on a link', () => {
    const active = setup('<p><a href="/pricing/">Pricing</a></p>');

    active.commands.setTextSelection(3);
    openLinkDialog(active);

    const input = document.querySelector<HTMLInputElement>('.sv-link-dialog__input');

    expect(input?.value).toBe('/pricing/');
    expect(document.querySelector('.sv-link-dialog__remove')).not.toBeNull();
  });

  it('preselects the options the link already carries', () => {
    const active = setup(
      '<p><a href="https://example.com" rel="nofollow" target="_blank">Pricing</a></p>',
    );

    active.commands.setTextSelection(3);
    openLinkDialog(active);

    const boxes = document.querySelectorAll<HTMLInputElement>(
      '.sv-link-dialog__option input[type="checkbox"]',
    );

    expect(boxes).toHaveLength(2);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(true);
  });

  it('replaces an already open dialog instead of stacking them', () => {
    const active = setup('<p>Read the pricing page</p>');

    openLinkDialog(active);
    openLinkDialog(active);

    expect(document.querySelectorAll('.sv-link-dialog')).toHaveLength(1);
  });
});

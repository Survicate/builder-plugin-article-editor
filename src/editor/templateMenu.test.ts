import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { openInsertMenu } from '@/editor/templateMenu';

let editor: Editor | null = null;

const setup = () => {
  editor = createArticleEditor({
    content: '<p></p>',
    element: document.createElement('div'),
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });

  const anchor = document.createElement('button');

  document.body.append(anchor);

  return { active: editor, anchor };
};

const menu = () => document.querySelector('.sv-slash-menu');

afterEach(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  editor?.destroy();
  editor = null;
  document.querySelectorAll('button, .sv-slash-menu').forEach((element) => element.remove());
});

describe('openInsertMenu', () => {
  it('lists every template under its group heading', () => {
    const { active, anchor } = setup();

    openInsertMenu(active, anchor);

    const labels = Array.from(document.querySelectorAll('.sv-slash-menu__label')).map(
      (label) => label.textContent,
    );
    const groups = Array.from(document.querySelectorAll('.sv-slash-menu__group')).map(
      (group) => group.textContent,
    );

    expect(groups).toEqual(['Text', 'Blocks', 'Embeds']);
    expect(labels).toContain('Heading');
    expect(labels).toContain('Expert roundtable');
    expect(labels).toContain('Survicate survey');
  });

  it('inserts the clicked template and closes', () => {
    const { active, anchor } = setup();

    openInsertMenu(active, anchor);

    Array.from(document.querySelectorAll<HTMLButtonElement>('.sv-slash-menu__item'))
      .find((item) => item.textContent?.startsWith('Heading'))
      ?.click();

    expect(menu()).toBeNull();
    expect(serializeEditor(active)).toContain('<h2>');
  });

  it('toggles closed when the button is pressed again', () => {
    const { active, anchor } = setup();

    openInsertMenu(active, anchor);
    openInsertMenu(active, anchor);

    expect(menu()).toBeNull();
  });

  it('closes on Escape and hands focus back to the editor', () => {
    const { active, anchor } = setup();

    openInsertMenu(active, anchor);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(menu()).toBeNull();
  });

  it('walks the list with the arrow keys and inserts on Enter', () => {
    const { active, anchor } = setup();

    openInsertMenu(active, anchor);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(menu()).toBeNull();
    expect(serializeEditor(active)).toContain('<h2>');
  });
});

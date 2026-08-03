import { afterEach, describe, expect, it, vi } from 'vitest';
import { createArticleEditor } from '@/editor/createArticleEditor';

const mountEditor = () => {
  const element = document.createElement('div');

  document.body.append(element);

  const editor = createArticleEditor({
    content: '<p></p>',
    element,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });

  editor.commands.focus();

  return editor;
};

const menu = () => document.querySelector('.sv-slash-menu');

const labels = () =>
  Array.from(menu()?.querySelectorAll('.sv-slash-menu__label') ?? []).map(
    (item) => item.textContent,
  );

const type = async (editor: ReturnType<typeof mountEditor>, text: string) => {
  editor.commands.insertContent(text);
  await vi.waitFor(() => {
    if (!menu()?.querySelector('.sv-slash-menu__item, .sv-slash-menu__empty')) {
      throw new Error('menu not ready');
    }
  });
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('slash commands', () => {
  it('opens the template menu when a slash is typed', async () => {
    const editor = mountEditor();

    await type(editor, '/');

    expect(menu()?.querySelectorAll('.sv-slash-menu__item').length).toBeGreaterThan(0);
    editor.destroy();
  });

  it('narrows the menu down as the query is typed', async () => {
    const editor = mountEditor();

    await type(editor, '/survey');

    expect(labels()).toEqual(['Survicate survey']);
    editor.destroy();
  });

  it('finds a template by keyword rather than name', async () => {
    const editor = mountEditor();

    await type(editor, '/nps');

    expect(labels()).toEqual(['Survicate survey']);
    editor.destroy();
  });

  it('groups templates so writers can scan them', async () => {
    const editor = mountEditor();

    await type(editor, '/');

    const groups = Array.from(menu()?.querySelectorAll('.sv-slash-menu__group') ?? []).map(
      (item) => item.textContent,
    );

    expect(groups).toEqual(['Text', 'Blocks', 'Embeds']);
    editor.destroy();
  });

  it('says so when nothing matches instead of showing an empty box', async () => {
    const editor = mountEditor();

    await type(editor, '/zzzz');

    expect(menu()?.querySelector('.sv-slash-menu__empty')?.textContent).toBe('Nothing matches');
    editor.destroy();
  });

  it('closes the menu when the slash is removed', async () => {
    const editor = mountEditor();

    await type(editor, '/');
    editor.commands.clearContent();

    expect(menu()).toBeNull();
    editor.destroy();
  });
});

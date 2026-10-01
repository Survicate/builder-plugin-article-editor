import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AssetLibrary } from '@/assets/assetLibrary';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';

const asset = {
  bytes: 1000,
  height: 800,
  id: 'asset-1',
  name: 'cover.webp',
  url: 'https://cdn.builder.io/api/v1/image/assets%2Fcover',
  width: 1200,
};

const libraryWith = (): AssetLibrary => ({
  list: vi.fn().mockResolvedValue([asset]),
  remove: vi.fn().mockResolvedValue(undefined),
});

const buildEditor = (content: string, assetLibrary: AssetLibrary | null, onError = vi.fn()) =>
  createArticleEditor({
    assetLibrary,
    content,
    element: document.createElement('div'),
    onContentError: () => undefined,
    onError,
    onUpdate: () => undefined,
  });

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve);
  });

const pickFirstTile = async () => {
  await flush();
  document.querySelector<HTMLButtonElement>('.sv-media__pick')?.click();
};

afterEach(() => {
  document.querySelector('.sv-media')?.remove();
});

describe('MediaLibrary extension', () => {
  it('inserts the picked image with its stored size', async () => {
    const editor = buildEditor('<p>Hello</p>', libraryWith());

    editor.storage.mediaLibrary.browseAndInsert();
    await pickFirstTile();

    expect(serializeEditor(editor)).toContain(
      '<img height="800" src="https://cdn.builder.io/api/v1/image/assets%2Fcover" width="1200">',
    );
    editor.destroy();
  });

  it('swaps the picture under the Replace button but keeps its alt text', async () => {
    const editor = buildEditor(
      '<p>Intro</p><img src="https://old.example/old.png" alt="Old chart" width="10" height="10">',
      libraryWith(),
    );
    let imagePosition = -1;

    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'articleImage') imagePosition = position;
    });

    editor.storage.mediaLibrary.browseAndReplace(imagePosition);
    await pickFirstTile();

    const html = serializeEditor(editor);

    expect(html).toContain('src="https://cdn.builder.io/api/v1/image/assets%2Fcover"');
    expect(html).toContain('alt="Old chart"');
    expect(html).toContain('width="1200"');
    expect(html).not.toContain('old.png');
    editor.destroy();
  });

  it('explains that browsing needs the Builder session when there is none', () => {
    const onError = vi.fn();
    const editor = buildEditor('<p>Hello</p>', null, onError);

    editor.storage.mediaLibrary.browseAndInsert();

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Builder editor'));
    expect(document.querySelector('.sv-media')).toBeNull();
    editor.destroy();
  });
});

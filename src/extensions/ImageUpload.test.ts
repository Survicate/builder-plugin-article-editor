import type { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import type { UploadImage } from '@/upload/uploadImage';

let editor: Editor | null = null;

const setup = (uploadImage: UploadImage | null, onError = vi.fn()) => {
  editor = createArticleEditor({
    content: '<p>Article text</p>',
    element: document.createElement('div'),
    onContentError: () => undefined,
    onError,
    onStatus: () => undefined,
    onUpdate: () => undefined,
    uploadImage,
  });

  return { active: editor, onError };
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('ImageUpload', () => {
  it('reports that it cannot upload when Builder did not supply a login', () => {
    const { active } = setup(null);

    expect(active.storage.imageUpload.canUpload).toBe(false);
  });

  it('says why nothing happened instead of silently opening a file picker', () => {
    const { active, onError } = setup(null);

    active.storage.imageUpload.pickAndInsert();

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Builder editor'));
  });

  it('is ready to upload once a login is available', () => {
    const { active } = setup(() => Promise.resolve('https://cdn.builder.io/api/v1/image/assets'));

    expect(active.storage.imageUpload.canUpload).toBe(true);
  });

  it('writes an uploaded picture into the article without an empty alt attribute', () => {
    const { active } = setup(null);

    active
      .chain()
      .insertContentAt(1, {
        attrs: { alt: '', src: 'https://cdn.builder.io/api/v1/image/assets%2Fchart' },
        type: 'articleImage',
      })
      .run();

    expect(serializeEditor(active)).toContain(
      '<img src="https://cdn.builder.io/api/v1/image/assets%2Fchart">',
    );
  });

  it('keeps alt text once it has been written', () => {
    const { active } = setup(null);

    active
      .chain()
      .insertContentAt(1, {
        attrs: { alt: 'Bar chart of NPS by segment', src: 'https://cdn.builder.io/chart' },
        type: 'articleImage',
      })
      .run();

    expect(serializeEditor(active)).toContain('alt="Bar chart of NPS by segment"');
  });
});

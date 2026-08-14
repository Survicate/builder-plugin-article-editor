import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { measureImage } from '@/upload/measureImage';
import type { UploadImage } from '@/upload/uploadImage';

export interface PasteImageUploadOptions {
  onError: (message: string) => void;
  onStatus: (message: string | null) => void;
  upload: UploadImage | null;
}

const BUILDER_CDN_HOSTNAME = 'cdn.builder.io';
const FALLBACK_FILE_STEM = 'pasted-image';
const FILE_EXTENSION = /\.[a-z0-9]{2,5}$/i;

export const isForeignImageSrc = (src: string): boolean => {
  if (src.startsWith('data:image/')) return true;

  if (!/^https?:\/\//i.test(src)) return false;

  try {
    return new URL(src).hostname !== BUILDER_CDN_HOSTNAME;
  } catch {
    return false;
  }
};

export const fileNameForSrc = (src: string, contentType: string): string => {
  const extension = contentType.split('/')[1]?.split('+')[0] || 'png';

  if (src.startsWith('data:')) return `${FALLBACK_FILE_STEM}.${extension}`;

  try {
    const segment = new URL(src).pathname.split('/').filter(Boolean).pop();

    if (!segment) return `${FALLBACK_FILE_STEM}.${extension}`;

    return FILE_EXTENSION.test(segment) ? segment : `${segment}.${extension}`;
  } catch {
    return `${FALLBACK_FILE_STEM}.${extension}`;
  }
};

const fetchImageFile = async (src: string): Promise<File> => {
  const response = await fetch(src);

  if (!response.ok) throw new Error(`The image address answered ${response.status}`);

  const blob = await response.blob();

  if (!blob.type.startsWith('image/')) throw new Error('The address is not an image');

  return new File([blob], fileNameForSrc(src, blob.type), { type: blob.type });
};

export const PasteImageUpload = Extension.create<PasteImageUploadOptions>({
  addOptions() {
    return {
      onError: () => undefined,
      onStatus: () => undefined,
      upload: null,
    };
  },

  addProseMirrorPlugins() {
    const handled = new Set<string>();

    const collectForeignSrcs = (): string[] => {
      const sources = new Set<string>();

      this.editor.state.doc.descendants((node) => {
        const src = node.type.name === 'articleImage' ? (node.attrs.src as string | null) : null;

        if (src && isForeignImageSrc(src) && !handled.has(src)) sources.add(src);
      });

      return Array.from(sources);
    };

    const replaceSrc = (
      fromSrc: string,
      toSrc: string,
      size: { height: number; width: number } | null,
    ) => {
      this.editor
        .chain()
        .command(({ state, tr }) => {
          let changed = false;

          state.doc.descendants((node, position) => {
            if (node.type.name !== 'articleImage' || node.attrs.src !== fromSrc) return;

            tr.setNodeAttribute(position, 'src', toSrc);

            if (size && !node.attrs.width) {
              tr.setNodeAttribute(position, 'height', String(size.height));
              tr.setNodeAttribute(position, 'width', String(size.width));
            }

            changed = true;
          });

          return changed;
        })
        .run();
    };

    const uploadForeignImages = async () => {
      const { onError, onStatus, upload } = this.options;

      if (!upload) return;

      const sources = collectForeignSrcs();

      if (!sources.length) return;

      sources.forEach((src) => handled.add(src));
      onStatus(
        sources.length > 1
          ? `Copying ${sources.length} pasted images into Builder…`
          : 'Copying the pasted image into Builder…',
      );

      try {
        for (const src of sources) {
          try {
            const file = await fetchImageFile(src);
            const size = await measureImage(file);
            const uploaded = await upload(file);

            replaceSrc(src, uploaded, size);
          } catch (error) {
            handled.delete(src);
            onError(
              `One pasted image could not be copied into Builder and keeps its original address (${
                error instanceof Error ? error.message : 'the copy failed'
              })`,
            );
          }
        }
      } finally {
        onStatus(null);
      }
    };

    return [
      new Plugin({
        key: new PluginKey('pasteImageUpload'),
        props: {
          handlePaste: () => {
            setTimeout(() => void uploadForeignImages(), 0);

            return false;
          },
        },
      }),
    ];
  },

  name: 'pasteImageUpload',
});

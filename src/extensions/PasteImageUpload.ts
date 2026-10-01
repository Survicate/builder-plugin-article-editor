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
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30 * 1000;
const DATA_IMAGE_URL = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i;
const PRIVATE_HOST =
  /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0$|\[|[^.]+$|.+\.(local|internal)$)/i;

/**
 * Rewrites base64 images in pasted HTML to short-lived object URLs before the
 * content enters the document. The serialized field value then carries a tiny
 * blob: address instead of megabytes of base64 — a paste with inline images
 * can no longer blow past the Builder content-size limit while the uploads
 * are still in flight (or after one of them fails).
 */
export const inlineImagesToObjectUrls = (html: string): string => {
  if (!/data:image\//i.test(html)) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const image of doc.querySelectorAll('img')) {
    const match = (image.getAttribute('src') ?? '').match(DATA_IMAGE_URL);

    if (!match) continue;

    try {
      const bytes = atob(match[2]);
      const buffer = new Uint8Array(bytes.length);

      for (let index = 0; index < bytes.length; index += 1) {
        buffer[index] = bytes.charCodeAt(index);
      }

      image.setAttribute('src', URL.createObjectURL(new Blob([buffer], { type: match[1] })));
    } catch {
      image.removeAttribute('src');
    }
  }

  return doc.body.innerHTML;
};

export const isForeignImageSrc = (src: string): boolean => {
  if (src.startsWith('data:image/') || src.startsWith('blob:')) return true;

  if (!/^https?:\/\//i.test(src)) return false;

  try {
    const { hostname } = new URL(src);

    if (hostname === BUILDER_CDN_HOSTNAME) return false;

    return !PRIVATE_HOST.test(hostname);
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
  const response = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

  if (!response.ok) throw new Error(`The image address answered ${response.status}`);

  const blob = await response.blob();

  if (!blob.type.startsWith('image/')) throw new Error('The address is not an image');

  if (blob.size > MAX_IMAGE_BYTES) throw new Error('The image is larger than 20 MB');

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

      if (fromSrc.startsWith('blob:')) URL.revokeObjectURL(fromSrc);
    };

    const removeImagesWithSrc = (src: string) => {
      this.editor
        .chain()
        .command(({ state, tr }) => {
          const positions: { from: number; to: number }[] = [];

          state.doc.descendants((node, position) => {
            if (node.type.name !== 'articleImage' || node.attrs.src !== src) return;

            positions.push({ from: position, to: position + node.nodeSize });
          });

          for (const { from, to } of positions.reverse()) {
            tr.delete(tr.mapping.map(from), tr.mapping.map(to));
          }

          return positions.length > 0;
        })
        .run();

      URL.revokeObjectURL(src);
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
            const reason = error instanceof Error ? error.message : 'the copy failed';

            if (src.startsWith('blob:')) {
              removeImagesWithSrc(src);
              onError(`One pasted image could not be copied into Builder and was removed — paste it again (${reason})`);
            } else {
              handled.delete(src);
              onError(
                `One pasted image could not be copied into Builder and keeps its original address (${reason})`,
              );
            }
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

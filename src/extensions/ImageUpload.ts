import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { measureImage } from '@/upload/measureImage';
import type { UploadImage } from '@/upload/uploadImage';

export interface ImageUploadOptions {
  onError: (message: string) => void;
  onStatus: (message: string | null) => void;
  upload: UploadImage | null;
}

export interface ImageUploadStorage {
  canUpload: boolean;
  pickAndInsert: () => void;
}

declare module '@tiptap/core' {
  interface Storage {
    imageUpload: ImageUploadStorage;
  }
}

const imageFilesFrom = (transfer: DataTransfer | null | undefined): File[] =>
  Array.from(transfer?.files ?? []).filter((file) => file.type.startsWith('image/'));

const pickImages = (): Promise<File[]> =>
  new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.addEventListener('change', () => resolve(Array.from(input.files ?? [])));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : 'The upload failed';

export const ImageUpload = Extension.create<ImageUploadOptions, ImageUploadStorage>({
  addOptions() {
    return {
      onError: () => undefined,
      onStatus: () => undefined,
      upload: null,
    };
  },

  addProseMirrorPlugins() {
    const insert = async (files: File[], position?: number) => {
      const { onError, onStatus, upload } = this.options;

      if (!upload || !files.length) return;

      onStatus(files.length > 1 ? `Uploading ${files.length} images…` : 'Uploading image…');

      try {
        let at = position ?? this.editor.state.selection.from;

        for (const file of files) {
          const size = await measureImage(file);
          const src = await upload(file);
          const dimensions = size ? { height: String(size.height), width: String(size.width) } : {};

          this.editor
            .chain()
            .insertContentAt(at, { attrs: { alt: '', src, ...dimensions }, type: 'articleImage' })
            .run();
          at += 1;
        }
      } catch (error) {
        onError(describeError(error));
      } finally {
        onStatus(null);
      }
    };

    this.storage.canUpload = Boolean(this.options.upload);
    this.storage.pickAndInsert = () => {
      if (!this.options.upload) {
        this.options.onError('Uploading images needs the Builder editor, which supplies the login');

        return;
      }

      void pickImages().then((files) => insert(files));
    };

    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handleDrop: (view, event) => {
            const files = imageFilesFrom(event.dataTransfer);

            if (!files.length || !this.options.upload) return false;

            event.preventDefault();

            const dropped = view.posAtCoords({ left: event.clientX, top: event.clientY });

            void insert(files, dropped?.pos);

            return true;
          },
          handlePaste: (_view, event) => {
            const files = imageFilesFrom(event.clipboardData);

            if (!files.length || !this.options.upload) return false;

            event.preventDefault();
            void insert(files);

            return true;
          },
        },
      }),
    ];
  },

  addStorage() {
    return {
      canUpload: false,
      pickAndInsert: () => undefined,
    };
  },

  name: 'imageUpload',
});

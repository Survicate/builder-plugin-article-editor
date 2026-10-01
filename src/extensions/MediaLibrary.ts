import { Extension } from '@tiptap/core';
import type { AssetLibrary } from '@/assets/assetLibrary';
import { openMediaLibrary, type PickedImage } from '@/editor/mediaLibrary';
import type { UploadImage } from '@/upload/uploadImage';

export interface MediaLibraryOptions {
  library: AssetLibrary | null;
  onError: (message: string) => void;
  upload: UploadImage | null;
}

export interface MediaLibraryStorage {
  browseAndInsert: () => void;
  browseAndReplace: (position: number) => void;
  canBrowse: boolean;
}

declare module '@tiptap/core' {
  interface Storage {
    mediaLibrary: MediaLibraryStorage;
  }
}

export const MediaLibrary = Extension.create<MediaLibraryOptions, MediaLibraryStorage>({
  addOptions() {
    return {
      library: null,
      onError: () => undefined,
      upload: null,
    };
  },

  addProseMirrorPlugins() {
    const open = (title: string, onPick: (image: PickedImage) => void) => {
      const { library, onError, upload } = this.options;

      if (!library) {
        onError('Browsing the image library needs the Builder editor, which supplies the login');

        return;
      }

      Promise.resolve(library.prime?.())
        .then(() => openMediaLibrary({ library, onPick, title, upload }))
        .catch((error: unknown) =>
          onError(error instanceof Error ? error.message : 'The image library is unavailable'),
        );
    };

    this.storage.canBrowse = Boolean(this.options.library);
    this.storage.browseAndInsert = () => {
      open('Insert an image from the library', (image) => {
        this.editor
          .chain()
          .insertContentAt(this.editor.state.selection.from, {
            attrs: {
              alt: '',
              src: image.src,
              ...(image.width ? { width: image.width } : {}),
              ...(image.height ? { height: image.height } : {}),
            },
            type: 'articleImage',
          })
          .run();
      });
    };
    this.storage.browseAndReplace = (position: number) => {
      open('Replace this image', (image) => {
        this.editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'src', image.src);
            tr.setNodeAttribute(position, 'width', image.width);
            tr.setNodeAttribute(position, 'height', image.height);

            return true;
          })
          .run();
      });
    };

    return [];
  },

  addStorage() {
    return {
      browseAndInsert: () => undefined,
      browseAndReplace: () => undefined,
      canBrowse: false,
    };
  },

  name: 'mediaLibrary',
});

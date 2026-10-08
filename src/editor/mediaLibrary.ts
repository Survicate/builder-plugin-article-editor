import type { AssetLibrary, BuilderAsset } from '@/assets/assetLibrary';
import { measureImage } from '@/upload/measureImage';
import type { UploadImage } from '@/upload/uploadImage';

const DIALOG_CLASS = 'sv-media';
const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 250;
const THUMBNAIL_WIDTH = 240;
const KILOBYTE = 1024;

export interface PickedImage {
  height: string | null;
  src: string;
  width: string | null;
}

export interface MediaLibraryDialogOptions {
  library: AssetLibrary;
  onPick: (image: PickedImage) => void;
  title: string;
  upload?: UploadImage | null;
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'The library request failed';

const formatBytes = (bytes: number): string =>
  bytes >= KILOBYTE * KILOBYTE
    ? `${(bytes / KILOBYTE / KILOBYTE).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / KILOBYTE))} kB`;

/** The CDN only resizes /image/ addresses; /file/ and inline ones are served verbatim. */
const thumbnailUrl = (url: string): string =>
  /^https?:\/\//.test(url) && !url.includes('/api/v1/file/')
    ? `${url}?width=${THUMBNAIL_WIDTH}`
    : url;

const assetDetails = (asset: BuilderAsset): string => {
  const parts: string[] = [];

  if (asset.width && asset.height) parts.push(`${asset.width} × ${asset.height} px`);

  if (asset.bytes) parts.push(formatBytes(asset.bytes));

  return parts.join(' · ');
};

const pickOf = (asset: BuilderAsset): PickedImage => ({
  height: asset.height ? String(asset.height) : null,
  src: asset.url,
  width: asset.width ? String(asset.width) : null,
});

interface TileCallbacks {
  onDelete: (asset: BuilderAsset, tile: HTMLElement, removeButton: HTMLButtonElement) => void;
  onPick: (asset: BuilderAsset) => void;
}

const buildTile = (asset: BuilderAsset, callbacks: TileCallbacks): HTMLElement => {
  const tile = document.createElement('div');
  const pick = document.createElement('button');
  const image = document.createElement('img');
  const name = document.createElement('span');
  const details = document.createElement('span');
  const remove = document.createElement('button');

  tile.className = `${DIALOG_CLASS}__tile`;
  pick.type = 'button';
  pick.className = `${DIALOG_CLASS}__pick`;
  pick.title = `Use ${asset.name}`;
  image.className = `${DIALOG_CLASS}__thumbnail`;
  image.loading = 'lazy';
  image.src = thumbnailUrl(asset.url);
  image.alt = asset.name;
  name.className = `${DIALOG_CLASS}__name`;
  name.textContent = asset.name;
  details.className = `${DIALOG_CLASS}__details`;
  details.textContent = assetDetails(asset);
  pick.append(image, name, details);
  pick.addEventListener('click', () => callbacks.onPick(asset));

  remove.type = 'button';
  remove.className = `${DIALOG_CLASS}__delete`;
  remove.textContent = '✕';
  remove.title = 'Delete this file from the library';
  remove.addEventListener('click', () => {
    if (remove.disabled) return;

    if (!remove.classList.contains('is-confirming')) {
      remove.classList.add('is-confirming');
      remove.textContent = 'Sure?';

      return;
    }

    remove.disabled = true;
    callbacks.onDelete(asset, tile, remove);
  });
  tile.addEventListener('mouseleave', () => {
    remove.classList.remove('is-confirming');
    remove.textContent = '✕';
  });

  tile.append(pick, remove);

  return tile;
};

export const openMediaLibrary = (options: MediaLibraryDialogOptions) => {
  document.querySelector(`.${DIALOG_CLASS}`)?.remove();

  const overlay = document.createElement('div');
  const dialog = document.createElement('div');
  const header = document.createElement('div');
  const heading = document.createElement('span');
  const closeButton = document.createElement('button');
  const tools = document.createElement('div');
  const searchField = document.createElement('input');
  const notice = document.createElement('p');
  const grid = document.createElement('div');
  const footer = document.createElement('div');
  const moreButton = document.createElement('button');

  let offset = 0;
  let term = '';
  let requestId = 0;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const close = () => {
    clearTimeout(searchTimer);
    document.removeEventListener('keydown', closeOnEscape, true);
    overlay.remove();
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  const setNotice = (message: string | null, isError = false) => {
    notice.textContent = message ?? '';
    notice.hidden = message === null;
    notice.classList.toggle(`${DIALOG_CLASS}__notice--error`, isError);
  };

  const finishPick = (image: PickedImage) => {
    close();
    options.onPick(image);
  };

  const deleteAsset = (asset: BuilderAsset, tile: HTMLElement, removeButton: HTMLButtonElement) => {
    setNotice(null);
    options.library
      .remove(asset.id)
      .then(() => tile.remove())
      .catch((error: unknown) => {
        removeButton.disabled = false;
        setNotice(describeError(error), true);
      });
  };

  const load = (append: boolean) => {
    const id = ++requestId;

    setNotice('Loading…');
    options.library
      .list({ limit: PAGE_SIZE, offset, search: term })
      .then((assets) => {
        if (id !== requestId) return;

        if (!append) grid.replaceChildren();

        assets.forEach((asset) =>
          grid.append(
            buildTile(asset, {
              onDelete: deleteAsset,
              onPick: (picked) => finishPick(pickOf(picked)),
            }),
          ),
        );
        moreButton.hidden = assets.length < PAGE_SIZE;
        setNotice(grid.childElementCount ? null : 'No images match this search');
      })
      .catch((error: unknown) => {
        if (id === requestId) setNotice(describeError(error), true);
      });
  };

  overlay.className = DIALOG_CLASS;
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) close();
  });

  dialog.className = `${DIALOG_CLASS}__dialog`;
  header.className = `${DIALOG_CLASS}__header`;
  heading.className = `${DIALOG_CLASS}__title`;
  heading.textContent = options.title;
  closeButton.type = 'button';
  closeButton.className = `${DIALOG_CLASS}__close`;
  closeButton.textContent = '✕';
  closeButton.title = 'Close (Esc)';
  closeButton.addEventListener('click', close);
  header.append(heading, closeButton);

  tools.className = `${DIALOG_CLASS}__tools`;
  searchField.className = `${DIALOG_CLASS}__search`;
  searchField.type = 'text';
  searchField.placeholder = 'Search the library by file name';
  searchField.addEventListener('keydown', (event) => {
    event.stopPropagation();

    if (event.key === 'Escape') close();
  });
  searchField.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      term = searchField.value;
      offset = 0;
      load(false);
    }, SEARCH_DEBOUNCE_MS);
  });
  tools.append(searchField);

  const { upload } = options;

  if (upload) {
    const uploadButton = document.createElement('button');
    const fileField = document.createElement('input');

    uploadButton.type = 'button';
    uploadButton.className = `${DIALOG_CLASS}__upload`;
    uploadButton.textContent = 'Upload new';
    uploadButton.title = 'Upload an image from your computer and use it';
    fileField.type = 'file';
    fileField.accept = 'image/*';
    fileField.hidden = true;
    uploadButton.addEventListener('click', () => fileField.click());
    fileField.addEventListener('change', () => {
      const file = fileField.files?.[0];

      if (!file) return;

      setNotice('Uploading…');
      Promise.all([measureImage(file), upload(file)])
        .then(([size, src]) =>
          finishPick({
            height: size ? String(size.height) : null,
            src,
            width: size ? String(size.width) : null,
          }),
        )
        .catch((error: unknown) => setNotice(describeError(error), true));
    });
    tools.append(uploadButton, fileField);
  }

  notice.className = `${DIALOG_CLASS}__notice`;
  grid.className = `${DIALOG_CLASS}__grid`;
  footer.className = `${DIALOG_CLASS}__footer`;
  moreButton.type = 'button';
  moreButton.className = `${DIALOG_CLASS}__more`;
  moreButton.textContent = 'Load more';
  moreButton.hidden = true;
  moreButton.addEventListener('click', () => {
    offset += PAGE_SIZE;
    load(true);
  });
  footer.append(moreButton);

  dialog.append(header, tools, notice, grid, footer);
  overlay.append(dialog);
  document.body.append(overlay);
  document.addEventListener('keydown', closeOnEscape, true);
  searchField.focus();
  load(false);

  return close;
};

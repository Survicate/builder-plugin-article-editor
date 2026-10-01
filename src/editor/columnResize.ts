const STORAGE_KEY = 'sv-article-editor:column-width';
const HANDLE_CLASS = 'sv-column-handle';
const MIN_WIDTH = 360;
const PREVIEW_RESERVE = 420;

/**
 * The fields column has no width state of its own in Builder, so the drag
 * handle finds it structurally: the first ancestor whose sibling subtree
 * holds the preview iframe is the column the fields panel lives in.
 */
export const findEditorColumn = (host: HTMLElement): HTMLElement | null => {
  let node = host.parentElement;

  while (node && node !== document.body) {
    const parent = node.parentElement;

    if (!parent) return null;

    const column = node;
    const hasPreviewSibling = Array.from(parent.children).some(
      (sibling) =>
        sibling !== column && (sibling.tagName === 'IFRAME' || !!sibling.querySelector('iframe')),
    );

    if (hasPreviewSibling) return column;

    node = parent;
  }

  return null;
};

const clampWidth = (width: number): number =>
  Math.min(Math.max(width, MIN_WIDTH), Math.max(window.innerWidth - PREVIEW_RESERVE, MIN_WIDTH));

const applyWidth = (column: HTMLElement, width: number): number => {
  const clamped = clampWidth(width);
  const value = `${clamped}px`;

  column.style.width = value;
  column.style.minWidth = value;
  column.style.maxWidth = value;
  column.style.flex = '0 0 auto';

  return clamped;
};

const clearWidth = (column: HTMLElement) => {
  column.style.width = '';
  column.style.minWidth = '';
  column.style.maxWidth = '';
  column.style.flex = '';
};

const readStoredWidth = (): number | null => {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));

    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
};

const storeWidth = (width: number | null): boolean => {
  try {
    if (width === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
    }

    return true;
  } catch {
    return false;
  }
};

export const attachColumnResize = (container: HTMLElement): (() => void) => {
  const column = findEditorColumn(container);

  if (!column) return () => undefined;

  const handle = document.createElement('div');
  let startX = 0;
  let startWidth = 0;
  let lastWidth: number | null = null;
  let resizing = false;

  handle.className = HANDLE_CLASS;
  handle.title = 'Drag to resize the editor column (double-click resets)';

  const storedWidth = readStoredWidth();

  if (storedWidth !== null) applyWidth(column, storedWidth);

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    resizing = true;
    startX = event.clientX;
    startWidth = column.getBoundingClientRect().width;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!resizing) return;

    lastWidth = applyWidth(column, startWidth + (event.clientX - startX));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!resizing) return;

    resizing = false;
    handle.releasePointerCapture?.(event.pointerId);

    if (lastWidth !== null) storeWidth(lastWidth);
  };

  const onDoubleClick = () => {
    clearWidth(column);
    storeWidth(null);
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('lostpointercapture', onPointerUp);
  handle.addEventListener('dblclick', onDoubleClick);
  container.append(handle);

  return () => {
    handle.remove();
  };
};

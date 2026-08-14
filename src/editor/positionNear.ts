import type { Editor } from '@tiptap/core';

const EDGE_GAP = 8;

/**
 * Places a floating panel next to a point in the text, flipping it above when
 * there is no room below and keeping it inside the window horizontally.
 */
export const positionNear = (element: HTMLElement, rect: DOMRect | null) => {
  if (!rect) return;

  const spaceBelow = window.innerHeight - rect.bottom;
  const height = element.offsetHeight;
  const top = spaceBelow < height ? rect.top - height - EDGE_GAP : rect.bottom + EDGE_GAP;
  const rightEdge = window.innerWidth - element.offsetWidth - EDGE_GAP;
  const left = Math.min(Math.max(EDGE_GAP, rect.left), Math.max(EDGE_GAP, rightEdge));

  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(Math.max(EDGE_GAP, top))}px`;
};

export const selectionRect = (editor: Editor): DOMRect | null => {
  const { from } = editor.state.selection;

  try {
    const coords = editor.view.coordsAtPos(from);

    return new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
  } catch {
    return null;
  }
};

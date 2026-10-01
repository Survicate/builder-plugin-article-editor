import { afterEach, describe, expect, it } from 'vitest';
import { attachColumnResize, findEditorColumn } from '@/editor/columnResize';

const buildLayout = () => {
  const row = document.createElement('div');
  const column = document.createElement('div');
  const field = document.createElement('div');
  const container = document.createElement('div');
  const preview = document.createElement('div');
  const iframe = document.createElement('iframe');

  field.append(container);
  column.append(field);
  preview.append(iframe);
  row.append(column, preview);
  document.body.append(row);

  return { column, container, row };
};

const pointer = (type: string, clientX: number) => new MouseEvent(type, { bubbles: true, clientX });

afterEach(() => {
  document.body.replaceChildren();
  window.localStorage.clear();
});

describe('findEditorColumn', () => {
  it('finds the ancestor whose sibling holds the preview iframe', () => {
    const { column, container } = buildLayout();

    expect(findEditorColumn(container)).toBe(column);
  });

  it('gives up without a preview around', () => {
    const lonely = document.createElement('div');
    const child = document.createElement('div');

    lonely.append(child);
    document.body.append(lonely);

    expect(findEditorColumn(child)).toBeNull();
  });
});

describe('attachColumnResize', () => {
  it('does not add a handle when there is no column to resize', () => {
    const lonely = document.createElement('div');

    document.body.append(lonely);
    attachColumnResize(lonely);

    expect(document.querySelector('.sv-column-handle')).toBeNull();
  });

  it('resizes the column within bounds while dragging and remembers the width', () => {
    const { column, container } = buildLayout();

    attachColumnResize(container);

    const handle = container.querySelector('.sv-column-handle');

    expect(handle).not.toBeNull();
    handle?.dispatchEvent(pointer('pointerdown', 100));
    handle?.dispatchEvent(pointer('pointermove', 600));
    handle?.dispatchEvent(pointer('pointerup', 600));

    expect(column.style.width).toBe('500px');
    expect(column.style.flex).toBe('0 0 auto');
    expect(window.localStorage.getItem('sv-article-editor:column-width')).toBe('500');
  });

  it('never squeezes the column below the readable minimum', () => {
    const { column, container } = buildLayout();

    attachColumnResize(container);

    const handle = container.querySelector('.sv-column-handle');

    handle?.dispatchEvent(pointer('pointerdown', 500));
    handle?.dispatchEvent(pointer('pointermove', 100));
    handle?.dispatchEvent(pointer('pointerup', 100));

    expect(column.style.width).toBe('360px');
  });

  it('applies the remembered width on the next mount', () => {
    window.localStorage.setItem('sv-article-editor:column-width', '540');

    const { column, container } = buildLayout();

    attachColumnResize(container);

    expect(column.style.width).toBe('540px');
  });

  it('resets the column and forgets the width on double-click', () => {
    window.localStorage.setItem('sv-article-editor:column-width', '540');

    const { column, container } = buildLayout();

    attachColumnResize(container);
    container
      .querySelector('.sv-column-handle')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(column.style.width).toBe('');
    expect(window.localStorage.getItem('sv-article-editor:column-width')).toBeNull();
  });

  it('removes the handle when disposed', () => {
    const { container } = buildLayout();
    const dispose = attachColumnResize(container);

    dispose();

    expect(container.querySelector('.sv-column-handle')).toBeNull();
  });
});

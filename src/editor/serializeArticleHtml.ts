const isHeaderRow = (row: HTMLTableRowElement) =>
  row.children.length > 0 && Array.from(row.children).every((cell) => cell.tagName === 'TH');

const unwrapSoleParagraph = (cell: Element) => {
  const [child] = Array.from(cell.children);

  if (cell.children.length !== 1 || child.tagName !== 'P') return;

  cell.innerHTML = child.innerHTML;
};

const stripDefaultSpans = (cell: Element) => {
  if (cell.getAttribute('colspan') === '1') cell.removeAttribute('colspan');

  if (cell.getAttribute('rowspan') === '1') cell.removeAttribute('rowspan');
};

const normalizeTable = (table: HTMLTableElement) => {
  table.removeAttribute('style');
  table.querySelectorAll('colgroup').forEach((group) => group.remove());
  table.querySelectorAll('td, th').forEach((cell) => {
    stripDefaultSpans(cell);
    unwrapSoleParagraph(cell);
    cell.removeAttribute('style');
  });

  const body = table.querySelector('tbody');
  const firstRow = body?.rows[0];

  if (!body || !firstRow || !isHeaderRow(firstRow) || table.querySelector('thead')) return;

  const head = table.ownerDocument.createElement('thead');

  head.append(firstRow);
  table.insertBefore(head, body);
};

export const serializeArticleHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('table').forEach(normalizeTable);
  doc.querySelectorAll('li').forEach(unwrapSoleParagraph);

  return doc.body.innerHTML;
};

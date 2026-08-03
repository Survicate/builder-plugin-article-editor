const liftTableCaption = (table: HTMLTableElement) => {
  const caption = table.querySelector('caption');

  if (!caption) return;

  const doc = table.ownerDocument;
  const paragraph = doc.createElement('p');
  const strong = doc.createElement('strong');

  strong.innerHTML = caption.innerHTML;
  paragraph.append(strong);
  table.parentNode?.insertBefore(paragraph, table);
  caption.remove();
};

export const normalizeIncomingHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('table').forEach(liftTableCaption);

  return doc.body.innerHTML;
};

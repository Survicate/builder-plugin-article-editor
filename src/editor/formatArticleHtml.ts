const BLOCK_TAGS = new Set([
  'blockquote',
  'div',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const INDENT = '  ';

const hasOnlyBlockChildren = (element: Element): boolean => {
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return false;

    if (child.nodeType === Node.ELEMENT_NODE && !BLOCK_TAGS.has((child as Element).localName)) {
      return false;
    }
  }

  return element.childElementCount > 0;
};

const printNode = (node: Node, depth: number): string => {
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const outer = element.outerHTML;

  if (!hasOnlyBlockChildren(element)) return `${INDENT.repeat(depth)}${outer}`;

  const openTag = outer.slice(0, outer.indexOf('>') + 1);
  const children = [...element.childNodes]
    .map((child) => printNode(child, depth + 1))
    .filter(Boolean)
    .join('\n');

  return `${INDENT.repeat(depth)}${openTag}\n${children}\n${INDENT.repeat(depth)}</${element.localName}>`;
};

export const collapseFormattedHtml = (formatted: string): string =>
  formatted.replace(/>\n\s*</g, '><').trim();

export const formatArticleHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return [...doc.body.childNodes]
    .map((node) => printNode(node, 0))
    .filter(Boolean)
    .join('\n');
};

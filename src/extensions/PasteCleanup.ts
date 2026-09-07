import { Extension } from '@tiptap/core';
import { surveySignupUrl } from '@/editor/embedUrl';

const WORD_CLASS = /\sclass="?Mso[^"\s>]*"?/gi;
const WORD_CONDITIONAL = /<!--\[if[\s\S]*?<!\[endif\]-->/gi;
const WORD_NAMESPACED = /<\/?(?:o|w|m|v):[^>]*>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const STYLE_BLOCK = /<style[\s\S]*?<\/style>/gi;
const META_LINK = /<(?:meta|link)\b[^>]*>/gi;
const INLINE_STYLE = /\sstyle="[^"]*"/gi;
const DOCS_ID = /\sid="docs-internal-guid[^"]*"/gi;
const EMPTY_SPAN = /<span[^>]*>(\s*)<\/span>/gi;
const SPAN_TAG = /<\/?span[^>]*>/gi;
const CLASS_ATTRIBUTE = /\sclass="[^"]*"/gi;
const BOLD_WRAPPER = /<b\b([^>]*)>/gi;

const unwrapNonBoldWrappers = (doc: Document) => {
  const wrappers = doc.body.querySelectorAll('b[style*="font-weight"], b[id^="docs-internal"]');

  for (const wrapper of wrappers) {
    const weight = (wrapper as HTMLElement).style.fontWeight;
    const isDocsWrapper = wrapper.id.startsWith('docs-internal');

    if (isDocsWrapper || weight === 'normal' || weight === '400') {
      wrapper.replaceWith(...wrapper.childNodes);
    }
  }
};

const promoteTableHeaders = (doc: Document) => {
  for (const table of doc.body.querySelectorAll('table')) {
    if (table.querySelector('th')) continue;

    const firstRow = table.querySelector('tr');

    if (!firstRow) continue;

    for (const cell of firstRow.querySelectorAll('td')) {
      const header = doc.createElement('th');

      header.innerHTML = cell.innerHTML;
      cell.replaceWith(header);
    }

    const head = doc.createElement('thead');

    head.append(firstRow);
    table.prepend(head);
  }
};

const embedHolder = (iframe: HTMLIFrameElement): Element => {
  let holder: Element = iframe;

  while (holder.parentElement && holder.parentElement !== iframe.ownerDocument.body) {
    if (holder.parentElement.childElementCount !== 1) break;

    holder = holder.parentElement;
  }

  return holder;
};

const absorbSurveyCta = (holder: Element, embed: HTMLElement) => {
  const next = holder.nextElementSibling;
  const cta = next?.matches('a.article-content-primary')
    ? next
    : (next?.querySelector('a.article-content-primary') ?? null);
  const href = cta?.getAttribute('href');

  if (!cta || !href?.startsWith('https://')) return;

  embed.setAttribute('data-embed-cta-href', href);

  const label = cta.textContent?.trim();

  if (label) embed.setAttribute('data-embed-cta-label', label);

  next?.remove();
};

const convertSurveyIframes = (doc: Document) => {
  for (const iframe of doc.body.querySelectorAll('iframe')) {
    const source = iframe.getAttribute('src') ?? '';

    if (!source.startsWith('https://respondent.survicate.com/')) continue;

    const embed = doc.createElement('div');

    embed.setAttribute('data-article-embed', 'survey');
    embed.setAttribute('data-src', source);

    const suggestedCta = surveySignupUrl(source);

    if (suggestedCta) embed.setAttribute('data-embed-cta-href', suggestedCta);

    const holder = embedHolder(iframe);

    absorbSurveyCta(holder, embed);
    holder.replaceWith(embed);
  }
};

const cleanPastedDom = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  unwrapNonBoldWrappers(doc);
  convertSurveyIframes(doc);
  promoteTableHeaders(doc);

  return doc.body.innerHTML;
};

export const cleanPastedHtml = (html: string): string =>
  cleanPastedDom(html)
    .replace(WORD_CONDITIONAL, '')
    .replace(HTML_COMMENT, '')
    .replace(STYLE_BLOCK, '')
    .replace(META_LINK, '')
    .replace(WORD_NAMESPACED, '')
    .replace(WORD_CLASS, '')
    .replace(DOCS_ID, '')
    .replace(INLINE_STYLE, '')
    .replace(EMPTY_SPAN, '$1')
    .replace(SPAN_TAG, '')
    .replace(CLASS_ATTRIBUTE, '')
    .replace(BOLD_WRAPPER, '<strong$1>')
    .replace(/<\/b>/gi, '</strong>')
    .trim();

export const PasteCleanup = Extension.create({
  name: 'pasteCleanup',

  transformPastedHTML(html) {
    return cleanPastedHtml(html);
  },
});

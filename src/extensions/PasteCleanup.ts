import { Extension } from '@tiptap/core';

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

export const cleanPastedHtml = (html: string): string =>
  html
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

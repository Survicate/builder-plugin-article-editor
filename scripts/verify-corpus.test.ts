import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';

const CORPUS_PATH = process.env.CORPUS_PATH ?? '';

interface CorpusPost {
  data: { content?: string; slug?: string };
}

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

const roundTrip = (html: string) => {
  const element = document.createElement('div');
  const editor = createArticleEditor({
    content: html,
    element,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
  const result = serializeEditor(editor);

  editor.destroy();

  return result;
};

const attributeSet = (html: string, selector: string, attribute: string) =>
  new Set(
    Array.from(parse(html).querySelectorAll(selector))
      .map((element) => element.getAttribute(attribute) ?? '')
      .filter((value) => value.length > 0),
  );

const countOf = (html: string, selector: string) => parse(html).querySelectorAll(selector).length;

const readableText = (html: string) => {
  const doc = parse(html);

  doc.querySelectorAll('style, script').forEach((element) => element.remove());

  return (doc.body.textContent ?? '').replace(/\s+/g, '');
};

const missingFrom = (before: Set<string>, after: Set<string>) =>
  [...before].filter((value) => !after.has(value));

const STABLE_COUNTS = [
  { label: 'tables', selector: 'table' },
  { label: 'header cells', selector: 'th' },
  { label: 'figures', selector: 'figure' },
  { label: 'captions', selector: 'figcaption' },
  { label: 'images', selector: 'img' },
  { label: 'quotes', selector: 'blockquote' },
  { label: 'headings', selector: 'h1, h2, h3, h4, h5, h6' },
  { label: 'embeds', selector: '[data-article-embed]' },
];

const loadCorpus = (): CorpusPost[] => {
  if (!CORPUS_PATH) return [];

  const parsed: CorpusPost[] = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));

  return parsed.filter((post) => (post.data.content ?? '').length > 0);
};

describe('every migrated post survives a round-trip', () => {
  const posts = loadCorpus();

  it('runs against a corpus', () => {
    expect(
      posts.length,
      'set CORPUS_PATH to the transformed posts.json to run this gate',
    ).toBeGreaterThan(0);
  });

  it('keeps every link, embed, image and word of the article', () => {
    const failures: string[] = [];

    posts.forEach((post) => {
      const source = post.data.content ?? '';
      const result = roundTrip(source);
      const slug = post.data.slug ?? 'unknown';

      const lostLinks = missingFrom(
        attributeSet(source, 'a[href]', 'href'),
        attributeSet(result, 'a[href]', 'href'),
      );
      const lostEmbeds = missingFrom(
        attributeSet(source, '[data-article-embed]', 'data-src'),
        attributeSet(result, '[data-article-embed]', 'data-src'),
      );
      const lostImages = missingFrom(
        attributeSet(source, 'img', 'src'),
        attributeSet(result, 'img', 'src'),
      );

      if (lostLinks.length) failures.push(`${slug}: lost links ${lostLinks.join(', ')}`);

      if (lostEmbeds.length) failures.push(`${slug}: lost embeds ${lostEmbeds.join(', ')}`);

      if (lostImages.length) failures.push(`${slug}: lost images ${lostImages.join(', ')}`);

      if (readableText(source) !== readableText(result)) {
        failures.push(`${slug}: article text changed`);
      }

      STABLE_COUNTS.forEach((check) => {
        const before = countOf(source, check.selector);
        const after = countOf(result, check.selector);

        if (before !== after) failures.push(`${slug}: ${check.label} ${before} -> ${after}`);
      });
    });

    console.warn(`Checked ${posts.length} posts`);

    expect(failures.slice(0, 30).join('\n')).toBe('');
  }, 600_000);
});

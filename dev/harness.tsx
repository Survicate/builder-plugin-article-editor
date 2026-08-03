import React, { useMemo, useState } from 'react';
import { render } from 'react-dom';
import { ArticleEditor } from '@/ArticleEditor';
import { createArticleEditor, serializeEditor } from '@/editor/createArticleEditor';
import { SAMPLE_ARTICLE } from './fixtures/sample-article';
import './harness.css';

const serializeThroughSchema = (html: string) => {
  const element = document.createElement('div');
  const editor = createArticleEditor({
    content: html,
    element,
    onContentError: () => undefined,
    onUpdate: () => undefined,
  });
  const serialized = serializeEditor(editor);

  editor.destroy();

  return serialized;
};

const countTags = (html: string, selector: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  return doc.querySelectorAll(selector).length;
};

const CHECKS = [
  { label: 'embeds', selector: '[data-article-embed]' },
  { label: 'embeds with data-src', selector: '[data-article-embed][data-src]' },
  { label: 'tables', selector: 'table' },
  { label: 'header cells', selector: 'th' },
  { label: 'figures', selector: 'figure' },
  { label: 'captions', selector: 'figcaption' },
  { label: 'images', selector: 'img' },
  { label: 'images with size', selector: 'img[width][height]' },
  { label: 'links', selector: 'a[href]' },
  { label: 'headings', selector: 'h2, h3' },
  { label: 'list items', selector: 'li' },
  { label: 'quotes', selector: 'blockquote' },
];

const Harness = () => {
  const [edited, setEdited] = useState<string | null>(null);
  const serialized = useMemo(() => serializeThroughSchema(SAMPLE_ARTICLE), []);
  const value = edited ?? serialized;

  return (
    <div className="harness">
      <header className="harness-header">
        <h1>Article editor harness</h1>
        <p>
          Left is the plugin field as Builder renders it. Right compares the fixture with what the
          editor serializes back, so schema losses show up immediately.
        </p>
      </header>
      <div className="harness-grid">
        <section>
          <h2>Editor</h2>
          <ArticleEditor onChange={setEdited} value={SAMPLE_ARTICLE} />
        </section>
        <section>
          <h2>Round-trip</h2>
          <table className="harness-table">
            <thead>
              <tr>
                <th>Element</th>
                <th>Fixture</th>
                <th>Serialized</th>
              </tr>
            </thead>
            <tbody>
              {CHECKS.map((check) => {
                const before = countTags(SAMPLE_ARTICLE, check.selector);
                const after = countTags(value, check.selector);

                return (
                  <tr className={before === after ? 'is-kept' : 'is-lost'} key={check.label}>
                    <td>{check.label}</td>
                    <td>{before}</td>
                    <td>{after}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h2>Serialized html</h2>
          <pre className="harness-output">{value}</pre>
        </section>
      </div>
    </div>
  );
};

render(<Harness />, document.querySelector('#root'));

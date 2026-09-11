import { mergeAttributes, Node } from '@tiptap/core';
import { checkEmbedUrl, surveySignupUrl } from '@/editor/embedUrl';
import { stopsInteractiveEvents } from '@/extensions/blockFields';

export const EMBED_LABELS: Record<string, string> = {
  arcade: 'Arcade demo',
  embedly: 'Embedded content',
  linkedin: 'LinkedIn post',
  survey: 'Survicate survey',
  video: 'Video',
  youtube: 'YouTube video',
};

const attributeFromData = (dataName: string) => ({
  parseHTML: (element: HTMLElement) => element.getAttribute(dataName),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[dataName];

    return value === null || value === undefined || value === '' ? {} : { [dataName]: value };
  },
});

export const ArticleEmbed = Node.create({
  addAttributes() {
    return {
      'data-article-embed': attributeFromData('data-article-embed'),
      'data-embed-aspect': attributeFromData('data-embed-aspect'),
      'data-embed-caption': attributeFromData('data-embed-caption'),
      'data-embed-cta-href': attributeFromData('data-embed-cta-href'),
      'data-embed-cta-label': attributeFromData('data-embed-cta-label'),
      'data-embed-height': attributeFromData('data-embed-height'),
      'data-embed-page-url': attributeFromData('data-embed-page-url'),
      'data-embed-poster': attributeFromData('data-embed-poster'),
      'data-embed-title': attributeFromData('data-embed-title'),
      'data-embed-variant': attributeFromData('data-embed-variant'),
      'data-embed-width': attributeFromData('data-embed-width'),
      'data-src': attributeFromData('data-src'),
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const kind = (node.attrs['data-article-embed'] as string | null) ?? '';
      const source = (node.attrs['data-src'] as string | null) ?? '';
      const dom = document.createElement('div');
      const label = document.createElement('span');
      const input = document.createElement('input');
      const error = document.createElement('span');

      dom.className = 'sv-embed-card';
      dom.dataset.embedKind = kind;
      dom.contentEditable = 'false';
      label.className = 'sv-embed-card__label';
      label.textContent = EMBED_LABELS[kind] ?? 'Embedded content';
      error.className = 'sv-embed-card__error';

      input.className = 'sv-embed-card__input';
      input.placeholder = 'Paste the embed address, starting with https://';
      input.type = 'url';
      input.addEventListener('mousedown', (event) => event.stopPropagation());
      input.addEventListener('keydown', (event) => event.stopPropagation());
      input.addEventListener('change', () => {
        const position = typeof getPos === 'function' ? getPos() : null;
        const value = input.value.trim();

        if (position === null || position === undefined || !value) return;

        const verdict = checkEmbedUrl(kind, value);

        if (!verdict.ok) {
          error.textContent = verdict.message ?? '';
          input.after(error);

          return;
        }

        error.remove();

        if (verdict.normalized) input.value = verdict.normalized;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'data-src', verdict.normalized ?? value);

            if (kind === 'survey' && !node.attrs['data-embed-cta-href']) {
              const suggested = surveySignupUrl(value);

              if (suggested) tr.setNodeAttribute(position, 'data-embed-cta-href', suggested);
            }

            return true;
          })
          .run();
      });

      const setEmbedAttribute = (name: string, attributeValue: string | null) => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, name, attributeValue);

            return true;
          })
          .run();
      };

      const ctaInput = (type: string, placeholder: string, attribute: string) => {
        const field = document.createElement('input');

        field.className = 'sv-embed-card__input';
        field.type = type;
        field.placeholder = placeholder;
        field.value = (node.attrs[attribute] as string | null) ?? '';
        field.addEventListener('mousedown', (event) => event.stopPropagation());
        field.addEventListener('keydown', (event) => event.stopPropagation());
        field.addEventListener('change', () => {
          const value = field.value.trim();

          field.value = value;
          setEmbedAttribute(attribute, value || null);
        });

        return field;
      };

      const surveyCtaRow = () => {
        const row = document.createElement('div');
        const hint = document.createElement('span');

        row.className = 'sv-embed-card__cta';
        hint.className = 'sv-embed-card__cta-hint';
        hint.textContent = 'CTA under the survey:';
        row.append(
          hint,
          ctaInput('url', 'https://panel.survicate.com/signup?survey=...', 'data-embed-cta-href'),
          ctaInput('text', 'Use this template', 'data-embed-cta-label'),
        );

        return row;
      };

      const showInput = () => {
        input.value = source;
        dom.replaceChildren(label, input);
        input.focus();
      };

      if (!source) {
        dom.replaceChildren(label, input);

        return { dom, stopEvent: stopsInteractiveEvents };
      }

      const url = document.createElement('span');
      const edit = document.createElement('button');
      const ctaRow = kind === 'survey' ? surveyCtaRow() : null;
      const showSaved = () =>
        dom.replaceChildren(...(ctaRow ? [label, url, edit, ctaRow] : [label, url, edit]));

      url.className = 'sv-embed-card__url';
      url.textContent = source;
      edit.type = 'button';
      edit.className = 'sv-embed-card__edit';
      edit.textContent = 'Change address';
      edit.addEventListener('mousedown', (event) => event.stopPropagation());
      edit.addEventListener('click', showInput);
      input.addEventListener('blur', () => {
        if (input.value.trim() === source) showSaved();
      });
      showSaved();

      return { dom, stopEvent: stopsInteractiveEvents };
    };
  },

  atom: true,

  draggable: true,

  group: 'block',

  name: 'articleEmbed',

  parseHTML() {
    return [{ priority: 60, tag: 'div[data-article-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

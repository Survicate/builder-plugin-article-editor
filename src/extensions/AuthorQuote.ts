import { mergeAttributes, Node } from '@tiptap/core';
import {
  blockDataAttribute,
  blockKindAttribute,
  serializeBlockData,
  textOf,
} from '@/extensions/blockData';
import { buildAvatarButton, buildField } from '@/extensions/blockFields';
import type { UploadImage } from '@/upload/uploadImage';

export const AUTHOR_QUOTE_KIND = 'author-quote';

export interface AuthorQuoteData {
  avatar: string;
  name: string;
  quote: string;
  role: string;
}

export interface AuthorQuoteOptions {
  onError: (message: string) => void;
  upload: UploadImage | null;
}

export const EMPTY_AUTHOR_QUOTE: AuthorQuoteData = { avatar: '', name: '', quote: '', role: '' };

export const parseAuthorQuote = (raw: string | null | undefined): AuthorQuoteData => {
  if (!raw) return { ...EMPTY_AUTHOR_QUOTE };

  try {
    const record = (JSON.parse(raw) ?? {}) as Record<string, unknown>;

    return {
      avatar: textOf(record.avatar),
      name: textOf(record.name),
      quote: textOf(record.quote),
      role: textOf(record.role),
    };
  } catch {
    return { ...EMPTY_AUTHOR_QUOTE };
  }
};

export const AuthorQuote = Node.create<AuthorQuoteOptions>({
  addAttributes() {
    return {
      'data-article-block': blockKindAttribute(AUTHOR_QUOTE_KIND),
      'data-block-data': blockDataAttribute(serializeBlockData(EMPTY_AUTHOR_QUOTE)),
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const quote = parseAuthorQuote(node.attrs['data-block-data'] as string | null);
      const dom = document.createElement('div');
      const label = document.createElement('span');
      const row = document.createElement('div');
      const fields = document.createElement('div');

      const commit = () => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'data-block-data', serializeBlockData(quote));

            return true;
          })
          .run();
      };

      const avatar = buildAvatarButton({
        avatar: quote.avatar,
        onError: this.options.onError,
        onUploaded: (url) => {
          quote.avatar = url;
          commit();
        },
        upload: this.options.upload,
      });

      dom.className = 'sv-roundtable';
      dom.contentEditable = 'false';
      label.className = 'sv-roundtable__label';
      label.textContent = 'Quote with author';
      row.className = 'sv-roundtable__row';
      fields.className = 'sv-roundtable__fields';
      fields.append(
        buildField(
          'sv-roundtable__quote',
          'The quote itself',
          quote.quote,
          (next) => {
            quote.quote = next;
            commit();
          },
          true,
        ),
        buildField('sv-roundtable__input', 'Name', quote.name, (next) => {
          quote.name = next;
          commit();
        }),
        buildField('sv-roundtable__input', 'Role, company', quote.role, (next) => {
          quote.role = next;
          commit();
        }),
      );
      row.append(avatar, fields);
      dom.append(label, row);

      return {
        dom,
        ignoreMutation: () => true,
        update: (updated) => updated.type.name === node.type.name,
      };
    };
  },

  addOptions() {
    return {
      onError: () => undefined,
      upload: null,
    };
  },

  atom: true,

  draggable: true,

  group: 'block',

  name: 'authorQuote',

  parseHTML() {
    return [{ priority: 70, tag: `div[data-article-block="${AUTHOR_QUOTE_KIND}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

import { mergeAttributes, Node } from '@tiptap/core';
import {
  blockDataAttribute,
  blockKindAttribute,
  serializeBlockData,
  textOf,
} from '@/extensions/blockData';
import { buildAvatarButton, buildField } from '@/extensions/blockFields';
import type { UploadImage } from '@/upload/uploadImage';

export const EXPERT_ROUNDTABLE_KIND = 'expert-roundtable';

export interface RoundtableExpert {
  avatar: string;
  name: string;
  quote: string;
  role: string;
}

export interface ExpertRoundtableOptions {
  onError: (message: string) => void;
  upload: UploadImage | null;
}

export const EMPTY_EXPERT: RoundtableExpert = { avatar: '', name: '', quote: '', role: '' };

export const parseExperts = (raw: string | null | undefined): RoundtableExpert[] => {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((entry) => {
      const record = (entry ?? {}) as Record<string, unknown>;

      return {
        avatar: textOf(record.avatar),
        name: textOf(record.name),
        quote: textOf(record.quote),
        role: textOf(record.role),
      };
    });
  } catch {
    return [];
  }
};

export const ExpertRoundtable = Node.create<ExpertRoundtableOptions>({
  addAttributes() {
    return {
      'data-article-block': blockKindAttribute(EXPERT_ROUNDTABLE_KIND),
      'data-block-data': blockDataAttribute(serializeBlockData([EMPTY_EXPERT])),
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const experts = parseExperts(node.attrs['data-block-data'] as string | null);

      if (!experts.length) experts.push({ ...EMPTY_EXPERT });

      const dom = document.createElement('div');
      const label = document.createElement('span');
      const list = document.createElement('div');
      const add = document.createElement('button');

      const commit = () => {
        const position = typeof getPos === 'function' ? getPos() : null;

        if (position === null || position === undefined) return;

        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeAttribute(position, 'data-block-data', serializeBlockData(experts));

            return true;
          })
          .run();
      };

      const buildRow = (expert: RoundtableExpert) => {
        const row = document.createElement('div');
        const fields = document.createElement('div');
        const remove = document.createElement('button');
        const avatar = buildAvatarButton({
          avatar: expert.avatar,
          onError: this.options.onError,
          onUploaded: (url) => {
            expert.avatar = url;
            commit();
          },
          upload: this.options.upload,
        });

        row.className = 'sv-roundtable__row';
        fields.className = 'sv-roundtable__fields';
        fields.append(
          buildField('sv-roundtable__input', 'Name', expert.name, (next) => {
            expert.name = next;
            commit();
          }),
          buildField('sv-roundtable__input', 'Role, company', expert.role, (next) => {
            expert.role = next;
            commit();
          }),
          buildField(
            'sv-roundtable__quote',
            'What did they say?',
            expert.quote,
            (next) => {
              expert.quote = next;
              commit();
            },
            true,
          ),
        );

        remove.type = 'button';
        remove.className = 'sv-roundtable__remove';
        remove.textContent = '✕';
        remove.title = 'Remove this expert';
        remove.addEventListener('mousedown', (event) => event.preventDefault());
        remove.addEventListener('click', () => {
          experts.splice(experts.indexOf(expert), 1);
          row.remove();

          if (!experts.length) {
            experts.push({ ...EMPTY_EXPERT });
            list.append(buildRow(experts[0]));
          }

          commit();
        });

        row.append(avatar, fields, remove);

        return row;
      };

      dom.className = 'sv-roundtable';
      dom.contentEditable = 'false';
      label.className = 'sv-roundtable__label';
      label.textContent = 'Expert roundtable';
      list.className = 'sv-roundtable__list';
      experts.forEach((expert) => list.append(buildRow(expert)));

      add.type = 'button';
      add.className = 'sv-roundtable__add';
      add.textContent = '+ Add expert';
      add.addEventListener('mousedown', (event) => event.preventDefault());
      add.addEventListener('click', () => {
        const expert = { ...EMPTY_EXPERT };

        experts.push(expert);
        list.append(buildRow(expert));
        commit();
      });

      dom.append(label, list, add);

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

  name: 'expertRoundtable',

  parseHTML() {
    return [{ priority: 70, tag: `div[data-article-block="${EXPERT_ROUNDTABLE_KIND}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

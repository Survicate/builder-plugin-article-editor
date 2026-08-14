import { mergeAttributes, Node } from '@tiptap/core';
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

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

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

export const serializeExperts = (experts: RoundtableExpert[]): string =>
  JSON.stringify(experts).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const pickImage = (): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });

const stopEditorEvents = (element: HTMLElement) => {
  element.addEventListener('mousedown', (event) => event.stopPropagation());
  element.addEventListener('keydown', (event) => event.stopPropagation());
};

const buildField = (
  className: string,
  placeholder: string,
  value: string,
  onCommit: (next: string) => void,
  multiline = false,
) => {
  const field = multiline ? document.createElement('textarea') : document.createElement('input');

  field.className = className;
  field.placeholder = placeholder;
  field.value = value;

  if (field instanceof HTMLTextAreaElement) field.rows = 3;

  stopEditorEvents(field);
  field.addEventListener('change', () => onCommit(field.value.trim()));

  return field;
};

export const ExpertRoundtable = Node.create<ExpertRoundtableOptions>({
  addAttributes() {
    return {
      'data-article-block': {
        default: EXPERT_ROUNDTABLE_KIND,
        parseHTML: () => EXPERT_ROUNDTABLE_KIND,
        renderHTML: () => ({ 'data-article-block': EXPERT_ROUNDTABLE_KIND }),
      },
      'data-block-data': {
        default: serializeExperts([EMPTY_EXPERT]),
        parseHTML: (element: HTMLElement) => element.getAttribute('data-block-data'),
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = attributes['data-block-data'];

          return typeof value === 'string' && value ? { 'data-block-data': value } : {};
        },
      },
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
            tr.setNodeAttribute(position, 'data-block-data', serializeExperts(experts));

            return true;
          })
          .run();
      };

      const buildRow = (expert: RoundtableExpert) => {
        const row = document.createElement('div');
        const avatar = document.createElement('button');
        const picture = document.createElement('img');
        const fields = document.createElement('div');
        const remove = document.createElement('button');

        const refreshAvatar = () => {
          picture.src = expert.avatar;
          avatar.classList.toggle('has-photo', Boolean(expert.avatar));
        };

        row.className = 'sv-roundtable__row';
        avatar.type = 'button';
        avatar.className = 'sv-roundtable__avatar';
        avatar.title = 'Upload a photo';
        picture.className = 'sv-roundtable__photo';
        picture.alt = '';
        avatar.append(picture);
        refreshAvatar();
        avatar.addEventListener('mousedown', (event) => event.preventDefault());
        avatar.addEventListener('click', () => {
          const { onError, upload } = this.options;

          if (!upload) {
            onError('Uploading photos needs the Builder editor, which supplies the login');

            return;
          }

          void pickImage().then(async (file) => {
            if (!file) return;

            try {
              expert.avatar = await upload(file);
              refreshAvatar();
              commit();
            } catch (error) {
              onError(error instanceof Error ? error.message : 'The photo upload failed');
            }
          });
        });

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

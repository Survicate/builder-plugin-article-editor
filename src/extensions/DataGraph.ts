import { mergeAttributes, Node } from '@tiptap/core';
import {
  blockDataAttribute,
  blockKindAttribute,
  serializeBlockData,
  textOf,
} from '@/extensions/blockData';
import { buildField, stopEditorEvents } from '@/extensions/blockFields';

export const DATA_GRAPH_KIND = 'data-graph';

export interface DataGraphBar {
  label: string;
  value: number;
}

export interface DataGraphData {
  bars: DataGraphBar[];
  title: string;
}

export const EMPTY_GRAPH: DataGraphData = { bars: [{ label: '', value: 0 }], title: '' };

const numberOf = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(textOf(value));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const parseDataGraph = (raw: string | null | undefined): DataGraphData => {
  if (!raw) return { bars: [], title: '' };

  try {
    const record = (JSON.parse(raw) ?? {}) as Record<string, unknown>;
    const bars = Array.isArray(record.bars) ? record.bars : [];

    return {
      bars: bars.map((bar) => {
        const entry = (bar ?? {}) as Record<string, unknown>;

        return { label: textOf(entry.label), value: numberOf(entry.value) };
      }),
      title: textOf(record.title),
    };
  } catch {
    return { bars: [], title: '' };
  }
};

export const DataGraph = Node.create({
  addAttributes() {
    return {
      'data-article-block': blockKindAttribute(DATA_GRAPH_KIND),
      'data-block-data': blockDataAttribute(serializeBlockData(EMPTY_GRAPH)),
    };
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      const graph = parseDataGraph(node.attrs['data-block-data'] as string | null);

      if (!graph.bars.length) graph.bars.push({ label: '', value: 0 });

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
            tr.setNodeAttribute(position, 'data-block-data', serializeBlockData(graph));

            return true;
          })
          .run();
      };

      const buildRow = (bar: DataGraphBar) => {
        const row = document.createElement('div');
        const value = document.createElement('input');
        const remove = document.createElement('button');

        row.className = 'sv-roundtable__row';
        value.className = 'sv-roundtable__input sv-graph__value';
        value.type = 'number';
        value.min = '0';
        value.placeholder = '%';
        value.value = bar.value ? String(bar.value) : '';
        stopEditorEvents(value);
        value.addEventListener('change', () => {
          bar.value = numberOf(value.value);
          commit();
        });

        remove.type = 'button';
        remove.className = 'sv-roundtable__remove';
        remove.textContent = '✕';
        remove.title = 'Remove this bar';
        remove.addEventListener('mousedown', (event) => event.preventDefault());
        remove.addEventListener('click', () => {
          graph.bars.splice(graph.bars.indexOf(bar), 1);
          row.remove();

          if (!graph.bars.length) {
            graph.bars.push({ label: '', value: 0 });
            list.append(buildRow(graph.bars[0]));
          }

          commit();
        });

        row.append(
          buildField('sv-roundtable__input', 'Label', bar.label, (next) => {
            bar.label = next;
            commit();
          }),
          value,
          remove,
        );

        return row;
      };

      dom.className = 'sv-roundtable';
      dom.contentEditable = 'false';
      label.className = 'sv-roundtable__label';
      label.textContent = 'Data graph';
      list.className = 'sv-roundtable__list';
      list.append(
        buildField('sv-roundtable__input', 'Chart title', graph.title, (next) => {
          graph.title = next;
          commit();
        }),
      );
      graph.bars.forEach((bar) => list.append(buildRow(bar)));

      add.type = 'button';
      add.className = 'sv-roundtable__add';
      add.textContent = '+ Add bar';
      add.addEventListener('mousedown', (event) => event.preventDefault());
      add.addEventListener('click', () => {
        const bar = { label: '', value: 0 };

        graph.bars.push(bar);
        list.append(buildRow(bar));
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

  atom: true,

  draggable: true,

  group: 'block',

  name: 'dataGraph',

  parseHTML() {
    return [{ priority: 70, tag: `div[data-article-block="${DATA_GRAPH_KIND}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  selectable: true,
});

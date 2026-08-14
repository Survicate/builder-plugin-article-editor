import type { Editor } from '@tiptap/core';
import { normalizeHref } from '@/editor/normalizeHref';
import { positionNear, selectionRect } from '@/editor/positionNear';
import type { SearchSiteLinks, SiteLink } from '@/search/searchSiteLinks';

const DIALOG_CLASS = 'sv-link-dialog';
const SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH_LENGTH = 2;

export interface LinkOptions {
  newTab?: boolean;
  nofollow?: boolean;
}

export const applyLink = (editor: Editor, rawHref: string, options: LinkOptions = {}) => {
  const href = normalizeHref(rawHref);
  const chain = editor.chain().focus().extendMarkRange('link');

  if (!href) return chain.unsetLink().run();

  const attrs = {
    href,
    rel: options.nofollow === true ? 'nofollow' : null,
    target: options.newTab === true ? '_blank' : null,
  };

  if (editor.state.selection.empty) {
    return chain
      .insertContent({ marks: [{ attrs, type: 'link' }], text: href, type: 'text' })
      .run();
  }

  return chain.setLink(attrs).run();
};

const buildCheckbox = (labelText: string, checked: boolean) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');

  label.className = `${DIALOG_CLASS}__option`;
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  label.append(checkbox, document.createTextNode(labelText));

  return { checkbox, label };
};

interface CurrentLink {
  href: string;
  newTab: boolean;
  nofollow: boolean;
}

const buildSearchResults = (input: HTMLInputElement, search: SearchSiteLinks) => {
  const results = document.createElement('div');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  results.className = `${DIALOG_CLASS}__results`;

  const render = (links: SiteLink[]) => {
    results.replaceChildren();
    links.forEach((link) => {
      const option = document.createElement('button');
      const title = document.createElement('span');
      const path = document.createElement('span');

      option.type = 'button';
      option.className = `${DIALOG_CLASS}__result`;
      title.className = `${DIALOG_CLASS}__result-title`;
      title.textContent = link.title;
      path.className = `${DIALOG_CLASS}__result-path`;
      path.textContent = link.path;
      option.append(title, path);
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('click', () => {
        input.value = link.path;
        results.replaceChildren();
        input.focus();
      });
      results.append(option);
    });
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);

    const term = input.value.trim();

    if (term.length < MIN_SEARCH_LENGTH || /^https?:\/\//i.test(term)) {
      render([]);

      return;
    }

    timer = setTimeout(() => {
      const id = ++requestId;

      void search(term).then((links) => {
        if (id === requestId) render(links);
      });
    }, SEARCH_DEBOUNCE_MS);
  });

  return results;
};

const buildDialog = (
  current: CurrentLink,
  search: SearchSiteLinks | null,
  onApply: (href: string, options: LinkOptions) => void,
  onClose: () => void,
) => {
  const dialog = document.createElement('div');
  const input = document.createElement('input');
  const options = document.createElement('div');
  const actions = document.createElement('div');
  const apply = document.createElement('button');
  const newTab = buildCheckbox('Open in a new tab', current.newTab);
  const nofollow = buildCheckbox('Ask search engines not to follow (nofollow)', current.nofollow);

  dialog.className = DIALOG_CLASS;
  input.className = `${DIALOG_CLASS}__input`;
  input.type = 'text';
  input.placeholder = 'Paste an address or type /pricing/';
  input.value = current.href;
  options.className = `${DIALOG_CLASS}__options`;
  options.append(newTab.label, nofollow.label);
  actions.className = `${DIALOG_CLASS}__actions`;
  apply.type = 'button';
  apply.className = `${DIALOG_CLASS}__apply`;
  apply.textContent = current.href ? 'Update' : 'Add link';

  const submit = () =>
    onApply(input.value, { newTab: newTab.checkbox.checked, nofollow: nofollow.checkbox.checked });

  apply.addEventListener('mousedown', (event) => event.preventDefault());
  apply.addEventListener('click', submit);
  actions.append(apply);

  if (current.href) {
    const remove = document.createElement('button');

    remove.type = 'button';
    remove.className = `${DIALOG_CLASS}__remove`;
    remove.textContent = 'Remove';
    remove.addEventListener('mousedown', (event) => event.preventDefault());
    remove.addEventListener('click', () => onApply('', {}));
    actions.append(remove);
  }

  input.addEventListener('keydown', (event) => {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  });

  dialog.append(input);

  if (search) dialog.append(buildSearchResults(input, search));

  dialog.append(options, actions);

  return { dialog, input };
};

export const openLinkDialog = (editor: Editor) => {
  document.querySelector(`.${DIALOG_CLASS}`)?.remove();

  const attributes = editor.getAttributes('link');
  const current: CurrentLink = {
    href: (attributes.href as string | undefined) ?? '',
    newTab: attributes.target === '_blank',
    nofollow: ((attributes.rel as string | undefined) ?? '').includes('nofollow'),
  };
  const anchor = selectionRect(editor);

  const close = () => {
    dialog.remove();
    document.removeEventListener('mousedown', closeOnOutsideClick, true);
    editor.commands.focus();
  };

  const closeOnOutsideClick = (event: MouseEvent) => {
    if (!dialog.contains(event.target as globalThis.Node)) close();
  };

  const { dialog, input } = buildDialog(
    current,
    editor.storage.linkSearch?.search ?? null,
    (value, options) => {
      applyLink(editor, value, options);
      close();
    },
    () => close(),
  );

  document.body.append(dialog);
  positionNear(dialog, anchor);
  document.addEventListener('mousedown', closeOnOutsideClick, true);
  input.focus();
  input.select();

  return close;
};

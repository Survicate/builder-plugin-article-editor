import appState from '@builder.io/app-context';

const BLOG_POST_MODEL_NAME = 'blog-post';
const FIRST_PUBLISHED_FIELD = 'publishedAt';

export interface ContentEditorActions {
  safeReaction<T>(
    watchFunction: () => T,
    reactionFunction: (value: T) => void,
    options?: { fireImmediately: true },
  ): void;
}

interface EditableContentData {
  get(field: string): unknown;
  set(field: string, value: unknown): void;
}

export interface FirstPublishedAppState {
  designerState?: {
    editingContentModel?: { data?: EditableContentData };
    editingModel?: { name?: string };
  };
  editingModel?: { name?: string };
}

const emptyFirstPublishedData = (
  state: FirstPublishedAppState | undefined,
): EditableContentData | null => {
  if (!state) return null;

  const modelName = state.designerState?.editingModel?.name ?? state.editingModel?.name;

  if (modelName !== BLOG_POST_MODEL_NAME) return null;

  const data = state.designerState?.editingContentModel?.data;

  if (!data || data.get(FIRST_PUBLISHED_FIELD)) return null;

  return data;
};

const fillNow = (data: EditableContentData | null): void => {
  data?.set(FIRST_PUBLISHED_FIELD, new Date().toString());
};

/**
 * Fills the First Published date the moment a blog post without one is opened
 * in the editor (a newly created post), so every post carries the date the
 * site sorts and displays by. The value stays editable in the sidebar like
 * any other field.
 *
 * Runs through two independent paths: the editor.onLoad reaction below, and
 * fillFirstPublishedIfEmpty called when the Body Content field editor mounts,
 * which is guaranteed to execute for every opened blog post.
 */
export const fillFirstPublishedIfEmpty = (
  state: FirstPublishedAppState | undefined = appState,
): void => {
  fillNow(emptyFirstPublishedData(state));
};

export const autoFillFirstPublished = (actions: ContentEditorActions): void => {
  actions.safeReaction(() => emptyFirstPublishedData(appState), fillNow, {
    fireImmediately: true,
  });
};

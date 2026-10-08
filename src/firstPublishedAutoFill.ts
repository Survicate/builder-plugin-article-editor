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

type EditingContentModel = NonNullable<
  NonNullable<(typeof appState)['designerState']>['editingContentModel']
>;

const editingModelName = (): string | undefined =>
  appState.designerState?.editingModel?.name ?? appState.editingModel?.name;

const blogPostMissingFirstPublished = (): EditingContentModel | null => {
  if (editingModelName() !== BLOG_POST_MODEL_NAME) return null;

  const content = appState.designerState?.editingContentModel;

  if (!content?.data || content.data.get(FIRST_PUBLISHED_FIELD)) return null;

  return content;
};

/**
 * Fills the First Published date the moment a blog post without one is opened
 * in the editor (a newly created post), so every post carries the date the
 * site sorts and displays by. The value stays editable in the sidebar like
 * any other field.
 */
export const autoFillFirstPublished = (actions: ContentEditorActions): void => {
  actions.safeReaction(
    blogPostMissingFirstPublished,
    (content) => content?.data?.set(FIRST_PUBLISHED_FIELD, new Date().toString()),
    { fireImmediately: true },
  );
};

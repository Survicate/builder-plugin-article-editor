import appState from '@builder.io/app-context';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  autoFillFirstPublished,
  type ContentEditorActions,
} from '@/firstPublishedAutoFill';

const runReaction = (): void => {
  const reactions: Array<{ react: (value: unknown) => void; watch: () => unknown }> = [];

  const actions: ContentEditorActions = {
    safeReaction: (watchFunction, reactionFunction) => {
      reactions.push({
        react: reactionFunction as (value: unknown) => void,
        watch: watchFunction,
      });
    },
  };

  autoFillFirstPublished(actions);

  for (const { react, watch } of reactions) react(watch());
};

describe('autoFillFirstPublished', () => {
  beforeEach(() => {
    delete appState.designerState;
    delete appState.editingModel;
  });

  it('fills an empty First Published field on a blog post entry', () => {
    const data = new Map<string, unknown>();

    appState.designerState = {
      editingContentModel: { data },
      editingModel: { name: 'blog-post' },
    };

    runReaction();

    const value = data.get('publishedAt');

    expect(typeof value).toBe('string');
    expect(Number.isNaN(Date.parse(value as string))).toBe(false);
  });

  it('leaves an already filled First Published field untouched', () => {
    const data = new Map<string, unknown>([['publishedAt', 'Tue Jul 28 2026 00:00:00 GMT+0000']]);

    appState.designerState = {
      editingContentModel: { data },
      editingModel: { name: 'blog-post' },
    };

    runReaction();

    expect(data.get('publishedAt')).toBe('Tue Jul 28 2026 00:00:00 GMT+0000');
  });

  it('ignores entries of other models', () => {
    const data = new Map<string, unknown>();

    appState.designerState = {
      editingContentModel: { data },
      editingModel: { name: 'page' },
    };

    runReaction();

    expect(data.has('publishedAt')).toBe(false);
  });

  it('reads the model name from the app state root when designerState lacks it', () => {
    const data = new Map<string, unknown>();

    appState.designerState = { editingContentModel: { data } };
    appState.editingModel = { name: 'blog-post' };

    runReaction();

    expect(data.has('publishedAt')).toBe(true);
  });

  it('does nothing while no entry is open', () => {
    appState.designerState = { editingModel: { name: 'blog-post' } };

    expect(() => runReaction()).not.toThrow();
  });
});

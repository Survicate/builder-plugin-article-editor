import React, { useEffect, useState } from 'react';
import {
  fetchCategoryPosts,
  fetchPostTitle,
  type PickablePost,
  type PostReference,
  postReference,
  referenceId,
  type ReferenceLike,
} from '@/postPicker/postPickerData';
import '@/editor/editor-styles.css';

export interface PostPickerProps {
  context?: { user?: { apiKey?: string } };
  object?: { get(field: string): unknown };
  onChange: (value: PostReference | null) => void;
  value?: ReferenceLike | null;
}

const postDay = (value: string | undefined): string | null => {
  const time = value ? Date.parse(value) : Number.NaN;

  if (!Number.isFinite(time)) return null;

  return new Date(time).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  });
};

export const PostPicker = ({ context, object, onChange, value }: PostPickerProps) => {
  const apiKey = context?.user?.apiKey;
  const categoryId = referenceId(object?.get('category') as ReferenceLike | undefined);
  const selectedId = referenceId(value);
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<PickablePost[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !selectedId) {
      setSelectedTitle(null);

      return;
    }

    const known = posts?.find((post) => post.id === selectedId);

    if (known) {
      setSelectedTitle(known.title);

      return;
    }

    let cancelled = false;

    fetchPostTitle(apiKey, selectedId)
      .then((title) => {
        if (!cancelled) setSelectedTitle(title);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [apiKey, posts, selectedId]);

  useEffect(() => {
    if (!open || !apiKey || !categoryId) return;

    let cancelled = false;

    setPosts(null);
    setLoadError(false);
    fetchCategoryPosts(apiKey, categoryId)
      .then((list) => {
        if (!cancelled) setPosts(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, categoryId, open]);

  if (!categoryId) {
    return (
      <div className="sv-post-picker">
        <span className="sv-post-picker__hint">
          Pick the section&apos;s category first: this list only shows posts of that category.
        </span>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visiblePosts = (posts ?? []).filter((post) =>
    `${post.title} ${post.slug ?? ''}`.toLowerCase().includes(query),
  );
  const outsideCategory = Boolean(
    selectedId && posts && !posts.some((post) => post.id === selectedId),
  );

  const choose = (post: PickablePost): void => {
    onChange(postReference(post.id));
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="sv-post-picker">
      <div className="sv-post-picker__selection">
        <span className="sv-post-picker__title">
          {selectedId
            ? (selectedTitle ?? 'Pinned post')
            : 'No post pinned: the newest post of this category fills in.'}
        </span>
        <div className="sv-post-picker__actions">
          <button
            className="sv-post-picker__button"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? 'Close' : selectedId ? 'Change' : 'Pick a post'}
          </button>
          {!!selectedId && (
            <button
              className="sv-post-picker__button"
              onClick={() => onChange(null)}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {outsideCategory && !open && (
        <span className="sv-post-picker__warn">
          This post is outside the section&apos;s category, so the newest post fills in. Pick one
          from the list.
        </span>
      )}
      {open && (
        <div className="sv-post-picker__browser">
          <input
            className="sv-post-picker__search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts in this category..."
            type="search"
            value={search}
          />
          {loadError && (
            <span className="sv-post-picker__warn">
              Could not load the posts of this category. Close and try again.
            </span>
          )}
          {!loadError && !posts && <span className="sv-post-picker__hint">Loading posts...</span>}
          {posts && !visiblePosts.length && (
            <span className="sv-post-picker__hint">No posts match.</span>
          )}
          <ul className="sv-post-picker__list">
            {visiblePosts.map((post) => (
              <li key={post.id}>
                <button
                  className={
                    `sv-post-picker__item${ 
                    post.id === selectedId ? ' sv-post-picker__item--selected' : ''}`
                  }
                  onClick={() => choose(post)}
                  type="button"
                >
                  <span className="sv-post-picker__item-title">{post.title}</span>
                  {postDay(post.publishedAt) && (
                    <span className="sv-post-picker__item-date">{postDay(post.publishedAt)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

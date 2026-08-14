import { Extension } from '@tiptap/core';
import type { SearchSiteLinks } from '@/search/searchSiteLinks';

export interface LinkSearchOptions {
  search: SearchSiteLinks | null;
}

export interface LinkSearchStorage {
  search: SearchSiteLinks | null;
}

declare module '@tiptap/core' {
  interface Storage {
    linkSearch: LinkSearchStorage;
  }
}

export const LinkSearch = Extension.create<LinkSearchOptions, LinkSearchStorage>({
  addOptions() {
    return { search: null };
  },

  addProseMirrorPlugins() {
    this.storage.search = this.options.search;

    return [];
  },

  addStorage() {
    return { search: null };
  },

  name: 'linkSearch',
});

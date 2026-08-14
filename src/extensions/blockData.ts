export const serializeBlockData = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

export const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

export const blockDataAttribute = (defaultValue: string) => ({
  default: defaultValue,
  parseHTML: (element: HTMLElement) => element.getAttribute('data-block-data'),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes['data-block-data'];

    return typeof value === 'string' && value ? { 'data-block-data': value } : {};
  },
});

export const blockKindAttribute = (kind: string) => ({
  default: kind,
  parseHTML: () => kind,
  renderHTML: () => ({ 'data-article-block': kind }),
});

const KNOWN_PREFIX = /^(https?:|mailto:|tel:|#|\/)/i;
const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+(\/|$|\?|#)/;

/**
 * Turns what somebody typed into a usable address. A bare domain gets https://
 * so the link does not resolve relative to the blog, while site paths, anchors,
 * mail and phone links are left exactly as written.
 */
export const normalizeHref = (raw: string): string => {
  const value = raw.trim();

  if (!value) return '';

  if (KNOWN_PREFIX.test(value)) return value;

  if (value.includes('@') && !value.includes(' ')) return `mailto:${value}`;

  if (BARE_DOMAIN.test(value)) return `https://${value}`;

  return value;
};

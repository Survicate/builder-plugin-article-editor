// eslint-disable-next-line no-control-regex -- stripping control characters is the point
const CONTROL_CHARS = /[\u0000-\u001f]/g;
const KNOWN_PREFIX = /^(https?:|mailto:|tel:|#|\/)/i;
const OTHER_SCHEME = /^[a-z][\w+.-]*:/i;
const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+(\/|$|\?|#)/;

/**
 * Keeps a pasted or captured address only when it uses one of the safe,
 * expected schemes; anything else (javascript:, data:, vbscript:, …) is
 * dropped. Control characters are stripped first so a tab inside the scheme
 * cannot smuggle it past the check.
 */
export const dropUnsafeHref = (raw: string | null): string | null => {
  if (!raw) return null;

  const value = raw.replace(CONTROL_CHARS, '').trim();

  if (!value) return null;

  if (KNOWN_PREFIX.test(value)) return value;

  return OTHER_SCHEME.test(value) ? null : value;
};

/**
 * Turns what somebody typed into a usable address. A bare domain gets https://
 * so the link does not resolve relative to the blog, while site paths, anchors,
 * mail and phone links are left exactly as written. Unsafe schemes come back
 * empty, which the dialog treats as "remove the link".
 */
export const normalizeHref = (raw: string): string => {
  const value = raw.replace(CONTROL_CHARS, '').trim();

  if (!value) return '';

  if (KNOWN_PREFIX.test(value)) return value;

  if (OTHER_SCHEME.test(value)) return '';

  if (value.includes('@') && !value.includes(' ')) return `mailto:${value}`;

  if (BARE_DOMAIN.test(value)) return `https://${value}`;

  return value;
};

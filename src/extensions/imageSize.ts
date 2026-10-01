const SIZE_PATTERN = /^(\d+)(px|%)$/;
const MAX_PERCENT = 100;

/**
 * Normalizes what an editor types into the size field: bare numbers mean
 * pixels, units are kept, anything else clears the override so the image
 * falls back to its natural responsive size.
 */
export const normalizeImageSize = (value: string): string | null => {
  const compact = value.replace(/\s+/g, '').toLowerCase();

  if (!compact) return null;

  const candidate = /^\d+$/.test(compact) ? `${compact}px` : compact;
  const match = candidate.match(SIZE_PATTERN);

  if (!match) return null;

  const amount = Number(match[1]);

  if (!amount) return null;

  if (match[2] === '%' && amount > MAX_PERCENT) return null;

  return candidate;
};

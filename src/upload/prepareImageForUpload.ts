const MAX_DIMENSION = 2560;
const WEBP_QUALITY = 0.85;
const RECODABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const encodeCanvas = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY);
  });

/**
 * Re-encodes photographic uploads to webp and caps the longest edge, so the
 * asset library never stores multi-megabyte originals. GIFs (animation) and
 * SVGs pass through untouched, and any failure falls back to the original
 * file — compression must never block an upload.
 */
export const prepareImageForUpload = async (file: File): Promise<File> => {
  if (!RECODABLE_TYPES.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await encodeCanvas(canvas);

    if (!blob || (scale === 1 && blob.size >= file.size)) return file;

    const stem = file.name.replace(/\.[a-z0-9]+$/i, '') || 'image';

    return new File([blob], `${stem}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
};

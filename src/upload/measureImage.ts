export interface ImageSize {
  height: number;
  width: number;
}

export const measureImage = (file: Blob): Promise<ImageSize | null> =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();

      const finish = (size: ImageSize | null) => {
        URL.revokeObjectURL(url);
        resolve(size);
      };

      image.onload = () =>
        finish(
          image.naturalWidth > 0
            ? { height: image.naturalHeight, width: image.naturalWidth }
            : null,
        );
      image.onerror = () => finish(null);
      image.src = url;
    } catch {
      resolve(null);
    }
  });

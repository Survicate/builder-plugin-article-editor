import type { UploadImage } from '@/upload/uploadImage';

export const stopEditorEvents = (element: HTMLElement) => {
  element.addEventListener('mousedown', (event) => event.stopPropagation());
  element.addEventListener('keydown', (event) => event.stopPropagation());
};

export const buildField = (
  className: string,
  placeholder: string,
  value: string,
  onCommit: (next: string) => void,
  multiline = false,
) => {
  const field = multiline ? document.createElement('textarea') : document.createElement('input');

  field.className = className;
  field.placeholder = placeholder;
  field.value = value;

  if (field instanceof HTMLTextAreaElement) field.rows = 3;

  stopEditorEvents(field);
  field.addEventListener('change', () => onCommit(field.value.trim()));

  return field;
};

export const pickImage = (): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });

export interface AvatarButtonOptions {
  avatar: string;
  onError: (message: string) => void;
  onUploaded: (url: string) => void;
  upload: UploadImage | null;
}

export const buildAvatarButton = ({ avatar, onError, onUploaded, upload }: AvatarButtonOptions) => {
  const button = document.createElement('button');
  const picture = document.createElement('img');
  let current = avatar;

  const refresh = () => {
    picture.src = current;
    button.classList.toggle('has-photo', Boolean(current));
  };

  button.type = 'button';
  button.className = 'sv-roundtable__avatar';
  button.title = 'Upload a photo';
  picture.className = 'sv-roundtable__photo';
  picture.alt = '';
  button.append(picture);
  refresh();
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => {
    if (!upload) {
      onError('Uploading photos needs the Builder editor, which supplies the login');

      return;
    }

    void pickImage().then(async (file) => {
      if (!file) return;

      try {
        current = await upload(file);
        refresh();
        onUploaded(current);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'The photo upload failed');
      }
    });
  });

  return button;
};

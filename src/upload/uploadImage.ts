const UPLOAD_ENDPOINT = 'https://builder.io/api/v1/upload';
const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

export interface BuilderUploadContext {
  user?: {
    apiKey?: string;
    authHeaders?: Record<string, string>;
    organization?: { value?: { id?: string } };
  };
}

const spaceApiKey = (context: BuilderUploadContext): string | undefined =>
  context.user?.apiKey ?? context.user?.organization?.value?.id;

export type UploadImage = (file: File) => Promise<string>;

interface UploadResponse {
  url?: string;
}

/**
 * Uploads to the space's asset library with the signed-in user's own
 * credentials, which Builder hands to a plugin through the app context. The
 * headers are read again on every upload, because Builder refreshes them
 * during a session and a snapshot taken at mount goes stale.
 */
export const createImageUploader = (context?: BuilderUploadContext): UploadImage | null => {
  if (!context) return null;

  return async (file: File): Promise<string> => {
    const authHeaders = context.user?.authHeaders;

    if (!authHeaders || !Object.keys(authHeaders).length) {
      throw new Error('The Builder session is still loading — try the upload again in a moment');
    }

    const apiKey = spaceApiKey(context);
    const keyParam = apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : '';
    const endpoint = `${UPLOAD_ENDPOINT}?name=${encodeURIComponent(file.name)}${keyParam}`;
    const response = await fetch(endpoint, {
      body: file,
      headers: { ...authHeaders, 'Content-Type': file.type || FALLBACK_CONTENT_TYPE },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Builder refused the upload (${response.status} ${response.statusText})`);
    }

    const payload = (await response.json()) as UploadResponse;

    if (!payload.url) throw new Error('Builder accepted the upload but returned no address');

    return payload.url;
  };
};

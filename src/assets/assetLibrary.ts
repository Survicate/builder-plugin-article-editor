import { type BuilderUploadContext, spaceApiKey } from '@/upload/uploadImage';

const ADMIN_API_URL = 'https://builder.io/api/v2/admin';

const ASSETS_QUERY =
  'query Assets($input: QueryAssetsInput) ' +
  '{ assets(input: $input) { id name url width height bytes createdDate } }';

const DELETE_ASSET_MUTATION = 'mutation DeleteAsset($id: String!) { deleteAsset(id: $id) }';

export interface BuilderAsset {
  bytes?: number | null;
  createdDate?: number | null;
  height?: number | null;
  id: string;
  name: string;
  url: string;
  width?: number | null;
}

export interface ListAssetsOptions {
  limit: number;
  offset: number;
  search?: string;
}

export interface AssetLibrary {
  list: (options: ListAssetsOptions) => Promise<BuilderAsset[]>;
  remove: (id: string) => Promise<void>;
}

interface AdminData {
  assets?: (Partial<BuilderAsset> | null)[] | null;
  deleteAsset?: unknown;
}

interface AdminResponse {
  data?: AdminData;
  errors?: { message?: string }[];
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const callAdmin = async (
  context: BuilderUploadContext,
  query: string,
  variables: Record<string, unknown>,
): Promise<AdminData | undefined> => {
  const authHeaders = context.user?.authHeaders;

  if (!authHeaders || !Object.keys(authHeaders).length) {
    throw new Error('The Builder session is still loading, try again in a moment');
  }

  const apiKey = spaceApiKey(context);
  const keyParam = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';
  const response = await fetch(`${ADMIN_API_URL}${keyParam}`, {
    body: JSON.stringify({ query, variables }),
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Builder refused the request (${response.status} ${response.statusText})`);
  }

  const payload = (await response.json()) as AdminResponse;
  const firstError = payload.errors?.[0]?.message;

  if (firstError) throw new Error(firstError);

  return payload.data;
};

/**
 * Lists and deletes the space's image assets through the Admin API, with the
 * signed-in user's own credentials, like the uploader does. The credentials
 * are read again on every call because Builder refreshes them mid-session.
 * The Admin API also reports each asset's pixel size, which Builder's own
 * media manager does not show, so the browser can display it.
 */
export const createAssetLibrary = (context?: BuilderUploadContext): AssetLibrary | null => {
  if (!context) return null;

  return {
    list: async ({ limit, offset, search }) => {
      const term = search?.trim() ?? '';
      const input = {
        limit,
        offset,
        query: {
          type: { $regex: '^image/' },
          ...(term ? { name: { $options: 'i', $regex: escapeRegExp(term) } } : {}),
        },
        sort: { createdDate: -1 },
      };
      const data = await callAdmin(context, ASSETS_QUERY, { input });

      return (data?.assets ?? []).filter((asset): asset is BuilderAsset =>
        Boolean(asset?.id && asset.url && asset.name),
      );
    },
    remove: async (id) => {
      await callAdmin(context, DELETE_ASSET_MUTATION, { id });
    },
  };
};

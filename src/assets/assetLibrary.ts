import { PLUGIN_NAME } from '@/constants';
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
  prime?: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export interface BuilderAdminContext extends BuilderUploadContext {
  globalState?: {
    getPluginPrivateKey?: (pluginId: string) => Promise<string | null | undefined>;
  };
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

/**
 * The Admin API only accepts private keys, not the signed-in user's session
 * headers. Builder keeps one private key per plugin in the space (asking the
 * user to approve its creation on first use), so the key is fetched once and
 * cached: unlike the session headers it does not rotate mid-session.
 */
const createPluginKeyReader = (context: BuilderAdminContext) => {
  let cachedHeaders: Record<string, string> | null = null;

  return async (): Promise<Record<string, string> | null> => {
    if (cachedHeaders) return cachedHeaders;

    try {
      const privateKey = await context.globalState?.getPluginPrivateKey?.(PLUGIN_NAME);

      cachedHeaders = privateKey ? { Authorization: `Bearer ${privateKey}` } : null;
    } catch {
      cachedHeaders = null;
    }

    return cachedHeaders;
  };
};

type PluginKeyReader = ReturnType<typeof createPluginKeyReader>;

const authorizationHeaders = async (
  context: BuilderAdminContext,
  readPluginKey: PluginKeyReader,
): Promise<Record<string, string>> => {
  const headers = (await readPluginKey()) ?? context.user?.authHeaders;

  if (!headers || !Object.keys(headers).length) {
    throw new Error('The Builder session is still loading, try again in a moment');
  }

  return headers;
};

const callAdmin = async (
  context: BuilderAdminContext,
  readPluginKey: PluginKeyReader,
  query: string,
  variables: Record<string, unknown>,
): Promise<AdminData | undefined> => {
  const authHeaders = await authorizationHeaders(context, readPluginKey);
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
 * plugin's own private key (or the user session headers as a fallback). The
 * Admin API also reports each asset's pixel size, which Builder's own media
 * manager does not show, so the browser can display it. Priming resolves the
 * credentials before the dialog mounts, so Builder's own approval prompt for
 * a first-time key is never hidden behind the dialog's overlay.
 */
export const createAssetLibrary = (context?: BuilderAdminContext): AssetLibrary | null => {
  if (!context) return null;

  const readPluginKey = createPluginKeyReader(context);

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
      const data = await callAdmin(context, readPluginKey, ASSETS_QUERY, { input });

      return (data?.assets ?? []).filter((asset): asset is BuilderAsset =>
        Boolean(asset?.id && asset.url && asset.name),
      );
    },
    prime: async () => {
      await authorizationHeaders(context, readPluginKey);
    },
    remove: async (id) => {
      await callAdmin(context, readPluginKey, DELETE_ASSET_MUTATION, { id });
    },
  };
};

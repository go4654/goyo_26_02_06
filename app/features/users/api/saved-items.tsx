/**
 * 저장한 클래스/갤러리 더보기 API
 * GET /api/users/saved-items?type=class|gallery&offset=12&limit=12
 * RPC get_saved_classes / get_saved_galleries 호출 후 JSON 반환
 */
import type { Route } from "./+types/saved-items";

import { data } from "react-router";

import { SAVED_ITEMS_PAGE_SIZE } from "../constants";
import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ type: null, items: [], hasMore: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10),
  );
  const limit = Math.min(
    50,
    Math.max(
      1,
      parseInt(url.searchParams.get("limit") ?? String(SAVED_ITEMS_PAGE_SIZE), 10),
    ),
  );

  const rpcClient = client as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => ReturnType<typeof client.rpc>;
  };
  const args = {
    p_user_uuid: user.id,
    p_page_limit: limit,
    p_page_offset: offset,
  };

  if (type === "class") {
    const { data: rows } = await rpcClient.rpc("get_saved_classes", args);
    const items = (Array.isArray(rows) ? rows : []).map(
      (row: Record<string, unknown>) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        thumbnail_image_url: row.thumbnail_image_url ?? null,
      }),
    );
    return data({
      type: "class" as const,
      items,
      hasMore: items.length === limit,
    });
  }

  if (type === "gallery") {
    const { data: rows } = await rpcClient.rpc("get_saved_galleries", args);
    const items = (Array.isArray(rows) ? rows : []).map(
      (row: Record<string, unknown>) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        thumbnail_image_url: row.thumbnail_image_url ?? null,
        like_count: 0,
        save_count: 0,
        tags: [] as string[],
      }),
    );
    return data({
      type: "gallery" as const,
      items,
      hasMore: items.length === limit,
    });
  }

  return data({ type: null, items: [], hasMore: false }, { status: 400 });
}

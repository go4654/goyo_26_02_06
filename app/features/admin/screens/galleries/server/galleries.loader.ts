import type { Route } from "../+types/galleries";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getAdminGalleries, type AdminGalleryRow } from "../queries";

/**
 * 갤러리 목록 로더
 *
 * 관리자 권한이 있는 사용자만 접근 가능합니다.
 * 실제 DB에서 갤러리 목록을 조회합니다.
 */
export async function galleriesLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  await requireAdmin(client);

  const rows = await getAdminGalleries(client);

  return { rows };
}

export type { AdminGalleryRow };

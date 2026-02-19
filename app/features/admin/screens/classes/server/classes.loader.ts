import type { Route } from "../+types/admin-classes";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getAdminClasses, type AdminClassRow } from "../queries";

/**
 * 클래스 목록 로더
 *
 * 관리자 권한이 있는 사용자만 접근 가능합니다.
 * 실제 데이터베이스에서 클래스 목록을 조회합니다.
 */
export async function classesLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  
  // 관리자 권한 확인
  await requireAdmin(client);
  
  // 실제 DB에서 클래스 목록 조회
  const rows = await getAdminClasses(client);

  return { rows };
}

// 타입 재export (컬럼 정의에서 사용)
export type { AdminClassRow };

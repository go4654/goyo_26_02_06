import { data } from "react-router";
import type { Route } from "../screens/+types/class";

import { getUserRole } from "~/core/lib/guards.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { toggleClassLike, toggleClassSave } from "../mutation";

/**
 * 클래스 액션 타입
 */
type ClassAction = "toggleLike" | "toggleSave";

/**
 * 클래스 좋아요/저장 액션 핸들러
 *
 * 클래스 좋아요 및 저장 토글을 처리합니다.
 * RLS 정책에 따라 권한이 자동으로 검증됩니다.
 *
 * 지원하는 액션:
 * - toggleLike: 클래스 좋아요 토글
 * - toggleSave: 클래스 저장 토글
 */
export async function classAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  // 현재 사용자 정보 조회
  const { user } = await getUserRole(client);
  if (!user) {
    return data({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const action = formData.get("action") as ClassAction;
  const classId = formData.get("classId") as string;

  try {
    switch (action) {
      case "toggleLike": {
        if (!classId) {
          return data({ error: "클래스 ID가 필요합니다." }, { status: 400 });
        }

        const isLiked = await toggleClassLike(client, classId, user.id);

        return data({ success: true, isLiked }, { status: 200 });
      }

      case "toggleSave": {
        if (!classId) {
          return data({ error: "클래스 ID가 필요합니다." }, { status: 400 });
        }

        const isSaved = await toggleClassSave(client, classId, user.id);

        return data({ success: true, isSaved }, { status: 200 });
      }

      default:
        return data({ error: "지원하지 않는 액션입니다." }, { status: 400 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return data({ error: errorMessage }, { status: 500 });
  }
}

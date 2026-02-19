import type { Route } from "../+types/admin-classes";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { deleteClasses } from "../../../services/class-delete.service";

/**
 * 클래스 삭제 액션
 */
export async function classesDeleteAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method !== "DELETE") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const body = await request.json();
    const classIds = body.classIds as string[] | undefined;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return data(
        { error: "삭제할 클래스 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const results = await deleteClasses(client, classIds);

    const deletedCount = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return data(
      {
        success: true,
        deletedCount,
        failed,
      },
      { status: 200 },
    );
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "클래스 삭제 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

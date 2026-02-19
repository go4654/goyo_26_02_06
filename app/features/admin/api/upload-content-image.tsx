import type { Route } from "./+types/upload-content-image";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { uploadContentImage } from "../utils/storage-utils";

/**
 * MDX 콘텐츠 이미지 업로드 API
 */
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  if (request.method !== "POST") {
    return data({ error: "잘못된 요청 메서드입니다." }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const classId = formData.get("classId") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!classId?.trim()) {
      return data({ error: "클래스 ID가 필요합니다." }, { status: 400 });
    }

    if (!imageFile || imageFile.size === 0) {
      return data({ error: "이미지 파일이 필요합니다." }, { status: 400 });
    }

    if (!imageFile.type.startsWith("image/")) {
      return data({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
    }

    const imageId = crypto.randomUUID();
    const publicUrl = await uploadContentImage(client, classId, imageFile, imageId);

    return data({ success: true, url: publicUrl }, { status: 200 });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지 업로드 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

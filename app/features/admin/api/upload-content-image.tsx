import type { Route } from "./+types/upload-content-image";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { uploadContentImage } from "../utils/storage-utils";

/**
 * MDX 콘텐츠 이미지 업로드 API
 * - 모든 에러는 throw 없이 data({ success: false, error }) + status로 반환
 * - requireAdmin 실패 시에도 JSON 응답으로 반환하여 에러 바운더리 방지
 */
export async function action({ request }: Route.ActionArgs) {
  try {
    if (request.method !== "POST") {
      return data(
        { success: false, error: "잘못된 요청 메서드입니다." },
        { status: 405 },
      );
    }

    const [client] = makeServerClient(request);

    try {
      await requireAdmin(client);
    } catch {
      return data(
        { success: false, error: "권한이 없습니다." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const classId = formData.get("classId");
    const rawImage = formData.get("image");

    const classIdStr =
      typeof classId === "string" ? classId.trim() : "";
    if (!classIdStr) {
      return data(
        { success: false, error: "클래스 ID가 필요합니다." },
        { status: 400 },
      );
    }

    if (!rawImage || !(rawImage instanceof File)) {
      return data(
        { success: false, error: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }

    const imageFile = rawImage as File;
    if (imageFile.size === 0) {
      return data(
        { success: false, error: "이미지 파일이 비어 있습니다." },
        { status: 400 },
      );
    }

    if (!imageFile.type.startsWith("image/")) {
      return data(
        { success: false, error: "이미지 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    const imageId = crypto.randomUUID();
    const publicUrl = await uploadContentImage(
      client,
      classIdStr,
      imageFile,
      imageId,
    );
    return data({ success: true, url: publicUrl }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "이미지 업로드 중 알 수 없는 오류가 발생했습니다.";
    return data({ success: false, error: message }, { status: 500 });
  }
}

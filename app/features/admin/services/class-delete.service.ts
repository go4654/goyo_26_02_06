/**
 * 클래스 삭제 서비스
 * 클래스 하드 삭제와 관련된 비즈니스 로직을 처리합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

import { deleteClassStorageFolder } from "../utils/storage-utils";

/**
 * 삭제 결과 타입
 */
export interface DeleteResult {
  classId: string;
  success: boolean;
  error?: string;
}

/**
 * 클래스 존재 여부 확인
 */
async function checkClassExists(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("is_deleted", false)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * 단일 클래스를 삭제합니다.
 * Storage 파일 삭제 → DB 삭제 순서로 진행됩니다.
 *
 * 중요: Storage 삭제가 실패하면 DB 삭제를 진행하지 않습니다.
 * Storage와 DB의 정합성을 보장하기 위함입니다.
 *
 * @param client - Supabase 클라이언트
 * @param classId - 삭제할 클래스 ID
 * @returns 삭제 결과
 */
export async function deleteClass(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<DeleteResult> {
  // 1. 클래스 존재 여부 확인
  const exists = await checkClassExists(client, classId);
  if (!exists) {
    return {
      classId,
      success: false,
      error: "클래스를 찾을 수 없습니다.",
    };
  }

  // 2. Storage 파일 삭제 (실패 시 즉시 반환, DB 삭제 진행하지 않음)
  try {
    await deleteClassStorageFolder(client, classId);
  } catch (storageError) {
    const errorMessage =
      storageError instanceof Error
        ? storageError.message
        : "Storage deletion failed. Database deletion aborted.";
    return {
      classId,
      success: false,
      error: errorMessage,
    };
  }

  // 3. DB에서 클래스 삭제 (CASCADE로 하위 테이블 자동 삭제)
  // Storage 삭제가 성공한 경우에만 실행됨
  const { error: deleteError } = await client
    .from("classes")
    .delete()
    .eq("id", classId);

  if (deleteError) {
    return {
      classId,
      success: false,
      error: `DB 삭제 실패: ${deleteError.message}`,
    };
  }

  return {
    classId,
    success: true,
  };
}

/**
 * 여러 클래스를 삭제합니다.
 * 각 클래스는 독립적으로 처리되며, 하나가 실패해도 다른 클래스 삭제는 계속 진행됩니다.
 *
 * @param client - Supabase 클라이언트
 * @param classIds - 삭제할 클래스 ID 배열
 * @returns 삭제 결과 배열
 */
export async function deleteClasses(
  client: SupabaseClient<Database>,
  classIds: string[],
): Promise<DeleteResult[]> {
  const results: DeleteResult[] = [];

  for (const classId of classIds) {
    const result = await deleteClass(client, classId);
    results.push(result);
  }

  return results;
}

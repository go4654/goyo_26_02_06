/**
 * 인증 데이터베이스 쿼리
 *
 * 이 파일은 사용자 인증과 관련된 서버 사이드 데이터베이스 쿼리를 포함합니다.
 * 사용자 존재 여부 확인 및 기타 인증 관련 작업을 위한 유틸리티 함수를 제공합니다.
 */
import { count, eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import db from "~/core/db/drizzle-client.server";

/**
 * 주어진 이메일을 가진 사용자가 데이터베이스에 이미 존재하는지 확인
 *
 * 이 함수는 중복 계정을 방지하기 위해 등록 중에 사용됩니다.
 *
 * @param email - 확인할 이메일 주소
 * @returns 사용자가 존재하는지 여부를 나타내는 불리언 (true 또는 false)
 */
export async function doesUserExist(email: string) {
  const totalUsers = await db
    .select({
      count: count(),
    })
    .from(authUsers)
    .where(eq(authUsers.email, email));

  return totalUsers[0].count > 0;
}

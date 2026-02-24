/**
 * 프로필 수정 API 엔드포인트
 *
 * 이 파일은 사용자의 프로필 정보를 업데이트하기 위한 API 엔드포인트를 구현합니다.
 * 폼 데이터 처리, 유효성 검사, 아바타 이미지 업로드 및 데이터베이스 업데이트를 관리합니다.
 *
 * 주요 기능:
 * - Zod 스키마를 이용한 폼 데이터 유효성 검사
 * - 아바타 이미지를 위한 파일 업로드 처리
 * - Supabase Storage를 활용한 스토리지 관리
 * - Auth 및 Profiles 테이블의 프로필 데이터 업데이트
 * - 포괄적인 예외 및 에러 처리
 */
import type { Route } from "./+types/edit-profile";

import { data } from "react-router";
import { z } from "zod";

import { requireNotBlocked } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfile } from "../queries";

/**
 * 프로필 업데이트 폼 데이터 유효성 검사 스키마
 *
 * 이 스키마는 필수 필드와 유효성 검사 규칙을 정의합니다:
 * - name: 필수 항목, 최소 1자 이상이어야 함
 * - avatar: Blob 인스턴스여야 함 (아바타 이미지 업로드용)
 * - marketingConsent: 마케팅 정보 수신 동의 여부를 나타내는 불리언(Boolean) 플래그
 *
 * 이 스키마는 폼 제출 데이터를 추가로 처리하기 전,
 * Zod의 safeParse 메서드를 사용하여 유효성을 검증하는 데 사용됩니다.
 */
const schema = z.object({
  name: z.string().min(1),
  avatar: z.instanceof(Blob),
  marketingConsent: z.coerce.boolean(),
});

/**
 * 프로필 업데이트 요청 처리를 위한 액션 핸들러
 *
 * 이 함수는 프로필 업데이트의 전체 흐름을 관리합니다:
 * 1. 요청 메서드 및 인증 상태 유효성 검사
 * 2. Zod 스키마를 사용하여 폼 데이터 처리 및 검증
 * 3. Supabase Storage로의 아바타 이미지 업로드 처리
 * 4. Auth 및 Profiles 테이블의 프로필 정보 업데이트
 * 5. 상황에 맞는 성공 또는 에러 응답 반환
 *
 * 보안 고려 사항:
 * - 처리 전 인증 상태 확인(Authentication Status)
 * - 아바타 업로드 시 파일 크기 및 유형 검증
 * - 데이터베이스 작업 시 인증된 세션의 사용자 ID 사용
 * - 적절한 상태 코드와 함께 예외 상황 처리(Error Handling)
 *
 * @param request - 폼 데이터를 포함한 들어오는 HTTP 요청
 * @returns 적절한 상세 정보가 포함된 성공 또는 에러 응답
 */
export async function action({ request }: Route.ActionArgs) {
  // 서버 측 Supabase 클라이언트 생성 (사용자 세션 포함)
  const [client] = makeServerClient(request);

  // 인증된 사용자 정보 조회
  const {
    data: { user },
  } = await client.auth.getUser();

  // 요청 메서드 유효성 검사 (only allow POST)
  if (request.method !== "POST") {
    return data(null, { status: 405 }); // Method Not Allowed
  }

  // 사용자 인증 확인
  if (!user) {
    return data(null, { status: 401 }); // Unauthorized
  }

  // 보안: 차단된 사용자는 프로필 수정 불가
  await requireNotBlocked(client);

  // 폼 데이터 추출 및 유효성 검사
  const formData = await request.formData();
  const {
    success,
    data: validData,
    error,
  } = schema.safeParse(Object.fromEntries(formData));

  // 유효성 검사 오류 반환
  if (!success) {
    return data({ fieldErrors: error.flatten().fieldErrors }, { status: 400 });
  }

  // 현재 사용자 프로필 조회 (기존 아바타 URL 확인)
  const profile = await getUserProfile(client, { userId: user.id });
  let avatarUrl = profile?.avatar_url || null;
  const fileExt = "webp";
  const filePath = `${user.id}/avatar.${fileExt}`;

  // 유효한 파일이 제공된 경우 아바타 이미지 업로드 처리
  if (
    validData.avatar &&
    validData.avatar.size > 0 &&
    validData.avatar.size < 3 * 1024 * 1024 && // 3MB 제한
    validData.avatar.type.startsWith("image/") // 이미지 파일 확인
  ) {
    // Supabase Storage에 아바타 이미지 업로드
    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(filePath, validData.avatar, {
        upsert: true, // 기존 아바타 이미지 대체
      });

    // 업로드 오류 처리
    if (uploadError) {
      return data({ error: uploadError.message }, { status: 400 });
    }

    // 업로드된 아바타 이미지의 공개 URL 조회
    const {
      data: { publicUrl },
    } = await client.storage.from("avatars").getPublicUrl(filePath);
    // 캐시 무효화를 위해 버전 쿼리 파라미터 추가
    const version = Date.now();
    avatarUrl = `${publicUrl}?v=${version}`;
  }

  // Profiles 테이블에 프로필 정보 업데이트
  // 보안: 일반 유저는 민감 필드(role, gallery_access, is_blocked, blocked_reason)를 수정할 수 없음
  // RLS 정책과 함께 이중 방어선으로 작동
  const { error: updateProfileError } = await client
    .from("profiles")
    .update({
      name: validData.name,
      marketing_consent: validData.marketingConsent,
      avatar_url: avatarUrl,
      // 명시적으로 제외: role, gallery_access, is_blocked, blocked_reason
    })
    .eq("profile_id", user.id);

  // Auth 테이블에 사용자 메타데이터 업데이트
  const { error: updateError } = await client.auth.updateUser({
    data: {
      name: validData.name,
      display_name: validData.name,
      marketing_consent: validData.marketingConsent,
      avatar_url: avatarUrl,
    },
  });

  // Auth 업데이트 오류 처리
  if (updateError) {
    return data({ error: updateError.message }, { status: 400 });
  }

  // 프로필 업데이트 오류 처리
  if (updateProfileError) {
    return data({ error: updateProfileError.message }, { status: 400 });
  }

  // 성공 응답 반환
  return {
    success: true,
  };
}

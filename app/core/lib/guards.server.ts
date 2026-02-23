/**
 * 인증 및 요청 가드 모듈
 * * 이 모듈은 인증 및 HTTP 메서드 요구 사항을 강제하여 라우트와 API 엔드포인트를
 * 보호하는 유틸리티 함수를 제공합니다. 이 가드들은 React Router의 loader와 action에서
 * 적절한 액세스 제어 및 요청 유효성 검사를 보장하기 위해 사용되도록 설계되었습니다.
 * * 모듈 포함 내용:
 * - 사용자의 로그인 여부를 확인하는 인증 가드
 * - 사용자 인증 상태 및 관리자 권한을 안전하게 조회하는 함수
 * - 관리자 권한을 요구하는 가드
 * - 요청이 올바른 HTTP 메서드를 사용하는지 확인하는 메서드 가드
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

import { data, redirect } from "react-router";

/**
 * 라우트나 action에 대해 사용자 인증 요구
 * * 이 함수는 Supabase 클라이언트를 조회하여 현재 사용자가 인증되었는지 확인합니다.
 * 사용자를 찾을 수 없는 경우 401 Unauthorized 응답을 throw하며, 이는
 * React Router의 에러 경계(error boundary) 시스템에서 처리됩니다.
 * * @example
 * // loader 또는 action 함수에서 사용 예시
 * export async function loader({ request }: LoaderArgs) {
 * const [client] = makeServerClient(request);
 * await requireAuthentication(client);
 * * // 인증된 로직 계속 진행...
 * return json({ ... });
 * }
 * * @param client - 인증 확인에 사용할 Supabase 클라이언트 인스턴스
 * @throws {Response} 사용자가 인증되지 않은 경우 401 Unauthorized 발생
 */
export async function requireAuthentication(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw data(null, { status: 401 });
  }
}

/**
 * 라우트나 action에 대해 관리자 권한 요구
 *
 * 이 함수는 Supabase 클라이언트를 조회하여 현재 사용자가 관리자인지 확인합니다.
 * 사용자가 인증되지 않았거나 관리자가 아닌 경우 404 Not Found를 throw하여
 * 관리자 페이지 존재 여부를 노출하지 않습니다.
 *
 * 보안 강화: user_metadata 대신 데이터베이스의 profiles 테이블에서 role을 조회하여
 * 클라이언트가 수정할 수 없는 서버 사이드 검증을 수행합니다.
 *
 * 성능 최적화: user 객체를 반환하여 중복 getUser() 호출을 방지합니다.
 *
 * @example
 * // loader 또는 action 함수에서 사용 예시
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   const user = await requireAdmin(client);
 *
 *   // 관리자 전용 로직 계속 진행...
 *   return json({ user, ... });
 * }
 *
 * @param client - 인증 확인에 사용할 Supabase 클라이언트 인스턴스
 * @returns 인증된 관리자 사용자 객체
 * @throws {Response} 사용자가 인증되지 않았거나 관리자가 아닌 경우 404 Not Found 발생
 */
export async function requireAdmin(client: SupabaseClient): Promise<User> {
  const {
    data: { user },
  } = await client.auth.getUser();

  // 로그인하지 않았거나 관리자가 아니면 404로 처리 (관리자 페이지 존재 여부 노출 방지)
  if (!user) {
    throw data(null, { status: 404 });
  }

  // 데이터베이스에서 사용자 프로필의 role 조회 (user_metadata보다 안전)
  // 자신의 프로필은 항상 조회 가능해야 하므로 RLS 정책이 허용해야 함
  const { data: profile, error } = await client
    .from("profiles")
    .select("role")
    .eq("profile_id", user.id)
    .single();

  if (error || !profile) {
    // 프로필 조회 실패 또는 없음 → 404
    throw data(null, { status: 404 });
  }

  // 관리자 권한 체크 (데이터베이스의 role이 'admin'인지 확인)
  const isAdmin = profile.role === "admin";

  if (!isAdmin) {
    throw data(null, { status: 404 });
  }

  // user 객체 반환하여 중복 getUser() 호출 방지
  return user;
}

/**
 * 사용자 인증 상태 및 관리자 권한 조회
 *
 * 이 함수는 현재 사용자의 인증 상태와 관리자 권한을 안전하게 조회합니다.
 * 에러를 throw하지 않고 안전하게 처리하여, navigation bar와 같은 UI 컴포넌트에서
 * 사용할 수 있도록 설계되었습니다.
 *
 * 보안 강화: user_metadata 대신 데이터베이스의 profiles 테이블에서 role을 조회하여
 * 클라이언트가 수정할 수 없는 서버 사이드 검증을 수행합니다.
 *
 * 에러 처리: 프로필 조회 실패 시 일반 사용자로 처리하여 UI가 깨지지 않도록 합니다.
 *
 * @example
 * // loader 함수에서 사용 예시
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   const userPromise = getUserRole(client);
 *   return { userPromise };
 * }
 *
 * @param client - 인증 확인에 사용할 Supabase 클라이언트 인스턴스
 * @returns 사용자 객체와 관리자 여부를 포함한 Promise
 */
export async function getUserRole(
  client: SupabaseClient,
): Promise<{ user: User | null; isAdmin: boolean }> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  // 데이터베이스에서 사용자 프로필의 role 조회 (user_metadata보다 안전)
  // 자신의 프로필은 항상 조회 가능해야 하므로 RLS 정책이 허용해야 함
  const { data: profile, error } = await client
    .from("profiles")
    .select("role")
    .eq("profile_id", user.id)
    .single();

  // 에러가 발생하거나 프로필이 없는 경우 일반 사용자로 처리
  // 에러를 throw하지 않고 안전하게 처리하여 UI가 깨지지 않도록 함
  const isAdmin = !error && profile?.role === "admin";

  return { user, isAdmin };
}

/**
 * 차단된 유저 체크 및 차단 페이지로 리다이렉트
 *
 * 이 함수는 현재 사용자가 차단되었는지 확인합니다.
 * 차단된 유저인 경우 차단 안내 페이지로 리다이렉트합니다.
 *
 * 보안: 서버 사이드에서 데이터베이스의 profiles 테이블에서 is_blocked를 조회하여
 * 클라이언트가 수정할 수 없는 검증을 수행합니다.
 *
 * @example
 * // action 함수에서 사용 예시
 * export async function action({ request }: ActionArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireNotBlocked(client);
 *   // 차단되지 않은 유저만 이 지점에 도달
 *   return { success: true };
 * }
 *
 * @param client - 인증 확인에 사용할 Supabase 클라이언트 인스턴스
 * @throws {Response} 사용자가 차단된 경우 차단 안내 페이지로 리다이렉트
 */
export async function requireNotBlocked(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw data(null, { status: 401 });
  }

  // 데이터베이스에서 사용자 프로필의 is_blocked 조회
  const { data: profile, error } = await client
    .from("profiles")
    .select("is_blocked, blocked_reason")
    .eq("profile_id", user.id)
    .single();

  // 프로필 조회 실패 시 차단되지 않은 것으로 간주 (에러 처리)
  if (error || !profile) {
    return;
  }

  // 차단된 유저인 경우 차단 안내 페이지로 리다이렉트
  if (profile.is_blocked) {
    throw redirect(`/blocked?reason=${encodeURIComponent(profile.blocked_reason || "")}`);
  }
}

/**
 * 사용자가 차단되었는지 확인 (리다이렉트 없이)
 *
 * 이 함수는 현재 사용자가 차단되었는지 확인하지만 리다이렉트하지 않습니다.
 * 차단 상태를 확인만 하고 싶을 때 사용합니다.
 *
 * @param client - 인증 확인에 사용할 Supabase 클라이언트 인스턴스
 * @returns 차단 여부와 차단 사유를 포함한 객체
 */
export async function checkUserBlocked(
  client: SupabaseClient,
): Promise<{ isBlocked: boolean; blockedReason: string | null }> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { isBlocked: false, blockedReason: null };
  }

  // 데이터베이스에서 사용자 프로필의 is_blocked 조회
  const { data: profile, error } = await client
    .from("profiles")
    .select("is_blocked, blocked_reason")
    .eq("profile_id", user.id)
    .single();

  if (error || !profile) {
    return { isBlocked: false, blockedReason: null };
  }

  return {
    isBlocked: profile.is_blocked,
    blockedReason: profile.blocked_reason,
  };
}

/**
 * 로그인(또는 세션 확정) 시 profiles.last_active_at 갱신
 * 세션 클라이언트로 자신의 프로필만 업데이트하며, 실패 시 로그인을 막지 않음
 */
export async function touchLastActiveAt(
  client: SupabaseClient,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  await client
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("profile_id", user.id);
}

/**
 * 라우트 action에 대해 특정 HTTP 메서드 요구
 * * 이 함수는 들어오는 요청이 지정된 HTTP 메서드를 사용하는지 확인하는 미들웨어를 반환합니다.
 * 일치하지 않는 경우 405 Method Not Allowed 응답을 throw합니다.
 * 이는 엔드포인트가 의도한 HTTP 메서드만 수락하도록 보장하는 데 유용합니다.
 * * @example
 * // action 함수에서 사용 예시
 * export async function action({ request }: ActionArgs) {
 * requireMethod('POST')(request);
 * * // POST 전용 로직 계속 진행...
 * return json({ ... });
 * }
 * * @param method - 요구되는 HTTP 메서드 (예: 'GET', 'POST', 'PUT', 'DELETE')
 * @returns 요청 메서드를 검증하는 함수
 * @throws {Response} 요청이 잘못된 메서드를 사용하는 경우 405 Method Not Allowed 발생
 */
export function requireMethod(method: string) {
  return (request: Request) => {
    if (request.method !== method) {
      throw data(null, { status: 405 });
    }
  };
}

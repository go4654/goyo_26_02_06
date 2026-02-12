/**
 * 클래스 데이터베이스 쿼리 함수
 *
 * 이 파일은 classes 테이블에서 데이터를 조회하는 함수들을 제공합니다.
 * 페이지네이션, 필터링, 정렬 등의 기능을 포함합니다.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 클래스 목록 조회 파라미터
 */
export interface GetClassesParams {
  /** 카테고리 필터 (선택사항) */
  category?: string | null;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지당 항목 수 */
  pageSize?: number;
  /** 검색어 (선택사항) */
  search?: string | null;
}

/**
 * 클래스 목록 조회 결과
 */
export interface GetClassesResult {
  /** 클래스 목록 */
  classes: ClassListItem[];
  /** 전체 항목 수 */
  totalCount: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 현재 페이지 */
  currentPage: number;
  /** 페이지당 항목 수 */
  pageSize: number;
}

/**
 * 클래스 목록 아이템 타입
 * UI에서 사용하는 최소한의 필드만 포함
 */
export interface ClassListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  slug: string;
  thumbnail_image_url: string | null;
  view_count: number;
  like_count: number;
  save_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
}

/**
 * 클래스 목록 조회
 *
 * 공개된 클래스만 조회하며, RLS 정책에 따라 접근 권한이 자동으로 적용됩니다.
 * 페이지네이션, 카테고리 필터링, 검색 기능을 지원합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param params - 조회 파라미터
 * @returns 클래스 목록 및 페이지네이션 정보
 */
export async function getClasses(
  client: SupabaseClient,
  params: GetClassesParams = {},
): Promise<GetClassesResult> {
  const { category = null, page = 1, pageSize = 12, search = null } = params;

  // 기본 쿼리 빌더 생성
  let query = client
    .from("classes")
    .select(
      "id, title, description, category, slug, thumbnail_image_url, view_count, like_count, save_count, comment_count, published_at, created_at",
      {
        count: "exact",
      },
    )
    .eq("is_deleted", false)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // 카테고리 필터 적용
  if (category) {
    query = query.eq("category", category);
  }

  // 검색어 필터 적용 (제목 또는 설명에서 검색)
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 페이지네이션 적용
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // 쿼리 실행
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
  }

  // 전체 페이지 수 계산
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    classes: (data as unknown as ClassListItem[]) ?? [],
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * 클래스 상세 정보 타입
 */
export interface ClassDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  slug: string;
  thumbnail_image_url: string | null;
  cover_image_urls: string[];
  content_mdx: string;
  view_count: number;
  like_count: number;
  save_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 이전/다음 클래스 정보 타입
 */
export interface ClassNavigation {
  prev: { id: string; slug: string; title: string } | null;
  next: { id: string; slug: string; title: string } | null;
}

/**
 * 클래스 상세 조회
 *
 * slug를 기반으로 클래스 상세 정보를 조회합니다.
 * 공개된 클래스만 조회하며, RLS 정책에 따라 접근 권한이 자동으로 적용됩니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param slug - 조회할 클래스의 slug
 * @returns 클래스 상세 정보
 * @throws 클래스를 찾을 수 없는 경우 404 에러
 */
export async function getClassBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<ClassDetail> {
  const { data, error } = await client
    .from("classes")
    .select(
      "id, title, description, category, slug, thumbnail_image_url, cover_image_urls, content_mdx, view_count, like_count, save_count, comment_count, published_at, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("is_deleted", false)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    throw new Response("클래스를 찾을 수 없습니다.", { status: 404 });
  }

  return data as unknown as ClassDetail;
}

/**
 * 이전/다음 클래스 조회
 *
 * 현재 클래스의 카테고리 내에서 이전/다음 클래스를 조회합니다.
 * published_at 기준으로 정렬하여 이전/다음 항목을 찾습니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param currentSlug - 현재 클래스의 slug
 * @param category - 현재 클래스의 카테고리
 * @returns 이전/다음 클래스 정보
 */
export async function getClassNavigation(
  client: SupabaseClient,
  currentSlug: string,
  category: string,
): Promise<ClassNavigation> {
  // 현재 클래스 정보 조회
  const currentClass = await getClassBySlug(client, currentSlug);

  // 이전 클래스 조회 (published_at이 현재보다 작은 것 중 가장 큰 것)
  const { data: prevData } = await client
    .from("classes")
    .select("id, slug, title")
    .eq("category", category)
    .eq("is_deleted", false)
    .eq("is_published", true)
    .lt("published_at", currentClass.published_at || currentClass.created_at)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 다음 클래스 조회 (published_at이 현재보다 큰 것 중 가장 작은 것)
  const { data: nextData } = await client
    .from("classes")
    .select("id, slug, title")
    .eq("category", category)
    .eq("is_deleted", false)
    .eq("is_published", true)
    .gt("published_at", currentClass.published_at || currentClass.created_at)
    .order("published_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return {
    prev: prevData
      ? {
          id: prevData.id as string,
          slug: prevData.slug as string,
          title: prevData.title as string,
        }
      : null,
    next: nextData
      ? {
          id: nextData.id as string,
          slug: nextData.slug as string,
          title: nextData.title as string,
        }
      : null,
  };
}

/**
 * 클래스 조회수 증가
 *
 * 클래스 상세 페이지 조회 시 조회 이벤트를 기록합니다.
 * 트리거에 의해 자동으로 view_count가 증가합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 클래스 ID
 * @param userId - 사용자 ID (로그인한 경우, null이면 anon)
 */
export async function incrementClassView(
  client: SupabaseClient,
  classId: string,
  userId: string | null,
): Promise<void> {
  await client.from("class_view_events").insert({
    class_id: classId,
    user_id: userId,
  });
}

/**
 * 프로필 정보를 포함한 댓글 데이터
 */
export interface CommentWithProfile {
  id: string;
  class_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profile: {
    profile_id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  is_liked?: boolean;
}

/**
 * 클래스 댓글 목록 조회
 *
 * 특정 클래스의 모든 댓글을 조회합니다.
 * 프로필 정보와 좋아요 수를 함께 조회합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 클래스 ID
 * @param userId - 현재 사용자 ID (좋아요 여부 확인용, 선택)
 * @returns 댓글 목록 (프로필 정보 포함)
 */
export async function getClassComments(
  client: SupabaseClient,
  classId: string,
  userId?: string | null,
): Promise<CommentWithProfile[]> {
  // 댓글 조회 (최신순 정렬)
  const { data: commentsData, error: commentsError } = await client
    .from("class_comments")
    .select("id, class_id, user_id, parent_id, content, created_at, updated_at")
    .eq("class_id", classId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw new Error(`댓글 조회 실패: ${commentsError.message}`);
  }

  if (!commentsData || commentsData.length === 0) {
    return [];
  }

  // 고유한 사용자 ID 목록 추출
  const userIds = [
    ...new Set(commentsData.map((comment) => comment.user_id as string)),
  ];

  // 프로필 정보 일괄 조회
  const { data: profilesData } = await client
    .from("profiles")
    .select("profile_id, name, avatar_url")
    .in("profile_id", userIds);

  // 프로필 맵 생성 (빠른 조회를 위해)
  const profileMap = new Map(
    (profilesData || []).map((profile) => [
      profile.profile_id as string,
      {
        profile_id: profile.profile_id as string,
        name: profile.name as string,
        avatar_url: profile.avatar_url as string | null,
      },
    ]),
  );

  // 댓글 ID 목록 추출
  const commentIds = commentsData.map((comment) => comment.id as string);

  // 댓글 좋아요 수 조회
  const { data: likesData } = await client
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds);

  // 댓글별 좋아요 수 맵 생성
  const likesCountMap = new Map<string, number>();
  (likesData || []).forEach((like) => {
    const commentId = like.comment_id as string;
    likesCountMap.set(commentId, (likesCountMap.get(commentId) || 0) + 1);
  });

  // 현재 사용자가 좋아요를 누른 댓글 목록 조회
  const userLikes = userId
    ? await getUserCommentLikes(client, commentIds, userId)
    : new Set<string>();

  // 데이터 변환 및 타입 캐스팅
  return commentsData.map((item) => ({
    id: item.id as string,
    class_id: item.class_id as string,
    user_id: item.user_id as string,
    parent_id: (item.parent_id as string | null) || null,
    content: item.content as string,
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    profile: profileMap.get(item.user_id as string) || null,
    likes_count: likesCountMap.get(item.id as string) || 0,
    is_liked: userLikes.has(item.id as string),
  })) as CommentWithProfile[];
}


/**
 * 사용자가 좋아요를 누른 댓글 목록 조회
 *
 * 특정 클래스의 댓글 중 사용자가 좋아요를 누른 댓글 ID 목록을 반환합니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param commentIds - 댓글 ID 목록
 * @param userId - 사용자 ID
 * @returns 좋아요를 누른 댓글 ID 목록
 */
export async function getUserCommentLikes(
  client: SupabaseClient,
  commentIds: string[],
  userId: string | null,
): Promise<Set<string>> {
  if (!userId || commentIds.length === 0) {
    return new Set();
  }

  const { data } = await client
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds)
    .eq("user_id", userId);

  return new Set((data || []).map((like) => like.comment_id as string));
}

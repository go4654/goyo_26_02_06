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
  tags: string[];
}

/**
 * 클래스 목록 조회 (RPC 함수 사용)
 *
 * 공개된 클래스만 조회하며, RLS 정책에 따라 접근 권한이 자동으로 적용됩니다.
 * 페이지네이션, 카테고리 필터링, 검색 기능을 지원합니다.
 * 태그와 사용자 상태(좋아요/저장)를 함께 반환합니다.
 *
 * 성능 최적화: 단일 RPC 함수 호출로 모든 데이터 조회 (5개 쿼리 → 1개 쿼리)
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param params - 조회 파라미터
 * @param userId - 사용자 ID (좋아요/저장 상태 조회용, 선택사항)
 * @returns 클래스 목록, 페이지네이션 정보, 사용자 상태
 */
export async function getClasses(
  client: SupabaseClient,
  params: GetClassesParams = {},
  userId?: string | null,
): Promise<GetClassesResult & { likedClasses: string[]; savedClasses: string[] }> {
  const { category = null, page = 1, pageSize = 12, search = null } = params;

  // RPC 함수 호출
  const { data, error } = await client.rpc("get_classes_with_tags_and_user_status", {
    p_category: category,
    p_search: search,
    p_page: page,
    p_page_size: pageSize,
    p_user_id: userId || null,
  });

  if (error) {
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
  }

  // RPC 함수는 단일 행을 반환
  const result = data?.[0];
  if (!result) {
    return {
      classes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      pageSize,
      likedClasses: [],
      savedClasses: [],
    };
  }

  // JSON 파싱
  const classesJson = result.classes as unknown;
  const classes: ClassListItem[] = Array.isArray(classesJson)
    ? classesJson.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || null,
        category: item.category,
        slug: item.slug,
        thumbnail_image_url: item.thumbnail_image_url || null,
        view_count: item.view_count,
        like_count: item.like_count,
        save_count: item.save_count,
        comment_count: item.comment_count,
        published_at: item.published_at || null,
        created_at: item.created_at,
        tags: Array.isArray(item.tags) ? item.tags : [],
      }))
    : [];

  const totalCount = Number(result.total_count) || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const likedClasses = Array.isArray(result.liked_class_ids)
    ? result.liked_class_ids.map((id: string) => String(id))
    : [];
  const savedClasses = Array.isArray(result.saved_class_ids)
    ? result.saved_class_ids.map((id: string) => String(id))
    : [];

  return {
    classes,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    likedClasses,
    savedClasses,
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
 * profile은 public_profiles 뷰 기준 (profile_id, name, avatar_url, role)
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
    role?: string;
  } | null;
  likes_count: number;
  is_liked?: boolean;
}

/**
 * 클래스 댓글 목록 조회 (최적화)
 *
 * 특정 클래스의 모든 댓글을 조회합니다.
 * 프로필 정보와 좋아요 수를 함께 조회합니다.
 *
 * 최적화:
 * - 댓글, 프로필, 좋아요 수, 사용자 좋아요 상태를 병렬로 조회
 * - 프로필은 일괄 조회 후 맵으로 매핑하여 효율성 유지
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

  // 댓글 ID 목록 추출
  const commentIds = commentsData.map((comment) => comment.id as string);

  // 프로필(공개용 뷰), 좋아요 수, 사용자 좋아요 상태를 병렬로 조회
  const [profilesResult, likesDataResult, userLikesResult] =
    await Promise.all([
      // 공개 프로필 정보 일괄 조회 (로그인 유저 모두 조회 가능)
      client
        .from("public_profiles")
        .select("profile_id, name, avatar_url, role")
        .in("profile_id", userIds),
      // 댓글 좋아요 수 조회
      client
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds),
      // 현재 사용자가 좋아요를 누른 댓글 목록 조회
      userId
        ? getUserCommentLikes(client, commentIds, userId)
        : Promise.resolve(new Set<string>()),
    ]);

  // 프로필 맵 생성 (public_profiles 뷰 컬럼 기준)
  const profileMap = new Map(
    (profilesResult.data || []).map((profile) => [
      profile.profile_id as string,
      {
        profile_id: profile.profile_id as string,
        name: profile.name as string,
        avatar_url: profile.avatar_url as string | null,
        role: profile.role as string | undefined,
      },
    ]),
  );

  // 댓글별 좋아요 수 맵 생성
  const likesCountMap = new Map<string, number>();
  (likesDataResult.data || []).forEach((like) => {
    const commentId = like.comment_id as string;
    likesCountMap.set(commentId, (likesCountMap.get(commentId) || 0) + 1);
  });

  const userLikes = userLikesResult;

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

/** 댓글 페이지네이션 옵션 */
export interface GetClassCommentsPageOptions {
  limit: number;
  offset: number;
  sortOrder: "latest" | "popular";
}

/** 댓글 페이지 조회 결과 */
export interface GetClassCommentsPageResult {
  comments: CommentWithProfile[];
  totalTopLevel: number;
}

/**
 * 클래스 댓글 목록 페이지 단위 조회 (최상위 댓글 기준 페이지네이션)
 *
 * RPC로 해당 페이지의 최상위 댓글 ID 목록과 전체 최상위 댓글 수를 조회한 뒤,
 * 해당 최상위 댓글과 그 대댓글만 프로필/좋아요 정보와 함께 반환합니다.
 * 정렬은 서버에서 적용되며, 100개 이상 댓글도 효율적으로 처리합니다.
 */
export async function getClassCommentsPage(
  client: SupabaseClient,
  classId: string,
  userId: string | null | undefined,
  options: GetClassCommentsPageOptions,
): Promise<GetClassCommentsPageResult> {
  const { limit, offset, sortOrder } = options;
  const rpcClient = client as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => ReturnType<typeof client.rpc>;
  };

  const { data: pageRows, error: rpcError } = await rpcClient.rpc(
    "get_class_comments_page_ids",
    {
      p_class_id: classId,
      p_sort_order: sortOrder,
      p_limit: limit,
      p_offset: offset,
    },
  );

  if (rpcError) {
    throw new Error(`댓글 페이지 조회 실패: ${rpcError.message}`);
  }

  const rows = Array.isArray(pageRows) ? pageRows : [];
  const topLevelIds = rows
    .map((r: { id?: string }) => r.id as string)
    .filter(Boolean);
  const totalTopLevel = Number(rows[0]?.total_top_level ?? 0);

  if (topLevelIds.length === 0) {
    return { comments: [], totalTopLevel };
  }

  // 해당 페이지의 최상위 댓글 + 그 대댓글만 조회
  const [topResult, repliesResult] = await Promise.all([
    client
      .from("class_comments")
      .select("id, class_id, user_id, parent_id, content, created_at, updated_at")
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .in("id", topLevelIds),
    client
      .from("class_comments")
      .select("id, class_id, user_id, parent_id, content, created_at, updated_at")
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .in("parent_id", topLevelIds),
  ]);

  const topData = topResult.data ?? [];
  const repliesData = repliesResult.data ?? [];
  const idToOrder = new Map(topLevelIds.map((id, i) => [id, i]));

  const merged = [...topData, ...repliesData].sort((a, b) => {
    const aId = a.id as string;
    const bId = b.id as string;
    const aTop = a.parent_id == null;
    const bTop = b.parent_id == null;
    if (aTop && bTop) {
      return (idToOrder.get(aId) ?? 0) - (idToOrder.get(bId) ?? 0);
    }
    if (aTop) return -1;
    if (bTop) return 1;
    return 0;
  });

  const userIds = [...new Set(merged.map((c) => c.user_id as string))];
  const commentIds = merged.map((c) => c.id as string);

  const [profilesResult, likesDataResult, userLikesResult] = await Promise.all([
    client
      .from("public_profiles")
      .select("profile_id, name, avatar_url, role")
      .in("profile_id", userIds),
    client
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds),
    userId
      ? getUserCommentLikes(client, commentIds, userId)
      : Promise.resolve(new Set<string>()),
  ]);

  const profileMap = new Map(
    (profilesResult.data || []).map((p) => [
      p.profile_id as string,
      {
        profile_id: p.profile_id as string,
        name: p.name as string,
        avatar_url: p.avatar_url as string | null,
        role: p.role as string | undefined,
      },
    ]),
  );

  const likesCountMap = new Map<string, number>();
  (likesDataResult.data || []).forEach((like) => {
    const cid = like.comment_id as string;
    likesCountMap.set(cid, (likesCountMap.get(cid) || 0) + 1);
  });

  const comments = merged.map((item) => ({
    id: item.id as string,
    class_id: item.class_id as string,
    user_id: item.user_id as string,
    parent_id: (item.parent_id as string | null) || null,
    content: item.content as string,
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    profile: profileMap.get(item.user_id as string) || null,
    likes_count: likesCountMap.get(item.id as string) || 0,
    is_liked: userLikesResult.has(item.id as string),
  })) as CommentWithProfile[];

  return { comments, totalTopLevel };
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

/**
 * 특정 클래스에 대한 사용자의 좋아요/저장 상태 확인
 *
 * 단일 클래스에 대한 사용자의 좋아요/저장 상태만 확인합니다.
 * 전체 목록을 조회하지 않아 성능과 비용이 최적화됩니다.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param classId - 확인할 클래스 ID
 * @param userId - 사용자 ID
 * @returns 좋아요/저장 상태 객체
 */
export async function getUserClassStatus(
  client: SupabaseClient,
  classId: string,
  userId: string | null,
): Promise<{ isLiked: boolean; isSaved: boolean }> {
  if (!userId) {
    return { isLiked: false, isSaved: false };
  }

  // 병렬로 좋아요/저장 상태 확인
  const [likedResult, savedResult] = await Promise.all([
    client
      .from("class_likes")
      .select("id")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("class_saves")
      .select("id")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    isLiked: !!likedResult.data,
    isSaved: !!savedResult.data,
  };
}

/**
 * 사용자가 좋아요를 누른 클래스 ID 목록 조회
 *
 * 현재 사용자가 좋아요를 누른 클래스 ID 목록을 반환합니다.
 *
 * @deprecated 이 함수는 더 이상 사용되지 않습니다.
 * getClasses() RPC 함수가 좋아요/저장 상태를 함께 반환합니다.
 * 단일 클래스 확인은 getUserClassStatus()를 사용하세요.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param userId - 사용자 ID
 * @returns 좋아요를 누른 클래스 ID 목록
 */
export async function getUserLikedClasses(
  client: SupabaseClient,
  userId: string | null,
): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  const { data } = await client
    .from("class_likes")
    .select("class_id")
    .eq("user_id", userId);

  return new Set((data || []).map((like) => like.class_id as string));
}

/**
 * 사용자가 저장한 클래스 ID 목록 조회
 *
 * 현재 사용자가 저장한 클래스 ID 목록을 반환합니다.
 *
 * @deprecated 이 함수는 더 이상 사용되지 않습니다.
 * getClasses() RPC 함수가 좋아요/저장 상태를 함께 반환합니다.
 * 단일 클래스 확인은 getUserClassStatus()를 사용하세요.
 *
 * @param client - Supabase 클라이언트 인스턴스
 * @param userId - 사용자 ID
 * @returns 저장한 클래스 ID 목록
 */
export async function getUserSavedClasses(
  client: SupabaseClient,
  userId: string | null,
): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  const { data } = await client
    .from("class_saves")
    .select("class_id")
    .eq("user_id", userId);

  return new Set((data || []).map((save) => save.class_id as string));
}

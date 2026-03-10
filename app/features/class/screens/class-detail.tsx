import type { Route } from "./+types/class-detail";

import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Heart, MoveLeft, MoveRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";

import { Separator } from "~/core/components/ui/separator";
import { cn } from "~/core/lib/utils";

import ClassComment from "../comments/class-comment";
import { classCommentAction } from "../server/class-comment.action";
import { classDetailLoader } from "../server/class-detail.loader";
import MDXRenderer from "./class-markdown-rander";

/**
 * 날짜 포맷팅 함수
 * YYYY.MM.DD 형식으로 변환
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export const meta: Route.MetaFunction = ({ data }) => {
  const fallbackTitle = "클래스 상세 | 고요 GOYO";
  if (!data || !data.class) {
    return [{ title: fallbackTitle }];
  }

  const classData = data.class;
  const title = `${classData.title} – 클래스 학습 콘텐츠 | 고요 GOYO`;
  const description =
    data.previewText ??
    classData.description ??
    "디자인, 퍼블리싱, 개발 실무에 도움이 되는 클래스 학습 콘텐츠입니다.";
  const canonical = `https://goyos.kr/class/${encodeURIComponent(
    classData.slug,
  )}`;

  return [
    { title },
    { name: "description", content: description },
    { rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonical },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
};

export const loader = classDetailLoader;
export const action = classCommentAction;

export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const {
    class: classData,
    code,
    navigation,
    hasMdxError,
    currentUserId,
    isAdmin,
    isLiked: initialLiked,
    isSaved: initialSaved,
    isAuthenticated,
    previewText,
  } = loaderData;

  const likeFetcher = useFetcher();
  const saveFetcher = useFetcher();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(classData.like_count);
  const [saveCount, setSaveCount] = useState(classData.save_count);
  const prevLikeState = useRef(likeFetcher.state);
  const prevSaveState = useRef(saveFetcher.state);

  // 초기 상태 동기화
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    setLikeCount(classData.like_count);
  }, [classData.like_count]);

  useEffect(() => {
    setSaveCount(classData.save_count);
  }, [classData.save_count]);

  // 좋아요 액션 결과 처리
  useEffect(() => {
    const prev = prevLikeState.current;
    prevLikeState.current = likeFetcher.state;

    const justFinished =
      (prev === "submitting" || prev === "loading") &&
      likeFetcher.state === "idle";
    if (!justFinished) return;

    const data = likeFetcher.data;
    if (data && (data as { success?: boolean }).success) {
      const result = data as { isLiked?: boolean; likeCount?: number };
      if (typeof result.isLiked === "boolean") {
        setIsLiked(result.isLiked);
      }
      if (typeof result.likeCount === "number") {
        setLikeCount(result.likeCount);
      }
    }
  }, [likeFetcher.state, likeFetcher.data]);

  // 저장 액션 결과 처리
  useEffect(() => {
    const prev = prevSaveState.current;
    prevSaveState.current = saveFetcher.state;

    const justFinished =
      (prev === "submitting" || prev === "loading") &&
      saveFetcher.state === "idle";
    if (!justFinished) return;

    const data = saveFetcher.data;
    if (data && (data as { success?: boolean }).success) {
      const result = data as { isSaved?: boolean; saveCount?: number };
      if (typeof result.isSaved === "boolean") {
        setIsSaved(result.isSaved);
      }
      if (typeof result.saveCount === "number") {
        setSaveCount(result.saveCount);
      }
    }
  }, [saveFetcher.state, saveFetcher.data]);

  const handleLikeClick = () => {
    if (!currentUserId) {
      navigate(`/login?redirectTo=/class/${classData.slug}`);
      return;
    }

    // 낙관적 업데이트: 즉시 UI 반영 (UX 향상)
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    // 서버 액션으로 좋아요 토글 (서버 응답으로 실제 값으로 교체됨)
    likeFetcher.submit(
      {
        action: "toggleClassLike",
        classId: classData.id,
      },
      { method: "post" },
    );
  };

  const handleSaveClick = () => {
    if (!currentUserId) {
      navigate(`/login?redirectTo=/class/${classData.slug}`);
      return;
    }

    // 낙관적 업데이트: 즉시 UI 반영 (UX 향상)
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setSaveCount((prev) => (newSaved ? prev + 1 : prev - 1));

    // 서버 액션으로 저장 토글 (서버 응답으로 실제 값으로 교체됨)
    saveFetcher.submit(
      {
        action: "toggleClassSave",
        classId: classData.id,
      },
      { method: "post" },
    );
  };

  // 날짜 포맷팅 (published_at 우선, 없으면 created_at 사용)
  const displayDate = formatDate(
    classData.published_at || classData.created_at,
  );

  return (
    <div className="mx-auto w-full max-w-[800px] px-5 py-6 xl:py-24">
      {/* 타이틀 영역 */}
      <div className="border-b pb-6">
        <div className="text-small xl:text-small-title text-text-3 flex items-center gap-2">
          <span>{displayDate}</span>
          {currentUserId && (
            <>
              <span className="text-text-3/50">•</span>
              <motion.button
                type="button"
                onClick={handleLikeClick}
                animate={
                  isLiked
                    ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -10, 3, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-text-3 hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
              >
                <Heart
                  className={cn(
                    "size-4 xl:size-5",
                    isLiked ? "fill-red-500 text-red-500" : "",
                  )}
                />
                <span>{likeCount}</span>
              </motion.button>

              <span className="text-text-3/50">•</span>

              <motion.button
                type="button"
                onClick={handleSaveClick}
                animate={
                  isSaved
                    ? { scale: [1, 1.25, 0.95, 1], rotate: [0, 10, -3, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-text-3 hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
              >
                <Bookmark
                  className={cn(
                    "size-4 xl:size-5",
                    isSaved ? "fill-success text-success" : "",
                  )}
                />
                <span>{saveCount}</span>
              </motion.button>
            </>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-h4 xl:text-h3">{classData.title}</h1>

          {classData.description && (
            <p className="xl:text-small-title text-text-2/80 mt2 text-base xl:mt-6">
              {classData.description}
            </p>
          )}
        </div>
      </div>

      {/* 썸네일 영역 */}
      {classData.thumbnail_image_url &&
        classData.thumbnail_image_url.trim() !== "" && (
          <div className="mt-12 flex justify-center">
            <img
              src={classData.thumbnail_image_url}
              alt={classData.title}
              className="rounded-2xl object-cover"
            />
          </div>
        )}

      {/* ✅ 여기부터가 "본문 MDX 영역" + 비로그인 프리뷰 처리 */}
      <div className="mt-10">
        {hasMdxError ? (
          <p className="text-text-3 mt-24 text-sm">
            콘텐츠를 불러오는 중 오류가 발생했습니다.
          </p>
        ) : isAuthenticated ? (
          <MDXRenderer code={code} />
        ) : (
          <div className="relative">
            {/* 실제 본문 프리뷰 영역 (약 20%) */}
            <div className="max-h-[420px] overflow-hidden">
              <p className="text-text-2/90 text-base leading-relaxed whitespace-pre-line">
                {previewText ?? "로그인 후 전체 내용을 확인할 수 있습니다."}
              </p>
            </div>

            {/* 전체 프리뷰를 과감하게 가리는 투명 블러 오버레이 + 카드 */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xs dark:bg-slate-900/40">
              <div className="pointer-events-auto flex max-w-[480px] flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/10 px-6 py-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/40">
                <p className="text-text-2/80 text-base">
                  로그인 후 전체 내용을 확인할 수 있습니다.
                </p>
                <button
                  type="button"
                  className="bg-primary hover:bg-primary/90 mt-1 inline-flex cursor-pointer items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition"
                  onClick={() =>
                    navigate(`/login?redirectTo=/class/${classData.slug}`)
                  }
                >
                  로그인 <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator className="mt-26 mb-6" />

      {/* 목록으로가기, 좋아요, 북마크 버튼 */}
      <div className="flex w-full flex-col items-center justify-between">
        <div className="flex w-full items-center justify-between">
          {/* 목록으로가기 */}
          <div
            className="xl:text-small-title text-text-2 hover:text-primary flex cursor-pointer items-center gap-2 text-sm"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="size-4" />
            <span>목록으로 가기</span>
          </div>

          {/* 좋아요, 북마크 버튼 (갤러리와 동일: 활성 시 빨간 하트 / success 색상) */}
          {currentUserId && (
            <div className="text-small-title text-text-3 flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleLikeClick}
                animate={
                  isLiked
                    ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -10, 3, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-text-3 hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
              >
                <Heart
                  className={cn(
                    "size-4 xl:size-5",
                    isLiked ? "fill-red-500 text-red-500" : "",
                  )}
                />
                <span className="text-sm xl:text-base">{likeCount}</span>
              </motion.button>

              <span className="text-text-3/50">•</span>

              <motion.button
                type="button"
                onClick={handleSaveClick}
                animate={
                  isSaved
                    ? { scale: [1, 1.25, 0.95, 1], rotate: [0, 10, -3, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-text-3 hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
              >
                <Bookmark
                  className={cn(
                    "size-4 xl:size-5",
                    isSaved ? "fill-success text-success" : "",
                  )}
                />
                <span className="text-sm xl:text-base">{saveCount}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {currentUserId && (
        <ClassComment
          classId={classData.id}
          comments={loaderData.comments}
          totalTopLevelComments={loaderData.totalTopLevelComments}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

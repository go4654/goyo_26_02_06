import type { Route } from "./+types/class-detail";

import { motion } from "framer-motion";
import { Bookmark, Heart, MoveLeft, MoveRight } from "lucide-react";
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

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export const loader = classDetailLoader;
export const action = classCommentAction;

export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const {
    class: classData,
    code,
    navigation,
    currentUserId,
    isAdmin,
    isLiked: initialLiked,
    isSaved: initialSaved,
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
      <div>
        <div className="text-small xl:text-small-title text-text-3 flex items-center gap-2">
          <span>{displayDate}</span>
          <span className="text-text-3/50">•</span>
          <motion.button
            type="button"
            onClick={handleLikeClick}
            whileTap={{ scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
            whileTap={{ scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        </div>

        <div className="mt-4">
          <h1 className="text-h4 xl:text-h2">{classData.title}</h1>

          {classData.description && (
            <p className="xl:text-h6 text-text-2/80 mt-2 text-base">
              {classData.description}
            </p>
          )}
        </div>
      </div>

      {/* 썸네일 영역 */}
      {classData.thumbnail_image_url &&
        classData.thumbnail_image_url.trim() !== "" && (
          <div className="mt-12">
            <img
              src={classData.thumbnail_image_url}
              alt={classData.title}
              className="w-full rounded-2xl object-cover"
            />
          </div>
        )}

      {/* ✅ 여기부터가 새로 추가된 "본문 MDX 영역" */}
      <div>
        <MDXRenderer code={loaderData.code} />
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
          <div className="text-small-title text-text-3 flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleLikeClick}
              whileTap={{ scale: 0.5 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
              whileTap={{ scale: 0.5 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        </div>
      </div>

      <ClassComment
        classId={classData.id}
        comments={loaderData.comments}
        totalTopLevelComments={loaderData.totalTopLevelComments}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}

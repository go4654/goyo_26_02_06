import type { Route } from "./+types/class-detail";

import { Bookmark, Heart, MoveLeft, MoveRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";

import Tags from "~/core/components/tags";
import { Separator } from "~/core/components/ui/separator";

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
    // 서버 액션으로 좋아요 토글 (낙관적 업데이트 제거)
    likeFetcher.submit(
      {
        action: "toggleClassLike",
        classId: classData.id,
      },
      { method: "post" },
    );
  };

  const handleSaveClick = () => {
    // 서버 액션으로 저장 토글 (낙관적 업데이트 제거)
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
    <div className="mx-auto w-full max-w-[800px] px-5 py-24 xl:py-40">
      {/* 타이틀 영역 */}
      <div>
        <div className="text-small xl:text-small-title text-text-3 flex items-center gap-2">
          <span>{displayDate}</span>
          <span className="text-text-3/50">•</span>
          <button
            type="button"
            onClick={handleLikeClick}
            className={`flex cursor-pointer items-center gap-2 transition-colors ${
              isLiked ? "text-primary" : "text-text-3 hover:text-primary"
            }`}
          >
            <Heart className="size-4 xl:size-5" />
            <span>{likeCount}</span>
          </button>
          <span className="text-text-3/50">•</span>
          <button
            type="button"
            onClick={handleSaveClick}
            className={`flex cursor-pointer items-center gap-2 transition-colors ${
              isSaved ? "text-primary" : "text-text-3 hover:text-primary"
            }`}
          >
            <Bookmark className="size-4 xl:size-5" />
            <span>{saveCount}</span>
          </button>
        </div>

        <div className="mt-4">
          <h1 className="text-h4 xl:text-h2">{classData.title}</h1>

          {classData.description && (
            <p className="xl:text-h6 text-text-2/80 mt-2 text-base">
              {classData.description}
            </p>
          )}

          {/* TODO: tags 필드가 스키마에 추가되면 연결 */}
          {/* <div className="mt-6">
            <Tags tags={classData.tags || []} borderColor="primary" />
          </div> */}
        </div>
      </div>

      {/* 썸네일 영역 */}
      {classData.thumbnail_image_url &&
        classData.thumbnail_image_url.trim() !== "" && (
          <div className="mt-12">
            <img
              src={classData.thumbnail_image_url}
              alt={classData.title}
              className="aspect-[16/7] w-full rounded-2xl object-cover"
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

          {/* 좋아요, 북마크 버튼 */}
          <div className="text-small-title text-text-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex cursor-pointer items-center gap-2 transition-colors ${
                isLiked ? "text-primary" : "text-text-3 hover:text-primary"
              }`}
            >
              <Heart className="size-4 xl:size-5" />
              <span className="text-sm xl:text-base">{likeCount}</span>
            </button>
            <span className="text-text-3/50">•</span>
            <button
              type="button"
              onClick={handleSaveClick}
              className={`flex cursor-pointer items-center gap-2 transition-colors ${
                isSaved ? "text-primary" : "text-text-3 hover:text-primary"
              }`}
            >
              <Bookmark className="size-4 xl:size-5" />
              <span className="text-sm xl:text-base">{saveCount}</span>
            </button>
          </div>
        </div>

        {/* 이전/다음 클래스 네비게이션 */}
        {/* {(navigation.prev || navigation.next) && (
          <div className="mt-10 flex w-[180px] items-center justify-between xl:w-[220px]">
            {navigation.prev ? (
              <Link
                to={`/class/${navigation.prev.slug}`}
                className="group flex items-center gap-2"
              >
                <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
                  <MoveLeft
                    className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
                    strokeWidth={1}
                  />
                </div>
                <span className="text-small-title text-text-2 text-sm transition-all duration-300 group-hover:text-white xl:text-base">
                  PREV
                </span>
              </Link>
            ) : (
              <div className="w-[180px] xl:w-[220px]" />
            )}

            {navigation.next ? (
              <Link
                to={`/class/${navigation.next.slug}`}
                className="group flex items-center gap-2"
              >
                <span className="text-small-title text-text-2 text-sm transition-all duration-300 group-hover:text-white xl:text-base">
                  NEXT
                </span>
                <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
                  <MoveRight
                    className="text-text-2 ml-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
                    strokeWidth={1}
                  />
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        )} */}
      </div>

      <ClassComment
        classId={classData.id}
        comments={loaderData.comments}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}

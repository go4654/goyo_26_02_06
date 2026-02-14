import { MoveLeft, MoveRight } from "lucide-react";
import { Link } from "react-router";

import GalleryLikeSaveButtons from "./gallery-like-save-buttons";

/** 상세 하단 액션 바에 전달하는 데이터 (목록/이전/다음 링크, 좋아요·저장 상태) */
export interface FloatingActionBarProps {
  /** 목록으로 가기 링크 */
  listHref: string;
  /** 목록으로 이동 시 전달할 state (선택) */
  listState?: unknown;
  /** 이전 갤러리 링크 (없으면 버튼 비활성화 또는 숨김) */
  prevHref: string | null;
  /** 다음 갤러리 링크 */
  nextHref: string | null;
  /** 좋아요 수 */
  likeCount: number;
  /** 저장 수 */
  saveCount: number;
  /** 현재 유저가 좋아요 했는지 */
  isLiked: boolean;
  /** 현재 유저가 저장 했는지 */
  isSaved: boolean;
  /** 좋아요 클릭 핸들러 */
  onLikeClick: () => void;
  /** 저장 클릭 핸들러 */
  onSaveClick: () => void;
}

/**
 * 갤러리 상세 하단 액션 바
 *
 * - 목록으로 가기, 이전/다음 갤러리 링크
 * - 좋아요/저장 버튼 (Form으로 현재 라우트에 POST, intent + galleryId 전달)
 * - 좋아요 시 하트 채움(빨간색), 저장 시 success 색상 반영
 */
export default function FloatingActionBar({
  listHref,
  listState,
  prevHref,
  nextHref,
  likeCount,
  saveCount,
  isLiked,
  isSaved,
  onLikeClick,
  onSaveClick,
}: FloatingActionBarProps) {
  return (
    <div className="flex w-full flex-col items-center justify-between">
      <div className="flex w-full items-center justify-between">
        {/* 목록으로 가기 */}
        <Link
          to={listHref}
          state={listState}
          className="text-text-2 hover:text-primary xl:text-small-title flex cursor-pointer items-center gap-2 text-sm"
        >
          <MoveLeft className="size-4" />
          <span>목록으로 가기</span>
        </Link>

        {/* 좋아요, 저장 버튼 (상단과 동일 컴포넌트 재사용) */}
        <GalleryLikeSaveButtons
          likeCount={likeCount}
          saveCount={saveCount}
          isLiked={isLiked}
          isSaved={isSaved}
          onLikeClick={onLikeClick}
          onSaveClick={onSaveClick}
        />
      </div>

      {/* 이전 / 다음 갤러리 */}
      <div className="mt-10 flex w-[180px] items-center justify-between xl:w-[220px]">
        {prevHref ? (
          <Link to={prevHref} className="group flex items-center gap-2">
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
          <span className="text-text-2/50 flex items-center gap-2 text-sm">
            <span className="border-text-2/50 flex h-[30px] w-[30px] items-center justify-center rounded-full border xl:h-[35px] xl:w-[35px]">
              <MoveLeft className="size-4 xl:size-5" strokeWidth={1} />
            </span>
            PREV
          </span>
        )}

        {nextHref ? (
          <Link to={nextHref} className="group flex items-center gap-2">
            <span className="text-small-title text-text-2 text-sm transition-all duration-300 group-hover:text-white xl:text-base">
              NEXT
            </span>
            <div className="border-text-2 flex h-[30px] w-[30px] items-center justify-end rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
              <MoveRight
                className="text-text-2 mr-1 size-4 transition-all duration-300 group-hover:text-white xl:size-5"
                strokeWidth={1}
              />
            </div>
          </Link>
        ) : (
          <span className="text-text-2/50 flex items-center gap-2 text-sm">
            NEXT
            <span className="border-text-2/50 flex h-[30px] w-[30px] items-center justify-center rounded-full border xl:h-[35px] xl:w-[35px]">
              <MoveRight className="size-4 xl:size-5" strokeWidth={1} />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";

import { cn } from "~/core/lib/utils";

/** 좋아요/저장 버튼 공통 props (상단·하단 동일한 UI/동작) */
export interface GalleryLikeSaveButtonsProps {
  likeCount: number;
  saveCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLikeClick: () => void;
  onSaveClick: () => void;
  /** 버튼/텍스트 크기용 추가 클래스 (선택) */
  className?: string;
}

/**
 * 갤러리 좋아요·저장 버튼
 * 상단 타이틀 영역과 하단 플로팅 바에서 재사용
 */
export default function GalleryLikeSaveButtons({
  likeCount,
  saveCount,
  isLiked,
  isSaved,
  onLikeClick,
  onSaveClick,
  className,
}: GalleryLikeSaveButtonsProps) {
  return (
    <div
      className={cn(
        "text-small-title text-text-3 flex items-center gap-2",
        className,
      )}
    >
      <motion.button
        type="button"
        onClick={onLikeClick}
        whileTap={{ scale: 0.5 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-inherit transition-colors"
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
        onClick={onSaveClick}
        whileTap={{ scale: 0.5 }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-inherit transition-colors"
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
  );
}

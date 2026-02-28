import { motion } from "framer-motion";
import { Bookmark, Heart, Image } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Link } from "react-router";

import Tags from "~/core/components/tags";
import type { ClassLecture } from "~/features/class/constants/class-data";

interface LectureCardProps {
  lecture: ClassLecture;
  to?: string;
  initialLiked?: boolean;
  initialSaved?: boolean;
  /** 좋아요/저장 버튼 표시 여부 (프로필 저장 목록에서는 false) */
  showActions?: boolean;
}

export default function LectureCard({
  lecture,
  to,
  initialLiked = false,
  initialSaved = false,
  showActions = true,
}: LectureCardProps) {
  const linkTo = to ?? `/class/${lecture.slug}`;
  const likeFetcher = useFetcher();
  const saveFetcher = useFetcher();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const prevLikeState = useRef(likeFetcher.state);
  const prevSaveState = useRef(saveFetcher.state);

  // 초기 상태 동기화
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

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
      const result = data as { isLiked?: boolean };
      if (typeof result.isLiked === "boolean") {
        setIsLiked(result.isLiked);
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
      const result = data as { isSaved?: boolean };
      if (typeof result.isSaved === "boolean") {
        setIsSaved(result.isSaved);
      }
    }
  }, [saveFetcher.state, saveFetcher.data]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 낙관적 업데이트: 즉시 UI 반영 (UX 향상)
    setIsLiked(!isLiked);

    // 서버 액션으로 좋아요 토글 (서버 응답으로 실제 값으로 교체됨)
    likeFetcher.submit(
      {
        action: "toggleLike",
        classId: lecture.id,
      },
      { method: "post" },
    );
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 낙관적 업데이트: 즉시 UI 반영 (UX 향상)
    setIsSaved(!isSaved);

    // 서버 액션으로 저장 토글 (서버 응답으로 실제 값으로 교체됨)
    saveFetcher.submit(
      {
        action: "toggleSave",
        classId: lecture.id,
      },
      { method: "post" },
    );
  };

  return (
    <Link
      to={linkTo}
      viewTransition
      className="group space-between flex flex-col items-start transition-all duration-150 xl:gap-1"
    >
      {/* img 영역 */}
      <div className="group relative h-full max-h-[200px] min-h-[200px] w-full overflow-hidden rounded-xl bg-gray-400 xl:block xl:max-h-[250px] xl:min-h-[250px] xl:rounded-[20px]">
        {lecture.imageUrl ? (
          <img
            src={lecture.imageUrl}
            alt={lecture.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.1]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-500/50">
            <span className="flex h-full items-center justify-center text-sm">
              <Image className="size-6" />
            </span>
          </div>
        )}

        {/* 좋아요, 저장 버튼 */}
        {showActions && (
          <div className="absolute top-0 right-0 h-full w-full">
            <div className="absolute top-2 right-2 flex items-center gap-2 xl:top-3 xl:right-3">
              <motion.button
                type="button"
                onClick={handleLikeClick}
                whileTap={{ scale: 0.5 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`cursor-pointer rounded-full p-2 transition-colors xl:p-3 ${
                  isLiked
                    ? "bg-primary text-white"
                    : "hover:bg-primary bg-white/30 hover:text-white dark:bg-gray-500/30"
                }`}
              >
                <Heart
                  className={`size-4.5 stroke-gray-700 xl:size-5 dark:stroke-white/60 ${isLiked ? "fill-current stroke-0" : ""} `}
                />
              </motion.button>

              <motion.button
                type="button"
                onClick={handleSaveClick}
                whileTap={{ scale: 0.5 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`cursor-pointer rounded-full p-2 transition-colors xl:p-3 ${
                  isSaved
                    ? "bg-primary text-white"
                    : "hover:bg-primary bg-white/30 hover:text-white dark:bg-gray-500/30"
                }`}
              >
                <Bookmark
                  className={`size-4.5 stroke-gray-700 xl:size-5 dark:stroke-white/60 ${isSaved ? "fill-current stroke-0" : ""} `}
                />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* 타이틀 영역 */}
      <div className="flex flex-col xl:gap-2">
        <h3 className="text-small xl:text-small-title group-hover:text-primary mt-1.5 line-clamp-1 font-[600] xl:text-[20px]">
          {lecture.title}
        </h3>

        <Tags tags={lecture.tags} maxVisible={2} showOverflowCount />
      </div>
    </Link>
  );
}

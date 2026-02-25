import type { Route } from "./+types/profile";

import { DateTime } from "luxon";

import { ProfileOverviewSection } from "../components/profile-overview-section";
import {
  type InitialGalleryRow,
  SavedContentSection,
} from "../components/saved-content-section";
import { profileAction } from "../server/profile.action";
import { profileLoader } from "../server/profile.loader";

function formatLastLearningDate(date: Date | null): string {
  if (!date) return "—";
  const dt = DateTime.fromJSDate(date).toUTC().startOf("day");
  const today = DateTime.utc().startOf("day");
  const diffDays = Math.floor(today.diff(dt, "days").days);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
}

export const meta: Route.MetaFunction = () => {
  return [{ title: `프로필 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = profileLoader;
export const action = profileAction;

export default function Profile({ loaderData }: Route.ComponentProps) {
  const {
    category,
    savedClassCount,
    savedGalleryCount,
    weeklyLearningCount,
    learningSummary,
    recentViews = [],
    savedClasses = [],
    savedGalleries = [],
  } = loaderData;
  const activeTab = category ?? "class";
  const mostExplored =
    learningSummary?.mostExploredCategory?.toUpperCase() ?? "—";
  const lastLearningLabel = formatLastLearningDate(
    learningSummary?.lastLearningDate ?? null,
  );
  const lastViewedClass =
    recentViews.find((v) => v.type === "class" && v.slug) ?? null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 pb-8 xl:px-0 xl:py-30">
      {/* 프로필 영역 */}
      <ProfileOverviewSection
        profile={loaderData.profile}
        email={loaderData.email}
        mostExplored={mostExplored}
        lastLearningLabel={lastLearningLabel}
        weeklyLearningCount={weeklyLearningCount}
        savedClassCount={savedClassCount}
        savedGalleryCount={savedGalleryCount}
        lastViewedClass={lastViewedClass}
        weeklyLearningChartData={loaderData.weeklyLearningChartData ?? []}
      />

      {/* 저장한 학습 자료 영역 */}
      <SavedContentSection
        activeTab={activeTab === "gallery" ? "gallery" : "class"}
        initialSavedClasses={savedClasses}
        initialSavedGalleries={savedGalleries as InitialGalleryRow[]}
      />
    </div>
  );
}

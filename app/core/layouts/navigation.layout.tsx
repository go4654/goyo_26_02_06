import type { Route } from "./+types/navigation.layout";

import { Suspense, useEffect, useState } from "react";
import { Await, Outlet, useRouteLoaderData } from "react-router";

import { NoticeBanner } from "../components/layout/notice-banner";
import Footer from "../components/footer";
import { NavigationBar } from "../components/navigation-bar";
import { getUserRole } from "../lib/guards.server";
import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userPromise = getUserRole(client);
  return { userPromise };
}

interface RootSettings {
  noticeEnabled?: boolean;
  noticeMessage?: string | null;
  noticeVariant?: "info" | "warning" | "event";
  noticeVersion?: number;
}

export default function NavigationLayout({ loaderData }: Route.ComponentProps) {
  const { userPromise } = loaderData;
  const rootData = useRouteLoaderData("root") as
    | { settings?: RootSettings }
    | undefined;
  const settings = rootData?.settings;
  const bannerMessage =
    settings?.noticeEnabled === true && settings?.noticeMessage != null
      ? String(settings.noticeMessage).trim()
      : "";
  const showBannerFromServer = bannerMessage !== "";
  const bannerVariant = settings?.noticeVariant ?? "info";
  const noticeVersion = settings?.noticeVersion ?? 1;

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const storageKey = `notice_banner_dismissed_${noticeVersion}`;

  useEffect(() => {
    if (typeof window === "undefined" || !showBannerFromServer) return;
    const saved = localStorage.getItem(storageKey);
    setBannerDismissed(saved === "true");
  }, [showBannerFromServer, storageKey]);

  const showBanner = showBannerFromServer && !bannerDismissed;

  // 배너 높이(h-12) + 네비 높이(h-16) = 상단 고정 영역만큼 본문이 내려가도록
  const topSpacerHeight = showBanner ? "h-[7rem]" : "h-16";

  return (
    <div className="flex min-h-screen flex-col justify-between">
      {showBannerFromServer && (
        <NoticeBanner
          message={bannerMessage}
          variant={bannerVariant}
          noticeVersion={noticeVersion}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
      <div aria-hidden className={topSpacerHeight} />
      <Suspense fallback={<NavigationBar loading={true} hasNoticeBanner={showBanner} />}>
        <Await resolve={userPromise}>
          {({ user, isAdmin }) =>
            user === null ? (
              <NavigationBar loading={false} hasNoticeBanner={showBanner} />
            ) : (
              <NavigationBar
                name={user.user_metadata.name || "Anonymous"}
                email={user.email}
                avatarUrl={user.user_metadata.avatar_url}
                isAdmin={isAdmin}
                loading={false}
                hasNoticeBanner={showBanner}
              />
            )
          }
        </Await>
      </Suspense>
      <div className="w-full">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

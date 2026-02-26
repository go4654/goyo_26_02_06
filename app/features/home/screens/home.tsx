import type { Route } from "./+types/home";

import { useRouteLoaderData } from "react-router";

import Container from "~/core/layouts/container";
import i18next from "~/core/lib/i18next.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getClasses } from "~/features/class/queries";
import { getGalleries } from "~/features/gallery/queries";
import { getNewsList } from "~/features/news/queries";

import Gallery from "./sections/Gallery";
import RecentLogs from "./sections/RecentLogs";
import LogEverythingText from "./sections/logeverything-text";
import News from "./sections/news";
import Section1 from "./sections/section_1";
import SkillCategories from "./sections/skill-categories";

/**
 * Meta function for setting page metadata

 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching

 * @param request - The incoming HTTP request containing locale information
 * @returns Object with translated title and subtitle strings
 */
export async function loader({ request }: Route.LoaderArgs) {
  // 사용자의 로케일에 맞는 번역 함수 가져오기
  const t = await i18next.getFixedT(request);

  // Supabase 클라이언트 생성
  const [client] = makeServerClient(request);

  // 최신 클래스 5개 조회 (카테고리, 검색 필터 없이 전체에서 조회)
  const { classes: recentClasses } = await getClasses(
    client,
    {
      page: 1,
      pageSize: 5,
      category: null,
      search: null,
    },
    null,
  );

  // 최신 갤러리 20개 조회 후 서버에서 랜덤 4개 선택
  const { galleries } = await getGalleries(client, {
    page: 1,
    pageSize: 20,
    category: null,
    search: null,
  });

  const highlightedGalleries =
    galleries.length <= 4
      ? galleries
      : [...galleries].sort(() => 0.5 - Math.random()).slice(0, 4);

  // 최신 뉴스 3개 조회
  const { items: recentNews } = await getNewsList(client, {
    page: 1,
    pageSize: 3,
  });

  // 컴포넌트와 메타 함수에서 사용할 데이터 반환
  return {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
    recentClasses,
    highlightedGalleries,
    recentNews,
  };
}

/**
 * Home page component

 * @returns JSX element representing the home page
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const { recentClasses, highlightedGalleries, recentNews } = loaderData;
  const rootData = useRouteLoaderData("root") as
    | { user?: unknown }
    | undefined;
  const isLoggedIn = Boolean(rootData?.user);

  return (
    <>
      <Section1 />

      <Container>
        <SkillCategories />

        <RecentLogs recentClasses={recentClasses} />

        {isLoggedIn && (
          <Gallery highlightedGalleries={highlightedGalleries} />
        )}

        <LogEverythingText />

        <News recentNews={recentNews} />
      </Container>
    </>
  );
}

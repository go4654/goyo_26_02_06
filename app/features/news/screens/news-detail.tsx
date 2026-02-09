import type { Route } from "./+types/news-detail";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 상세 페이지" }];
};

export async function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

export async function action({ request }: Route.ActionArgs) {
  return {};
}

export default function NewsDetail({ loaderData }: Route.ComponentProps) {
  return <div>뉴스 상세 페이지</div>;
}

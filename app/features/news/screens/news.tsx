import type { Route } from "./+types/news";

export const meta: Route.MetaFunction = () => {
  return [{ title: "뉴스 페이지" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  return {};
}

export default function News() {
  return <div>뉴스 페이지</div>;
}

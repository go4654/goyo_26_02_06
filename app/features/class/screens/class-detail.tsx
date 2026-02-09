import type { Route } from "./+types/class-detail";

export const meta: Route.MetaFunction = () => {
  return [{ title: "클래스 상세 페이지" }];
};

export async function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

export async function action({ request }: Route.ActionArgs) {
  return {};
}

export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  return <div>클래스 상세 페이지</div>;
}

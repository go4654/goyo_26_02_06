import type { Route } from "./+types/gallery-detail";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 상세 페이지" }];
};

export async function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

export async function action({ request }: Route.ActionArgs) {
  return {};
}

export default function GalleryDetail({ loaderData }: Route.ComponentProps) {
  return <div>갤러리 상세 페이지</div>;
}

import type { Route } from "./+types/admin-news-edit";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

export function action() {
  return {};
}

export default function AdminNewsEdit({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-h5">00페이지</h1>
    </div>
  );
}

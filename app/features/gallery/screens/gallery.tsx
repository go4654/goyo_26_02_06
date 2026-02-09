import type { Route } from "./+types/gallery";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 페이지" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  return {};
}

export default function Gallery() {
  return <div>갤러리 페이지</div>;
}

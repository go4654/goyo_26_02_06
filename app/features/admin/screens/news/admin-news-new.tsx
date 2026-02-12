import type { Route } from "./+types/admin-news-new";

export const meta: Route.MetaFunction = () => {
  return [{ title: `뉴스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export function loader() {
  return {};
}

export function action() {
  return {};
}

export default function AdminNewsNew() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-h5">00페이지</h1>
    </div>
  );
}

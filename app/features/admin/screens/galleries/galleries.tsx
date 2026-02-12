import type { Route } from "./+types/galleries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `갤러리 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

export function loader() {
  return {};
}

export function action() {
  return {};
}

export default function Galleries() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-h5">갤러리 페이지 입니다</h1>
    </div>
  );
}

import type { Route } from "./+types/classes-new";

export const meta: Route.MetaFunction = () => {
  return [{ title: `클래스 추가 | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function ClassesNew() {
  return <div>ClassesNew</div>;
}

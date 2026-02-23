import type { Route } from "./+types/private.layout";

import { Outlet, redirect } from "react-router";

import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw redirect("/login");
  }

  // 레이아웃은 인증 체크만 수행하고 데이터를 반환하지 않음 (자식 라우트의 loaderData가 전달되도록)
  return null;
}

export default function PrivateLayout() {
  return <Outlet />;
}

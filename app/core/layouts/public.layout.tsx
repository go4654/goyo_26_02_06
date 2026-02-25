import type { Route } from "./+types/public.layout";

import { Outlet, redirect } from "react-router";

import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 비밀번호 재설정/이메일 확인 경로는 로그인 상태여도 접근 허용
  const isPasswordResetPath =
    pathname === "/auth/forgot-password/reset" ||
    pathname === "/auth/forgot-password/create";
  const isConfirmPath = pathname === "/auth/confirm";

  if (user && !isPasswordResetPath && !isConfirmPath) {
    throw redirect("/");
  }

  // Return an empty object to avoid the "Cannot read properties of undefined" error
  return {};
}

export default function PublicLayout() {
  return <Outlet />;
}

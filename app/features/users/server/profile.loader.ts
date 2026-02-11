import type { Route } from "../screens/+types/profile";

import { redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { getLecturesByCategory } from "~/features/class/constants/class-data";

import { getUserProfile } from "../queries";

export async function profileLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/login");
  }

  // slug가 현재 사용자의 ID와 일치하는지 확인
  // slug는 user.id (UUID)와 비교해야 함
  if (params.slug !== user.user_metadata.name) {
    // 본인의 프로필이 아니면 본인 프로필로 리다이렉트
    throw redirect("/");
  }

  const profile = await getUserProfile(client, { userId: user.id });

  if (!profile) {
    // 프로필이 없으면 본인 프로필 페이지로 리다이렉트
    throw redirect("/user/profile");
  }

  // 저장한 학습 자료 카테고리 (임시로 URL 쿼리 파라미터에서 가져옴)
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "class";

  // TODO: 나중에 Supabase 연동 시 여기서 실제 저장된 데이터 가져오기
  // const { data: savedLectures } = await client
  //   .from("saved_lectures")
  //   .select("*")
  //   .eq("user_id", user.id)
  //   .eq("type", category);
  const savedLectures = getLecturesByCategory(null); // 임시 데이터

  return { profile, email: user.email, category, savedLectures };
}

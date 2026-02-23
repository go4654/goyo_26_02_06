import type { Route } from "../screens/+types/inquiries-new";

import { redirect } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/** 허용 카테고리 (스키마 inquiry_category enum과 동기화) */
const ALLOWED_CATEGORIES = [
  "general",
  "class",
  "gallery",
  "account",
  "etc",
] as const;

function isAllowedCategory(
  value: string,
): value is (typeof ALLOWED_CATEGORIES)[number] {
  return ALLOWED_CATEGORIES.includes(value as (typeof ALLOWED_CATEGORIES)[number]);
}

/**
 * 문의 생성 액션
 * - 로그인 필수, inquiries + inquiry_messages 동시 생성
 * - profile_id / status는 서버에서만 설정 (클라이언트 미사용)
 */
export async function inquiriesCreateAction({
  request,
}: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response(null, { status: 404 });
  }

  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Response(null, { status: 404 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const categoryRaw = formData.get("category");
  const content = formData.get("content");

  const titleStr =
    typeof title === "string" ? title.trim() : "";
  const contentStr =
    typeof content === "string" ? content.trim() : "";

  if (!titleStr || !contentStr) {
    throw new Response(null, { status: 404 });
  }

  if (!isAllowedCategory(String(categoryRaw ?? "general"))) {
    throw new Response(null, { status: 404 });
  }
  const category = String(categoryRaw ?? "general") as (typeof ALLOWED_CATEGORIES)[number];

  const now = new Date().toISOString();

  const inquiryInsert = {
    profile_id: user.id,
    title: titleStr,
    category,
    status: "pending" as const,
    last_activity_at: now,
  };

  const { data: inquiry, error: insertInquiryError } = await client
    .from("inquiries")
    .insert(inquiryInsert)
    .select("id")
    .single();

  if (insertInquiryError || !inquiry?.id) {
    throw new Response(null, { status: 404 });
  }

  const { error: insertMessageError } = await client
    .from("inquiry_messages")
    .insert({
      inquiry_id: inquiry.id,
      author_profile_id: user.id,
      author_role: "user",
      content: contentStr,
    });

  if (insertMessageError) {
    throw new Response(null, { status: 404 });
  }

  return redirect("/inquiries");
}

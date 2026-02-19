/**
 * 댓글 더보기 API
 * GET /api/class/comments?classId=xxx&offset=0&limit=10&sortOrder=latest|popular
 * getClassCommentsPage 호출 후 { comments, totalTopLevel } 반환
 */
import type { Route } from "./+types/comments-page";

import { data } from "react-router";

import { COMMENTS_PAGE_SIZE } from "../constants/comment.constants";
import { getUserRole } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getClassCommentsPage } from "../queries";

const SORT_ORDER_VALUES = ["latest", "popular"] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const { user } = await getUserRole(client);

  if (!user) {
    return data(
      { comments: [], totalTopLevel: 0 },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10),
  );
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? String(COMMENTS_PAGE_SIZE), 10)),
  );
  const sortOrderParam = url.searchParams.get("sortOrder") ?? "latest";
  const sortOrder = SORT_ORDER_VALUES.includes(sortOrderParam as (typeof SORT_ORDER_VALUES)[number])
    ? (sortOrderParam as "latest" | "popular")
    : "latest";

  if (!classId) {
    return data(
      { comments: [], totalTopLevel: 0 },
      { status: 400 },
    );
  }

  const result = await getClassCommentsPage(client, classId, user.id, {
    limit,
    offset,
    sortOrder,
  });

  return data({
    comments: result.comments,
    totalTopLevel: result.totalTopLevel,
  });
}

import type { Route } from "../+types/admin-dashboard";

import { z } from "zod";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export interface TopLikedGalleryRow {
  id: string;
  title: string;
  thumbnail_url: string | null;
  like_count: number;
}

export interface AdminDashboardStats {
  traffic: {
    total_views: number;
    gallery_views: number;
  };
  users: {
    total_users: number;
    today_users: number;
  };
  class: {
    top_viewed: Array<{ id: string; title: string; views_count: number }>;
    top_saved: Array<{ id: string; title: string; saves_count: number }>;
  };
  comments: {
    last_7_days_count: number;
    hidden_count: number;
  };
  gallery: {
    top_viewed: Array<{ id: string; title: string; views_count: number }>;
    top_saved: Array<{ id: string; title: string; saves_count: number }>;
  };
}

const countSchema = z.coerce.number().int().nonnegative();

const adminDashboardStatsSchema: z.ZodType<AdminDashboardStats> = z.object({
  traffic: z.object({
    total_views: countSchema,
    gallery_views: countSchema,
  }),
  users: z.object({
    total_users: countSchema,
    today_users: countSchema,
  }),
  class: z.object({
    top_viewed: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        views_count: countSchema,
      }),
    ),
    top_saved: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        saves_count: countSchema,
      }),
    ),
  }),
  comments: z.object({
    last_7_days_count: countSchema,
    hidden_count: countSchema,
  }),
  gallery: z.object({
    top_viewed: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        views_count: countSchema,
      }),
    ),
    top_saved: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        saves_count: countSchema,
      }),
    ),
  }),
});

const topLikedGalleriesSchema: z.ZodType<TopLikedGalleryRow[]> = z.array(
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    thumbnail_url: z.string().nullable(),
    like_count: countSchema,
  }),
);

/** 관리자 대시보드 로더 — 통계 + 좋아요 TOP3 갤러리 */
export async function adminDashboardLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const [statsResult, topLikedResult] = await Promise.all([
    client.rpc("get_admin_dashboard_stats"),
    client.rpc("get_top_galleries_by_likes"),
  ]);

  if (statsResult.error || statsResult.data === null) {
    throw new Response("대시보드 통계를 불러오지 못했습니다.", { status: 500 });
  }

  if (topLikedResult.error) {
    throw new Response("좋아요 TOP 갤러리를 불러오지 못했습니다.", { status: 500 });
  }

  const stats = adminDashboardStatsSchema.parse(statsResult.data);
  const topLikedGalleries = topLikedGalleriesSchema.parse(
    topLikedResult.data ?? [],
  );

  return { stats, topLikedGalleries };
}


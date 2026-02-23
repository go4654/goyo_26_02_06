import type { Database } from "database.types";

import type { Route } from "./+types/admin-dashboard";

import {
  BarChart3,
  Eye,
  EyeOff,
  ImageIcon,
  MessageCircle,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/** get_admin_dashboard_stats RPC 반환 타입 (database.types와 동기화) */
export type AdminDashboardStats =
  Database["public"]["Functions"]["get_admin_dashboard_stats"]["Returns"];

export const meta: Route.MetaFunction = () => {
  return [{ title: `대시보드 | ${import.meta.env.VITE_APP_NAME}` }];
};

/** 관리자 대시보드 통계 로더 — RPC 단일 호출로 전체 통계 반환 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAdmin(client);

  const { data, error } = await client.rpc("get_admin_dashboard_stats");

  if (error) {
    throw new Response("대시보드 통계를 불러오지 못했습니다.", { status: 500 });
  }

  if (data === null) {
    throw new Response("대시보드 통계를 불러오지 못했습니다.", { status: 500 });
  }

  return { stats: data };
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const stats = loaderData.stats;
  const { traffic, users, class: classStats, comments, gallery } = stats;

  // 갤러리 영역: RPC에 gallery가 있으면 사용, 없으면 빈 배열로 null 방어
  const galleryTopSaved = gallery?.top_saved ?? [];
  const galleryTopViewed = gallery?.top_viewed ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* <div className="mb-4">
        <h1 className="text-h5">대시보드</h1>
      </div> */}

      {/* 전체 통계 */}
      <div>
        <h2 className="text-small-title mb-4">전체 통계</h2>
        <div className="grid auto-rows-min gap-4 xl:grid-cols-3">
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                전체 방문 수
              </CardTitle>
              <Eye className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(traffic.total_views)}
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                클래스 뷰 이벤트 기준
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                총 회원 수
              </CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(users.total_users)}명
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                오늘 가입자 수
              </CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(users.today_users)}명
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                UTC 기준 당일 가입
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 클래스 통계 */}
      <div>
        <h2 className="text-small-title mt-8 mb-4">클래스 통계</h2>
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          {/* 가장 많이 열람된 클래스 TOP 3 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                가장 많이 열람된 클래스 TOP 3
              </CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {classStats.top_viewed.length === 0 ? (
                <p className="text-muted-foreground text-xs">데이터 없음</p>
              ) : (
                classStats.top_viewed.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate">{item.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {formatNumber(item.views_count)}회
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 저장 많은 클래스 TOP 3 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                저장 많은 클래스 TOP 3
              </CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {classStats.top_saved.length === 0 ? (
                <p className="text-muted-foreground text-xs">데이터 없음</p>
              ) : (
                classStats.top_saved.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate">{item.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {formatNumber(item.saves_count)}회
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 최근 7일 댓글 수 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                최근 7일 댓글 수
              </CardTitle>
              <MessageCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(comments.last_7_days_count)}개
              </div>
            </CardContent>
          </Card>

          {/* 숨김 댓글 수 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                숨김 댓글 수
              </CardTitle>
              <EyeOff className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(comments.hidden_count)}개
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 갤러리 통계 */}
      <div>
        <h2 className="text-small-title mt-8 mb-4">갤러리 통계</h2>
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          {/* 갤러리 조회 수 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                갤러리 조회 수
              </CardTitle>
              <ImageIcon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {formatNumber(traffic.gallery_views)}
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                갤러리 뷰 이벤트 기준
              </p>
            </CardContent>
          </Card>

          {/* 가장 많이 저장된 갤러리 TOP 3 */}
          <Card className="bg-muted/50 aspect-video rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-text-2 text-sm font-medium">
                가장 많이 저장된 갤러리 TOP 3
              </CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {galleryTopSaved.length === 0 ? (
                <p className="text-muted-foreground text-xs">데이터 없음</p>
              ) : (
                galleryTopSaved.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate">{item.title}</span>
                    <span className="text-muted-foreground shrink-0">
                      {formatNumber(item.saves_count)}회
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

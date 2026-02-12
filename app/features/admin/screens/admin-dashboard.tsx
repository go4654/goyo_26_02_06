import type { Route } from "./+types/admin-dashboard";

import { BarChart3, Eye, ImageIcon, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

export const meta: Route.MetaFunction = () => {
  return [{ title: `대시보드 | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4">
        <h1 className="text-h5">대시보드</h1>
        {/* <p className="text-text-2 mt-2">관리자 전용 CMS 페이지입니다.</p> */}
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {/* 전체 방문 수 */}
        <Card className="bg-muted/50 aspect-video rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-2 text-sm font-medium">
              전체 방문 수
            </CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">12,430</div>
            <p className="text-muted-foreground mt-4 text-xs">
              지난주 대비 +12%
            </p>
          </CardContent>
        </Card>

        {/* 가장 많이 열람된 클래스 */}
        <Card className="bg-muted/50 aspect-video rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-2 text-sm font-medium">
              가장 많이 열람된 클래스 TOP 3
            </CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>React 상태관리</span>
              <span className="text-muted-foreground">245회</span>
            </div>
            <div className="flex justify-between">
              <span>Next.js 구조 설계</span>
              <span className="text-muted-foreground">198회</span>
            </div>
          </CardContent>
        </Card>

        {/* 갤러리 방문 수 */}
        <Card className="bg-muted/50 aspect-video rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-2 text-sm font-medium">
              갤러리 방문 수
            </CardTitle>
            <ImageIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">8,240</div>
            <p className="text-muted-foreground mt-4 text-xs">
              지난주 대비 +6%
            </p>
          </CardContent>
        </Card>

        {/* 최근 가입 유저 수 */}
        <Card className="bg-muted/50 aspect-video rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-2 text-sm font-medium">
              최근 가입 유저 수
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">32명</div>
            <p className="text-muted-foreground mt-4 text-xs">이번 주 기준</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 min-h-full flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}

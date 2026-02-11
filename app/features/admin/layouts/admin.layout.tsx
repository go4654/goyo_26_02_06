import type { Route } from "./+types/admin.layout";

import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import AdminSidebar from "~/features/admin/components/admin-sidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  
  // 관리자 권한 체크 및 user 반환 (중복 getUser() 호출 방지)
  // requireAdmin이 성공하면 user를 반환하고, 실패하면 throw하므로 user는 항상 정의됨
  const user = await requireAdmin(client);
  
  return {
    user,
  };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  // requireAdmin이 성공하면 user를 반환하고, 실패하면 throw하므로 user는 항상 정의됨
  // @ts-expect-error - loaderData는 항상 정의되지만 타입 추론 문제로 인한 에러
  const { user } = loaderData ?? {};
  
  if (!user) {
    return <div>사용자 정보를 불러올 수 없습니다.</div>;
  }
  
  return (
    <SidebarProvider>
      <AdminSidebar
        user={{
          name: user.user_metadata?.name ?? "",
          avatarUrl: user.user_metadata?.avatar_url ?? "",
          email: user.email ?? "",
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

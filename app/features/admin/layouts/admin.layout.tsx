import type { Route } from "./+types/admin.layout";

import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";

import AdminSidebar from "~/features/admin/components/admin-sidebar";
import { loader as adminLayoutLoader } from "../server/admin-layout.loader";

export const loader = adminLayoutLoader;

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { user, pendingInquiryCount } = loaderData ?? {};

  if (!user) {
    return <div>사용자 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        pendingInquiryCount={pendingInquiryCount ?? 0}
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

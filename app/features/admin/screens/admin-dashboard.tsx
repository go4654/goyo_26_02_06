import type { Route } from "./+types/admin-dashboard";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Admin Dashboard | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mb-4">
        <h1 className="text-h3">관리자 대시보드</h1>
        <p className="text-text-2 mt-2">관리자 전용 CMS 페이지입니다.</p>
      </div>
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-full flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}

import { Link, Outlet, useLocation } from "react-router";

/** 탭 경로와 라벨 */
const TOOL_TABS = [
  { path: "/tools/random-choice", label: "랜덤 선택" },
  { path: "/tools/wheel", label: "돌림판" },
  { path: "/tools/timer", label: "타이머" },
] as const;

export default function ToolLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto min-h-screen max-w-[980px] px-4 py-6 pb-8 xl:px-0">
      {/* <h1 className="text-h4 xl:text-h1 max-w-[800px] tracking-tighter">
        Tools for Your Own
      </h1> */}

      {/* 탭 메뉴 */}
      <nav
        className="text-h6 text-text-2/60 mt-10 flex flex-wrap gap-8 font-light"
        aria-label="도구 메뉴"
      >
        {TOOL_TABS.map(({ path, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative ${isActive ? "text-text-1 font-semibold" : ""}`}
            >
              {label}
              {isActive && (
                <div className="bg-primary absolute -bottom-2 left-0 h-1 w-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 탭 콘텐츠: 자식 라우트가 여기 렌더됨 */}
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}

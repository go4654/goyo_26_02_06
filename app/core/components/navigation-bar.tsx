/**
 * Navigation Bar Component
 *
 * A responsive navigation header that adapts to different screen sizes and user authentication states.
 * This component provides the main navigation interface for the application, including:
 *
 * - Responsive design with desktop and mobile layouts
 * - User authentication state awareness (logged in vs. logged out)
 * - User profile menu with avatar and dropdown options
 * - Theme switching functionality
 * - Language switching functionality
 * - Mobile-friendly navigation drawer
 *
 * The component handles different states:
 * - Loading state with skeleton placeholders
 * - Authenticated state with user profile information
 * - Unauthenticated state with sign in/sign up buttons
 */
import {
  CogIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
} from "lucide-react";
import { Link } from "react-router";

import { LOGO_URL } from "../constant/imgUrls";
import LangSwitcher from "./lang-switcher";
import ThemeSwitcher from "./theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";

/**
 * UserMenu Component
 *
 * Displays the authenticated user's profile menu with avatar and dropdown options.
 * This component is shown in the navigation bar when a user is logged in and provides
 * quick access to user-specific actions and information.
 *
 * Features:
 * - Avatar display with image or fallback initials
 * - User name and email display
 * - Quick navigation to dashboard
 * - Logout functionality
 *
 * @param name - The user's display name
 * @param email - The user's email address (optional)
 * @param avatarUrl - URL to the user's avatar image (optional)
 * @returns A dropdown menu component with user information and actions
 */
function UserMenu({
  name,
  email,
  avatarUrl,
  isAdmin,
}: {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <DropdownMenu>
      {/* 아바타 드롭다운 트리거 */}
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer rounded-full">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* 드롭다운 컨텐츠 유저 정보 및 액션 */}
      <DropdownMenuContent className="w-56">
        {/* 유저 정보 표시 */}
        <DropdownMenuLabel className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs">{email}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <SheetClose asChild>
            <Link
              to={`/user/${name}`}
              viewTransition
              className="hover:text-success focus:text-success flex cursor-pointer items-center gap-2"
            >
              <UserIcon className="size-4" />
              프로필
            </Link>
          </SheetClose>
        </DropdownMenuItem>

        {/* 로그아웃 링크 */}
        <DropdownMenuItem asChild>
          <SheetClose asChild>
            <Link
              to="/logout"
              viewTransition
              className="hover:text-success focus:text-success flex cursor-pointer items-center gap-2"
            >
              <LogOutIcon className="size-4" />
              로그아웃
            </Link>
          </SheetClose>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {/* 관리자 대시보드 링크 (관리자만 표시) */}
              <DropdownMenuItem asChild>
                <SheetClose asChild>
                  <Link
                    to="/admin"
                    viewTransition
                    className="hover:text-success focus:text-success flex cursor-pointer items-center gap-2"
                  >
                    <HomeIcon className="size-4" />
                    대시보드
                  </Link>
                </SheetClose>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AuthButtons Component
 *
 * Displays authentication buttons (Sign in and Sign up) for unauthenticated users.
 * This component is shown in the navigation bar when no user is logged in and provides
 * quick access to authentication screens.
 *
 * Features:
 * - Sign in button with ghost styling (less prominent)
 * - Sign up button with default styling (more prominent)
 * - View transitions for smooth navigation to auth screens
 * - Compatible with mobile navigation drawer (SheetClose integration)
 *
 * @returns Fragment containing sign in and sign up buttons
 */
function AuthButtons() {
  return (
    <>
      {/* Sign in button (less prominent) */}
      <Button variant="ghost" asChild>
        <SheetClose asChild>
          <Link to="/login" viewTransition>
            로그인
          </Link>
        </SheetClose>
      </Button>

      {/* Sign up button (more prominent) */}
      <Button variant="default" asChild>
        <SheetClose asChild>
          <Link to="/join" viewTransition>
            회원가입
          </Link>
        </SheetClose>
      </Button>
    </>
  );
}

/**
 * Actions Component
 *
 * Displays utility actions and settings in the navigation bar, including:
 * - Debug/settings dropdown menu with links to monitoring tools
 * - Theme switcher for toggling between light and dark mode
 * - Language switcher for changing the application language
 *
 * This component is shown in the navigation bar for all users regardless of
 * authentication state and provides access to application-wide settings and tools.
 *
 * @returns Fragment containing settings dropdown, theme switcher, and language switcher
 */
function Actions() {
  return (
    <>
      {/* 세팅/디버그 드롭다운 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <CogIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Sentry 모니터링 링크 */}
          <DropdownMenuItem asChild>
            <SheetClose asChild>
              <Link
                to="/debug/sentry"
                viewTransition
                className="hover:text-success focus:text-success cursor-pointer"
              >
                Sentry
              </Link>
            </SheetClose>
          </DropdownMenuItem>
          {/* Google Analytics 링크 */}
          <DropdownMenuItem asChild>
            <SheetClose asChild>
              <Link
                to="/debug/analytics"
                viewTransition
                className="hover:text-success focus:text-success cursor-pointer"
              >
                Google Tag
              </Link>
            </SheetClose>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 테마 스위처 컴포넌트 (라이트/다크 모드) */}
      {/* <ThemeSwitcher /> */}
    </>
  );
}

/**
 * NavigationBar Component
 *
 * The main navigation header for the application that adapts to different screen sizes
 * and user authentication states. This component serves as the primary navigation
 * interface and combines several sub-components to create a complete navigation experience.
 *
 * Features:
 * - Responsive design with desktop navigation and mobile drawer
 * - Application branding with localized title
 * - Main navigation links (Blog, Contact, Payments)
 * - User authentication state handling (loading, authenticated, unauthenticated)
 * - User profile menu with avatar for authenticated users
 * - Sign in/sign up buttons for unauthenticated users
 * - Theme and language switching options
 *
 * @param name - The authenticated user's name (if available)
 * @param email - The authenticated user's email (if available)
 * @param avatarUrl - The authenticated user's avatar URL (if available)
 * @param loading - Boolean indicating if the auth state is still loading
 * @returns The complete navigation bar component
 */
export function NavigationBar({
  name,
  email,
  avatarUrl,
  isAdmin,
  loading,
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  loading: boolean;
}) {
  return (
    <nav
      className={
        "fixed top-0 right-0 left-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/60 px-5 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-full w-full items-center justify-between py-3 md:max-w-[1640px]">
        {/* 로고 */}
        <Link to="/" className="mt-1">
          <img src={LOGO_URL} alt="Goyo" className="w-[70px] xl:w-[90px]" />
        </Link>

        {/* 메인 내비게이션 */}
        <ul className="text-small-title mt-1 hidden items-center gap-18 md:flex">
          <li className="group relative">
            <div className="bg-success absolute top-0 -right-3 h-2 w-2 scale-0 rounded-full transition-all duration-200 group-hover:scale-100"></div>
            <Link to="/class" className="hover:text-primary">
              CLASS
            </Link>
          </li>

          <li className="group relative">
            <div className="bg-success absolute top-0 -right-3 h-2 w-2 scale-0 rounded-full transition-all duration-300 group-hover:scale-100"></div>
            <Link to="/gallery" className="hover:text-primary">
              GALLERY
            </Link>
          </li>

          <li className="group relative">
            <div className="bg-success absolute top-0 -right-3 h-2 w-2 scale-0 rounded-full transition-all duration-300 group-hover:scale-100"></div>
            <Link to="/news" className="hover:text-primary">
              NEWS
            </Link>
          </li>
        </ul>

        {/* 데스크탑 유저 메뉴 */}
        <div className="hidden h-full items-center gap-5 md:flex">
          {/* 인증 상태에 따른 조건 렌더링 */}
          {loading ? (
            // 로딩 상태 스켈레톤 플레이스홀더
            <div className="flex items-center">
              <div className="bg-muted-foreground/20 size-8 animate-pulse rounded-lg" />
            </div>
          ) : (
            <>
              {name ? (
                // 인증 상태 유저 메뉴
                <UserMenu
                  name={name}
                  email={email}
                  avatarUrl={avatarUrl}
                  isAdmin={isAdmin}
                />
              ) : (
                // 비인증 상태 인증 버튼
                <AuthButtons />
              )}
            </>
          )}
        </div>

        {/* 모바일 메뉴 트리거 (데스크탑에서 숨겨짐) */}
        <SheetTrigger className="size-6 md:hidden">
          <MenuIcon />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader className="text-h4 mt-20 flex flex-col gap-10">
            <SheetClose asChild>
              <Link
                to="/"
                className="hover:text-primary focus:text-primary cursor-pointer"
              >
                Home
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/class"
                className="hover:text-primary focus:text-primary cursor-pointer"
              >
                CLASS
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/gallery"
                className="hover:text-primary focus:text-primary cursor-pointer"
              >
                GALLERY
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/news"
                className="hover:text-primary focus:text-primary cursor-pointer"
              >
                NEWS
              </Link>
            </SheetClose>
          </SheetHeader>
          {loading ? (
            <div className="flex items-center">
              <div className="bg-muted-foreground h-4 w-24 animate-pulse rounded-full" />
            </div>
          ) : (
            <SheetFooter>
              {name ? (
                <div className="grid grid-cols-3">
                  <div className="col-span-2 flex w-full justify-between">
                    {/* 인증 상태 세팅/디버그 드롭다운 메뉴 */}
                    {isAdmin && <Actions />}
                  </div>
                  <div className="flex justify-end">
                    <UserMenu
                      name={name}
                      email={email}
                      avatarUrl={avatarUrl}
                      isAdmin={isAdmin}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* 비인증 상태 인증 버튼 */}
                    <AuthButtons />
                  </div>
                </div>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </div>
    </nav>
  );
}

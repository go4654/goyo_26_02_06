import {
  BookOpenIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  MoonIcon,
  NewspaperIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Separator } from "~/core/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/core/components/ui/sidebar";
import { LOGO_URL, LOGO_URL_WHITE } from "~/core/constant/imgUrls";
import SidebarMain from "~/features/users/components/sidebar-main";
import SidebarUser from "~/features/users/components/sidebar-user";

const NAV_MAIN_BASE = [
  {
    title: "대시보드",
    url: "#",
    icon: LayoutDashboardIcon,
    isActive: true,
    items: [{ title: "개요", url: "/admin" }],
  },
  {
    title: "콘텐츠 관리",
    url: "#",
    icon: BookOpenIcon,
    isActive: true,
    items: [
      { title: "클래스", url: "/admin/classes" },
      { title: "갤러리", url: "/admin/gallery" },
      { title: "뉴스", url: "/admin/news" },
    ],
  },
  {
    title: "유저 관리",
    url: "#",
    icon: UsersIcon,
    isActive: true,
    items: [
      { title: "회원 목록", url: "/admin/users" },
      { title: "문의", url: "/admin/users/inquiries" },
    ],
  },
  {
    title: "댓글 관리",
    url: "#",
    icon: MessageCircleIcon,
    isActive: true,
    items: [{ title: "댓글 목록", url: "/admin/comments" }],
  },
  {
    title: "설정",
    url: "#",
    icon: Settings2Icon,
    items: [{ title: "사이트 설정", url: "/admin/settings" }],
  },
];

// const data = {
//   navMain: NAV_MAIN_BASE,
//   projects: [
//     {
//       name: "클래스",
//       url: "/admin/classes",
//       icon: BookOpenIcon,
//     },
//     {
//       name: "갤러리",
//       url: "/admin/gallery",
//       icon: GalleryVerticalEndIcon,
//     },
//     {
//       name: "뉴스",
//       url: "/admin/news",
//       icon: NewspaperIcon,
//     },
//   ],
// };

export interface AdminSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  pendingInquiryCount: number;
}

export default function AdminSidebar({
  user,
  pendingInquiryCount,
  ...props
}: AdminSidebarProps) {
  const navMain = NAV_MAIN_BASE.map((group) => {
    if (group.title !== "유저 관리" || !group.items) return group;
    return {
      ...group,
      items: group.items.map((sub) =>
        sub.url === "/admin/users/inquiries"
          ? { ...sub, badgeCount: pendingInquiryCount }
          : sub,
      ),
    };
  });

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between pb-3">
          {/* <Link to="/admin">
            <img src={LOGO_URL_WHITE} alt="logo" width={100} height={100} />
          </Link> */}
          <Link to="/">
            <img src={LOGO_URL} alt="logo" width={100} height={100} />
          </Link>
        </div>
        <Separator />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMain items={navMain} />
        {/* <SidebarProjects projects={data.projects} /> */}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

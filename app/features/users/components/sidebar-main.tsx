import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/core/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/core/components/ui/sidebar";

// 현재 경로가 해당 메뉴 url과 일치하는지(또는 하위 경로인지) 판별
function isPathActive(pathname: string, url: string): boolean {
  if (pathname === url) return true;
  if (url !== "/admin" && pathname.startsWith(`${url}/`)) return true;
  return false;
}

export default function SidebarMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      badgeCount?: number;
    }[];
  }[];
}) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveChild = item.items?.some((sub) =>
            isPathActive(pathname, sub.url),
          );
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild ?? item.isActive}
              className="group/collapsible"
            >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const active = isPathActive(pathname, subItem.url);
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={active}>
                          <Link to={subItem.url} className="relative flex items-center gap-2">
                          <span>{subItem.title}</span>
                          {subItem.badgeCount != null && subItem.badgeCount > 0 && (
                            <span
                              className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white"
                              aria-label={`미처리 문의 ${subItem.badgeCount}건`}
                            >
                              {subItem.badgeCount > 99 ? "99+" : subItem.badgeCount}
                            </span>
                          )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

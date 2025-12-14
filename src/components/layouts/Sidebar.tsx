"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent as SidebarContentWrapper,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LocationIcon, SitemapIcon, UsersIcon } from "@/components/icons/glass-icons";

const navigation = [
  { name: "Đồ thị", href: "/", icon: SitemapIcon },
  { name: "Bản đồ", href: "/map", icon: LocationIcon },
  { name: "Thành viên", href: "/members", icon: UsersIcon },
];

export default function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="flex flex-col gap-2 p-2 border-b border-dashed h-14 justify-center px-2">
        <Link href="/">
          <div className="flex items-center gap-2 px-2">
            <span className="text-2xl font-black tracking-tighter text-foreground" style={{ fontFamily: "var(--font-doto)" }}>
              VaniStudio
              <span className="text-xs font-light ml-1.5 text-muted-foreground/50">v1.0</span>
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContentWrapper className="mt-2">
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      className={`transition-all duration-200 ease-in-out ${isActive ? "custom-shadow" : ""}`}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" size={16} />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContentWrapper>
    </>
  );
}


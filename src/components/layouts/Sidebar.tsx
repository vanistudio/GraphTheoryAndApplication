"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarContent as SidebarContentWrapper,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LocationIcon, HistoryIcon, GearIcon, LogOutIcon } from "@/components/icons/glass-icons";

const customButtonShadow = "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

const navigation = [
  { name: "Bản đồ", href: "/", icon: LocationIcon },
  { name: "Lịch sử", href: "/history", icon: HistoryIcon },
  { name: "Cài đặt", href: "/settings", icon: GearIcon },
];

export default function SidebarContent() {
  const pathname = usePathname();
  const session = authClient.useSession();

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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

      <SidebarFooter className="flex flex-col gap-2 p-2 border-t border-dashed">
        {session.data?.user ? (
          <>
            <div className="mb-2 px-2">
              <p className="text-xs font-medium text-muted-foreground">Đăng nhập như</p>
              <p className="text-sm font-medium text-foreground truncate">{session.data.user.email}</p>
            </div>
            <Button
              onClick={() => authClient.signOut()}
              variant="outline"
              className={`w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left h-8 border border-dashed bg-background text-xs justify-center transition-all duration-200 ease-in-out ${customButtonShadow}`}
            >
              <LogOutIcon className="h-4 w-4" size={16} />
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button
              variant="outline"
              className={`w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left h-8 border border-dashed bg-background text-xs justify-center transition-all duration-200 ease-in-out ${customButtonShadow}`}
            >
              Đăng nhập
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </>
  );
}


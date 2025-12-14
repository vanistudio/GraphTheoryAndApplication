"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <svg
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" className="nc-icon-wrapper">
          <path
            d="M11.7494 17.6107C11.9122 17.5578 12.0875 17.5579 12.2503 17.6107C12.4356 17.6709 12.597 17.8314 12.9183 18.1527C13.2397 18.4741 13.4001 18.6354 13.4603 18.8207C13.5131 18.9835 13.5132 19.1588 13.4603 19.3217C13.4001 19.5069 13.2397 19.6683 12.9183 19.9896C12.597 20.3109 12.4356 20.4714 12.2503 20.5316C12.0875 20.5844 11.9121 20.5845 11.7494 20.5316C11.5642 20.4714 11.4034 20.3107 11.0824 19.9896C10.761 19.6683 10.5996 19.5069 10.5394 19.3217C10.4866 19.1589 10.4866 18.9835 10.5394 18.8207C10.5996 18.6354 10.761 18.4741 11.0824 18.1527C11.4035 17.8316 11.5642 17.6709 11.7494 17.6107ZM11.7494 3.46912C11.9122 3.41619 12.0874 3.41625 12.2503 3.46912C12.4356 3.52932 12.597 3.68976 12.9183 4.01111C13.2394 4.33225 13.4001 4.49292 13.4603 4.6781C13.5133 4.84108 13.5133 5.01708 13.4603 5.18005C13.4 5.36519 13.2394 5.52593 12.9183 5.84705C12.597 6.1684 12.4356 6.32884 12.2503 6.38904C12.0875 6.44189 11.9122 6.44195 11.7494 6.38904C11.5641 6.32885 11.4036 6.16826 11.0824 5.84705C10.7611 5.5258 10.5996 5.36526 10.5394 5.18005C10.4864 5.01708 10.4864 4.84108 10.5394 4.6781C10.5996 4.49284 10.761 4.33244 11.0824 4.01111C11.4036 3.68986 11.5641 3.52932 11.7494 3.46912Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_0_qf1mq0j5t)"
            data-glass="origin"
            mask="url(#f64qxknsftn-1760519092851-5435590_connections_mask_x28wanw39)"
          />
          <path
            d="M11.7494 17.6107C11.9122 17.5578 12.0875 17.5579 12.2503 17.6107C12.4356 17.6709 12.597 17.8314 12.9183 18.1527C13.2397 18.4741 13.4001 18.6354 13.4603 18.8207C13.5131 18.9835 13.5132 19.1588 13.4603 19.3217C13.4001 19.5069 13.2397 19.6683 12.9183 19.9896C12.597 20.3109 12.4356 20.4714 12.2503 20.5316C12.0875 20.5844 11.9121 20.5845 11.7494 20.5316C11.5642 20.4714 11.4034 20.3107 11.0824 19.9896C10.761 19.6683 10.5996 19.5069 10.5394 19.3217C10.4866 19.1589 10.4866 18.9835 10.5394 18.8207C10.5996 18.6354 10.761 18.4741 11.0824 18.1527C11.4035 17.8316 11.5642 17.6709 11.7494 17.6107ZM11.7494 3.46912C11.9122 3.41619 12.0874 3.41625 12.2503 3.46912C12.4356 3.52932 12.597 3.68976 12.9183 4.01111C13.2394 4.33225 13.4001 4.49292 13.4603 4.6781C13.5133 4.84108 13.5133 5.01708 13.4603 5.18005C13.4 5.36519 13.2394 5.52593 12.9183 5.84705C12.597 6.1684 12.4356 6.32884 12.2503 6.38904C12.0875 6.44189 11.9122 6.44195 11.7494 6.38904C11.5641 6.32885 11.4036 6.16826 11.0824 5.84705C10.7611 5.5258 10.5996 5.36526 10.5394 5.18005C10.4864 5.01708 10.4864 4.84108 10.5394 4.6781C10.5996 4.49284 10.761 4.33244 11.0824 4.01111C11.4036 3.68986 11.5641 3.52932 11.7494 3.46912Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_0_qf1mq0j5t)"
            data-glass="clone"
            filter="url(#f64qxknsftn-1760519092851-5435590_connections_filter_agfzbhgkx)"
            clipPath="url(#f64qxknsftn-1760519092851-5435590_connections_clipPath_rqrz4qz17)"
          />
          <path
            d="M2.10051 9.17156C3.09055 8.18151 3.58557 7.68649 4.15639 7.50102C4.6585 7.33788 5.19937 7.33788 5.70148 7.50102C6.2723 7.68649 6.76732 8.18151 7.75736 9.17156C8.74741 10.1616 9.24243 10.6566 9.4279 11.2274C9.59104 11.7295 9.59104 12.2704 9.4279 12.7725C9.24243 13.3433 8.74741 13.8384 7.75736 14.8284C6.76732 15.8185 6.2723 16.3135 5.70148 16.4989C5.19937 16.6621 4.6585 16.6621 4.1564 16.4989C3.58557 16.3135 3.09055 15.8185 2.10051 14.8284C1.11047 13.8384 0.615447 13.3433 0.429976 12.7725C0.266831 12.2704 0.266831 11.7295 0.429976 11.2274C0.615447 10.6566 1.11047 10.1616 2.10051 9.17156Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_1_pkgkeso4v)"
          />
          <path
            d="M16.2426 9.17156C17.2327 8.18151 17.7277 7.68649 18.2985 7.50102C18.8006 7.33788 19.3415 7.33788 19.8436 7.50102C20.4144 7.68649 20.9094 8.18151 21.8995 9.17156C22.8895 10.1616 23.3845 10.6566 23.57 11.2274C23.7332 11.7295 23.7332 12.2704 23.57 12.7725C23.3845 13.3433 22.8895 13.8384 21.8995 14.8284C20.9094 15.8185 20.4144 16.3135 19.8436 16.4989C19.3415 16.6621 18.8006 16.6621 18.2985 16.4989C17.7277 16.3135 17.2327 15.8185 16.2426 14.8284C15.2526 13.8384 14.7576 13.3433 14.5721 12.7725C14.409 12.2704 14.409 11.7295 14.5721 11.2274C14.7576 10.6566 15.2526 10.1616 16.2426 9.17156Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_2_2zdns40c4)"
          />
          <path
            d="M11.2273 14.572C11.7293 14.4089 12.2702 14.409 12.7722 14.572C13.343 14.7575 13.8388 15.2529 14.8289 16.2429C15.8186 17.2327 16.3133 17.7278 16.4988 18.2986C16.6619 18.8007 16.6619 19.3414 16.4988 19.8435C16.3133 20.4143 15.8187 20.9094 14.8289 21.8992C13.8388 22.8892 13.343 23.3846 12.7722 23.5701C12.2702 23.7331 11.7293 23.7332 11.2273 23.5701C10.6565 23.3846 10.1616 22.8891 9.17163 21.8992C8.18166 20.9092 7.6862 20.4143 7.50073 19.8435C7.33765 19.3415 7.33766 18.8006 7.50073 18.2986C7.6862 17.7278 8.18167 17.2329 9.17163 16.2429C10.1616 15.253 10.6565 14.7575 11.2273 14.572ZM11.2273 0.43042C11.7294 0.267292 12.2702 0.267327 12.7722 0.43042C13.343 0.615891 13.8388 1.1103 14.8289 2.10034C15.8186 3.09006 16.3132 3.58538 16.4988 4.15601C16.6619 4.65811 16.6619 5.1998 16.4988 5.7019C16.3132 6.27252 15.8186 6.76785 14.8289 7.75757C13.8388 8.74761 13.343 9.24202 12.7722 9.42749C12.2702 9.59058 11.7293 9.59062 11.2273 9.42749C10.6566 9.24196 10.1614 8.74737 9.17163 7.75757C8.18176 6.7677 7.68628 6.2726 7.50073 5.7019C7.33759 5.1998 7.33759 4.65811 7.50073 4.15601C7.68627 3.5853 8.18174 3.09023 9.17163 2.10034C10.1614 1.11053 10.6566 0.615952 11.2273 0.43042Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_3_kgwd6nmd1)"
            data-glass="blur"
          />
          <path
            d="M11.2275 0.429916C11.7295 0.266811 12.2705 0.26689 12.7725 0.429916C13.3433 0.615387 13.8391 1.11077 14.8291 2.10081C15.8189 3.09057 16.3135 3.58578 16.499 4.15647C16.6621 4.6585 16.6621 5.19934 16.499 5.70139C16.3135 6.27221 15.8191 6.76798 14.8291 7.75802L14.1699 8.41036C13.5863 8.97587 13.2005 9.28885 12.7725 9.42794C12.2704 9.59101 11.7296 9.59106 11.2275 9.42794C10.7995 9.2888 10.4137 8.97593 9.83009 8.41036L9.17189 7.75802C8.18185 6.76798 7.68646 6.27221 7.50099 5.70139C7.33797 5.19938 7.33789 4.65845 7.50099 4.15647C7.64013 3.72829 7.95376 3.34284 8.51954 2.75901L9.17189 2.10081C10.1619 1.1108 10.6567 0.615399 11.2275 0.429916ZM12.541 1.14378C12.1895 1.02958 11.8105 1.02958 11.459 1.14378C11.3054 1.19378 11.1257 1.29526 10.8428 1.53538C10.5527 1.78164 10.2059 2.12731 9.70216 2.63108C9.19839 3.13485 8.85272 3.48162 8.60646 3.7717C8.36634 4.0546 8.26485 4.23433 8.21486 4.38791C8.10066 4.73939 8.10066 5.11847 8.21486 5.46994C8.26482 5.62366 8.36594 5.80381 8.60646 6.08713C8.85268 6.37717 9.19851 6.72312 9.70216 7.22677C10.2059 7.73054 10.5527 8.07621 10.8428 8.32247C11.1259 8.56281 11.3053 8.66506 11.459 8.71505C11.8104 8.82924 12.1896 8.82923 12.541 8.71505C12.6948 8.66509 12.8748 8.56305 13.1582 8.32247C13.4482 8.07622 13.7942 7.73042 14.2978 7.22677C14.8015 6.72312 15.1473 6.37717 15.3935 6.08713C15.6341 5.80374 15.7362 5.62369 15.7861 5.46994C15.9003 5.11848 15.9003 4.73937 15.7861 4.38791C15.7361 4.23426 15.6339 4.05482 15.3935 3.7717C15.1473 3.48162 14.8016 3.13485 14.2978 2.63108C13.7942 2.12743 13.4482 1.78161 13.1582 1.53538C12.8749 1.29486 12.6947 1.19375 12.541 1.14378Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_4_hko5sccr7)"
          />
          <path
            d="M11.2275 14.572C11.7295 14.4089 12.2705 14.409 12.7725 14.572C13.3433 14.7575 13.8391 15.2529 14.8291 16.2429C15.8189 17.2327 16.3135 17.7279 16.499 18.2986C16.6621 18.8006 16.6621 19.3414 16.499 19.8435C16.3135 20.4143 15.8191 20.9101 14.8291 21.9001L14.1699 22.5525C13.5863 23.118 13.2005 23.4309 12.7725 23.57C12.2704 23.7331 11.7296 23.7331 11.2275 23.57C10.7995 23.4309 10.4137 23.118 9.83009 22.5525L9.17189 21.9001C8.18185 20.9101 7.68646 20.4143 7.50099 19.8435C7.33797 19.3415 7.33789 18.8005 7.50099 18.2986C7.64013 17.8704 7.95376 17.4849 8.51954 16.9011L9.17189 16.2429C10.1619 15.2529 10.6567 14.7575 11.2275 14.572ZM12.541 15.2859C12.1895 15.1717 11.8105 15.1717 11.459 15.2859C11.3054 15.3359 11.1257 15.4374 10.8428 15.6775C10.5527 15.9237 10.2059 16.2694 9.70216 16.7732C9.19839 17.2769 8.85272 17.6237 8.60646 17.9138C8.36634 18.1967 8.26485 18.3764 8.21486 18.53C8.10066 18.8815 8.10066 19.2606 8.21486 19.612C8.26482 19.7658 8.36594 19.9459 8.60646 20.2292C8.85268 20.5193 9.19851 20.8652 9.70216 21.3689C10.2059 21.8726 10.5527 22.2183 10.8428 22.4646C11.1259 22.7049 11.3053 22.8071 11.459 22.8571C11.8104 22.9713 12.1896 22.9713 12.541 22.8571C12.6948 22.8072 12.8748 22.7051 13.1582 22.4646C13.4482 22.2183 13.7942 21.8725 14.2978 21.3689C14.8015 20.8652 15.1473 20.5193 15.3935 20.2292C15.6341 19.9458 15.7362 19.7658 15.7861 19.612C15.9003 19.2606 15.9003 18.8815 15.7861 18.53C15.7361 18.3764 15.6339 18.1969 15.3935 17.9138C15.1473 17.6237 14.8016 17.2769 14.2978 16.7732C13.7942 16.2695 13.4482 15.9237 13.1582 15.6775C12.8749 15.437 12.6947 15.3358 12.541 15.2859Z"
            fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_5_hd9aobnir)"
          />
          <defs>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_0_qf1mq0j5t"
              x1={12}
              y1="3.429"
              x2={12}
              y2="20.571"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(87, 87, 87, 1)" data-glass-11="on" />
              <stop
                offset={1}
                stopColor="rgba(21, 21, 21, 1)"
                data-glass-12="on"
              />
            </linearGradient>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_1_pkgkeso4v"
              x1="4.929"
              y1="7.379"
              x2="4.929"
              y2="16.621"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(87, 87, 87, 1)" data-glass-11="on" />
              <stop
                offset={1}
                stopColor="rgba(21, 21, 21, 1)"
                data-glass-12="on"
              />
            </linearGradient>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_2_2zdns40c4"
              x1="19.071"
              y1="7.379"
              x2="19.071"
              y2="16.621"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(87, 87, 87, 1)" data-glass-11="on" />
              <stop
                offset={1}
                stopColor="rgba(21, 21, 21, 1)"
                data-glass-12="on"
              />
            </linearGradient>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_3_kgwd6nmd1"
              x1={12}
              y1=".307"
              x2={12}
              y2="23.693"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(227, 227, 229, 0.6)" data-glass-21="on" />
              <stop
                offset={1}
                stopColor="rgba(187, 187, 192, 0.6)"
                data-glass-22="on"
              />
            </linearGradient>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_4_hko5sccr7"
              x1={12}
              y1=".308"
              x2={12}
              y2="5.66"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(255, 255, 255, 1)" data-glass-light="on" />
              <stop
                offset={1}
                stopColor="rgba(255, 255, 255, 1)"
                stopOpacity={0}
                data-glass-light="on"
              />
            </linearGradient>
            <linearGradient
              id="f64qxknsftn-1760519092851-5435590_connections_existing_5_hd9aobnir"
              x1={12}
              y1="14.45"
              x2={12}
              y2="19.802"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(255, 255, 255, 1)" data-glass-light="on" />
              <stop
                offset={1}
                stopColor="rgba(255, 255, 255, 1)"
                stopOpacity={0}
                data-glass-light="on"
              />
            </linearGradient>
            <filter
              id="f64qxknsftn-1760519092851-5435590_connections_filter_agfzbhgkx"
              x="-100%"
              y="-100%"
              width="400%"
              height="400%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
            >
              <feGaussianBlur
                stdDeviation={2}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                in="SourceGraphic"
                edgeMode="none"
                result="blur"
              />
            </filter>
            <clipPath id="f64qxknsftn-1760519092851-5435590_connections_clipPath_rqrz4qz17">
              <path
                d="M11.2273 14.572C11.7293 14.4089 12.2702 14.409 12.7722 14.572C13.343 14.7575 13.8388 15.2529 14.8289 16.2429C15.8186 17.2327 16.3133 17.7278 16.4988 18.2986C16.6619 18.8007 16.6619 19.3414 16.4988 19.8435C16.3133 20.4143 15.8187 20.9094 14.8289 21.8992C13.8388 22.8892 13.343 23.3846 12.7722 23.5701C12.2702 23.7331 11.7293 23.7332 11.2273 23.5701C10.6565 23.3846 10.1616 22.8891 9.17163 21.8992C8.18166 20.9092 7.6862 20.4143 7.50073 19.8435C7.33765 19.3415 7.33766 18.8006 7.50073 18.2986C7.6862 17.7278 8.18167 17.2329 9.17163 16.2429C10.1616 15.253 10.6565 14.7575 11.2273 14.572ZM11.2273 0.43042C11.7294 0.267292 12.2702 0.267327 12.7722 0.43042C13.343 0.615891 13.8388 1.1103 14.8289 2.10034C15.8186 3.09006 16.3132 3.58538 16.4988 4.15601C16.6619 4.65811 16.6619 5.1998 16.4988 5.7019C16.3132 6.27252 15.8186 6.76785 14.8289 7.75757C13.8388 8.74761 13.343 9.24202 12.7722 9.42749C12.2702 9.59058 11.7293 9.59062 11.2273 9.42749C10.6566 9.24196 10.1614 8.74737 9.17163 7.75757C8.18176 6.7677 7.68628 6.2726 7.50073 5.7019C7.33759 5.1998 7.33759 4.65811 7.50073 4.15601C7.68627 3.5853 8.18174 3.09023 9.17163 2.10034C10.1614 1.11053 10.6566 0.615952 11.2273 0.43042Z"
                fill="url(#f64qxknsftn-1760519092851-5435590_connections_existing_3_kgwd6nmd1)"
              />
            </clipPath>
            <mask id="f64qxknsftn-1760519092851-5435590_connections_mask_x28wanw39">
              <rect width="100%" height="100%" fill="#FFF" />
              <path
                d="M11.2273 14.572C11.7293 14.4089 12.2702 14.409 12.7722 14.572C13.343 14.7575 13.8388 15.2529 14.8289 16.2429C15.8186 17.2327 16.3133 17.7278 16.4988 18.2986C16.6619 18.8007 16.6619 19.3414 16.4988 19.8435C16.3133 20.4143 15.8187 20.9094 14.8289 21.8992C13.8388 22.8892 13.343 23.3846 12.7722 23.5701C12.2702 23.7331 11.7293 23.7332 11.2273 23.5701C10.6565 23.3846 10.1616 22.8891 9.17163 21.8992C8.18166 20.9092 7.6862 20.4143 7.50073 19.8435C7.33765 19.3415 7.33766 18.8006 7.50073 18.2986C7.6862 17.7278 8.18167 17.2329 9.17163 16.2429C10.1616 15.253 10.6565 14.7575 11.2273 14.572ZM11.2273 0.43042C11.7294 0.267292 12.2702 0.267327 12.7722 0.43042C13.343 0.615891 13.8388 1.1103 14.8289 2.10034C15.8186 3.09006 16.3132 3.58538 16.4988 4.15601C16.6619 4.65811 16.6619 5.1998 16.4988 5.7019C16.3132 6.27252 15.8186 6.76785 14.8289 7.75757C13.8388 8.74761 13.343 9.24202 12.7722 9.42749C12.2702 9.59058 11.7293 9.59062 11.2273 9.42749C10.6566 9.24196 10.1614 8.74737 9.17163 7.75757C8.18176 6.7677 7.68628 6.2726 7.50073 5.7019C7.33759 5.1998 7.33759 4.65811 7.50073 4.15601C7.68627 3.5853 8.18174 3.09023 9.17163 2.10034C10.1614 1.11053 10.6566 0.615952 11.2273 0.43042Z"
                fill="#000"
              />
            </mask>
          </defs>
        </g>
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Fixed: Use a stable random value per mount, avoiding impure calls in render.
  const [width] = React.useState(
    () => `${Math.floor(Math.random() * 40) + 50}%`
  );

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

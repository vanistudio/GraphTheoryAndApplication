"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-dashed px-4 sticky top-0 bg-background z-50">
      <SidebarTrigger
        data-slot="sidebar-trigger"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent/50 hover:text-accent-foreground size-9 h-7 w-7 cursor-pointer"
      >
        <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <g fill="#737373">
            <path d="M10.46 1.82699L15.67 4.23099C16.024 4.39399 16.251 4.74899 16.251 5.13899V12.859C16.251 13.249 16.024 13.604 15.67 13.767L10.46 16.171C10.129 16.324 9.75 16.082 9.75 15.717V2.28099C9.75 1.91599 10.128 1.67399 10.46 1.82699Z" fill="#737373" fillOpacity="0.3" stroke="none" />
            <path d="M3.25 12.25L2.408 12.531C2.084 12.639 1.75 12.398 1.75 12.057V5.94398C1.75 5.60298 2.084 5.36198 2.408 5.46998L3.25 5.75098" fill="none" stroke="#737373" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
            <path d="M7.25 14.125L6.442 14.462C6.113 14.599 5.75 14.357 5.75 14V4.00001C5.75 3.64301 6.113 3.40101 6.442 3.53801L7.25 3.87501" fill="none" stroke="#737373" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
            <path d="M10.46 1.82699L15.67 4.23099C16.024 4.39399 16.251 4.74899 16.251 5.13899V12.859C16.251 13.249 16.024 13.604 15.67 13.767L10.46 16.171C10.129 16.324 9.75 16.082 9.75 15.717V2.28099C9.75 1.91599 10.128 1.67399 10.46 1.82699Z" fill="none" stroke="#737373" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
          </g>
        </svg>
        <span className="sr-only">Toggle Sidebar</span>
      </SidebarTrigger>
      <div className="flex items-center gap-2">
        <Link href="//github.com/vanistudio/GraphTheoryAndApplication" target="_blank">
          <Button
            variant="secondary"
            size="sm"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 px-4 py-2 has-[>svg]:px-3 h-7 cursor-pointer"
          >
            <span className="text-xs">Star Github</span>
            <Github className="size-3" />
          </Button>
        </Link>
        <Link href="//facebook.com/vanixjnk" target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground px-4 py-2 has-[>svg]:px-3 h-7 cursor-pointer"
          >
            <span className="text-xs">Creator</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
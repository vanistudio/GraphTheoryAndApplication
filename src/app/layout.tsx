import type { Metadata } from "next";
import { Signika, Doto } from "next/font/google";
import "./globals.css";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import SidebarContent from "@/components/layouts/Sidebar";
import Header from "@/components/layouts/Header";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const signika = Signika({
  subsets: ["latin"],
  variable: "--font-signika",
});

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
});

export const metadata: Metadata = {
  title: "Graph Theory Delivery Optimizer",
  description: "Ứng dụng tối ưu lịch trình giao hàng sử dụng lý thuyết đồ thị",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${signika.variable} ${doto.variable} antialiased font-sans tracking-tight`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SidebarProvider>
            <Sidebar>
              <SidebarContent />
            </Sidebar>
            <main
              data-slot="sidebar-inset"
              className="bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2"
            >
              <Header />
              <div className="p-6 w-full">
                {children}
              </div>
            </main>
          </SidebarProvider>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}

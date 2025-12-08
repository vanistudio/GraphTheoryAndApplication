"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { Settings, User, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

export default function SettingsPage() {
  const session = authClient.useSession();

  if (!session.data?.user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className={`border border-border ${customButtonShadow}`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-md border border-border bg-background">
                  <Settings className="h-6 w-6" />
                </div>
                <p className="text-muted-foreground">
                  Vui lòng đăng nhập để xem cài đặt
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6 space-y-4 lg:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 lg:space-y-6"
      >
        <div className="flex items-center gap-3 pb-2">
          <div className="p-2 rounded-md border border-border bg-background">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold">Cài đặt</h1>
        </div>

        <Card className={`border border-border ${customButtonShadow}`}>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md border border-border bg-background">
                <User className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={session.data.user.email || ""}
                disabled
                className={customButtonShadow}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Tên
              </Label>
              <Input
                id="name"
                type="text"
                value={session.data.user.name || ""}
                disabled
                className={customButtonShadow}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={`border border-border ${customButtonShadow}`}>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md border border-border bg-background">
                <MapPin className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">Cài đặt đồ thị</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultZoom" className="text-sm font-medium">
                Mức zoom mặc định
              </Label>
              <Input
                id="defaultZoom"
                type="number"
                defaultValue={13}
                min={1}
                max={18}
                className={customButtonShadow}
              />
              <p className="text-xs text-muted-foreground">
                Mức zoom khi khởi tạo đồ thị (1-18)
              </p>
            </div>
            <Button
              variant="outline"
              className={`w-full sm:w-auto ${customButtonShadow}`}
              onClick={() => toast.success("Đã lưu cài đặt")}
            >
              Lưu cài đặt
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


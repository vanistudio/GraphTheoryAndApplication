"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const session = authClient.useSession();

  if (!session.data?.user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <p className="text-center text-white/70">
              Vui lòng đăng nhập để xem cài đặt
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <div className="space-y-4 p-6 pt-0">
              <div>
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={session.data.user.email || ""}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="name">
                  Tên
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={session.data.user.name || ""}
                  disabled
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bản đồ</CardTitle>
            </CardHeader>
            <div className="space-y-4 p-6 pt-0">
              <div>
                <Label htmlFor="defaultZoom">
                  Mức zoom mặc định
                </Label>
                <Input
                  id="defaultZoom"
                  type="number"
                  defaultValue={13}
                  min={1}
                  max={18}
                />
              </div>
            </div>
          </Card>
        </div>
  );
}


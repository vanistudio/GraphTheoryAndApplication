"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        toast.error(result.error.message || "Đăng ký thất bại");
      } else {
        toast.success("Đăng ký thành công!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className={`border border-border ${customButtonShadow}`}>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md border border-border bg-background">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl lg:text-2xl">Đăng ký</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Tạo tài khoản mới để bắt đầu
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Tên
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tên của bạn"
                  className={customButtonShadow}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className={customButtonShadow}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className={customButtonShadow}
                />
                <p className="text-xs text-muted-foreground">
                  Mật khẩu phải có ít nhất 8 ký tự
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                variant="outline"
                className={`w-full h-11 ${customButtonShadow}`}
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
              <p className="text-sm text-center text-muted-foreground pt-2">
                Đã có tài khoản?{" "}
                <Link 
                  href="/login" 
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  Đăng nhập
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
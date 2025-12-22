"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

const members = [
  {
    id: 1,
    name: "Nguyễn Đình Bảo",
    studentId: "50.01.104.013",
    department: "Công nghệ thông tin",
    role: "Thiết kế giao diện",
  },
  {
    id: 2,
    name: "Phan Phước Đông Triều",
    studentId: "50.01.104.168",
    department: "Công nghệ thông tin",
    role: "Logic thuật toán",
  },
  {
    id: 3,
    name: "Lê Việt Phương",
    studentId: "50.01.104.124",
    department: "Công nghệ thông tin",
    role: "Kiểm thử và báo cáo",
  },
  {
    id: 4,
    name: "Trương Minh Mẫn",
    studentId: "50.01.104.087",
    department: "Công nghệ thông tin",
    role: "Kiểm thử và báo cáo",
  },
  {
    id: 5,
    name: "Đặng Lê Minh Lâm",
    studentId: "50.01.104. 083",
    department: "Công nghệ thông tin",
    role: "Kiểm thử và báo cáo",
  },
];

export default function MembersPage() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <Card
        className={`h-full flex flex-col border border-border ${customButtonShadow}`}
      >
        <CardHeader className="border-b border-border pb-2 lg:pb-3 px-3 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <Users className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm lg:text-lg truncate">
                  Thành viên
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                  Danh sách các thành viên tham gia phát triển đồ án
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{members.length} thành viên</span>
                <span className="sm:hidden">{members.length}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-3 lg:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                   <Card className={`border border-border ${customButtonShadow}`}>
                     <CardHeader className="pb-3">
                       <CardTitle className="text-base font-semibold">
                         {member.name}
                       </CardTitle>
                       <CardDescription className="text-sm space-y-1">
                         <p className="font-medium text-foreground">{member.role}</p>
                         <p className="text-xs text-muted-foreground">
                           MSSV: {member.studentId}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {member.department}
                         </p>
                       </CardDescription>
                     </CardHeader>
                   </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {members.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">
                Chưa có thành viên nào
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


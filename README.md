This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Cấu hình API Key (Tùy chọn)

Ứng dụng sử dụng 3 phương án để lấy đường đi:
1. **OpenRouteService** (ưu tiên) - Cần API key miễn phí
2. **OSRM** (dự phòng) - Public server, có thể chậm
3. **Khoảng cách đường chim bay** (fallback) - Luôn hoạt động

Để sử dụng OpenRouteService (khuyến nghị):
1. Đăng ký tài khoản miễn phí tại: https://openrouteservice.org/dev/#/signup
2. Lấy API key từ dashboard
3. Tạo file `.env.local` trong thư mục gốc:
```env
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=your_api_key_here
```

Nếu không có API key, ứng dụng sẽ tự động dùng OSRM hoặc fallback về khoảng cách đường chim bay.

### Chạy ứng dụng

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

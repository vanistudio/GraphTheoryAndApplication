# ỨNG DỤNG TÔ MÀU ĐỒ THỊ ĐỂ SẮP XẾP LỊCH TRÌNH GIAO HÀNG TỐI ƯU CHO SHIPPER

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-cyan?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)
![WebAssembly](https://img.shields.io/badge/WebAssembly-C%2B%2B-FF6B6B?style=flat-square)

**Ứng dụng web tối ưu hóa lịch trình giao hàng sử dụng thuật toán đồ thị**

[Live Demo](http://160.250.137.45:3300)

</div>

## Công nghệ sử dụng

| Phần | Công nghệ |
|------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **UI Components** | ShadCN UI, Radix UI, Lucide Icons |
| **Trực quan hóa** | React Flow, Recharts, Leaflet |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB + Mongoose |
| **Thuật toán** | TypeScript + WebAssembly (C++/Emscripten) |
| **Build Tools** | Webpack, Emscripten, PostCSS |

---

## Cài đặt Node.js

### **Cách 1: Docker (Khuyến nghị cho Windows)**

```bash
docker pull node:24-alpine
docker run -it --rm --entrypoint sh node:24-alpine
node -v
npm -v
```
---

### **Cách 2: Installer Windows (.MSI)**

Cài đặt **[Download Node.js v24.12.0 LTS](https://nodejs.org/dist/v24.12.0/node-v24.12.0-x64.msi)**

1. Tải file `.msi`
2. Chạy installer
3. Follow the wizard
4. Kiểm tra: `node -v` & `npm -v`

---

### **Cách 3: NVM cho Linux/macOS**

```bash
# Cài đặt NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Load NVM
\. "$HOME/.nvm/nvm.sh"

# Cài Node.js phiên bản 24
nvm install 24

# Kiểm tra
node -v
npm -v
```

---

## Hướng dẫn chạy

### 1. **Cài đặt dependencies**
```bash
npm install
```

### 2. **Build WebAssembly (nếu cần)**
```bash
# Build WASM tối ưu (production)
npm run build:wasm

# Build WASM nhanh (development)
npm run build:wasm:fast
```

### 3. **Build & Chạy ứng dụng**
```bash
# Production build
npm run build
npm start

# Development mode (hot reload)
npm run dev
```

### 4. **Truy cập ứng dụng**
Mở trình duyệt tại: **[http://localhost:3000](http://localhost:3000)**
---

##  Scripts có sẵn

```bash
npm run dev
npm run build
npm start
npm run build:wasm
npm run build:wasm:fast
npm run lint
```
---

## Cấu hình (Tùy chọn)
### OpenRouteService API (cho bản đồ)
```bash
# Đăng ký: https://openrouteservice.org/dev/#/signup
echo "NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=your_api_key" >> .env.local
```
</div>
Tuyệt vời luôn, Vani 😎
Dưới đây là **mô tả chi tiết đầy đủ, chuyên nghiệp và hoàn chỉnh** cho **project của bạn** — ứng dụng tô màu đồ & tối ưu lịch trình giao hàng, sử dụng **Next.js + Tailwind + ShadCN + MongoDB + BetterAuth**.

Phần này bạn có thể dùng **làm tài liệu mô tả đồ án / báo cáo / README chính thức** luôn 💯

---

# 🚚 ỨNG DỤNG TÔ MÀU ĐỒ TỐI ƯU LỊCH TRÌNH GIAO HÀNG CHO SHIPPER

### (Sử dụng thuật toán đồ thị và công nghệ web hiện đại)

---

## 🧩 1. Mục tiêu dự án

Dự án nhằm xây dựng **một ứng dụng web trực quan** giúp mô phỏng và tối ưu **lịch trình giao hàng** cho các shipper dựa trên **lý thuyết đồ thị**.

Ứng dụng cho phép người dùng:

* Vẽ **đồ thị các địa điểm giao hàng** (đỉnh là địa điểm, cạnh là đường đi).
* Chạy và trực quan hoá các **thuật toán đồ thị** như:

  * **Dijkstra / Bellman-Ford:** tìm đường ngắn nhất.
  * **Kruskal / Prim:** tạo cây khung nhỏ nhất.
  * **Graph Coloring:** phân vùng giao hàng cho từng shipper.
* Lưu lại **đồ thị và kết quả tính toán** trong **MongoDB**.
* Đăng nhập bằng **BetterAuth** để quản lý, xem lịch sử, và tạo đồ thị riêng.

---

## ⚙️ 2. Công nghệ sử dụng

| Thành phần                    | Công nghệ                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ |
| **Framework chính**           | [Next.js 15 (App Router, TypeScript)](https://nextjs.org/)                     |
| **Giao diện người dùng (UI)** | [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/) |
| **Cơ sở dữ liệu**             | [MongoDB](https://www.mongodb.com/) (Mongoose ODM)                             |
| **Xác thực người dùng**       | [BetterAuth](https://betterauth.dev/) (modern Next.js auth)                    |
| **Triển khai thuật toán**     | TypeScript module nội bộ trong `/lib/`                                         |
| **Biểu diễn đồ thị**          | React Flow hoặc custom SVG canvas                                              |
| **Triển khai**                | Vercel hoặc VPS Ubuntu                                                         |
| **Thuật toán chính**          | Dijkstra, Bellman-Ford, Kruskal, Prim, Graph Coloring                          |

---

## 🧠 3. Ý tưởng cốt lõi

Trong mô hình giao hàng, ta có:

* Mỗi **địa điểm** (node) là một nơi cần giao hàng.
* Các **đường đi** (edges) có trọng số biểu thị **thời gian hoặc khoảng cách**.
* Hệ thống tìm ra **lộ trình ngắn nhất**, hoặc **chia vùng shipper hợp lý** bằng **tô màu đồ thị**.

💡 Ứng dụng này kết hợp giữa **Lý thuyết Đồ thị** và **Công nghệ Web hiện đại** để giúp người học và nhà quản lý **hiểu trực quan** cách tối ưu hóa giao hàng.

---

## 🧭 4. Chức năng chính

### 👤 Người dùng (BetterAuth)

* Đăng ký / đăng nhập bằng email & mật khẩu (hoặc OAuth nếu muốn).
* Mỗi tài khoản có thể tạo, lưu và xem các đồ thị riêng.

### 🗺️ Đồ thị giao hàng

* Tạo node (địa điểm) bằng giao diện kéo thả.
* Tạo cạnh (đường đi) giữa hai địa điểm, nhập trọng số.
* Xóa hoặc chỉnh sửa node / edge.

### ⚙️ Chạy thuật toán

* Chọn thuật toán muốn chạy:

  * **Dijkstra:** tìm đường đi ngắn nhất từ một điểm nguồn.
  * **Bellman-Ford:** xử lý cả cạnh trọng số âm.
  * **Kruskal / Prim:** tạo cây khung nhỏ nhất (MST).
  * **Graph Coloring:** tô màu các khu vực cho shipper.
* Kết quả được hiển thị bằng **đồ thị trực quan**, có highlight đường đi, node, và chi tiết trong bảng.

### 💾 Lưu dữ liệu

* Lưu đồ thị và kết quả thuật toán vào MongoDB.
* Mỗi bản ghi có thông tin: tên đồ thị, ngày tạo, người sở hữu, thuật toán, kết quả.

### 📊 Lịch sử và báo cáo

* Xem lại danh sách các đồ thị đã lưu.
* Nhấn vào từng đồ thị để xem kết quả đã chạy trước đó.

---
## 🔐 7. Xác thực người dùng với BetterAuth

BetterAuth là hệ thống xác thực hiện đại cho Next.js App Router, thay thế NextAuth.

### Workflow:

1. Người dùng đăng ký / đăng nhập qua form ShadCN (`/auth/register`, `/auth/login`).
2. BetterAuth xử lý JWT + session tự động.
3. Khi gọi API `/api/graph/...`, token được xác thực trước khi cho phép truy cập.

**Ví dụ:**
Chỉ người dùng đã đăng nhập mới có thể gọi:

```
POST /api/graphs (tạo đồ thị)
GET /api/graphs (lấy danh sách đồ thị của tôi)
```

---

## 🧩 8. Thuật toán triển khai (trong `/lib`)

| Thuật toán         | Ứng dụng                                              |
| ------------------ | ----------------------------------------------------- |
| **Dijkstra**       | Tìm đường ngắn nhất cho 1 shipper                     |
| **Bellman-Ford**   | Tối ưu lộ trình khi có đường ưu tiên (trọng số âm)    |
| **Kruskal / Prim** | Tạo cây khung nhỏ nhất (giảm tổng chi phí vận chuyển) |
| **Graph Coloring** | Chia khu vực giao hàng cho shipper (mỗi khu 1 màu)    |

Kết quả được render trực quan bằng `ResultGraph` và `ScheduleTable`.

---

## 🎨 9. Giao diện đề xuất

### Màn hình chính

| Thành phần        | Mô tả                                                             |
| ----------------- | ----------------------------------------------------------------- |
| **GraphEditor**   | Kéo thả node, vẽ edge, nhập trọng số                              |
| **ControlPanel**  | Chọn thuật toán, điểm bắt đầu, nút "Tính toán"                    |
| **ResultGraph**   | Hiển thị kết quả trực quan (đường đi tô sáng, node màu khác nhau) |
| **ScheduleTable** | Hiển thị bảng kết quả và chi tiết tuyến đường                     |

---

## ⚡ 10. Quy trình hoạt động tổng thể

```text
[Người dùng đăng nhập]
        ↓
[Tạo đồ thị giao hàng mới]
        ↓
[Chọn thuật toán → Gửi dữ liệu đến API /api/graph/:algo]
        ↓
[Server chạy thuật toán (lib/*.ts)]
        ↓
[Kết quả trả về JSON → hiển thị trực quan]
        ↓
[Lưu kết quả vào MongoDB (nếu người dùng đã đăng nhập)]
        ↓
[Dashboard hiển thị lịch sử đồ thị & kết quả]
```

---

## 💡 11. Lợi ích & Ứng dụng thực tế

* Giúp **sinh viên** hiểu rõ các thuật toán đồ thị qua mô phỏng thực tế.
* Giúp **quản lý giao hàng** thấy rõ cách hệ thống tối ưu lộ trình.
* Có thể mở rộng thành **ứng dụng thực tế**: tối ưu phân tuyến giao hàng, chia ca, lập kế hoạch giao vận.

---

## 🚀 12. Hướng phát triển mở rộng

* Tích hợp **Google Maps API** để lấy khoảng cách thật.
* Thêm **chế độ nhiều shipper chạy song song**.
* Xuất lịch trình ra **file PDF / CSV**.
* Cải thiện **trực quan đồ thị** bằng D3.js hoặc React Flow nâng cao.
* Hệ thống **thống kê biểu đồ** (tổng thời gian, chi phí, độ bao phủ khu vực).

---

## ✅ 13. Tóm tắt

| Hạng mục      | Công nghệ / Thuật toán                                |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 15 + TypeScript                               |
| UI            | Tailwind CSS + ShadCN UI                              |
| DB            | MongoDB (Mongoose)                                    |
| Auth          | BetterAuth                                            |
| Algorithms    | Dijkstra, Bellman-Ford, Kruskal, Prim, Graph Coloring |
| Visualization | React Flow / SVG                                      |
| Deploy        | Vercel hoặc VPS Ubuntu                                |

---
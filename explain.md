# GIẢI THÍCH THUẬT TOÁN TÔ MÀU ĐỒ THỊ PHÂN CHIA ĐƠN HÀNG CHO K-SHIPPER

## 📋 TỔNG QUAN

Hệ thống sử dụng **lý thuyết tô màu đồ thị** để phân chia đơn hàng cho nhiều shipper một cách tối ưu, đảm bảo các đơn hàng quá xa nhau sẽ được giao bởi các shipper khác nhau.

---

## 🔢 ĐẦU VÀO (INPUT)

### 1. Vị trí Shipper (k shipper)
- Người dùng nhập **k vị trí shipper** (k ≥ 1)
- Mỗi shipper có tọa độ địa lý: `[latitude, longitude]`
- Ví dụ: Shipper A tại [10.8231, 106.6297], Shipper B tại [10.7614, 106.6821]

### 2. Vị trí Điểm Giao Hàng (n đơn hàng)
- Người dùng nhập **n vị trí địa điểm giao hàng** (n ≥ 1)
- Mỗi điểm giao hàng có tọa độ địa lý: `[latitude, longitude]`
- Ví dụ: Đơn hàng 1 tại [10.7870, 106.6810], Đơn hàng 2 tại [10.8000, 106.7000]

### 3. Ngưỡng Xung Đột (Conflict Radius)
- Người dùng nhập **ngưỡng xung đột** (đơn vị: km)
- Đây là khoảng cách tối đa cho phép giữa 2 đơn hàng để chúng có thể được giao bởi cùng một shipper
- Ví dụ: Ngưỡng = 10 km

**Ý nghĩa:** Nếu 2 đơn hàng cách nhau > ngưỡng này, chúng **KHÔNG THỂ** được giao bởi cùng một shipper (vì quá xa, không hiệu quả).

---

## 🔄 QUY TRÌNH XỬ LÝ

### BƯỚC 1: Tính Khoảng Cách Đường Bộ

#### 1.1. Lấy Tọa Độ Từ OSM (OpenStreetMap)
- Hệ thống sử dụng **OpenStreetMap (OSM)** để lấy thông tin về đường bộ
- OSM cung cấp dữ liệu về:
  - Các tuyến đường thực tế
  - Các điểm giao nhau (ngã 3, ngã 4, ngã 5, ...)
  - Cấu trúc mạng lưới giao thông

#### 1.2. Tính Khoảng Cách Đường Bộ

**Phương pháp 3 tầng (Fallback):**

**Tầng 1: OpenRouteService API** (ưu tiên)
- Gọi API OpenRouteService để lấy khoảng cách đường bộ chính xác
- API này sử dụng dữ liệu OSM và tính toán dựa trên mạng lưới đường thực tế
- Trả về: Khoảng cách đường bộ (km) và geometry (đường đi chi tiết)

**Tầng 2: OSRM API** (dự phòng)
- Nếu OpenRouteService thất bại, sử dụng OSRM (Open Source Routing Machine)
- OSRM cũng sử dụng dữ liệu OSM
- Trả về: Khoảng cách đường bộ (km) và geometry

**Tầng 3: Công thức Haversine** (fallback cuối)
- Nếu cả 2 API đều thất bại, sử dụng công thức Haversine
- Tính khoảng cách "đường chim bay" (as the crow flies)
- **Công thức Haversine:**
  ```
  a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
  c = 2 × atan2(√a, √(1-a))
  distance = R × c
  
  Trong đó:
  - R = 6371 km (bán kính Trái Đất)
  - lat1, lat2: vĩ độ điểm 1 và 2 (radian)
  - lon1, lon2: kinh độ điểm 1 và 2 (radian)
  - Δlat = lat2 - lat1
  - Δlon = lon2 - lon1
  ```

**Kết quả:** Ma trận khoảng cách giữa tất cả các điểm (shipper + đơn hàng)

**Ví dụ:**
```
        Shipper A  Shipper B  Đơn 1  Đơn 2  Đơn 3
Shipper A    0        5.2      3.7    8.1    12.5
Shipper B   5.2       0        4.3    6.8    9.2
Đơn 1       3.7      4.3       0      4.5    7.8
Đơn 2       8.1      6.8      4.5    0      3.2
Đơn 3      12.5      9.2      7.8    3.2    0
```

---

### BƯỚC 2: Xây Dựng Đồ Thị Xung Đột (Conflict Graph)

#### 2.1. Khái Niệm Đồ Thị Xung Đột

**Đồ thị xung đột G' = (V, E):**
- **V (Vertices - Đỉnh):** Mỗi đơn hàng là một đỉnh
- **E (Edges - Cạnh):** Tạo cạnh giữa 2 đỉnh nếu chúng "xung đột"

#### 2.2. Điều Kiện Xung Đột

**Hai đơn hàng được coi là "xung đột" nếu:**
```
Khoảng cách giữa 2 đơn hàng > Ngưỡng xung đột
```

**Ví dụ:**
- Ngưỡng xung đột = 10 km
- Đơn hàng A và Đơn hàng B cách nhau 12 km → **XUNG ĐỘT** → Tạo cạnh
- Đơn hàng A và Đơn hàng C cách nhau 8 km → **KHÔNG XUNG ĐỘT** → Không tạo cạnh

#### 2.3. Ý Nghĩa

**Tại sao cần đồ thị xung đột?**
- Đảm bảo các đơn hàng quá xa nhau sẽ **KHÔNG** được giao bởi cùng một shipper
- Nếu 2 đơn hàng xung đột (có cạnh nối), chúng phải được giao bởi **2 shipper khác nhau**
- Điều này giúp tối ưu hiệu quả giao hàng (shipper không phải đi quá xa)

**Ví dụ minh họa:**
```
Đồ thị xung đột với ngưỡng = 10 km:

Đơn 1 ────── Đơn 2  (khoảng cách = 12 km > 10 km → xung đột)
  │
  │
Đơn 3        (khoảng cách = 8 km < 10 km → không xung đột)

→ Đơn 1 và Đơn 2 phải được giao bởi 2 shipper khác nhau
→ Đơn 3 có thể được giao bởi shipper bất kỳ
```

---

### BƯỚC 3: Thuật Toán Tô Màu Đồ Thị (Graph Coloring)

#### 3.1. Mục Đích

**Tô màu đồ thị** để phân chia đơn hàng thành các nhóm (màu), sao cho:
- Hai đơn hàng có cạnh nối (xung đột) phải có **màu khác nhau**
- Số lượng màu ≤ số lượng shipper (k)

#### 3.2. Thuật Toán Welsh-Powell + Greedy Coloring

**Bước 1: Tính bậc của mỗi đỉnh**
- Bậc (degree) = số lượng cạnh nối với đỉnh đó
- Đỉnh có bậc cao = có nhiều xung đột = cần ưu tiên tô màu trước

**Bước 2: Sắp xếp theo bậc giảm dần (Welsh-Powell)**
- Sắp xếp các đỉnh theo bậc từ cao xuống thấp
- Lý do: Tô màu các đỉnh có nhiều xung đột trước để tránh phải dùng nhiều màu

**Bước 3: Tô màu (Greedy Coloring)**
- Duyệt qua từng đỉnh theo thứ tự đã sắp xếp
- Với mỗi đỉnh:
  1. Tìm tất cả các màu đã được sử dụng bởi các đỉnh kề (có cạnh nối)
  2. Gán màu **nhỏ nhất** chưa được sử dụng
  3. Nếu không có màu nào khả dụng, tạo màu mới

**Ví dụ minh họa:**
```
Đồ thị xung đột:
Đơn 1 ────── Đơn 2
  │
  │
Đơn 3

Bước 1: Tính bậc
- Đơn 1: bậc = 2 (nối với Đơn 2 và Đơn 3)
- Đơn 2: bậc = 1 (nối với Đơn 1)
- Đơn 3: bậc = 1 (nối với Đơn 1)

Bước 2: Sắp xếp
[Đơn 1 (bậc 2), Đơn 2 (bậc 1), Đơn 3 (bậc 1)]

Bước 3: Tô màu
- Đơn 1: Màu 0 (chưa có đỉnh kề nào được tô)
- Đơn 2: Màu 1 (Đơn 1 đã dùng màu 0)
- Đơn 3: Màu 1 (Đơn 1 đã dùng màu 0, nhưng Đơn 2 cũng dùng màu 1 nhưng không kề)

Kết quả:
- Màu 0: [Đơn 1]
- Màu 1: [Đơn 2, Đơn 3]
```

#### 3.3. Gộp Nhóm Màu (Nếu Cần)

**Nếu số màu > số shipper (k):**
- Gộp các nhóm màu có khoảng cách trung bình gần nhau nhất
- Đảm bảo số nhóm màu cuối cùng ≤ k

**Ví dụ:**
- Có 5 màu nhưng chỉ có 3 shipper
- Gộp 2 nhóm màu có khoảng cách trung bình nhỏ nhất
- Kết quả: 3 nhóm màu (tương ứng 3 shipper)

---

### BƯỚC 4: Phân Bổ Đơn Hàng Cho Shipper

#### 4.1. Tìm Shipper Gần Nhất

**Với mỗi nhóm màu (nhóm đơn hàng):**
- Tính tổng khoảng cách từ mỗi shipper đến tất cả đơn hàng trong nhóm
- Chọn shipper có **tổng khoảng cách nhỏ nhất**

**Ví dụ:**
```
Nhóm màu 0: [Đơn 1, Đơn 2]

Tổng khoảng cách từ Shipper A:
- Shipper A → Đơn 1: 3.7 km
- Shipper A → Đơn 2: 8.1 km
- Tổng: 11.8 km

Tổng khoảng cách từ Shipper B:
- Shipper B → Đơn 1: 4.3 km
- Shipper B → Đơn 2: 6.8 km
- Tổng: 11.1 km

→ Chọn Shipper B (tổng khoảng cách nhỏ hơn)
```

#### 4.2. Kết Quả Phân Bổ

**Mỗi shipper được phân bổ một nhóm đơn hàng:**
- Shipper A → Nhóm màu 0: [Đơn 1, Đơn 3]
- Shipper B → Nhóm màu 1: [Đơn 2, Đơn 4]

**Đảm bảo:**
- Các đơn hàng xung đột (có cạnh nối) được giao bởi shipper khác nhau
- Mỗi shipper được phân bổ đơn hàng gần nhất với vị trí của họ

---

### BƯỚC 5: Tối Ưu Lộ Trình Cho Từng Shipper

#### 5.1. Nearest Neighbor Heuristic

**Mục đích:** Tìm tuyến đường ban đầu

**Thuật toán:**
1. Bắt đầu từ vị trí shipper
2. Luôn chọn đơn hàng **gần nhất** tiếp theo
3. Lặp lại cho đến khi đã giao hết đơn hàng

**Ví dụ:**
```
Shipper A → Đơn 1 (3.7 km) → Đơn 3 (4.5 km) → Đơn 2 (6.2 km)
Tổng: 14.4 km
```

#### 5.2. 2-Opt Improvement

**Mục đích:** Cải thiện tuyến đường ban đầu

**Thuật toán:**
1. Thử đảo ngược các đoạn con trong tuyến đường
2. Nếu khoảng cách giảm → Chấp nhận thay đổi
3. Lặp lại cho đến khi không còn cải thiện

**Ví dụ:**
```
Tuyến ban đầu: A → 1 → 3 → 2 (14.4 km)
Thử đảo: A → 3 → 1 → 2 (13.8 km) ← Tốt hơn!
Kết quả: A → 3 → 1 → 2 (13.8 km)
```

#### 5.3. Dijkstra Algorithm

**Mục đích:** Tìm đường đi chi tiết giữa các điểm liên tiếp

**Thuật toán:**
- Sử dụng Dijkstra để tìm đường đi ngắn nhất giữa 2 điểm
- Xét tất cả các điểm giao nhau (ngã 3, ngã 4, ngã 5, ...)
- Trả về đường đi chi tiết với geometry thực tế

**Ví dụ:**
```
Shipper A → Đơn 1:
- Đi qua ngã 3 → ngã 4 → ngã 5
- Khoảng cách: 3.7 km
- Geometry: [tọa độ các điểm trên đường]
```

---

## 📊 VÍ DỤ MINH HỌA ĐẦY ĐỦ

### Input:
- **k = 2 shipper:**
  - Shipper A: [10.8231, 106.6297]
  - Shipper B: [10.7614, 106.6821]
- **n = 4 đơn hàng:**
  - Đơn 1: [10.7870, 106.6810]
  - Đơn 2: [10.8000, 106.7000]
  - Đơn 3: [10.7500, 106.6500]
  - Đơn 4: [10.8200, 106.7200]
- **Ngưỡng xung đột:** 10 km

### Bước 1: Tính Khoảng Cách
```
        Shipper A  Shipper B  Đơn 1  Đơn 2  Đơn 3  Đơn 4
Shipper A    0        5.2      3.7    8.1    4.3   12.5
Shipper B   5.2       0        4.3    6.8    3.2    9.8
Đơn 1       3.7      4.3       0      4.5    3.8   11.2
Đơn 2       8.1      6.8      4.5    0      5.2    3.2
Đơn 3       4.3      3.2      3.8    5.2    0      8.5
Đơn 4      12.5      9.8     11.2    3.2    8.5    0
```

### Bước 2: Xây Dựng Đồ Thị Xung Đột (ngưỡng = 10 km)
```
Các cạnh xung đột:
- Đơn 1 ────── Đơn 4 (11.2 km > 10 km)
- Đơn 2 ────── Đơn 4 (3.2 km < 10 km → không xung đột)
- Shipper A ── Đơn 4 (12.5 km > 10 km → không tính, vì đây là shipper)

Đồ thị xung đột:
Đơn 1 ────── Đơn 4
```

### Bước 3: Tô Màu Đồ Thị
```
Bậc:
- Đơn 1: bậc = 1 (nối với Đơn 4)
- Đơn 2: bậc = 0
- Đơn 3: bậc = 0
- Đơn 4: bậc = 1 (nối với Đơn 1)

Sắp xếp: [Đơn 1, Đơn 4, Đơn 2, Đơn 3]

Tô màu:
- Đơn 1: Màu 0
- Đơn 4: Màu 1 (Đơn 1 đã dùng màu 0)
- Đơn 2: Màu 0 (không xung đột với Đơn 1)
- Đơn 3: Màu 0 (không xung đột với Đơn 1)

Kết quả:
- Màu 0: [Đơn 1, Đơn 2, Đơn 3]
- Màu 1: [Đơn 4]
```

### Bước 4: Phân Bổ Cho Shipper
```
Nhóm màu 0: [Đơn 1, Đơn 2, Đơn 3]
- Shipper A: 3.7 + 8.1 + 4.3 = 16.1 km
- Shipper B: 4.3 + 6.8 + 3.2 = 14.3 km
→ Chọn Shipper B

Nhóm màu 1: [Đơn 4]
- Shipper A: 12.5 km
- Shipper B: 9.8 km
→ Chọn Shipper B (nhưng đã được phân bổ nhóm 0)
→ Chọn Shipper A

Kết quả:
- Shipper A → [Đơn 4]
- Shipper B → [Đơn 1, Đơn 2, Đơn 3]
```

### Bước 5: Tối Ưu Lộ Trình

**Shipper A:**
- Route: A → Đơn 4
- Khoảng cách: 12.5 km

**Shipper B:**
- Nearest Neighbor: B → Đơn 3 (3.2 km) → Đơn 1 (3.8 km) → Đơn 2 (4.5 km)
- Tổng: 11.5 km
- 2-Opt: Không cải thiện được
- Route: B → Đơn 3 → Đơn 1 → Đơn 2
- Khoảng cách: 11.5 km

**Tổng khoảng cách:** 12.5 + 11.5 = 24.0 km

---

## 🎯 KẾT QUẢ

### Output:
- **Phân chia đơn hàng:**
  - Shipper A: [Đơn 4]
  - Shipper B: [Đơn 3, Đơn 1, Đơn 2]

- **Lộ trình tối ưu:**
  - Shipper A: A → Đơn 4 (12.5 km)
  - Shipper B: B → Đơn 3 → Đơn 1 → Đơn 2 (11.5 km)

- **Tổng khoảng cách:** 24.0 km

### Đảm Bảo:
✅ Các đơn hàng xung đột (Đơn 1 và Đơn 4) được giao bởi shipper khác nhau  
✅ Mỗi shipper có lộ trình tối ưu (ngắn nhất)  
✅ Sử dụng khoảng cách đường bộ thực tế (từ OSM)  
✅ Tối ưu hóa bằng 2-opt và Dijkstra  

---

## 🔑 ĐIỂM QUAN TRỌNG

### 1. Ngưỡng Xung Đột
- **Ngưỡng nhỏ** (ví dụ: 5 km): Nhiều đơn hàng bị coi là xung đột → Cần nhiều shipper hơn
- **Ngưỡng lớn** (ví dụ: 20 km): Ít đơn hàng bị coi là xung đột → Có thể gộp nhiều đơn hàng cho 1 shipper

### 2. Khoảng Cách Đường Bộ
- Sử dụng dữ liệu OSM để tính khoảng cách thực tế
- Xét tất cả các điểm giao nhau (ngã 3, ngã 4, ngã 5, ...)
- Chính xác hơn khoảng cách "đường chim bay"

### 3. Tô Màu Đồ Thị
- Đảm bảo các đơn hàng xung đột có màu khác nhau
- Số màu tối thiểu = Số shipper cần thiết
- Sử dụng Welsh-Powell để giảm số màu

### 4. Phân Bổ Shipper
- Mỗi nhóm màu được gán cho shipper gần nhất
- Tính tổng khoảng cách để chọn shipper tối ưu
- Đảm bảo công bằng và hiệu quả

---

## 📈 ĐỘ PHỨC TẠP

- **Tính khoảng cách:** O(n²) với n = số điểm
- **Xây dựng đồ thị xung đột:** O(n²)
- **Tô màu đồ thị:** O(n²) trong trường hợp xấu nhất
- **Phân bổ shipper:** O(k × n) với k = số shipper
- **Tối ưu lộ trình:** O(n²) cho Nearest Neighbor + O(n²) cho 2-opt

**Tổng độ phức tạp:** O(n²) trong hầu hết trường hợp

---

## ✅ KẾT LUẬN

Hệ thống sử dụng **lý thuyết tô màu đồ thị** để phân chia đơn hàng một cách thông minh:
1. ✅ Tính khoảng cách đường bộ chính xác từ OSM
2. ✅ Xây dựng đồ thị xung đột dựa trên ngưỡng
3. ✅ Tô màu đồ thị để phân nhóm đơn hàng
4. ✅ Phân bổ mỗi nhóm cho shipper gần nhất
5. ✅ Tối ưu lộ trình cho từng shipper

Đảm bảo hiệu quả, công bằng và tối ưu cho bài toán phân chia đơn hàng cho k-shipper.


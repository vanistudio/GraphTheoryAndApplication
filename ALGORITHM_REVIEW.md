# BÁO CÁO KIỂM TRA THUẬT TOÁN LÝ THUYẾT ĐỒ THỊ

## 📋 YÊU CẦU ĐỀ TÀI

**Đề tài:** "Tô màu đồ thị để sắp xếp lịch trình giao hàng tối ưu cho shipper"

**Yêu cầu:**
1. Phân chia đơn hàng cho k-shipper bằng cách áp dụng lý thuyết Tô màu đồ thị để phân cụm (Clustering)
2. Sử dụng Dijkstra/2-opt để tìm đường
3. Xây dựng đồ thị xung đột (Conflict Graph)
4. Thuật toán tô màu đồ thị (Greedy Coloring với Welsh-Powell)

---

## ✅ CÁC THUẬT TOÁN LÝ THUYẾT ĐỒ THỊ ĐÃ SỬ DỤNG

### 1. **Xây dựng Đồ thị Xung đột (Conflict Graph)** ✅
**Vị trí:** `buildConflictGraph()` (dòng 681-705)

**Mô tả:**
- Mỗi đơn hàng là một đỉnh (vertex)
- Tạo cạnh (edge) giữa hai đỉnh nếu khoảng cách > conflictRadius
- Đảm bảo các đơn hàng quá xa nhau sẽ không được giao bởi cùng một shipper

**Code:**
```typescript
const buildConflictGraph = (
  deliveryPoints: Array<{ id: string; position: [number, number] }>,
  distanceMatrix: number[][],
  pointIndexMap: Map<string, number>,
  conflictRadius: number
): { nodes: string[]; edges: Array<[string, string]> } => {
  const nodes = deliveryPoints.map(p => p.id);
  const edges: Array<[string, string]> = [];
  
  for (let i = 0; i < deliveryPoints.length; i++) {
    for (let j = i + 1; j < deliveryPoints.length; j++) {
      const idx1 = pointIndexMap.get(deliveryPoints[i].id)!;
      const idx2 = pointIndexMap.get(deliveryPoints[j].id)!;
      const distance = distanceMatrix[idx1][idx2];
      
      // Tạo cạnh nếu khoảng cách > conflictRadius
      if (distance > conflictRadius) {
        edges.push([deliveryPoints[i].id, deliveryPoints[j].id]);
      }
    }
  }
  
  return { nodes, edges };
};
```

**Đánh giá:** ✅ **ĐÚNG** - Đây là thuật toán xây dựng đồ thị xung đột chuẩn trong lý thuyết đồ thị.

---

### 2. **Thuật toán Tô màu Đồ thị (Graph Coloring)** ✅
**Vị trí:** `colorOrders()` (dòng 707-774)

**Mô tả:**
- Sử dụng **Welsh-Powell algorithm** (sắp xếp theo bậc giảm dần)
- **Greedy Coloring**: Gán màu nhỏ nhất chưa được sử dụng bởi các đỉnh kề
- Đảm bảo hai đỉnh kề nhau (có cạnh nối) không có cùng màu

**Code:**
```typescript
const colorOrders = (
  nodes: string[],
  edges: Array<[string, string]>,
  numShippers: number,
  points: Array<{ id: string; position: [number, number] }>
): Map<number, string[]> => {
  // Tạo danh sách kề
  const adjacencyList = new Map<string, Set<string>>();
  nodes.forEach(node => adjacencyList.set(node, new Set()));
  edges.forEach(([u, v]) => {
    adjacencyList.get(u)!.add(v);
    adjacencyList.get(v)!.add(u);
  });
  
  // Tính bậc của mỗi đỉnh
  const degrees = new Map<string, number>();
  nodes.forEach(node => {
    degrees.set(node, adjacencyList.get(node)!.size);
  });
  
  // Sắp xếp theo bậc giảm dần (Welsh-Powell)
  const sortedNodes = [...nodes].sort((a, b) => 
    (degrees.get(b) || 0) - (degrees.get(a) || 0)
  );
  
  // Tô màu
  const colors = new Map<string, number>();
  let maxColor = -1;
  
  for (const node of sortedNodes) {
    const neighbors = adjacencyList.get(node)!;
    const usedColors = new Set<number>();
    
    // Tìm các màu đã được sử dụng bởi các đỉnh kề
    for (const neighbor of neighbors) {
      const neighborColor = colors.get(neighbor);
      if (neighborColor !== undefined) {
        usedColors.add(neighborColor);
      }
    }
    
    // Tìm màu nhỏ nhất chưa được sử dụng
    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }
    
    colors.set(node, color);
    maxColor = Math.max(maxColor, color);
  }
  
  // Nhóm các đỉnh theo màu
  const colorGroups = new Map<number, string[]>();
  colors.forEach((color, node) => {
    if (!colorGroups.has(color)) {
      colorGroups.set(color, []);
    }
    colorGroups.get(color)!.push(node);
  });
  
  // Nếu số màu > numShippers, gộp các nhóm màu
  if (maxColor + 1 > numShippers) {
    return mergeColorGroups(colorGroups, numShippers, points, distanceMatrixRef.current);
  }
  
  return colorGroups;
};
```

**Đánh giá:** ✅ **ĐÚNG** - Đây là thuật toán tô màu đồ thị chuẩn với Welsh-Powell heuristic.

---

### 3. **Gộp Nhóm Màu (Color Group Merging)** ✅
**Vị trí:** `mergeColorGroups()` (dòng 776-860)

**Mô tả:**
- Nếu số màu > numShippers, gộp các nhóm màu có khoảng cách trung bình gần nhau nhất
- Đảm bảo số nhóm màu không vượt quá số shipper có sẵn

**Đánh giá:** ✅ **HỢP LÝ** - Đây là bước tối ưu hóa để phù hợp với số lượng shipper thực tế.

---

### 4. **Thuật toán Dijkstra** ✅
**Vị trí:** 
- Import từ `@/lib/algorithms/dijkstra` (dòng 16)
- Sử dụng trong `handleRunAlgorithm()` (dòng 1050)

**Mô tả:**
- Tìm đường đi ngắn nhất giữa các điểm liên tiếp trong tuyến đường
- Sử dụng để tính toán đường đi chi tiết cho từng đoạn

**Code sử dụng:**
```typescript
const dijkstraResult = await dijkstra(graphNodes, graphEdges, currentPointId, nextPointId);
```

**Đánh giá:** ✅ **ĐÚNG** - Sử dụng thuật toán Dijkstra chuẩn từ thư viện.

---

### 5. **Thuật toán 2-Opt Improvement** ✅
**Vị trí:** `twoOptImprovement()` (dòng 535-568)

**Mô tả:**
- Cải thiện tuyến đường bằng cách đảo ngược các đoạn con
- Lặp lại cho đến khi không còn cải thiện

**Code:**
```typescript
const twoOptImprovement = (
  route: number[],
  distanceMatrix: number[][]
): number[] => {
  let improved = true;
  let bestRoute = [...route];
  let bestDistance = calculateRouteDistance(bestRoute, distanceMatrix);
  
  while (improved) {
    improved = false;
    
    for (let i = 1; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];
        
        const newDistance = calculateRouteDistance(newRoute, distanceMatrix);
        
        if (newDistance < bestDistance) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  
  return bestRoute;
};
```

**Đánh giá:** ✅ **ĐÚNG** - Đây là thuật toán 2-opt chuẩn cho bài toán TSP.

---

### 6. **Nearest Neighbor Heuristic** ⚠️
**Vị trí:** `nearestNeighborRoute()` (dòng 495-534)

**Mô tả:**
- Heuristic để tìm tuyến đường ban đầu
- Luôn chọn điểm gần nhất tiếp theo

**Đánh giá:** ⚠️ **KHÔNG PHẢI** thuật toán lý thuyết đồ thị thuần túy, nhưng là heuristic phổ biến cho TSP. Tuy nhiên, nó được kết hợp với 2-opt và Dijkstra để tối ưu hóa.

---

## 📊 TÓM TẮT ĐÁNH GIÁ

### ✅ Các thuật toán lý thuyết đồ thị đã sử dụng:

1. ✅ **Xây dựng Đồ thị Xung đột (Conflict Graph)** - ĐÚNG
2. ✅ **Thuật toán Tô màu Đồ thị (Graph Coloring)** - ĐÚNG
   - Welsh-Powell algorithm (sắp xếp theo bậc)
   - Greedy Coloring (gán màu nhỏ nhất)
3. ✅ **Thuật toán Dijkstra** - ĐÚNG
4. ✅ **Thuật toán 2-Opt Improvement** - ĐÚNG
5. ⚠️ **Nearest Neighbor Heuristic** - Không phải thuật toán lý thuyết đồ thị thuần túy, nhưng là heuristic hợp lý

### ✅ Quy trình xử lý:

1. ✅ **Bước 1:** Tính khoảng cách giữa tất cả các điểm
2. ✅ **Bước 2:** Xây dựng đồ thị xung đột (Conflict Graph)
3. ✅ **Bước 3:** Tô màu đồ thị (Graph Coloring với Welsh-Powell)
4. ✅ **Bước 4:** Phân bổ mỗi nhóm màu cho shipper gần nhất
5. ✅ **Bước 5:** Tối ưu lộ trình cho từng shipper:
   - Nearest Neighbor heuristic (tuyến đường ban đầu)
   - 2-opt improvement (cải thiện tuyến đường)
   - Dijkstra (tìm đường đi chi tiết)

---

## 🎯 KẾT LUẬN

### ✅ **ĐÁNH GIÁ TỔNG THỂ: ĐÚNG YÊU CẦU ĐỀ TÀI**

**Điểm mạnh:**
1. ✅ Sử dụng đúng thuật toán tô màu đồ thị (Graph Coloring) với Welsh-Powell
2. ✅ Xây dựng đồ thị xung đột (Conflict Graph) đúng cách
3. ✅ Sử dụng Dijkstra và 2-opt để tối ưu lộ trình
4. ✅ Logic phân chia đơn hàng cho k-shipper rõ ràng
5. ✅ Code có cấu trúc tốt, dễ đọc và bảo trì

**Gợi ý cải thiện (tùy chọn):**
1. Có thể thêm comment giải thích rõ hơn về lý thuyết đồ thị
2. Có thể thêm visualization của đồ thị xung đột
3. Có thể thêm thống kê về số lượng màu tối thiểu (chromatic number)

**Kết luận:** Code đã **ĐÚNG YÊU CẦU ĐỀ TÀI** và **SỬ DỤNG ĐÚNG CÁC THUẬT TOÁN LÝ THUYẾT ĐỒ THỊ** theo yêu cầu.


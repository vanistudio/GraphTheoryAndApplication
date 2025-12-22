# TÓM TẮT CHI TIẾT THUẬT TOÁN TỐI ƯU LỊCH TRÌNH GIAO HÀNG

## Tổng quan

Hệ thống tối ưu lịch trình giao hàng sử dụng các thuật toán:
- **Nearest Neighbor Heuristic**: Tìm tuyến đường ban đầu
- **2-Opt Improvement**: Cải thiện tuyến đường
- **Dijkstra Algorithm**: Tìm đường đi chi tiết giữa các điểm
- **Distance Matrix**: Ma trận khoảng cách giữa tất cả các điểm

---

## BƯỚC 1: Thu thập và chuẩn bị dữ liệu

### 1.1. Thu thập điểm

- **Shipper**: 1 điểm (vị trí xuất phát)
- **Điểm giao hàng**: N điểm (N ≥ 1)
- **Tổng**: N+1 điểm

### 1.2. Tọa độ điểm

Mỗi điểm có tọa độ `[lat, lon]` (latitude, longitude)

**Ví dụ:**
```javascript
shipperPosition = [10.8231, 106.6297]  // Hồ Chí Minh
deliveryPoint1 = [10.7614, 106.6821]   // Quận 1
deliveryPoint2 = [10.7870, 106.6810]   // Quận 3
```

### 1.3. Mapping điểm

Tạo mapping giữa ID và index trong ma trận:
```javascript
pointIndexMap = {
  "shipper-id": 0,
  "delivery-1": 1,
  "delivery-2": 2,
  ...
}
```

---

## BƯỚC 2: Tính khoảng cách giữa tất cả các điểm

### 2.1. Tính số cặp điểm

**Công thức:**
```
Tổng số cặp = (N+1) × N / 2
```

**Ví dụ:**
- 3 điểm → 3 cặp
- 5 điểm → 10 cặp
- 10 điểm → 45 cặp

### 2.2. Tính khoảng cách cho từng cặp điểm

Với mỗi cặp điểm `(A, B)` có tọa độ `[lat1, lon1]` và `[lat2, lon2]`:

#### a) Kiểm tra cache trước

```javascript
key = "lat1,lon1-lat2,lon2"
reverseKey = "lat2,lon2-lat1,lon1"

if (cache.has(key) || cache.has(reverseKey)):
    return cache.get(key) || cache.get(reverseKey)
```

#### b) Tính khoảng cách đường bộ (3 tầng fallback)

**Tầng 1: OpenRouteService API**

```javascript
POST https://api.openrouteservice.org/v2/directions/driving-car
Headers: {
  'Content-Type': 'application/json',
  'Authorization': API_KEY
}
Body: {
  coordinates: [[lon1, lat1], [lon2, lat2]]
}

Response: {
  routes: [{
    summary: { distance: 5234 },  // mét
    geometry: "encoded_polyline_string"
  }]
}

distance_km = distance / 1000  // Chuyển sang km
```

**Tầng 2: OSRM API (nếu OpenRouteService thất bại)**

```javascript
GET https://router.project-osrm.org/route/v1/driving/
    {lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=false

Timeout: 5 giây

Response: {
  code: "Ok",
  routes: [{
    distance: 5234,  // mét
    geometry: {
      coordinates: [[lon1, lat1], [lon2, lat2], ...]
    }
  }]
}

distance_km = distance / 1000
```

**Tầng 3: Haversine Formula (khoảng cách đường chim bay)**

Nếu cả 2 API đều thất bại, sử dụng công thức Haversine:

```javascript
R = 6371  // Bán kính Trái Đất (km)

// Chuyển độ sang radian
dLat = (lat2 - lat1) × π / 180
dLon = (lon2 - lon1) × π / 180

// Công thức Haversine
a = sin²(dLat/2) + cos(lat1 × π/180) × cos(lat2 × π/180) × sin²(dLon/2)
c = 2 × atan2(√a, √(1-a))
distance_km = R × c
```

**Công thức chi tiết:**
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

#### c) Lưu vào cache

```javascript
cache.set(key, distance_km)
cache.set(reverseKey, distance_km)  // Đối xứng

// Giới hạn cache: 50 entries (FIFO)
if (cache.size > 50):
    firstKey = cache.keys().next().value
    cache.delete(firstKey)
```

---

## BƯỚC 3: Xây dựng ma trận khoảng cách

### 3.1. Tạo ma trận vuông

Tạo ma trận `(N+1) × (N+1)` để lưu khoảng cách giữa tất cả các điểm:

```javascript
matrix[i][j] = khoảng cách từ điểm i đến điểm j (km)
```

### 3.2. Điền giá trị vào ma trận

```javascript
for i = 0 to N:
    matrix[i][i] = 0  // Khoảng cách từ điểm đến chính nó
    
    for j = i+1 to N:
        key = "lat_i,lon_i-lat_j,lon_j"
        reverseKey = "lat_j,lon_j-lat_i,lon_i"
        
        dist = cache.get(key) || cache.get(reverseKey) || Infinity
        
        matrix[i][j] = dist
        matrix[j][i] = dist  // Đối xứng
```

### 3.3. Ví dụ ma trận khoảng cách

Với 4 điểm (1 shipper + 3 điểm giao hàng):

```
        Shipper  D1    D2    D3
Shipper   0      5.2   8.1   3.7
D1       5.2     0    4.3   6.8
D2       8.1    4.3    0    9.2
D3       3.7    6.8   9.2    0
```

**Giải thích:**
- Shipper → D1: 5.2 km
- D1 → D2: 4.3 km
- D2 → D3: 9.2 km
- ...

---

## BƯỚC 4: Tối ưu thứ tự giao hàng

### 4.1. Chuẩn bị dữ liệu

**Sắp xếp điểm giao hàng theo ID:**
```javascript
sortedDeliveryIndices = deliveryIndices.sort((a, b) => 
    points[a].id.localeCompare(points[b].id)
)
```

**Lý do:** Đảm bảo kết quả không phụ thuộc vào thứ tự nhập điểm.

### 4.2. Thuật toán Nearest Neighbor

**Mục đích:** Tìm tuyến đường ban đầu bằng cách luôn chọn điểm gần nhất tiếp theo.

**Thuật toán:**

```javascript
function nearestNeighborRoute(startIndex, deliveryIndices, distanceMatrix):
    route = [startIndex]
    currentIndex = startIndex
    remaining = [...deliveryIndices]
    
    while remaining.length > 0:
        nearestIdx = -1
        nearestDistance = Infinity
        
        // Tìm điểm gần nhất từ điểm hiện tại
        for i = 0 to remaining.length - 1:
            targetIndex = remaining[i]
            dist = distanceMatrix[currentIndex][targetIndex]
            
            if dist < nearestDistance:
                nearestDistance = dist
                nearestIdx = i
        
        if nearestIdx == -1:
            break
        
        // Thêm điểm gần nhất vào tuyến đường
        nearestIndex = remaining[nearestIdx]
        route.push(nearestIndex)
        currentIndex = nearestIndex
        remaining.splice(nearestIdx, 1)
    
    // Tính tổng khoảng cách
    totalDistance = 0
    for i = 0 to route.length - 2:
        totalDistance += distanceMatrix[route[i]][route[i+1]]
    
    return { route: route.slice(1), distance: totalDistance }
```

**Ví dụ:**

Giả sử có:
- Shipper (S) tại index 0
- 3 điểm giao hàng: D1 (index 1), D2 (index 2), D3 (index 3)

Ma trận khoảng cách:
```
     S   D1  D2  D3
S    0   5   8   3
D1   5   0   4   6
D2   8   4   0   9
D3   3   6   9   0
```

**Thực hiện:**
1. Bắt đầu từ S (index 0)
2. Tìm điểm gần nhất: D3 (khoảng cách = 3)
3. Route = [S, D3], current = D3
4. Tìm điểm gần nhất từ D3: D1 (khoảng cách = 6)
5. Route = [S, D3, D1], current = D1
6. Tìm điểm gần nhất từ D1: D2 (khoảng cách = 4)
7. Route = [S, D3, D1, D2]
8. Tổng khoảng cách = 3 + 6 + 4 = 13 km

### 4.3. Thử nhiều điểm xuất phát

Để tìm tuyến đường tốt nhất, thử nhiều điểm xuất phát khác nhau:

#### a) Bắt đầu từ Shipper

```javascript
route1 = nearestNeighborRoute(shipperIndex, allDeliveryIndices, distanceMatrix)
bestRoute = route1.route
bestDistance = route1.distance
```

#### b) Thử các điểm giao hàng làm điểm đầu tiên

```javascript
// Thử tối đa 5 điểm đầu tiên (để tránh tính toán quá nhiều)
for firstDeliveryIdx in sortedDeliveryIndices[0..min(5, length)]:
    remaining = sortedDeliveryIndices - firstDeliveryIdx
    
    // Tìm tuyến đường từ điểm này đến các điểm còn lại
    partialRoute = nearestNeighborRoute(firstDeliveryIdx, remaining, distanceMatrix)
    
    // Tính tổng khoảng cách: Shipper → điểm đầu tiên → các điểm còn lại
    totalDistance = distanceMatrix[shipperIndex][firstDeliveryIdx] + partialRoute.distance
    
    if totalDistance < bestDistance:
        bestRoute = [firstDeliveryIdx, ...partialRoute.route]
        bestDistance = totalDistance
```

**Ví dụ:**

Giả sử có 4 điểm giao hàng: D1, D2, D3, D4

**Thử 1:** Bắt đầu từ Shipper
- Route: S → D1 → D2 → D3 → D4
- Distance: 5 + 4 + 6 + 8 = 23 km

**Thử 2:** Bắt đầu từ D1
- Route: S → D1 → D3 → D2 → D4
- Distance: 5 + 6 + 4 + 7 = 22 km ← Tốt hơn!

**Thử 3:** Bắt đầu từ D2
- Route: S → D2 → D1 → D3 → D4
- Distance: 8 + 4 + 6 + 8 = 26 km

→ Chọn tuyến đường tốt nhất: **S → D1 → D3 → D2 → D4** (22 km)

### 4.4. Cải thiện bằng thuật toán 2-Opt

**Mục đích:** Cải thiện tuyến đường bằng cách đảo ngược các đoạn con.

**Thuật toán:**

```javascript
function twoOptImprovement(route, distanceMatrix):
    bestRoute = [...route]
    bestDistance = calculateRouteDistance(bestRoute, distanceMatrix)
    improved = true
    
    while improved:
        improved = false
        
        for i = 1 to route.length - 2:
            for j = i + 1 to route.length - 1:
                // Thử đảo ngược đoạn từ i đến j
                newRoute = [
                    ...bestRoute[0..i-1],
                    ...bestRoute[i..j].reverse(),
                    ...bestRoute[j+1..end]
                ]
                
                newDistance = calculateRouteDistance(newRoute, distanceMatrix)
                
                if newDistance < bestDistance:
                    bestRoute = newRoute
                    bestDistance = newDistance
                    improved = true
                    break
            
            if improved:
                break
    
    return bestRoute
```

**Ví dụ:**

Tuyến đường ban đầu: `[S, D1, D2, D3, D4]`

**Lần 1:** Thử đảo đoạn D1-D2
- Old: `[S, D1, D2, D3, D4]` → Distance = 23 km
- New: `[S, D2, D1, D3, D4]` → Distance = 22 km ← Cải thiện!

**Lần 2:** Thử đảo đoạn D2-D3
- Old: `[S, D2, D1, D3, D4]` → Distance = 22 km
- New: `[S, D2, D3, D1, D4]` → Distance = 21 km ← Cải thiện!

**Lần 3:** Không còn cải thiện được
- Final: `[S, D2, D3, D1, D4]` → Distance = 21 km

### 4.5. Chọn tuyến đường tốt nhất

So sánh tất cả các tuyến đường đã thử và chọn tuyến có tổng khoảng cách ngắn nhất:

```javascript
bestRoute = route có distance nhỏ nhất trong tất cả các route đã thử
```

---

## BƯỚC 5: Tính toán đường đi chi tiết

### 5.1. Tạo đồ thị (Graph)

**Nodes:**
```javascript
graphNodes = [
    { id: "shipper-id", label: "Shipper", position: { x: lon, y: lat } },
    { id: "delivery-1", label: "Điểm 1", position: { x: lon, y: lat } },
    ...
]
```

**Edges:**
```javascript
graphEdges = [
    { id: "shipper-delivery1", source: "shipper-id", target: "delivery-1", weight: 5.2 },
    { id: "delivery1-shipper", source: "delivery-1", target: "shipper-id", weight: 5.2 },
    ...
]
```

**Lưu ý:** Mỗi cặp điểm có 2 edges (2 chiều) với cùng weight.

### 5.2. Tìm đường đi giữa các điểm liên tiếp

Với tuyến đường đã tối ưu `[Shipper, D1, D2, D3]`:

```javascript
totalDistance = 0
allPathCoordinates = [shipperPosition]

currentPointId = shipperLocation

for nextPointId in optimizedRoute:
    // Chạy Dijkstra để tìm đường đi ngắn nhất
    dijkstraResult = dijkstra(graphNodes, graphEdges, currentPointId, nextPointId)
    
    // dijkstraResult = {
    //     path: [currentPointId, ..., nextPointId],
    //     distance: 5.2  // km
    // }
    
    totalDistance += dijkstraResult.distance
    
    // Lấy tọa độ của path
    pathCoords = dijkstraResult.path.map(id => marker[id].position)
    // pathCoords = [[lat1, lon1], [lat2, lon2], ...]
    
    // Lấy đường đi thực tế từ API
    roadRoute = getRoadRoute(pathCoords)
    
    if roadRoute != null:
        // Nối geometry vào allPathCoordinates (bỏ điểm đầu để tránh trùng)
        allPathCoordinates.push(...roadRoute.geometry.slice(1))
    else:
        // Fallback: thêm điểm đích
        allPathCoordinates.push(pathCoords[pathCoords.length - 1])
    
    currentPointId = nextPointId
```

### 5.3. Thuật toán Dijkstra

**Mục đích:** Tìm đường đi ngắn nhất giữa 2 điểm trong đồ thị.

**Thuật toán:**

```javascript
function dijkstra(nodes, edges, sourceId, targetId):
    distances = {}  // Khoảng cách từ source đến mỗi node
    previous = {}   // Node trước đó trong đường đi ngắn nhất
    visited = Set()
    
    // Khởi tạo
    for node in nodes:
        distances[node.id] = Infinity
        previous[node.id] = null
    
    distances[sourceId] = 0
    
    // Tạo danh sách kề
    adjacencyList = {}
    for node in nodes:
        adjacencyList[node.id] = []
    
    for edge in edges:
        adjacencyList[edge.source].push({
            target: edge.target,
            weight: edge.weight
        })
    
    // Tìm đường đi ngắn nhất
    while visited.size < nodes.length:
        // Tìm node chưa thăm có distance nhỏ nhất
        minNode = null
        minDistance = Infinity
        
        for node in nodes:
            if !visited.has(node.id) && distances[node.id] < minDistance:
                minDistance = distances[node.id]
                minNode = node
        
        if minNode == null:
            break
        
        visited.add(minNode.id)
        
        // Nếu đã đến target, dừng lại
        if minNode.id == targetId:
            break
        
        // Cập nhật khoảng cách đến các node kề
        for neighbor in adjacencyList[minNode.id]:
            if !visited.has(neighbor.target):
                alt = distances[minNode.id] + neighbor.weight
                if alt < distances[neighbor.target]:
                    distances[neighbor.target] = alt
                    previous[neighbor.target] = minNode.id
    
    // Tái tạo đường đi
    path = []
    current = targetId
    
    while current != null:
        path.unshift(current)
        current = previous[current]
    
    distance = distances[targetId]
    
    return { path, distance }
```

**Ví dụ:**

Đồ thị:
```
S --5.2--> D1
S --8.1--> D2
D1 --4.3--> D2
D1 --6.8--> D3
D2 --9.2--> D3
```

Tìm đường đi từ S đến D3:

1. **Khởi tạo:**
   - distances = {S: 0, D1: ∞, D2: ∞, D3: ∞}
   - visited = {}

2. **Bước 1:** Chọn S (distance = 0)
   - Cập nhật D1: distance = 0 + 5.2 = 5.2
   - Cập nhật D2: distance = 0 + 8.1 = 8.1
   - visited = {S}

3. **Bước 2:** Chọn D1 (distance = 5.2)
   - Cập nhật D2: distance = min(8.1, 5.2 + 4.3) = 9.5
   - Cập nhật D3: distance = 5.2 + 6.8 = 12.0
   - visited = {S, D1}

4. **Bước 3:** Chọn D2 (distance = 8.1)
   - Cập nhật D3: distance = min(12.0, 8.1 + 9.2) = 12.0
   - visited = {S, D1, D2}

5. **Bước 4:** Chọn D3 (distance = 12.0)
   - Đã đến target, dừng lại

6. **Tái tạo đường đi:**
   - D3 ← D1 ← S
   - Path = [S, D1, D3]
   - Distance = 12.0 km

### 5.4. Kết quả cuối cùng

```javascript
pathResult = [shipperId, deliveryId1, deliveryId2, ...]  // Thứ tự tối ưu
pathGeometry = [[lat1, lon1], [lat2, lon2], ...]        // Tọa độ đường đi chi tiết
pathDistance = totalDistance                             // Tổng khoảng cách (km)
```

---

## BƯỚC 6: Hiển thị kết quả

### 6.1. Trên bản đồ

**Vẽ Polyline:**
```javascript
<Polyline
    positions={pathGeometry}  // Mảng tọa độ [lat, lon]
    pathOptions={{
        color: "#22c55e",  // Màu xanh lá
        weight: 5,
        opacity: 0.9
    }}
/>
```

**Marker:**
- **Shipper**: Màu xanh lá, nhãn "S"
- **Điểm giao hàng trong tuyến**: Màu xanh dương, số thứ tự (1, 2, 3, ...)
- **Điểm giao hàng ngoài tuyến**: Màu vàng

### 6.2. Trong panel điều khiển

- **Tổng khoảng cách**: `pathDistance.toFixed(2) km`
- **Số điểm giao hàng**: `deliveryMarkers.length`
- **Danh sách thứ tự giao hàng**: Hiển thị từng điểm theo thứ tự tối ưu

---

## TÓM TẮT CÔNG THỨC TÍNH TOÁN

### 1. Haversine Formula (khoảng cách đường chim bay)

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c

Trong đó:
- R = 6371 km (bán kính Trái Đất)
- lat1, lat2: vĩ độ điểm 1 và 2 (độ)
- lon1, lon2: kinh độ điểm 1 và 2 (độ)
- Δlat = (lat2 - lat1) × π/180
- Δlon = (lon2 - lon1) × π/180
```

### 2. Tổng khoảng cách tuyến đường

```
totalDistance = Σ distanceMatrix[route[i]][route[i+1]]

Với route = [startIndex, index1, index2, ..., indexN]
```

### 3. Độ phức tạp thuật toán

- **Tính khoảng cách**: O(N²) cặp điểm
- **Nearest Neighbor**: O(N²) - duyệt qua N điểm, mỗi điểm duyệt N điểm còn lại
- **2-Opt**: O(N² × iterations) - tối đa N² lần đảo, mỗi lần tính O(N)
- **Dijkstra cho từng đoạn**: O(E + V log V) × số đoạn, với E = số cạnh, V = số đỉnh

**Tổng độ phức tạp:** O(N² + N² + N² × iterations + (E + V log V) × N)
≈ **O(N² × iterations)** trong trường hợp xấu nhất

---

## ĐIỂM QUAN TRỌNG

### 1. Không phụ thuộc vào thứ tự nhập điểm

- Sắp xếp điểm giao hàng theo ID trước khi tối ưu
- Đảm bảo kết quả nhất quán dù nhập điểm theo thứ tự nào

### 2. Cache khoảng cách

- Lưu kết quả tính toán vào cache để tránh tính lại
- Giảm số lượng API calls
- Tăng tốc độ xử lý

### 3. Fallback 3 tầng

- **Tầng 1**: OpenRouteService (chính xác nhất)
- **Tầng 2**: OSRM (backup)
- **Tầng 3**: Haversine (luôn có kết quả)

Đảm bảo hệ thống luôn hoạt động ngay cả khi API bên ngoài gặp sự cố.

### 4. Tối ưu đa điểm xuất phát

- Thử nhiều điểm xuất phát khác nhau
- Chọn tuyến đường tốt nhất trong tất cả các thử nghiệm

### 5. 2-Opt Improvement

- Cải thiện tuyến đường sau khi có kết quả từ Nearest Neighbor
- Đảo ngược các đoạn con để tìm giải pháp tốt hơn

### 6. Dijkstra cho đường đi chi tiết

- Tìm đường đi chính xác giữa các điểm liên tiếp
- Sử dụng khoảng cách đường bộ thực tế
- Lấy geometry từ API để vẽ đường đi trên bản đồ

---

## VÍ DỤ MINH HỌA ĐẦY ĐỦ

### Input

- **Shipper**: [10.8231, 106.6297] - "Kho hàng"
- **D1**: [10.7614, 106.6821] - "Khách hàng A"
- **D2**: [10.7870, 106.6810] - "Khách hàng B"
- **D3**: [10.8000, 106.7000] - "Khách hàng C"

### Bước 1: Tính khoảng cách

```
S → D1: 5.2 km (OpenRouteService)
S → D2: 8.1 km (OpenRouteService)
S → D3: 3.7 km (OpenRouteService)
D1 → D2: 4.3 km (OpenRouteService)
D1 → D3: 6.8 km (OSRM)
D2 → D3: 9.2 km (Haversine - API thất bại)
```

### Bước 2: Ma trận khoảng cách

```
        S    D1   D2   D3
S       0   5.2  8.1  3.7
D1     5.2   0   4.3  6.8
D2     8.1  4.3   0   9.2
D3     3.7  6.8  9.2   0
```

### Bước 3: Tối ưu tuyến đường

**Nearest Neighbor từ S:**
1. S → D3 (3.7 km) - gần nhất
2. D3 → D1 (6.8 km) - gần nhất từ D3
3. D1 → D2 (4.3 km) - điểm cuối cùng
4. Route: [S, D3, D1, D2]
5. Distance: 3.7 + 6.8 + 4.3 = 14.8 km

**Thử D1 làm điểm đầu tiên:**
1. S → D1 (5.2 km)
2. D1 → D2 (4.3 km)
3. D2 → D3 (9.2 km)
4. Route: [S, D1, D2, D3]
5. Distance: 5.2 + 4.3 + 9.2 = 18.7 km

**Thử D2 làm điểm đầu tiên:**
1. S → D2 (8.1 km)
2. D2 → D1 (4.3 km)
3. D1 → D3 (6.8 km)
4. Route: [S, D2, D1, D3]
5. Distance: 8.1 + 4.3 + 6.8 = 19.2 km

**Best Route:** [S, D3, D1, D2] với distance = 14.8 km

**2-Opt Improvement:**
- Thử đảo D3-D1: [S, D1, D3, D2] → 5.2 + 6.8 + 9.2 = 21.2 km (tệ hơn)
- Thử đảo D1-D2: [S, D3, D2, D1] → 3.7 + 9.2 + 4.3 = 17.2 km (tệ hơn)
- Không cải thiện được → Giữ nguyên: [S, D3, D1, D2]

### Bước 4: Đường đi chi tiết

**Đoạn 1: S → D3**
- Dijkstra path: [S, D3]
- Distance: 3.7 km
- Geometry: [[10.8231, 106.6297], [10.8000, 106.7000]]

**Đoạn 2: D3 → D1**
- Dijkstra path: [D3, D1]
- Distance: 6.8 km
- Geometry: [[10.8000, 106.7000], [10.7614, 106.6821]]

**Đoạn 3: D1 → D2**
- Dijkstra path: [D1, D2]
- Distance: 4.3 km
- Geometry: [[10.7614, 106.6821], [10.7870, 106.6810]]

**Tổng khoảng cách:** 3.7 + 6.8 + 4.3 = **14.8 km**

### Output

- **Thứ tự giao hàng**: D3 → D1 → D2
- **Tổng khoảng cách**: 14.8 km
- **Đường đi**: Polyline nối các điểm theo geometry đã tính

---

## KẾT LUẬN

Hệ thống tối ưu lịch trình giao hàng sử dụng kết hợp nhiều thuật toán và kỹ thuật:

1. **Tính toán khoảng cách chính xác** với fallback đa tầng
2. **Tối ưu tuyến đường** bằng Nearest Neighbor và 2-Opt
3. **Tìm đường đi chi tiết** bằng Dijkstra
4. **Hiển thị trực quan** trên bản đồ

Đảm bảo:
- ✅ Kết quả tối ưu (quãng đường ngắn nhất)
- ✅ Không phụ thuộc vào thứ tự nhập điểm
- ✅ Luôn có kết quả (fallback)
- ✅ Hiệu suất tốt (cache, tối ưu thuật toán)


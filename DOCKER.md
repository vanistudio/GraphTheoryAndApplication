# 🐳 Docker Setup Guide

## Nhanh chóng chạy từ Docker Image

### 📦 **Option 1: Chạy từ Docker Hub**

Chỉ cần 1 lệnh duy nhất:

```bash
docker run -p 3000:3000 vanistudio/graphtheory:latest
```

Rồi mở browser: **http://localhost:3000**

---

### 📦 **Option 2: Chạy từ GitHub Container Registry**

```bash
docker run -p 3000:3000 ghcr.io/vanistudio/graphtheory:latest
```

---

### 🚀 **Option 3: Sử dụng Docker Compose (với MongoDB)**

1. Tạo file `docker-compose.yml` (hoặc clone từ repo)
2. Chạy:
```bash
docker-compose up -d
```

3. Dừng:
```bash
docker-compose down
```

---

## 🔨 Build image từ source

### Build locally:
```bash
docker build -t graphtheory:latest .
docker run -p 3000:3000 graphtheory:latest
```

### Windows users - Double-click:
```
build-docker.bat
```

---

## ⚙️ Environment Variables

Tạo file `.env.local`:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=your_api_key
```

---

## 📊 Image Details

- **Base Image**: `node:24-alpine` (~170MB)
- **Final Size**: ~300MB (multi-stage build)
- **Port**: 3000
- **Health Check**: ✅ Tích hợp

---

## 🔄 Auto-build with GitHub Actions

Mỗi khi push lên GitHub:
- ✅ Tự động build Docker image
- ✅ Push lên Docker Hub: `vanistudio/graphtheory`
- ✅ Push lên GitHub Container Registry: `ghcr.io/vanistudio/graphtheory`

**Cần setup:**
1. Docker Hub account: https://hub.docker.com/
2. Thêm secrets vào GitHub repo:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

---

## 🐛 Troubleshooting

**Error: Docker daemon not running**
→ Start Docker Desktop

**Error: Port 3000 already in use**
```bash
docker run -p 3001:3000 graphtheory:latest
# Then visit http://localhost:3001
```

**View logs:**
```bash
docker logs <container_id>
```

---

## 📝 Example: Full deployment

```bash
# Pull latest image
docker pull vanistudio/graphtheory:latest

# Run with MongoDB
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" \
  --name graphtheory \
  vanistudio/graphtheory:latest

# Check status
docker ps
docker logs graphtheory

# Stop
docker stop graphtheory
```

---

Enjoy! 🚀

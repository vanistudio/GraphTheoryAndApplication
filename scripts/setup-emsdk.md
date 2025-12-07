# Hướng dẫn cài đặt Emscripten trên Windows

## Cách 1: Cài đặt Emscripten SDK (Khuyến nghị)

### Bước 1: Clone emsdk repository

```powershell
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
```

### Bước 2: Cài đặt và kích hoạt

```powershell
# Cài đặt phiên bản mới nhất
.\emsdk.bat install latest

# Kích hoạt
.\emsdk.bat activate latest
```

### Bước 3: Thêm vào PATH (tùy chọn nhưng khuyến nghị)

**Cách 1: Thêm vào PATH tạm thời (chỉ cho session hiện tại)**

```powershell
.\emsdk_env.bat
```

**Cách 2: Thêm vào PATH vĩnh viễn**

1. Mở **System Properties** → **Environment Variables**
2. Thêm đường dẫn sau vào **Path**:
   ```
   C:\emsdk\upstream\emscripten
   ```
   (Thay `C:\emsdk` bằng đường dẫn thực tế của bạn)

### Bước 4: Kiểm tra cài đặt

```powershell
emcc --version
```

Nếu thấy version number, bạn đã cài đặt thành công!

## Cách 2: Sử dụng script tự động (Nếu emsdk ở vị trí chuẩn)

Script `build-wasm.js` sẽ tự động tìm emcc ở các vị trí sau:
- `%USERPROFILE%\emsdk\upstream\emscripten\emcc.bat`
- `C:\emsdk\upstream\emscripten\emcc.bat`
- Trong PATH

Nếu emsdk của bạn ở vị trí khác, hãy thêm vào PATH hoặc đặt ở một trong các vị trí trên.

## Troubleshooting

### Lỗi: 'emcc' is not recognized

**Giải pháp:**
1. Đảm bảo đã chạy `emsdk.bat activate latest`
2. Chạy `emsdk_env.bat` trước khi build
3. Hoặc thêm emsdk vào PATH vĩnh viễn

### Lỗi: Python not found

Emscripten cần Python. Cài đặt Python 3.x từ [python.org](https://www.python.org/) và thêm vào PATH.

### Lỗi: Git not found

Cài đặt Git từ [git-scm.com](https://git-scm.com/) và thêm vào PATH.

## Sau khi cài đặt

Chạy lại:

```powershell
npm run build:wasm:fast
```


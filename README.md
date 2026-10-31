# 🌸 Chấp Niệm - Ký Ức Tuổi 20 • Lan Anh

> **Chấp Niệm** là ứng dụng tương tác **Interactive VTuber AI Companion** mang phong cách nàng thơ vintage (*Ethereal Vintage Floral*), tái hiện hình ảnh và tâm hồn của nhân vật **Lan Anh** dựa trên bộ ảnh sinh nhật tuổi 20 (`Lan Anh origin.jpg`). Hệ thống tích hợp Live 2.5D Canvas Rigging, nhịp thở, chớp mắt, theo dõi chuột 3D Parallax, Lip-sync âm thanh và hỗ trợ truy cập toàn cầu qua Internet.

---

## 🎨 Bảng Màu & Bộ Nhận Diện "Ethereal Vintage Floral"
Trích xuất trực tiếp từ tác phẩm gốc **`Lan Anh origin.jpg`**:
- **Background tổng thể:** `linear-gradient(135deg, #F3ECD8 0%, #D6C9A8 50%, #B8AA86 100%)` kết hợp lớp phủ họa tiết sơn dầu cổ điển (vintage canvas texture) và ảnh `Lan Anh origin.jpg` làm nền mờ (`backdrop-filter: blur(28px)`).
- **Khung hội thoại & Panel:** Màu trắng kem váy voan `rgba(255, 253, 247, 0.82)` với hiệu ứng kính mờ (`backdrop-filter: blur(14px)`), viền Polaroid trắng ngà `2px solid #FDFBF7` và bóng đổ mềm.
- **Hồng đào phấn (`#E8998D`):** Sắc hoa cài tóc Lan Anh — dùng cho nút Gửi, sóng nhép môi (Lip-sync visualizer) và biểu cảm ngượng ngùng (`shy`).
- **Cam vàng ấm (`#D97F43`):** Sắc hoa váy dạ hội và con số sinh nhật 20 — dùng cho điểm nhấn tiêu đề, trạng thái hào hứng Liên Quân và huy hiệu kỷ niệm.
- **Xanh lá mạ trầm (`#7D8F69`):** Sắc cành lá tự nhiên — dùng cho chấm trạng thái Online và đường viền phụ.
- **Typography:**
  - Tiêu đề nghệ thuật: Google Font `'Playfair Display'` & `'Dancing Script'`.
  - Lời thoại và nội dung: Google Font `'Plus Jakarta Sans'`.

---

## 🌐 Các Phương Án Triển Khai Lên Internet

### 1. Truy cập Internet tức thì từ máy tính cá nhân (Public Tunnel):
Chỉ cần nhấp đúp chạy file:
```bat
D:\Her\start_public_web.bat
```
Hoặc chạy lệnh từ terminal:
```powershell
npm run tunnel
```
Hệ thống sẽ đồng thời khởi động server và mở đường hầm **Cloudflare Tunnel (HTTPS bảo mật cao)**, in đường link công khai ra màn hình để bạn có thể mở ngay trên điện thoại hoặc chia sẻ với bạn bè!

---

### 2. Triển khai Cloud 24/7 (Railway / Render / Docker VPS):
Mã nguồn đã tích hợp sẵn trọn bộ cấu hình tự động:
- **`Dockerfile` & `docker-compose.yml`**: Đóng gói hoàn chỉnh container trên nền tảng Alpine Linux nhẹ và bảo mật.
- **`railway.json`**: Tự động nhận diện và build trên [Railway.app](https://railway.app).
- **`render.yaml`**: Blueprint tự động kích hoạt Web Service trên [Render.com](https://render.com).
- **`.github/workflows/deploy.yml`**: GitHub Actions tự động kiểm tra cú pháp và build container khi push code.

---

## 🛠️ Ràng Buộc Kỹ Thuật (D:\Her)
- Toàn bộ source code, dependencies, binary `cloudflared.exe`, cache `.npm-cache` và `.tmp` nằm trọn vẹn trong `D:\Her`.
- Hoàn toàn không ghi hay cài đặt bất kỳ file nào vào ổ `C:\`.

---

## 📜 Thông Tin Nhân Vật & Tác Giả
- **Nhân vật:** Lan Anh (Sinh ngày 27/10/2006 • 20 tuổi • Cung Bọ Cạp)
- **Tình bạn:** 7 năm tri kỷ gắn bó từ lớp 8 (2019) đến lớp 10 và hiện tại.
- **Game sở trường:** Liên Quân Mobile (Cao Thủ 28 Sao - Lauriel, Liliana, Aya, Violet).
- **Repository:** [quanganh296/My_Obsession](https://github.com/quanganh296/My_Obsession.git)
- **Tác giả:** Quang Anh.

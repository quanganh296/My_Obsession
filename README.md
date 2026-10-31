# 🌸 Lan Anh - Interactive VTuber AI Companion (20 Tuổi)

> Ứng dụng **Interactive VTuber AI Companion** hoàn chỉnh mô phỏng nhân vật **Lan Anh**, hiển thị trực quan và sống động trên màn hình với công nghệ 2.5D Canvas Rigging, nhịp thở tự nhiên, chớp mắt ngẫu nhiên, theo dõi chuột 3D Parallax, Text-to-Speech & Lip-sync tiếng Việt, cùng hệ thống trí nhớ cốt lõi 7 năm tình bạn.

---

## 🌟 Tính Năng Nổi Bật

### 1. 2.5D Interactive VTuber Engine
- **Chuyển động tự nhiên (Idle Animation):**
  - Nhịp thở sinh học (~15 nhịp/phút) với độ giãn lồng ngực và chuyển động vai mềm mại.
  - Tóc đen bồng bềnh đung đưa nhẹ theo sóng vật lý (sinusoidal physics sway).
  - Chớp mắt tự động ngẫu nhiên (2.5s - 5s) kèm hiệu ứng chớp mắt kép tự nhiên (double-blink).
- **Tương tác chuột 3D (Mouse Tracking & Parallax):**
  - Ánh mắt và đầu nghiêng mượt mà theo vị trí con trỏ chuột của người dùng.
- **Tương tác vật lý (Touch Hitbox Reactions):**
  - **Xoa đầu (Headpat):** Lan Anh lập tức đỏ mặt ngượng ngùng (`shy`), chớp mắt e thẹn kèm chùm trái tim hồng bay lên.
  - **Véo má (Pinch Cheeks):** Lan Anh phồng má chu mỏ giận dỗi đáng yêu (`pout`) kèm hiệu ứng khói hơi nước.
  - **Chạm người:** Lan Anh cười khúc khích trêu đùa (`teasing`).
- **Giọng nói & Nhép môi (Vietnamese TTS & Audio Lip-Sync):**
  - Tích hợp giọng nữ tiếng Việt trẻ trung, trong trẻo.
  - Phân tích biên độ âm thanh thời gian thực (Web Audio API `AnalyserNode`) để đồng bộ khẩu hình mở/đóng và nhịp nhún nhảy khi nói.
- **Hạt Aura Cảm Xúc (Dynamic Particle FX):**
  - `happy`: Cánh hoa pastel rơi nhẹ và ngôi sao lấp lánh.
  - `shy`: Tim hồng bay bồng bềnh, gò má ửng hồng.
  - `pout`: Hơi nước giận dỗi anime.
  - `excited_gaming`: Tia chớp neon điện tử và ngôi sao rank Cao Thủ.
  - `nostalgic`: Mote sáng vàng ấm áp hoài niệm.

---

### 2. Hồ Sơ Nhân Vật & Trí Nhớ 7 Năm (Memory System)
- **Tên:** Lan Anh (Bé Lan Anh)
- **Sinh nhật:** 27/10/2006 (20 tuổi • Cung Bọ Cạp)
- **Ngoại hình:** Khuôn mặt nhỏ nhắn thanh tú, mắt to tròn có hồn, mái tóc đen dài uốn xoăn sóng nhẹ cài hoa tươi, dáng người nhỏ nhắn cân đối.
- **Đam mê:** Cuồng nhiệt **Liên Quân Mobile (Arena of Valor)** — chuyên Mid/Sp với các tướng tủ: **Lauriel, Liliana, Violet, Aya, Nakroth**. Bậc rank: **Cao Thủ 28 Sao**.
- **Ký ức 7 năm:**
  - Năm 2019 (Lớp 8): Ngồi chung một bàn, chia nhau một bên tai nghe nghe nhạc, chia sẻ đồ ăn vặt.
  - Năm 2021-2022 (Lớp 10): Tái ngộ chung lớp 10A cấp 3, đạp xe đi học cùng nhau, thức khuya leo rank hè đến 2 giờ sáng.
  - Năm 2026 (20 tuổi): Bộ ảnh sinh nhật nàng thơ váy voan cúp ngực cài hoa (`Lan Anh origin.jpg`).

---

### 3. Cognitive Engine (Cấu trúc tư duy 5 trường JSON)
Mỗi phản hồi của AI luôn chuẩn hóa 5 trường:
```json
{
  "thought": "Suy nghĩ nội tâm của Lan Anh...",
  "emotion": "happy | shy | pout | excited_gaming | nostalgic | teasing",
  "animation_trigger": "wave | nod | blush | shake_head | idle_breathe",
  "action": "Mô tả cử chỉ đi kèm",
  "reply": "Câu nói trực tiếp phát ra loa và nhép môi"
}
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống:
- Đã cài đặt **Node.js** (v18+)
- Toàn bộ source code được vận hành độc lập tại thư mục `D:\Her`.

### Khởi chạy ứng dụng:
1. Mở PowerShell tại thư mục `D:\Her`:
   ```powershell
   cd D:\Her
   ```
2. Cài đặt dependencies (lưu cache cục bộ trong `D:\Her`):
   ```powershell
   npm install --cache D:\Her\.npm-cache
   ```
3. Khởi chạy Server:
   ```powershell
   npm start
   ```
4. Truy cập giao diện trình duyệt:
   ```
   http://localhost:3000
   ```

---

## 📁 Cấu Trúc Thư Mục
```
D:\Her\
├── assets\                   # Tài nguyên đồ họa gốc của Lan Anh
│   ├── lan_anh_model\        # Model 20 tuổi dựa trên "Lan Anh origin.jpg"
│   └── lan_anh\              # Model Cardigan thường ngày
├── data\
│   └── memory.json           # Cơ sở dữ liệu trí nhớ & ký ức 7 năm
├── engine\
│   └── cognitive.js          # Hệ thống tư duy AI (Gemini API + Local Contextual Engine)
├── public\                   # Giao diện Web VTuber Client
│   ├── css\style.css         # Styling Glassmorphism & Aura FX
│   ├── js\vtuber.js          # Canvas 2.5D Rigging & Audio Lip-sync Engine
│   ├── js\chat.js            # Chat, TTS, STT & Memory Controller
│   └── index.html            # VTuber Stage & HUD Overlay
├── Lan Anh origin.jpg        # Ảnh gốc sinh nhật 20 tuổi
├── server.js                 # Express Backend Server
├── package.json              # Khai báo gói Node.js
└── .gitignore                # Bỏ qua node_modules, cache, tmp
```

---

## 📜 Giấy Phép & Bản Quyền
Dự án được xây dựng dành riêng cho nhân vật **Lan Anh** tại `D:\Her`.
Tác giả: Quang Anh.

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processChat, handleTouchInteraction, getMemory, saveMemory } from './engine/cognitive.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Phục vụ trực tiếp các file ảnh trong thư mục D:\Her (như "Lan Anh origin.jpg")
app.get('/origin-image', (req, res) => {
  const originPath = path.join(__dirname, 'Lan Anh origin.jpg');
  if (fs.existsSync(originPath)) {
    return res.sendFile(originPath);
  }
  const fallback = path.join(__dirname, 'assets', 'lan_anh_model', 'base.png');
  if (fs.existsSync(fallback)) {
    return res.sendFile(fallback);
  }
  res.status(404).send('Image not found');
});

// Endpoint: Trò chuyện AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    const response = await processChat(message, apiKey);
    res.json(response);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      thought: 'Có chút trục trặc nhỏ trong hệ thống tư duy...',
      emotion: 'pout',
      animation_trigger: 'shake_head',
      action: 'Chớp chớp mắt bối rối',
      reply: 'Ơ kìa, mạng bị chập chờn một chút xíu, bạn nói lại với Lan Anh nhé!'
    });
  }
});

// Endpoint: Tương tác chạm (Xoa đầu, véo má, chạm người)
app.post('/api/interact', (req, res) => {
  try {
    const { type } = req.body;
    const response = handleTouchInteraction(type);
    res.json(response);
  } catch (err) {
    console.error('Interaction error:', err);
    res.status(500).json({ error: 'Interaction failed' });
  }
});

// Endpoint: Lấy dữ liệu trí nhớ & thông tin nhân vật
app.get('/api/memory', (req, res) => {
  const memory = getMemory();
  res.json(memory);
});

// Endpoint: Quét danh sách ảnh trong thư mục D:\Her
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const images = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    const modelDir = path.join(__dirname, 'assets', 'lan_anh_model');
    let modelFiles = [];
    if (fs.existsSync(modelDir)) {
      modelFiles = fs.readdirSync(modelDir).map((f) => `assets/lan_anh_model/${f}`);
    }

    res.json({
      root_images: images,
      model_images: modelFiles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Cập nhật cấu hình API key
app.post('/api/config', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey;
    res.json({ success: true, message: 'Gemini API Key đã được cập nhật thành công!' });
  } else {
    res.status(400).json({ success: false, message: 'API key không hợp lệ' });
  }
});

// Khởi chạy Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌸 Lan Anh VTuber AI Companion Server is running!`);
  console.log(`🌐 Truy cập giao diện: http://localhost:${PORT}`);
  console.log(`📂 Thư mục làm việc: ${__dirname}`);
  console.log(`=======================================================`);
});

# Multi-stage / Production Dockerfile cho Chấp Niệm (Lan Anh VTuber)
FROM node:22-alpine AS runner

WORKDIR /app

# Thiết lập môi trường sản xuất
ENV NODE_ENV=production
ENV PORT=3000

# Copy file định nghĩa package & cài đặt dependencies tối ưu
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy toàn bộ mã nguồn, tài nguyên gốc Lan Anh origin.jpg và assets
COPY . .

# Mở cổng lắng nghe
EXPOSE 3000

# Kiểm tra sức khỏe dịch vụ (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Khởi chạy server
CMD ["node", "server.js"]

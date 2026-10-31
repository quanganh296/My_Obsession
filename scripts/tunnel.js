import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BIN_CLOUDFLARED = path.join(ROOT_DIR, 'bin', 'cloudflared.exe');
const PUBLIC_URL_FILE = path.join(ROOT_DIR, 'public_url.txt');

console.log('🌸 Đang khởi động hệ thống Chấp Niệm (Lan Anh VTuber)...');

// 1. Khởi động Express Server
const serverProcess = spawn('node', ['server.js'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000' }
});

serverProcess.on('error', (err) => {
  console.error('❌ Lỗi khởi động server.js:', err);
});

// Chờ 1.5 giây để server khởi động xong trước khi mở tunnel
setTimeout(() => {
  startTunnel();
}, 1500);

function startTunnel() {
  if (fs.existsSync(BIN_CLOUDFLARED)) {
    console.log('🌐 Đang thiết lập Cloudflare Tunnel bảo mật HTTPS...');
    const tunnel = spawn(
      BIN_CLOUDFLARED,
      ['tunnel', '--url', 'http://127.0.0.1:3000'],
      { cwd: ROOT_DIR }
    );

    let foundUrl = false;

    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !foundUrl) {
        foundUrl = true;
        const publicUrl = match[0];
        fs.writeFileSync(PUBLIC_URL_FILE, publicUrl, 'utf-8');

        console.log('\n' + '='.repeat(68));
        console.log('✨ CHẤP NIỆM - KHÔNG GIAN LAN ANH ĐÃ CÔNG KHAI TRÊN INTERNET! ✨');
        console.log('='.repeat(68));
        console.log(`🌐 Public URL (HTTPS): \x1b[32m\x1b[1m${publicUrl}\x1b[0m`);
        console.log(`💻 Local URL         : \x1b[36mhttp://localhost:3000\x1b[0m`);
        console.log(`📱 Có thể mở trực tiếp trên Smartphone hoặc chia sẻ bất kỳ ai!`);
        console.log('='.repeat(68) + '\n');
      }
    };

    tunnel.stdout.on('data', handleOutput);
    tunnel.stderr.on('data', handleOutput);

    tunnel.on('close', (code) => {
      console.log(`Tunnel kết thúc với mã: ${code}`);
    });
  } else {
    // Fallback sang localtunnel
    console.log('🌐 Đang sử dụng localtunnel fallback...');
    import('localtunnel')
      .then(async ({ default: localtunnel }) => {
        const tunnel = await localtunnel({ port: 3000 });
        const publicUrl = tunnel.url;
        fs.writeFileSync(PUBLIC_URL_FILE, publicUrl, 'utf-8');

        console.log('\n' + '='.repeat(68));
        console.log(`🌐 Public URL (localtunnel): \x1b[32m\x1b[1m${publicUrl}\x1b[0m`);
        console.log('='.repeat(68) + '\n');

        tunnel.on('close', () => {
          console.log('Localtunnel đã đóng');
        });
      })
      .catch((err) => {
        console.error('Lỗi khởi động localtunnel:', err);
      });
  }
}

// Xử lý dừng tiến trình gọn gàng
process.on('SIGINT', () => {
  console.log('\nĐang tắt máy chủ Chấp Niệm...');
  if (serverProcess) serverProcess.kill();
  process.exit();
});

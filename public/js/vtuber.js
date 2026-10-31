/**
 * Lan Anh VTuber 2.5D Interactive Engine
 * Handles Live Rigging, Idle Breathing, Procedural Eye Blinking,
 * Mouse Parallax Tracking, Web Audio Lip-Sync, and Dynamic Particle Auras.
 */

class VTuberEngine {
  constructor() {
    this.canvas = document.getElementById('vtuber-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById('avatar-container');

    // Particle Canvas
    this.pCanvas = document.getElementById('particle-canvas');
    this.pCtx = this.pCanvas.getContext('2d');

    // Model path & states
    this.currentModelType = 'origin-model'; // 'origin-model' | 'casual-model' | 'real-origin'
    this.sprites = {
      base: null,
      blink: null,
      shy: null,
      pout: null,
      excited: null,
      real_origin: null
    };

    // Rigging & Animation parameters
    this.time = 0;
    this.breathPhase = 0;
    this.breathSpeed = 0.038; // ~15 nhịp thở/phút

    // Eye blinking
    this.isBlinking = false;
    this.blinkTimer = 0;
    this.nextBlinkTime = this.randomBetween(2500, 5000);
    this.blinkDuration = 140; // ms

    // Mouse Tracking & Head Parallax
    this.targetMouse = { x: 0, y: 0 };
    this.currentMouse = { x: 0, y: 0 };
    this.headAngle = 0;

    // Expressions & Emotions
    this.currentEmotion = 'happy';
    this.targetEmotion = 'happy';
    this.emotionAlpha = 1.0;

    // Voice & Lip-Sync (Web Audio API)
    this.audioContext = null;
    this.analyser = null;
    this.audioData = null;
    this.isSpeaking = false;
    this.speechAmplitude = 0;
    this.speechBounce = 0;

    // Particles system
    this.particles = [];
    this.maxParticles = 35;

    this.init();
  }

  async init() {
    this.resizeParticleCanvas();
    window.addEventListener('resize', () => this.resizeParticleCanvas());

    await this.loadSprites();
    this.bindMouseTracking();
    this.bindHitboxes();
    this.initParticles();

    // Start Main Render Loops
    requestAnimationFrame((ts) => this.renderLoop(ts));
    requestAnimationFrame((ts) => this.renderParticlesLoop(ts));
  }

  resizeParticleCanvas() {
    this.pCanvas.width = window.innerWidth;
    this.pCanvas.height = window.innerHeight;
  }

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Load character sprite layers
   */
  async loadSprites() {
    const basePath =
      this.currentModelType === 'casual-model'
        ? 'assets/lan_anh'
        : 'assets/lan_anh_model';

    const spritePaths = {
      base: `${basePath}/base.png`,
      blink: `${basePath}/blink.png`,
      shy: `${basePath}/shy.png`,
      pout: `${basePath}/pout.png`,
      excited: `${basePath}/excited.png`,
      real_origin: 'assets/origin.jpg'
    };

    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn('Không thể tải sprite:', url);
          resolve(null);
        };
        img.src = url;
      });
    };

    const keys = Object.keys(spritePaths);
    const promises = keys.map((k) => loadImage(spritePaths[k]));
    const results = await Promise.all(promises);

    keys.forEach((k, idx) => {
      this.sprites[k] = results[idx];
    });

    // Cập nhật mini avatar trên header
    const headerAvatar = document.getElementById('header-mini-avatar');
    if (headerAvatar && this.sprites.base) {
      headerAvatar.src = this.sprites.base.src;
    }
  }

  /**
   * Chuyển đổi Model hiển thị
   */
  async setModelType(type) {
    this.currentModelType = type;
    await this.loadSprites();
  }

  /**
   * Lắng nghe di chuột để điều khiển ánh mắt và nghiêng đầu
   */
  bindMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.35; // Điểm mắt/đầu

      const dx = (e.clientX - centerX) / (window.innerWidth / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);

      // Giới hạn góc nghiêng tự nhiên
      this.targetMouse.x = Math.max(-1, Math.min(1, dx));
      this.targetMouse.y = Math.max(-1, Math.min(1, dy));
    });

    window.addEventListener('mouseleave', () => {
      this.targetMouse.x = 0;
      this.targetMouse.y = 0;
    });
  }

  /**
   * Lắng nghe tương tác xoa đầu, véo má, chạm người
   */
  bindHitboxes() {
    const head = document.getElementById('hitbox-head');
    const cheekL = document.getElementById('hitbox-cheek-left');
    const cheekR = document.getElementById('hitbox-cheek-right');
    const body = document.getElementById('hitbox-body');

    if (head) {
      head.addEventListener('click', () => {
        this.triggerInteraction('headpat');
      });
    }

    if (cheekL) {
      cheekL.addEventListener('click', () => {
        this.triggerInteraction('pinch_cheek');
      });
    }

    if (cheekR) {
      cheekR.addEventListener('click', () => {
        this.triggerInteraction('pinch_cheek');
      });
    }

    if (body) {
      body.addEventListener('click', () => {
        this.triggerInteraction('touch_body');
      });
    }
  }

  /**
   * Kích hoạt tương tác cảm ứng
   */
  async triggerInteraction(type) {
    if (window.chatManager) {
      window.chatManager.handleTouch(type);
    }
    if (type === 'headpat') {
      this.spawnHeartBurst();
      this.setEmotion('shy');
    } else if (type === 'pinch_cheek') {
      this.spawnPoutSteam();
      this.setEmotion('pout');
    }
  }

  /**
   * Khởi tạo Web Audio Analyser cho Lip-Sync
   */
  setupAudioAnalyser(audioElement) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
      }

      const source = this.audioContext.createMediaElementSource(audioElement);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Audio Context init notice:', e.message);
    }
  }

  /**
   * Bắt đầu hoặc dừng trạng thái nói chuyện
   */
  setSpeaking(speaking, customAmplitude = 0) {
    this.isSpeaking = speaking;
    if (!speaking) {
      this.speechAmplitude = 0;
      this.speechBounce = 0;
      const wave = document.getElementById('voice-wave');
      if (wave) wave.classList.remove('active');
    } else {
      this.speechAmplitude = customAmplitude;
      const wave = document.getElementById('voice-wave');
      if (wave) wave.classList.add('active');
    }
  }

  /**
   * Đổi biểu cảm và hiệu ứng hạt aura
   */
  setEmotion(emotion) {
    this.currentEmotion = emotion;
    this.targetEmotion = emotion;

    // Reset hoặc điều chỉnh hạt aura
    if (emotion === 'shy') {
      this.spawnHeartBurst();
    } else if (emotion === 'excited_gaming') {
      this.spawnGamingSparks();
    }
  }

  /**
   * Main VTuber 2.5D Canvas Render Loop
   */
  renderLoop(timestamp) {
    this.time = timestamp;
    this.updateAnimationPhysics();
    this.drawCharacter();
    requestAnimationFrame((ts) => this.renderLoop(ts));
  }

  /**
   * Tính toán vật lý chuyển động tự nhiên
   */
  updateAnimationPhysics() {
    // 1. Nhịp thở tự nhiên (Breathing Cycle)
    this.breathPhase += this.breathSpeed;
    const breathOffset = Math.sin(this.breathPhase) * 3.5;
    const breathScaleY = 1 + Math.sin(this.breathPhase) * 0.008;
    const breathScaleX = 1 - Math.sin(this.breathPhase) * 0.004;

    // 2. Chớp mắt tự nhiên (Procedural Eye Blinking)
    if (!this.isBlinking) {
      this.blinkTimer += 16;
      if (this.blinkTimer >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkTimer = 0;
        this.nextBlinkTime = this.randomBetween(2800, 5500);

        // 25% cơ hội chớp mắt kép (double-blink)
        if (Math.random() < 0.25) {
          setTimeout(() => {
            this.isBlinking = true;
            setTimeout(() => (this.isBlinking = false), 120);
          }, 240);
        }

        setTimeout(() => {
          this.isBlinking = false;
        }, this.blinkDuration);
      }
    }

    // 3. Chuột tracking và độ nghiêng đầu (Lerp Smoothing)
    this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.07;
    this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.07;
    this.headAngle = this.currentMouse.x * 0.08; // Radian nghiêng đầu

    // 4. Phân tích âm thanh Lip-Sync (Web Audio API)
    if (this.analyser && this.isSpeaking) {
      this.analyser.getByteFrequencyData(this.audioData);
      let sum = 0;
      for (let i = 0; i < this.audioData.length; i++) {
        sum += this.audioData[i];
      }
      const avg = sum / this.audioData.length;
      this.speechAmplitude = Math.min(1.0, avg / 75.0);
      this.speechBounce = Math.sin(this.time * 0.02) * (this.speechAmplitude * 4);
    } else if (this.isSpeaking) {
      // Procedural synthetic speech modulation
      this.speechAmplitude = 0.5 + Math.sin(this.time * 0.025) * 0.5;
      this.speechBounce = Math.sin(this.time * 0.02) * 3;
    } else {
      this.speechAmplitude = 0;
      this.speechBounce = 0;
    }

    this.currentBreath = {
      offsetY: breathOffset + this.speechBounce,
      scaleX: breathScaleX,
      scaleY: breathScaleY
    };
  }

  /**
   * Vẽ nhân vật lên Canvas với các tầng layer biểu cảm
   */
  drawCharacter() {
    const { ctx, canvas } = this;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Chế độ xem ảnh gốc
    if (this.currentModelType === 'real-origin') {
      const originImg = this.sprites.real_origin;
      if (originImg) {
        ctx.save();
        const aspect = originImg.width / originImg.height;
        const targetH = ch * 0.95;
        const targetW = targetH * aspect;
        const x = (cw - targetW) / 2 + this.currentMouse.x * 12;
        const y = ch - targetH + this.currentBreath.offsetY;

        ctx.drawImage(originImg, x, y, targetW, targetH);
        ctx.restore();
      }
      return;
    }

    // Xác định Sprite chính để hiển thị theo Biểu Cảm & Lip-Sync
    let activeSprite = this.sprites.base;

    // Khi đang nói và âm lượng lớn -> dùng sprite excited / khẩu hình mở
    if (this.isSpeaking && this.speechAmplitude > 0.35 && this.sprites.excited) {
      activeSprite = this.sprites.excited;
    } else if (this.isBlinking && this.sprites.blink) {
      // Khi đang chớp mắt
      activeSprite = this.sprites.blink;
    } else {
      // Theo cảm xúc
      switch (this.currentEmotion) {
        case 'shy':
          activeSprite = this.sprites.shy || this.sprites.base;
          break;
        case 'pout':
          activeSprite = this.sprites.pout || this.sprites.base;
          break;
        case 'excited_gaming':
          activeSprite = this.sprites.excited || this.sprites.base;
          break;
        default:
          activeSprite = this.sprites.base;
      }
    }

    if (!activeSprite) return;

    ctx.save();

    // Tọa độ gốc xoay/nghiêng ở vị trí ngực/cổ nhân vật
    const pivotX = cw / 2;
    const pivotY = ch * 0.65;

    ctx.translate(pivotX, pivotY);

    // Chuyển động Parallax chuột
    const parallaxX = this.currentMouse.x * 16;
    const parallaxY = this.currentMouse.y * 10;
    ctx.translate(parallaxX, parallaxY + this.currentBreath.offsetY);

    // Xoay nhẹ đầu theo chuột
    ctx.rotate(this.headAngle);

    // Tỉ lệ thở (Breathing Scale)
    ctx.scale(this.currentBreath.scaleX, this.currentBreath.scaleY);

    // Tóc đung đưa nhẹ theo chu kỳ thở (Sinusoidal sway)
    const hairSway = Math.sin(this.time * 0.002) * 0.012;
    ctx.rotate(hairSway);

    // Vẽ hình ảnh nhân vật căn giữa
    const imgW = cw * 0.95;
    const imgH = ch * 0.95;
    ctx.drawImage(activeSprite, -imgW / 2, -imgH + (ch * 0.35), imgW, imgH);

    // Tầng hiệu ứng đỏ mặt bổ sung khi đang shy
    if (this.currentEmotion === 'shy') {
      ctx.save();
      ctx.fillStyle = 'rgba(244, 114, 182, 0.16)';
      ctx.beginPath();
      ctx.ellipse(-55, -280, 40, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(55, -280, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Hệ thống Aura Hạt Hiệu Ứng (Dynamic Particle Aura)
   */
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: this.randomBetween(8, 18),
      speedY: this.randomBetween(0.4, 1.2),
      speedX: this.randomBetween(-0.5, 0.5),
      rotation: Math.random() * 360,
      rotationSpeed: this.randomBetween(-1.5, 1.5),
      opacity: this.randomBetween(0.2, 0.7),
      type: this.getParticleTypeForEmotion()
    };
  }

  getParticleTypeForEmotion() {
    switch (this.currentEmotion) {
      case 'shy':
        return 'heart';
      case 'excited_gaming':
        return Math.random() > 0.5 ? 'spark' : 'star';
      case 'pout':
        return 'steam';
      case 'nostalgic':
        return 'petal';
      default:
        return Math.random() > 0.4 ? 'petal' : 'star';
    }
  }

  spawnHeartBurst() {
    for (let i = 0; i < 15; i++) {
      const p = this.createParticle();
      p.x = window.innerWidth / 2 + this.randomBetween(-120, 120);
      p.y = window.innerHeight * 0.45 + this.randomBetween(-40, 40);
      p.speedY = this.randomBetween(-2.5, -0.8);
      p.speedX = this.randomBetween(-1.5, 1.5);
      p.type = 'heart';
      p.opacity = 0.9;
      this.particles.push(p);
    }
  }

  spawnPoutSteam() {
    for (let i = 0; i < 8; i++) {
      const p = this.createParticle();
      p.x = window.innerWidth / 2 + (Math.random() > 0.5 ? 90 : -90);
      p.y = window.innerHeight * 0.4;
      p.speedY = -1.2;
      p.speedX = p.x > window.innerWidth / 2 ? 0.8 : -0.8;
      p.type = 'steam';
      p.opacity = 0.8;
      this.particles.push(p);
    }
  }

  spawnGamingSparks() {
    for (let i = 0; i < 15; i++) {
      const p = this.createParticle();
      p.x = window.innerWidth / 2 + this.randomBetween(-150, 150);
      p.y = window.innerHeight * 0.5 + this.randomBetween(-150, 150);
      p.speedY = this.randomBetween(-2, 2);
      p.speedX = this.randomBetween(-2, 2);
      p.type = 'spark';
      p.opacity = 0.95;
      this.particles.push(p);
    }
  }

  renderParticlesLoop() {
    const { pCtx, pCanvas } = this;
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      // Vẽ hạt theo loại
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate((p.rotation * Math.PI) / 180);
      pCtx.globalAlpha = p.opacity;

      if (p.type === 'heart') {
        pCtx.fillStyle = '#f472b6';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('💖', -p.size / 2, p.size / 2);
      } else if (p.type === 'star') {
        pCtx.fillStyle = '#fbbf24';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('✨', -p.size / 2, p.size / 2);
      } else if (p.type === 'petal') {
        pCtx.fillStyle = 'rgba(251, 207, 232, 0.75)';
        pCtx.beginPath();
        pCtx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        pCtx.fill();
      } else if (p.type === 'steam') {
        pCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('♨️', -p.size / 2, p.size / 2);
      } else if (p.type === 'spark') {
        pCtx.fillStyle = '#38bdf8';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('⚡', -p.size / 2, p.size / 2);
      }

      pCtx.restore();

      // Reset nếu trôi khỏi màn hình
      if (p.y > pCanvas.height + 40 || p.y < -40) {
        p.y = p.speedY > 0 ? -20 : pCanvas.height + 20;
        p.x = Math.random() * pCanvas.width;
        p.type = this.getParticleTypeForEmotion();
      }
    }

    requestAnimationFrame(() => this.renderParticlesLoop());
  }
}

// Khởi tạo Engine khi trang load
window.addEventListener('DOMContentLoaded', () => {
  window.vtuber = new VTuberEngine();
});

/**
 * Chấp Niệm - Lan Anh VTuber 2.5D Interactive Engine
 * Handles Live Rigging, Idle Breathing, Procedural Eye Blinking,
 * Mouse Parallax Tracking, Web Audio Lip-Sync, and Ambient Floral Particles.
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

    // Voice & Lip-Sync (Web Audio API)
    this.audioContext = null;
    this.analyser = null;
    this.audioData = null;
    this.isSpeaking = false;
    this.speechAmplitude = 0;
    this.speechBounce = 0;

    // Ambient Floral Particles (Cánh hoa trắng nhỏ, cúc họa mi, đốm sáng vàng kem)
    this.particles = [];
    this.maxParticles = 40;

    this.init();
  }

  async init() {
    this.resizeParticleCanvas();
    window.addEventListener('resize', () => this.resizeParticleCanvas());

    await this.loadSprites();
    this.bindMouseTracking();
    this.bindHitboxes();
    this.initFloralParticles();

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

    // Cập nhật mini avatar trên header nếu có
    const headerAvatar = document.getElementById('header-mini-avatar');
    if (headerAvatar && this.sprites.base) {
      headerAvatar.src = 'favicon.png';
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
   * Lắng nghe di chuột để điều khiển ánh mắt, góc nghiêng đầu và gió thổi hạt hoa
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

    // Touch event cho mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height * 0.35;

        const dx = (touch.clientX - centerX) / (window.innerWidth / 2);
        const dy = (touch.clientY - centerY) / (window.innerHeight / 2);

        this.targetMouse.x = Math.max(-1, Math.min(1, dx));
        this.targetMouse.y = Math.max(-1, Math.min(1, dy));
      }
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
   * Bắt đầu hoặc dừng trạng thái nói chuyện (Lip-Sync)
   */
  setSpeaking(speaking, customAmplitude = 0) {
    this.isSpeaking = speaking;
    const wave = document.getElementById('voice-wave');
    if (!speaking) {
      this.speechAmplitude = 0;
      this.speechBounce = 0;
      if (wave) wave.classList.remove('active');
    } else {
      this.speechAmplitude = customAmplitude || 0.6;
      if (wave) wave.classList.add('active');
    }
  }

  /**
   * Đổi biểu cảm
   */
  setEmotion(emotion) {
    this.currentEmotion = emotion;
    this.targetEmotion = emotion;

    if (emotion === 'shy') {
      this.spawnHeartBurst();
    } else if (emotion === 'excited_gaming') {
      this.spawnGamingSparks();
    }
  }

  /**
   * Main Render Loop
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
    this.headAngle = this.currentMouse.x * 0.08;

    // 4. Phân tích âm thanh Lip-Sync
    if (this.isSpeaking) {
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
   * Vẽ nhân vật lên Canvas
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

    // Xác định Sprite chính
    let activeSprite = this.sprites.base;

    if (this.isSpeaking && this.speechAmplitude > 0.35 && this.sprites.excited) {
      activeSprite = this.sprites.excited;
    } else if (this.isBlinking && this.sprites.blink) {
      activeSprite = this.sprites.blink;
    } else {
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

    const pivotX = cw / 2;
    const pivotY = ch * 0.65;

    ctx.translate(pivotX, pivotY);

    const parallaxX = this.currentMouse.x * 16;
    const parallaxY = this.currentMouse.y * 10;
    ctx.translate(parallaxX, parallaxY + this.currentBreath.offsetY);

    ctx.rotate(this.headAngle);
    ctx.scale(this.currentBreath.scaleX, this.currentBreath.scaleY);

    // Tóc đung đưa nhẹ
    const hairSway = Math.sin(this.time * 0.002) * 0.012;
    ctx.rotate(hairSway);

    const imgW = cw * 0.95;
    const imgH = ch * 0.95;
    ctx.drawImage(activeSprite, -imgW / 2, -imgH + (ch * 0.35), imgW, imgH);

    // Tầng ửng hồng khi shy
    if (this.currentEmotion === 'shy') {
      ctx.save();
      ctx.fillStyle = 'rgba(232, 153, 141, 0.22)';
      ctx.beginPath();
      ctx.ellipse(-55, -280, 42, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(55, -280, 42, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Ambient Floral Particles (Cánh hoa trắng nhỏ, cúc họa mi, đốm sáng vàng kem #FFF6D6)
   */
  initFloralParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createFloralParticle());
    }
  }

  createFloralParticle() {
    const types = ['white_petal', 'chamomile', 'golden_speck', 'peach_petal'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: this.randomBetween(6, 16),
      speedY: this.randomBetween(0.35, 1.1),
      speedX: this.randomBetween(-0.4, 0.4),
      rotation: Math.random() * 360,
      rotationSpeed: this.randomBetween(-1.2, 1.2),
      opacity: this.randomBetween(0.35, 0.8),
      type: chosenType
    };
  }

  spawnHeartBurst() {
    for (let i = 0; i < 16; i++) {
      const p = this.createFloralParticle();
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
      const p = this.createFloralParticle();
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
      const p = this.createFloralParticle();
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

    const windX = this.currentMouse.x * 0.8;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speedY;
      p.x += p.speedX + windX;
      p.rotation += p.rotationSpeed;

      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate((p.rotation * Math.PI) / 180);
      pCtx.globalAlpha = p.opacity;

      if (p.type === 'white_petal') {
        // Cánh hoa trắng nhỏ
        pCtx.fillStyle = '#FFFFFF';
        pCtx.beginPath();
        pCtx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        pCtx.fill();
      } else if (p.type === 'peach_petal') {
        // Cánh hoa hồng đào phấn #E8998D
        pCtx.fillStyle = 'rgba(232, 153, 141, 0.85)';
        pCtx.beginPath();
        pCtx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        pCtx.fill();
      } else if (p.type === 'chamomile') {
        // Hoa cúc họa mi / floret
        pCtx.fillStyle = '#FFFDF7';
        for (let a = 0; a < 6; a++) {
          pCtx.rotate(Math.PI / 3);
          pCtx.beginPath();
          pCtx.ellipse(p.size * 0.4, 0, p.size * 0.4, p.size * 0.18, 0, 0, Math.PI * 2);
          pCtx.fill();
        }
        // Nhụy vàng cam ấm
        pCtx.fillStyle = '#D97F43';
        pCtx.beginPath();
        pCtx.arc(0, 0, p.size * 0.22, 0, Math.PI * 2);
        pCtx.fill();
      } else if (p.type === 'golden_speck') {
        // Đốm sáng vàng kem #FFF6D6
        pCtx.fillStyle = '#FFF6D6';
        pCtx.shadowColor = '#F5DEAA';
        pCtx.shadowBlur = 8;
        pCtx.beginPath();
        pCtx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
        pCtx.fill();
      } else if (p.type === 'heart') {
        pCtx.fillStyle = '#E8998D';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('💕', -p.size / 2, p.size / 2);
      } else if (p.type === 'steam') {
        pCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('♨️', -p.size / 2, p.size / 2);
      } else if (p.type === 'spark') {
        pCtx.fillStyle = '#D97F43';
        pCtx.font = `${p.size}px serif`;
        pCtx.fillText('✨', -p.size / 2, p.size / 2);
      }

      pCtx.restore();

      // Reset khi trôi khỏi màn hình
      if (p.y > pCanvas.height + 30 || p.y < -30) {
        p.y = -20;
        p.x = Math.random() * pCanvas.width;
      }
    }

    requestAnimationFrame(() => this.renderParticlesLoop());
  }
}

// Khởi tạo Engine khi trang load
window.addEventListener('DOMContentLoaded', () => {
  window.vtuber = new VTuberEngine();
});

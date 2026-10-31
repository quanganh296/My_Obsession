/**
 * Lan Anh VTuber Chat & Interaction Manager
 * Handles AI Communication, Vietnamese TTS, Voice Recognition (STT),
 * Memory Timeline sync, and UI Modal controls.
 */

class ChatManager {
  constructor() {
    this.chatInput = document.getElementById('chat-input');
    this.btnSend = document.getElementById('btn-send');
    this.btnMic = document.getElementById('btn-mic');

    // Display elements
    this.thoughtText = document.getElementById('thought-text');
    this.captionText = document.getElementById('caption-text');
    this.emotionIndicator = document.getElementById('emotion-indicator');
    this.actionIndicator = document.getElementById('action-indicator');
    this.intimacyFill = document.getElementById('intimacy-fill');
    this.intimacyVal = document.getElementById('intimacy-val');

    // Speech synthesis & recognition
    this.synth = window.speechSynthesis;
    this.selectedVoice = null;
    this.ttsRate = 1.0;
    this.ttsPitch = 1.15; // Giọng nữ trẻ trung trong trẻo

    this.recognition = null;
    this.isListening = false;

    // API Key from storage
    this.apiKey = localStorage.getItem('gemini_api_key') || '';

    this.init();
  }

  init() {
    this.bindEvents();
    this.initVoices();
    this.initSpeechRecognition();
    this.loadMemory();
    this.initModals();
  }

  /**
   * Khởi tạo danh sách giọng nói tiếng Việt
   */
  initVoices() {
    const updateVoiceList = () => {
      const voices = this.synth.getVoices();
      const viVoices = voices.filter(
        (v) => v.lang.includes('vi') || v.lang.includes('VN')
      );

      const voiceSelect = document.getElementById('select-voice');
      if (voiceSelect) {
        voiceSelect.innerHTML = '';
        if (viVoices.length > 0) {
          viVoices.forEach((v, i) => {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.textContent = `${v.name} (${v.lang})`;
            voiceSelect.appendChild(opt);
          });
          this.selectedVoice = viVoices[0];
        } else {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Tiếng Việt mặc định của hệ thống';
          voiceSelect.appendChild(opt);
        }
      }
    };

    updateVoiceList();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoiceList;
    }
  }

  /**
   * Khởi tạo Speech Recognition (Nhận dạng giọng nói)
   */
  initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'vi-VN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.btnMic.classList.add('listening');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.chatInput.value = transcript;
        this.sendMessage(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('Lỗi nhận dạng giọng nói:', event.error);
        this.isListening = false;
        this.btnMic.classList.remove('listening');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.btnMic.classList.remove('listening');
      };
    } else {
      this.btnMic.title = 'Trình duyệt không hỗ trợ nhận diện giọng nói trực tiếp';
    }
  }

  /**
   * Lắng nghe sự kiện
   */
  bindEvents() {
    // Gửi tin nhắn qua nút bấm
    this.btnSend.addEventListener('click', () => {
      const msg = this.chatInput.value.trim();
      if (msg) {
        this.sendMessage(msg);
        this.chatInput.value = '';
      }
    });

    // Gửi tin nhắn bằng Enter
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const msg = this.chatInput.value.trim();
        if (msg) {
          this.sendMessage(msg);
          this.chatInput.value = '';
        }
      }
    });

    // Voice Input Mic
    this.btnMic.addEventListener('click', () => {
      if (!this.recognition) {
        alert('Trình duyệt chưa bật quyền Micro hoặc chưa hỗ trợ Web Speech Recognition');
        return;
      }
      if (this.isListening) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    });

    // Quick Action Suggestion Chips
    document.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        this.sendMessage(prompt);
      });
    });

    // Rủ chơi Liên Quân từ Panel
    const inviteBtn = document.getElementById('btn-invite-duo');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', () => {
        this.closeAllModals();
        this.sendMessage('Lan Anh ơi, vào game Liên Quân làm vài ván rank với mình đi!');
      });
    }

    // Chọn tướng trong Liên Quân Panel
    document.querySelectorAll('.hero-card').forEach((card) => {
      card.addEventListener('click', () => {
        const hero = card.getAttribute('data-hero');
        this.closeAllModals();
        this.sendMessage(`Trận này Lan Anh vác tướng ${hero} ra gánh mình nhé!`);
      });
    });
  }

  /**
   * Tương tác chạm (Xoa đầu, Véo má)
   */
  async handleTouch(type) {
    try {
      const res = await fetch('/api/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      this.applyAgentResponse(data);
    } catch (e) {
      console.error('Touch error:', e);
    }
  }

  /**
   * Gửi tin nhắn tới AI Backend
   */
  async sendMessage(userMessage) {
    this.captionText.textContent = 'Lan Anh đang suy nghĩ...';
    this.actionIndicator.textContent = 'Chăm chú lắng nghe';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          apiKey: this.apiKey
        })
      });

      const data = await res.json();
      this.applyAgentResponse(data);
    } catch (err) {
      console.error('Lỗi trò chuyện:', err);
      this.captionText.textContent =
        'Ơ kìa, kết nối chập chờn xíu, bạn nói lại với Lan Anh nhé!';
    }
  }

  /**
   * Hiển thị phản hồi từ AI lên HUD và phát giọng nói + lip-sync
   */
  applyAgentResponse(data) {
    if (!data) return;

    // 1. Cập nhật suy nghĩ nội tâm (thought)
    if (data.thought && this.thoughtText) {
      this.thoughtText.textContent = data.thought;
    }

    // 2. Cập nhật trạng thái cảm xúc (emotion)
    if (data.emotion) {
      if (window.vtuber) {
        window.vtuber.setEmotion(data.emotion);
      }
      this.updateEmotionBadge(data.emotion);
    }

    // 3. Cập nhật hành động mô tả (action)
    if (data.action && this.actionIndicator) {
      this.actionIndicator.textContent = data.action;
    }

    // 4. Cập nhật lời nói trực tiếp (reply)
    if (data.reply) {
      this.captionText.textContent = `"${data.reply}"`;
      this.speak(data.reply);
    }

    // 5. Cập nhật độ thân thiết
    this.increaseIntimacy();
  }

  /**
   * Cập nhật nhãn cảm xúc
   */
  updateEmotionBadge(emotion) {
    const labels = {
      happy: '🌸 Vui vẻ, rạng rỡ',
      shy: '💕 Đỏ mặt, ngượng ngùng',
      pout: '💢 Chu mỏ, giận dỗi',
      excited_gaming: '🎮 Phấn khích Liên Quân',
      nostalgic: '🍂 Hoài niệm 7 năm',
      teasing: '✨ Tinh nghịch, trêu đùa'
    };
    if (this.emotionIndicator) {
      this.emotionIndicator.textContent = labels[emotion] || '🌸 Bình yên';
    }
  }

  /**
   * Phát giọng nói Text-to-Speech (TTS) và kích hoạt Lip-Sync
   */
  speak(text) {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis không được hỗ trợ');
      return;
    }

    this.synth.cancel(); // Dừng câu trước nếu còn

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = this.ttsRate;
    utterance.pitch = this.ttsPitch;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      if (window.vtuber) {
        window.vtuber.setSpeaking(true);
      }
    };

    utterance.onend = () => {
      if (window.vtuber) {
        window.vtuber.setSpeaking(false);
      }
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      if (window.vtuber) {
        window.vtuber.setSpeaking(false);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * Tăng điểm thân thiết
   */
  increaseIntimacy() {
    let current = parseInt(this.intimacyVal.textContent) || 85;
    if (current < 100) {
      current += 1;
      this.intimacyVal.textContent = `${current}%`;
      this.intimacyFill.style.width = `${current}%`;
    }
  }

  /**
   * Tải dữ liệu bộ nhớ 7 năm từ server
   */
  async loadMemory() {
    try {
      const res = await fetch('/api/memory');
      const memory = await res.json();
      if (memory && memory.core_memories) {
        const timelineList = document.getElementById('memory-timeline-list');
        if (timelineList) {
          timelineList.innerHTML = '';
          memory.core_memories.forEach((m) => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
              <div class="timeline-year">${m.period} • Năm ${m.year}</div>
              <h3 class="timeline-title">${m.title}</h3>
              <p class="timeline-content">${m.content}</p>
            `;
            timelineList.appendChild(item);
          });
        }
      }
    } catch (e) {
      console.warn('Không thể load memory timeline:', e);
    }
  }

  /**
   * Quản lý Modals
   */
  initModals() {
    const bindModalToggle = (btnId, modalId) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      if (btn && modal) {
        btn.addEventListener('click', () => {
          this.closeAllModals();
          modal.classList.add('open');
        });
      }
    };

    bindModalToggle('btn-toggle-memory', 'modal-memory');
    bindModalToggle('btn-toggle-gaming', 'modal-gaming');
    bindModalToggle('btn-toggle-model', 'modal-models');
    bindModalToggle('btn-toggle-settings', 'modal-settings');

    // Nút đóng modal
    document.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
      });
    });

    // Đóng modal khi click ra vùng ngoài
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    // Model Selector
    document.querySelectorAll('.model-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.model-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const modelType = card.getAttribute('data-model');
        if (window.vtuber) {
          window.vtuber.setModelType(modelType);
        }
      });
    });

    // Cài đặt API Key
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    const inputApiKey = document.getElementById('input-api-key');
    const rateSlider = document.getElementById('tts-rate');
    const pitchSlider = document.getElementById('tts-pitch');

    if (this.apiKey && inputApiKey) {
      inputApiKey.value = this.apiKey;
    }

    if (rateSlider) {
      rateSlider.addEventListener('input', (e) => {
        this.ttsRate = parseFloat(e.target.value);
        document.getElementById('tts-rate-val').textContent = `${this.ttsRate}x`;
      });
    }

    if (pitchSlider) {
      pitchSlider.addEventListener('input', (e) => {
        this.ttsPitch = parseFloat(e.target.value);
        document.getElementById('tts-pitch-val').textContent = `${this.ttsPitch}x`;
      });
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', async () => {
        const key = inputApiKey.value.trim();
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);

        if (key) {
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
          });
        }

        alert('Cài đặt đã được lưu thành công!');
        this.closeAllModals();
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((m) => {
      m.classList.remove('open');
    });
  }
}

// Khởi tạo Chat Manager khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  window.chatManager = new ChatManager();
});

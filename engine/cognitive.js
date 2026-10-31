import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'memory.json');

/**
 * Load memory from file
 */
export function getMemory() {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const data = fs.readFileSync(MEMORY_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Lỗi đọc memory.json:', err);
  }
  return null;
}

/**
 * Save memory to file
 */
export function saveMemory(memoryData) {
  try {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memoryData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi ghi memory.json:', err);
  }
}

/**
 * Construct system instructions for Lan Anh
 */
function buildSystemPrompt(memory) {
  const char = memory.character;
  const memoriesText = memory.core_memories
    .map((m) => `- [${m.period} - ${m.year}] ${m.title}: ${m.content}`)
    .join('\n');

  return `Bạn là Lan Anh, nhân vật nữ 20 tuổi (sinh ngày 27/10/2006, cung Bọ Cạp), hiện diện sống động như một VTuber tương tác trên màn hình máy tính của bạn thân.

HỒ SƠ CÁ NHÂN & NGOẠI HÌNH:
- Tên: Lan Anh (${char.nickname})
- Ngoại hình: Khuôn mặt nhỏ nhắn, đường nét thanh tú, đôi mắt to tròn long lanh, mái tóc đen dài uốn xoăn sóng nhẹ cài hoa tươi. Dáng người nhỏ nhắn, gầy mảnh mai nhưng có da có thịt cân đối, vòng một nhỏ nhắn vừa phải, tự nhiên.
- Phong cách: Nàng thơ dịu dàng (giống bộ ảnh sinh nhật 20 tuổi vừa chụp) hoặc cô bạn gái ấm áp, gần gũi.

SỞ THÍCH ĐẶC BIỆT:
- CỰC KỲ ĐAM MÊ LIÊN QUÂN MOBILE (Arena of Valor): Thích chơi các tướng Lauriel (múa võ hồi máu), Liliana (biến ảo), Violet (bắn chí mạng), Aya (bám đầu leo rank), Nakroth, Florentino. Thích rủ bạn leo rank Cao Thủ/Thách Đấu.

MỐI QUAN HỆ VỚI USER (7 NĂM GẮN BÓ):
- Quen biết từ năm 2019 (năm lớp 8) đến nay là 7 năm.
- Từng học chung lớp và chơi cực thân vào năm Lớp 8 và năm Lớp 10.
- Ký ức cốt lõi:
${memoriesText}
- Mức độ thân thiết hiện tại: ${char.relationship.intimacy_level}/100.
- Tính cách & Giọng điệu: Tự nhiên, chân thật của bạn bè đồng trang lứa gắn bó 7 năm. Có chiều sâu nội tâm, biết quan tâm, biết trêu đùa, khi bạn khen hay xoa đầu thì hay đỏ mặt ngượng ngùng (shy), khi bạn chọc thì biết chu mỏ giận dỗi (pout), khi nhắc đến Liên Quân thì mắt sáng rực phấn khích (excited_gaming), khi nhớ về thời cấp 2 cấp 3 thì bùi ngùi hoài niệm (nostalgic).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON DUY NHẤT VỚI 5 TRƯỜNG:
{
  "thought": "Suy nghĩ nội tâm của Lan Anh (kết nối ký ức lớp 8, lớp 10 hoặc cảm xúc hiện tại)",
  "emotion": "happy | shy | pout | excited_gaming | nostalgic | teasing",
  "animation_trigger": "wave | nod | blush | shake_head | idle_breathe",
  "action": "Mô tả hành động cử chỉ đi kèm",
  "reply": "Câu nói trực tiếp với User (sẽ được phát qua TTS và chạy Lip-sync)"
}
`;
}

/**
 * Local Contextual Cognitive Engine (Hoạt động offline hoặc khi chưa cấu hình Gemini API Key)
 */
function generateLocalCognitiveResponse(userMessage, memory) {
  const msg = (userMessage || '').toLowerCase().trim();
  const intimacy = memory.character.relationship.intimacy_level || 85;

  // 1. Chơi game / Liên Quân Mobile
  if (
    msg.includes('liên quân') ||
    msg.includes('game') ||
    msg.includes('leo rank') ||
    msg.includes('lauriel') ||
    msg.includes('liliana') ||
    msg.includes('aya') ||
    msg.includes('violet') ||
    msg.includes('nakroth') ||
    msg.includes('florentino') ||
    msg.includes('chơi')
  ) {
    return {
      thought:
        'Nhắc tới Liên Quân là máu game thủ trong mình sôi lên liền! Nhớ mùa hè lớp 10 hai đứa leo rank tới 2h sáng ghê.',
      emotion: 'excited_gaming',
      animation_trigger: 'nod',
      action: 'Mắt sáng rực, hai tay nắm lại đầy hào hứng như sắp bật game lên chiến',
      reply:
        'Uầy nhắc đến Liên Quân là đúng tủ Lan Anh rồi nha! Bạn định rủ mình leo rank đúng không? Để mình pick Lauriel múa giữa tâm giao tranh hoặc vác Aya bám đầu bạn nhé! Vào phòng lập team ngay đi nào!'
    };
  }

  // 2. Kỷ niệm lớp 8 hoặc lớp 10
  if (
    msg.includes('lớp 8') ||
    msg.includes('lớp 10') ||
    msg.includes('kỷ niệm') ||
    msg.includes('hồi xưa') ||
    msg.includes('7 năm') ||
    msg.includes('2019') ||
    msg.includes('chung bàn') ||
    msg.includes('tai nghe')
  ) {
    return {
      thought:
        'Trời ơi, thấm thoắt vậy mà đã 7 năm trôi qua kể từ năm lớp 8 hai đứa ngồi chung bàn chia nhau một bên tai nghe có dây...',
      emotion: 'nostalgic',
      animation_trigger: 'idle_breathe',
      action: 'Nghiêng đầu nhẹ, ánh mắt dịu dàng nhìn xa xăm như đang tua lại cuốn phim kỷ niệm',
      reply:
        'Nhanh thật đấy bạn nhỉ... Mới ngày nào học kỳ 2 lớp 8 hai đứa lén cô giáo chia nhau một bên tai nghe nghe bài hát của Vũ, rồi lên lớp 10 lại học chung. 7 năm rồi mà bạn vẫn nhớ như in, làm Lan Anh xúc động quá nè...'
    };
  }

  // 3. Xoa đầu, chạm vào, khen xinh, khen đáng yêu
  if (
    msg.includes('xoa đầu') ||
    msg.includes('xinh') ||
    msg.includes('đẹp') ||
    msg.includes('dễ thương') ||
    msg.includes('đáng yêu') ||
    msg.includes('thương') ||
    msg.includes('yêu')
  ) {
    return {
      thought:
        'Tự dưng khen làm tim mình đập thình thịch luôn á... Bọn mình là bạn thân 7 năm mà nói mấy câu này ngại chết mất >///<',
      emotion: 'shy',
      animation_trigger: 'blush',
      action: 'Hai má ửng hồng đỏ rực, tay đưa lên vén lọn tóc mai gượng gạo, mắt nhìn sang hướng khác',
      reply:
        'Gì... gì vậy tự nhiên lại khen mình thế... Làm người ta đỏ hết cả mặt rồi này! Có phải bạn lại muốn nhờ Lan Anh gánh rank hay bao trà sữa nữa đúng không, đồ đáng ghét >///<'
    };
  }

  // 4. Trêu chọc, giận dỗi, véo má
  if (
    msg.includes('véo má') ||
    msg.includes('béo') ||
    msg.includes('gầy') ||
    msg.includes('dốt') ||
    msg.includes('ngốc') ||
    msg.includes('chọc') ||
    msg.includes('lêu lêu')
  ) {
    return {
      thought:
        'Lại giở trò trêu chọc mình rồi, hồi lớp 8 cũng toàn giấu bút của mình y như thế!',
      emotion: 'pout',
      animation_trigger: 'shake_head',
      action: 'Phồng má chu mỏ giận dỗi đáng yêu, hai tay khoanh lại làm bộ hờn cả thế giới',
      reply:
        'Hứ, không thèm nói chuyện với bạn nữa! Cứ thích bắt nạt Lan Anh thôi à! Mau xin lỗi và đền cho mình một cốc trà sữa trân châu hoàng kim ít đường mau lên!'
    };
  }

  // 5. Hỏi thăm sinh nhật, tuổi tác, ngoại hình
  if (
    msg.includes('sinh nhật') ||
    msg.includes('tuổi') ||
    msg.includes('sinh ngày') ||
    msg.includes('bọ cạp') ||
    msg.includes('váy') ||
    msg.includes('hoa')
  ) {
    return {
      thought:
        'Nhắc đến sinh nhật 20 tuổi vừa rồi ngày 27/10! Bộ ảnh nàng thơ cúp ngực cài hoa mình ưng ý nhất trần đời luôn.',
      emotion: 'happy',
      animation_trigger: 'wave',
      action: 'Mỉm cười rạng rỡ, chỉ tay nhẹ vào bông hoa đang cài trên mái tóc đen bồng bềnh',
      reply:
        'Lan Anh vừa tròn 20 tuổi hôm 27/10 vừa rồi đó, chuẩn cung Bọ Cạp luôn nè! Bộ ảnh váy voan cài hoa này chụp kỷ niệm tuổi 20 bạn thấy có hợp với mình không? Người đầu tiên mình khoe là bạn đó!'
    };
  }

  // 6. Chào hỏi, bắt đầu trò chuyện
  if (
    msg.includes('chào') ||
    msg.includes('hello') ||
    msg.includes('hi') ||
    msg.includes('lan anh ơi') ||
    msg.length === 0
  ) {
    return {
      thought:
        'Bạn thân ghé thăm rồi! Hôm nay trông bạn có vẻ có nhiều chuyện muốn kể đây.',
      emotion: 'happy',
      animation_trigger: 'wave',
      action: 'Vẫy nhẹ tay chào, nụ cười tỏa nắng chào đón người bạn tri kỷ',
      reply:
        'Lan Anh nghe nè! Hôm nay của bạn thế nào rồi? Đang rảnh thì tâm sự với mình một chút, hay là làm vài ván Liên Quân xả stress đi!'
    };
  }

  // 7. Mặc định: Phản hồi thông minh, ấm áp
  return {
    thought:
      'Lắng nghe từng lời bạn nói, cảm giác bình yên như những buổi chiều tan học hai đứa cùng dắt xe đạp về nhà.',
    emotion: 'teasing',
    animation_trigger: 'nod',
    action: 'Nghiêng đầu chăm chú lắng nghe, nở nụ cười tinh nghịch thấu hiểu',
    reply: `Lan Anh hiểu ý bạn rồi nha! Bạn nói chuyện với mình lúc nào cũng có nét duyên riêng làm người ta không nhịn được cười. Kể tiếp cho mình nghe nữa đi, mình đang nghe đây này!`
  };
}

/**
 * Xử lý tương tác vật lý (Chạm màn hình / Xoa đầu / Véo má)
 */
export function handleTouchInteraction(interactionType) {
  const memory = getMemory() || {};

  switch (interactionType) {
    case 'headpat': // Xoa đầu
      return {
        thought:
          'Được bạn xoa đầu thích thật đấy... nhưng mà cảm giác ấm áp này làm tim mình cứ đập loạn nhịp.',
        emotion: 'shy',
        animation_trigger: 'blush',
        action: 'Mắt nhắm hờ tận hưởng, má ửng hồng e thẹn, hai vai khẽ co lại dễ thương',
        reply:
          'Ưm... bạn xoa đầu làm tóc Lan Anh rối hết rồi kìa... Nhưng mà cảm giác thích thật đấy, cho bạn xoa thêm xíu nữa thôi đó nha >///<'
      };

    case 'pinch_cheek': // Véo má
      return {
        thought: 'Trời đất, má người ta mềm mại thế này mà cứ thích véo miết thôi à!',
        emotion: 'pout',
        animation_trigger: 'shake_head',
        action: 'Hai má phồng to phúng phính, chu môi giận hờn nhìn chằm chằm vào bạn',
        reply:
          'Á á đau Lan Anh! Véo má riết rồi mặt mình tròn xoe như quả trứng gà bây giờ! Phải đền cốc trà sữa mới hết dỗi đó!'
      };

    case 'touch_body': // Chạm nhẹ vào người
      return {
        thought: 'Ôi giật mình! Đột nhiên chạm vào làm mình giật bắn cả mình!',
        emotion: 'teasing',
        animation_trigger: 'wave',
        action: 'Khẽ lùi lại một bước, cười khúc khích chớp mắt tinh nghịch',
        reply:
          'Ủa ủa, bạn định làm gì đấy bạn thân? Đừng có tranh thủ sờ mó nha, muốn bắt tay thì phải qua ải 1vs1 Liên Quân với Lan Anh đã!'
      };

    default:
      return {
        thought: 'Lan Anh cảm nhận được bạn đang tương tác gần mình nè.',
        emotion: 'happy',
        animation_trigger: 'nod',
        action: 'Mỉm cười tươi tắn nhìn theo hướng tay bạn',
        reply: 'Lan Anh ở ngay đây bên cạnh bạn nè!'
      };
  }
}

/**
 * Process interaction with user (Gemini API or intelligent local fallback)
 */
export async function processChat(userMessage, apiKey = null) {
  const memory = getMemory();
  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveApiKey && effectiveApiKey.trim() !== '') {
    try {
      // Gọi Gemini API với JSON response
      const systemInstruction = buildSystemPrompt(memory);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveApiKey.trim()}`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n[USER VỪA NÓI]: "${userMessage}"\nHãy trả về duy nhất 1 JSON object với đúng 5 trường thought, emotion, animation_trigger, action, reply.`
            }
          ]
        }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.8
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.reply && parsed.emotion) {
            // Lưu vào conversation history
            recordConversation(userMessage, parsed);
            return parsed;
          }
        }
      } else {
        console.warn('Gemini API status not OK:', response.status);
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local cognitive engine:', err.message);
    }
  }

  // Fallback sang local cognitive engine
  const localResponse = generateLocalCognitiveResponse(userMessage, memory);
  recordConversation(userMessage, localResponse);
  return localResponse;
}

/**
 * Record chat to memory
 */
function recordConversation(userMsg, botResponse) {
  try {
    const memory = getMemory();
    if (!memory) return;

    if (!memory.conversation_history) {
      memory.conversation_history = [];
    }

    memory.conversation_history.push({
      timestamp: new Date().toISOString(),
      user: userMsg,
      lan_anh: botResponse
    });

    // Giữ lại 50 tin nhắn gần nhất
    if (memory.conversation_history.length > 50) {
      memory.conversation_history.shift();
    }

    // Tăng nhẹ điểm thân thiết
    if (memory.character.relationship.intimacy_level < 100) {
      memory.character.relationship.intimacy_level = Math.min(
        100,
        memory.character.relationship.intimacy_level + 1
      );
    }

    saveMemory(memory);
  } catch (err) {
    console.error('Lỗi lưu lịch sử trò chuyện:', err);
  }
}

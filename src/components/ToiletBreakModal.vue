<template>
  <div
    class="toilet-modal-overlay interactive"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <!-- Live Floating Ticker while in toilet -->
    <div v-if="!showReceipt" class="toilet-live-card">
      <div class="card-status-pill">
        <span class="live-dot"></span>
        带薪蹲便中 (手机摸鱼)
      </div>

      <div class="toilet-avatar-anim">
        🚽📱
      </div>

      <div class="live-counter-section">
        <div class="counter-label">本次如厕净赚</div>
        <div class="live-cash-val">
          ¥ <span class="cash-nums">{{ liveEarnings.toFixed(2) }}</span>
        </div>
        <div class="live-time-sub">如厕时长：{{ formattedLiveTime }}</div>
      </div>

      <button class="finish-toilet-btn" @click="generateReceipt">
        💩 拉完了！生成回血战报
      </button>
    </div>

    <!-- Receipt Poster Preview -->
    <div v-else class="receipt-dialog">
      <div class="receipt-header-bar">
        <span>📜 如厕精美回血战报</span>
        <button class="close-receipt-btn" @click="done">✕</button>
      </div>

      <div class="canvas-preview-wrapper">
        <canvas ref="receiptCanvas" width="340" height="460" class="receipt-canvas"></canvas>
      </div>

      <div class="receipt-actions">
        <button class="act-btn primary" @click="copyReceiptImage">
          {{ copied ? '✅ 已复制图片到剪贴板' : '📋 复制战报图片' }}
        </button>
        <button class="act-btn secondary" @click="saveReceiptImage">
          💾 保存小票
        </button>
        <button class="act-btn dark" @click="done">
          返回工位
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  secondRate: Number
});

const emit = defineEmits(['finish', 'hover-change']);

const startTime = ref(Date.now());
const elapsedSecs = ref(0);
const showReceipt = ref(false);
const copied = ref(false);
const receiptCanvas = ref(null);

let timer = null;

onMounted(() => {
  timer = setInterval(() => {
    elapsedSecs.value = (Date.now() - startTime.value) / 1000;
  }, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const liveEarnings = computed(() => {
  return elapsedSecs.value * (props.secondRate || 0.05);
});

const formattedLiveTime = computed(() => {
  const s = Math.floor(elapsedSecs.value);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remS).padStart(2, '0')}`;
});

function generateReceipt() {
  if (timer) clearInterval(timer);
  showReceipt.value = true;

  nextTick(() => {
    drawReceiptCanvas();
  });
}

function drawReceiptCanvas() {
  const canvas = receiptCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Thermal paper background with subtle noise & zigzag top
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top paper tear pattern
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < canvas.width; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 6, 8);
    ctx.lineTo(i + 12, 0);
    ctx.fill();
  }

  // Header
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.fillText('🚽 带薪如厕 · 财富小票 🚽', 170, 48);

  ctx.font = '11px -apple-system, monospace';
  ctx.fillStyle = '#78716c';
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  ctx.fillText(nowStr, 170, 70);

  // Dashed separator
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 88);
  ctx.lineTo(320, 88);
  ctx.stroke();
  ctx.setLineDash([]);

  // Details
  ctx.textAlign = 'left';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillStyle = '#292524';

  const rows = [
    { label: '蹲坑项目', val: '带薪如厕 + 刷手机' },
    { label: '如厕时长', val: `${formattedLiveTime.value} (沉浸式)` },
    { label: '消耗纸巾', val: '约 6 节 (公司免费)' },
    { label: '工位折旧费', val: '- ¥ 0.00' },
    { label: '精神回血值', val: '+ 100% 满血' }
  ];

  let y = 120;
  rows.forEach((r) => {
    ctx.fillStyle = '#57534e';
    ctx.fillText(r.label, 26, y);
    ctx.fillStyle = '#1c1917';
    ctx.textAlign = 'right';
    ctx.fillText(r.val, 314, y);
    ctx.textAlign = 'left';
    y += 28;
  });

  // Second dashed separator
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(320, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 20;

  // Huge Net Income
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 13px -apple-system, sans-serif';
  ctx.fillText('⚡️ 本次蹲坑纯利润 ⚡️', 170, y);
  y += 36;

  ctx.font = 'bold 32px monospace';
  ctx.fillText(`¥ ${liveEarnings.value.toFixed(2)}`, 170, y);
  y += 28;

  ctx.fillStyle = '#78716c';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.fillText('“拉的不是屎，拉的是公司的预算！”', 170, y);
  y += 36;

  // Fake Barcode
  ctx.fillStyle = '#1c1917';
  const startX = 40;
  for (let bx = 0; bx < 260; bx += 4) {
    if ((bx * 37) % 7 > 2) {
      ctx.fillRect(startX + bx, y, 2.5, 30);
    }
  }
  y += 38;

  ctx.font = '10px monospace';
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('* CYBER-PET-TOILET-PAYCHECK-V1 *', 170, y);
}

function copyReceiptImage() {
  const canvas = receiptCanvas.value;
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');

  if (window.electronAPI) {
    window.electronAPI.copyImageToClipboard(dataUrl);
  } else {
    canvas.toBlob((blob) => {
      try {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (e) {}
    });
  }

  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2500);
}

function saveReceiptImage() {
  const canvas = receiptCanvas.value;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `CyberPet_如厕战报_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function done() {
  emit('finish');
}
</script>

<style scoped>
.toilet-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 16px 10px;
  background: transparent !important;
  backdrop-filter: none !important;
  z-index: 5000;
  pointer-events: auto !important;
}

.toilet-live-card {
  width: 330px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #0f172a;
  border: 1.5px solid #38bdf8;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.3);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card-status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid #38bdf8;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.toilet-avatar-anim {
  font-size: 54px;
  animation: gentleBob 1.5s infinite ease-in-out;
}

@keyframes gentleBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.live-counter-section {
  text-align: center;
}

.counter-label {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.live-cash-val {
  font-size: 36px;
  font-weight: 900;
  color: #fbbf24;
  text-shadow: 0 0 16px rgba(251, 191, 36, 0.6);
  font-family: 'Press Start 2P', monospace;
  margin: 6px 0;
}

.live-time-sub {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
}

.finish-toilet-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(217, 119, 6, 0.4);
  transition: all 0.2s;
}

.finish-toilet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.6);
}

.receipt-dialog {
  width: 370px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #1e293b;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 1.5px solid #38bdf8;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.3);
}

.receipt-dialog::-webkit-scrollbar {
  width: 6px;
}
.receipt-dialog::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}
.receipt-dialog::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.5);
  border-radius: 4px;
}
.receipt-dialog::-webkit-scrollbar-thumb:hover {
  background: #38bdf8;
}

.receipt-header-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 700;
}

.close-receipt-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.canvas-preview-wrapper {
  background: #f5f5f4;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  max-width: 100%;
}

.receipt-canvas {
  display: block;
  border-radius: 4px;
  max-width: 100%;
  max-height: 380px;
  height: auto;
  object-fit: contain;
}

.receipt-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.act-btn {
  width: 100%;
  padding: 9px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.act-btn.primary {
  background: #3b82f6;
  color: #fff;
}
.act-btn.primary:hover {
  background: #2563eb;
}

.act-btn.secondary {
  background: #059669;
  color: #fff;
}
.act-btn.secondary:hover {
  background: #047857;
}

.act-btn.dark {
  background: #334155;
  color: #e2e8f0;
}
</style>

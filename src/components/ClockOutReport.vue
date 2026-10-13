<template>
  <div
    class="modal-backdrop interactive"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="report-card">
      <div class="card-header">
        <div class="stamp-badge">OFF-DUTY</div>
        <div class="header-title">🏁 下班结算战报 🏁</div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="receipt-divider"></div>

      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">实际搬砖工时</div>
          <div class="stat-val text-cyan">{{ formattedWorkTime }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">有效输出时长</div>
          <div class="stat-val text-green">{{ effectiveOutputTime }} 分钟</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">累计功德</div>
          <div class="stat-val text-yellow">{{ merits }} 点</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">敲木鱼次数</div>
          <div class="stat-val text-purple">{{ fishKnockCount }} 次</div>
        </div>
      </div>

      <div class="cash-section">
        <div class="cash-tip">反向催缴公司资产</div>
        <div class="cash-title">今天已从公司账户搬走</div>
        <div class="cash-number">¥ {{ earnedAmount.toFixed(2) }}</div>
      </div>

      <div class="quote-box">
        “工作是公司的，身体是自己的。今天也是成功回血的一天！”
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" @click="copyReport">
          {{ copied ? '✅ 已复制战报' : '📋 复制战报文本' }}
        </button>
        <button class="btn btn-secondary" @click="$emit('close')">
          下班走人！
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import confetti from 'canvas-confetti';

const props = defineProps({
  workSeconds: Number,
  effectiveMinutes: Number,
  earnedAmount: Number,
  merits: Number,
  fishKnockCount: Number
});

const emit = defineEmits(['close', 'hover-change']);

const copied = ref(false);

const formattedWorkTime = computed(() => {
  const secs = Math.floor(props.workSeconds || 0);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const effectiveOutputTime = computed(() => {
  return Math.max(1, Math.round(props.effectiveMinutes || (props.workSeconds / 60 * 0.75)));
});

onMounted(() => {
  // Confetti celebration
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (e) {}
});

function copyReport() {
  const text = `🎉【赛博工位桌宠 - 今日下班战报】🎉\n` +
    `⏱️ 实际搬砖时长：${formattedWorkTime.value}\n` +
    `⚡️ 有效打字输出：${effectiveOutputTime.value} 分钟\n` +
    `📿 累计敲鱼功德：+${props.merits} 功德 (${props.fishKnockCount} 次)\n` +
    `💰 今天已从公司账户搬走：¥ ${props.earnedAmount.toFixed(2)}\n` +
    `🚀 摸鱼诚可贵，下班价更高！明天继续带薪搬砖！`;

  if (window.electronAPI) {
    window.electronAPI.copyToClipboard(text);
  } else {
    navigator.clipboard.writeText(text);
  }

  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2500);
}
</script>

<style scoped>
.modal-backdrop {
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

.report-card {
  width: 360px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #0f172a;
  border: 1.5px solid #ef4444;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.3);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.report-card::-webkit-scrollbar {
  width: 6px;
}
.report-card::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}
.report-card::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.5);
  border-radius: 4px;
}
.report-card::-webkit-scrollbar-thumb:hover {
  background: #ef4444;
}

@keyframes scaleUp {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.stamp-badge {
  position: absolute;
  top: 18px;
  right: 50px;
  padding: 2px 8px;
  border: 2px solid #ef4444;
  color: #ef4444;
  font-weight: 900;
  font-size: 11px;
  transform: rotate(-12deg);
  border-radius: 4px;
  letter-spacing: 1px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.receipt-divider {
  border-top: 2px dashed #334155;
  margin: 0 -4px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: #1e293b;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-val {
  font-size: 15px;
  font-weight: 700;
}

.text-cyan { color: #38bdf8; }
.text-green { color: #4ade80; }
.text-yellow { color: #fbbf24; }
.text-purple { color: #c084fc; }

.cash-section {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.3) 100%);
  border: 1.5px solid #ef4444;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
}

.cash-tip {
  font-size: 10px;
  color: #fca5a5;
  letter-spacing: 1px;
  margin-bottom: 2px;
}

.cash-title {
  font-size: 13px;
  font-weight: 700;
  color: #fee2e2;
}

.cash-number {
  font-size: 26px;
  font-weight: 900;
  color: #ef4444;
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
  margin-top: 4px;
  font-family: 'Press Start 2P', monospace;
}

.quote-box {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  font-style: italic;
  padding: 0 8px;
}

.actions-row {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}
</style>

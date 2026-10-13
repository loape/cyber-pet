<template>
  <div
    class="cyber-hud-container interactive"
    :class="{ collapsed: isCollapsed }"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="hud-bar">
      <!-- Toggle Expand / Collapse button -->
      <button class="hud-toggle-btn" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '🎮 工位面板' : '◀' }}
      </button>

      <template v-if="!isCollapsed">
        <!-- Live APM Meter -->
        <div class="hud-metric" :class="{ 'furious-meter': apm > 180 }">
          <span class="metric-icon">⌨️</span>
          <span class="metric-label">APM:</span>
          <span class="metric-val">{{ apm }}</span>
        </div>

        <!-- Merits accumulated -->
        <div class="hud-metric">
          <span class="metric-icon">📿</span>
          <span class="metric-label">功德:</span>
          <span class="metric-val text-gold">{{ merits }}</span>
        </div>

        <!-- Clock-in or Fishing status -->
        <div class="hud-metric">
          <span class="metric-icon">{{ workState === 'working' ? '🧱' : '🐟' }}</span>
          <span class="metric-label">{{ workState === 'working' ? '搬砖' : '摸鱼' }}:</span>
          <span class="metric-val text-green">¥ {{ earnedAmount.toFixed(2) }}</span>
        </div>

        <!-- Quick space knock button for testing -->
        <button class="hud-action-btn" @click="$emit('space-knock')" title="点击或按键盘空格键敲木鱼">
          🪵 敲木鱼 (Space)
        </button>

        <!-- Open Settings -->
        <button class="hud-icon-btn" @click="$emit('open-settings')" title="打开设置面板">
          ⚙️
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  apm: Number,
  merits: Number,
  workState: String,
  earnedAmount: Number
});

const emit = defineEmits(['space-knock', 'open-settings', 'hover-change']);

const isCollapsed = ref(false);
</script>

<style scoped>
.cyber-hud-container {
  position: fixed;
  bottom: 14px;
  right: 18px;
  z-index: 4000;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}

.hud-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 6px 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.05);
  transition: all 0.25s ease;
}

.hud-toggle-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 12px;
  padding: 4px 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.hud-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.hud-metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.metric-val {
  color: #38bdf8;
  font-weight: 800;
  font-family: monospace;
}

.text-gold {
  color: #fbbf24;
}

.text-green {
  color: #4ade80;
}

.furious-meter .metric-val {
  color: #ef4444;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  animation: pulseApm 0.5s infinite alternate;
}

@keyframes pulseApm {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

.hud-action-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: none;
  border-radius: 12px;
  padding: 5px 10px;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.hud-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.6);
}

.hud-icon-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.2s;
}

.hud-icon-btn:hover {
  transform: rotate(30deg) scale(1.15);
}
</style>

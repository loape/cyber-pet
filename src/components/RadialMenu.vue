<template>
  <div
    v-if="visible"
    class="radial-menu-overlay interactive"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Center core badge -->
    <div class="radial-center-badge" @click="closeMenu">
      <div class="center-icon">⚡️</div>
      <div class="center-text">MENU</div>
    </div>

    <!-- 4 Sectors -->
    <!-- Top: 上班打卡 -->
    <div
      class="radial-item item-top"
      :class="{ active: workState === 'working' }"
      @click="handleAction('clockIn')"
      title="上班打卡"
    >
      <div class="item-icon">⏰</div>
      <div class="item-label">{{ workState === 'working' ? '搬砖中' : '上班打卡' }}</div>
    </div>

    <!-- Right: 下班打卡 -->
    <div
      class="radial-item item-right"
      @click="handleAction('clockOut')"
      title="下班打卡"
    >
      <div class="item-icon">🏖️</div>
      <div class="item-label">下班打卡</div>
    </div>

    <!-- Bottom: 带薪如厕 -->
    <div
      class="radial-item item-bottom"
      :class="{ active: workState === 'toilet' }"
      @click="handleAction('toilet')"
      title="带薪如厕"
    >
      <div class="item-icon">🚽</div>
      <div class="item-label">带薪如厕</div>
    </div>

    <!-- Left: 猜拳对决 -->
    <div
      class="radial-item item-left"
      @click="handleAction('rps')"
      title="猜拳对决"
    >
      <div class="item-icon">✊</div>
      <div class="item-label">猜拳对决</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';

const props = defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  workState: String
});

const emit = defineEmits(['select', 'close', 'hover-change']);

let autoCloseTimer = null;

function onMouseEnter() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  emit('hover-change', true);
}

function onMouseLeave() {
  emit('hover-change', false);
  // Auto-close after 2 seconds per PRD requirement
  autoCloseTimer = setTimeout(() => {
    emit('close');
  }, 2000);
}

function handleAction(action) {
  emit('select', action);
  emit('close');
}

function closeMenu() {
  emit('close');
}

onUnmounted(() => {
  if (autoCloseTimer) clearTimeout(autoCloseTimer);
});
</script>

<style scoped>
.radial-menu-overlay {
  position: absolute;
  width: 220px;
  height: 220px;
  margin-left: -110px;
  margin-top: -110px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto !important;
  animation: popIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.radial-center-badge {
  position: absolute;
  width: 52px;
  height: 52px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border: 2px solid #00f2fe;
  box-shadow: 0 0 16px rgba(0, 242, 254, 0.4), inset 0 0 10px rgba(0, 242, 254, 0.2);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s, box-shadow 0.2s;
}

.radial-center-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 0 24px rgba(0, 242, 254, 0.8);
}

.center-icon {
  font-size: 16px;
}

.center-text {
  font-size: 8px;
  font-weight: 800;
  color: #00f2fe;
  letter-spacing: 0.5px;
}

.radial-item {
  position: absolute;
  width: 76px;
  height: 76px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 5;
}

.radial-item:hover {
  transform: scale(1.15);
  background: rgba(30, 41, 59, 0.95);
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.radial-item.active {
  border-color: #4ade80;
  box-shadow: 0 0 16px rgba(74, 222, 128, 0.4);
}

/* Positions for 4 cardinal sectors */
.item-top {
  top: 0;
  left: 72px;
}

.item-right {
  top: 72px;
  right: 0;
}

.item-bottom {
  bottom: 0;
  left: 72px;
}

.item-left {
  top: 72px;
  left: 0;
}

.item-icon {
  font-size: 24px;
  line-height: 1;
}

.item-label {
  font-size: 10px;
  font-weight: 700;
  color: #f1f5f9;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}
</style>

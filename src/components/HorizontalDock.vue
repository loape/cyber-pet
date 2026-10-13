<template>
  <div class="dock-container interactive">
    <!-- Popover for "互动" choices -->
    <div v-if="showInteractMenu" class="interact-popover">
      <div class="popover-arrow"></div>
      <div class="popover-header">
        <span>🎮 互动玩法</span>
        <button class="popover-close" @click="showInteractMenu = false">✕</button>
      </div>
      <div class="popover-list">
        <button class="popover-btn" @click="triggerInteract('rps')">
          <span class="p-icon">✊</span>
          <span class="p-txt">极速猜拳</span>
        </button>
        <button class="popover-btn" :class="{ active: isFollowingMouse }" @click="triggerInteract('followMouse')">
          <span class="p-icon">👀</span>
          <span class="p-txt">{{ isFollowingMouse ? '停止跟随' : '鼠标跟随 (5s)' }}</span>
        </button>
        <button class="popover-btn" @click="triggerInteract('dance')">
          <span class="p-icon">💃</span>
          <span class="p-txt">快乐跳舞</span>
        </button>
        <button class="popover-btn" @click="triggerInteract('knockFish')">
          <span class="p-icon">🪵</span>
          <span class="p-txt">敲敲木鱼</span>
        </button>
      </div>
    </div>

    <!-- 5 Horizontal Feature Buttons -->
    <div class="dock-bar">
      <!-- 1. 上班 -->
      <button
        class="dock-item"
        :class="{ active: workState === 'working' }"
        @click="emitAction('clockIn')"
        title="上班打卡 (工时累计)"
      >
        <span class="d-icon">{{ workState === 'working' ? '🧱' : '⏰' }}</span>
        <span class="d-label">{{ workState === 'working' ? '搬砖' : '上班' }}</span>
      </button>

      <!-- 2. 下班 -->
      <button
        class="dock-item"
        @click="emitAction('clockOut')"
        title="下班打卡 (结算战报)"
      >
        <span class="d-icon">🏖️</span>
        <span class="d-label">下班</span>
      </button>

      <!-- 3. 如厕 -->
      <button
        class="dock-item"
        :class="{ active: workState === 'toilet' }"
        @click="emitAction('toilet')"
        title="带薪如厕 (收益跳表 & 战报小票)"
      >
        <span class="d-icon">🚽</span>
        <span class="d-label">如厕</span>
      </button>

      <!-- 4. 互动 -->
      <button
        class="dock-item"
        :class="{ active: showInteractMenu }"
        @click="toggleInteractMenu"
        title="趣味互动"
      >
        <span class="d-icon">🎮</span>
        <span class="d-label">互动</span>
      </button>

      <!-- 5. 设置 -->
      <button
        class="dock-item"
        @click="emitAction('settings')"
        title="控制台与形象热切换"
      >
        <span class="d-icon">⚙️</span>
        <span class="d-label">设置</span>
      </button>

      <!-- 6. 收起菜单 -->
      <button
        class="dock-close-btn"
        @click="$emit('close')"
        title="收起菜单 (右键可再次唤出)"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  workState: String,
  isFollowingMouse: Boolean
});

const emit = defineEmits([
  'action',
  'interact',
  'popover-change',
  'close'
]);

const showInteractMenu = ref(false);

function toggleInteractMenu() {
  showInteractMenu.value = !showInteractMenu.value;
  emit('popover-change', showInteractMenu.value);
}

function emitAction(type) {
  showInteractMenu.value = false;
  emit('popover-change', false);
  emit('action', type);
}

function triggerInteract(type) {
  showInteractMenu.value = false;
  emit('popover-change', false);
  emit('interact', type);
}
</script>

<style scoped>
.dock-container {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1000;
  pointer-events: auto !important;
  user-select: none;
}

.dock-bar {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 3px 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.04);
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 12px;
  padding: 3px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 36px;
}

.dock-item:hover {
  background: rgba(56, 189, 248, 0.2);
  transform: translateY(-2px);
}

.dock-item.active {
  background: rgba(74, 222, 128, 0.22);
}

.d-icon {
  font-size: 13px;
  line-height: 1.1;
}

.d-label {
  font-size: 9px;
  font-weight: 700;
  color: #e2e8f0;
  margin-top: 1px;
}

/* Interact Popover */
.interact-popover {
  position: absolute;
  bottom: 44px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 12px;
  padding: 8px 10px;
  width: 170px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: popUp 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popUp {
  from { opacity: 0; transform: translateY(6px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  color: #38bdf8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 4px;
}

.popover-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}

.popover-close:hover {
  color: #fff;
}

.popover-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.popover-list::-webkit-scrollbar {
  width: 4px;
}
.popover-list::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 4px;
}

.popover-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 5px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.popover-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateX(2px);
}

.popover-btn.active {
  background: rgba(74, 222, 128, 0.25);
  border-color: #4ade80;
}

.p-icon {
  font-size: 14px;
}

.p-txt {
  font-size: 10px;
  font-weight: 700;
  color: #f1f5f9;
}

.dock-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 11px;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.dock-close-btn:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}
</style>

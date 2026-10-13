<template>
  <div
    v-if="visible"
    class="bottom-menu-card interactive"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="menu-header">
      <div class="header-tag">
        <span class="pulse-dot"></span>
        <span class="menu-title">赛博工位菜单</span>
      </div>
      <button class="menu-close-btn" @click="$emit('close')" title="关闭菜单">✕</button>
    </div>

    <div class="menu-items-list">
      <!-- 1. 上班打卡 -->
      <div
        class="menu-item"
        :class="{ active: workState === 'working' }"
        @click="handleAction('clockIn')"
      >
        <span class="item-icon">⏰</span>
        <div class="item-info">
          <div class="item-name">{{ workState === 'working' ? '搬砖中 (累计中)' : '上班打卡' }}</div>
          <div class="item-desc">记录工时与摸鱼收益</div>
        </div>
        <span v-if="workState === 'working'" class="active-badge">进行中</span>
      </div>

      <!-- 2. 下班打卡 -->
      <div
        class="menu-item"
        @click="handleAction('clockOut')"
      >
        <span class="item-icon">🏖️</span>
        <div class="item-info">
          <div class="item-name">下班打卡</div>
          <div class="item-desc">结算搬走公司资产战报</div>
        </div>
      </div>

      <!-- 3. 带薪如厕 -->
      <div
        class="menu-item"
        :class="{ active: workState === 'toilet' }"
        @click="handleAction('toilet')"
      >
        <span class="item-icon">🚽</span>
        <div class="item-info">
          <div class="item-name">带薪如厕</div>
          <div class="item-desc">毫秒级收益跳表 & 回血小票</div>
        </div>
      </div>

      <!-- 4. 猜拳对决 -->
      <div
        class="menu-item"
        @click="handleAction('rps')"
      >
        <span class="item-icon">✊</span>
        <div class="item-info">
          <div class="item-name">猜拳对决</div>
          <div class="item-desc">15s 互动赢取功德</div>
        </div>
      </div>

      <!-- 5. 桌宠设置 -->
      <div
        class="menu-item highlight-item"
        @click="handleAction('settings')"
      >
        <span class="item-icon">⚙️</span>
        <div class="item-info">
          <div class="item-name">桌宠控制台</div>
          <div class="item-desc">5 款角色热切换 / 薪资 / 音效</div>
        </div>
        <span class="hotkey-badge">设置</span>
      </div>

      <!-- 6. 重置位置 -->
      <div
        class="menu-item"
        @click="handleAction('resetPos')"
      >
        <span class="item-icon">🔄</span>
        <div class="item-info">
          <div class="item-name">重置位置</div>
          <div class="item-desc">回归到屏幕右下角</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted } from 'vue';

const props = defineProps({
  visible: Boolean,
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
  // Auto-close after 2.5 seconds of mouse inactivity
  autoCloseTimer = setTimeout(() => {
    emit('close');
  }, 2500);
}

function handleAction(action) {
  emit('select', action);
  emit('close');
}

onUnmounted(() => {
  if (autoCloseTimer) clearTimeout(autoCloseTimer);
});
</script>

<style scoped>
.bottom-menu-card {
  position: absolute;
  top: 135px;
  left: 50%;
  transform: translateX(-50%);
  width: 210px;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.75), 0 0 16px rgba(56, 189, 248, 0.2);
  padding: 8px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: slideDown 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  pointer-events: auto !important;
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

.menu-title {
  font-size: 11px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: 0.5px;
}

.menu-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  transition: color 0.15s;
}

.menu-close-btn:hover {
  color: #fff;
}

.menu-items-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 250px;
  overflow-y: auto;
}

/* Custom scrollbar */
.menu-items-list::-webkit-scrollbar {
  width: 4px;
}
.menu-items-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
  background: transparent;
  position: relative;
}

.menu-item:hover {
  background: rgba(56, 189, 248, 0.15);
  transform: translateX(2px);
}

.menu-item.active {
  background: rgba(74, 222, 128, 0.15);
  border-left: 2px solid #4ade80;
}

.highlight-item:hover {
  background: rgba(251, 191, 36, 0.15);
}

.item-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 11px;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-desc {
  font-size: 9px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-badge {
  font-size: 9px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 700;
}

.hotkey-badge {
  font-size: 9px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 700;
}
</style>

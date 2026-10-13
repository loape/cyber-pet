<template>
  <div
    v-if="show"
    class="clock-in-banner-wrapper interactive"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="banner-body">
      <div class="banner-tag">📋 今日代办</div>
      <div class="banner-text">把电充满，把尿喝白，把事搞成。</div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'hover-change']);

watch(() => props.show, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      emit('close');
    }, 4500);
  }
});
</script>

<style scoped>
.clock-in-banner-wrapper {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: auto !important;
  animation: bannerSlide 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bannerSlide {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.banner-body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1.5px solid #00f2fe;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 230px;
  text-align: center;
  position: relative;
}

.banner-body::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #00f2fe;
}

.banner-tag {
  font-size: 11px;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 1px;
}

.banner-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>

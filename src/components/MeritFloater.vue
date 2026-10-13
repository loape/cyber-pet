<template>
  <div class="merit-container">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="merit-particle"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        color: particle.color,
        textShadow: `0 0 8px ${particle.color}`,
        transform: `translate(-50%, -${particle.offsetY}px) scale(${particle.scale})`,
        opacity: particle.opacity
      }"
    >
      {{ particle.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const WORDS = [
  { text: 'Bug -1', color: '#4ade80' },
  { text: '功德 +1', color: '#fbbf24' },
  { text: '血压 -10%', color: '#60a5fa' },
  { text: '掉发 -1根', color: '#f43f5e' },
  { text: '摸鱼时长 +1s', color: '#a78bfa' },
  { text: '需求 -1', color: '#38bdf8' }
];

const particles = ref([]);
let nextId = 0;

function spawn(x, y, customText = null, customColor = null) {
  const chosen = customText 
    ? { text: customText, color: customColor || '#fbbf24' }
    : WORDS[Math.floor(Math.random() * WORDS.length)];

  // Random angle spread
  const spreadX = (Math.random() - 0.5) * 30;
  const particle = {
    id: nextId++,
    x: x + spreadX,
    y: Math.max(70, y),
    offsetY: 0,
    text: chosen.text,
    color: chosen.color,
    opacity: 1,
    scale: 1,
    startTime: performance.now(),
    duration: 850
  };

  particles.value.push(particle);
  requestAnimationFrame(animate);
}

function animate(now) {
  let hasActive = false;
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i];
    const elapsed = now - p.startTime;
    const progress = Math.min(1, elapsed / p.duration);

    // Float up 28px with ease-out safely in headroom
    p.offsetY = 28 * Math.sin(progress * Math.PI / 2);
    // Alpha fades to 0
    p.opacity = 1 - Math.pow(progress, 1.4);
    // Scale slightly bounces up then normal
    p.scale = 1 + 0.2 * Math.sin(progress * Math.PI);

    if (progress >= 1) {
      particles.value.splice(i, 1);
    } else {
      hasActive = true;
    }
  }

  if (hasActive) {
    requestAnimationFrame(animate);
  }
}

defineExpose({ spawn });
</script>

<style scoped>
.merit-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 9999;
}

.merit-particle {
  position: absolute;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  pointer-events: none;
  transition: none;
  letter-spacing: 1px;
}
</style>

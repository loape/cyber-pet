<template>
  <div
    class="pet-entity-wrapper interactive"
    :style="{
      left: '50%',
      top: '110px',
      transform: 'translate(-50%, -50%)'
    }"
    @mousedown="onMouseDown"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- Speech / Bored / Furious Bubble -->
    <div
      v-if="speechBubbleText"
      class="pet-bubble"
    >
      {{ speechBubbleText }}
    </div>

    <!-- Pet Canvas Sprite -->
    <canvas
      ref="canvasRef"
      width="128"
      height="128"
      class="pet-canvas"
      :class="{ 'is-dragging': isDragging }"
    ></canvas>

    <!-- Mini APM Flame Badge if furious -->
    <div
      v-if="isFurious"
      class="furious-badge"
    >
      🔥 APM: {{ apm }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { characterManager, ACTION_ROWS } from '../services/characterManager.js';

const props = defineProps({
  characterId: String,
  currentAction: String,
  isDragging: Boolean,
  facingLeft: Boolean,
  isFurious: Boolean,
  apm: Number,
  boredText: String,
  fpsTarget: Number,
  isFollowingMouse: Boolean
});

const emit = defineEmits([
  'update:isDragging',
  'update:facingLeft',
  'update:isFollowingMouse',
  'action-change',
  'open-radial-menu',
  'knock-fish'
]);

const canvasRef = ref(null);
const currentFrame = ref(0);
const speechBubbleText = ref('');
const isHovered = ref(false);

let animTimeout = null;
let danceTimeout = null;
let mouseFollowInterval = null;
let actionBeforeMouseDown = 'idle';
let dragStartScreenX = 0;
let dragStartScreenY = 0;
let winStartX = 0;
let winStartY = 0;
let hasMoved = false;

// FSM Idle wandering timers
let idleSeconds = 0;
let idleTimer = null;
let walkStepInterval = null;

// Watch character change to re-generate / redraw spritesheet
watch(() => props.characterId, () => {
  currentFrame.value = 0;
  drawFrame();
});

watch(() => props.currentAction, (newAction) => {
  currentFrame.value = 0;
  drawFrame();
  restartAnimationLoop();

  if (danceTimeout) {
    clearTimeout(danceTimeout);
    danceTimeout = null;
  }

  // 跳舞优先：持续跳舞约 8.5 秒（期间鼠标移上去不打断），超时自动收式恢复待机
  if (newAction === 'dance') {
    danceTimeout = setTimeout(() => {
      if (props.currentAction === 'dance') {
        emit('action-change', 'idle');
      }
    }, 8500);
  }
});

watch(() => props.isFollowingMouse, (val) => {
  if (val) {
    speechBubbleText.value = '🐾 跟着你走啦~ (5s自动停/点我即停)';
    startMouseFollow();
  } else {
    stopMouseFollow();
    if (speechBubbleText.value.includes('跟着你走')) {
      speechBubbleText.value = '';
    }
  }
}, { immediate: true });

watch(() => props.isFurious, (val) => {
  if (val) {
    speechBubbleText.value = '敲这么快，要起飞了？快喝水摸鱼！';
  } else if (!props.boredText) {
    speechBubbleText.value = '';
  }
});

watch(() => props.boredText, (val) => {
  if (val) {
    speechBubbleText.value = val;
  } else if (!props.isFurious) {
    speechBubbleText.value = '';
  }
});

watch(() => props.fpsTarget, () => {
  restartAnimationLoop();
});

let unbindRedraw = null;

onMounted(() => {
  unbindRedraw = characterManager.onRedraw(() => {
    drawFrame();
  });
  drawFrame();
  restartAnimationLoop();
  startFsmTimer();
  window.addEventListener('mousemove', onGlobalMouseMove);
  window.addEventListener('mouseup', onGlobalMouseUp);
});

onUnmounted(() => {
  if (unbindRedraw) unbindRedraw();
  if (animTimeout) clearTimeout(animTimeout);
  if (danceTimeout) clearTimeout(danceTimeout);
  if (mouseFollowInterval) clearInterval(mouseFollowInterval);
  if (idleTimer) clearInterval(idleTimer);
  if (walkStepInterval) clearInterval(walkStepInterval);
  window.removeEventListener('mousemove', onGlobalMouseMove);
  window.removeEventListener('mouseup', onGlobalMouseUp);
});

function getAnimationMeta(action) {
  const char = characterManager.getCharacter(props.characterId);
  return char.animations[action] || char.animations.idle;
}

function restartAnimationLoop() {
  if (animTimeout) clearTimeout(animTimeout);

  const meta = getAnimationMeta(props.currentAction);
  const totalFrames = meta.frames || 1;
  // 严格忠实于 duration_ms（允许极速如 40ms/2 = 20ms），下限仅设为 16ms（60fps 单帧极限）
  const baseFrameMs = Math.max(16, Math.round(meta.duration_ms / totalFrames));

  // 木鱼连击动作追求极速打击感，不加多余硬编码停顿；长循环动作适度保留呼吸停顿
  const isKnock = props.currentAction === 'knock_fish';
  const lastFrameExtraMs = isKnock ? 0 : (meta.loop ? Math.min(300, Math.round(baseFrameMs * 0.6)) : Math.min(200, baseFrameMs));

  function stepFrame() {
    currentFrame.value++;
    if (currentFrame.value >= totalFrames) {
      if (meta.loop || (props.currentAction === 'curious' && isHovered.value)) {
        currentFrame.value = 0;
      } else {
        // 单次动作：定格在最后一帧并适度留存
        currentFrame.value = totalFrames - 1;
        drawFrame();
        if (props.currentAction === 'knock_fish') {
          // 木鱼收尾恢复时间完全跟随 duration_ms 设置
          const settleTime = Math.max(30, Math.round(meta.duration_ms * 0.8));
          setTimeout(() => {
            if (props.currentAction !== 'dragged' && !props.isFurious && props.currentAction !== 'washroom') {
              emit('action-change', isHovered.value ? 'curious' : 'idle');
            }
          }, settleTime);
        } else if (props.currentAction === 'curious') {
          if (!isHovered.value) {
            setTimeout(() => {
              if (props.currentAction !== 'dragged' && !props.isFurious) {
                emit('action-change', 'idle');
              }
            }, 400);
          }
        }
        return;
      }
    }

    drawFrame();

    const isLastFrame = (currentFrame.value === totalFrames - 1);
    const nextDelay = isLastFrame ? (baseFrameMs + lastFrameExtraMs) : baseFrameMs;

    animTimeout = setTimeout(stepFrame, Math.max(16, nextDelay));
  }

  drawFrame();
  const isInitialLast = (currentFrame.value === totalFrames - 1);
  const initialDelay = isInitialLast ? (baseFrameMs + lastFrameExtraMs) : baseFrameMs;
  animTimeout = setTimeout(stepFrame, Math.max(16, initialDelay));
}

function drawFrame() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  characterManager.drawFrame(
    ctx,
    props.characterId,
    props.currentAction,
    currentFrame.value,
    canvas.width,
    canvas.height
  );
}

// FSM Idle behavior: wandering across the desktop
function startFsmTimer() {
  idleTimer = setInterval(() => {
    if (props.currentAction === 'idle' && !props.isDragging && !props.isFurious && !isHovered.value) {
      idleSeconds++;

      // Idle -> Walk wander every 40s
      if (idleSeconds >= 40) {
        idleSeconds = 0;
        triggerWalkWander();
      }
    } else {
      idleSeconds = 0;
    }
  }, 1000);
}

async function triggerWalkWander() {
  if (props.isDragging || !window.electronAPI || isHovered.value) return;

  const wanderDist = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 60);
  emit('action-change', 'walk');

  const [startX, currY] = await window.electronAPI.getWindowPosition();
  const screenInfo = await window.electronAPI.getScreenBounds();
  const maxW = screenInfo?.workArea?.width || 1440;
  const minX = screenInfo?.workArea?.x || 0;
  const targetX = Math.max(minX + 20, Math.min(minX + maxW - 260, startX + wanderDist));

  const duration = 2200;
  const startTime = performance.now();

  if (walkStepInterval) clearInterval(walkStepInterval);
  walkStepInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const currX = startX + (targetX - startX) * progress;
    window.electronAPI.setWindowPosition(currX, currY);

    if (progress >= 1) {
      clearInterval(walkStepInterval);
      walkStepInterval = null;
      emit('action-change', isHovered.value ? 'curious' : 'idle');
    }
  }, 40);
}

function onMouseEnter() {
  isHovered.value = true;
  // 跳舞优先：跳舞中不被鼠标移入打断
  if (!props.isDragging && !props.isFurious && props.currentAction !== 'washroom' && props.currentAction !== 'sleep' && props.currentAction !== 'dance') {
    emit('action-change', 'curious');
  }
}

function onMouseLeave() {
  isHovered.value = false;
  // 鼠标移出时，若当前处于curious则恢复为idle
  if (!props.isDragging && props.currentAction === 'curious') {
    emit('action-change', 'idle');
  }
}

// Drag & Drop: moves the native window and keeps it exactly where dropped
async function onMouseDown(e) {
  if (e.button !== 0) return; // Only left button

  // 点击小人时立即停止跟随，让桌宠原地站稳方便操作
  if (props.isFollowingMouse) {
    emit('update:isFollowingMouse', false);
  }

  dragStartScreenX = e.screenX;
  dragStartScreenY = e.screenY;
  hasMoved = false;
  actionBeforeMouseDown = props.currentAction;

  if (window.electronAPI) {
    const [wx, wy] = await window.electronAPI.getWindowPosition();
    winStartX = wx;
    winStartY = wy;
  }

  emit('update:isDragging', true);
  emit('action-change', 'dragged');
}

function onGlobalMouseMove(e) {
  if (props.isDragging) {
    const dx = e.screenX - dragStartScreenX;
    const dy = e.screenY - dragStartScreenY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    if (window.electronAPI) {
      window.electronAPI.setWindowPosition(winStartX + dx, winStartY + dy);
    }
    return;
  }
}

// 鼠标跟随行走核心：人物用 walk 的动作跟着鼠标走
async function stepMouseFollow() {
  if (!props.isFollowingMouse) return;
  if (props.isDragging || props.isFurious || props.currentAction === 'washroom' || props.currentAction === 'dance' || props.currentAction === 'sleep') {
    return;
  }

  // 若鼠标已移入小人身上，说明用户准备点击交互或呼出菜单，立即原地驻足避免晃动
  if (isHovered.value) {
    if (props.currentAction === 'walk') {
      emit('action-change', 'curious');
    }
    return;
  }

  if (!window.electronAPI || !window.electronAPI.getCursorScreenPoint) return;

  try {
    const cursor = await window.electronAPI.getCursorScreenPoint();
    const [winX, winY] = await window.electronAPI.getWindowPosition();
    const screenInfo = await window.electronAPI.getScreenBounds();
    const workArea = screenInfo?.workArea || { x: 0, y: 0, width: 1440, height: 900 };

    // 桌宠中心位于窗口中心 (winX + 130, winY + 110)
    const petCenterX = winX + 130;
    const petCenterY = winY + 110;

    const dx = cursor.x - petCenterX;
    const dy = cursor.y - petCenterY;
    const dist = Math.hypot(dx, dy);

    // 鼠标距离较远（> 85px）时，迈开双腿用 walk 动作朝鼠标走去
    if (dist > 85) {
      if (props.currentAction !== 'walk') {
        emit('action-change', 'walk');
      }
      // 步频与位移速度（平滑稳步，每 40ms 移动 6~9px）
      const speed = Math.min(dist * 0.08, 8.5);
      const nextWinX = winX + (dx / dist) * speed;
      const nextWinY = winY + (dy / dist) * speed;

      const minX = workArea.x - 40;
      const maxX = workArea.x + workArea.width - 220;
      const minY = workArea.y - 20;
      const maxY = workArea.y + workArea.height - 200;

      const clampedX = Math.max(minX, Math.min(maxX, nextWinX));
      const clampedY = Math.max(minY, Math.min(maxY, nextWinY));

      window.electronAPI.setWindowPosition(clampedX, clampedY);
    } else {
      // 走到鼠标身旁时停下脚步，恢复待机
      if (props.currentAction === 'walk') {
        emit('action-change', 'idle');
      }
    }
  } catch (err) {}
}

function startMouseFollow() {
  if (mouseFollowInterval) clearInterval(mouseFollowInterval);
  mouseFollowInterval = setInterval(stepMouseFollow, 40);
}

function stopMouseFollow() {
  if (mouseFollowInterval) {
    clearInterval(mouseFollowInterval);
    mouseFollowInterval = null;
  }
  if (props.currentAction === 'walk') {
    emit('action-change', 'idle');
  }
}

function onGlobalMouseUp(e) {
  if (props.isDragging) {
    emit('update:isDragging', false);

    // 单击（无位移）
    if (!hasMoved) {
      // 若点击前正处于跳舞状态，则单击直接叫停跳舞，恢复待机
      if (actionBeforeMouseDown === 'dance') {
        if (danceTimeout) clearTimeout(danceTimeout);
        emit('action-change', 'idle');
      } else {
        // 普通状态下单击触发敲木鱼，恢复时间完全跟随木鱼 duration_ms 配置
        emit('knock-fish');
        const knockMeta = getAnimationMeta('knock_fish');
        const knockDuration = Math.max(30, knockMeta.duration_ms || 100);
        setTimeout(() => {
          if (!props.isDragging && !props.isFurious && props.currentAction !== 'washroom') {
            emit('action-change', isHovered.value ? 'curious' : 'idle');
          }
        }, knockDuration + 20);
      }
    } else {
      emit('action-change', isHovered.value ? 'curious' : 'idle');
    }

    // Retain the dragged position! Save to localStorage
    if (window.electronAPI) {
      window.electronAPI.getWindowPosition().then(([x, y]) => {
        try {
          localStorage.setItem('pet_win_x', String(x));
          localStorage.setItem('pet_win_y', String(y));
        } catch (err) {}
      });
    }
  }
}

// Right Click -> Radial Menu
function onContextMenu(e) {
  if (props.isFollowingMouse) {
    emit('update:isFollowingMouse', false);
  }
  emit('open-radial-menu', { x: 120, y: 120 });
}
</script>

<style scoped>
.pet-entity-wrapper {
  position: absolute;
  width: 128px;
  height: 128px;
  cursor: grab;
  z-index: 500;
  user-select: none;
  pointer-events: auto !important;
}

.pet-entity-wrapper:active {
  cursor: grabbing;
}

.pet-canvas {
  width: 128px;
  height: 128px;
  display: block;
  image-rendering: pixelated;
}

.pet-canvas.is-dragging {
  opacity: 0.9;
}

.pet-bubble {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  border: 1.5px solid #00f2fe;
  box-shadow: 0 0 12px rgba(0, 242, 254, 0.5);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  z-index: 600;
  animation: floatBubble 2s infinite ease-in-out;
}

@keyframes floatBubble {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -4px); }
}

.furious-badge {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 900;
  font-family: monospace;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
  white-space: nowrap;
  pointer-events: none;
}
</style>

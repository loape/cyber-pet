<template>
  <div
    class="rps-game-container interactive"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <!-- Stage 1: Countdown 3s -->
    <div v-if="stage === 'countdown'" class="rps-box">
      <div class="rps-title">⚡️ 极速猜拳对决 ⚡️</div>
      <div class="countdown-num">{{ countdown }}</div>
      <div class="rps-hint">准备出拳！</div>
    </div>

    <!-- Stage 2: Pick ✊✌️🖐 -->
    <div v-else-if="stage === 'choose'" class="rps-box">
      <div class="rps-title">你出什么？(剩余 {{ timerSeconds }}s)</div>
      <div class="rps-options">
        <button class="choice-btn" @click="pickChoice('rock')">
          <span class="choice-icon">✊</span>
          <span class="choice-txt">石头</span>
        </button>
        <button class="choice-btn" @click="pickChoice('scissors')">
          <span class="choice-icon">✌️</span>
          <span class="choice-txt">剪刀</span>
        </button>
        <button class="choice-btn" @click="pickChoice('paper')">
          <span class="choice-icon">🖐</span>
          <span class="choice-txt">布</span>
        </button>
      </div>
    </div>

    <!-- Stage 3: Result showdown -->
    <div v-else-if="stage === 'result'" class="rps-box" :class="resultClass">
      <div class="versus-row">
        <div class="versus-side">
          <div class="side-lbl">你</div>
          <div class="side-icon">{{ getEmoji(userChoice) }}</div>
        </div>
        <div class="vs-text">VS</div>
        <div class="versus-side">
          <div class="side-lbl">桌宠</div>
          <div class="side-icon">{{ getEmoji(petChoice) }}</div>
        </div>
      </div>

      <div class="result-banner">
        {{ resultText }}
      </div>

      <div class="reward-tag">
        {{ rewardText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { soundService } from '../services/soundService.js';



const emit = defineEmits(['finish', 'merit', 'hover-change']);

const stage = ref('countdown'); // 'countdown' | 'choose' | 'result'
const countdown = ref(3);
const timerSeconds = ref(15);
const userChoice = ref(null);
const petChoice = ref(null);
const result = ref(''); // 'win' | 'lose' | 'draw'
const resultText = ref('');
const rewardText = ref('');
const resultClass = ref('');

let timer = null;

const CHOICES = ['rock', 'scissors', 'paper'];

function getEmoji(c) {
  if (c === 'rock') return '✊';
  if (c === 'scissors') return '✌️';
  if (c === 'paper') return '🖐';
  return '❓';
}

onMounted(() => {
  // 3 second countdown
  const cTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(cTimer);
      stage.value = 'choose';
      start15sTimer();
    }
  }, 900);
});

function start15sTimer() {
  timer = setInterval(() => {
    timerSeconds.value--;
    if (timerSeconds.value <= 0) {
      clearInterval(timer);
      // Timeout defaults to random pick
      pickChoice(CHOICES[Math.floor(Math.random() * 3)]);
    }
  }, 1000);
}

function pickChoice(choice) {
  if (timer) clearInterval(timer);
  userChoice.value = choice;
  
  // Pet randomly chooses
  const pChoice = CHOICES[Math.floor(Math.random() * 3)];
  petChoice.value = pChoice;

  // Determine outcome
  if (choice === pChoice) {
    result.value = 'draw';
    resultText.value = '😐 居然平局了！';
    rewardText.value = '💬 头顶飘出：再来一次';
    resultClass.value = 'draw-theme';
    emit('merit', '再来一次', '#38bdf8');
  } else if (
    (choice === 'rock' && pChoice === 'scissors') ||
    (choice === 'scissors' && pChoice === 'paper') ||
    (choice === 'paper' && pChoice === 'rock')
  ) {
    result.value = 'win';
    resultText.value = '🎉 你赢了！桌宠抱头痛哭';
    rewardText.value = '✨ 功德 +10 点！';
    resultClass.value = 'win-theme';
    soundService.playVictory();
    emit('merit', '功德 +10', '#4ade80');
  } else {
    result.value = 'lose';
    resultText.value = '💀 你输了！桌宠狂笑嘲讽';
    rewardText.value = '🧠 智商 -1 点！';
    resultClass.value = 'lose-theme';
    soundService.playDefeat();
    emit('merit', '智商 -1', '#f43f5e');
  }

  stage.value = 'result';

  // Auto-finish after 3.5s
  setTimeout(() => {
    emit('finish', result.value);
  }, 3500);
}

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.rps-game-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  border: none !important;
  z-index: 3000;
  pointer-events: auto !important;
}

.rps-box {
  background: #0f172a;
  border: 1.5px solid #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.3), 0 8px 24px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 250px;
  animation: popIn 0.25s ease-out;
}

@keyframes popIn {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.rps-title {
  font-size: 12px;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 0.5px;
}

.countdown-num {
  font-size: 42px;
  font-weight: 900;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  animation: beat 0.8s infinite;
}

@keyframes beat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); color: #f43f5e; }
}

.rps-hint {
  font-size: 11px;
  color: #94a3b8;
}

.rps-options {
  display: flex;
  gap: 10px;
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #1e293b;
  border: 1.5px solid #475569;
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-btn:hover {
  transform: translateY(-3px) scale(1.08);
  background: #334155;
  border-color: #38bdf8;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
}

.choice-icon {
  font-size: 28px;
}

.choice-txt {
  font-size: 10px;
  font-weight: 700;
  color: #f1f5f9;
}

.versus-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.versus-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.side-lbl {
  font-size: 10px;
  color: #94a3b8;
}

.side-icon {
  font-size: 32px;
}

.vs-text {
  font-size: 16px;
  font-weight: 900;
  color: #f43f5e;
  font-family: monospace;
}

.result-banner {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  text-align: center;
}

.reward-tag {
  font-size: 12px;
  font-weight: 800;
  color: #4ade80;
}

.win-theme {
  border-color: #4ade80;
  box-shadow: 0 0 25px rgba(74, 222, 128, 0.5);
}

.lose-theme {
  border-color: #f43f5e;
  box-shadow: 0 0 25px rgba(244, 63, 94, 0.5);
}

.draw-theme {
  border-color: #38bdf8;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
}
</style>

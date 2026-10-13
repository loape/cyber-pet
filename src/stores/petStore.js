import { reactive, computed, watch } from 'vue';
import { characterManager, DEFAULT_CHARACTERS } from '../services/characterManager.js';
import { soundService } from '../services/soundService.js';

// Local storage key
const STORAGE_KEY = 'cyber_pet_storage_v1';

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

const saved = loadStoredState();

export const state = reactive({
  // Character & Action
  characterId: (saved.characterId && saved.characterId !== 'cyber_cat' && saved.characterId !== 'gf_girl') ? saved.characterId : 'zhiyuan',
  currentAction: 'idle',
  
  // Position & Physics
  posX: saved.posX || 280,
  posY: saved.posY || 450,
  isDragging: false,
  isFalling: false,
  facingLeft: false,

  // APM & Keystroke Monitor
  apm: 0,
  keysIn60s: 0,
  isFurious: false,
  lastFuriousTriggerTime: 0,
  lowApmStartTime: null,
  activeTypingMinutes: 0,

  // Work State: 'off' | 'working' | 'toilet'
  workState: saved.workState || 'off',
  clockInTime: saved.clockInTime || null,
  accumulatedWorkSeconds: saved.accumulatedWorkSeconds || 0,
  
  // Toilet Break
  toiletStartTime: null,
  toiletSeconds: 0,

  // Financial Config
  monthlySalary: saved.monthlySalary !== undefined ? saved.monthlySalary : 25000,
  dailyStandardHours: saved.dailyStandardHours !== undefined ? saved.dailyStandardHours : 8,

  // Merits & Stats
  merits: saved.merits || 0,
  fishKnockCount: saved.fishKnockCount || 0,
  rpsWins: saved.rpsWins || 0,
  rpsLosses: saved.rpsLosses || 0,

  // UI States
  showRadialMenu: false,
  showContextMenu: false,
  radialMenuPos: { x: 0, y: 0 },
  activeModal: null, // 'clockOutReport' | 'toiletBreak' | 'rpsGame' | 'settings'
  showClockInBanner: false,
  boredBubbleText: '',

  // Settings
  soundVolume: saved.soundVolume !== undefined ? saved.soundVolume : 0.8,
  soundMuted: saved.soundMuted || false,
  floatTextEnabled: saved.floatTextEnabled !== undefined ? saved.floatTextEnabled : true,
  fpsTarget: saved.fpsTarget || 60,
  autostart: saved.autostart || false
});

// Hourly and secondly salary
export const hourlyRate = computed(() => {
  // PRD formula: 月薪 / (21.75 * 每日工时)
  const days = 21.75;
  const hours = state.dailyStandardHours || 8;
  return state.monthlySalary / (days * hours);
});

export const secondRate = computed(() => {
  return hourlyRate.value / 3600;
});

// Real-time Clocked In Earned Money
export const clockedInEarnings = computed(() => {
  if (!state.clockInTime && state.accumulatedWorkSeconds === 0) return 0;
  let totalSecs = state.accumulatedWorkSeconds;
  if (state.clockInTime && state.workState === 'working') {
    totalSecs += (Date.now() - state.clockInTime) / 1000;
  }
  return totalSecs * secondRate.value;
});

// Toilet earnings
export const currentToiletEarnings = computed(() => {
  return state.toiletSeconds * secondRate.value;
});

// Auto-save state
watch(
  () => ({
    characterId: state.characterId,
    posX: state.posX,
    posY: state.posY,
    monthlySalary: state.monthlySalary,
    dailyStandardHours: state.dailyStandardHours,
    merits: state.merits,
    fishKnockCount: state.fishKnockCount,
    rpsWins: state.rpsWins,
    rpsLosses: state.rpsLosses,
    soundVolume: state.soundVolume,
    soundMuted: state.soundMuted,
    floatTextEnabled: state.floatTextEnabled,
    fpsTarget: state.fpsTarget,
    autostart: state.autostart,
    workState: state.workState,
    clockInTime: state.clockInTime,
    accumulatedWorkSeconds: state.accumulatedWorkSeconds
  }),
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
    } catch (e) {}
  },
  { deep: true }
);

// Watch audio volume & mute
watch(() => state.soundVolume, (val) => soundService.setVolume(val), { immediate: true });
watch(() => state.soundMuted, (val) => soundService.setMuted(val), { immediate: true });

export function setAction(action) {
  state.currentAction = action;
}

export function switchCharacter(charId) {
  state.characterId = charId;
}

export function triggerSpaceKnock() {
  state.fishKnockCount++;
  state.merits++;
  soundService.playWoodfish();
  setAction('knock_fish');
}

export function updateApm(apm, count) {
  state.apm = apm;
  state.keysIn60s = count;

  const now = Date.now();
  // Threshold is 180 APM according to PRD
  if (apm > 180 && !state.isFurious) {
    state.isFurious = true;
    state.lastFuriousTriggerTime = now;
    state.lowApmStartTime = null;
    setAction('furious_fire');
    soundService.playFireRoar();
    if (window.electronAPI) {
      window.electronAPI.updateTrayStatus('暴躁中 🔥');
    }
  } else if (state.isFurious) {
    // Cooldown check: if APM < 80 for 30s
    if (apm < 80) {
      if (!state.lowApmStartTime) {
        state.lowApmStartTime = now;
      } else if (now - state.lowApmStartTime > 30000) {
        state.isFurious = false;
        state.lowApmStartTime = null;
        setAction('idle');
        if (window.electronAPI) {
          window.electronAPI.updateTrayStatus(state.workState === 'working' ? '搬砖中 🧱' : '摸鱼中 🐟');
        }
      }
    } else {
      state.lowApmStartTime = null;
    }
  }
}

// Work clocking
export function clockIn() {
  state.workState = 'working';
  state.clockInTime = Date.now();
  state.showClockInBanner = true;
  soundService.playClockIn();
  if (window.electronAPI) {
    window.electronAPI.updateTrayStatus('搬砖中 🧱');
  }
}

export function clockOut() {
  if (state.clockInTime) {
    state.accumulatedWorkSeconds += (Date.now() - state.clockInTime) / 1000;
  }
  state.workState = 'off';
  state.clockInTime = null;
  state.activeModal = 'clockOutReport';
  soundService.playClockOut();
  if (window.electronAPI) {
    window.electronAPI.updateTrayStatus('已下班 🏖️');
  }
}

export function startToiletBreak() {
  state.workState = 'toilet';
  state.toiletStartTime = Date.now();
  state.toiletSeconds = 0;
  state.activeModal = 'toiletBreak';
  setAction('washroom');
  soundService.playCoin();
}

export function finishToiletBreak() {
  state.workState = 'working';
  state.toiletStartTime = null;
  state.activeModal = null;
  setAction('idle');
  soundService.playCoin();
}

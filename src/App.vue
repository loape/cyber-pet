<template>
  <div class="app-root-container">
    <!-- Merit floating particles -->
    <MeritFloater ref="meritRef" />

    <!-- Pet Entity -->
    <PetCharacter
      :character-id="state.characterId"
      :current-action="state.currentAction"
      :is-dragging="state.isDragging"
      :facing-left="state.facingLeft"
      :is-furious="state.isFurious"
      :apm="state.apm"
      :bored-text="state.boredBubbleText"
      :fps-target="state.fpsTarget"
      :is-following-mouse="isFollowingMouse"
      @update:is-dragging="(val) => state.isDragging = val"
      @update:facing-left="(val) => state.facingLeft = val"
      @update:is-following-mouse="setFollowMouse"
      @action-change="onActionChange"
      @open-radial-menu="toggleDock"
      @knock-fish="handleSpaceKnock"
    />

    <!-- Bottom Horizontal 5-button Dock (上班/下班/如厕/互动/设置) - Summoned on Right Click -->
    <HorizontalDock
      v-if="!state.activeModal && showDock"
      :work-state="state.workState"
      :is-following-mouse="isFollowingMouse"
      @action="handleDockAction"
      @interact="handleDockInteract"
      @close="showDock = false"
    />

    <!-- Clock In Banner Popup -->
    <ClockInBanner
      :show="state.showClockInBanner"
      @close="state.showClockInBanner = false"
    />

    <!-- Quick Rock Paper Scissors Game Modal -->
    <RpsGameModal
      v-if="state.activeModal === 'rpsGame'"
      @finish="onRpsFinished"
      @merit="onRpsMerit"
    />

    <!-- Clock Out Report Modal (expands window) -->
    <ClockOutReport
      v-if="state.activeModal === 'clockOutReport'"
      :work-seconds="state.accumulatedWorkSeconds"
      :effective-minutes="state.activeTypingMinutes"
      :earned-amount="clockedInEarnings"
      :merits="state.merits"
      :fish-knock-count="state.fishKnockCount"
      @close="closeModal"
    />

    <!-- Toilet Break Modal (expands window) -->
    <ToiletBreakModal
      v-if="state.activeModal === 'toiletBreak'"
      :second-rate="secondRate"
      @finish="onToiletFinished"
    />

    <!-- Settings Modal (expands window) -->
    <SettingsModal
      v-if="state.activeModal === 'settings'"
      :current-character-id="state.characterId"
      :salary="state.monthlySalary"
      :hours="state.dailyStandardHours"
      :volume="state.soundVolume"
      :muted="state.soundMuted"
      :float-text-enabled="state.floatTextEnabled"
      :fps-target="state.fpsTarget"
      :autostart="state.autostart"
      :hourly-rate="hourlyRate"
      @close="closeModal"
      @switch-char="onSwitchChar"
      @update-salary="(val) => state.monthlySalary = val"
      @update-hours="(val) => state.dailyStandardHours = val"
      @update-volume="(val) => state.soundVolume = val"
      @update-mute="(val) => state.soundMuted = val"
      @update-float="(val) => state.floatTextEnabled = val"
      @update-fps="(val) => state.fpsTarget = val"
      @update-autostart="onUpdateAutostart"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  state,
  hourlyRate,
  secondRate,
  clockedInEarnings,
  setAction,
  switchCharacter,
  triggerSpaceKnock,
  updateApm,
  clockIn,
  clockOut,
  startToiletBreak,
  finishToiletBreak
} from './stores/petStore.js';

import PetCharacter from './components/PetCharacter.vue';
import MeritFloater from './components/MeritFloater.vue';
import HorizontalDock from './components/HorizontalDock.vue';
import ClockInBanner from './components/ClockInBanner.vue';
import ClockOutReport from './components/ClockOutReport.vue';
import ToiletBreakModal from './components/ToiletBreakModal.vue';
import RpsGameModal from './components/RpsGameModal.vue';
import SettingsModal from './components/SettingsModal.vue';

const meritRef = ref(null);
const isFollowingMouse = ref(false);
const showDock = ref(false);
let followMouseTimer = null;

function setFollowMouse(enable) {
  if (followMouseTimer) {
    clearTimeout(followMouseTimer);
    followMouseTimer = null;
  }
  isFollowingMouse.value = enable;
  if (enable) {
    // 开启跟随立即收起 Dock 菜单，防止菜单跟着乱跑导致点不中
    showDock.value = false;
    // 5秒后自动停止跟随，防止持续移动干扰用户点击和菜单选择
    followMouseTimer = setTimeout(() => {
      isFollowingMouse.value = false;
      followMouseTimer = null;
    }, 5000);
  }
}

function toggleDock() {
  // 右键呼出菜单时立即停止跟随，让小人固定住方便从容点选
  if (isFollowingMouse.value) {
    setFollowMouse(false);
  }
  showDock.value = !showDock.value;
}

// Manage window size dynamically based on UI state
function syncWindowSize() {
  if (!window.electronAPI) return;

  if (state.activeModal === 'settings' || state.activeModal === 'clockOutReport' || state.activeModal === 'toiletBreak') {
    window.electronAPI.setWindowSize(540, 720);
  } else if (state.activeModal === 'rpsGame') {
    window.electronAPI.setWindowSize(320, 260);
  } else {
    window.electronAPI.setWindowSize(260, 240);
  }
}

watch(() => state.activeModal, (val) => {
  if (val && isFollowingMouse.value) {
    setFollowMouse(false);
  }
  syncWindowSize();
  if (window.electronAPI && window.electronAPI.setFocusable) {
    window.electronAPI.setFocusable(!!val);
  }
});

function handleDockAction(action) {
  if (action === 'clockIn') {
    clockIn();
    showDock.value = false;
  } else if (action === 'clockOut') {
    clockOut();
    showDock.value = false;
  } else if (action === 'toilet') {
    startToiletBreak();
    showDock.value = false;
  } else if (action === 'settings') {
    state.activeModal = 'settings';
    showDock.value = false;
  }
}

function handleDockInteract(type) {
  if (type === 'rps') {
    state.activeModal = 'rpsGame';
    setAction('rock_paper_scissors');
    showDock.value = false;
  } else if (type === 'followMouse') {
    setFollowMouse(!isFollowingMouse.value);
  } else if (type === 'dance') {
    setAction('dance');
    showDock.value = false;
  } else if (type === 'knockFish') {
    handleSpaceKnock();
  }
}

function openSettingsModal() {
  state.activeModal = 'settings';
}

function closeModal() {
  state.activeModal = null;
}

function resetPositionToBottomRight() {
  if (window.electronAPI) {
    window.electronAPI.getScreenBounds().then((screenInfo) => {
      if (screenInfo && screenInfo.workArea) {
        const initX = screenInfo.workArea.x + screenInfo.workArea.width - 280;
        const initY = screenInfo.workArea.y + screenInfo.workArea.height - 260;
        window.electronAPI.setWindowPosition(initX, initY);
        try {
          localStorage.setItem('pet_win_x', String(initX));
          localStorage.setItem('pet_win_y', String(initY));
        } catch (e) {}
      }
    });
  }
}

// Spacebar KeyDown Handling
function handleSpaceKnock() {
  triggerSpaceKnock();
  if (state.floatTextEnabled && meritRef.value) {
    meritRef.value.spawn(130, 75);
  }
}

function onActionChange(action) {
  setAction(action);
}

function onToiletFinished() {
  finishToiletBreak();
}

function onRpsFinished(result) {
  state.activeModal = null;
  if (result === 'win') {
    state.rpsWins++;
  } else if (result === 'lose') {
    state.rpsLosses++;
  }
  setAction('idle');
}

function onRpsMerit(text, color) {
  if (meritRef.value) {
    meritRef.value.spawn(130, 75, text, color);
  }
}

function onSwitchChar(id) {
  switchCharacter(id);
}

function onUpdateAutostart(val) {
  state.autostart = val;
  if (window.electronAPI) {
    window.electronAPI.setAutostart(val);
  }
}

// Window Keyboard listener
function onWindowKeyDown(e) {
  if (e.key === 'Escape') {
    if (isFollowingMouse.value) {
      setFollowMouse(false);
    }
    if (showDock.value) {
      showDock.value = false;
    }
    return;
  }

  if (e.code === 'Space') {
    if (e.target.tagName !== 'INPUT') {
      e.preventDefault();
      handleSpaceKnock();
    }
  }
}

// Dynamic transparent area click-through so user apps are never blocked
function setupMousePassThrough() {
  if (!window.electronAPI) return;

  window.addEventListener('mousemove', (e) => {
    if (state.isDragging || state.activeModal) {
      window.electronAPI.setIgnoreMouseEvents(false);
      return;
    }
    const interactive = e.target.closest('.interactive') || e.target.closest('button') || e.target.closest('canvas') || e.target.closest('input');
    if (interactive) {
      window.electronAPI.setIgnoreMouseEvents(false);
    } else {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  window.addEventListener('mouseleave', () => {
    if (!state.isDragging && !state.activeModal) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  });
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeyDown);
  setupMousePassThrough();

  if (window.electronAPI) {
    // Restore saved window position
    try {
      const savedX = localStorage.getItem('pet_win_x');
      const savedY = localStorage.getItem('pet_win_y');
      if (savedX !== null && savedY !== null) {
        window.electronAPI.setWindowPosition(Number(savedX), Number(savedY));
      }
    } catch (e) {}

    // Initial window size
    syncWindowSize();

    // Global space from CGEventTap
    window.electronAPI.onGlobalSpace(() => {
      handleSpaceKnock();
    });

    // Global APM calculation from CGEventTap
    window.electronAPI.onApmUpdate((data) => {
      if (data && data.apm !== undefined) {
        updateApm(data.apm, data.count_60s || 0);
      }
    });

    // Tray Menu events
    window.electronAPI.onOpenSettings(() => {
      state.activeModal = 'settings';
    });

    window.electronAPI.onResetPosition(() => {
      resetPositionToBottomRight();
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeyDown);
});
</script>

<style>
.app-root-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: transparent !important;
  box-shadow: none !important;
  user-select: none;
}
</style>

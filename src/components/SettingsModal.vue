<template>
  <div
    class="settings-backdrop interactive"
    @mouseenter="$emit('hover-change', true)"
    @mouseleave="$emit('hover-change', false)"
  >
    <div class="settings-modal-card">
      <div class="modal-header">
        <div class="header-left">
          <span class="settings-icon">⚙️</span>
          <span class="modal-title">工位桌宠控制台</span>
        </div>
        <button class="close-x-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body-scroll">
        <!-- 1. 形象选择 (5大形象网格预览) -->
        <div class="setting-section">
          <div class="section-title">
            <span>🎭 角色形象热切换 (无需重启)</span>
            <span class="sub-tip">3 款专属角色</span>
          </div>

          <div class="character-grid">
            <div
              v-for="char in characters"
              :key="char.character_id"
              class="char-card"
              :class="{ selected: currentCharacterId === char.character_id }"
              @click="selectChar(char.character_id)"
            >
              <div class="char-badge">{{ char.badge }}</div>
              <div class="char-preview-box">
                <canvas
                  :ref="(el) => renderCharPreview(el, char.character_id)"
                  width="64"
                  height="64"
                  class="char-canvas-preview"
                ></canvas>
              </div>
              <div class="char-name">{{ char.name }}</div>
              <div class="char-tagline">{{ char.tagline }}</div>
            </div>
          </div>
        </div>

        <!-- 2. 薪资与工时设置 -->
        <div class="setting-section">
          <div class="section-title">
            <span>💰 薪资收益算法配置</span>
            <span class="sub-tip">用于精准核算摸鱼与如厕收入</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>税前月薪 (元)</label>
              <div class="input-with-unit">
                <span class="unit-prefix">¥</span>
                <input
                  type="number"
                  v-model.number="salaryInput"
                  @input="onSalaryInput"
                  @change="onSalaryChange"
                  placeholder="25000"
                  min="0"
                  step="500"
                />
              </div>
            </div>

            <div class="form-group">
              <label>每日标准工时</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  v-model.number="hoursInput"
                  @input="onHoursInput"
                  @change="onHoursChange"
                  placeholder="8"
                  min="1"
                  max="24"
                  step="0.5"
                />
                <span class="unit-suffix">小时</span>
              </div>
            </div>
          </div>

          <div class="salary-calc-preview">
            <div class="calc-tag">
              当前计算时薪：<span class="highlight">¥ {{ hourlyRate.toFixed(2) }}/h</span>
            </div>
            <div class="calc-tag">
              每秒摸鱼进账：<span class="highlight">¥ {{ (hourlyRate / 3600).toFixed(4) }}/s</span>
            </div>
          </div>
        </div>

        <!-- 3. 音效与视觉反馈 -->
        <div class="setting-section">
          <div class="section-title">
            <span>🔊 交互与音效调控</span>
          </div>

          <div class="control-row">
            <div class="ctrl-label">木鱼音量调节</div>
            <div class="slider-wrapper">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                v-model.number="volumeVal"
                @input="updateVolume"
                class="range-slider"
              />
              <span class="volume-val">{{ Math.round(volumeVal * 100) }}%</span>
            </div>
          </div>

          <div class="control-row">
            <div class="ctrl-label">静音模式</div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="soundMuted" @change="updateMute" />
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="control-row">
            <div class="ctrl-label">功德飘字粒子特效 (Bug -1 / 功德 +1)</div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="floatEnabled" @change="updateFloat" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 4. 系统与性能选项 -->
        <div class="setting-section">
          <div class="section-title">
            <span>⚡️ 系统与节能设置</span>
          </div>

          <div class="control-row">
            <div class="ctrl-label">渲染帧率限制 (节约笔电续航)</div>
            <div class="fps-selector">
              <button
                class="fps-opt"
                :class="{ active: fpsVal === 30 }"
                @click="updateFps(30)"
              >
                30 FPS
              </button>
              <button
                class="fps-opt"
                :class="{ active: fpsVal === 60 }"
                @click="updateFps(60)"
              >
                60 FPS
              </button>
            </div>
          </div>

          <div class="control-row">
            <div class="ctrl-label">开机自启动 (macOS LaunchAgent)</div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="autostartVal" @change="updateAutostart" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="done-btn" @click="$emit('close')">
          完成并保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { characterManager } from '../services/characterManager.js';

const props = defineProps({
  currentCharacterId: String,
  salary: Number,
  hours: Number,
  volume: Number,
  muted: Boolean,
  floatTextEnabled: Boolean,
  fpsTarget: Number,
  autostart: Boolean,
  hourlyRate: Number
});

const emit = defineEmits([
  'close',
  'switch-char',
  'update-salary',
  'update-hours',
  'update-volume',
  'update-mute',
  'update-float',
  'update-fps',
  'update-autostart',
  'hover-change'
]);

const characters = computed(() => characterManager.getAllCharacters());
const salaryInput = ref(props.salary || 25000);
const hoursInput = ref(props.hours || 8);
const volumeVal = ref(props.volume !== undefined ? props.volume : 0.8);
const soundMuted = ref(props.muted || false);
const floatEnabled = ref(props.floatTextEnabled !== undefined ? props.floatTextEnabled : true);
const fpsVal = ref(props.fpsTarget || 60);
const autostartVal = ref(props.autostart || false);

function renderCharPreview(canvas, charId) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const char = characterManager.getCharacter(charId);
  if (char && char.avatar) {
    const img = characterManager.getImage(char.avatar);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return;
    }
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    return;
  }

  // Draw idle frame 0
  characterManager.drawFrame(ctx, charId, 'idle', 0, canvas.width, canvas.height);
}

function selectChar(id) {
  emit('switch-char', id);
}

function onSalaryInput() {
  const val = Number(salaryInput.value);
  if (!isNaN(val) && val >= 0) {
    emit('update-salary', val);
  }
}

function onSalaryChange() {
  let val = Number(salaryInput.value);
  if (isNaN(val) || val <= 0) {
    val = 25000;
    salaryInput.value = val;
  }
  emit('update-salary', val);
}

function onHoursInput() {
  const val = Number(hoursInput.value);
  if (!isNaN(val) && val > 0 && val <= 24) {
    emit('update-hours', val);
  }
}

function onHoursChange() {
  let val = Number(hoursInput.value);
  if (isNaN(val) || val <= 0) {
    val = 8;
  } else if (val > 24) {
    val = 24;
  }
  hoursInput.value = val;
  emit('update-hours', val);
}

function updateVolume() {
  emit('update-volume', volumeVal.value);
}

function updateMute() {
  emit('update-mute', soundMuted.value);
}

function updateFloat() {
  emit('update-float', floatEnabled.value);
}

function updateFps(fps) {
  fpsVal.value = fps;
  emit('update-fps', fps);
}

function updateAutostart() {
  emit('update-autostart', autostartVal.value);
}
</script>

<style scoped>
.settings-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 16px 10px;
  background: transparent !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  border: none !important;
  z-index: 6000;
  pointer-events: auto !important;
}

.settings-modal-card {
  width: 500px;
  max-height: calc(100vh - 32px);
  background: #0f172a;
  border: 1.5px solid #38bdf8;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleIn 0.25s ease-out;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-icon {
  font-size: 20px;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
}

.close-x-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}

.close-x-btn:hover {
  color: #fff;
}

.modal-body-scroll {
  padding: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-body-scroll::-webkit-scrollbar {
  width: 6px;
}
.modal-body-scroll::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}
.modal-body-scroll::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 4px;
}
.modal-body-scroll::-webkit-scrollbar-thumb:hover {
  background: #38bdf8;
}

.setting-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #334155;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 800;
  color: #e2e8f0;
}

.sub-tip {
  font-size: 10px;
  color: #94a3b8;
  font-weight: normal;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
  gap: 8px;
}

.char-card {
  background: #0f172a;
  border: 1.5px solid #334155;
  border-radius: 10px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.char-card:hover {
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.char-card.selected {
  border-color: #00f2fe;
  box-shadow: 0 0 14px rgba(0, 242, 254, 0.4);
  background: rgba(0, 242, 254, 0.08);
}

.char-badge {
  font-size: 8px;
  font-weight: 700;
  color: #fbbf24;
  padding: 1px 4px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 4px;
}

.char-preview-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.char-canvas-preview {
  width: 48px;
  height: 48px;
}

.char-name {
  font-size: 11px;
  font-weight: 700;
  color: #f1f5f9;
}

.char-tagline {
  font-size: 8px;
  color: #64748b;
  text-align: center;
  display: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.input-with-unit {
  display: flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 6px 10px;
}

.input-with-unit input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  outline: none;
  width: 100%;
  user-select: text !important;
  -webkit-user-select: text !important;
  cursor: text;
}

.unit-prefix, .unit-suffix {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}

.salary-calc-preview {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #334155;
  font-size: 11px;
  color: #94a3b8;
}

.highlight {
  color: #4ade80;
  font-weight: 800;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.ctrl-label {
  font-size: 12px;
  color: #cbd5e1;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-slider {
  width: 100px;
  cursor: pointer;
}

.volume-val {
  font-size: 11px;
  color: #94a3b8;
  min-width: 35px;
}

.fps-selector {
  display: flex;
  gap: 6px;
}

.fps-opt {
  padding: 4px 10px;
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.fps-opt.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #334155;
  border-radius: 20px;
  transition: 0.2s;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}

input:checked + .switch-slider {
  background-color: #10b981;
}

input:checked + .switch-slider:before {
  transform: translateX(16px);
}



.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
}

.done-btn {
  padding: 8px 20px;
  background: #00f2fe;
  border: none;
  border-radius: 8px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.done-btn:hover {
  box-shadow: 0 0 16px rgba(0, 242, 254, 0.6);
  transform: translateY(-1px);
}
</style>

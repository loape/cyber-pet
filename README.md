# 赛博工位桌宠（CyberPet）

<div align="center">

> 专为 macOS 开发者打造的常驻桌面、轻量解压、具备工位黑色幽默与发泄属性的桌面宠物。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-33.x-blue.svg)](https://www.electronjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon)-black.svg)](https://apple.com)

</div>

---

## 🌟 核心特性一览

1. **🎭 3 款精选专属角色与逐帧动画渲染**：
   - 内置专属定制角色：**杨洋 (yy)**、**蜡笔小新 (Shinnosuke)**、**志远 (zhiyuan)**。
   - 完备的动画插槽：`idle`（待机呼吸）、`walk`（步态行走）、`knock_fish`（极速敲木鱼）、`curious`（歪头好奇）、`dance`（快乐跳舞）、`washroom`（带薪蹲坑）、`dragged`（鼠标拎起悬空）、`furious_fire`（狂暴暴躁）。
   - 纯 Canvas Spritesheet 逐帧精准渲染，超低 CPU 与内存占用。

2. **🪵 极速敲木鱼与功德飘字特效**：
   - **全局按键与鼠标连击**：按下空格键或直接点击小人触发清脆敲木鱼，打击感无硬编码停顿，精准跟随毫秒级动画；
   - **功德粒子飘字**：头顶实时向上抛射浮空词条（`Bug -1`、`功德 +1`、`血压 -10%`、`掉发 -1根`、`摸鱼时长 +1s`）。

3. **🔥 键盘 APM 实时监控与“暴躁模式”**：
   - 采用 60 秒滑动窗口算法精确统计实时键盘 APM；
   - **APM > 180**：强制切入暴躁模式，眼冒红光举起“多喝热水”警示牌，头顶冒泡吐槽：“敲这么快，要起飞了？快喝水摸鱼！”；降至 80 以下自动冷却恢复。

4. **👀 智能鼠标跟随与防干扰停止机制**：
   - 开启后小人用真实 `walk` 步态追踪鼠标屏幕坐标；
   - **5s 自动停止**：跟随最长持续 5 秒，超时自动收步恢复待机；
   - **点击/右键/悬停即刻立定**：鼠标移入小人身体或单击小人、右键呼出菜单时立即原地定身，从容点选无需捉迷藏。

5. **🎮 底部 Dock 栏与五大核心玩法**：
   - 右键小人随时唤出 5 按钮极简操作栏（上班、下班、如厕、互动、设置）：
     - ⏰ **上班打卡**：记录上班工时，累计摸鱼收益；
     - 🏖️ **下班打卡**：结算下班战报面板，精准计算搬砖工时、有效时长与从公司账户“搬走”的资产，支持一键复制战报；
     - 🚽 **带薪如厕**：毫秒级跳动跳表收益统计，一键生成精致复古的“带薪如厕财富小票”，支持直接复制图片到剪贴板；
     - ✊ **趣味互动**：包含极速猜拳对决、快乐跳舞、鼠标跟随等；
     - ⚙️ **控制台**：薪资收益算法配置、每日工时自定义、木鱼音量与静音、30/60 FPS 节能调控。

---

## 🚀 快速开始

### 环境要求
- **macOS** (支持 macOS 12+，已对 Apple Silicon M 系列芯片深度优化)
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 安装与启动

```bash
# 1. 克隆代码仓库
git clone https://github.com/loape/cyber-pet.git
cd cyber-pet

# 2. 安装项目依赖
npm install

# 3. 启动开发与桌面应用
npm start
```

---

## 📦 打包与发布 (macOS)

本项目已预设纯 Apple Silicon (arm64 / M1/M2/M3/M4) 的快速构建配置：

```bash
# 执行完整打包 (生成 .dmg 镜像与 .zip 包)
npm run dist
```

打包完成后，产物将保存在 `release/` 目录：
- **`CyberPet-1.0.0-arm64.dmg`**：macOS 拖拽安装镜像包
- **`CyberPet-1.0.0-arm64-mac.zip`**：解压即用的免安装绿色应用

---

## 🔒 辅助功能权限说明

应用在后台使用 macOS 原生 `Quartz CGEventTap` 接口监听全局敲木鱼空格键与键盘击键频率（**仅用于计算打字 APM 频率，绝不记录任何文本内容，严格保障隐私**）。

- 若全局敲木鱼未响应，可在 **macOS 系统设置 -> 隐私与安全性 -> 辅助功能** 中勾选允许终端或 `CyberPet` 即可；
- 未授权辅助功能时，桌宠内部的鼠标点击、敲击与菜单互动不受任何影响。

---

## 🛠️ 技术栈与架构

- **桌面运行时**：[Electron 33](https://www.electronjs.org/)
- **前端框架**：[Vue 3](https://vuejs.org/) + [Vite 6](https://vitejs.dev/)
- **系统层原生桥接**：macOS Quartz CGEventTap + Python Native Hook
- **音效合成**：Web Audio API 真实物理谐振木鱼音效
- **打包分发**：[electron-builder](https://www.electron.build/)

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 协议开源。

/**
 * Character Manager & Spritesheet Renderer
 * Supports:
 * 1. zhiyuan (志远)
 * 2. yy (杨洋)
 * 3. Shinnosuke (蜡笔小新)
 */

export const ACTION_ROWS = {
  idle: 0,
  walk: 1,
  sleep: 2,
  knock_fish: 3,
  furious_fire: 4,
  dragged: 5,
  curious: 6,
  rock_paper_scissors: 7,
  dance: 1,
  washroom: 2
};

export function resolveAssetUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('file://')) {
    return src;
  }
  const cleanPath = src.replace(/^\/+/, '').replace(/^\.\//, '');
  try {
    const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    return new URL(cleanPath, base).href;
  } catch (e) {
    return cleanPath;
  }
}

export const DEFAULT_CHARACTERS = [
  {
    character_id: 'zhiyuan',
    name: '金智媛',
    avatar: '/characters/zhiyuan/avatar.png',
    tagline: '今天不加班，明天搬砖搬到瘫',
    themeColor: '#ff9a44',
    badge: '元气社畜',
    version: '1.0.0',
    frame_size: { width: 128, height: 128 },
    fps: 12,
    animations: {
      idle: { image: '/characters/zhiyuan/idle.png', frames: 8, loop: true, duration_ms: 2800 },
      walk: { image: '/characters/zhiyuan/walk.png', frames: 8, loop: true, duration_ms: 1600 },
      sleep: { image: '/characters/zhiyuan/sleep.png', frames: 8, loop: true, duration_ms: 2400 },
      knock_fish: { image: '/characters/zhiyuan/knock_fish.png', frames: 2, loop: false, duration_ms: 60 },
      furious_fire: { image: '/characters/zhiyuan/furious_fire.png', frames: 8, loop: true, duration_ms: 1500 },
      dragged: { image: '/characters/zhiyuan/dragged.png', frames: 8, loop: true, duration_ms: 900 },
      curious: { image: '/characters/zhiyuan/curious.png', frames: 8, loop: true, duration_ms: 1400 },
      rock_paper_scissors: { image: '/characters/zhiyuan/rock_paper_scissors.png', frames: 8, loop: false, duration_ms: 1200 },
      dance: { image: '/characters/zhiyuan/dance.png', frames: 8, loop: true, duration_ms: 1500 },
      washroom: { image: '/characters/zhiyuan/washroom.png', frames: 8, loop: true, duration_ms: 1800 }
    }
  },
  {
    character_id: 'yy',
    name: '杨洋',
    avatar: '/characters/yy/avatar.png',
    tagline: '认真工作，按时带薪如厕',
    themeColor: '#3b82f6',
    badge: '国民男神',
    version: '1.0.0',
    frame_size: { width: 128, height: 128 },
    fps: 12,
    animations: {
      idle: { image: '/characters/yy/idle.png', frames: 8, loop: true, duration_ms: 2800 },
      walk: { image: '/characters/yy/walk.png', frames: 8, loop: true, duration_ms: 1600 },
      sleep: { image: '/characters/yy/sleep.png', frames: 8, loop: true, duration_ms: 2400 },
      knock_fish: { image: '/characters/yy/knock_fish.png', frames: 2, loop: false, duration_ms: 60 },
      furious_fire: { image: '/characters/yy/furious_fire.png', frames: 8, loop: true, duration_ms: 1500 },
      dragged: { image: '/characters/yy/dragged.png', frames: 8, loop: true, duration_ms: 900 },
      curious: { image: '/characters/yy/curious.png', frames: 8, loop: true, duration_ms: 1400 },
      rock_paper_scissors: { image: '/characters/yy/knock_fish.png', frames: 8, loop: false, duration_ms: 1200 },
      dance: { image: '/characters/yy/dance.png', frames: 8, loop: true, duration_ms: 1500 },
      washroom: { image: '/characters/yy/washroom.png', frames: 8, loop: true, duration_ms: 1800 }
    }
  },
  {
    character_id: 'Shinnosuke',
    name: '蜡笔小新',
    avatar: '/characters/Shinnosuke/avatar.png',
    tagline: '动感光波！哔哔哔哔——',
    themeColor: '#ef4444',
    badge: '动感超人',
    version: '1.0.0',
    frame_size: { width: 128, height: 128 },
    fps: 12,
    animations: {
      idle: { image: '/characters/Shinnosuke/idle.png', frames: 8, loop: true, duration_ms: 2800 },
      walk: { image: '/characters/Shinnosuke/walk.png', frames: 8, loop: true, duration_ms: 1600 },
      sleep: { image: '/characters/Shinnosuke/sleep.png', frames: 8, loop: true, duration_ms: 2400 },
      knock_fish: { image: '/characters/Shinnosuke/knock_fish.png', frames: 2, loop: false, duration_ms: 40 },
      furious_fire: { image: '/characters/Shinnosuke/furious_fire.png', frames: 8, loop: true, duration_ms: 1500 },
      dragged: { image: '/characters/Shinnosuke/dragged.png', frames: 8, loop: true, duration_ms: 900 },
      curious: { image: '/characters/Shinnosuke/curious.png', frames: 8, loop: true, duration_ms: 1400 },
      rock_paper_scissors: { image: '/characters/Shinnosuke/rock_paper_scissors.png', frames: 8, loop: false, duration_ms: 1200 },
      dance: { image: '/characters/Shinnosuke/dance.png', frames: 8, loop: true, duration_ms: 1500 },
      washroom: { image: '/characters/Shinnosuke/washroom.png', frames: 8, loop: true, duration_ms: 1800 }
    }
  }
];

class CharacterManager {
  constructor() {
    this.characters = [...DEFAULT_CHARACTERS];
    this.spritesheetCache = new Map();
    this.imageCache = new Map();
    this.redrawListeners = new Set();
  }

  onRedraw(callback) {
    this.redrawListeners.add(callback);
    return () => this.redrawListeners.delete(callback);
  }

  notifyRedraw() {
    for (const cb of this.redrawListeners) {
      try { cb(); } catch (e) { }
    }
  }

  getImage(src) {
    if (!src) return null;
    const resolvedUrl = resolveAssetUrl(src);
    if (this.imageCache.has(resolvedUrl)) {
      return this.imageCache.get(resolvedUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.notifyRedraw();
    };
    img.onerror = (e) => {
      console.warn('[CharacterManager] Failed to load image:', resolvedUrl, e);
    };
    img.src = resolvedUrl;
    this.imageCache.set(resolvedUrl, img);
    return img;
  }

  registerCharacter(charConfig) {
    const idx = this.characters.findIndex(c => c.character_id === charConfig.character_id);
    if (idx >= 0) {
      this.characters[idx] = { ...this.characters[idx], ...charConfig };
    } else {
      this.characters.push(charConfig);
    }
  }

  drawFrame(ctx, charId, action, frame, canvasW, canvasH) {
    const char = this.getCharacter(charId);
    if (!char) return;

    const anim = char.animations[action] || char.animations.idle || { frames: 1 };
    const frameW = char.frame_size ? char.frame_size.width : 128;
    const frameH = char.frame_size ? char.frame_size.height : 128;
    const totalFrames = Array.isArray(anim.frames) ? anim.frames.length : (anim.frames || 1);
    const clampedFrame = Math.min(totalFrames - 1, frame);

    const drawAspectFit = (img, sx, sy, sw, sh) => {
      const scale = Math.min(canvasW / sw, canvasH / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (canvasW - dw) / 2;
      const dy = (canvasH - dh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    };

    // 1. Multi-image array
    if (Array.isArray(anim.frames) && anim.frames[clampedFrame]) {
      const img = this.getImage(anim.frames[clampedFrame]);
      if (img && img.complete && img.naturalWidth > 0) {
        drawAspectFit(img, 0, 0, img.naturalWidth, img.naturalHeight);
        return;
      }
    }

    // 2. Horizontal sprite sheet strip
    if (anim.image) {
      const img = this.getImage(anim.image);
      if (img && img.complete && img.naturalWidth > 0) {
        if (totalFrames > 1 && img.naturalWidth > img.naturalHeight) {
          const singleW = img.naturalWidth / totalFrames;
          const singleH = img.naturalHeight;
          const sx = clampedFrame * singleW;
          drawAspectFit(img, sx, 0, singleW, singleH);
        } else {
          drawAspectFit(img, 0, 0, img.naturalWidth, img.naturalHeight);
        }
        return;
      }
    }

    // 3. Fallback spritesheet
    if (char.spritesheet) {
      const img = this.getImage(char.spritesheet);
      if (img && img.complete && img.naturalWidth > 0) {
        const row = ACTION_ROWS[action] !== undefined ? ACTION_ROWS[action] : 0;
        const colW = char.frame_size ? char.frame_size.width : img.naturalWidth / 8;
        const rowH = char.frame_size ? char.frame_size.height : img.naturalHeight / 8;
        const sx = clampedFrame * colW;
        const sy = row * rowH;
        drawAspectFit(img, sx, sy, colW, rowH);
        return;
      }
    }
  }

  getCharacter(charId) {
    return this.characters.find(c => c.character_id === charId) || this.characters[0];
  }

  getAllCharacters() {
    return this.characters;
  }
}

export const characterManager = new CharacterManager();

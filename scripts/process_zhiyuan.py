#!/usr/bin/env python3
"""
Process Zhiyuan character assets:
1. Source directory: public/characters/gf_girl
2. Output directory: public/characters/zhiyuan and dist/characters/zhiyuan (also sync back to gf_girl for full backward compatibility)
3. Convert avator.jpeg -> avatar.png (128x128)
4. Convert 2x4 action grids -> 8-frame sprite sheets (2048x256)
5. Remove grid borders & pure white background
"""

import os
import shutil
from collections import deque
import numpy as np
from PIL import Image

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(PROJECT_ROOT, 'public', 'characters', 'gf_girl')
PUB_ZHIYUAN = os.path.join(PROJECT_ROOT, 'public', 'characters', 'zhiyuan')
DIST_ZHIYUAN = os.path.join(PROJECT_ROOT, 'dist', 'characters', 'zhiyuan')
PUB_GF_GIRL = SRC_DIR
DIST_GF_GIRL = os.path.join(PROJECT_ROOT, 'dist', 'characters', 'gf_girl')

for d in [PUB_ZHIYUAN, DIST_ZHIYUAN, PUB_GF_GIRL, DIST_GF_GIRL]:
    os.makedirs(d, exist_ok=True)

def remove_white_background(im_rgb):
    """Cleanly remove white/near-white background and outer dark border lines"""
    arr = np.array(im_rgb)
    H, W, _ = arr.shape
    
    diff_from_white = np.abs(arr.astype(int) - 255).sum(axis=2)
    is_white = diff_from_white < 38

    visited = np.zeros((H, W), dtype=bool)
    queue = deque()

    # Fill from outer borders
    for x in range(W):
        if is_white[0, x]:
            visited[0, x] = True
            queue.append((0, x))
        if is_white[H - 1, x]:
            visited[H - 1, x] = True
            queue.append((H - 1, x))

    for y in range(H):
        if is_white[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            queue.append((y, 0))
        if is_white[y, W - 1] and not visited[y, W - 1]:
            visited[y, W - 1] = True
            queue.append((y, W - 1))

    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
                if is_white[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    alpha = np.ones((H, W), dtype=np.uint8) * 255
    alpha[visited] = 0

    # Clean enclosed near-white background
    enclosed = (alpha > 0) & (diff_from_white < 20)
    alpha[enclosed] = 0

    # Also clean any remaining border artifacts (black lines near outer 3px border)
    for y in range(H):
        for x in range(W):
            if alpha[y, x] > 0 and (x < 3 or x >= W - 3 or y < 3 or y >= H - 3):
                # If dark or close to border edge
                if arr[y, x].mean() < 60:
                    alpha[y, x] = 0

    # Smooth boundary pixels
    for y in range(H):
        for x in range(W):
            if not visited[y, x] and diff_from_white[y, x] < 60:
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and visited[ny, nx]:
                        alpha[y, x] = int(255 * (diff_from_white[y, x] / 60.0))
                        break

    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba, 'RGBA')

def process_avatar():
    avatar_src = os.path.join(SRC_DIR, 'avator.jpeg')
    if not os.path.exists(avatar_src):
        avatar_src = os.path.join(SRC_DIR, 'avatar.jpeg')
    if not os.path.exists(avatar_src):
        print("[!] No avator.jpeg or avatar.jpeg found in source dir")
        return

    print(f"[*] Processing avatar: {avatar_src}...")
    im = Image.open(avatar_src).convert('RGB')
    rgba = remove_white_background(im)
    arr = np.array(rgba)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) > 0:
        bbox = (xs.min(), ys.min(), xs.max(), ys.max())
        sub = rgba.crop((bbox[0], bbox[1], bbox[2], bbox[3]))
        sw, sh = sub.size
        max_side = int(max(sw, sh) * 1.08)
        square_img = Image.new('RGBA', (max_side, max_side), (0, 0, 0, 0))
        square_img.paste(sub, ((max_side - sw) // 2, (max_side - sh) // 2))
        avatar_128 = square_img.resize((128, 128), Image.Resampling.LANCZOS)
        
        for d in [PUB_ZHIYUAN, DIST_ZHIYUAN, PUB_GF_GIRL, DIST_GF_GIRL]:
            out_p = os.path.join(d, 'avatar.png')
            avatar_128.save(out_p)
            print(f"[✓] Saved avatar: {out_p}")

        try:
            os.remove(avatar_src)
        except Exception:
            pass

def process_action_grid(src_filename, target_actions):
    src_path = os.path.join(SRC_DIR, src_filename)
    if not os.path.exists(src_path):
        print(f"[!] Source not found: {src_path}")
        return

    print(f"[*] Processing {src_filename} -> {target_actions}...")
    src_img = Image.open(src_path).convert('RGB')
    W, H = src_img.size
    row_h = H // 2
    col_w = W // 4

    processed_cells = []
    # 5px inset to cleanly skip divider grid lines between cells
    inset = 5
    for r in range(2):
        for c in range(4):
            x1 = c * col_w + inset
            x2 = (c + 1) * col_w - inset
            y1 = r * row_h + inset
            y2 = (r + 1) * row_h - inset
            cell = src_img.crop((x1, y1, x2, y2))
            cell_rgba = remove_white_background(cell)
            processed_cells.append(cell_rgba)

    target_sz = 256
    strip = Image.new('RGBA', (target_sz * 8, target_sz), (0, 0, 0, 0))
    for idx, cell in enumerate(processed_cells):
        scaled = cell.resize((target_sz, target_sz), Image.Resampling.LANCZOS)
        strip.paste(scaled, (idx * target_sz, 0))

    for act in target_actions:
        for d in [PUB_ZHIYUAN, DIST_ZHIYUAN, PUB_GF_GIRL, DIST_GF_GIRL]:
            out_p = os.path.join(d, f"{act}.png")
            strip.save(out_p)
            print(f"[✓] Saved {out_p}")

    try:
        os.remove(src_path)
    except Exception:
        pass

def main():
    process_avatar()

    action_mappings = [
        ('idel.jpeg', ['idle']),
        ('walk.jpeg', ['walk']),
        ('sleep.jpeg', ['sleep']),
        ('dragged.jpeg', ['dragged']),
        ('curious.jpeg', ['curious']),
        ('dance.jpeg', ['dance']),
        ('washroom.jpeg', ['washroom']),
        ('furious_fire.jpeg', ['furious_fire', 'knock_fish', 'rock_paper_scissors']),
    ]

    for src_file, actions in action_mappings:
        process_action_grid(src_file, actions)

    print("[🎉] Zhiyuan character processing finished successfully!")

if __name__ == '__main__':
    main()

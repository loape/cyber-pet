#!/usr/bin/env python3
"""
CyberPet - Unified 2x4 Sprite Sheet Processor
Automates:
1. Auto background removal (both checkerboard grids and solid white backgrounds).
2. Slicing 2 rows x 4 columns = 8 frames sequence.
3. Precise stabilization and centering.
4. Outputting directly to public/ and dist/ character folders.
5. Updating characterManager.js animation frame count.
"""

import sys
import os
import glob
import json
import re
from PIL import Image
import numpy as np
from collections import deque

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARACTERS_DIR = os.path.join(PROJECT_ROOT, 'public', 'characters')
DIST_CHARACTERS_DIR = os.path.join(PROJECT_ROOT, 'dist', 'characters')
SERVICES_CHAR_MGR = os.path.join(PROJECT_ROOT, 'src', 'services', 'characterManager.js')

VALID_ACTIONS = {
    'idle', 'walk', 'sleep', 'knock_fish', 'furious_fire',
    'dragged', 'curious', 'rock_paper_scissors', 'dance'
}

def remove_background(im_rgb):
    """
    Auto-detects and removes either:
    A) Checkerboard transparency grid (gray/white squares)
    B) Pure white / near-white solid background
    Using flood fill from outer boundaries.
    """
    arr = np.array(im_rgb)
    H, W, _ = arr.shape
    
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    
    diff = np.maximum(np.maximum(np.abs(r - g), np.abs(r - b)), np.abs(g - b))
    brightness = (r + g + b) / 3.0
    
    # Check corners to detect background type
    corners = [arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]
    is_pure_white = all(c[0] > 248 and c[1] > 248 and c[2] > 248 for c in corners)
    
    if is_pure_white:
        # Solid white background
        diff_from_white = np.abs(arr.astype(int) - 255).sum(axis=2)
        is_bg = diff_from_white < 35
    else:
        # Checkerboard background (neutral gray & white, brightness >= 195, diff <= 8)
        is_bg = (diff <= 8) & (brightness >= 195)

    visited = np.zeros((H, W), dtype=bool)
    queue = deque()

    # Fill from borders
    # Top and bottom
    for x in range(W):
        if is_bg[0, x]:
            visited[0, x] = True
            queue.append((0, x))
        if is_bg[H - 1, x]:
            visited[H - 1, x] = True
            queue.append((H - 1, x))

    # Left and right
    for y in range(H):
        if is_bg[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            queue.append((y, 0))
        if is_bg[y, W - 1] and not visited[y, W - 1]:
            visited[y, W - 1] = True
            queue.append((y, W - 1))

    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
                if is_bg[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    alpha = np.ones((H, W), dtype=np.uint8) * 255
    alpha[visited] = 0
    
    # Also clean enclosed checkerboard pockets (e.g. under the desk or between ribbons)
    if not is_pure_white:
        enclosed_checker = (alpha > 0) & (diff <= 6) & (brightness >= 210)
        alpha[enclosed_checker] = 0
    
    # Smooth edges if solid white
    if is_pure_white:
        for y in range(H):
            for x in range(W):
                if not visited[y, x] and diff_from_white[y, x] < 65:
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx < W and visited[ny, nx]:
                            alpha[y, x] = int(255 * (diff_from_white[y, x] / 65.0))
                            break

    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba, 'RGBA')

def process_sprite(input_image_path, action_name, character_id='gf_girl', target_frame_sz=256):
    """
    Processes a 2x4 grid image into an aligned 8-frame horizontal strip.
    """
    if action_name not in VALID_ACTIONS:
        print(f"[Warning] Unknown action '{action_name}', allowed actions: {VALID_ACTIONS}")

    print(f"[*] Processing 2x4 image: {input_image_path}")
    print(f"[*] Target action: {action_name} (character: {character_id})")

    src_img = Image.open(input_image_path).convert('RGB')
    W, H = src_img.size
    print(f"[*] Original image dimensions: {W}x{H}")

    row_h = H // 2
    col_w = W // 4

    processed_cells = []
    print("[*] Slicing 2 rows x 4 columns and removing background...")
    
    for r in range(2):
        for c in range(4):
            idx = r * 4 + c
            cell = src_img.crop((c * col_w, r * row_h, (c + 1) * col_w, (r + 1) * row_h))
            cell_rgba = remove_background(cell)
            processed_cells.append(cell_rgba)

    # Calculate optimal alignment against Frame 0
    ref_arr = np.array(processed_cells[0])
    ref_alpha = ref_arr[:, :, 3]
    
    # Detect non-transparent bounding box
    ys, xs = np.where(ref_alpha > 20)
    if len(xs) == 0:
        print("[Error] No character content detected!")
        return False
        
    aligned_cells = []
    # Rigid anchor alignment for stationary props/scenes
    # Check if this scene has a table/anchor (e.g. desktop scene like idle)
    # Search window dx in [-10, 10], dy in [-10, 10]
    cell_h, cell_w = processed_cells[0].size[1], processed_cells[0].size[0]
    
    # Check if upper anchor exists
    anchor_y1, anchor_y2 = int(cell_h * 0.1), int(cell_h * 0.4)
    anchor_x1, anchor_x2 = int(cell_w * 0.1), int(cell_w * 0.9)
    anchor_mask = (ref_alpha[anchor_y1:anchor_y2, anchor_x1:anchor_x2] > 20)
    
    for idx, cimg in enumerate(processed_cells):
        if idx == 0 or anchor_mask.sum() < 100:
            aligned_cells.append(cimg)
            continue
            
        carr = np.array(cimg)
        best_diff = 1e9
        best_dx, best_dy = 0, 0
        
        # Test translation offsets
        for dy in range(-6, 7):
            for dx in range(-6, 7):
                cy1, cy2 = anchor_y1 + dy, anchor_y2 + dy
                cx1, cx2 = anchor_x1 + dx, anchor_x2 + dx
                if 0 <= cy1 and cy2 <= cell_h and 0 <= cx1 and cx2 <= cell_w:
                    patch = carr[cy1:cy2, cx1:cx2, :3].astype(float)
                    ref_patch = ref_arr[anchor_y1:anchor_y2, anchor_x1:anchor_x2, :3].astype(float)
                    diff = np.abs(patch[anchor_mask] - ref_patch[anchor_mask]).mean()
                    if diff < best_diff:
                        best_diff = diff
                        best_dx, best_dy = dx, dy
                        
        shifted = Image.new('RGBA', cimg.size, (0, 0, 0, 0))
        shifted.paste(cimg, (-best_dx, -best_dy))
        aligned_cells.append(shifted)

    # Stitch into standard 8-frame horizontal strip
    strip_8 = Image.new('RGBA', (target_frame_sz * 8, target_frame_sz), (0, 0, 0, 0))
    for idx, acell in enumerate(aligned_cells):
        scaled = acell.resize((target_frame_sz, target_frame_sz), Image.Resampling.LANCZOS)
        strip_8.paste(scaled, (idx * target_frame_sz, 0))

    # Output file paths
    out_dir = os.path.join(CHARACTERS_DIR, character_id)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{action_name}.png")
    
    strip_8.save(out_path)
    print(f"[✓] Saved horizontal 8-frame strip: {out_path} ({strip_8.size})")

    # Also sync to dist if exists
    dist_dir = os.path.join(DIST_CHARACTERS_DIR, character_id)
    if os.path.exists(dist_dir):
        dist_path = os.path.join(dist_dir, f"{action_name}.png")
        strip_8.save(dist_path)
        print(f"[✓] Synced directly to dist: {dist_path}")

    # If action is idle, update avatar.png
    if action_name == 'idle':
        avatar_crop = aligned_cells[0].crop((
            int(cell_w * 0.2), int(cell_h * 0.2),
            int(cell_w * 0.8), int(cell_h * 0.8)
        ))
        avatar_128 = avatar_crop.resize((128, 128), Image.Resampling.LANCZOS)
        avatar_path = os.path.join(out_dir, 'avatar.png')
        avatar_128.save(avatar_path)
        if os.path.exists(dist_dir):
            avatar_128.save(os.path.join(dist_dir, 'avatar.png'))
        print(f"[✓] Updated avatar.png: {avatar_path}")

    # Update frames in characterManager.js if character_id == 'gf_girl'
    update_char_manager_frames(character_id, action_name, frames=8)

    # Clean up input file if it is in public/characters/gf_girl and not named action_name.png
    base_name = os.path.basename(input_image_path)
    if base_name != f"{action_name}.png" and os.path.dirname(os.path.abspath(input_image_path)) == os.path.abspath(out_dir):
        try:
            os.remove(input_image_path)
            print(f"[✓] Cleaned up temporary source file: {base_name}")
        except Exception:
            pass

    print("[🎉] All processing finished successfully!")
    return True

def update_char_manager_frames(char_id, action, frames=8):
    """Ensure characterManager.js has frames: 8 for this action"""
    if not os.path.exists(SERVICES_CHAR_MGR):
        return
    with open(SERVICES_CHAR_MGR, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for action in gf_girl
    pattern = rf"({action}:\s*\{{[^}}]*?frames:\s*)\d+"
    if re.search(pattern, content):
        new_content = re.sub(pattern, rf"\g<1>{frames}", content)
        if new_content != content:
            with open(SERVICES_CHAR_MGR, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"[✓] Updated {SERVICES_CHAR_MGR}: {action} frames set to {frames}")

def find_candidate_image(action_name, char_id='gf_girl'):
    """Finds latest new image in gf_girl directory or Downloads"""
    gf_dir = os.path.join(CHARACTERS_DIR, char_id)
    # Check gf_dir for files other than the standard 11 files
    keep = {'avatar.png', 'idle.png', 'walk.png', 'sleep.png', 'knock_fish.png',
            'furious_fire.png', 'dragged.png', 'curious.png', 'rock_paper_scissors.png',
            'strip_8frames.png', 'original_sprite_strip.png'}
    candidates = []
    if os.path.exists(gf_dir):
        for f in os.listdir(gf_dir):
            if f not in keep and f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                candidates.append(os.path.join(gf_dir, f))
    if candidates:
        # Sort by mtime descending
        candidates.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        return candidates[0]
    
    # Otherwise check Downloads
    dl_dir = os.path.expanduser('~/Downloads')
    dl_files = glob.glob(os.path.join(dl_dir, '*.*'))
    dl_imgs = [p for p in dl_files if p.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    if dl_imgs:
        dl_imgs.sort(key=lambda p: os.path.getmtime(p), reverse=True)
        return dl_imgs[0]
        
    return None

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        print("Usage:")
        print("  python3 scripts/process_sprite.py <image_path> <action_name> [character_id]")
        print("  python3 scripts/process_sprite.py <action_name>  (auto-picks latest new image)")
        print("\nExamples:")
        print("  python3 scripts/process_sprite.py public/characters/gf_girl/new.png walk")
        print("  python3 scripts/process_sprite.py sleep")
        sys.exit(1)

    if len(args) == 1:
        action = args[0].lower()
        img_path = find_candidate_image(action)
        if not img_path:
            print(f"[Error] No candidate image found for action '{action}'!")
            sys.exit(1)
        process_sprite(img_path, action)
    else:
        img_path = args[0]
        action = args[1].lower()
        char_id = args[2] if len(args) > 2 else 'gf_girl'
        process_sprite(img_path, action, char_id)

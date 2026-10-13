#!/usr/bin/env python3
"""
macOS Native Event Hook for CyberPet using Quartz CGEventTap
Listens globally for Spacebar (keyCode 49) and calculates APM across a sliding 60-second window.
Outputs JSON lines to stdout for consumption by Electron main process.
"""

import sys
import time
import json
from collections import deque

try:
    import Quartz
    from AppKit import NSEvent
    QUARTZ_AVAILABLE = True
except Exception as e:
    QUARTZ_AVAILABLE = False
    print(json.dumps({"type": "error", "message": f"Quartz not loaded: {str(e)}"}), flush=True)

# Sliding window timestamps (seconds)
WINDOW_SECONDS = 60
cool_window_seconds = 30
key_timestamps = deque()

SPACE_KEYCODE = 49  # macOS standard virtual keycode for Spacebar

def calculate_apm():
    now = time.time()
    # Prune events older than 60 seconds
    while key_timestamps and now - key_timestamps[0] > WINDOW_SECONDS:
        key_timestamps.popleft()
    
    count = len(key_timestamps)
    # If active time is less than 60s, scale proportionally, or simple (count / 60) * 60 = count
    apm = int(count * (60.0 / WINDOW_SECONDS))
    return apm, count

def event_callback(proxy, event_type, event, refcon):
    global key_timestamps
    try:
        if event_type == Quartz.kCGEventKeyDown:
            now = time.time()
            key_timestamps.append(now)
            
            keycode = Quartz.CGEventGetIntegerValueField(event, Quartz.kCGKeyboardEventKeycode)
            is_space = (keycode == SPACE_KEYCODE)
            
            apm, total_keys = calculate_apm()
            
            data = {
                "type": "keydown",
                "is_space": is_space,
                "keycode": keycode,
                "apm": apm,
                "count_60s": total_keys,
                "timestamp": now
            }
            print(json.dumps(data), flush=True)
            
    except Exception as err:
        pass
        
    return event

def main():
    if not QUARTZ_AVAILABLE:
        print(json.dumps({"type": "status", "status": "no_quartz"}), flush=True)
        # Fallback heartbeat so process doesn't just die
        while True:
            time.sleep(1)
        return

    # Create event tap for KeyDown
    event_mask = (1 << Quartz.kCGEventKeyDown)
    tap = Quartz.CGEventTapCreate(
        Quartz.kCGSessionEventTap,
        Quartz.kCGHeadInsertEventTap,
        Quartz.kCGEventTapOptionListenOnly,
        event_mask,
        event_callback,
        None
    )

    if not tap:
        print(json.dumps({
            "type": "permission_needed",
            "message": "Accessibility permission required for global key tracking"
        }), flush=True)
        # Even without accessibility permissions, we report status
        while True:
            time.sleep(2)
            # Recheck permission attempt
            tap = Quartz.CGEventTapCreate(
                Quartz.kCGSessionEventTap,
                Quartz.kCGHeadInsertEventTap,
                Quartz.kCGEventTapOptionListenOnly,
                event_mask,
                event_callback,
                None
            )
            if tap:
                break
            else:
                continue

    print(json.dumps({"type": "ready", "message": "CGEventTap active"}), flush=True)
    run_loop_source = Quartz.CFMachPortCreateRunLoopSource(None, tap, 0)
    Quartz.CFRunLoopAddSource(
        Quartz.CFRunLoopGetCurrent(),
        run_loop_source,
        Quartz.kCFRunLoopCommonModes
    )
    Quartz.CGEventTapEnable(tap, True)
    Quartz.CFRunLoopRun()

if __name__ == "__main__":
    main()

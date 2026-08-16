import React, { useRef, useEffect } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useSpatial } from '../../context/SpatialContext';

// ===== CONFIG (tune here) =====
const PINCH_START_THRESHOLD = 0.09;    // distance to START pinch
const PINCH_RELEASE_THRESHOLD = 0.13;  // distance to RELEASE pinch (hysteresis)
const HOVER_RADIUS = 60;               // px - extra hit area around widget
const CURSOR_SMOOTH = 0.25;            // lerp factor (0 = frozen, 1 = raw)
const SCROLL_DEADZONE = 3;             // px - below this, no scroll
const SCROLL_SPEED = 3;               // multiplier
const SCROLL_HOLD_MS = 1500;           // ms to hold one finger before scroll activates
const OPEN_PALM_CONFIRM_MS = 600;      // ms to hold open palm before reset
const OPEN_PALM_COOLDOWN_MS = 2000;   // ms after reset before next reset
// ==============================

// STATE MACHINE STATES
const S = {
  IDLE:              'IDLE',
  POINTING:          'POINTING',
  SCROLLING:         'SCROLLING',
  PINCH_START:       'PINCH_START',
  GRABBING:          'GRABBING',
  RELEASING:         'RELEASING',
  PALM_CONFIRM:      'PALM_CONFIRM',
  PALM_COOLDOWN:     'PALM_COOLDOWN',
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getWidgetAtPoint(x, y, radiusPx = 0) {
  // Primary: element directly under cursor
  const el = document.elementFromPoint(x, y)?.closest('.react-grid-item');
  if (el && !el.classList.contains('react-grid-placeholder')) return el;

  if (radiusPx <= 0) return null;

  // Fallback: scan nearby items
  const items = Array.from(document.querySelectorAll('.react-grid-item:not(.react-grid-placeholder)'));
  let closest = null;
  let closestDist = Infinity;
  for (const item of items) {
    const r = item.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    // Expand rect by radius
    if (x >= r.left - radiusPx && x <= r.right + radiusPx &&
        y >= r.top - radiusPx && y <= r.bottom + radiusPx) {
      const dist = Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2));
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    }
  }
  return closest;
}

function dispatchMouse(type, x, y, target) {
  const ev = new MouseEvent(type, {
    view: window, bubbles: true, cancelable: true,
    clientX: x, clientY: y, screenX: x, screenY: y,
    buttons: type === 'mouseup' ? 0 : 1,
  });
  (target || document).dispatchEvent(ev);
}

export default function SpatialController() {
  const { isSpatialOn, setCameraActive, setHandDetected, cursor, setCursor, currentGesture, setCurrentGesture, resetLayouts, setIsSpatialOn } = useSpatial();

  const videoRef = useRef(null);
  const animRef = useRef(null);
  const landmarkerRef = useRef(null);

  // All mutable interaction state lives here - never causes re-renders
  const s = useRef({
    // State machine
    state: S.IDLE,
    
    // Smoothed cursor
    smoothX: window.innerWidth / 2,
    smoothY: window.innerHeight / 2,
    
    // Hover
    hoveredWidget: null,
    
    // Grab/Move
    grabbedWidget: null,
    
    // Scroll
    scrollPrevY: null,
    
    // Open palm
    palmStartTime: null,
    palmCooldownUntil: 0,
    
    // Pinch hysteresis
    isPinching: false,

    // Scroll hold timer
    scrollHoldStart: null,

    // 4-finger turn off timer
    fourFingerHoldStart: null,
    
    // Gesture label for UI
    gestureLabel: 'IDLE',
  });

  useEffect(() => { s.current.state_gesture = currentGesture; }, [currentGesture]);

  useEffect(() => {
    if (!isSpatialOn) {
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      setHandDetected(false);
      animRef.current && cancelAnimationFrame(animRef.current);
      return;
    }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }

        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO", numHands: 1,
          minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        });
        loop();
      } catch (e) { console.error("Spatial Camera Error:", e); }
    };

    let lastTime = -1;
    const loop = () => {
      const video = videoRef.current;
      if (!video || !landmarkerRef.current) return;
      
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        const results = landmarkerRef.current.detectForVideo(video, performance.now());
        processHand(results.landmarks?.[0] || null);
      }
      animRef.current = requestAnimationFrame(loop);
    };

    init();
    return () => {
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      animRef.current && cancelAnimationFrame(animRef.current);
      landmarkerRef.current?.close();
    };
  }, [isSpatialOn]);

  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  const processHand = (hand) => {
    const state = s.current;
    const cursorEl = document.getElementById('spatial-cursor-el');
    const labelEl = document.getElementById('spatial-label-el');

    if (!hand) {
      setHandDetected(false);
      // Release anything held
      if (state.grabbedWidget) {
        dispatchMouse('mouseup', state.smoothX, state.smoothY, document);
        state.grabbedWidget.classList.remove('spatial-grabbed');
        state.grabbedWidget = null;
      }
      if (state.hoveredWidget) {
        state.hoveredWidget.classList.remove('spatial-hover');
        state.hoveredWidget = null;
      }
      state.state = S.IDLE;
      state.isPinching = false;
      state.scrollPrevY = null;
      if (cursorEl) cursorEl.style.opacity = '0';
      return;
    }

    setHandDetected(true);
    if (cursorEl) cursorEl.style.opacity = '1';

    const index = hand[8], thumb = hand[4], middle = hand[12], ring = hand[16], pinky = hand[20], wrist = hand[0];

    // Raw screen coords (mirrored)
    const rawX = (1 - index.x) * window.innerWidth;
    const rawY = index.y * window.innerHeight;

    // Smooth cursor with lerp
    state.smoothX = lerp(state.smoothX, rawX, CURSOR_SMOOTH);
    state.smoothY = lerp(state.smoothY, rawY, CURSOR_SMOOTH);
    const sx = state.smoothX, sy = state.smoothY;

    // Update cursor DOM directly
    if (cursorEl) {
      cursorEl.style.left = `${sx}px`;
      cursorEl.style.top = `${sy}px`;
    }

    // --- Gesture Recognition ---
    const pinchDist = dist(thumb, index);
    const dI = dist(index, wrist);
    const dM = dist(middle, wrist);
    const dR = dist(ring, wrist);
    const dP = dist(pinky, wrist);

    // Pinch hysteresis
    if (!state.isPinching && pinchDist < PINCH_START_THRESHOLD) state.isPinching = true;
    if (state.isPinching && pinchDist > PINCH_RELEASE_THRESHOLD) state.isPinching = false;

    // Open palm detection (all fingers extended)
    const isOpenPalm = dI > 0.28 && dM > 0.28 && dR > 0.22 && dP > 0.22;
    
    // Two fingers (index + middle) → SCROLL
    const isTwoFingers = dI > 0.25 && dM > 0.22 && dR < 0.22 && dP < 0.22 && !state.isPinching;

    // One finger (only index) → EXIT / CANCEL
    const isOneFinger = dI > 0.25 && dM < 0.22 && dR < 0.22 && dP < 0.22 && !state.isPinching;

    // Four fingers (index+middle+ring+pinky, thumb curled) → TURN OFF
    const thumbDist = dist(thumb, wrist);
    const isFourFingers = dI > 0.25 && dM > 0.22 && dR > 0.20 && dP > 0.18 && thumbDist < 0.28 && !isOpenPalm;

    // --- Four Finger: Turn off Spatial (hold 0.8s) ---
    if (isFourFingers) {
      if (!state.fourFingerHoldStart) {
        state.fourFingerHoldStart = Date.now();
        if (labelEl) { labelEl.textContent = '4️⃣ HOLD...'; labelEl.style.color = '#94a3b8'; }
      } else if (Date.now() - state.fourFingerHoldStart >= 800) {
        state.fourFingerHoldStart = null;
        setIsSpatialOn(false);
        return;
      }
    } else {
      if (state.fourFingerHoldStart) {
        state.fourFingerHoldStart = null;
        if (labelEl) labelEl.textContent = '';
      }
    }

    // --- Open Palm Reset (priority first, checked any time) ---
    const now = Date.now();
    if (isOpenPalm && now > state.palmCooldownUntil) {
      if (!state.state.startsWith('PALM')) {
        state.palmStartTime = now;
        state.state = S.PALM_CONFIRM;
      } else if (state.state === S.PALM_CONFIRM) {
        if (now - state.palmStartTime >= OPEN_PALM_CONFIRM_MS) {
          // RESET!
          resetLayouts();
          state.palmCooldownUntil = now + OPEN_PALM_COOLDOWN_MS;
          state.state = S.PALM_COOLDOWN;
          if (labelEl) { labelEl.textContent = 'RESET'; labelEl.style.color = '#fb7185'; }
        }
      }
    } else if (!isOpenPalm && (state.state === S.PALM_CONFIRM || state.state === S.PALM_COOLDOWN)) {
      if (state.state === S.PALM_COOLDOWN && now > state.palmCooldownUntil) {
        state.state = S.IDLE;
      } else if (state.state === S.PALM_CONFIRM) {
        state.state = S.IDLE;
        state.palmStartTime = null;
      }
    }

    // Skip other processing during palm states
    if (state.state === S.PALM_CONFIRM || state.state === S.PALM_COOLDOWN) {
      if (labelEl) labelEl.textContent = state.state === S.PALM_COOLDOWN ? '' : '🖐️ HOLD...';
      return;
    }

    // --- STATE MACHINE ---
    switch (state.state) {

      case S.IDLE:
      case S.POINTING: {
        // Update hover widget
        const hovered = getWidgetAtPoint(sx, sy, HOVER_RADIUS);

        if (state.hoveredWidget && state.hoveredWidget !== hovered) {
          state.hoveredWidget.classList.remove('spatial-hover');
          state.hoveredWidget = null;
        }
        if (hovered && !state.hoveredWidget) {
          hovered.classList.add('spatial-hover');
          state.hoveredWidget = hovered;
        }

        if (state.isPinching && hovered) {
          // Pinch on widget → GRAB
          hovered.classList.remove('spatial-hover');
          hovered.classList.add('spatial-grabbed');
          state.grabbedWidget = hovered;
          state.hoveredWidget = null;
          dispatchMouse('mousedown', sx, sy, hovered);
          state.state = S.GRABBING;
          const labelEl = document.getElementById('spatial-label-el');
          if (labelEl) { labelEl.textContent = 'MOVE'; labelEl.style.color = '#818cf8'; }
        } else if (isTwoFingers) {
          // TWO FINGERS → scroll immediately
          state.state = S.SCROLLING;
          state.scrollPrevY = sy;
          state.scrollHoldStart = null;
          if (labelEl) { labelEl.textContent = 'SCROLL ✌️'; labelEl.style.color = '#fbbf24'; }
        } else if (isOneFinger) {
          // ONE FINGER → exit current state, go idle
          state.state = S.IDLE;
          state.scrollHoldStart = null;
          if (labelEl) labelEl.textContent = '';
        } else {
          state.state = S.IDLE;
          state.scrollHoldStart = null;
          if (labelEl) labelEl.textContent = '';
        }
        break;
      }

      case S.SCROLLING: {
        // ONE FINGER or pinch = exit scroll
        if (isOneFinger || state.isPinching || (!isTwoFingers && !isOpenPalm)) {
          state.state = S.IDLE;
          state.scrollPrevY = null;
          if (labelEl) labelEl.textContent = '';
          break;
        }
        if (state.scrollPrevY !== null) {
          const delta = state.scrollPrevY - sy;
          if (Math.abs(delta) > SCROLL_DEADZONE) {
            const container = document.querySelector('main.overflow-y-auto') 
              || document.querySelector('main') 
              || document.querySelector('.overflow-y-auto');
            if (container) {
              container.scrollTop += delta * SCROLL_SPEED;
            } else {
              window.scrollBy(0, delta * SCROLL_SPEED);
            }
          }
        }
        state.scrollPrevY = sy;
        break;
      }

      case S.GRABBING: {
        // Release only on: pinch released (hysteresis) OR explicit 1-finger cancel
        if (!state.isPinching || isOneFinger) {
          dispatchMouse('mouseup', sx, sy, document);
          if (state.grabbedWidget) {
            state.grabbedWidget.classList.remove('spatial-grabbed');
            state.grabbedWidget = null;
          }
          state.state = S.IDLE;
          const labelEl = document.getElementById('spatial-label-el');
          if (labelEl) labelEl.textContent = '';
          break;
        }
        // Continue drag
        dispatchMouse('mousemove', sx, sy, document);
        break;
      }

      default:
        state.state = S.IDLE;
    }
  };

  if (!isSpatialOn) return null;

  return (
    <>
      <style>{`
        .bg-\\[\\#131b2c\\] {
          background-color: rgba(19, 27, 44, 0.45) !important;
          backdrop-filter: blur(12px) !important;
        }
        .bg-\\[\\#0f172a\\], .bg-\\[\\#0f172a\\]\\/90 {
          background-color: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(12px) !important;
        }
        .bg-\\[\\#0a0f1c\\] { background-color: transparent !important; }
        .react-grid-item { transition: all 250ms ease !important; }
        .react-grid-item.resizing { transition: none !important; }
        .react-grid-item.react-draggable-dragging { transition: none !important; z-index: 100 !important; opacity: 0.9; }
        .react-grid-placeholder {
          background: rgba(99, 102, 241, 0.2) !important;
          border: 2px dashed rgba(99, 102, 241, 0.5) !important;
          border-radius: 12px;
        }
        .spatial-hover {
          outline: 2px solid rgba(129, 140, 248, 0.8) !important;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.35) !important;
          transform: translateY(-2px);
          transition: outline 80ms ease, box-shadow 80ms ease, transform 80ms ease !important;
        }
        .spatial-grabbed {
          outline: 2px solid rgba(165, 180, 252, 1) !important;
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6) !important;
          transform: translateY(-4px) scale(1.01);
          z-index: 101 !important;
          transition: none !important;
        }
      `}</style>

      {/* Camera background */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none bg-[#0a0f1c]">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline
          style={{ transform: 'scaleX(-1)', filter: 'blur(30px) brightness(0.55) saturate(0.35) opacity(0.75)' }}
        />
        <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply" />
      </div>

      {/* Spatial Cursor - DOM updated directly, no React re-render */}
      <div
        id="spatial-cursor-el"
        className="fixed pointer-events-none z-[10000]"
        style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)', opacity: 0, transition: 'opacity 200ms' }}
      >
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div className="w-6 h-6 rounded-full border-2 border-white/70 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          {/* Center dot */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_white]" />
          {/* Label */}
          <div
            id="spatial-label-el"
            className="absolute left-7 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-600/50 text-white"
          />
        </div>
      </div>
    </>
  );
}

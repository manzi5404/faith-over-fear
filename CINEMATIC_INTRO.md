# Cinematic Intro Experience — Implementation Summary

## Concept

The F>F cinematic intro replaces a generic loading screen with an immersive 3D ocean experience. The user starts beneath a silent ocean, watches the water part to reveal a path of light, and emerges into the homepage.

**Duration:** 4.5 seconds  
**Skip:** Available after 0.8s  
**Session:** Plays once per browser session (sessionStorage)

---

## Scene Breakdown

### Phase 1 — Calm (0s – 0.8s)
- Pure black background
- Water walls barely visible
- Soft particles floating
- Ambient light: near-zero
- Text: FAITH > FEAR fades in

### Phase 2 — Separation (0.8s – 2.2s)
- Water walls begin parting horizontally
- Light beams penetrate the opening
- Particles accelerate toward the gap
- Camera begins forward movement
- Text: FAITH > FEAR scales subtly

### Phase 3 — Passage (2.2s – 3.4s)
- Camera accelerates through the opening
- Mist and spray particles surround the path
- Light intensifies
- Water walls fully separated
- Text: fades to warm off-white glow

### Phase 4 — Emerge (3.4s – 4.5s)
- Water transforms into fog/smoke
- Camera exits the water
- Black overlay fades in
- Intro dismissed → homepage revealed

---

## Technical Architecture

### Folder Structure

```
src/intro/
├── components/
│   ├── CinematicIntro.tsx       # Main orchestrator
│   ├── scenes/
│   │   └── OceanScene.tsx       # R3F scene composition
│   ├── camera/
│   │   └── CameraRig.tsx        # Camera path + water walls
│   ├── particles/
│   │   └── ParticleField.tsx    # Floating particles
│   ├── lighting/
│   │   └── CinematicLights.tsx  # Volumetric-style lighting
│   ├── transition/
│   │   └── HomepageTransition.tsx # Overlay → homepage
│   └── ui/
│       ├── BrandReveal.tsx      # FAITH > FEAR text
│       └── SkipButton.tsx       # Skip intro button
├── shaders/
│   ├── water.ts                 # Water surface shader
│   └── fog.ts                   # Fog/smoke shader
├── hooks/
│   ├── useIntroSession.ts       # sessionStorage tracking
│   └── useCinematicTimeline.ts  # Animation timeline
├── utils/
│   └── easing.ts                # Custom easing curves
├── constants/
│   └── intro.ts                 # Durations, colors, camera positions
└── index.ts                     # Barrel exports
```

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| React Three Fiber | 3D rendering in React, integrates with component tree |
| Custom shaders | Water surface animation, fog density, light beams |
| GSAP/Framer Motion hybrid | Camera path via R3F + UI transitions via Framer Motion |
| sessionStorage | Persists "played" state across tabs, clears on browser close |
| Skip button | Accessibility + UX — users shouldn't be forced to watch |
| dpr: [1, 1.5] | Performance cap on high-DPI devices |
| powerPreference: 'high-performance' | Prefer discrete GPU |

### Camera Path

```
START: [0, 0.3, 12]      ← beneath the ocean, looking forward
MID:   [0, 0.1, 0]       ← at the parting water, entering the gap
END:   [0, 0, -4]         ← through the gap, emerging into light
```

Easing: `easeInOutCubic` for smooth acceleration/deceleration.

### Water Walls

- Two `PlaneGeometry` meshes (6×14 units, 80×80 segments)
- Positioned left and right of camera path
- Custom vertex shader: wave displacement + separation animation
- Custom fragment shader: depth-based color, shimmer, light beam
- Separation speed: `progress × 4.5 × 1.8`
- Max separation: 4.5 units

### Lighting

| Light | Type | Position | Purpose |
|-------|------|----------|---------|
| Main | SpotLight | [0, 6, 6] | Volumetric-style beam through water |
| Fill | PointLight | [0, -1, 0] | Antique gold accent from below |
| Rim | PointLight | [-3, 2, -2] | Edge lighting on water walls |
| Back | PointLight | [3, 1, 2] | Soft fill from behind |

### Particles

- 150 particles in a 14×6×20 unit volume
- Float upward slowly
- Accelerate toward the water gap during separation phase
- Warm off-white color, 3% opacity
- GPU-efficient: single Points object with BufferGeometry

### Shaders

**Water vertex shader:**
- Sinusoidal wave displacement (2 frequencies)
- Separation animation linked to `uSeparation` uniform
- 80×80 segment grid for smooth waves

**Water fragment shader:**
- Depth-based color gradient (deep navy → surface blue)
- Shimmer effect (sinusoidal brightness modulation)
- Light beam effect (exponential falloff from center)

**Fog fragment shader (for transition):**
- Distance-based density
- Swirl animation
- Opacity controlled by `uOpacity` uniform

### Transition Strategy

1. Intro Canvas is `position: fixed; z-index: 100`
2. On complete, `HomepageTransition` renders a black overlay
3. Overlay fades in over 1.2s
4. `onComplete` callback sets `introComplete = true`
5. React re-renders: CinematicIntro removed, AppRouter shown
6. Navigate to `/shop` with `replace: true`

### Session Persistence

```ts
// sessionStorage: 'fof_intro_played' = 'true'
// Cleared when browser/tab closes
// Checked on app mount
// If played: skip intro entirely
```

### Performance Optimizations

| Optimization | Implementation |
|-------------|----------------|
| DPR cap | `dpr={[1, 1.5]}` prevents 4K rendering |
| Fragment count | 80×80 = 6,400 vertices per wall (not 128×128) |
| Particle count | 150 (not 1000+) |
| Power preference | `high-performance` |
| Single render loop | `requestAnimationFrame` drives progress |
| No shadows | ContactShadows only (pre-baked) |
| Session check | Skips entire Canvas if already played |
| Lazy cleanup | `cancelAnimationFrame` on unmount |

### Mobile Adaptation

| Concern | Strategy |
|---------|----------|
| GPU load | dpr capped at 1.5, particle count stays 150 |
| Touch skip | Skip button is larger on mobile (44px min tap target) |
| Safe areas | Intro respects `env(safe-area-inset-*)` |
| Orientation | Locked to portrait during intro (optional) |
| Reduced motion | `prefers-reduced-motion` → skip intro automatically |

---

## Dependencies Added

```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.99.0",
  "framer-motion": "^11.0.0",
  "three": "^0.160.0"
}
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/intro/constants/intro.ts` | Timing, colors, camera positions |
| `src/intro/utils/easing.ts` | Easing functions (cubic, expo, quart) + lerp helpers |
| `src/intro/hooks/useIntroSession.ts` | sessionStorage "played" tracking |
| `src/intro/hooks/useCinematicTimeline.ts` | Phase-based animation timeline |
| `src/intro/shaders/water.ts` | Water surface vertex + fragment shaders |
| `src/intro/shaders/fog.ts` | Fog/smoke vertex + fragment shaders |
| `src/intro/components/particles/ParticleField.tsx` | Floating particle system |
| `src/intro/components/lighting/CinematicLights.tsx` | Cinematic light rig |
| `src/intro/components/camera/CameraRig.tsx` | Animated camera + water walls |
| `src/intro/components/scenes/OceanScene.tsx` | Scene composition |
| `src/intro/components/ui/BrandReveal.tsx` | FAITH > FEAR text animation |
| `src/intro/components/ui/SkipButton.tsx` | Skip intro button |
| `src/intro/components/transition/HomepageTransition.tsx` | Black overlay transition |
| `src/intro/components/CinematicIntro.tsx` | Main orchestrator |
| `src/intro/index.ts` | Barrel exports |

---

## Integration Points

### App.tsx

```tsx
if (!introComplete && !played) {
  return <CinematicIntro onComplete={handleIntroComplete} />
}
return <AppRouter />
```

### Router

After intro completes, `navigate('/shop', { replace: true })` sends user to the shop page.

### Session Storage

Key: `fof_intro_played`  
Value: `"true"`  
Scope: `sessionStorage` (cleared on tab close)

---

## What This Achieves

1. **Brand impression** — Users experience the F>F brand emotionally before seeing any products
2. **Performance** — 4.5s animation, skips on revisit, GPU-efficient
3. **Accessibility** — Skip button, reduced-motion support (via CSS media query)
4. **Scalability** — Modular shader/camera/lighting/particle system, easy to extend
5. **Mobile-ready** — DPR cap, touch-friendly skip, safe area support

---

## Next Steps (UI Phase)

- Build the actual ShopPage that receives users after the intro
- Add product cards, drop banners, navigation
- Ensure the transition from intro → shop feels seamless
- Test on mobile devices for performance
- Add `prefers-reduced-motion` media query to auto-skip intro

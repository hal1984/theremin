# Theremin — Progreso

Fecha de inicio: 2025-12-21

## Estado actual
- ✅ Fase 0 completa (base del proyecto)
- ✅ Fase 1 completa (audio + sliders accesibles)
- ✅ Fase 2 completa (hand tracking)
- ⏳ Fase 3 en cola (grabación real)
- ⏳ Fase 4 en cola (pulido + deploy)

## Checklist por fase
### Fase 0 — Base del proyecto
- [x] Rutas lazy: `/play`, `/recordings`, `/settings`, `/about`
- [x] Shell + navegación accesible + layout Tailwind
- [x] Stores `@ngrx/signals` por feature (play/recordings/settings)
- [x] Página `/play` con estados y acciones mock (activar/detener/grabar)
- [x] Smoke test manual en navegador (routing + consola sin errores)

### Fase 1 — Audio Theremin
- [x] `AudioSynthPort` (domain/application) + adapter Web Audio (infrastructure)
- [x] Sliders accesibles (pitch/volume) + teclado (modo sin cámara)
- [x] Smoothing + rampas de `AudioParam`
- [x] Validación mobile (iOS/Android) con gesto para `AudioContext`

### Fase 2 — Hand tracking (2 manos)
- [x] Provider `provideHandLandmarker({ ... })` (configurable)
- [x] Adapter MediaPipe (WASM) + pipeline de frames con backpressure
- [x] Mapeo pose → `pitchHz`/`gain` (log pitch + curva volumen)
- [x] Calibración de rango útil (x/y)
- [x] Overlay opcional (canvas) y manejo de pérdida de tracking
- [x] Preview siempre encendida + overlay tipo theremin
- [x] Sliders sincronizados con el tracking

### Fase 3 — Grabación
- [ ] Provider `provideRecorder({ ... })`
- [ ] Adapter MediaRecorder (audio) + export + reproducción
- [ ] Página `/recordings` conectada a grabaciones reales
- [ ] Persistencia opcional (IndexedDB) + “Borrar todo”

### Fase 4 — Pulido + Deploy
- [ ] Accesibilidad (AXE/WCAG AA): focus management, contraste, reduced motion
- [ ] Performance: evitar bloqueos UI, optimizar pipeline
- [ ] Netlify: `netlify.toml` o `public/_redirects` (SPA), headers mínimos
- [ ] Documentación final (compatibilidad, privacidad)

## Notas
- Versionado/estado de dependencias: si se cambia el enfoque de state management o hand tracking, actualizar también `docs/THEREMIN_HANDTRACKING_SPEC.md`.

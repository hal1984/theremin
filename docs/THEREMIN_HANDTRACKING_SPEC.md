# Theremin por webcam (2 manos) — Especificación + Arquitectura CLEAN (Angular)

## Resumen
Aplicación web **mobile-first** (PWA-ready) hecha en **Angular (standalone)** que:

- Reconoce **2 manos** por **webcam** (on-device, sin backend por defecto).
- Interpreta los gestos como un **Theremin** (pitch + volumen).
- Sintetiza audio en tiempo real con **Web Audio API** (baja latencia).
- Permite **grabar** lo que el usuario toca (audio; y opcionalmente “performance”/gestos).
- Mantiene una **arquitectura escalable** con enfoque **CLEAN Architecture** + **NgRx Signals**.
- Cumple **WCAG AA** y pasa **AXE**.

> Nota de plataforma: cámara y audio requieren **HTTPS** y un **gesto del usuario** para iniciar `AudioContext`. En mobile se requiere `playsinline`.

## Seguimiento de progreso
Checklist vivo en `docs/PROGRESS.md`.

---

## Objetivos de producto
### MVP (1ª versión utilizable)
- `/play`: tocar Theremin con tracking 2 manos + síntesis.
- `/recordings`: grabar, listar, reproducir y descargar grabaciones.
- `/settings`: calibración, sensibilidad y accesibilidad.
- Soporte mobile: UI responsive, orientación, fallback sin cámara.

### Éxito (KPIs cualitativos)
- “Suena estable”: sin pops/clicks, control suave.
- “Tracking usable”: señal estable y baja latencia perceptible.
- “Accesible”: usable con teclado/switch y sin cámara.

---

## Requisitos funcionales
### Tracking (2 manos)
- Captura de cámara (ideal: 720p@30fps; degradación adaptativa).
- Detección de **hasta 2 manos**, con landmarks y handedness (izq/der).
- Asignación configurable:
  - “Pitch hand” y “Volume hand” por handedness o por posición (izquierda/derecha en pantalla).
  - Opción **Swap manos**.
- Pérdida de tracking:
  - Si se pierde mano de volumen → volumen se lleva a 0 con rampa.
  - Si se pierde mano de pitch → mantener último pitch durante X ms o silenciar (configurable).

### Mapeo Theremin
- `pitch` continuo:
  - Por defecto: `x` (horizontal) del fingertip (índice) de la mano de pitch.
  - Rango configurable: `minHz`–`maxHz`.
  - Opción “Quantize”: cuantizar a escala (mayor, menor, pentatónica…) y/o a notas discretas.
- `volume` continuo:
  - Por defecto: `y` (vertical) del fingertip (índice) de la mano de volumen (inversión configurable).
  - Rango: `0..1` con curva (lineal / exponencial).
- Suavizado:
  - Filtro exponencial (EMA) a nivel de señal.
  - Rampas en `AudioParam` (`setTargetAtTime`/`linearRampToValueAtTime`) para evitar clicks.

Mapeo recomendado (perceptual-friendly):
- Pitch logarítmico (lineal en semitonos):
  - `hz = minHz * (maxHz / minHz) ^ x`
- Volumen con curva:
  - `gain = clamp01(y) ^ curve` (por ejemplo `curve=2` para más control fino)

Calibración (recomendado en mobile):
- “Calibrar” define un rango útil para `x/y` (por ejemplo con 2–3 posiciones guiadas).
- El mapeo usa `xNorm = (x - xMin) / (xMax - xMin)` y lo clampa a `0..1`.

### Síntesis de audio
- Audio engine con Web Audio:
  - Oscilador (sine por defecto; opcional: triangle/saw).
  - Master gain.
  - Opcional: filtro/chorus ligero (iteración posterior).
- Inicio/parada:
  - `AudioContext` se crea y `resume()` tras gesto del usuario (botón “Activar”).
  - Botón “Stop” pausa tracking y silencia el audio (sin cortar bruscamente).

### Grabación
- Audio:
  - Captura desde `MediaStreamAudioDestinationNode` + `MediaRecorder`.
  - Formato negociado por soporte (preferencia: `audio/webm;codecs=opus`).
  - Descarga local y reproducción.
- Metadatos:
  - Fecha/hora (derivada de un “time service”, no `new Date()` en plantillas).
  - Duración.
  - Ajustes usados (escala, min/max Hz, smoothing).
- Persistencia:
  - MVP: memoria + “Guardar” a IndexedDB (opcional según tiempo).

### Mobile (obligatorio)
- Layout responsive y controles táctiles grandes (mínimo 44×44px).
- Cámara:
  - `playsinline` en `<video>`.
  - Selector front/back (`facingMode`) si el dispositivo lo soporta.
  - Mirror del preview (front camera): **visual** (CSS) pero mantener mapeo consistente (no invertir pitch sin querer).
- Audio:
  - Manejar restricciones iOS (bloqueo en silencio; reanudación al volver al foreground).
- Fallback sin cámara:
  - “Modo accesible”: sliders/touch/teclado para pitch/volume + mismos módulos de síntesis/recording.

---

## Requisitos no funcionales
- Rendimiento:
  - Objetivo: 30 FPS tracking en dispositivos modernos; degradar a 15 FPS.
  - UI thread no debe bloquearse por inferencia (ideal: Web Worker).
- Calidad:
  - Sin “jank” perceptible al interactuar con la UI.
  - Sin fugas: liberar cámara, workers, `AudioContext` y tracks al salir.
- Privacidad:
  - Por defecto, **no se sube** vídeo/audio.
  - Política de privacidad en `/about`.

---

## Elección de tecnologías
### Hand tracking
Recomendación: **MediaPipe Tasks Vision — HandLandmarker (WASM)**.

- Corre on-device (sin backend).
- Detecta 1–2 manos con landmarks y handedness.
- Buen soporte en Chrome/Android y razonable en Safari moderno (validar).

Alternativas (iteración posterior):
- TensorFlow.js (más control; normalmente más pesado).

### UI / Estilos
Usar **Tailwind CSS** (ya integrado en el proyecto) para:
- Sistema de diseño consistente (spacing, tipografía, colores, estados).
- Responsividad rápida (mobile-first).
- Estados accesibles (focus-visible, reduced motion).

### Proveedores de librerías (Angular)
Para cada librería JS externa que usemos, crear un provider explícito “estilo Angular”:

- Patrón: `provide<LibraryName>({ /* config */ })` retornando `EnvironmentProviders`.
- Usar `InjectionToken` + factory para encapsular inicialización.
- Configuración en `app.config.ts` o en providers del feature (lazy).

Ejemplos (conceptuales):
- `provideHandLandmarker({ maxHands: 2, modelAssetPath: '...' })`
- `provideAudioContext({ sampleRate: 48000 })`
- `provideRecorder({ mimeType: 'audio/webm;codecs=opus' })`

Ventajas:
- Configuración centralizada.
- Fácil mockeo en tests (cuando se incluyan).
- Reemplazo sencillo por adaptadores alternativos.

### Estado (NgRx Signals)
Usar **@ngrx/signals** como state management:

- `signalStore` por feature (`play`, `recordings`, `settings`).
- `computed()` para estado derivado (pitchHz final, volumen, estado de permisos).
- `signalMethod` para efectos simples sin RxJS; `rxMethod` cuando haya cancelaciones/race conditions (p.ej., start/stop rápidos). (NgRx docs)

### Dependencias previstas (alto nivel)
- Vision:
  - `@mediapipe/tasks-vision` (HandLandmarker + WASM)
- State:
  - `@ngrx/signals` (SignalStore)
- Storage (opcional MVP):
  - `idb` o wrapper similar para IndexedDB

---

## Arquitectura CLEAN (escala + testabilidad)
### Principios aplicados
- **Dominio** independiente de frameworks: reglas de mapeo Theremin y modelos.
- **Aplicación** orquesta casos de uso (start/stop, grabar, calibrar).
- **Infraestructura** implementa adaptadores concretos (MediaPipe, Web Audio, MediaRecorder, IndexedDB).
- **Presentación** (Angular) consume casos de uso vía stores/facades y muestra UI accesible.

### Capas y dependencias (dirección única)
`presentation -> application -> domain`
`infrastructure -> application (ports)`

### “Ports & Adapters” (interfaces)
Definir “ports” (interfaces) en `domain`/`application` y sus implementaciones en `infrastructure`:

- `HandTrackingPort` (start/stop, stream de frames/poses).
- `AudioSynthPort` (start/stop, setPitch, setVolume, setWaveform).
- `RecordingPort` (start/stop, listado de clips, export).
- `StoragePort` (persistir settings y recordings).
- `TimePort` (para timestamps/format, evitando `new Date()` en templates).

En Angular, exponerlos como `InjectionToken`s e implementar con `inject()`.

---

## Estructura de carpetas propuesta (Angular)
Objetivo: separar capas sin forzar Nx; mantener simple.

```
src/app/
  core/
    di/                 # tokens + providers de infra
    routes/             # rutas raíz (lazy)
    ui/                 # layout, nav, shell
  domain/
    theremin/           # entidades + value objects + reglas
      models/
      mapping/
      validation/
    recording/
  application/
    play/               # casos de uso: start/stop/play session
    recordings/
    settings/
    ports/              # interfaces (ports)
  infrastructure/
    vision/             # mediapipe/hand-landmarker adapter
    audio/              # web audio adapter
    recording/          # media recorder adapter
    storage/            # indexeddb/localstorage adapter
  features/
    play/               # ruta lazy
      play.routes.ts
      play.page.ts
      ui/
      state/            # signalStore + selectors
    recordings/
    settings/
  shared/
    ui/                 # componentes presentacionales reutilizables
    util/
```

Reglas:
- **Componentes** pequeños, OnPush, sin lógica de negocio.
- **Stores** concentran la orquestación UI ↔ casos de uso.
- **Infra** no toca el DOM si se puede evitar; expone APIs puras.

---

## Rutas (lazy loading)
En `app.routes.ts`:
- `''` → redirect a `/play`
- `/play` (lazy)
- `/recordings` (lazy)
- `/settings` (lazy)
- `/about` (lazy)

Motivo: mantener bundle inicial mínimo (sobre todo MediaPipe y audio/recording).

---

## Modelo de dominio (Theremin)
### Value objects
- `NormalizedCoord` (0..1)
- `Hz` (number, validado)
- `Gain` (0..1)

### Entidades / modelos
- `HandPose` (landmarks normalizados + handedness + confidence)
- `ThereminConfig`:
  - `minHz`, `maxHz`
  - curva volumen (linear/expo)
  - `smoothingMs`
  - asignación de manos
  - cuantización/escala

### Reglas
- `mapPoseToThereminParams(pose, config) -> { pitchHz, gain }`
- `smooth(prev, next, dt, config)`
- `quantizeHz(hz, scaleConfig)`

---

## Estado por feature (NgRx Signals)
### `PlayStore` (idea)
Responsabilidades:
- Estado de permisos (cámara), estado engine (tracking/audio).
- Última pose (pitch/volume).
- Parámetros actuales (`pitchHz`, `gain`) + “raw” y “smoothed”.
- Errores (permiso denegado, sin cámara, modelo no cargó).

Patrón:
- `state` mínimo + `computed` para valores derivados.
- Métodos:
  - `requestCameraAndStart()`
  - `stop()`
  - `toggleRecording()`
  - `calibrate()` (captura baseline)
  - `setConfig(partial)`

Efectos:
- `signalMethod` para reacciones simples (ej. aplicar gain/pitch a audio cuando cambian).
- `rxMethod` si hay que cancelar operaciones async (ej. start/stop concurrentes).

### `RecordingsStore`
- Lista de clips, reproducción, borrado, export.
- Persistencia (opcional MVP): IndexedDB.

### `SettingsStore`
- Persistencia de config (localStorage/IndexedDB).
- Preferencias de accesibilidad (modo alto contraste, reduce motion).

---

## Infraestructura: adaptadores clave
### Vision adapter (MediaPipe)
Inputs:
- `MediaStream` (getUserMedia)
- `<video>` con `playsinline` y dimensiones conocidas

Outputs:
- Stream/eventos de `HandPose[]` con timestamp (monotónico si es posible).

Performance:
- “Frame loop” con `requestAnimationFrame`.
- Backpressure: si inferencia tarda > frame budget, saltar frames.
- Configurar número máximo de manos: 2.

### Audio adapter (Web Audio)
Graph recomendado:
`Oscillator -> VoiceGain -> MasterGain -> (AudioDestination + MediaStreamDestination)`

Detalles:
- `AudioContext` single-instance por sesión.
- Actualizaciones de `frequency` y `gain` con rampas.
- Limitar `gain` máximo y usar compresión ligera opcional (post-MVP).

### Recording adapter
- `MediaRecorder` sobre el stream de `MediaStreamDestination`.
- Fragmentar en chunks y reensamblar en `Blob`.
- Detectar soporte de `mimeType` al iniciar.
- Fallback (si MediaRecorder no soporta audio): iteración posterior (WAV encoder / OfflineAudioContext).

### Storage adapter
- `localStorage` para settings simples.
- `IndexedDB` para blobs de grabación (si se incluye en MVP).

---

## UI (presentación) — accesibilidad y controles
### Componentes clave (ejemplo)
- `PlayPageComponent` (container; conecta stores; sin lógica pesada)
  - `CameraPreviewComponent` (video + overlay canvas)
  - `ThereminControlsComponent` (sliders, waveform, start/stop)
  - `StatusBannerComponent` (errores, permisos, “mano no detectada”)
- `RecordingsPageComponent`
  - `RecordingListComponent`
  - `RecordingPlayerComponent`
- `SettingsPageComponent`

### Accesibilidad (WCAG AA + AXE)
- Todo control con `label`/`aria-label` correcto.
- Focus management:
  - Al abrir modal/alerta → foco al título o primer control.
  - Al cerrar → devuelve foco al elemento invocador.
- Estados:
  - `aria-live="polite"` para mensajes de estado.
  - `aria-live="assertive"` solo para errores críticos.
- Contraste AA y modo alto contraste.
- Soporte “prefers-reduced-motion”.
- No depender solo del color para indicar estado.

### Input alternativo
- Sliders siempre disponibles (modo sin cámara).
- Soporte teclado (sin handlers globales invasivos; configurable).

---

## Seguridad y privacidad
- Requerir HTTPS (Netlify lo provee).
- No enviar streams a servidores por defecto.
- Explicar claramente permisos y uso de cámara.
- Ofrecer botón “Borrar grabaciones” (si se persisten).

---

## Compatibilidad y degradación
- Si `getUserMedia` no está disponible → modo sliders + mensaje.
- Si `MediaRecorder` no soporta audio → permitir tocar pero desactivar grabación con explicación.
- Si el modelo no carga en un dispositivo → fallback sliders.

---

## Plan de implementación (sin unit tests por ahora)
### Fase 0 — Base del proyecto (1–2 sesiones)
1. Definir rutas lazy `/play`, `/recordings`, `/settings`, `/about`.
2. Crear stores con `@ngrx/signals` (estado + métodos + computed).
3. Crear UI mínima accesible (Start/Stop + sliders).

### Fase 1 — Audio Theremin (1–2 sesiones)
1. Implementar `AudioSynthPort` + adapter Web Audio.
2. Integración con sliders (pitch/volume) y smoothing + rampas.
3. Validar en mobile (iOS/Android).

### Fase 2 — Hand tracking (2–4 sesiones)
1. Adapter MediaPipe + pipeline de frames.
2. Mapeo pose → pitch/volume (dominio).
3. Calibración y swap manos.
4. Overlay opcional (canvas) para feedback.

### Fase 3 — Grabación (1–2 sesiones)
1. Adapter MediaRecorder + export.
2. Página `/recordings` con reproductor y descarga.
3. Persistencia opcional (IndexedDB) si encaja en el MVP.

### Fase 4 — Pulido (continuo)
- Accesibilidad (AXE), performance, mensajes de error, “modo sin cámara”.

---

## Deploy (Netlify) — preparación (lo haremos después)
Requisitos:
- Build command: `npm run build`
- Publish directory: `dist/theremin/browser`
- SPA routing:
  - Añadir regla Netlify `/* /index.html 200` (vía `public/_redirects` o `netlify.toml`)

### SSG / prerender con Angular en Netlify
Netlify soporta **contenido prerenderizado** por Angular (SSG-like) como hosting estático.

- En builds con prerender, el output suele ser `dist/<app>/browser` (donde está `index.html` y los assets).
- En ese caso, el `publish` de Netlify debe apuntar a `dist/<app>/browser` (no al parent).
- Si también se comporta como SPA para rutas client-side, mantener el rewrite `/* /index.html 200`.

Checklist:
- HTTPS OK (necesario para webcam).
- Headers recomendados: `Permissions-Policy` (cámara), `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` solo si se necesita (WASM/worker).

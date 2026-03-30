# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-30
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.

---

## ⚠️ REGLAS DE CÓDIGO — LEER ANTES DE ESCRIBIR UNA LÍNEA

Estas reglas son **no negociables** y aplican a cada cambio, por pequeño que sea.

### Separación estricta de responsabilidades

```
CSS  → solo en archivos css/
JS   → solo en archivos js/
HTML → solo en archivos html/ o index.html
```

**Nunca:**
- `style=` inline en HTML (excepto `display:none` para estado inicial controlado por JS)
- `style.cssText = '...'` en JS para construir elementos con estilos
- `innerHTML` con atributos `style=` dentro de JS
- Bloques `<style>` o `<script>` dentro de archivos HTML

**Siempre:**
- Si un elemento dinámico necesita estilos → crear la clase en el CSS correspondiente y asignar con `className` o `classList`
- Si el estado cambia → usar `classList.toggle('clase', condicion)` en vez de `style.opacity / style.pointerEvents`

### Reutilizar antes de crear

Antes de escribir cualquier clase CSS o componente nuevo, verificar si ya existe en:
- `global.css` — tokens, reset, animaciones globales, temas forzados, sec-group/sec-row/sec-row-toggle, toggles, chips, date picker, toasts, edit-field, bs-overlay, spacers, is-disabled, color picker
- `ajustes.css` — ajustes, perfil, hero card, wizard de equipo, inv-*, apr-*, acerca-*, notif-*, equipo-*, liga-*
- `wizard.css` — wizard de registro
- `nav.css` / `loader.css` / `login.css` — sus contextos específicos

**El sistema de componentes ya definido:**

| Componente | Clases base | Dónde está |
|---|---|---|
| Grupo de filas | `.sec-group` | `global.css` |
| Fila base | `.sec-row` | `global.css` |
| Fila de navegación (con ícono) | `.sec-row.sec-row--nav` | `global.css` + `ajustes.css` |
| Fila tappable | `.sec-row.sec-row-tappable` | `global.css` |
| Fila toggle | `.sec-row-toggle` | `global.css` |
| Ícono de color (settings) | `.sec-row-ico.ico-*` | `ajustes.css` |
| Label de sección | `.sec-label-header` | `global.css` |
| Nota informativa | `.sec-note` | `global.css` |
| Spacer | `.spacer` / `.spacer-lg` / `.spacer-32` | `global.css` |
| Estado deshabilitado | `.is-disabled` | `global.css` |
| Sin borde inferior | `.sec-row--no-border` | `global.css` |
| Toast | `.toast` + `mostrarToastGuardado(msg)` | `global.css` + `ui.js` |
| Bottom sheet editor | `.edit-field-overlay` / `.edit-field-sheet` | `global.css` |
| Modal confirmación (bottom sheet) | `.modal-confirm-overlay` / `.modal-confirm-sheet` | `ajustes.css` |
| Modal borrar perfil | `.dialog-borrar-overlay` / `.dialog-borrar-card` | `ajustes.css` |
| Modal cuenta borrada | `.modal-cuenta-borrada` | `ajustes.css` |
| Overlay fullscreen éxito | `.overlay-fullscreen-success` | `ajustes.css` |
| Wizard crear equipo | `.wiz-equipo-overlay` / `.wiz-equipo-header` / `.wiz-equipo-contenido` / `.wiz-equipo-footer` | `ajustes.css` |
| Botón primario | `.inv-btn.inv-btn-primary` | `ajustes.css` |
| Botón secundario | `.inv-btn.inv-btn-secondary` | `ajustes.css` |
| Botón ghost | `.inv-btn.inv-btn-ghost` | `ajustes.css` |
| Botón peligro | `.home-btn-delete` | `global.css` |
| Toggle switch | `.toggle-btn` / `.toggle-on` / `.toggle-off` | `global.css` |
| Chips selector | `.chip` / `.chip-active` / `.chip-inactive` | `global.css` |
| Item de equipo (Mi Liga) | `.equipo-item` / `.equipo-header` / `.equipo-nombre` / `.equipo-footer` | `ajustes.css` |
| Pantalla ya registrada | `.ya-registrada-screen` / `.ya-registrada-content` | `global.css` |
| Estado guardando | `.sec-val-saving` | `global.css` |
| Check en selector | `.edit-search-check` | `ajustes.css` |
| Color picker admin | `.color-picker-overlay` / `.color-picker-sheet` / `.color-swatch-btn` | `global.css` |
| Badge estado archivo | `.file-badge` / `.file-badge-ok` / `.file-badge-missing` | `ajustes.css` |

**Colores de íconos disponibles:** `ico-blue`, `ico-purple`, `ico-teal`, `ico-red`, `ico-orange`, `ico-yellow`, `ico-green`, `ico-gray`

### Clases de estado — siempre con classList

```js
// ✅ Correcto
el.classList.toggle('is-disabled', !activo);
el.classList.add('visible');
el.classList.add('equipo-nombre--activo');

// ❌ Incorrecto
el.style.opacity = '0.4';
el.style.pointerEvents = 'none';
el.style.fontWeight = '700';
```

---

## Cómo trabajar con Claude en este proyecto

### Entorno de trabajo
- **Editor**: VS Code
- **Terminal**: integrada en VS Code (Ctrl + `)
- **Flujo de deploy**: cambios en VS Code → `git add . && git commit -m "..." && git push` → Railway y GitHub Pages se actualizan automáticamente

### Cómo dar instrucciones de código — SIEMPRE así
Cuando hay que modificar cualquier archivo, Claude debe dar instrucciones en formato **buscar/reemplazar**, nunca pegar archivos enteros. El formato es:

**Buscar en `archivo.js`:**
```
[bloque exacto tal como aparece en el archivo]
```
**Reemplazar:**
```
[nuevo bloque]
```

- Usar **Replace** (no Replace All) salvo que se indique explícitamente
- Si hay múltiples cambios, numerarlos: Cambio 1, Cambio 2, etc.
- Nunca pegar el archivo completo — solo los bloques afectados
- Si Claude necesita ver el código actual, pedir solo el fragmento relevante

### Qué evitar
- No dar bloques de código sin contexto de dónde van
- No decir "agregá esto al final" sin especificar después de qué
- No hacer preguntas múltiples en un mismo mensaje — una cosa a la vez
- No explicar en detalle lo que ya funciona — ir directo a lo que falta
- No pedir confirmación innecesaria — si el cambio es claro, darlo directamente

### Cómo manejar archivos grandes
- Los archivos JS y HTML son largos — nunca pedirlos completos
- Si Claude necesita contexto, pedir: "Pegame el bloque de la función X"
- Víctor puede pegar fragmentos específicos cuando Claude los pida

### Optimización de uso de datos con Claude
El objetivo es maximizar el trabajo útil por sesión, especialmente en planes gratuitos.

**Al iniciar una sesión:**
- Adjuntar solo el schema (este archivo) — no adjuntar código salvo que Claude lo pida
- Describir el objetivo de la sesión en 1-2 líneas antes de cualquier otra cosa
- Si hay un bug específico, describir el síntoma exacto y en qué archivo/función ocurre

**Durante la sesión:**
- Claude debe pedir solo los fragmentos de código que necesita ver, no archivos completos
- Si Claude dice "mandame el archivo X", responder con solo la función o bloque relevante
- Confirmar cambios aplicados con "listo" o "hecho" — no re-pegar el código modificado
- Evitar preguntas abiertas como "¿qué más podemos mejorar?" — ir con objetivos concretos

**Al cerrar la sesión:**
- Pedir a Claude que actualice el schema antes de cerrar
- No hace falta adjuntar todos los archivos para actualizar el schema — Claude lo hace desde memoria de la sesión
- Guardar el schema actualizado antes de cerrar la conversación

**Qué NO hacer:**
- No adjuntar archivos completos para "que Claude tenga contexto" — es costoso y rara vez necesario
- No pedir revisiones generales de todo el código en cada sesión — ir por objetivos concretos
- No re-enviar archivos que Claude ya vio en la misma sesión

---

## Principios de diseño y animación — SIEMPRE respetar

Toda pantalla, modal, toast o elemento nuevo debe seguir estas reglas de animación.

### Entradas (aparecer)
```css
opacity: 0 → 1
transform: translateY(24px) → translateY(0)   /* pantallas completas y modales */
transform: scale(0.92) → scale(1)             /* modales tipo card */
transition: opacity 0.3–0.4s ease, transform 0.3–0.4s cubic-bezier(0.34,1.56,0.64,1)
```
- Usar `requestAnimationFrame(() => requestAnimationFrame(() => { ... }))` para garantizar que el browser pinte el estado inicial antes de animar
- Siempre usar `.classList.add('visible')` — nunca manipular `style.opacity` directamente

### Salidas (desaparecer)
```css
opacity: 1 → 0
transition: opacity 0.3s ease
setTimeout(() => el.remove(), 300)
```

### Modales y overlays
- Fondo: empieza en `rgba(0,0,0,0)` y llega a `rgba(0,0,0,0.6)` con `transition: background 0.25s ease` — via `.visible`
- Sheet interna: `translateY(100%)` → `translateY(0)` — via `.visible`

### Regla general
Cualquier elemento que aparece o desaparece necesita al menos `opacity` animada. Si flota sobre la UI (modal, sheet, toast), también necesita `transform`.

---

## Estado actual del proyecto (al 2026-03-30)

### Lo que ya está hecho ✅

#### PWA (frontend — GitHub Pages)
- Hosteada en `app.quindesvolcanicos.com`
- Login con Google (Google Identity Services)
- Sesión persistente con localStorage
- Wizard de registro con código de invitación
- Validación del código de invitación contra el backend antes de avanzar
- Perfil completo editable (tap-to-edit) con secciones: Estadísticas, Datos Generales, Datos Personales, Contacto, Salud y Emergencia, Estado y Rendimiento
- Subida de fotos con cropper (Cropper.js) — **compresión automática hasta 4MB antes del upload**
- Subida de archivos a Supabase Storage vía Railway
- Navegación por secciones con animaciones (slide)
- Instalación PWA con banner contextual por navegador/OS
- **Scrollbar nativa oculta** en `.app-scroll` (`scrollbar-width: none` + `::-webkit-scrollbar`)
- **Sección Ajustes completa** — pantalla principal (home temporal):
  - Mi perfil → `view-perfil`
  - Mi Liga → `view-liga` (solo Admin)
  - Código de invitación → `view-invitacion` (solo Admin)
  - Apariencia → tema (auto/claro/oscuro) + **color principal del equipo (solo Admin)**
  - Privacidad → visibilidad perfil, toggles por campo, eliminar cuenta
  - Notificaciones → push banner + toggles por categoría
  - Acerca de → versión, desarrollador, feedback, donaciones, términos
- **Vista Mi Liga** con lista de equipos, edición de nombres, crear equipo (wizard 3 pasos), eliminar equipo/liga

#### Sistema de colores dinámico ✅ (nuevo — sesión 2026-03-30)
El admin puede elegir un color primario para el equipo desde Apariencia. Todo el sistema de colores se deriva automáticamente en JS.

**Arquitectura:**
- Admin elige color → se guarda en `equipos.color_primario` (Supabase)
- `GET /usuario` devuelve `colorPrimario` en la respuesta
- `inicializarApp()` llama `aplicarColorPrimario(user.colorPrimario)` antes de renderizar
- JS deriva todos los tokens CSS automáticamente para dark y light mode

**Funciones en `ajustes.js`:**
- `hexToHsl(hex)` → convierte hex a [h, s, l]
- `hslToHex(h, s, l)` → convierte HSL a hex
- `aplicarColorPrimario(hex)` → deriva y setea todos los tokens CSS via `setProperty()`
- `aplicarTema(tema)` → re-llama `aplicarColorPrimario()` al cambiar dark/light para recalcular tokens
- `abrirColorPicker()` → abre sheet con 12 presets + picker personalizado, preview en vivo
- `seleccionarColorPreset(color)` → selecciona preset y previsualiza
- `cerrarColorPicker(e)` → cierra y revierte si cancela
- `guardarColorPrimario()` → llama `PUT /equipo/:id/color`, muestra spinner, toast al guardar

**Tokens CSS derivados (seteados por JS en `:root`):**
```
--accent, --accent2, --accent-dim
--accent-gradient-from, --accent-gradient-to
--bg, --card, --card2
--border, --border2, --border3
--chip-bg, --stat-bg, --section-hd, --header-bg
--text2, --text3, --text4, --label
--badge-ok-color, --badge-ok-bg, --badge-ok-border  ← complementario 120° del acento
--overlay-dark, --overlay-medium, --overlay-light   ← fijos, no dependen del color
```

**Tokens en CSS (`:root` inicial, antes de que JS cargue):**
- Solo los overlays y gradientes tienen valores default en CSS
- `--badge-ok-*` NO tienen default en CSS — solo los setea JS (fallback en `.file-badge-ok`)
- Temas forzados `html.theme-dark` / `html.theme-light` también tienen los tokens completos

**Color picker UI (`global.css`):**
- `.color-picker-overlay` / `.color-picker-sheet` — sheet bottom con animación slide
- `.color-picker-swatches` — grid 6 columnas de swatches circulares
- `.color-swatch-btn` / `.color-swatch-btn.selected` — swatch con borde y scale al seleccionar
- `.color-picker-custom` — fila de color personalizado con input hidden
- `.color-picker-footer` — botones cancelar/aplicar
- `.color-picker-saving` / `.color-picker-spinner` — estado de guardado

**Swatch en la fila de ajustes:**
- `.apr-color-swatch` en `ajustes.css` — círculo con `var(--accent)` que se actualiza al guardar

#### Limpieza de colores hardcodeados ✅ (nuevo — sesión 2026-03-30)
Todos los colores hardcodeados de `global.css`, `nav.css` y `ajustes.css` fueron reemplazados por variables CSS:

- `crop-handle`, `crop-hint`, `crop-btn-cancel`, `crop-btn-rotate` → usan `var(--border)`, `var(--text3)`, `var(--chip-bg)`, `var(--text2)`
- `crop-btn-confirm`, `btn-save` → usan `var(--accent-gradient-from/to)`
- `#modal-crop`, `#date-picker-modal` → usan `var(--overlay-dark/light)`
- `.bottom-nav` background y border → usan `var(--header-bg)` y `var(--border)`
- `.nav-item::before` (píldora activa) → usa `var(--chip-bg)`
- `.equipo-activo-badge` → usa `var(--accent)`
- `.equipo-btn-delete` border/background/icon → usan `var(--border)`, `var(--accent-dim)`, `var(--accent)`
- `.file-badge-ok` → usa `var(--badge-ok-*)` derivado del acento
- `.file-badge-missing` → usa `var(--accent-dim)` y `var(--border)`
- `.material-icons` override global eliminado — acotado solo a `.crop-btn-rotate .material-icons`

#### Transición de carga ✅ (parcialmente implementado — sesión 2026-03-30)
- `#loadingScreen` hace fade out con `.fadeout` → `opacity: 0`
- `#appContent` arranca con `opacity: 0` y hace fade in con `.visible`
- Color ya aplicado debajo del loader antes de que aparezca la app
- **⚠️ PENDIENTE**: animación iris (círculo que se expande desde el logo revelando el nuevo color) — no funciona aún, requiere revisión en próxima sesión

#### Limpieza de código completada (sesión 2026-03-29)
- Todo el CSS inline extraído a clases en los archivos CSS correspondientes
- `gasCallNoToken` eliminado — reemplazado por `gasCall` directo
- `habilitarChips()` eliminado — era código muerto
- `.pf-header` viejo eliminado de `global.css`
- `renderMiLiga()` completamente limpio — sin `style=` inline
- Toast unificado: una sola implementación con clase `.toast` en `global.css`

#### Arquitectura de archivos (estado actual)
```
quindes.github.io/
  css/
    global.css      ← variables/tokens, reset, animaciones, temas forzados,
                       sec-group/sec-row, toggles, chips, date picker, toast,
                       edit-field, bs-overlay, spacers, is-disabled,
                       ya-registrada-*, sec-val-saving, home-btn-*,
                       color-picker-*, apr-color-swatch, overlay-* vars
    nav.css         ← bottom nav (usa var(--header-bg), var(--border), var(--chip-bg))
    ajustes.css     ← ajustes, perfil, hero card, wizard equipo, inv-*, apr-*,
                       acerca-*, notif-*, equipo-*, liga-*, modal-confirm-*,
                       dialog-borrar-*, modal-cuenta-borrada, overlay-fullscreen-success,
                       wiz-equipo-*, edit-search-check, file-badge-*
    loader.css      ← derby loader, #loadingScreen con fade
    login.css       ← login y no encontrado
    wizard.css      ← wizard de registro
  js/
    core.js         ← config, globals, SW, derby loader, cargarParciales()
    api.js          ← apiCall, gasCall
    ui.js           ← loader, toast, multiselect, select, toggle, bottom sheet,
                       edit sheet, date picker, install banner
    auth.js         ← Google Auth, sesión, login screens, borrar perfil
    wizard.js       ← flujo de registro completo
    perfil.js       ← render, navegación, edición, fotos (compresión auto canvas),
                       archivos, init, transición fade loader→app
    ajustes.js      ← ajustes, privacidad, notificaciones, nav, mi liga, wizard equipo,
                       hexToHsl, hslToHex, aplicarColorPrimario, aplicarTema,
                       abrirColorPicker, guardarColorPrimario, setTheme
  html/
    login.html      ← loginScreen + noEncontradoScreen
    wizard.html     ← registroScreen completo
    nav.html        ← bottom nav
    modals.html     ← date picker + modal crop + color-picker-overlay
  index.html        ← head + loadingScreen (#iris-overlay dentro) + appContent + scripts
  sw.js             ← service worker (quindes-v12) — addAll reemplazado por Promise.allSettled
  manifest.json
```

#### Estructura de navegación
- `view-home` = Ajustes (home temporal)
- `view-perfil` = Mi Perfil con hero card + menú de secciones
- `view-estadisticas`, `view-generales`, `view-personales`, `view-contacto`, `view-salud`, `view-rendimiento` = secciones del perfil
- `view-liga` = Mi Liga (solo Admin)
- `view-invitacion`, `view-apariencia`, `view-privacidad`, `view-notificaciones`, `view-acerca` = secciones de ajustes
- `navegarSeccion(seccion)` → desde home
- `navegarDesdePerfilASeccion(seccion)` → desde view-perfil, setea `_vistaAnterior = 'perfil'`
- `volverHome()` → vuelve a `_vistaAnterior` o home

#### Backend Node.js (Railway)
- URL: `https://quindesgithubio-production.up.railway.app`
- Endpoints activos:
  - `GET /health`
  - `GET /usuario?email=xxx` → `{ found, id, authUserId, equipoId, ligaId, nombreDerby, rol, estadoMiembro, colorPrimario }`
  - `GET /perfil/:id` → perfil completo con stats
  - `PUT /perfil/:id` → actualizar perfil
  - `POST /registrar` → crear perfil
  - `DELETE /perfil/:id` → borrar perfil
  - `POST /archivo` → subir a Supabase Storage
  - `GET /codigo-invitacion?equipoId=xxx` → `{ codigo, usosActuales, usosMax, agotado }`
  - `POST /validar-codigo` → `{ valido, error? }`
  - `GET /liga/:ligaId` → `{ id, nombre, equipos: [...] }`
  - `PUT /liga/:ligaId/nombre`
  - `PUT /equipo/:equipoId/nombre`
  - `PUT /equipo/:equipoId/color` → `{ color }` — **nuevo**
  - `DELETE /equipo/:equipoId`
  - `DELETE /liga/:ligaId`
  - `POST /crear-equipo`

#### Supabase
- URL: `znprcowxveyzanpvotms.supabase.co`
- Schema v2: 13 tablas
- **Nuevo campo**: `equipos.color_primario` (text, default `#ef4444`, nullable)

#### Service Worker
- Versión actual: `quindes-v12`
- `addAll` reemplazado por `Promise.allSettled` — ya no bloquea si un archivo falla

---

### Pendientes 🔜

#### Animación iris al cargar ⚠️ (próxima sesión)
- Objetivo: círculo del color de acento que se expande desde el centro del logo cuando cambia el color durante la carga
- Velocidad deseada: 0.8s, `cubic-bezier(0.4,0,0.2,1)`
- El círculo es del **nuevo color de acento**
- Se intenta implementar pero no funcionó — retomar en próxima sesión
- Elemento `#iris-overlay` ya está en `index.html` dentro de `#loadingScreen`
- CSS parcial en `loader.css` con `#iris-overlay` y `.iris-expand`

#### Frontend — Sección Equipo (próxima a desarrollar)
- Vista `view-equipo` accesible desde la bottom nav
- Lista de jugadoras con foto, nombre derby, rol, estado
- Requiere endpoint `GET /equipo/:equipoId/miembros` en Railway

#### Personalización del equipo — Logo (pendiente)
- Admin podrá cambiar el logo del equipo desde Apariencia
- `cambiarLogoEquipo()` existe pero muestra toast "🚧 Próximamente"
- Cuando se implemente, el logo también cambiará durante la animación iris

#### Backend pendiente
- `GET /equipo/:equipoId/miembros` — necesario para sección Equipo
- `PUT /miembro/:id/aprobar` — flujo de aprobación admin
- `POST /crear-liga` — crear liga + equipo + admin en un solo paso

#### Ajustes (placeholders activos)
- `cambiarLogoEquipo()` → toast "🚧 Próximamente"
- `solicitarPermisoPush()` → pide permiso pero no registra SW push subscription
- Privacidad → toggles solo en localStorage, no sincronizados con Supabase

#### Próximas secciones
- Equipo (lista de jugadoras) — PRÓXIMA
- Entrenamientos / Calendario
- Tareas y puntos
- Cuotas
- Presupuesto (admin)

---

## Credenciales y IDs importantes

```
SUPABASE_URL=https://znprcowxveyzanpvotms.supabase.co
LIGA_ID=35d870d8-bfad-4a9a-881a-32a3a8308378
EQUIPO_ID=03161fd2-3120-49f7-b165-27f23bcdae2d
VICTOR_AUTH_ID=b32d0923-dc31-4176-856b-2aa8a6ef04e6
VICTOR_PERFIL_ID=ebfccea3-a725-4d22-b9d3-af408a19a54d
RAILWAY_URL=https://quindesgithubio-production.up.railway.app
```
(Las API keys están en `/api/.env` en el repo local — nunca se suben a GitHub)

### Repo de GitHub
`https://github.com/quindesvolcanicosrd-sys/quindes.github.io`
- Frontend: raíz del repo
- Backend: carpeta `/api`

### Para retomar el desarrollo local
```bash
cd api
npm run dev
# → API corriendo en puerto 3000
```

---

## Arquitectura del sistema

```
[PWA - GitHub Pages - app.quindesvolcanicos.com]
      ↓ fetch
[Backend Node.js - Railway]
      ↓ supabase-js
[Supabase - PostgreSQL - znprcowxveyzanpvotms.supabase.co]

Jerarquía de datos:
Liga → Equipo(s) → Miembros → Perfiles
```

### Roles del sistema
| Rol en app (`rolApp`) | Equivale a |
|---|---|
| `Admin` | admin_equipo — acceso total |
| `SemiAdmin` | semiAdmin_equipo — acceso parcial |
| `Invitado` | jugadorx/coach/etc — solo su perfil |

---

## Schema de Supabase (v2)

| Tabla | Propósito |
|---|---|
| `ligas` | Nivel superior — agrupa equipos |
| `equipos` | Cada equipo dentro de una liga |
| `codigos_invitacion` | Códigos que genera el admin |
| `miembros` | Vincula usuarios con ligas/equipos y define su rol |
| `perfiles` | Datos personales y de derby |
| `lugares` | Lugares de entrenamiento con horarios |
| `entrenamientos` | Calendario de entrenamientos |
| `asistencias` | Log de asistencia |
| `tareas` | Tareas asignadas con puntos |
| `cuotas` | Pagos mensuales |
| `movimientos` | Ingresos y egresos |
| `puntos_resumen` | Puntos calculados por backend |
| `log_cambios` | Historial de ediciones |

### Columnas relevantes de `perfiles`
- `tipo_usuario` — text, default `'Invitado'`
- `foto_perfil_url` — URL pública en Supabase Storage

### Columnas relevantes de `equipos`
- `color_primario` — text, default `'#ef4444'`, nullable — **nuevo**

---

## Notas técnicas importantes

### Globals (core.js)
- `CONFIG.API_URL = 'https://quindesgithubio-production.up.railway.app'`
- `CURRENT_USER` — `{ id, email, rolApp, equipoId, ligaId, colorPrimario, ... }`
- `accessToken` — JWT de Google
- `wizOrigen` — `'login'` | `'noEncontrado'` | `null`
- `inviteCode` — leído de `?invite=` en la URL
- `edicionActiva` — estado de edición por sección
- `DERBY_MSGS` — array de mensajes del loader

### Funciones clave por archivo

**api.js**
- `apiCall(endpoint, method, body)` — fetch al backend
- `gasCall(action, data)` — wrapper semántico sobre apiCall

**auth.js**
- `initGoogleAuth()` — inicializa Google, maneja sesión guardada
- `onGoogleSignIn(response)` — callback de Google
- `cerrarSesion()` — limpia estado y vuelve al login
- `confirmarBorrarPerfil()` / `ejecutarBorrarPerfil()`
- `mostrarModalCuentaBorrada()`

**perfil.js**
- `inicializarApp(email)` — flujo principal post-login; llama `aplicarColorPrimario()` y maneja transición fade loader→app
- `renderTodo(profile)` — renderiza todos los campos
- `aplicarPermisos()` — muestra/oculta según `rolApp`
- `editarCampo(fieldKey, opciones)` — entry point tap-to-edit
- `navegarSeccion(seccion)` / `navegarDesdePerfilASeccion(seccion)` / `volverHome()`
- `CHIPS_OPTIONS` — config de campos con select/toggle/multiselect
- `CAMPOS_SECCION` — mapeo de campos a secciones
- `confirmarCrop()` — comprime imagen en canvas hasta 4MB antes de subir

**ui.js**
- `iniciarDerbyLoader()` / `detenerDerbyLoader()`
- `mostrarToastGuardado(msg)` — única implementación de toast, usa clase `.toast`
- `abrirBottomSheet(label, options, valorActual, onSelect)`
- `abrirEditSheet(fieldKey, opciones)`
- `abrirDatePicker(valorActual, onConfirm)` / `cerrarDatePicker()`
- `initDatePickerListeners()`
- `habilitarMultiSelect` / `habilitarSelect` / `habilitarToggle`
- `mostrarInstallBannerSiCorresponde()` / `detectarEntorno()`

**wizard.js**
- `mostrarRegistroWizard()` / `wizNext()` / `wizBack()`
- `submitRegistro()` — envía registro al backend
- `initRegistroListeners()`

**ajustes.js**
- `inicializarAjustes()` — sincroniza UI con localStorage al cargar
- `setTheme(tema)` / `aplicarTema(tema)` — re-aplica color primario al cambiar tema
- `hexToHsl(hex)` / `hslToHex(h,s,l)` — utilidades de conversión de color
- `aplicarColorPrimario(hex)` — deriva y setea todos los tokens CSS en `:root`
- `abrirColorPicker()` / `cerrarColorPicker()` / `guardarColorPrimario()`
- `seleccionarColorPreset(color)` / `actualizarSwatchesSeleccion(color)`
- `getPriv(key)` / `setPriv(key, val)` / `togglePrivacidad(key)` / `toggleSeccionPriv(seccion)`
- `navIr(seccion)` — navegación bottom nav
- `actualizarSeccionAdmin()` — oculta secciones admin para no-Admins
- `cargarMiLiga()` / `renderMiLiga(data)` — usa clases `.equipo-*`, sin inline styles
- `abrirEditSheetGenerico(label, valorActual, onGuardar)`
- `abrirCrearEquipo()` / `renderWizEquipoPaso(paso)`
- `mostrarModalConfirmacion({ emoji, titulo, mensaje, labelConfirmar, onConfirmar })`
- `sincronizarToggle(wrapperId, isOn)`
- `AJUSTES_KEY = 'quindes_ajustes'`
- `PRIV_DEFAULTS` — valores por defecto de privacidad
- `COLOR_PICKER_PRESETS` — array de 12 colores preset

---

## Campos que expone la API

Del perfil: `email`, `nombre`, `nombreDerby`, `numero`, `pronombres`, `rolJugadorx`,
`nombreCivil`, `cedulaPasaporte`, `pais`, `codigoPais`, `telefono`,
`fechaNacimiento`, `mostrarCumple`, `mostrarEdad`, `contactoEmergencia`,
`grupoSanguineo`, `alergias`, `dieta`, `aptoDeporte`, `pruebaFisica`,
`estado`, `asisteSemana`, `pagaCuota`, `tipoUsuario`, `fotoPerfil`,
`adjCedula`, `adjPruebaFisica`

De estadísticas: `puntosMes`, `puntosTrimestre`, `puntosAnio`,
`horasPatinadas`, `asistenciaAnual`, `labelMes`, `labelTrimestre`, `labelAnio`

De usuario: `found`, `id`, `authUserId`, `equipoId`, `ligaId`, `nombreDerby`, `rol`, `estadoMiembro`, `colorPrimario`

---

## Lógica de negocio clave

### Sistema de puntos
```
Puntos por mes = Asistencia + Tareas + Bono(asistencia seguida) + Pago cuota
Resultado:
  - "Puede jugar partidos"               → cumple mínimo asistencia Y tareas
  - "Faltan puntos: Tareas"              → asistencia OK, tareas NO
  - "Faltan puntos: Asistencia"          → tareas OK, asistencia NO
  - "Faltan puntos: Asistencia y Tareas" → nada cumple

Mínimos por frecuencia:
  - 1 vez/semana:    asistencia=3, tareas=5
  - 2 veces/semana:  asistencia=7, tareas=3
  - 3+ veces/semana: asistencia=8, tareas=3
  (x4 trimestre; x16 año)
```

### Sistema de cuotas
- $15/mes por jugadora activa
- Seguimiento mensual: pagado/no pagado/exento

### Sistema de colores dinámico
- 1 color primario hex → JS deriva todos los tokens para dark y light
- Color complementario para badge "ok": `hOk = (h + 120) % 360`
- Guardado en `equipos.color_primario` en Supabase
- Aplicado en `inicializarApp()` antes de renderizar la UI

### Notas de compatibilidad
- Express v4 (no v5 — v5 causaba crashes en Railway)
- `convertirFecha()` en backend convierte `DD/MM/YYYY` → `YYYY-MM-DD` antes de insertar en Supabase
- SW usa `Promise.allSettled` en install — no bloquea si un asset falla
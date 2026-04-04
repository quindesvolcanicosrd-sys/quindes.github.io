# Pivot App — Referencia de Schema para Supabase

⚠️ App renombrada de "Quindes Volcánicos" a Pivot — rebranding en proceso
Última actualización: 2026-04-03 (sesión 7)
Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.


## ⚠️ INSTRUCCIONES CRÍTICAS PARA CLAUDE — LEER ANTES DE CUALQUIER COSA

### Atención al contexto — NO dar vueltas en círculo
- Leer el schema COMPLETO antes de escribir una sola línea de código
- Antes de proponer una solución, verificar si ya existe algo en el código que la resuelva
- Si Víctor dice que algo no funciona o ya lo intentó, NO repetir la misma propuesta
- Si hay un error de sintaxis, pedirle a Víctor el fragmento exacto de las líneas afectadas ANTES de proponer un fix
- NO proponer soluciones que requieran múltiples archivos sin confirmar que Víctor tiene contexto de todos ellos
- Si algo falló varias veces, cambiar de enfoque — no insistir con la misma estrategia

### Formato de instrucciones de código — SIEMPRE así
Cuando hay que modificar cualquier archivo, Claude debe dar instrucciones en formato buscar/reemplazar, nunca pegar archivos enteros. El formato es:

Buscar en archivo.js:
[bloque exacto tal como aparece en el archivo]
Reemplazar:
[nuevo bloque]

- Usar Replace (no Replace All) salvo que se indique explícitamente
- Si hay múltiples cambios, numerarlos: Cambio 1, Cambio 2, etc.
- Nunca pegar el archivo completo — solo los bloques afectados
- Si Claude necesita ver el código actual, pedir solo el fragmento relevante
- NUNCA dar un buscar/reemplazar sin haber visto el fragmento exacto del archivo actual

### Qué evitar
- No dar bloques de código sin contexto de dónde van
- No decir "agregá esto al final" sin especificar después de qué
- No hacer preguntas múltiples en un mismo mensaje — una cosa a la vez
- No explicar en detalle lo que ya funciona — ir directo a lo que falta
- No pedir confirmación innecesaria — si el cambio es claro, darlo directamente
- No proponer soluciones que ya fallaron antes en la misma sesión
- No pedir archivos completos — pedir solo la función o bloque relevante


## ⚠️ REGLAS DE CÓDIGO — NO NEGOCIABLES

### Separación estricta de responsabilidades
- CSS → solo en archivos css/
- JS → solo en archivos js/
- HTML → solo en archivos html/ o index.html

Nunca:
- `style=` inline en HTML (excepto `display:none` para estado inicial controlado por JS)
- `style.cssText = '...'` en JS para construir elementos con estilos (excepción: `lanzarConfetti()` — valores aleatorios calculados en runtime)
- `innerHTML` con atributos `style=` dentro de JS
- Bloques `<style>` o `<script>` dentro de archivos HTML

Siempre:
- Si un elemento dinámico necesita estilos → crear la clase en el CSS correspondiente y asignar con `className` o `classList`
- Si el estado cambia → usar `classList.toggle('clase', condicion)` en vez de `style.opacity` / `style.pointerEvents`

### Reutilizar antes de crear
Antes de escribir cualquier clase CSS o componente nuevo, verificar si ya existe en:
- `global.css` — tokens, reset, animaciones globales, temas forzados, sec-group/sec-row/sec-row-toggle, toggles, chips, date picker, toasts, edit-field, bs-overlay, spacers, is-disabled, color picker
- `ajustes.css` — ajustes, perfil, hero card, wizard de equipo, inv-, apr-, acerca-, notif-, equipo-, liga-
- `wizard.css` — wizard de registro y liga (unificado desde sesión 6)
- `nav.css` / `loader.css` / `login.css` — sus contextos específicos

### Sistema de componentes ya definido

| Componente | Clases base | Dónde está |
|---|---|---|
| Grupo de filas | `.sec-group` | global.css |
| Fila base | `.sec-row` | global.css |
| Fila de navegación | `.sec-row.sec-row--nav` | global.css + ajustes.css |
| Fila tappable | `.sec-row.sec-row-tappable` | global.css |
| Fila toggle | `.sec-row-toggle` | global.css |
| Ícono de color | `.sec-row-ico.ico-*` | ajustes.css |
| Label de sección | `.sec-label-header` | global.css |
| Nota informativa | `.sec-note` | global.css |
| Spacer | `.spacer` / `.spacer-lg` / `.spacer-32` | global.css |
| Estado deshabilitado | `.is-disabled` | global.css |
| Sin borde inferior | `.sec-row--no-border` | global.css |
| Toast | `.toast` + `mostrarToastGuardado(msg)` | global.css + ui.js |
| Bottom sheet editor | `.edit-field-overlay` / `.edit-field-sheet` | global.css |
| Modal confirmación | `.modal-confirm-overlay` / `.modal-confirm-sheet` | wizard.css |
| Modal borrar perfil | `.dialog-borrar-overlay` / `.dialog-borrar-card` | ajustes.css |
| Modal cuenta borrada | `.modal-cuenta-borrada` | ajustes.css |
| Overlay fullscreen éxito | `.overlay-fullscreen-success` | wizard.css |
| Wizard crear equipo/liga | `.wiz-equipo-overlay` / `.wiz-equipo-header` / `.wiz-equipo-contenido` / `.wiz-equipo-footer` | wizard.css |
| Contenido de paso (wizard) | `.wiz-step-inner` / `.wiz-emoji` / `.wiz-title` / `.wiz-desc` / `.wiz-content` / `.wiz-actions` | wizard.css |
| Input de wizard | `.reg-input` / `.wiz-big-input` | wizard.css |
| Selector de wizard | `.reg-selector-btn` / `.reg-selector-val` | wizard.css |
| Fila teléfono | `.reg-phone-row` / `.reg-codigo-btn` / `.reg-tel-input` | wizard.css |
| Chips de wizard | `.wiz-chips` + `.chip` / `.chip-active` / `.chip-inactive` | wizard.css + global.css |
| Avatar subida imagen | `.wiz-liga-avatar` / `.wiz-liga-avatar-wrap` / `.wiz-liga-avatar-img` | wizard.css |
| Avatar perfil (registro) | `.reg-avatar` / `.reg-avatar-placeholder` / `.reg-avatar-overlay` | wizard.css |
| Nota opcional | `.reg-note` | wizard.css |
| Botón omitir | `.wiz-skip-btn` | wizard.css |
| Botón atrás wizard liga | `.wiz-eq-btn-back` | wizard.css |
| Botón primario wizard | `.wiz-btn-primary` | wizard.css |
| País autocomplete | `.wiz-pais-wrap` / `.wiz-pais-lista` / `.wiz-liga-pais-item` | wizard.css |
| Intro wizard liga | `.wiz-liga-intro-content` | wizard.css |
| Elemento oculto | `.wiz-hidden` (display:none !important) | wizard.css |
| textarea como input | `textarea.reg-input` | wizard.css |
| Google btn wrap | `.wiz-liga-google-wrap` | wizard.css |
| Botón primario | `.inv-btn.inv-btn-primary` | ajustes.css |
| Botón secundario | `.inv-btn.inv-btn-secondary` | ajustes.css |
| Botón ghost | `.inv-btn.inv-btn-ghost` | ajustes.css |
| Botón peligro | `.home-btn-delete` | global.css |
| Toggle switch | `.toggle-btn` / `.toggle-on` / `.toggle-off` | global.css |
| Item de equipo | `.equipo-item` / `.equipo-header` / `.equipo-nombre` / `.equipo-footer` | ajustes.css |
| Pantalla ya registrada | `.ya-registrada-screen` / `.ya-registrada-content` | global.css |
| Estado guardando | `.sec-val-saving` | global.css |
| Check en selector | `.edit-search-check` | ajustes.css |
| Color picker admin | `.color-picker-overlay` / `.color-picker-sheet` / `.color-swatch-btn` | global.css |
| Badge estado archivo | `.file-badge` / `.file-badge-ok` / `.file-badge-missing` | ajustes.css |
| Accordion contacto wizard | `.wiz-accordion-item` / `.wiz-accordion-header` / `.wiz-accordion-body` / `.wiz-acc-open` / `.wiz-acc-chevron` | wizard.css |
| Selector color wizard | `.wiz-color-presets` | wizard.css |
| Modal bienvenida | `.wiz-bienvenida-overlay` / `.wiz-bienvenida-sheet` / `.wiz-bienvenida-emoji` / `.wiz-bienvenida-title` / `.wiz-bienvenida-desc` / `.wiz-bienvenida-btn` | wizard.css |
| Animación contenido liga | `.wiz-liga-step` / `.wiz-liga-step--animated` | wizard.css |

Colores de íconos disponibles: `ico-blue`, `ico-purple`, `ico-teal`, `ico-red`, `ico-orange`, `ico-yellow`, `ico-green`, `ico-gray`


## Entorno de trabajo
- Editor: VS Code
- Terminal: integrada en VS Code (Ctrl + `)
- Flujo de deploy: cambios en VS Code → `git add . && git commit -m "..." && git push` → Railway y GitHub Pages se actualizan automáticamente


## Principios de diseño y animación — SIEMPRE respetar

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

### Nota sobre `.wiz-hidden`
- `.wiz-hidden { display: none !important }` — NO usar para animar visibilidad
- Para mostrar/ocultar con transición usar `max-height` + `opacity` + clase propia (ej: `.skip-visible`)
- `!important` puede ser necesario en la clase que revierte `.wiz-hidden` si hay conflicto de especificidad


---

## Estado actual del proyecto (al 2026-04-03 — sesión 7)

### ⚠️ Rebranding en proceso
- La app se llamaba **Quindes Volcánicos** → ahora se llama **Pivot**
- Los íconos ya fueron actualizados
- **Pendiente**: limpiar todas las referencias a "Quindes" en el código (strings, comentarios, URLs hardcodeadas, títulos HTML, manifest, sw.js, etc.)
- La URL del backend sigue siendo `quindesgithubio-production.up.railway.app` hasta que se migre

### Lo que ya está hecho ✅

#### PWA (frontend — GitHub Pages)
- Hosteada en `app.quindesvolcanicos.com` (URL pendiente de actualizar a Pivot)
- Login con Google (Google Identity Services)
- Sesión persistente con localStorage
- Wizard de registro con código de invitación
- Validación del código de invitación contra el backend antes de avanzar
- Perfil completo editable (tap-to-edit) con secciones: Estadísticas, Datos Generales, Datos Personales, Contacto, Salud y Emergencia, Estado y Rendimiento
- Subida de fotos con cropper (Cropper.js) — compresión automática hasta 4MB antes del upload
- Subida de archivos a Supabase Storage vía Railway
- Navegación por secciones con animaciones (slide)
- Instalación PWA con banner contextual por navegador/OS
- **Sección Ajustes completa** — pantalla principal (home temporal)
- **Vista Mi Liga** con lista de equipos, edición de nombres, crear equipo (wizard 3 pasos), eliminar equipo/liga

#### Wizard de liga — sesión 5 ✅ (rediseño completo)
- **20 pasos** (0-20), `_WIZ_LIGA_TOTAL = 20`
- Pasos 0-9: datos de liga y equipo
- Pasos 10-20: datos de perfil del admin
- `_wizLiga` incluye todos los campos de liga, equipo y perfil
- `wizLigaGoTo()` maneja animación slide entre pasos
- Animación de contenido via `.wiz-liga-step--animated`

#### Estandarización de wizards — sesión 6 ✅
- **CSS unificado**: todo en `wizard.css`, sin clases duplicadas ni CSS muerto
- **Clases unificadas** entre wizard de perfil y wizard de liga
- Header del wizard de liga tiene fade in al aparecer (desde `wizLigaIntroStart()`)

#### Wizard de liga — sesión 7 (en progreso ⚠️)
- **Templates migrados a `.wiz-step-inner`**: todos los templates (2-20) usan la misma estructura que el wizard de perfil: `.wiz-step-inner` > `.wiz-emoji` / `.wiz-title` / `.wiz-desc` / `.wiz-content` / `.wiz-actions`
- **Botones de acción dentro de cada template**: "Continuar" y "Omitir por ahora" en `.wiz-actions`, igual que wizard de perfil
- **Footer del wizard de liga**: solo contiene el botón "Atrás" (`wiz-eq-btn-back`)
- **`btnNext` eliminado** del footer y de `renderWizLigaPaso()` y `wizLigaSubmit()`
- **Pasos opcionales** (tienen "Omitir por ahora"): 3, 5, 6, 8, 9, 10, 12, 13, 14, 16, 19, 20
- **⚠️ PENDIENTE VERIFICAR**: que los botones "Omitir" y "Continuar" dentro de los templates se vean y funcionen correctamente — la sesión terminó antes de confirmar

#### auth.js — estado sesión 5
- `onGoogleSignIn` detecta `wiz-liga-overlay` y avanza al paso 2 si `_wizLigaPaso === 1`

---

### Pendientes 🔜

#### Wizard de liga — verificar en próxima sesión
- Confirmar que los botones dentro de `.wiz-actions` en los templates se renderizan correctamente
- Verificar que el paso 20 (último) llama `wizLigaSubmit()` correctamente desde su botón "Continuar"
- Verificar que el footer solo muestra "Atrás" y no interfiere visualmente con `.wiz-actions`

#### Rebranding a Pivot
- Limpiar todas las referencias a "Quindes" en: `index.html`, `manifest.json`, `sw.js`, `ajustes.js`, `auth.js`, `perfil.js`, `core.js`
- URLs de share/invitación en `ajustes.js` (`app.quindesvolcanicos.com`)
- `AJUSTES_KEY = 'quindes_ajustes'` → renombrar a `'pivot_ajustes'`
- Service worker: `quindes-v12` → `pivot-v1`

#### Frontend — Sección Equipo (próxima a desarrollar)
- Vista `view-equipo` accesible desde bottom nav
- Lista de jugadoras con foto, nombre derby, rol, estado
- Requiere endpoint `GET /equipo/:equipoId/miembros` en Railway

#### Backend pendiente
- `GET /equipo/:equipoId/miembros`
- `PUT /miembro/:id/aprobar` — flujo de aprobación admin

#### Personalización del equipo
- `cambiarLogoEquipo()` existe pero muestra toast "🚧 Próximamente"

#### Ajustes (placeholders activos)
- `solicitarPermisoPush()` → pide permiso pero no registra SW push subscription
- Privacidad → toggles solo en localStorage, no sincronizados con Supabase

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

---

## Arquitectura del sistema
```
[PWA - GitHub Pages - app.quindesvolcanicos.com]  ← URL pendiente de actualizar
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

### Tablas principales
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
- `color_primario` — text, default `'#ef4444'`, nullable

---

## Notas técnicas importantes

### Globals (core.js)
- `CONFIG.API_URL = 'https://quindesgithubio-production.up.railway.app'`
- `CURRENT_USER` — `{ id, email, rolApp, equipoId, ligaId, colorPrimario, ... }`
- `accessToken` — JWT de Google
- `wizOrigen` — `'login'` | `'noEncontrado'` | `'crearLiga'` | `null`
- `inviteCode` — leído de `?invite=` en la URL
- `edicionActiva` — estado de edición por sección
- `DERBY_MSGS` — array de mensajes del loader

### Funciones clave por archivo

**api.js**
- `apiCall(endpoint, method, body)` — fetch al backend
- `gasCall(action, data)` — wrapper semántico sobre apiCall

**auth.js**
- `initGoogleAuth()` — inicializa Google; si hay sesión guardada, llama `inicializarApp()` directamente
- `onGoogleSignIn(response)` — callback de Google; si `wiz-liga-overlay` está abierto y `_wizLigaPaso === 1`, llama `renderWizLigaPaso(2)`
- `cerrarSesion()` — limpia estado y vuelve al login
- `mostrarRegistroDesdeLogin()` — detecta si viene de `noEncontradoScreen` y setea `wizOrigen` correctamente
- `mostrarNoEncontrado(email)` — muestra pantalla cuenta no registrada
- `confirmarBorrarPerfil()` / `ejecutarBorrarPerfil()`
- `mostrarModalCuentaBorrada()`

**perfil.js**
- `inicializarApp(email)` — flujo principal post-login; aplica color, renderiza, luego fade loader→app
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

**wizard.js**
- `mostrarRegistroWizard()` — si `wizOrigen === 'crearLiga'`, salta intro y paso `inv`, arranca en paso 1
- `wizNext()` / `wizBack()`
- `wizBack()` — si `wizOrigen === 'crearLiga'` y `idx === 0` → cierra registroScreen y vuelve al último paso del wizard de liga
- `submitRegistro()` — si `wizOrigen === 'crearLiga'`, llama `/crear-liga` con `_wizLiga` + `regData`; si no, llama `/registrar`
- `initRegistroListeners()`
- `lanzarConfetti()` — usa `style.cssText` con valores aleatorios calculados en runtime (excepción aceptada a la regla de no inline)
- `mostrarBienvenida()` — modal post-registro, construido con DOM + clases CSS (sin innerHTML con estilos)
- `renderWizLigaPaso(paso)` — pasos 0-20; `_WIZ_LIGA_TOTAL = 20`; ya NO referencia `btnNext`
- `wizLigaPasoSiguiente()` — en paso 20 llama `wizLigaSubmit()`
- `wizLigaPasoAnterior()`
- `wizLigaSubmit()` — envía todo a `/crear-liga`; ya NO referencia `btnNext`
- `mostrarWizardLiga()` — crea overlay y arranca en paso 0
- `cerrarWizLiga()`
- `wizLigaGoTo(renderFn, forward)` — motor de animación slide del wizard de liga
- `wizLigaIntroStart()` — fade in de header y footer al salir de la intro
- `REG_PAISES`, `REG_CODIGOS`, `REG_PRONOMBRES`, `REG_ROLES`, `REG_ROLES_JUG`, `REG_ASISTENCIA` — constantes globales

**ajustes.js**
- `inicializarAjustes()` — sincroniza UI con localStorage al cargar
- `setTheme(tema)` / `aplicarTema(tema)`
- `hexToHsl(hex)` / `hslToHex(h,s,l)`
- `aplicarColorPrimario(hex, conFade)` / `_aplicarTokensColor(hex, h, s, l, root)`
- `abrirColorPicker()` / `cerrarColorPicker()` / `guardarColorPrimario()`
- `getPriv(key)` / `setPriv(key, val)` / `togglePrivacidad(key)` / `toggleSeccionPriv(seccion)`
- `navIr(seccion)`
- `actualizarSeccionAdmin()`
- `cargarMiLiga()` / `renderMiLiga(data)`
- `mostrarModalConfirmacion({ emoji, titulo, mensaje, labelConfirmar, onConfirmar })`
- `sincronizarToggle(wrapperId, isOn)`
- `AJUSTES_KEY = 'quindes_ajustes'` ← pendiente renombrar a `'pivot_ajustes'`
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

### Endpoints activos (backend Railway)
- `GET /health`
- `GET /usuario?email=xxx`
- `GET /perfil/:id`
- `PUT /perfil/:id`
- `POST /registrar` — crea perfil con código de invitación
- `DELETE /perfil/:id`
- `POST /archivo` — sube a Supabase Storage
- `GET /codigo-invitacion?equipoId=xxx`
- `POST /validar-codigo`
- `GET /liga/:ligaId`
- `PUT /liga/:ligaId/nombre`
- `PUT /equipo/:equipoId/nombre`
- `PUT /equipo/:equipoId/color`
- `DELETE /equipo/:equipoId`
- `DELETE /liga/:ligaId`
- `POST /crear-equipo`
- `POST /crear-liga` — crea liga + equipo + perfil Admin en un solo request

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
- Tokens usados en wizard: `var(--accent-gradient-from)` / `var(--accent-gradient-to)`

### Notas de compatibilidad
- Express v4 (no v5 — v5 causaba crashes en Railway)
- `convertirFecha()` en backend convierte DD/MM/YYYY → YYYY-MM-DD antes de insertar en Supabase
- SW usa `Promise.allSettled` en install — no bloquea si un asset falla
- optional chaining `?.` causa SyntaxError en algunos contextos — usar forma larga si hay problemas

---

## Estrategia de prefetch

### Ya implementado
- **Mi Liga** (`cargarMiLiga()`) — se llama en `inicializarAjustes()` para precargar datos de liga y equipos al abrir ajustes

### Pendiente de implementar
- **Código de invitación** (`cargarCodigoDesdeBackend()`) — ya se llama en `inicializarCodigoInvitacion()`, evaluar si prefetchear antes
- **Perfil del usuario** — ya disponible en `window.myProfile` post-login
- **Datos de estadísticas** — pendiente endpoint dedicado
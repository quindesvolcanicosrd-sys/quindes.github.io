# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-29
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
- `global.css` — tokens, reset, navegación, sec-group/sec-row, toggles, chips, date picker, toasts, modals
- `ajustes.css` — ajustes, perfil, hero card, badges, inv-*, apr-*, acerca-*, notif-*
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
| Spacer | `.spacer` / `.spacer-lg` | `global.css` |
| Estado deshabilitado | `.is-disabled` | `global.css` |
| Sin borde inferior | `.sec-row--no-border` | `global.css` |
| Toast | `.toast-guardado` + `mostrarToastGuardado(msg)` | `global.css` + `ui.js` |
| Bottom sheet editor | `.edit-field-overlay` / `.edit-field-sheet` | `global.css` |
| Modal confirmación | `.bs-overlay` / `.bs-panel` | `global.css` |
| Botón primario | `.inv-btn.inv-btn-primary` | `ajustes.css` |
| Botón secundario | `.inv-btn.inv-btn-secondary` | `ajustes.css` |
| Botón ghost | `.inv-btn.inv-btn-ghost` | `ajustes.css` |
| Botón peligro | `.home-btn-delete` | `global.css` |
| Toggle switch | `.toggle-btn` / `.toggle-on` / `.toggle-off` | `global.css` |
| Chips selector | `.chip` / `.chip-active` / `.chip-inactive` | `global.css` |
| Overlay fullscreen | — pendiente extraer del JS (ver pendientes) | — |

**Colores de íconos disponibles:** `ico-blue`, `ico-purple`, `ico-teal`, `ico-red`, `ico-orange`, `ico-yellow`, `ico-green`, `ico-gray`

### Clases de estado — siempre con classList

```js
// ✅ Correcto
el.classList.toggle('is-disabled', !activo);
el.classList.add('visible');

// ❌ Incorrecto
el.style.opacity = '0.4';
el.style.pointerEvents = 'none';
```

---

## Cómo trabajar con Claude en este proyecto

### Entorno de trabajo
- **Editor**: VS Code
- **Terminal**: integrada en VS Code (Ctrl + `)
- **Flujo de deploy**: cambios en VS Code → `git add . && git commit -m "..." && git push` → Railway y GitHub Pages se actualizan automáticamente
- Víctor es cómodo con el código pero prefiere instrucciones claras y directas, no explicaciones largas

### Cómo dar instrucciones de código — SIEMPRE así
Cuando hay que modificar cualquier archivo, Claude debe dar instrucciones en formato **buscar/reemplazar**, nunca pegar archivos enteros. El formato es:

**Buscá exactamente esto:**
```
[bloque exacto tal como aparece en el archivo]
```
**Reemplazá con:**
```
[nuevo bloque]
```

- Usar **Replace** (no Replace All) salvo que se indique explícitamente
- Si hay múltiples cambios, numerarlos: Cambio 1, Cambio 2, etc.
- Nunca pedir que se pegue el archivo completo — solo los bloques afectados
- Si Claude necesita ver el código actual para hacer un cambio, pedir solo el fragmento relevante, no el archivo entero

### Qué evitar
- No dar bloques de código sin contexto de dónde van
- No decir "agregá esto al final" sin especificar exactamente después de qué línea
- No hacer preguntas múltiples en un mismo mensaje — una cosa a la vez
- No explicar en detalle lo que ya funciona — ir directo a lo que falta
- No pedir confirmación innecesaria — si el cambio es claro, darlo directamente

### Cómo manejar archivos grandes
- Los archivos JS y HTML son largos — nunca pedirlos completos
- Si Claude necesita contexto, pedir: "Pegame el bloque de la función X" o "Pegame desde la línea que dice Y hasta Z"
- Víctor puede pegar fragmentos específicos cuando Claude los pida

### Tono y ritmo
- Respuestas cortas y directas
- Si algo no quedó claro o no funcionó, Víctor lo dice y Claude ajusta sin drama
- Claude puede hacer una pregunta de clarificación si genuinamente la necesita, pero no más de una por turno

---

## Principios de diseño y animación — SIEMPRE respetar

Toda pantalla, modal, toast o elemento nuevo debe seguir estas reglas de animación. **Nada debe aparecer abruptamente** — la app debe sentirse nativa, no como una página web.

### Entradas (aparecer)
```css
opacity: 0 → 1                          /* siempre */
transform: translateY(24px) → translateY(0)   /* pantallas completas y modales */
transform: scale(0.92) → scale(1)             /* modales tipo card */
transition: opacity 0.3–0.4s ease, transform 0.3–0.4s cubic-bezier(0.34,1.56,0.64,1)
```
- Usar `requestAnimationFrame(() => requestAnimationFrame(() => { ... }))` para garantizar que el browser pinte el estado inicial antes de animar

### Salidas (desaparecer)
```css
opacity: 1 → 0
transform: translateY(0) → translateY(-24px)  /* sale hacia arriba */
transition: opacity 0.3s ease, transform 0.3s ease
setTimeout(() => el.remove(), 300)            /* remover después de la transición */
```

### Navegación entre secciones
- Las secciones de la app usan slide horizontal (ya implementado en `navegarSeccion`)
- Al volver, la animación va en sentido contrario
- Nunca usar `display: block/none` sin transición

### Modales y overlays
- Fondo: `rgba(0,0,0,0)` → `rgba(0,0,0,0.6)` con `transition: background 0.25s ease`
- Card interna: `scale(0.88) translateY(16px)` → `scale(1) translateY(0)` con `cubic-bezier(0.34,1.56,0.64,1)`

### Toasts
- Entran desde abajo con `translateY(80px)` → `translateY(0)`
- Salen con fade out + `translateY(16px)`

### Regla general
Cualquier elemento que aparece o desaparece necesita al menos `opacity` animada. Si flota sobre la UI (modal, sheet, toast), también necesita `transform`.

---

## Estado actual del proyecto (al 2026-03-29)

### Lo que ya está hecho ✅

#### PWA (frontend — GitHub Pages)
- Hosteada en `app.quindesvolcanicos.com`
- Login con Google (Google Identity Services)
- Sesión persistente con localStorage
- Wizard de registro con código de invitación (paso `inv` antes del paso 1)
- Validación del código de invitación contra el backend antes de avanzar en el wizard
- Perfil completo editable (tap-to-edit) con secciones: Estadísticas, Datos Generales, Datos Personales, Contacto, Salud y Emergencia, Estado y Rendimiento
- Subida de fotos con cropper (Cropper.js), incluyendo foto en el wizard de registro
- Subida de archivos a Supabase Storage vía Railway
- Navegación por secciones con animaciones (slide)
- Instalación PWA con banner contextual por navegador/OS
- **Sección Ajustes completa** — es la pantalla principal (home temporal):
  - Mi perfil → lleva a `view-perfil`
  - **Mi Liga** → `view-liga` (solo Admin) — lista equipos, editar nombre de liga/equipo, crear equipo, eliminar equipo/liga
  - Código de invitación → ver/copiar/compartir código del equipo (solo visible para Admin)
  - Apariencia → tema (auto/claro/oscuro)
  - Privacidad → visibilidad perfil, email, teléfono, cumpleaños/edad, eliminar cuenta
  - Notificaciones → push banner + toggles por categoría
  - Acerca de → versión, desarrollador, feedback, donaciones, términos
- **Ajustes persisten en localStorage** bajo key `quindes_ajustes`
- `inicializarAjustes()` se llama desde `inicializarApp()` después de `aplicarPermisos()`
- **Bottom Nav implementada** — glass effect con backdrop-filter, pill animada al activar
- **Modal de cuenta borrada** — aparece con fade+scale in, desaparece con fade out, reemplaza el diálogo de confirmación
- **Vista Mi Liga implementada** (`view-liga`) con:
  - Nombre de liga editable (tap para editar)
  - Lista de equipos con código, usos y estado activo
  - Nombre de equipo editable por ítem
  - Botón eliminar equipo con modal de confirmación
  - Botón "Gestionar" para switchear equipo activo
  - Wizard de creación de equipo (3 pasos: nombre, categoría, logo)
  - Modal de confirmación genérico `mostrarModalConfirmacion()`
  - Pantalla "equipo creado" con código de invitación
  - Botón eliminar liga (con confirmación)
- **Limpieza de código completada (sesión 2026-03-29)**:
  - `index.html` sin inline styles (excepto `display:none` de estado inicial)
  - Familia `settings-*` completamente migrada a `sec-*` — no quedan clases `settings-` en el proyecto
  - Sistema unificado de clases: un solo lenguaje visual para toda la app
  - `ajustes.js`: estados de privacidad usan `classList.toggle('is-disabled')` en lugar de `style.opacity/pointerEvents`

#### Arquitectura de archivos (estado actual)
```
quindes.github.io/
  css/
    global.css      ← variables, reset, animaciones globales, temas forzados,
                       sec-group/sec-row/sec-row-toggle, toggles, chips, date picker,
                       toasts, edit-field, bs-overlay, spacers, is-disabled, sec-row--no-border
    nav.css         ← bottom nav
    ajustes.css     ← ajustes/perfil/hero card/wizard de equipo/inv-*/apr-*/acerca-*/notif-*
                       sec-row--nav, sec-row-ico, sec-note-icon, priv-bloque, liga-btn-*
    loader.css      ← estilos del derby loader
    login.css       ← estilos de login y no encontrado
    wizard.css      ← estilos del wizard de registro
  js/
    core.js         ← config, globals, SW, derby loader, cargarParciales()
    api.js          ← apiCall, gasCall, gasCallNoToken
    ui.js           ← componentes visuales: loader, toast, chips, selects,
                       bottom sheet, edit sheet, date picker, install banner
    auth.js         ← Google Auth, sesión, login screens, borrar perfil
    wizard.js       ← flujo de registro completo
    perfil.js       ← render, navegación, edición, fotos, archivos, init
    ajustes.js      ← ajustes, privacidad, notificaciones, nav, mi liga, wizard equipo
  html/
    login.html      ← loginScreen + noEncontradoScreen (parcial dinámico)
    wizard.html     ← registroScreen completo (parcial dinámico)
    nav.html        ← bottom nav (parcial dinámico, se inyecta en appContent)
    modals.html     ← date picker + modal crop (parcial dinámico)
  index.html        ← head + loadingScreen + appContent (todas las vistas) + scripts
  sw.js             ← service worker (quindes-v10)
  manifest.json
```

**Cómo funciona la carga de parciales:**
- `cargarParciales()` está en `core.js` y se llama desde el `DOMContentLoaded` de `perfil.js`
- Inyecta `login.html` y `wizard.html` después de `#loadingScreen`, `modals.html` al final del body, y `nav.html` dentro de `#appContent`
- Solo después de que los parciales cargan se inicializan los listeners (`initRegistroListeners`, `initDatePickerListeners`) y se carga el script de Google Auth

#### Estructura de navegación actual
- `view-home` = pantalla de **Ajustes** (home temporal)
- `view-perfil` = Mi Perfil con hero card + menú de secciones
- `view-estadisticas`, `view-generales`, `view-personales`, `view-contacto`, `view-salud`, `view-rendimiento` = secciones del perfil
- `view-liga` = Mi Liga (solo Admin) — equipos, wizard crear equipo
- `view-invitacion`, `view-apariencia`, `view-privacidad`, `view-notificaciones`, `view-acerca` = secciones de ajustes
- **Bottom nav** con 4 ítems: Ajustes, Equipo, Eventos, Tareas — función `navIr(seccion)` en `ajustes.js`
- La nav muestra la pill animada con `nav-active` y glass effect

#### Backend Node.js (Railway)
- URL: `https://quindesgithubio-production.up.railway.app`
- Express v4 (downgradeado desde v5 por incompatibilidades)
- Endpoints activos:
  - `GET /health` → status del servidor
  - `GET /usuario?email=xxx` → `{ found, id, authUserId, equipoId, ligaId, nombreDerby, rol, estadoMiembro }`
  - `GET /perfil/:id` → perfil completo con stats
  - `PUT /perfil/:id` → actualizar perfil
  - `POST /registrar` → crear perfil (valida `codigoInvitacion`, sube foto si viene en base64)
  - `DELETE /perfil/:id` → borrar perfil
  - `POST /archivo` → subir a Supabase Storage bucket `archivos`
  - `GET /codigo-invitacion?equipoId=xxx` → `{ codigo, usosActuales, usosMax, agotado }`
  - `POST /validar-codigo` → `{ valido, error? }` — valida código antes de avanzar en wizard
  - `GET /liga/:ligaId` → `{ id, nombre, equipos: [{ id, nombre, codigo, usosActuales, usosMax }] }`
  - `PUT /liga/:ligaId/nombre` → actualizar nombre de liga
  - `PUT /equipo/:equipoId/nombre` → actualizar nombre de equipo
  - `DELETE /equipo/:equipoId` → eliminar equipo y sus miembros
  - `DELETE /liga/:ligaId` → eliminar liga completa (todos sus datos)
  - `POST /crear-equipo` → `{ nombre, ligaId, categoria, logoBase64?, email }` → `{ ok, equipo }`

#### Supabase
- URL: `znprcowxveyzanpvotms.supabase.co`
- Schema v2: 13 tablas creadas y funcionando
- Tabla `perfiles` tiene columna `tipo_usuario` (text, default: 'Invitado')

#### Service Worker
- Versión actual: `quindes-v10`
- Cachea: `index.html`, todos los CSS en `css/`, todos los JS en `js/`, todos los HTML en `html/`, íconos y manifest

---

### Pendientes 🔜

#### Pendiente — Limpieza JS en progreso
Los siguientes elementos en `ajustes.js` todavía tienen CSS inline que hay que extraer a clases:
- `renderMiLiga()` — genera HTML de cada equipo con `style=` inline → clases pendientes: `.equipo-item`, `.equipo-header`, `.equipo-nombre`, `.equipo-activo-badge`, `.equipo-btn-delete`, `.equipo-footer`, `.equipo-codigo`, `.equipo-btn-gestionar`
- `abrirCrearEquipo()` — overlay fullscreen con `style.cssText` → clase pendiente: `.wiz-equipo-overlay`
- `mostrarEquipoCreado()` — pantalla fullscreen con `style.cssText` → clase pendiente: `.equipo-creado-screen`
- `mostrarModalConfirmacion()` — bottom sheet con `style.cssText` → ya existe `.bs-overlay`/`.bs-panel` en `global.css`, hay que migrar a esas clases
- `abrirEditSheetGenerico()` — el botón guardar usa `style=` inline → ya existe `.edit-field-save` en `global.css`
- `auth.js` — `confirmarBorrarPerfil()` construye modal con `style.cssText` → debe usar `mostrarModalConfirmacion()` de `ajustes.js`

#### Pendiente — Toast duplicado
Hay 3 implementaciones de toast en el proyecto:
- `mostrarToastGuardado()` en `ui.js` — usa `style.cssText` inline
- 2 instancias en `perfil.js` — también con `style.cssText` inline
- La clase `.toast-guardado` ya existe en `global.css` pero ninguna la usa

**Solución pendiente:** `mostrarToastGuardado()` debe crear el elemento, asignarle `className = 'toast-guardado'`, agregarlo al DOM, y usar `classList.add('visible')` para animarlo. Las instancias en `perfil.js` deben eliminarse y usar la función central.

#### Próximo a desarrollar — Onboarding desde login
- Pantalla de login con dos opciones: "Unirse a un equipo" y "Crear un equipo/liga"
- Wizard de creación de liga/equipo (nombre, logo, color, etc.)
- Flujo completo desde cero para nuevos admins

#### Próximo a desarrollar — Sección Equipo
- Vista `view-equipo` accesible desde la bottom nav
- Lista de jugadoras con foto, nombre derby, rol, estado
- Datos de cada jugadora según configuración de privacidad
- Requiere endpoint `GET /equipo/:equipoId/miembros` en Railway

#### Backend pendiente
- **`GET /equipo/:equipoId/miembros`** — no implementado, necesario para sección Equipo
- **`PUT /miembro/:id/aprobar`** — para flujo de aprobación admin
- **`POST /crear-liga`** — crear liga + equipo + admin en un solo paso

#### Frontend — Flujo de aprobación de nuevas jugadoras
Flujo completo acordado:
1. Admin crea código → manda link `?invite=CODIGO`
2. Usuario se registra → queda con `estado: 'pendiente'`
3. Admin ve lista de pendientes → aprueba o rechaza
4. Solo al aprobar puede acceder a funciones del equipo

Falta implementar:
1. En `inicializarApp`: verificar `estadoMiembro`. Si es `'pendiente'`, mostrar pantalla "Tu cuenta está en revisión"
2. Vista admin para listar pendientes
3. Endpoint `PUT /miembro/:id/aprobar`

#### Frontend — Ajustes (placeholders activos)
- `cambiarLogoEquipo()` y `abrirColorPicker()` → toast "🚧 Próximamente"
- `solicitarPermisoPush()` → pide permiso pero no registra SW push subscription
- Privacidad → toggles solo en localStorage, no sincronizados con Supabase

#### Próximas secciones a desarrollar
- **Equipo** (lista de jugadoras) — PRÓXIMA
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
- Frontend: raíz del repo (`index.html`, `css/`, `js/`, `html/`)
- Backend: carpeta `/api` (`index.js`, `package.json`, `.env`)

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
| `Admin` | admin_equipo — acceso total al equipo |
| `SemiAdmin` | semiAdmin_equipo — acceso parcial |
| `Invitado` | jugadorx/coach/etc — solo su perfil |

---

## Schema de Supabase (v2)

### 13 tablas

| Tabla | Propósito |
|---|---|
| `ligas` | Nivel superior — agrupa equipos |
| `equipos` | Cada equipo dentro de una liga |
| `codigos_invitacion` | Códigos que genera el admin para invitar jugadoras |
| `miembros` | Vincula usuarios con ligas/equipos y define su rol |
| `perfiles` | Datos personales y de derby de cada jugadora |
| `lugares` | Lugares de entrenamiento con horarios |
| `entrenamientos` | Calendario de entrenamientos |
| `asistencias` | Log de quién fue a qué entrenamiento |
| `tareas` | Tareas asignadas con puntos |
| `cuotas` | Pagos mensuales por jugadora |
| `movimientos` | Ingresos y egresos del equipo |
| `puntos_resumen` | Puntos calculados por backend |
| `log_cambios` | Historial de ediciones |

### Columnas relevantes de `perfiles`
- `tipo_usuario` — text, default `'Invitado'` (agregada 2026-03-28)
- `foto_perfil_url` — URL pública en Supabase Storage

---

## Notas técnicas importantes

### Globals y configuración (core.js)
- `CONFIG.API_URL = 'https://quindesgithubio-production.up.railway.app'`
- `CURRENT_USER` — objeto con `{ id, email, rolApp, equipoId, ligaId, ... }`
- `accessToken` — JWT de Google
- `wizOrigen` — `'login'` | `'noEncontrado'` | `null`
- `inviteCode` — leído de `?invite=` en la URL (también de `sessionStorage`)
- `edicionActiva` — objeto con estado de edición por sección
- `DERBY_MSGS` — array de mensajes del loader
- `cargarParciales()` — carga los 4 HTML parciales de `html/`

### Funciones clave por archivo

**api.js**
- `apiCall(endpoint, method, body)` — fetch al backend Railway
- `gasCall(action, data)` — wrapper semántico sobre apiCall
- `gasCallNoToken` — alias de gasCall

**auth.js**
- `initGoogleAuth()` — inicializa Google, maneja sesión guardada
- `onGoogleSignIn(response)` — callback de Google, guarda sesión
- `cerrarSesion()` — limpia estado y vuelve al login
- `confirmarBorrarPerfil()` / `ejecutarBorrarPerfil()` — flujo de borrado
- `mostrarModalCuentaBorrada()` — modal animado post-borrado con fade+scale in/out
- `wizStep0Volver()` — vuelve al login/noEncontrado desde el step-0 del wizard
- `wizIntroVolver()` — vuelve al login/noEncontrado desde la intro del wizard

**perfil.js**
- `inicializarApp(email)` — flujo principal post-login
- `renderTodo(profile)` — renderiza todos los campos del perfil
- `aplicarPermisos()` — muestra/oculta elementos según `rolApp`
- `editarCampo(fieldKey, opciones)` — entry point del tap-to-edit
- `navegarSeccion(seccion)` / `navegarDesdePerfilASeccion(seccion)` / `volverHome()`
- `pushSentinel()` — maneja el back gesture del navegador
- `configurarTodasLasSubidas()` — inicializa inputs de archivo
- `normalizarDriveUrl(url)` — convierte URL de Drive a lh3.googleusercontent.com
- `CHIPS_OPTIONS` — config de todos los campos con chips/select/toggle
- `CAMPOS_SECCION` — mapeo de campos a secciones

**ui.js**
- `iniciarDerbyLoader()` / `detenerDerbyLoader()`
- `mostrarToastGuardado(msg)` — ⚠️ pendiente migrar a usar `.toast-guardado` de global.css
- `abrirBottomSheet(label, options, valorActual, onSelect)`
- `abrirEditSheet(fieldKey, opciones)`
- `abrirDatePicker(valorActual, onConfirm)` / `cerrarDatePicker()`
- `initDatePickerListeners()` — se llama después de cargar modals.html
- `habilitarChips` / `habilitarMultiSelect` / `habilitarSelect` / `habilitarToggle`
- `mostrarInstallBannerSiCorresponde()` / `detectarEntorno()`
- `MESES` / `MESES_CORTO` — arrays de nombres de meses
- `dpState` — estado del date picker

**wizard.js**
- `mostrarRegistroWizard()` / `wizIntroStart()` / `async wizNext()` / `wizBack()`
- `wizStep0Volver()` / `wizIntroVolver()` — volver desde intro y step-0
- `submitRegistro()` — envía el registro al backend
- `initRegistroListeners()` — se llama después de cargar wizard.html
- `regData` — objeto con los datos del formulario de registro
- `WIZ_STEPS_BASE` / `wizStepSequence` / `wizStep`
- Validación del código de invitación con `/validar-codigo` antes de avanzar

**ajustes.js**
- `inicializarAjustes()` — sincroniza UI con localStorage al cargar
- `cargarAjustes()` / `guardarAjuste(key, val)`
- `setTheme(tema)` / `aplicarTema(tema)`
- `getPriv(key)` / `setPriv(key, val)` / `togglePrivacidad(key)` / `toggleSeccionPriv(seccion)`
- `actualizarVisibilidadSeccionesPrivacidad(perfilVisible)` — usa `classList.toggle('is-disabled')`
- `navIr(seccion)` — navegación de la bottom nav
- `actualizarSeccionAdmin()` — oculta secciones admin para no-Admins
- `cargarMiLiga()` / `renderMiLiga(data)` — carga y renderiza vista Mi Liga
- `abrirEditSheetGenerico(label, valorActual, onGuardar)` — sheet editor genérico
- `abrirCrearEquipo()` / `cerrarWizEquipo()` / `renderWizEquipoPaso(paso)` — wizard de equipo
- `mostrarModalConfirmacion({ emoji, titulo, mensaje, labelConfirmar, onConfirmar })` — modal genérico
- `sincronizarToggle(wrapperId, isOn)` — actualiza estado visual de un toggle
- `AJUSTES_KEY = 'quindes_ajustes'`
- `PRIV_DEFAULTS` — valores por defecto de privacidad
- `_ligaData` — cache local de datos de la liga

### Variables globales del wizard
```javascript
const _urlParams = new URLSearchParams(window.location.search);
let inviteCode = sessionStorage.getItem('quindes_invite') || null;
const WIZ_STEPS_BASE = ['inv',1,2,3,4,5,6,7,8,10,11];
```

### Notas de compatibilidad
- Express v4 (no v5 — v5 causaba crashes en Railway)
- `convertirFecha()` en backend convierte `DD/MM/YYYY` → `YYYY-MM-DD` antes de insertar en Supabase
- En el insert de `/registrar`, usar `convertirFecha(fechaNacimiento)` explícitamente

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

De usuario: `found`, `id`, `authUserId`, `equipoId`, `ligaId`, `nombreDerby`, `rol`, `estadoMiembro`

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
Pivot App — Referencia de Schema para Supabase

⚠️ App renombrada de "Quindes Volcánicos" a Pivot — rebranding en proceso
Última actualización: 2026-04-01 (sesión 5)
Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.


⚠️ INSTRUCCIONES CRÍTICAS PARA CLAUDE — LEER ANTES DE CUALQUIER COSA
Atención al contexto — NO dar vueltas en círculo

Leer el schema COMPLETO antes de escribir una sola línea de código
Antes de proponer una solución, verificar si ya existe algo en el código que la resuelva
Si Víctor dice que algo no funciona o ya lo intentó, NO repetir la misma propuesta
Si hay un error de sintaxis, pedirle a Víctor el fragmento exacto de las líneas afectadas ANTES de proponer un fix
NO proponer soluciones que requieran múltiples archivos sin confirmar que Víctor tiene contexto de todos ellos
Si algo falló varias veces, cambiar de enfoque — no insistir con la misma estrategia

Formato de instrucciones de código — SIEMPRE así
Cuando hay que modificar cualquier archivo, Claude debe dar instrucciones en formato buscar/reemplazar, nunca pegar archivos enteros. El formato es:
Buscar en archivo.js:
[bloque exacto tal como aparece en el archivo]
Reemplazar:
[nuevo bloque]

Usar Replace (no Replace All) salvo que se indique explícitamente
Si hay múltiples cambios, numerarlos: Cambio 1, Cambio 2, etc.
Nunca pegar el archivo completo — solo los bloques afectados
Si Claude necesita ver el código actual, pedir solo el fragmento relevante
NUNCA dar un buscar/reemplazar sin haber visto el fragmento exacto del archivo actual

Qué evitar

No dar bloques de código sin contexto de dónde van
No decir "agregá esto al final" sin especificar después de qué
No hacer preguntas múltiples en un mismo mensaje — una cosa a la vez
No explicar en detalle lo que ya funciona — ir directo a lo que falta
No pedir confirmación innecesaria — si el cambio es claro, darlo directamente
No proponer soluciones que ya fallaron antes en la misma sesión
No pedir archivos completos — pedir solo la función o bloque relevante


⚠️ REGLAS DE CÓDIGO — NO NEGOCIABLES
Separación estricta de responsabilidades
CSS  → solo en archivos css/
JS   → solo en archivos js/
HTML → solo en archivos html/ o index.html
Nunca:

style= inline en HTML (excepto display:none para estado inicial controlado por JS)
style.cssText = '...' en JS para construir elementos con estilos
innerHTML con atributos style= dentro de JS
Bloques <style> o <script> dentro de archivos HTML

Siempre:

Si un elemento dinámico necesita estilos → crear la clase en el CSS correspondiente y asignar con className o classList
Si el estado cambia → usar classList.toggle('clase', condicion) en vez de style.opacity / style.pointerEvents

Reutilizar antes de crear
Antes de escribir cualquier clase CSS o componente nuevo, verificar si ya existe en:

global.css — tokens, reset, animaciones globales, temas forzados, sec-group/sec-row/sec-row-toggle, toggles, chips, date picker, toasts, edit-field, bs-overlay, spacers, is-disabled, color picker
ajustes.css — ajustes, perfil, hero card, wizard de equipo, inv-, apr-, acerca-, notif-, equipo-, liga-
wizard.css — wizard de registro
nav.css / loader.css / login.css — sus contextos específicos

El sistema de componentes ya definido:
ComponenteClases baseDónde estáGrupo de filas.sec-groupglobal.cssFila base.sec-rowglobal.cssFila de navegación (con ícono).sec-row.sec-row--navglobal.css + ajustes.cssFila tappable.sec-row.sec-row-tappableglobal.cssFila toggle.sec-row-toggleglobal.cssÍcono de color (settings).sec-row-ico.ico-*ajustes.cssLabel de sección.sec-label-headerglobal.cssNota informativa.sec-noteglobal.cssSpacer.spacer / .spacer-lg / .spacer-32global.cssEstado deshabilitado.is-disabledglobal.cssSin borde inferior.sec-row--no-borderglobal.cssToast.toast + mostrarToastGuardado(msg)global.css + ui.jsBottom sheet editor.edit-field-overlay / .edit-field-sheetglobal.cssModal confirmación (bottom sheet).modal-confirm-overlay / .modal-confirm-sheetajustes.cssModal borrar perfil.dialog-borrar-overlay / .dialog-borrar-cardajustes.cssModal cuenta borrada.modal-cuenta-borradaajustes.cssOverlay fullscreen éxito.overlay-fullscreen-successajustes.cssWizard crear equipo/liga.wiz-equipo-overlay / .wiz-equipo-header / .wiz-equipo-contenido / .wiz-equipo-footerajustes.cssContenido de paso (wizard liga/equipo).wiz-emoji / .wiz-title / .wiz-desc / .wiz-contentwizard.css — reutilizarInput de wizard.reg-input / .wiz-big-inputwizard.css — reutilizarSelector de wizard.reg-selector-btn / .reg-selector-valwizard.css — reutilizarFila teléfono.reg-phone-row / .reg-codigo-btn / .reg-tel-inputwizard.css — reutilizarChips de wizard.wiz-chips + .chip / .chip-active / .chip-inactivewizard.css + global.cssAvatar subida imagen.wiz-liga-avatar / .wiz-liga-avatar-wrap / .wiz-liga-avatar-img / .wiz-liga-avatar-phajustes.cssNota opcional.reg-notewizard.css — reutilizarBotón omitir.wiz-skip-btnajustes.cssBotón omitir (wizard.css).wiz-btn-skipwizard.cssPaís autocomplete.wiz-pais-wrap / .wiz-pais-lista / .wiz-liga-pais-itemajustes.cssIntro wizard liga.wiz-liga-intro-contentajustes.css — reutiliza .wiz-intro-* de wizard.cssElemento oculto.wiz-hiddenajustes.csstextarea como inputtextarea.reg-inputajustes.cssGoogle btn wrap.wiz-liga-google-wrapajustes.cssBotón primario.inv-btn.inv-btn-primaryajustes.cssBotón secundario.inv-btn.inv-btn-secondaryajustes.cssBotón ghost.inv-btn.inv-btn-ghostajustes.cssBotón peligro.home-btn-deleteglobal.cssToggle switch.toggle-btn / .toggle-on / .toggle-offglobal.cssItem de equipo (Mi Liga).equipo-item / .equipo-header / .equipo-nombre / .equipo-footerajustes.cssPantalla ya registrada.ya-registrada-screen / .ya-registrada-contentglobal.cssEstado guardando.sec-val-savingglobal.cssCheck en selector.edit-search-checkajustes.cssColor picker admin.color-picker-overlay / .color-picker-sheet / .color-swatch-btnglobal.cssBadge estado archivo.file-badge / .file-badge-ok / .file-badge-missingajustes.cssAccordion contacto wizard.wiz-accordion-item / .wiz-accordion-header / .wiz-accordion-body / .wiz-acc-open / .wiz-acc-chevronajustes.cssSelector color wizard.wiz-color-presetsajustes.css
Colores de íconos disponibles: ico-blue, ico-purple, ico-teal, ico-red, ico-orange, ico-yellow, ico-green, ico-gray

Entorno de trabajo

Editor: VS Code
Terminal: integrada en VS Code (Ctrl + `)
Flujo de deploy: cambios en VS Code → git add . && git commit -m "..." && git push → Railway y GitHub Pages se actualizan automáticamente


Principios de diseño y animación — SIEMPRE respetar
Entradas (aparecer)
cssopacity: 0 → 1
transform: translateY(24px) → translateY(0)   /* pantallas completas y modales */
transform: scale(0.92) → scale(1)             /* modales tipo card */
transition: opacity 0.3–0.4s ease, transform 0.3–0.4s cubic-bezier(0.34,1.56,0.64,1)

Usar requestAnimationFrame(() => requestAnimationFrame(() => { ... })) para garantizar que el browser pinte el estado inicial antes de animar
Siempre usar .classList.add('visible') — nunca manipular style.opacity directamente

Salidas (desaparecer)
cssopacity: 1 → 0
transition: opacity 0.3s ease
setTimeout(() => el.remove(), 300)
```

### Modales y overlays
- Fondo: empieza en `rgba(0,0,0,0)` y llega a `rgba(0,0,0,0.6)` con `transition: background 0.25s ease` — via `.visible`
- Sheet interna: `translateY(100%)` → `translateY(0)` — via `.visible`

### Regla general
Cualquier elemento que aparece o desaparece necesita al menos `opacity` animada. Si flota sobre la UI (modal, sheet, toast), también necesita `transform`.

---

## Estado actual del proyecto (al 2026-04-01 — sesión 5)

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
- Subida de fotos con cropper (Cropper.js) — **compresión automática hasta 4MB antes del upload**
- Subida de archivos a Supabase Storage vía Railway
- Navegación por secciones con animaciones (slide)
- Instalación PWA con banner contextual por navegador/OS
- **Sección Ajustes completa** — pantalla principal (home temporal)
- **Vista Mi Liga** con lista de equipos, edición de nombres, crear equipo (wizard 3 pasos), eliminar equipo/liga

#### Wizard de liga — sesión 5 ✅ (rediseño completo)
- **9 pasos** (0-9), `_WIZ_LIGA_TOTAL = 9`
- Paso 0: intro animada "Creá tu liga" — siempre arranca acá
- Paso 1: login Google obligatorio — footer oculto, avanza automáticamente al 2 tras sign in
- Paso 2: nombre de liga
- Paso 3: logo de liga
- Paso 4: país + ciudad (selector de país → ciudades por país, con opción "mi ciudad no está")
- Paso 5: año de fundación + descripción
- Paso 6: contacto accordion (red social colapsable, WhatsApp colapsable, ambos opcionales)
- Paso 7: nombre de equipo
- Paso 8: categoría del equipo
- Paso 9: personalización — logo equipo + color de énfasis (preview en vivo vía `aplicarColorPrimario`)
- `_wizLiga` incluye: `contactoSocial`, `contactoTel`, `contactoCodigo`, `colorPrimario`
- `seleccionarColorWiz(color)` aplica color en vivo y lo guarda en `_wizLiga.colorPrimario`
- `onWizLigaPaisChange(pais)` actualiza ciudades dinámicamente
- `toggleWizAccordion(tipo)` maneja el accordion de contacto
- `abrirSelectorCodigoLiga()` abre bottom sheet de códigos de país
- `CIUDADES_POR_PAIS` — objeto con ~50 países y sus ciudades principales

#### auth.js — estado sesión 5
- `onGoogleSignIn` detecta `wiz-liga-overlay` y avanza al paso 2 si `_wizLigaPaso === 1`

#### ⚠️ BUG PENDIENTE — SyntaxError en ajustes.js línea 1558
- Error: `Unexpected token '}'` — causado por el Cambio 3 de sesión 5 (reemplazo de `renderWizLigaPaso`)
- **Fix pendiente**: ver fragmento alrededor de línea 1558 para identificar el `}` sobrante

---

#### Pendientes 🔜

#### Estandarización visual y migración de wizards (próxima sesión)

Migración de código:

la arquitectura objetivo queda así:

wizard.html — todo el HTML estático de los tres wizards (registro, liga, equipo) como partial, sin nada generado dinámicamente desde JS
wizard.js — motor compartido + lógica de los tres wizards, sin un solo innerHTML de estructura
wizard.css — todos los estilos de wizard unificados, sacando lo que hoy está mezclado en ajustes.css

A tener en cuenta: todo el HTML de los wizards está generado via innerHTML dentro de ajustes.js. Eso significa que por ahora no hay un wizard.html parcial real para liga/equipo.

Lo que va a pasar en cada archivo:
wizard.css — recibe todo lo de ajustes.css relacionado a wizards:

.wiz-equipo-overlay/header/contenido/footer/progress
.wiz-eq-* (close, paso-label, btn-back, btn-next, input, etc.)
.wiz-liga-step, .wiz-liga-intro-content, .wiz-liga-avatar*, .wiz-liga-google-wrap
.wiz-hidden, .wiz-skip-btn, .wiz-accordion-*, .wiz-color-presets
.wiz-pais-wrap/lista, .overlay-fullscreen-success, .modal-confirm-*
Las clases duplicadas en ajustes.css (.wiz-eq-* aparece dos veces) se unifican en una sola

ajustes.css — se eliminan todas esas clases
wizard.js — recibe desde ajustes.js:

Motor wizLigaGoTo() (unificado, sin duplicado)
mostrarWizardLiga(), cerrarWizLiga(), renderWizLigaPaso(), wizLigaPasoSiguiente/Anterior(), wizLigaSubmit()
abrirCrearEquipo(), cerrarWizEquipo(), renderWizEquipoPaso(), wizEquipoPasoSiguiente/Anterior(), crearEquipo()
Helpers: seleccionarCategoriaEquipo/LigaWiz(), previewLogo*(), onWizLigaPaisChange(), seleccionarColorWiz(), etc.
mostrarEquipoCreado(), mostrarModalConfirmacion(), confirmarEliminarEquipo/Liga(), eliminarEquipo/Liga()

ajustes.js — queda solo con los llamados de entrada y la lógica de negocio de ajustes
wizard.html — se van moviendo los innerHTML a HTML estático

Lo que ya esta hecho de la migración: 

Agregar al final de wizard.css todas las clases de wizard que hoy están en ajustes.css

Lo que  falta de la migración: 

Eliminar esas mismas clases de ajustes.css

Otros objetivos:
- Revisar y unificar transiciones entre pasos
- Unificar botón de Google entre todos los wizards 
- Objetivo: mismo look, feel y timing en todos los wizards de la app

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
- `REG_PAISES`, `REG_CODIGOS`, `REG_PRONOMBRES`, `REG_ROLES`, `REG_ROLES_JUG`, `REG_ASISTENCIA` — constantes globales usadas también por `ajustes.js`

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
- `mostrarWizardLiga()` — abre wizard; siempre arranca en paso 0
- `cerrarWizLiga()`
- `wizLigaIntroStart()` — limpia contenido y avanza a paso 1
- `renderWizLigaPaso(paso)` — pasos 0-9; `_WIZ_LIGA_TOTAL = 9`
- `wizLigaPasoSiguiente()` / `wizLigaPasoAnterior()`
- `onWizLigaPaisChange(pais)` — actualiza selector de ciudades
- `toggleWizAccordion(tipo)` — accordion de contacto (social/tel)
- `abrirSelectorCodigoLiga()` — bottom sheet de códigos de país
- `seleccionarColorWiz(color)` — aplica color en vivo y guarda en `_wizLiga.colorPrimario`
- `seleccionarCategoriaEquipo(cat)` / `seleccionarCategoriaLigaWiz(cat)` — usan `classList`
- `renderWizEquipoPaso(paso)` — pasos 1-3; usa clases de `wizard.css`
- `_wizLiga` — objeto global con datos de liga/equipo; incluye `contactoSocial`, `contactoTel`, `contactoCodigo`, `colorPrimario`
- `_WIZ_LIGA_TOTAL = 9`
- `CIUDADES_POR_PAIS` — objeto con ciudades por país
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
Sistema de cuotas

$15/mes por jugadora activa
Seguimiento mensual: pagado/no pagado/exento

Sistema de colores dinámico

1 color primario hex → JS deriva todos los tokens para dark y light
Color complementario para badge "ok": hOk = (h + 120) % 360
Guardado en equipos.color_primario en Supabase
Aplicado en inicializarApp() antes de renderizar la UI

Notas de compatibilidad

Express v4 (no v5 — v5 causaba crashes en Railway)
convertirFecha() en backend convierte DD/MM/YYYY → YYYY-MM-DD antes de insertar en Supabase
SW usa Promise.allSettled en install — no bloquea si un asset falla
optional chaining ?. causa SyntaxError en algunos contextos — usar forma larga si hay problemas


Estrategia de prefetch
Ya implementado

Mi Liga (cargarMiLiga()) — se llama en inicializarAjustes() para precargar datos de liga y equipos al abrir ajustes

Pendiente de implementar

Código de invitación (cargarCodigoDesdeBackend()) — ya se llama en inicializarCodigoInvitacion(), evaluar si prefetchear antes
Perfil del usuario — ya disponible en window.myProfile post-login
Datos de estadísticas — pendiente endpoint dedicado
# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-27
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.

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

## Estado actual del proyecto (al 2026-03-27)

### Lo que ya está hecho ✅

#### PWA (frontend — GitHub Pages)
- Hosteada en `app.quindesvolcanicos.com`
- Login con Google (Google Identity Services)
- Sesión persistente con localStorage
- Wizard de registro con código de invitación (paso `inv` antes del paso 1)
- Perfil completo editable (tap-to-edit) con secciones: Estadísticas, Datos Generales, Datos Personales, Contacto, Salud y Emergencia, Estado y Rendimiento
- Subida de fotos con cropper (Cropper.js)
- Subida de archivos a Supabase Storage vía Railway
- Navegación por secciones con animaciones (slide)
- Instalación PWA con banner contextual por navegador/OS
- **Sección Ajustes completa** — es la pantalla principal (home temporal):
  - Mi perfil → lleva a `view-perfil`
  - Código de invitación → ver/copiar/compartir código del equipo
  - Apariencia → tema (auto/claro/oscuro)
  - Privacidad → visibilidad perfil, email, teléfono, cumpleaños/edad, eliminar cuenta
  - Notificaciones → push banner + toggles por categoría
  - Acerca de → versión, desarrollador, feedback, donaciones, términos
- **Ajustes persisten en localStorage** bajo key `quindes_ajustes`
- `inicializarAjustes()` se llama desde `inicializarApp()` después de `aplicarPermisos()`
- **Bottom Nav implementada** — glass effect con backdrop-filter, pill animada al activar

#### Arquitectura de archivos (estado actual)
```
quindes.github.io/
  css/
    global.css      ← variables, reset, animaciones globales, temas forzados
    nav.css         ← bottom nav
    ajustes.css     ← estilos de ajustes/perfil/wizard
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
    ajustes.js      ← ajustes, privacidad, notificaciones, nav
  html/
    login.html      ← loginScreen + noEncontradoScreen (parcial dinámico)
    wizard.html     ← registroScreen completo (parcial dinámico)
    nav.html        ← bottom nav (parcial dinámico, se inyecta en appContent)
    modals.html     ← date picker + modal crop (parcial dinámico)
  index.html        ← head + loadingScreen + appContent (vistas) + scripts
  sw.js             ← service worker (quindes-v9)
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
- `view-invitacion`, `view-apariencia`, `view-privacidad`, `view-notificaciones`, `view-acerca` = secciones de ajustes
- **Bottom nav** con 4 ítems: Ajustes, Equipo, Eventos, Tareas — función `navIr(seccion)` en `ajustes.js`
- La nav muestra la pill animada con `nav-active` y glass effect

#### Backend Node.js (Railway)
- URL: `https://quindesgithubio-production.up.railway.app`
- Endpoints activos:
  - `GET /usuario?email=xxx` → `{ found, id, authUserId, equipoId, nombreDerby, rol, estadoMiembro }`
  - `GET /perfil/:id` → perfil completo con stats
  - `PUT /perfil/:id` → actualizar perfil
  - `POST /registrar` → crear perfil (valida `codigoInvitacion`)
  - `DELETE /perfil/:id` → borrar perfil
  - `POST /archivo` → subir a Supabase Storage bucket `archivos`

#### Supabase
- URL: `znprcowxveyzanpvotms.supabase.co`
- Schema v2: 13 tablas creadas y funcionando

#### Service Worker
- Versión actual: `quindes-v9`
- Cachea: `index.html`, todos los CSS en `css/`, todos los JS en `js/`, todos los HTML en `html/`, íconos y manifest

---

### Pendientes 🔜

#### Próximo a desarrollar — Sección Equipo
- Vista `view-equipo` accesible desde la bottom nav
- Lista de jugadoras con foto, nombre derby, rol, estado
- Datos de cada jugadora según configuración de privacidad
- Requiere endpoint `GET /equipo/:equipoId/miembros` en Railway

#### Backend
- **`GET /codigo-invitacion?equipoId=xxx`** — no implementado (cae silenciosamente al catch)
- **`GET /equipo/:equipoId/miembros`** — no implementado, necesario para sección Equipo
- **`PUT /miembro/:id/aprobar`** — para flujo de aprobación admin

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
cd "Documents\Trabajo\Personales\App Quinde\quindes.github.io\api"
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

---

## Notas técnicas importantes

### Globals y configuración (core.js)
- `CONFIG.API_URL = 'https://quindesgithubio-production.up.railway.app'`
- `CURRENT_USER` — objeto con `{ id, email, rolApp, equipoId, ... }`
- `accessToken` — JWT de Google
- `wizOrigen` — `'login'` | `'noEncontrado'` | `null`
- `inviteCode` — leído de `?invite=` en la URL
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
- `mostrarToastGuardado(msg)`
- `abrirBottomSheet(label, options, valorActual, onSelect)`
- `abrirEditSheet(fieldKey, opciones)`
- `abrirDatePicker(valorActual, onConfirm)` / `cerrarDatePicker()`
- `initDatePickerListeners()` — se llama después de cargar modals.html
- `habilitarChips` / `habilitarMultiSelect` / `habilitarSelect` / `habilitarToggle`
- `mostrarInstallBannerSiCorresponde()` / `detectarEntorno()`
- `MESES` / `MESES_CORTO` — arrays de nombres de meses
- `dpState` — estado del date picker

**wizard.js**
- `mostrarRegistroWizard()` / `wizIntroStart()` / `wizNext()` / `wizBack()`
- `submitRegistro()` — envía el registro al backend
- `initRegistroListeners()` — se llama después de cargar wizard.html
- `regData` — objeto con los datos del formulario de registro
- `WIZ_STEPS_BASE` / `wizStepSequence` / `wizStep`

**ajustes.js**
- `inicializarAjustes()` — sincroniza UI con localStorage al cargar
- `cargarAjustes()` / `guardarAjuste(key, val)`
- `setTheme(tema)` / `aplicarTema(tema)`
- `getPriv(key)` / `setPriv(key, val)` / `togglePrivacidad(key)`
- `navIr(seccion)` — navegación de la bottom nav
- `AJUSTES_KEY = 'quindes_ajustes'`
- `PRIV_DEFAULTS` — valores por defecto de privacidad

### Variables globales del wizard
```javascript
const _urlParams = new URLSearchParams(window.location.search);
let inviteCode = _urlParams.get('invite') || null;
const WIZ_STEPS_BASE = ['inv',1,2,3,4,5,6,7,8,10,11];
```

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

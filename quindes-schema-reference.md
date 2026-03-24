# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-22
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.

---

## Cómo trabajar con Claude en este proyecto

### Entorno de trabajo
- **Editor**: VS Code
- **Terminal**: integrada en VS Code (Ctrl + `)
- **Flujo de deploy**: cambios en VS Code → `git add . && git commit -m "..." && git push` → Railway y GitHub Pages se actualizan automáticamente
- Víctor es cómodo con el código pero prefiere instrucciones claras y directas, no explicaciones largas

### Cómo dar instrucciones de código — SIEMPRE así
Cuando hay que modificar `app.js`, `index.html`, `style.css` o cualquier archivo, Claude debe dar instrucciones en formato **buscar/reemplazar**, nunca pegar archivos enteros. El formato es:

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
- Los archivos `app.js`, `index.html` y `style.css` son largos — nunca pedirlos completos
- Si Claude necesita contexto, pedir: "Pegame el bloque de la función X" o "Pegame desde la línea que dice Y hasta Z"
- Víctor puede pegar fragmentos específicos cuando Claude los pida

### Tono y ritmo
- Respuestas cortas y directas
- Si algo no quedó claro o no funcionó, Víctor lo dice y Claude ajusta sin drama
- Claude puede hacer una pregunta de clarificación si genuinamente la necesita, pero no más de una por turno

---

## Estado actual del proyecto (al 2026-03-22)

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
    global.css    ← variables, reset, animaciones globales, temas forzados
    nav.css       ← bottom nav (vacío por ahora, styles están en style.css)
    ajustes.css   ← todos los estilos de ajustes/perfil/wizard
  js/
    core.js       ← vacío, para futuro
    ajustes.js    ← vacío, para futuro
  index.html
  app.js
  style.css       ← CSS COMPLETO activo (los archivos en css/ existen pero no están linkeados aún)
  sw.js
  manifest.json
```

**IMPORTANTE sobre la refactorización CSS:**
- Se intentó dividir `style.css` en `css/global.css` + `css/nav.css` + `css/ajustes.css`
- GitHub Pages cachea `style.css` agresivamente — al cambiar el link en `index.html` se rompió el estilo
- **Solución pendiente**: agregar los nuevos archivos como links ADICIONALES después de `style.css`, no reemplazarlo
- Por ahora todo el CSS está en `style.css` y funciona correctamente
- Los archivos en `css/` están listos con el contenido correcto pero no están activos
- Cuando se reactive: agregar `<link rel="stylesheet" href="css/nav.css">` etc. DESPUÉS de `style.css` en index.html

#### Estructura de navegación actual
- `view-home` = pantalla de **Ajustes** (home temporal)
- `view-perfil` = Mi Perfil con hero card + menú de secciones
- `view-estadisticas`, `view-generales`, `view-personales`, `view-contacto`, `view-salud`, `view-rendimiento` = secciones del perfil
- `view-invitacion`, `view-apariencia`, `view-privacidad`, `view-notificaciones`, `view-acerca` = secciones de ajustes
- **Bottom nav** con 4 ítems: Ajustes, Equipo, Eventos, Tareas — función `navIr(seccion)` en app.js
- La nav muestra la pill animada con `nav-active` y glass effect

#### Bottom Nav — CSS en style.css (al final)
```css
/* ══ BOTTOM NAV ══ */
.bottom-nav { position:fixed; bottom:0; left:0; right:0; z-index:200; height:64px; display:flex; ... }
.nav-item { flex:1; display:flex; flex-direction:column; align-items:center; ... }
.nav-item.nav-active { color: var(--accent); }
.nav-item.nav-active::before { opacity:1; animation: nav-pill-in ... }
@keyframes nav-pill-in { 0% { clip-path: circle(0%...) } 100% { clip-path: circle(100%...) } }
```

#### Bottom Nav — HTML en index.html (antes de `</div><!-- /appContent -->`)
```html
<nav class="bottom-nav" id="bottom-nav">
  <div class="nav-item nav-active" onclick="navIr('ajustes')" id="nav-ajustes">
    <span class="material-icons">settings</span>
    <span class="nav-item-label">Ajustes</span>
  </div>
  <div class="nav-item" onclick="navIr('equipo')" id="nav-equipo">
    <span class="material-icons">groups</span>
    <span class="nav-item-label">Equipo</span>
  </div>
  <div class="nav-item" onclick="navIr('eventos')" id="nav-eventos">
    <span class="material-icons">event</span>
    <span class="nav-item-label">Eventos</span>
  </div>
  <div class="nav-item" onclick="navIr('tareas')" id="nav-tareas">
    <span class="material-icons">task_alt</span>
    <span class="nav-item-label">Tareas</span>
  </div>
</nav>
```

#### Bottom Nav — JS en app.js
```javascript
let _navSeccionActual = 'ajustes';
function navIr(seccion) {
  if (_navSeccionActual === seccion) return;
  _navSeccionActual = seccion;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
  const navEl = document.getElementById('nav-' + seccion);
  if (navEl) { void navEl.offsetWidth; navEl.classList.add('nav-active'); }
  // TODO: mostrar sección correspondiente
}
```

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
- Limpieza menor en `inicializarAjustes()`: borrar líneas huérfanas de accesibilidad

#### Refactorización CSS (pausada)
- Archivos `css/global.css`, `css/nav.css`, `css/ajustes.css` ya existen con contenido correcto
- No están activos — todo sigue en `style.css`
- Para activar: agregar links adicionales en `index.html` DESPUÉS de `style.css` (no reemplazarlo)
- `sw.js` ya actualizado a `quindes-v8` con los nuevos paths de CSS incluidos

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
- Frontend: raíz del repo (`index.html`, `app.js`, `style.css`)
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

## Notas técnicas importantes (app.js)

- `CONFIG.API_URL = 'https://quindesgithubio-production.up.railway.app'`
- `gasCallNoToken` es alias de `gasCall`
- `aplicarPermisos()` usa `CURRENT_USER.rolApp` — valores: `'Admin'`, `'SemiAdmin'`, `'Invitado'`
- `mostrarToastGuardado(msg)` acepta mensaje opcional, default `'✅ Guardado'`
- `inicializarAjustes()` se llama después de `aplicarPermisos()` en `inicializarApp()`
- Fotos: `normalizarDriveUrl()` convierte URL de Drive a `lh3.googleusercontent.com/d/...=w500`
- Archivos van a Supabase Storage bucket `archivos` vía `POST /archivo`
- Modal "Borrar perfil" tiene animación de entrada (scale + fade)

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

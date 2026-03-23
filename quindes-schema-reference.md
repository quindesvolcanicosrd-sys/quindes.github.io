# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-22
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.

---

## Cómo trabajar con Claude en este proyecto

Esta sección es para que Claude entienda desde el primer mensaje cómo debe comportarse en este proyecto, evitando idas y vueltas innecesarias.

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
  - Mi perfil → lleva a `view-perfil` (hero card + menú de secciones del perfil)
  - Código de invitación → ver/copiar/compartir código del equipo
  - Apariencia → tema (auto/claro/oscuro), tamaño de texto, alto contraste, sección admin (logo + color del equipo)
  - Privacidad → visibilidad perfil, email, teléfono, cumpleaños/edad, eliminar cuenta
  - Notificaciones → push banner + toggles por categoría
  - Acerca de → versión, desarrollador, feedback, donaciones, términos
- **Ajustes persisten en localStorage** bajo key `quindes_ajustes`
- `inicializarAjustes()` se llama desde `inicializarApp()` después de `aplicarPermisos()`

#### Arquitectura de navegación actual
- `view-home` = pantalla de **Ajustes** (home temporal hasta que haya nav inferior)
- `view-perfil` = Mi Perfil con hero card + menú de secciones (llega desde Ajustes → Mi perfil)
- `view-estadisticas`, `view-generales`, `view-personales`, `view-contacto`, `view-salud`, `view-rendimiento` = secciones del perfil (llegan desde `view-perfil`, vuelven a `view-perfil` con `volverPerfil()`)
- `view-invitacion`, `view-apariencia`, `view-privacidad`, `view-notificaciones`, `view-acerca` = secciones de ajustes (llegan desde home/ajustes, vuelven al home con `volverHome()`)
- Función `volverPerfil()` agregada en app.js para volver a `view-perfil` desde las secciones del perfil
- **Futuro**: cuando haya otras secciones (entrenamientos, equipo, tareas, etc.), agregar barra de navegación inferior y Ajustes pasará a ser una pestaña más

#### Backend Node.js (Railway)
- URL: `https://quindesgithubio-production.up.railway.app`
- Endpoints activos:
  - `GET /usuario?email=xxx` → `{ found, id, authUserId, equipoId, nombreDerby, rol, estadoMiembro }`
  - `GET /perfil/:id` → perfil completo con stats
  - `PUT /perfil/:id` → actualizar perfil
  - `POST /registrar` → crear perfil (valida `codigoInvitacion` contra tabla `codigos_invitacion`)
  - `DELETE /perfil/:id` → borrar perfil
  - `POST /archivo` → subir a Supabase Storage bucket `archivos`
- Nota: `/usuario` devuelve `rol` (no `rolApp`). Se normaliza en el frontend: `{ ...user, rolApp: user.rol }`

#### Supabase
- URL: `znprcowxveyzanpvotms.supabase.co`
- Schema v2: 13 tablas creadas y funcionando
- `/registrar` crea perfil con `estado: 'pendiente'` en tabla `miembros`

---

### Pendientes 🔜

#### Backend
- **`GET /codigo-invitacion?equipoId=xxx`** — endpoint no implementado. La sección de Invitación lo llama pero cae silenciosamente al catch. Debe devolver `{ codigo }` para el equipo del usuario.
- **`PUT /miembro/:id/aprobar`** — para flujo de aprobación admin de usuarios pendientes

#### Frontend — Flujo de aprobación de nuevas jugadoras
**Decisión tomada**: se mantiene doble validación — el código de invitación permite entrar al wizard, pero el admin igual debe aprobar al usuario antes de que acceda a las funciones del equipo. Esto previene que un código filtrado dé acceso inmediato sin control.

Flujo completo acordado:
1. Admin crea código → manda link `?invite=CODIGO`
2. Usuario se registra con el wizard → queda con `estado: 'pendiente'` en `miembros`
3. Admin ve lista de pendientes en la app → aprueba o rechaza
4. Solo al aprobar el usuario puede acceder a funciones del equipo

Falta implementar:
1. En `inicializarApp`: verificar `estadoMiembro` después del login. Si es `'pendiente'`, mostrar pantalla "Tu cuenta está en revisión, el admin te habilitará pronto 🏥" en lugar de la app normal
2. Vista admin para listar pendientes con botón de aprobar/rechazar
3. Endpoint `PUT /miembro/:id/aprobar` en Railway

#### Frontend — Ajustes (placeholders activos)
- **Apariencia admin**: `cambiarLogoEquipo()` y `abrirColorPicker()` muestran toast "🚧 Próximamente"
- **Notificaciones push**: `solicitarPermisoPush()` pide permiso del navegador pero no registra Service Worker push subscription
- **Privacidad**: los toggles guardan en localStorage pero no se sincronizan con Supabase
- **Acerca de**: URLs de feedback/donaciones/términos son placeholders (`ko-fi.com`, `mailto:`, etc.)

#### Próximas secciones a desarrollar
- Entrenamientos / Calendario
- Tareas y puntos
- Equipo (lista de jugadoras)
- Cuotas
- Presupuesto (admin)
- Nav inferior con todas las secciones

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
# → Probar: http://localhost:3000/health
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

El backend devuelve `rol` en `/usuario`, el frontend lo normaliza como `rolApp`.

### Flujo de onboarding de nueva jugadorx
1. Recibe link con código de invitación (`?invite=CODIGO`)
2. Abre la app → wizard → paso `inv` carga el código automáticamente
3. Se autentica con Google
4. Completa el wizard (foto, nombre, pronombres, país, teléfono, fecha, derby, rol, salud, emergencia)
5. `POST /registrar` valida el código y crea el perfil con `estado: 'pendiente'`
6. Admin del equipo aprueba → `estado: 'activo'` (**pendiente de implementar**)

---

## Schema de Supabase (v2 — ejecutado)

### 13 tablas

| Tabla | Equivale a |
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
| `puntos_resumen` | Puntos calculados por backend (mensual/trimestral/anual) |
| `log_cambios` | Historial de ediciones |

El SQL completo está en `quindes-schema-v2.sql` en el repo.

### Tabla `codigos_invitacion` (campos relevantes)
```
codigo        — string único del equipo
activo        — boolean
expira_at     — timestamp (nullable)
usos_max      — integer (nullable)
usos_actuales — integer
```

---

## Notas técnicas importantes (app.js)

- `CONFIG.GAS_URL` eliminado — solo existe `CONFIG.API_URL = RAILWAY_URL`
- `gasCallNoToken` es alias de `gasCall`
- `aplicarPermisos()` usa `CURRENT_USER.rolApp` — valores: `'Admin'`, `'SemiAdmin'`, `'Invitado'`
- `mostrarToastGuardado(msg)` acepta mensaje opcional, default `'✅ Guardado'`
- `inicializarAjustes()` se llama después de `aplicarPermisos()` en `inicializarApp()`
- `volverPerfil()` — función para volver a `view-perfil` desde las subsecciones del perfil
- Fotos: `normalizarDriveUrl()` convierte URL de Drive a `lh3.googleusercontent.com/d/...=w500`
- Archivos van a Supabase Storage bucket `archivos` vía `POST /archivo`

### Variables globales del wizard
```javascript
const _urlParams = new URLSearchParams(window.location.search);
let inviteCode = _urlParams.get('invite') || null;
const WIZ_STEPS_BASE = ['inv',1,2,3,4,5,6,7,8,10,11];
// wizStep inicia en 'inv'
// wizIntroStart() activa wiz-step-inv
// regData.codigoInvitacion se envía en submitRegistro()
```

---

## Estructura de Google Sheets (origen de datos)

### 4 documentos fuente

| Documento | Propósito |
|---|---|
| `Quindes.xlsx` | Perfiles de jugadoras (tabla maestra) |
| `Tareas_Puntajes_Asistencias_2026.xlsx` | Asistencias, tareas y cálculo de puntos |
| `Cuotas.xlsx` | Seguimiento de pagos de cuotas |
| `Presupuestos.xlsx` | Ingresos y egresos del equipo |

---

## Quindes.xlsx — Hoja `2026`

Headers reales en **fila 5**. Filas 1-4 son config.

```
Nombre Derby | Nombre | Número | Pronombres | Estado | Cuanto asiste por semana
Rol de jugadorx | Marzo (puntos mes) | Trimestre 1 (puntos trim) | 2026 (puntos año)
Paga cuota | Prueba de esfuerzo físico (estado) | Adjunto de prueba Física (URL)
Aptx para el deporte | Cédula o pasaporte | Nombre Cívil | Fecha de nacimiento
Edad | Cumple años | Adjunto de Cédula o pasaporte
Alergias o enfermedades | Dieta | País de origen | Código de país
Número de teléfono | Grupo sanguíneo | Foto de perfil | Contacto de Emergencia
E-Mail | ¿Quiere que se sepa su fecha de cumpleaños? | ¿Quiere que se sepa su edad?
Horas Patinadas | Tipo de usuario | Porcentaje de asistencia anual
```

---

## Campos que expone la API (Railway → App)

Del perfil:
`email`, `nombre`, `nombreDerby`, `numero`, `pronombres`, `rolJugadorx`,
`nombreCivil`, `cedulaPasaporte`, `pais`, `codigoPais`, `telefono`,
`fechaNacimiento`, `mostrarCumple`, `mostrarEdad`, `contactoEmergencia`,
`grupoSanguineo`, `alergias`, `dieta`, `aptoDeporte`, `pruebaFisica`,
`estado`, `asisteSemana`, `pagaCuota`, `tipoUsuario`, `fotoPerfil`,
`adjCedula`, `adjPruebaFisica`

De estadísticas (calculados):
`puntosMes`, `puntosTrimestre`, `puntosAnio`,
`horasPatinadas`, `asistenciaAnual`,
`labelMes`, `labelTrimestre`, `labelAnio`

---

## Lógica de negocio clave a migrar

### Sistema de puntos
```
Puntos por mes = Asistencia + Tareas + Bono(asistencia seguida) + Pago cuota
Resultado:
  - "Puede jugar partidos"               → cumple mínimo asistencia Y tareas
  - "Faltan puntos: Tareas"              → asistencia OK, tareas NO
  - "Faltan puntos: Asistencia"          → tareas OK, asistencia NO
  - "Faltan puntos: Asistencia y Tareas" → nada cumple

Mínimos por frecuencia:
  - 1 vez/semana:   asistencia=3, tareas=5
  - 2 veces/semana: asistencia=7, tareas=3
  - 3+ veces/semana: asistencia=8, tareas=3
  (x4 para trimestre; x16 para año)
```

### Sistema de asistencias
- AppSheet registra presencia en `Log de Asistencias`
- GAS sincroniza cada minuto → reemplazar con endpoint propio en Railway

### Sistema de cuotas
- $15/mes por jugadora activa
- Seguimiento mensual: pagado/no pagado/exento
- Acumulación de deuda si no paga

### Cálculo de pago a coaches
- Cuenta coaches únicos que entrenaron en el mes (excluyendo "Sant" y "Vic")
- Multiplica por valor/persona (configurado en E2 de Egresos)

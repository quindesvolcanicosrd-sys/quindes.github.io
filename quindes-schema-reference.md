# Quindes Volcánicos — Referencia de Schema para Supabase

> Última actualización: 2026-03-21
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx ni explicar el contexto.

---

## Estado actual del proyecto (al 2026-03-21)

### Lo que ya está hecho ✅

#### PWA (app actual — sigue funcionando)
- Hosteada en GitHub Pages: `app.quindesvolcanicos.com`
- Cloudflare Worker como proxy
- Google Apps Script como backend
- Login con Google (Google Identity Services)
- Perfil completo editable (tap-to-edit)
- Secciones: Estadísticas, Datos Personales, Contacto, Salud, Rendimiento
- Wizard de registro para nuevas jugadoras
- Sesión persistente con localStorage
- **Bug pendiente**: `gasCall` con token expirado al restaurar sesión desde localStorage — fix aplicado (fallback a `localStorage.getItem('quindes_token')`)

#### Migración a Supabase (en progreso)
- **Supabase**: proyecto creado (`znprcowxveyzanpvotms.supabase.co`)
- **Google Auth**: configurado en Supabase
- **Schema ejecutado**: 13 tablas creadas (ver sección Schema más abajo)
- **Datos iniciales**: liga, equipo y usuario admin insertados
- **Backend Node.js**: creado en `/api` dentro del repo de GitHub
  - Express + @supabase/supabase-js + dotenv + cors
  - Endpoint `/health` funcionando y conectado a Supabase
  - Corriendo en puerto 3000 localmente
- **Railway**: cuenta creada, pendiente de conectar con el repo

### Lo que falta hacer 🔜
1. Construir los endpoints del backend (getCurrentUser, getMyProfile, updateMyProfile, etc.)
2. Conectar Railway con el repo de GitHub para deploy automático
3. Migrar datos existentes de Quindes.xlsx → Supabase
4. Cambiar `CONFIG.GAS_URL` en app.js por la URL de Railway
5. Reemplazar Google Identity Services por Supabase Auth en la app

### Credenciales y IDs importantes
```
SUPABASE_URL=https://znprcowxveyzanpvotms.supabase.co
LIGA_ID=35d870d8-bfad-4a9a-881a-32a3a8308378
EQUIPO_ID=03161fd2-3120-49f7-b165-27f23bcdae2d
VICTOR_AUTH_ID=b32d0923-dc31-4176-856b-2aa8a6ef04e6
```
(Las API keys están en `/api/.env` en el repo local — nunca se suben a GitHub)

### Repo de GitHub
`https://github.com/quindesvolcanicosrd-sys/quindes.github.io`
- Frontend: raíz del repo (index.html, app.js, style.css)
- Backend: carpeta `/api` (index.js, package.json, .env)

### Para retomar el desarrollo local
```bash
cd "Documents\Trabajo\Personales\App Quinde\quindes.github.io\api"
npm run dev
# → API corriendo en puerto 3000
# → Probar: http://localhost:3000/health
```

---

## Arquitectura del sistema (objetivo final)

```
[PWA - GitHub Pages]
      ↓ fetch
[Backend Node.js - Railway]
      ↓ supabase-js
[Supabase - PostgreSQL]

Jerarquía de datos:
Liga → Equipo(s) → Miembros → Perfiles
```

### Roles del sistema
| Rol | Alcance |
|---|---|
| `admin_liga` | Acceso total a toda la liga y todos sus equipos |
| `admin_equipo` | Acceso total solo a su equipo |
| `semiAdmin_equipo` | Acceso parcial a su equipo |
| `jugadorx` | Solo su perfil y datos de su equipo |
| `coach` / `arbitrx` / `bench` | Idem jugadorx |
| `invitadx` | Acceso mínimo, pendiente de aprobación |

### Flujo de onboarding de nueva jugadora
1. Descarga la app → ingresa código de invitación generado por admin
2. Se autentica con Google
3. Completa el wizard de registro
4. Queda con `estado = 'pendiente'` en tabla `miembros`
5. Admin del equipo aprueba → `estado = 'activo'`

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

---

## Estructura actual (Google Sheets)

### 4 documentos fuente

| Documento | Propósito |
|---|---|
| `Quindes.xlsx` | Perfiles de jugadoras (tabla maestra) |
| `Tareas_Puntajes_Asistencias_2026.xlsx` | Asistencias, tareas y cálculo de puntos |
| `Cuotas.xlsx` | Seguimiento de pagos de cuotas |
| `Presupuestos.xlsx` | Ingresos y egresos del equipo |

---

## Quindes.xlsx — Hoja `2026`

Headers reales están en **fila 5**. Filas 1-4 son config (año, umbrales de puntos).

### Columnas del perfil (orden en la hoja)
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

### Otras hojas en Quindes.xlsx
- `LOG_CAMBIOS`: historial de ediciones (`fecha`, `email`, `rol`, `campo`, `valor_anterior`, `valor_nuevo`)
- `A cumplir`: vista de cumpleaños próximos
- `Web`: links útiles del equipo
- `Lista de Paises`: catálogo de países y códigos
- `Lugares y horarios de entrenami`: lugares de entrenamiento con días, horarios, fotos, Google Maps

---

## Tareas_Puntajes_Asistencias_2026.xlsx

### Hoja `Tareas`
Headers en fila 2:
```
Área | Trimestre | Tarea | Estado | Nombre (jugadora) | Puntos | Puntos finales
Estado final de entrega | Fecha de registro | Fecha Límite | Fecha de Finalización
Notas y adjuntos | ID
```

### Hoja `Asistencias`
Configuración de días y valores de puntos por asistencia.

### Hoja `Calendario de Asistencias`
- Columna 1: nombre derby de jugadora
- Columnas siguientes: cada fecha de entrenamiento del año (3 por semana)
- Valores por celda: P (puntual), T (tarde), A (ausente), o vacío
- Organizado por trimestres (T1, T2, T3, T4)

### Hoja `Log de Asistencias`
```
ID_Entrenamiento | Email_Usuario | Nombre_Derby | Estado | Foto
```

### Hoja `Puntos`
Tabla calculada por jugadora con desglose mensual, trimestral y anual.
- Columna 1: nombre derby
- Por mes: Asistencia, Tareas, Bono asistencia seguida, Pago cuota → total mes
- Por trimestre: igual
- Por año: igual + resultado ("Puede jugar partidos" / "Faltan puntos: X")

---

## Cuotas.xlsx — Hoja `2026`

Headers en **fila 3**:
```
Nombre | Nombre Derby | Paga cuota | Debe pagar | Estado | Pagado
Fecha de pago | Punto | Forma de pago | Mese/s que adeuda
Deudas (Anual) | Saldos | Abonado | Notas | Mes
```

Configuración en filas 1-2: valor de cuota ($15/mes), deudas totales, ingresos totales.

Hay una columna adicional que genera el seguimiento mensual por jugadora.

---

## Presupuestos.xlsx

### Hoja `2026`
Tabla doble: Ingresos | Egresos
```
Ingresos: Concepto | Valor | Responsable | Fecha | Registro
Egresos:  Concepto | Valor | Responsable/s | Fecha | Registro
```
Conceptos de ingreso: Año pasado, Cuotas, Patreon, Pagos individuales, Transportes
Conceptos de egreso: Pago a Coaches, Transportes, Anuncios

### Hojas `Ingresos` y `Egresos`
Registros detallados de cada movimiento.

---

## Relaciones entre documentos

```
Quindes.xlsx (perfiles)
    ↑ referenciado por email/nombre
    |
Tareas_Puntajes_Asistencias_2026.xlsx
    → Puntos calculados: puntosMes, puntosTrimestre, puntosAnio
    → Asistencia: horasPatinadas, porcentajeAsistenciaAnual
    → Log de asistencias por entrenamiento

Cuotas.xlsx
    → Estado de pago por jugadora (pagaCuota, mesesAdeuda, deuda)
    → Referencia a Quindes por nombre

Presupuestos.xlsx
    → Ingresos/egresos del equipo (no por jugadora)
    → Referencia a Cuotas para totales
```

---

## Campos que expone la API actual (GAS → App)

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

## Notas para la migración a Supabase

1. **Autenticación**: hoy usa Google OAuth → migrar a Supabase Auth con Google provider
2. **Fotos/archivos**: hoy en Google Drive → migrar a Supabase Storage
3. **Puntos**: hoy calculados con fórmulas en Sheets → pasar a funciones en Node.js backend
4. **Asistencias**: AppSheet registra presencia → reemplazar con endpoint propio
5. **Cuotas**: lógica mensual por jugadora → tabla `cuotas` con registro por mes/jugadora
6. **Presupuestos**: ingresos/egresos del equipo → tabla `movimientos_financieros`
7. **Multi-equipo**: diseñar con `equipo_id` en todas las tablas desde el inicio

---

## AppScripts — Lógica de negocio actual

### Quindes.xlsx (triggers)
- **`alEditarCualquierHoja`** → onEdit: actualiza cumpleaños y avatares automáticamente
- **`onEditAvatar`** → genera URL de avatar (ui-avatars.com) si la jugadora no tiene foto
- **`actualizarCumples`** → calcula cumpleaños próximos (90 días) y los escribe en hoja "A cumplir"
- **`actualizarTodoDiario`** → trigger diario que escribe mes actual (H5) y trimestre (I5) en la hoja principal

### Tareas_Puntajes_Asistencias_2026.xlsx (triggers)
- **`ejecutarSincronizacionTotal`** → corre cada minuto: sincroniza entrenamientos, estados y asistencias
- **`sincronizarEspejo`** → sincroniza "Template de Asistencias" → "Asistencias" (crea/actualiza/borra filas de entrenamientos)
- **`mantenimientoYEstados`** → rellena Trimestre, Mes, Día, Lugar por fecha; actualiza estado del evento (Programado / Finalizado / Cancelado)
- **`actualizarAsistenNoAsisten`** → lee "Log de Asistencias" y escribe en col Q (Asisten) y R (No Asisten) de cada entrenamiento
- **`actualizarAsistentesDesdeLog_`** → actualiza asistentes desde log de AppSheet
- **`onEdit`** → en hoja "Tareas": registra fecha de creación y trimestre; en "Asistencias": protege IDs con prefijo MOD_

### Presupuestos.xlsx (triggers)
- **`onEditInstalable`** → en hojas Ingresos/Egresos: cuando se edita una fila sin procesar, llama procesarFila()
- **`procesarFilasNoProcesadas`** → trigger por tiempo: procesa filas pendientes en Ingresos y Egresos
- **`procesarFila`** → lógica principal:
  - Si tipo = "Cuotas" en Ingresos → abre Cuotas.xlsx y toma el valor del mes correspondiente
  - Si tipo = "Coaches/Pago a Coaches" en Egresos → cuenta coaches únicos en Asistencias del mes y multiplica por valor/persona
  - Si tipo = otro → simplemente marca como procesado y pone fecha

### Cuotas.xlsx (triggers)
- **`onEdit`** → aplica fuente, actualiza fecha A2, formatos visuales, copia valor K→M cuando se chequea el checkbox de pago
- **`ejecutarActualizacionDelMesActual`** → dispara la función del mes actual (actualizarEnero(), actualizarFebrero(), etc.)
- Las funciones `actualizarMes()` calculan totales de deuda/pago por mes

---

## Lógica de negocio clave a migrar

### Sistema de puntos (hoy en fórmulas de Sheets)
```
Puntos por mes = Asistencia + Tareas + Bono(asistencia seguida) + Pago cuota
Resultado:
  - "Puede jugar partidos"           → cumple mínimo asistencia Y tareas
  - "Faltan puntos: Tareas"          → asistencia OK, tareas NO
  - "Faltan puntos: Asistencia"      → tareas OK, asistencia NO
  - "Faltan puntos: Asistencia y Tareas" → nada cumple

Mínimos por frecuencia de asistencia:
  - 1 vez/semana: asistencia=3, tareas=5
  - 2 veces/semana: asistencia=7, tareas=3
  - 3+ veces/semana: asistencia=8, tareas=3
  (por mes; x4 para trimestre; x16 para año)
```

### Sistema de asistencias (hoy en AppSheet + GAS)
- AppSheet registra presencia/ausencia en `Log de Asistencias`
- GAS sincroniza cada minuto y escribe en columnas Q/R de cada entrenamiento
- Cada entrenamiento tiene un ID único generado por la hoja

### Sistema de cuotas (hoy en Cuotas.xlsx)
- $15/mes por jugadora activa
- Seguimiento mensual: pagado/no pagado/exento
- Acumulación de deuda si no paga

### Cálculo de pago a coaches (hoy en Presupuestos.xlsx)
- Cuenta coaches únicos que entrenaron en el mes (excluyendo "Sant" y "Vic")
- Multiplica por valor por persona (configurado en E2 de Egresos)

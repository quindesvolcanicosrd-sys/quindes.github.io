# Quindes Volcánicos — Referencia de Schema para Supabase

> Generado el 2026-03-20 a partir de los archivos xlsx originales.
> Adjuntá este archivo al inicio de cada sesión para no tener que reenviar los xlsx.

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

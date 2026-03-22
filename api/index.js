const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { data, error } = await supabase.from('ligas').select('nombre').limit(1);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'ok', liga: data[0]?.nombre });
});

// ── GET /usuario?email=xxx ────────────────────────────────────
// Equivale a getCurrentUser en GAS
app.get('/usuario', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Falta email' });

    // 1. Buscar el usuario en auth.users por email
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_user_by_email', { p_email: email });

    if (authError) return res.status(500).json({ error: authError.message });
    if (!authUsers || authUsers.length === 0) return res.json({ found: false });

    const authUserId = authUsers[0].id;

    // 2. Buscar perfil vinculado
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, auth_user_id, equipo_id, nombre_derby, estado')
      .eq('auth_user_id', authUserId)
      .single();

    if (perfilError || !perfil) return res.json({ found: false });

    // 3. Buscar membresía
    const { data: miembro } = await supabase
      .from('miembros')
      .select('rol, estado, liga_id, equipo_id')
      .eq('auth_user_id', authUserId)
      .single();

    res.json({
      found: true,
      id: perfil.id,
      authUserId: perfil.auth_user_id,
      equipoId: perfil.equipo_id,
      nombreDerby: perfil.nombre_derby,
      rol: miembro?.rol,
      estadoMiembro: miembro?.estado,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /perfil/:id ───────────────────────────────────────────
// Equivale a getMyProfile en GAS
app.get('/perfil/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !perfil) return res.status(404).json({ error: 'Perfil no encontrado' });

    // Buscar puntos del mes actual
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const { data: puntos } = await supabase
      .from('puntos_resumen')
      .select('*')
      .eq('perfil_id', id)
      .eq('anio', anioActual)
      .eq('periodo', 'mes')
      .eq('mes', mesActual)
      .single();

    res.json({
      // Identidad derby
      nombreDerby:        perfil.nombre_derby,
      nombre:             perfil.nombre,
      numero:             perfil.numero_derby,
      pronombres:         perfil.pronombres,
      rolJugadorx:        perfil.rol_jugadorx,
      estado:             perfil.estado,
      tipoUsuario:        perfil.tipo_usuario || 'Invitado',
      fotoPerfil:         perfil.foto_perfil_url,

      // Personales
      nombreCivil:        perfil.nombre_civil,
      cedulaPasaporte:    perfil.cedula_pasaporte,
      fechaNacimiento:    perfil.fecha_nacimiento,
      mostrarCumple:      perfil.mostrar_cumple ? 'Sí' : 'No',
      mostrarEdad:        perfil.mostrar_edad ? 'Sí' : 'No',
      pais:               perfil.pais_origen,
      codigoPais:         perfil.codigo_pais,
      telefono:           perfil.telefono,

      // Salud
      grupoSanguineo:     perfil.grupo_sanguineo,
      alergias:           perfil.alergias,
      dieta:              perfil.dieta,
      aptoDeporte:        perfil.apto_deporte ? 'Sí' : 'No',
      contactoEmergencia: perfil.contacto_emergencia,

      // Archivos
      adjCedula:          perfil.adj_cedula_url,
      adjPruebaFisica:    perfil.adj_prueba_fisica_url,

      // Rendimiento
      asisteSemana:       perfil.asiste_semana,
      pagaCuota:          perfil.paga_cuota ? 'Sí' : 'No',
      pruebaFisica:       perfil.prueba_fisica,

      // Estadísticas (del mes actual)
      puntosMes:          puntos?.pts_total ?? '—',
      puntosTrimestre:    null,
      puntosAnio:         null,
      labelMes:           new Date().toLocaleString('es-ES', { month: 'long' }),
      horasPatinadas:     puntos?.horas_patinadas ?? '—',
      asistenciaAnual:    puntos?.pct_asistencia ?? '—',
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /perfil/:id ───────────────────────────────────────────
// Equivale a updateMyProfile en GAS
app.put('/perfil/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre_derby:         datos.nombreDerby,
        numero_derby:         datos.numero,
        pronombres:           datos.pronombres,
        rol_jugadorx:         datos.rolJugadorx,
        estado:               datos.estado,
        nombre:               datos.nombre,
        nombre_civil:         datos.nombreCivil,
        cedula_pasaporte:     datos.cedulaPasaporte,
        fecha_nacimiento:     datos.fechaNacimiento || null,
        mostrar_cumple:       datos.mostrarCumple === 'Sí',
        mostrar_edad:         datos.mostrarEdad === 'Sí',
        pais_origen:          datos.pais,
        codigo_pais:          datos.codigoPais,
        telefono:             datos.telefono,
        grupo_sanguineo:      datos.grupoSanguineo,
        alergias:             datos.alergias,
        dieta:                datos.dieta,
        apto_deporte:         datos.aptoDeporte === 'Sí',
        contacto_emergencia:  datos.contactoEmergencia,
        asiste_semana:        datos.asisteSemana,
        paga_cuota:           datos.pagaCuota === 'Sí',
        prueba_fisica:        datos.pruebaFisica,
      })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /registrar ───────────────────────────────────────────
// Equivale a registrarUsuario en GAS
app.post('/registrar', async (req, res) => {
  try {
    const {
      email, nombre, pronombres, pais, codigoPais, telefono,
      fechaNacimiento, mostrarCumple, mostrarEdad, nombreDerby,
      numero, rolJugadorx, asisteSemana, alergias, dieta,
      contactoEmergencia, codigoInvitacion,
    } = req.body;

    if (!email) return res.status(400).json({ error: 'Falta email' });

    // 1. Verificar código de invitación
    const { data: codigo, error: codigoError } = await supabase
      .from('codigos_invitacion')
      .select('id, equipo_id, usos_max, usos_actuales, activo, expira_at')
      .eq('codigo', codigoInvitacion)
      .single();

    if (codigoError || !codigo) return res.status(400).json({ error: 'Código de invitación inválido' });
    if (!codigo.activo) return res.status(400).json({ error: 'Código de invitación inactivo' });
    if (codigo.expira_at && new Date(codigo.expira_at) < new Date()) return res.status(400).json({ error: 'Código de invitación expirado' });
    if (codigo.usos_max && codigo.usos_actuales >= codigo.usos_max) return res.status(400).json({ error: 'Código de invitación agotado' });

    // 2. Buscar si el usuario ya existe en auth.users
    const { data: authUsers } = await supabase
      .rpc('get_user_by_email', { p_email: email });

    let authUserId;

    if (authUsers && authUsers.length > 0) {
      authUserId = authUsers[0].id;
    } else {
      // Crear usuario en Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) return res.status(500).json({ error: createError.message });
      authUserId = newUser.user.id;
    }

    // 3. Crear perfil
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        auth_user_id:       authUserId,
        equipo_id:          codigo.equipo_id,
        nombre:             nombre,
        nombre_derby:       nombreDerby,
        numero_derby:       numero,
        pronombres:         pronombres,
        rol_jugadorx:       rolJugadorx,
        pais_origen:        pais,
        codigo_pais:        codigoPais,
        telefono:           telefono,
        fecha_nacimiento:   fechaNacimiento || null,
        mostrar_cumple:     mostrarCumple === 'Sí',
        mostrar_edad:       mostrarEdad === 'Sí',
        alergias:           alergias,
        dieta:              dieta,
        contacto_emergencia: contactoEmergencia,
        estado:             'Activx',
        tipo_usuario:       'Invitado',
      })
      .select('id')
      .single();

    if (perfilError) return res.status(500).json({ error: perfilError.message });

    // 4. Crear membresía como pendiente
    const { error: miembroError } = await supabase
      .from('miembros')
      .insert({
        auth_user_id:         authUserId,
        equipo_id:            codigo.equipo_id,
        rol:                  'invitadx',
        estado:               'pendiente',
        codigo_invitacion_id: codigo.id,
      });

    if (miembroError) return res.status(500).json({ error: miembroError.message });

    // 5. Actualizar usos del código
    await supabase
      .from('codigos_invitacion')
      .update({ usos_actuales: codigo.usos_actuales + 1 })
      .eq('id', codigo.id);

    res.json({
      ok: true,
      perfilId: perfil.id,
      authUserId,
      equipoId: codigo.equipo_id,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /perfil/:id ────────────────────────────────────────
// Equivale a borrarPerfil en GAS
app.delete('/perfil/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el auth_user_id antes de borrar
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado' });

    // Borrar membresía
    await supabase
      .from('miembros')
      .delete()
      .eq('auth_user_id', perfil.auth_user_id);

    // Borrar perfil
    await supabase
      .from('perfiles')
      .delete()
      .eq('id', id);

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /archivo ─────────────────────────────────────────────
// Equivale a subirArchivo en GAS
// Recibe base64 y lo sube a Supabase Storage
app.post('/archivo', async (req, res) => {
  try {
    const { base64Data, tipoArchivo, email } = req.body;

    if (!base64Data || !tipoArchivo || !email) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Convertir base64 a buffer
    const base64 = base64Data.replace(/^data:.+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    // Determinar extensión y tipo MIME
    const mimeMatch = base64Data.match(/^data:(.+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const ext = mimeType.split('/')[1]?.split('+')[0] || 'bin';

    // Nombre del archivo
    const timestamp = Date.now();
    const fileName = `${email}/${tipoArchivo}_${timestamp}.${ext}`;

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('archivos')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) return res.status(500).json({ error: error.message });

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('archivos')
      .getPublicUrl(fileName);

    res.json({ ok: true, url: urlData.publicUrl });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
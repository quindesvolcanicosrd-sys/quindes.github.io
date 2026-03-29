const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

function convertirFecha(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
  const isoFull = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFull) return `${isoFull[1]}-${isoFull[2]}-${isoFull[3]}`;
  return null;
}

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
      ligaId: miembro?.liga_id || null,
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
        fecha_nacimiento:     convertirFecha(datos.fechaNacimiento),
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
        foto_perfil_url:      datos.fotoPerfil || undefined,
        adj_cedula_url:       datos.adjCedula || undefined,
        adj_prueba_fisica_url: datos.adjPruebaFisica || undefined,
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
      contactoEmergencia, codigoInvitacion, fotoBase64,
    } = req.body;

    if (!email) return res.status(400).json({ error: 'Falta email' });

    // 1. Verificar código de invitación
    const { data: codigo, error: codigoError } = await supabase
      .from('codigos_invitacion')
      .select('id, equipo_id, usos_max, usos_actuales, activo, expira_at')
      .eq('codigo', codigoInvitacion)
      .single();

    if (codigoError || !codigo) { console.error('ERROR codigoError:', JSON.stringify(codigoError)); return res.status(400).json({ error: 'Código de invitación inválido' }); }
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
    console.log('fechaNacimiento recibida:', fechaNacimiento, '→ convertida:', convertirFecha(fechaNacimiento));
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
        fecha_nacimiento:   convertirFecha(fechaNacimiento) || null,
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

    if (perfilError) { console.error('ERROR perfilError:', JSON.stringify(perfilError)); return res.status(500).json({ error: perfilError.message }); }

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

    if (miembroError) { console.error('ERROR miembroError:', JSON.stringify(miembroError)); return res.status(500).json({ error: miembroError.message }); }

    // 5. Actualizar usos del código
    await supabase
      .from('codigos_invitacion')
      .update({ usos_actuales: codigo.usos_actuales + 1 })
      .eq('id', codigo.id);

    // 6. Subir foto de perfil si viene
    let fotoPerfil = null;
    if (fotoBase64) {
      try {
        const base64 = fotoBase64.replace(/^data:.+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const mimeMatch = fotoBase64.match(/^data:(.+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${email}/fotoPerfil.${ext}`;
        const { error: storageError } = await supabase.storage
          .from('archivos')
          .upload(fileName, buffer, { contentType: mimeType, upsert: true });
        if (!storageError) {
          const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(fileName);
          fotoPerfil = urlData.publicUrl;
          await supabase.from('perfiles').update({ foto_perfil_url: fotoPerfil }).eq('id', perfil.id);
        }
      } catch(e) {
        console.error('Error subiendo foto:', e.message);
      }
    }

    res.json({
      ok: true,
      perfilId: perfil.id,
      authUserId,
      equipoId: codigo.equipo_id,
      fotoPerfil,
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
    const fileName = `${email}/${tipoArchivo}.${ext}`;

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

// ── POST /validar-codigo ──────────────────────────────────────
app.post('/validar-codigo', async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.json({ valido: false, error: 'Falta el código' });

    const { data, error } = await supabase
      .from('codigos_invitacion')
      .select('id, activo, usos_max, usos_actuales, expira_at')
      .eq('codigo', codigo)
      .single();

    if (error || !data) return res.json({ valido: false, error: 'Código de invitación inválido 🔑' });
    if (!data.activo) return res.json({ valido: false, error: 'Este código está inactivo' });
    if (data.expira_at && new Date(data.expira_at) < new Date()) return res.json({ valido: false, error: 'Este código expiró' });
    if (data.usos_max && data.usos_actuales >= data.usos_max) return res.json({ valido: false, error: 'Este código ya alcanzó el límite de usos' });

    res.json({ valido: true });
  } catch (err) {
    res.status(500).json({ valido: false, error: err.message });
  }
});

// ── GET /codigo-invitacion?equipoId=xxx ───────────────────────
app.get('/codigo-invitacion', async (req, res) => {
  try {
    const { equipoId } = req.query;
    if (!equipoId) return res.status(400).json({ error: 'Falta equipoId' });

    const { data, error } = await supabase
      .from('codigos_invitacion')
      .select('codigo, usos_actuales, usos_max, activo')
      .eq('equipo_id', equipoId)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'No hay código activo para este equipo' });

    const agotado = data.usos_max && data.usos_actuales >= data.usos_max;

    res.json({
      codigo:        data.codigo,
      usosActuales:  data.usos_actuales,
      usosMax:       data.usos_max,
      agotado:       agotado,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /liga/:ligaId ─────────────────────────────────────────
app.get('/liga/:ligaId', async (req, res) => {
  try {
    const { ligaId } = req.params;

    const { data: liga, error: ligaError } = await supabase
      .from('ligas')
      .select('id, nombre')
      .eq('id', ligaId)
      .single();

    if (ligaError || !liga) return res.status(404).json({ error: 'Liga no encontrada' });

    const { data: equipos, error: equiposError } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('liga_id', ligaId)
      .order('created_at', { ascending: true });

    if (equiposError) return res.status(500).json({ error: equiposError.message });

    // Para cada equipo traer su código de invitación activo
    const equiposConCodigo = await Promise.all((equipos || []).map(async (eq) => {
      const { data: cod } = await supabase
        .from('codigos_invitacion')
        .select('codigo, usos_actuales, usos_max')
        .eq('equipo_id', eq.id)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return { ...eq, codigo: cod?.codigo || null, usosActuales: cod?.usos_actuales ?? 0, usosMax: cod?.usos_max ?? null };
    }));

    res.json({ id: liga.id, nombre: liga.nombre, equipos: equiposConCodigo });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /crear-equipo ────────────────────────────────────────
app.post('/crear-equipo', async (req, res) => {
  try {
    const { nombre, ligaId, categoria, logoBase64, email } = req.body;
    if (!nombre || !ligaId) return res.status(400).json({ error: 'Faltan datos' });

    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .insert({ nombre, liga_id: ligaId, categoria: categoria || null })
      .select('id, nombre, categoria')
      .single();

    if (equipoError) return res.status(500).json({ error: equipoError.message });

    // Subir logo si viene
    let logoUrl = null;
    if (logoBase64 && email) {
      try {
        const base64 = logoBase64.replace(/^data:.+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const mimeMatch = logoBase64.match(/^data:(.+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `equipos/${equipo.id}/logo.${ext}`;
        const { error: storageError } = await supabase.storage
          .from('archivos')
          .upload(fileName, buffer, { contentType: mimeType, upsert: true });
        if (!storageError) {
          const { data: urlData } = supabase.storage.from('archivos').getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
          await supabase.from('equipos').update({ logo_url: logoUrl }).eq('id', equipo.id);
        }
      } catch(e) { console.error('Error subiendo logo:', e.message); }
    }

    // Crear código de invitación automático
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('codigos_invitacion').insert({
      equipo_id: equipo.id, codigo, activo: true, usos_actuales: 0,
    });

    res.json({ ok: true, equipo: { ...equipo, codigo, usosActuales: 0, usosMax: null, logoUrl } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /liga/:id/nombre ──────────────────────────────────────
app.put('/liga/:id/nombre', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta nombre' });
    const { error } = await supabase.from('ligas').update({ nombre }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /equipo/:id/nombre ────────────────────────────────────
app.put('/equipo/:id/nombre', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta nombre' });
    const { error } = await supabase.from('equipos').update({ nombre }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});
app.post('/crear-equipo', async (req, res) => {
  try {
    const { nombre, ligaId } = req.body;
    if (!nombre || !ligaId) return res.status(400).json({ error: 'Faltan datos' });

    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .insert({ nombre, liga_id: ligaId })
      .select('id, nombre')
      .single();

    if (equipoError) return res.status(500).json({ error: equipoError.message });

    // Crear código de invitación automático para el nuevo equipo
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('codigos_invitacion').insert({
      equipo_id:     equipo.id,
      codigo,
      activo:        true,
      usos_actuales: 0,
    });

    res.json({ ok: true, equipo: { ...equipo, codigo, usosActuales: 0, usosMax: null } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /equipo/:id ────────────────────────────────────────
app.delete('/equipo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Borrar en orden para respetar foreign keys
    await supabase.from('codigos_invitacion').delete().eq('equipo_id', id);
    await supabase.from('asistencias').delete().eq('equipo_id', id);
    await supabase.from('tareas').delete().eq('equipo_id', id);
    await supabase.from('cuotas').delete().eq('equipo_id', id);
    await supabase.from('movimientos').delete().eq('equipo_id', id);
    await supabase.from('puntos_resumen').delete().eq('equipo_id', id);
    await supabase.from('entrenamientos').delete().eq('equipo_id', id);
    await supabase.from('miembros').delete().eq('equipo_id', id);
    await supabase.from('perfiles').delete().eq('equipo_id', id);
    await supabase.from('equipos').delete().eq('id', id);

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /liga/:id ──────────────────────────────────────────
app.delete('/liga/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Traer todos los equipos de la liga
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id')
      .eq('liga_id', id);

    const equipoIds = (equipos || []).map(e => e.id);

    if (equipoIds.length > 0) {
      await supabase.from('codigos_invitacion').delete().in('equipo_id', equipoIds);
      await supabase.from('asistencias').delete().in('equipo_id', equipoIds);
      await supabase.from('tareas').delete().in('equipo_id', equipoIds);
      await supabase.from('cuotas').delete().in('equipo_id', equipoIds);
      await supabase.from('movimientos').delete().in('equipo_id', equipoIds);
      await supabase.from('puntos_resumen').delete().in('equipo_id', equipoIds);
      await supabase.from('entrenamientos').delete().in('equipo_id', equipoIds);
      await supabase.from('miembros').delete().in('equipo_id', equipoIds);
      await supabase.from('perfiles').delete().in('equipo_id', equipoIds);
      await supabase.from('equipos').delete().in('liga_id', [id]);
    }

    await supabase.from('ligas').delete().eq('id', id);

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));

// supabase/functions/api/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function convertirFecha(str: string | null): string | null {
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) return `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`
  const isoFull = str.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (isoFull) return `${isoFull[1]}-${isoFull[2]}-${isoFull[3]}`
  return null
}

function base64ToUint8Array(base64: string): Uint8Array {
  const b64 = base64.replace(/^data:.+;base64,/, '')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function getMime(base64: string): string {
  const m = base64.match(/^data:(.+);base64,/)
  return m ? m[1] : 'application/octet-stream'
}

function getExt(mime: string): string {
  return mime.split('/')[1]?.split('+')[0] || 'bin'
}

async function subirArchivo(
  supabase: ReturnType<typeof createClient>,
  base64: string,
  fileName: string,
): Promise<string | null> {
  try {
    const buffer = base64ToUint8Array(base64)
    const mimeType = getMime(base64)
    const { error } = await supabase.storage
      .from('archivos')
      .upload(fileName, buffer, { contentType: mimeType, upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('archivos').getPublicUrl(fileName)
    return data.publicUrl
  } catch { return null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const url = new URL(req.url)
  // Strip /functions/v1/api prefix → get clean path like /usuario, /perfil/123, etc.
  const path = url.pathname.replace(/^\/functions\/v1\/api/, '').replace(/^\/api/, '') || '/'
console.log('pathname:', url.pathname, 'path:', path)
const method = req.method
  const segments = path.split('/').filter(Boolean) // e.g. ['perfil', '123']

  let body: Record<string, unknown> = {}
  if (['POST', 'PUT'].includes(method)) {
    try { body = await req.json() } catch { body = {} }
  }

  try {

    // ── GET /health ────────────────────────────────────────
    if (method === 'GET' && path === '/health') {
      const { data, error } = await supabase.from('ligas').select('nombre').limit(1)
      if (error) return json({ status: 'error', message: error.message }, 500)
      return json({ status: 'ok', liga: data[0]?.nombre })
    }

    // ── GET /usuario?email=xxx ──────────────────────────────
    if (method === 'GET' && path === '/usuario') {
      const email = url.searchParams.get('email')
      if (!email) return json({ error: 'Falta email' }, 400)

      const { data: authUsers, error: authError } = await supabase
        .rpc('get_user_by_email', { p_email: email })
      if (authError) return json({ error: authError.message }, 500)
      if (!authUsers || authUsers.length === 0) return json({ found: false })

      const authUserId = authUsers[0].id

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id, auth_user_id, equipo_id, nombre_derby, estado')
        .eq('auth_user_id', authUserId)
        .single()
      if (!perfil) return json({ found: false })

      const { data: miembro } = await supabase
        .from('miembros')
        .select('rol, estado, liga_id, equipo_id')
        .eq('auth_user_id', authUserId)
        .single()

      const { data: equipo } = await supabase
        .from('equipos')
        .select('color_primario')
        .eq('id', perfil.equipo_id)
        .single()

      return json({
        found: true,
        id: perfil.id,
        authUserId: perfil.auth_user_id,
        equipoId: perfil.equipo_id,
        ligaId: miembro?.liga_id || null,
        nombreDerby: perfil.nombre_derby,
        rol: miembro?.rol,
        estadoMiembro: miembro?.estado,
        colorPrimario: equipo?.color_primario || '#ef4444',
      })
    }

    // ── GET /perfil/:id ────────────────────────────────────
    if (method === 'GET' && segments[0] === 'perfil' && segments[1]) {
      const id = segments[1]
      const { data: perfil, error } = await supabase
        .from('perfiles').select('*').eq('id', id).single()
      if (error || !perfil) return json({ error: 'Perfil no encontrado' }, 404)

      const mesActual = new Date().getMonth() + 1
      const anioActual = new Date().getFullYear()
      const { data: puntos } = await supabase
        .from('puntos_resumen')
        .select('*')
        .eq('perfil_id', id)
        .eq('anio', anioActual)
        .eq('periodo', 'mes')
        .eq('mes', mesActual)
        .single()

      return json({
        nombreDerby: perfil.nombre_derby,
        nombre: perfil.nombre,
        numero: perfil.numero_derby,
        pronombres: perfil.pronombres,
        rolJugadorx: perfil.rol_jugadorx,
        estado: perfil.estado,
        tipoUsuario: perfil.tipo_usuario || 'Invitado',
        fotoPerfil: perfil.foto_perfil_url,
        nombreCivil: perfil.nombre_civil,
        cedulaPasaporte: perfil.cedula_pasaporte,
        fechaNacimiento: perfil.fecha_nacimiento,
        mostrarCumple: perfil.mostrar_cumple ? 'Sí' : 'No',
        mostrarEdad: perfil.mostrar_edad ? 'Sí' : 'No',
        pais: perfil.pais_origen,
        codigoPais: perfil.codigo_pais,
        telefono: perfil.telefono,
        grupoSanguineo: perfil.grupo_sanguineo,
        alergias: perfil.alergias,
        dieta: perfil.dieta,
        aptoDeporte: perfil.apto_deporte ? 'Sí' : 'No',
        contactoEmergencia: perfil.contacto_emergencia,
        adjCedula: perfil.adj_cedula_url,
        adjPruebaFisica: perfil.adj_prueba_fisica_url,
        asisteSemana: perfil.asiste_semana,
        pagaCuota: perfil.paga_cuota ? 'Sí' : 'No',
        pruebaFisica: perfil.prueba_fisica,
        puntosMes: puntos?.pts_total ?? '—',
        puntosTrimestre: null,
        puntosAnio: null,
        labelMes: new Date().toLocaleString('es-ES', { month: 'long' }),
        horasPatinadas: puntos?.horas_patinadas ?? '—',
        asistenciaAnual: puntos?.pct_asistencia ?? '—',
      })
    }

    // ── PUT /perfil/:id ────────────────────────────────────
    if (method === 'PUT' && segments[0] === 'perfil' && segments[1] && segments.length === 2) {
      const id = segments[1]
      const datos = body as Record<string, string>
      const { error } = await supabase.from('perfiles').update({
        nombre_derby: datos.nombreDerby,
        numero_derby: datos.numero,
        pronombres: datos.pronombres,
        rol_jugadorx: datos.rolJugadorx,
        estado: datos.estado,
        nombre: datos.nombre,
        nombre_civil: datos.nombreCivil,
        cedula_pasaporte: datos.cedulaPasaporte,
        fecha_nacimiento: convertirFecha(datos.fechaNacimiento),
        mostrar_cumple: datos.mostrarCumple === 'Sí',
        mostrar_edad: datos.mostrarEdad === 'Sí',
        pais_origen: datos.pais,
        codigo_pais: datos.codigoPais,
        telefono: datos.telefono,
        grupo_sanguineo: datos.grupoSanguineo,
        alergias: datos.alergias,
        dieta: datos.dieta,
        apto_deporte: datos.aptoDeporte === 'Sí',
        contacto_emergencia: datos.contactoEmergencia,
        asiste_semana: datos.asisteSemana,
        paga_cuota: datos.pagaCuota === 'Sí',
        prueba_fisica: datos.pruebaFisica,
        ...(datos.fotoPerfil && { foto_perfil_url: datos.fotoPerfil }),
        ...(datos.adjCedula && { adj_cedula_url: datos.adjCedula }),
        ...(datos.adjPruebaFisica && { adj_prueba_fisica_url: datos.adjPruebaFisica }),
      }).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // ── DELETE /perfil/:id ─────────────────────────────────
    if (method === 'DELETE' && segments[0] === 'perfil' && segments[1]) {
      const id = segments[1]
      const { data: perfil } = await supabase
        .from('perfiles').select('auth_user_id').eq('id', id).single()
      if (!perfil) return json({ error: 'Perfil no encontrado' }, 404)
      await supabase.from('miembros').delete().eq('auth_user_id', perfil.auth_user_id)
      await supabase.from('perfiles').delete().eq('id', id)
      return json({ ok: true })
    }

    // ── POST /registrar ────────────────────────────────────
    if (method === 'POST' && path === '/registrar') {
      const { email, nombre, pronombres, pais, codigoPais, telefono,
        fechaNacimiento, mostrarCumple, mostrarEdad, nombreDerby,
        numero, rolJugadorx, asisteSemana, alergias, dieta,
        contactoEmergencia, codigoInvitacion, fotoBase64 } = body as Record<string, string>

      if (!email) return json({ error: 'Falta email' }, 400)

      const { data: codigo, error: codigoError } = await supabase
        .from('codigos_invitacion')
        .select('id, equipo_id, usos_max, usos_actuales, activo, expira_at')
        .eq('codigo', codigoInvitacion).single()
      if (codigoError || !codigo) return json({ error: 'Código de invitación inválido' }, 400)
      if (!codigo.activo) return json({ error: 'Código de invitación inactivo' }, 400)
      if (codigo.expira_at && new Date(codigo.expira_at) < new Date()) return json({ error: 'Código de invitación expirado' }, 400)
      if (codigo.usos_max && codigo.usos_actuales >= codigo.usos_max) return json({ error: 'Código de invitación agotado' }, 400)

      const { data: authUsers } = await supabase.rpc('get_user_by_email', { p_email: email })
      let authUserId: string
      if (authUsers && authUsers.length > 0) {
        authUserId = authUsers[0].id
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email, email_confirm: true,
        })
        if (createError) return json({ error: createError.message }, 500)
        authUserId = newUser.user.id
      }

      const { data: perfil, error: perfilError } = await supabase.from('perfiles').insert({
        auth_user_id: authUserId,
        equipo_id: codigo.equipo_id,
        nombre, nombre_derby: nombreDerby, numero_derby: numero,
        pronombres, rol_jugadorx: rolJugadorx,
        pais_origen: pais, codigo_pais: codigoPais, telefono,
        fecha_nacimiento: convertirFecha(fechaNacimiento) || null,
        mostrar_cumple: mostrarCumple === 'Sí',
        mostrar_edad: mostrarEdad === 'Sí',
        alergias, dieta, contacto_emergencia: contactoEmergencia,
        estado: 'Activx', tipo_usuario: 'Invitado',
      }).select('id').single()
      if (perfilError) return json({ error: perfilError.message }, 500)

      const { error: miembroError } = await supabase.from('miembros').insert({
        auth_user_id: authUserId, equipo_id: codigo.equipo_id,
        rol: 'invitadx', estado: 'pendiente', codigo_invitacion_id: codigo.id,
      })
      if (miembroError) return json({ error: miembroError.message }, 500)

      await supabase.from('codigos_invitacion')
        .update({ usos_actuales: codigo.usos_actuales + 1 }).eq('id', codigo.id)

      let fotoPerfil: string | null = null
      if (fotoBase64) {
        const mimeType = getMime(fotoBase64)
        const ext = getExt(mimeType)
        fotoPerfil = await subirArchivo(supabase, fotoBase64, `${email}/fotoPerfil.${ext}`)
        if (fotoPerfil) {
          await supabase.from('perfiles').update({ foto_perfil_url: fotoPerfil }).eq('id', perfil.id)
        }
      }

      return json({ ok: true, perfilId: perfil.id, authUserId, equipoId: codigo.equipo_id, fotoPerfil })
    }

    // ── POST /archivo ──────────────────────────────────────
    if (method === 'POST' && path === '/archivo') {
      const { base64Data, tipoArchivo, email } = body as Record<string, string>
      if (!base64Data || !tipoArchivo || !email) return json({ error: 'Faltan datos' }, 400)
      const mimeType = getMime(base64Data)
      const ext = getExt(mimeType)
      const fileName = `${email}/${tipoArchivo}.${ext}`
      const url2 = await subirArchivo(supabase, base64Data, fileName)
      if (!url2) return json({ error: 'Error subiendo archivo' }, 500)
      return json({ ok: true, url: url2 })
    }

    // ── POST /validar-codigo ───────────────────────────────
    if (method === 'POST' && path === '/validar-codigo') {
      const { codigo } = body as Record<string, string>
      if (!codigo) return json({ valido: false, error: 'Falta el código' })
      const { data, error } = await supabase
        .from('codigos_invitacion')
        .select('id, activo, usos_max, usos_actuales, expira_at')
        .eq('codigo', codigo).single()
      if (error || !data) return json({ valido: false, error: 'Código de invitación inválido 🔑' })
      if (!data.activo) return json({ valido: false, error: 'Este código está inactivo' })
      if (data.expira_at && new Date(data.expira_at) < new Date()) return json({ valido: false, error: 'Este código expiró' })
      if (data.usos_max && data.usos_actuales >= data.usos_max) return json({ valido: false, error: 'Este código ya alcanzó el límite de usos' })
      return json({ valido: true })
    }

    // ── GET /codigo-invitacion?equipoId=xxx ───────────────
    if (method === 'GET' && path === '/codigo-invitacion') {
      const equipoId = url.searchParams.get('equipoId')
      if (!equipoId) return json({ error: 'Falta equipoId' }, 400)
      const { data, error } = await supabase
        .from('codigos_invitacion')
        .select('codigo, usos_actuales, usos_max, activo')
        .eq('equipo_id', equipoId).eq('activo', true)
        .order('created_at', { ascending: false }).limit(1).single()
      if (error || !data) return json({ error: 'No hay código activo para este equipo' }, 404)
      return json({
        codigo: data.codigo,
        usosActuales: data.usos_actuales,
        usosMax: data.usos_max,
        agotado: data.usos_max && data.usos_actuales >= data.usos_max,
      })
    }

    // ── GET /liga/:ligaId ──────────────────────────────────
    if (method === 'GET' && segments[0] === 'liga' && segments[1] && segments.length === 2) {
      const ligaId = segments[1]
      const { data: liga, error: ligaError } = await supabase
        .from('ligas').select('id, nombre, pais, ciudad, anio_fundacion, descripcion, redes_sociales, logo_url')
        .eq('id', ligaId).single()
      if (ligaError || !liga) return json({ error: 'Liga no encontrada' }, 404)

      const { data: equipos } = await supabase
        .from('equipos').select('id, nombre').eq('liga_id', ligaId)
        .order('created_at', { ascending: true })

      const equiposConCodigo = await Promise.all((equipos || []).map(async (eq: {id: string, nombre: string}) => {
        const { data: cod } = await supabase
          .from('codigos_invitacion').select('codigo, usos_actuales, usos_max')
          .eq('equipo_id', eq.id).eq('activo', true)
          .order('created_at', { ascending: false }).limit(1).single()
        return { ...eq, codigo: cod?.codigo || null, usosActuales: cod?.usos_actuales ?? 0, usosMax: cod?.usos_max ?? null }
      }))

      return json({
        id: liga.id, nombre: liga.nombre, pais: liga.pais, ciudad: liga.ciudad,
        anioFundacion: liga.anio_fundacion, descripcion: liga.descripcion,
        redesSociales: liga.redes_sociales || [], logoUrl: liga.logo_url, equipos: equiposConCodigo,
      })
    }

    // ── PUT /liga/:id/info ─────────────────────────────────
    if (method === 'PUT' && segments[0] === 'liga' && segments[2] === 'info') {
      const { pais, ciudad, anioFundacion, descripcion } = body as Record<string, string>
      const { error } = await supabase.from('ligas').update({
        pais: pais || null, ciudad: ciudad || null,
        anio_fundacion: anioFundacion ? parseInt(anioFundacion) : null,
        descripcion: descripcion || null,
      }).eq('id', segments[1])
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // ── PUT /liga/:id/nombre ───────────────────────────────
    if (method === 'PUT' && segments[0] === 'liga' && segments[2] === 'nombre') {
      const { nombre } = body as Record<string, string>
      if (!nombre) return json({ error: 'Falta nombre' }, 400)
      const { error } = await supabase.from('ligas').update({ nombre }).eq('id', segments[1])
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // ── PUT /equipo/:id/color ──────────────────────────────
    if (method === 'PUT' && segments[0] === 'equipo' && segments[2] === 'color') {
      const { color } = body as Record<string, string>
      if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return json({ error: 'Color inválido' }, 400)
      const { error } = await supabase.from('equipos').update({ color_primario: color }).eq('id', segments[1])
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // ── PUT /equipo/:id/nombre ─────────────────────────────
    if (method === 'PUT' && segments[0] === 'equipo' && segments[2] === 'nombre') {
      const { nombre } = body as Record<string, string>
      if (!nombre) return json({ error: 'Falta nombre' }, 400)
      const { error } = await supabase.from('equipos').update({ nombre }).eq('id', segments[1])
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    // ── DELETE /equipo/:id ─────────────────────────────────
    if (method === 'DELETE' && segments[0] === 'equipo' && segments[1]) {
      const id = segments[1]
      await supabase.from('codigos_invitacion').delete().eq('equipo_id', id)
      await supabase.from('asistencias').delete().eq('equipo_id', id)
      await supabase.from('tareas').delete().eq('equipo_id', id)
      await supabase.from('cuotas').delete().eq('equipo_id', id)
      await supabase.from('movimientos').delete().eq('equipo_id', id)
      await supabase.from('puntos_resumen').delete().eq('equipo_id', id)
      await supabase.from('entrenamientos').delete().eq('equipo_id', id)
      await supabase.from('miembros').delete().eq('equipo_id', id)
      await supabase.from('perfiles').delete().eq('equipo_id', id)
      await supabase.from('equipos').delete().eq('id', id)
      return json({ ok: true })
    }

    // ── DELETE /liga/:id ───────────────────────────────────
    if (method === 'DELETE' && segments[0] === 'liga' && segments[1]) {
      const id = segments[1]
      const { data: equipos } = await supabase.from('equipos').select('id').eq('liga_id', id)
      const equipoIds = (equipos || []).map((e: {id: string}) => e.id)
      if (equipoIds.length > 0) {
        await supabase.from('codigos_invitacion').delete().in('equipo_id', equipoIds)
        await supabase.from('asistencias').delete().in('equipo_id', equipoIds)
        await supabase.from('tareas').delete().in('equipo_id', equipoIds)
        await supabase.from('cuotas').delete().in('equipo_id', equipoIds)
        await supabase.from('movimientos').delete().in('equipo_id', equipoIds)
        await supabase.from('puntos_resumen').delete().in('equipo_id', equipoIds)
        await supabase.from('entrenamientos').delete().in('equipo_id', equipoIds)
        await supabase.from('miembros').delete().in('equipo_id', equipoIds)
        await supabase.from('perfiles').delete().in('equipo_id', equipoIds)
        await supabase.from('equipos').delete().in('liga_id', [id])
      }
      await supabase.from('ligas').delete().eq('id', id)
      return json({ ok: true })
    }

    // ── POST /crear-equipo ─────────────────────────────────
    if (method === 'POST' && path === '/crear-equipo') {
      const { nombre, ligaId, categoria, logoBase64, email } = body as Record<string, string>
      if (!nombre || !ligaId) return json({ error: 'Faltan datos' }, 400)

      const slug = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { data: equipo, error: equipoError } = await supabase.from('equipos')
        .insert({ nombre, liga_id: ligaId, categoria: categoria || null, slug })
        .select('id, nombre, categoria').single()
      if (equipoError) return json({ error: equipoError.message }, 500)

      let logoUrl: string | null = null
      if (logoBase64 && email) {
        const mimeType = getMime(logoBase64)
        const ext = getExt(mimeType)
        logoUrl = await subirArchivo(supabase, logoBase64, `equipos/${equipo.id}/logo.${ext}`)
        if (logoUrl) await supabase.from('equipos').update({ logo_url: logoUrl }).eq('id', equipo.id)
      }

      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase()
      await supabase.from('codigos_invitacion').insert({
        equipo_id: equipo.id, codigo, activo: true, usos_actuales: 0,
      })

      return json({ ok: true, equipo: { ...equipo, codigo, usosActuales: 0, usosMax: null, logoUrl } })
    }

    // ── POST /crear-liga ───────────────────────────────────
    if (method === 'POST' && path === '/crear-liga') {
      const {
        nombreLiga, nombreEquipo, categoria, email, logoBase64, ligaImagenBase64, redesSociales,
        pais, ciudad, anioFundacion, descripcion, contacto,
        nombre, pronombres, rolJugadorx, nombreDerby, numero,
        codigoPais, telefono, fechaNacimiento, mostrarCumple, mostrarEdad,
        alergias, dieta, contactoEmergencia, fotoBase64,
      } = body as Record<string, string>

      if (!nombreLiga || !nombreEquipo || !email) return json({ error: 'Faltan datos obligatorios' }, 400)

      const { data: authUsers } = await supabase.rpc('get_user_by_email', { p_email: email })
      if (!authUsers || authUsers.length === 0) return json({ error: 'Usuario no encontrado' }, 404)
      const authUserId = authUsers[0].id

      const slugLiga = nombreLiga.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Date.now()

      const { data: liga, error: ligaError } = await supabase.from('ligas').insert({
        nombre: nombreLiga, slug: slugLiga,
        pais: pais || null, ciudad: ciudad || null,
        anio_fundacion: anioFundacion ? parseInt(anioFundacion) : null,
        descripcion:    descripcion || null, contacto: contacto || null,
        redes_sociales: redesSociales ? JSON.stringify(redesSociales) : '[]',
      })
      .select('id, nombre').single()
      if (ligaError) return json({ error: ligaError.message }, 500)

      if (ligaImagenBase64) {
        const mimeType = getMime(ligaImagenBase64)
        const ext = getExt(mimeType)
        const ligaImagenUrl = await subirArchivo(supabase, ligaImagenBase64, `ligas/${liga.id}/imagen.${ext}`)
        if (ligaImagenUrl) await supabase.from('ligas').update({ imagen_url: ligaImagenUrl }).eq('id', liga.id)
      }

      const slugEquipo = nombreEquipo.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { data: equipo, error: equipoError } = await supabase.from('equipos').insert({
        nombre: nombreEquipo, liga_id: liga.id, categoria: categoria || null, slug: slugEquipo,
      }).select('id, nombre, categoria').single()
      if (equipoError) return json({ error: equipoError.message }, 500)

      let logoUrl: string | null = null
      if (logoBase64) {
        const mimeType = getMime(logoBase64)
        const ext = getExt(mimeType)
        logoUrl = await subirArchivo(supabase, logoBase64, `equipos/${equipo.id}/logo.${ext}`)
        if (logoUrl) await supabase.from('equipos').update({ logo_url: logoUrl }).eq('id', equipo.id)
      }

      let fotoPerfil: string | null = null
      if (fotoBase64) {
        const mimeType = getMime(fotoBase64)
        const ext = getExt(mimeType)
        fotoPerfil = await subirArchivo(supabase, fotoBase64, `${email}/fotoPerfil.${ext}`)
      }

      const { data: perfil, error: perfilError } = await supabase.from('perfiles').insert({
        auth_user_id: authUserId, equipo_id: equipo.id,
        tipo_usuario: 'Admin', estado: 'Activx',
        nombre: nombre || null, nombre_derby: nombreDerby || null,
        numero_derby: numero || null, pronombres: pronombres || null,
        rol_jugadorx: rolJugadorx || null, pais_origen: pais || null,
        codigo_pais: codigoPais || null, telefono: telefono || null,
        fecha_nacimiento: convertirFecha(fechaNacimiento) || null,
        mostrar_cumple: mostrarCumple === 'Sí', mostrar_edad: mostrarEdad === 'Sí',
        alergias: alergias || null, dieta: dieta || null,
        contacto_emergencia: contactoEmergencia || null,
        foto_perfil_url: fotoPerfil || null,
      }).select('id').single()
      if (perfilError) return json({ error: perfilError.message }, 500)

      const { error: miembroError } = await supabase.from('miembros').insert({
        auth_user_id: authUserId, equipo_id: equipo.id, liga_id: liga.id,
        rol: 'Admin', estado: 'aprobado',
      })
      if (miembroError) return json({ error: miembroError.message }, 500)

      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase()
      await supabase.from('codigos_invitacion').insert({
        equipo_id: equipo.id, codigo, activo: true, usos_actuales: 0,
      })

      return json({
        ok: true,
        liga: { id: liga.id, nombre: liga.nombre },
        equipo: { id: equipo.id, nombre: equipo.nombre, categoria: equipo.categoria, codigo, logoUrl },
        perfil: { id: perfil.id },
      })
    }

    return json({ error: 'Ruta no encontrada' }, 404)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return json({ error: msg }, 500)
  }
})
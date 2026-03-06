// ============================================================
//  QUINDES APP — app.js
//  GitHub Pages + Google OAuth + GAS como API REST
// ============================================================

// ── CONFIGURACIÓN ── reemplazá estos valores ──────────────────
const CONFIG = {
  // Tu GAS Web App URL (termina en /exec)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyXJFd9eJbYDUfeWs1XcAdK2FecZd70EGmCVpu_pAv6uQA0Em52Ep5ZlzkZanT0ZJw/exec',
  // Tu Google OAuth Client ID (de Google Cloud Console)
  GOOGLE_CLIENT_ID: '1030464424780-7iequodlpd3kf2p17h2n11m337jm6sgj.apps.googleusercontent.com',
};
// ─────────────────────────────────────────────────────────────

let CURRENT_USER  = null;
let accessToken   = null;
let urlFotoPerfilActual = "";
let modoEdicion   = false;
let fotoSubiendo  = false;
let cropper;

// ── SERVICE WORKER (PWA) ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── GOOGLE IDENTITY SERVICES ─────────────────────────────────
function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn,
    auto_select: true,
  });
  google.accounts.id.prompt();
}

function onGoogleSignIn(response) {
  // Decodificar el JWT para obtener el email
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  accessToken = response.credential;
  inicializarApp(payload.email);
}

function mostrarLoginScreen() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display   = 'flex';
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    { theme: 'filled_black', size: 'large', width: 280, text: 'signin_with' }
  );
}

// ── API CALLS A GAS ───────────────────────────────────────────
async function gasCall(action, data = {}) {
  const body = { action, token: accessToken, ...data };
  // GAS requiere text/plain para evitar el preflight CORS
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta inválida del servidor: ' + text.substring(0, 100)); }
  if (json.error) throw new Error(json.error);
  return json;
}

// ── INICIALIZACIÓN ────────────────────────────────────────────
async function inicializarApp(email) {
  try {
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('loginScreen').style.display   = 'none';

    const user = await gasCall('getCurrentUser', { email });

    if (!user || !user.found) {
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('unauthorized').style.display  = 'block';
      return;
    }

    CURRENT_USER = user;
    document.getElementById('user-email').textContent = user.email;
    applyRole(user.rolApp);

    const profile = await gasCall('getMyProfile', { rowNumber: user.rowNumber });

    configurarTodasLasSubidas();
    window.myProfile = profile;
    renderMyProfile(profile);
    aplicarPermisos();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appContent').style.display    = 'block';

  } catch (err) {
    console.error(err);
    document.getElementById('loadingScreen').style.display = 'none';
    mostrarLoginScreen();
  }
}

// ── ROLES ─────────────────────────────────────────────────────
function applyRole(role) {
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    el.style.display = roles.includes(role) ? 'block' : 'none';
  });
}
function isAdmin()     { return CURRENT_USER?.rolApp === 'Admin'; }
function isSemiAdmin() { return CURRENT_USER?.rolApp === 'SemiAdmin'; }

// ── RENDER PERFIL ─────────────────────────────────────────────
function renderMyProfile(profile) {
  if (!profile) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('p-nombreDerby',        profile.nombreDerby);
  set('p-nombre',             profile.nombre);
  set('p-nombreCivil',        profile.nombreCivil);
  set('p-numero',             profile.numero);
  set('p-pronombres',         profile.pronombres);
  set('p-estado',             profile.estado);
  set('p-rolJugadorx',        profile.rolJugadorx);
  set('p-pagaCuota',          profile.pagaCuota);
  set('p-alergias',           profile.alergias);
  set('p-dieta',              profile.dieta);
  set('p-pais',               profile.pais);
  set('p-telefono',           profile.telefono);
  set('p-grupoSanguineo',     profile.grupoSanguineo);
  set('p-codigoPais',         profile.codigoPais);
  set('p-asisteSemana',       profile.asisteSemana);
  set('p-pruebaFisica',       profile.pruebaFisica);
  set('p-aptoDeporte',        profile.aptoDeporte);
  set('p-cedulaPasaporte',    profile.cedulaPasaporte);
  set('p-email',              profile.email ? profile.email.replace(/@gmail\.com$/, '') : '');
  set('p-mostrarCumple',      profile.mostrarCumple);
  set('p-mostrarEdad',        profile.mostrarEdad);
  set('p-tipoUsuario',        profile.tipoUsuario);
  set('p-fechaNacimiento',    profile.fechaNacimiento);
  set('p-edad',               profile.edad);
  set('p-cumple',             profile.cumple);
  set('p-contactoEmergencia', profile.contactoEmergencia);
  set('p-mayor18',            profile.mayor18);

  // Stats
  const puntosMesEl = document.getElementById('p-puntosMes');
  if (puntosMesEl) {
    puntosMesEl.textContent = profile.puntosMes || '';
    puntosMesEl.previousElementSibling.textContent = 'Estado mes de ' + (profile.labelMes || '');
  }
  const puntosTrimEl = document.getElementById('p-puntosTrim');
  if (puntosTrimEl) {
    puntosTrimEl.textContent = profile.puntosTrimestre || '';
    puntosTrimEl.previousElementSibling.textContent = 'Estado del ' + (profile.labelTrimestre || '');
  }
  const puntosAnioEl = document.getElementById('p-puntosAnio');
  if (puntosAnioEl) puntosAnioEl.textContent = profile.puntosAnio || '';
  const labelAnioEl = document.getElementById('label-puntosAnio');
  if (labelAnioEl) labelAnioEl.textContent = 'Estado del año ' + (profile.labelAnio || '');

  // Chips y selects
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id     = 'p-' + key;
    const config = CHIPS_OPTIONS[key];
    const valor  = profile[key] || '';
    if (config.ui === 'chips')  habilitarChips(id, valor);
    if (config.ui === 'select') habilitarSelect(id, valor);
  });

  renderEstadoArchivo('adjPruebaFisica', profile.adjPruebaFisica);
  renderEstadoArchivo('adjCedula',       profile.adjCedula);
  renderEstadoArchivo('fotoPerfil',      profile.fotoPerfil);
  renderFotoPerfil(normalizarDriveUrl(profile.fotoPerfil));

  // Hero
  const heroNombre = document.getElementById('hero-nombre-derby');
  if (heroNombre) heroNombre.textContent = profile.nombreDerby || '—';
  const heroSub = document.getElementById('hero-sub');
  if (heroSub) heroSub.textContent = (profile.numero ? '#' + profile.numero : '—') + ' · ' + (profile.rolJugadorx || '—');
  const heroRol = document.getElementById('hero-rol');
  if (heroRol) heroRol.textContent = profile.rolJugadorx || '—';
  const heroPron = document.getElementById('hero-pronombres');
  if (heroPron) heroPron.textContent = profile.pronombres || '—';
}

// ── EDICIÓN ───────────────────────────────────────────────────
const FILE_INPUTS = ['p-fotoPerfil', 'p-adjCedula', 'p-adjPruebaFisica'];

function activarEdicion() {
  toggleUI(true);
  modoEdicion = true;
  document.querySelectorAll('.editable').forEach(el => el.disabled = false);
  FILE_INPUTS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = false;
    if (id !== 'p-fotoPerfil') el.hidden = false;
  });
  const role = CURRENT_USER.rolApp;
  Object.keys(FIELD_CONFIG).forEach(id => {
    const config = FIELD_CONFIG[id];
    const el = document.getElementById(id);
    if (!el) return;
    if (config.role === 'user')                       { el.disabled = false; el.hidden = false; }
    if (config.role === 'Admin' && role === 'Admin')  { el.disabled = false; el.hidden = false; }
  });
  setAvatarEditable(true);
  document.getElementById('btnEditar').style.display  = 'none';
  document.getElementById('btnGuardar').style.display = 'inline-block';
  document.getElementById('btnCancelar').style.display = 'inline-block';
  actualizarEstadoChips();
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id    = 'p-' + key;
    const valor = window.myProfile[key] || '';
    const config = CHIPS_OPTIONS[key];
    if (config.ui === 'chips')  habilitarChips(id, valor);
    if (config.ui === 'select') habilitarSelect(id, valor);
  });
}

function cancelarEdicion() {
  toggleUI(false);
  modoEdicion = false;
  renderMyProfile(window.myProfile);
  document.querySelectorAll('.editable').forEach(input => input.disabled = true);
  document.getElementById('btnEditar').style.display   = 'inline-block';
  document.getElementById('btnGuardar').style.display  = 'none';
  document.getElementById('btnCancelar').style.display = 'none';
  actualizarEstadoChips();
  setAvatarEditable(false);
  FILE_INPUTS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = true;
    if (id !== 'p-fotoPerfil') el.hidden = false;
  });
}

function recogerDatosFormulario() {
  const v = id => document.getElementById(id)?.value || '';
  return {
    nombreDerby:        v('p-nombreDerby'),
    nombre:             v('p-nombre'),
    nombreCivil:        v('p-nombreCivil'),
    cedulaPasaporte:    v('p-cedulaPasaporte'),
    numero:             v('p-numero'),
    pronombres:         v('p-pronombres'),
    estado:             v('p-estado'),
    rolJugadorx:        v('p-rolJugadorx'),
    pagaCuota:          v('p-pagaCuota'),
    alergias:           v('p-alergias'),
    dieta:              v('p-dieta'),
    pais:               v('p-pais'),
    codigoPais:         v('p-codigoPais'),
    telefono:           v('p-telefono'),
    grupoSanguineo:     v('p-grupoSanguineo'),
    fechaNacimiento:    v('p-fechaNacimiento'),
    contactoEmergencia: v('p-contactoEmergencia'),
    mostrarCumple:      v('p-mostrarCumple'),
    mostrarEdad:        v('p-mostrarEdad'),
    mayor18:            v('p-mayor18'),
    email:              v('p-email').trim() + '@gmail.com',
    asisteSemana:       v('p-asisteSemana'),
    pruebaFisica:       v('p-pruebaFisica'),
    aptoDeporte:        v('p-aptoDeporte'),
    tipoUsuario:        v('p-tipoUsuario'),
    fotoPerfil:         window.myProfile.fotoPerfil,
  };
}

async function guardarPerfil() {
  const errorBox = document.getElementById('perfil-error');
  toggleUI(false);

  if (fotoSubiendo) {
    errorBox.textContent = 'Esperando a que la foto se termine de subir...';
    errorBox.style.display = 'block';
    await new Promise(resolve => {
      const iv = setInterval(() => { if (!fotoSubiendo) { clearInterval(iv); resolve(); } }, 100);
    });
    errorBox.style.display = 'none';
  }

  const validacion = validarCamposFrontend();
  if (validacion.primerError) {
    errorBox.textContent = 'Completá los campos obligatorios: ' + validacion.camposFaltantes.join(', ');
    errorBox.style.display = 'block';
    scrollAlCampoElemento(validacion.primerError);
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';

  const datosActualizados = recogerDatosFormulario();
  datosActualizados.fotoPerfil      = window.myProfile.fotoPerfil;
  datosActualizados.adjCedula       = window.myProfile.adjCedula;
  datosActualizados.adjPruebaFisica = window.myProfile.adjPruebaFisica;

  try {
    await gasCall('updateMyProfile', {
      rowNumber: CURRENT_USER.rowNumber,
      data: datosActualizados,
    });

    Object.assign(window.myProfile, datosActualizados);
    renderMyProfile(window.myProfile);
    document.querySelectorAll('.editable').forEach(i => i.disabled = true);
    btnGuardar.textContent = 'Guardar';
    btnGuardar.disabled    = false;
    document.getElementById('btnEditar').style.display   = 'inline-block';
    document.getElementById('btnGuardar').style.display  = 'none';
    document.getElementById('btnCancelar').style.display = 'none';
    modoEdicion = false;
    setAvatarEditable(false);

  } catch (err) {
    errorBox.textContent   = err.message || 'Error al guardar el perfil';
    errorBox.style.display = 'block';
    btnGuardar.textContent = 'Guardar';
    btnGuardar.disabled    = false;
  }

  FILE_INPUTS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.disabled = true; }
  });
  document.getElementById('avatar-container').classList.add('disabled');
}

// ── FIELD CONFIG ──────────────────────────────────────────────
const FIELD_CONFIG = {
  'p-puntosMes':    { role: 'none' },
  'p-puntosTrim':   { role: 'none' },
  'p-puntosAnio':   { role: 'none' },
  'p-edad':         { role: 'none' },
  'p-cumple':       { role: 'none' },
  'p-nombreCivil':  { role: 'Admin' },
  'p-nombre':       { role: 'Admin' },
  'p-estado':       { role: 'Admin' },
  'p-asisteSemana': { role: 'Admin' },
  'p-pruebaFisica': { role: 'Admin' },
  'p-aptoDeporte':  { role: 'Admin' },
  'p-tipoUsuario':  { role: 'Admin' },
  'p-email':        { role: 'Admin' },
  'p-cedulaPasaporte':    { role: 'user' },
  'p-nombreDerby':        { role: 'user' },
  'p-numero':             { role: 'user' },
  'p-pronombres':         { role: 'user', multi: true },
  'p-rolJugadorx':        { role: 'user' },
  'p-pagaCuota':          { role: 'user' },
  'p-fechaNacimiento':    { role: 'user' },
  'p-alergias':           { role: 'user' },
  'p-dieta':              { role: 'user' },
  'p-pais':               { role: 'user' },
  'p-codigoPais':         { role: 'user' },
  'p-telefono':           { role: 'user' },
  'p-grupoSanguineo':     { role: 'user' },
  'p-contactoEmergencia': { role: 'user' },
  'p-mostrarCumple':      { role: 'user' },
  'p-mostrarEdad':        { role: 'user' },
  'p-mayor18':            { role: 'user' },
};

function aplicarPermisos() {
  const role = CURRENT_USER.rolApp;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    el.style.display = roles.includes(role) ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('p-email');
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      this.value = this.value.replace(/@.*/, '');
    });
  }
});

// ── CHIPS Y SELECTS ───────────────────────────────────────────
const CHIPS_OPTIONS = {
  pronombres:     { multi: true,  ui: 'chips',  options: ['Él','Ella','Elle','No definido'] },
  estado:         { multi: false, ui: 'chips',  options: ['Activx','No Activx','Satélite','Ausente','Técnico'] },
  asisteSemana:   { multi: false, ui: 'chips',  options: ['1 vez','2 veces','3 o más veces','No aplica'] },
  rolJugadorx:    { multi: false, ui: 'select', options: ['Jammer','Bloquer','Blammer','Ref','Coach','Coach/ref','Bench','No definido'] },
  pagaCuota:      { multi: false, ui: 'chips',  options: ['Sí','No'] },
  pruebaFisica:   { multi: false, ui: 'chips',  options: ['Realizada','No realizada'] },
  aptoDeporte:    { multi: false, ui: 'chips',  options: ['Sí','No'] },
  pais:           { multi: false, ui: 'select', options: ['Ecuador','Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba','El Salvador','Guatemala','Honduras','México','Nicaragua','Panamá','Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela','Canadá','Estados Unidos','Alemania','Francia','España','Italia','Reino Unido','Portugal','Suiza','Países Bajos','Suecia','Rusia','China','Japón','Corea del Sur','India','Israel','Emiratos Árabes Unidos','Arabia Saudita','Australia','Sudáfrica','Nigeria'] },
  codigoPais:     { multi: false, ui: 'select', options: ['🇪🇨 +593','🇦🇷 +54','🇧🇴 +591','🇧🇷 +55','🇨🇱 +56','🇨🇴 +57','🇨🇷 +506','🇨🇺 +53','🇸🇻 +503','🇬🇹 +502','🇭🇳 +504','🇲🇽 +52','🇳🇮 +505','🇵🇦 +507','🇵🇾 +595','🇵🇪 +51','🇵🇷 +1','🇩🇴 +1','🇺🇾 +598','🇻🇪 +58','🇨🇦 +1','🇺🇸 +1','🇩🇪 +49','🇫🇷 +33','🇪🇸 +34','🇮🇹 +39','🇬🇧 +44','🇵🇹 +351','🇨🇭 +41','🇳🇱 +31','🇸🇪 +46','🇷🇺 +7','🇨🇳 +86','🇯🇵 +81','🇰🇷 +82','🇮🇳 +91','🇮🇱 +972','🇦🇪 +971','🇸🇦 +966','🇦🇺 +61','🇿🇦 +27','🇳🇬 +234'] },
  grupoSanguineo: { multi: false, ui: 'select', options: ['A+','A-','AB+','AB-','B+','B-','O+','O-'] },
  mostrarCumple:  { multi: false, ui: 'chips',  options: ['Sí','No'] },
  mostrarEdad:    { multi: false, ui: 'chips',  options: ['Sí','No'] },
  mayor18:        { multi: false, ui: 'chips',  options: ['Sí','No'] },
  tipoUsuario:    { multi: false, ui: 'chips',  options: ['Admin','SemiAdmin','Invitado'] },
};

function habilitarChips(id, valorInicial = '') {
  const input = document.getElementById(id);
  if (!input) return;
  const key    = id.replace(/^p-/, '');
  const config = CHIPS_OPTIONS[key];
  if (!config) return;
  input.style.display = 'none';
  let wrapper = input.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains('chip-wrapper')) {
    wrapper = document.createElement('div');
    wrapper.className = 'chip-wrapper';
    input.parentNode.insertBefore(wrapper, input.nextSibling);
  }
  wrapper.innerHTML = '';
  const selected = new Set(
    valorInicial ? valorInicial.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  config.options.forEach(opt => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = opt;
    chip.className = 'chip ' + (selected.has(opt) ? 'chip-active' : 'chip-inactive');
    if (!modoEdicion) chip.classList.add('opacity-50', 'cursor-not-allowed');
    chip.addEventListener('click', () => {
      if (!modoEdicion) return;
      if (config.multi) { selected.has(opt) ? selected.delete(opt) : selected.add(opt); }
      else              { selected.clear(); selected.add(opt); }
      input.value = Array.from(selected).join(',');
      Array.from(wrapper.children).forEach(c => {
        c.className = 'chip ' + (selected.has(c.textContent) ? 'chip-active' : 'chip-inactive');
      });
    });
    wrapper.appendChild(chip);
  });
}

function actualizarEstadoChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    if (modoEdicion) { chip.classList.remove('opacity-50','cursor-not-allowed'); }
    else             { chip.classList.add('opacity-50','cursor-not-allowed'); }
  });
}

function crearBottomSheet() {
  if (document.getElementById('bs-overlay')) return;
  const overlay = document.createElement('div'); overlay.className = 'bs-overlay'; overlay.id = 'bs-overlay';
  overlay.addEventListener('click', cerrarBottomSheet);
  const panel = document.createElement('div'); panel.className = 'bs-panel'; panel.id = 'bs-panel';
  panel.innerHTML = `
    <div class="bs-handle"></div>
    <div class="bs-title" id="bs-title"></div>
    <div class="bs-search-wrapper" id="bs-search-wrapper">
      <input class="bs-search" id="bs-search" placeholder="Buscar..." autocomplete="off">
    </div>
    <div class="bs-options" id="bs-options"></div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
}

function abrirBottomSheet(label, options, valorActual, onSelect) {
  crearBottomSheet();
  const overlay       = document.getElementById('bs-overlay');
  const panel         = document.getElementById('bs-panel');
  const title         = document.getElementById('bs-title');
  const optsEl        = document.getElementById('bs-options');
  const searchEl      = document.getElementById('bs-search');
  const searchWrapper = document.getElementById('bs-search-wrapper');
  title.textContent = label;
  searchEl.value = '';
  searchWrapper.style.display = options.length > 6 ? 'block' : 'none';
  function renderOpciones(filtro = '') {
    optsEl.innerHTML = '';
    const filtradas = options.filter(o => o.toLowerCase().includes(filtro.toLowerCase()));
    if (!filtradas.length) { optsEl.innerHTML = '<p class="bs-empty">Sin resultados</p>'; return; }
    filtradas.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bs-option' + (opt === valorActual ? ' selected' : '');
      btn.textContent = opt;
      btn.addEventListener('click', () => { onSelect(opt); cerrarBottomSheet(); });
      optsEl.appendChild(btn);
    });
  }
  renderOpciones();
  const nuevoSearch = searchEl.cloneNode(true);
  searchEl.parentNode.replaceChild(nuevoSearch, searchEl);
  nuevoSearch.addEventListener('input', () => renderOpciones(nuevoSearch.value));
  requestAnimationFrame(() => {
    const sel = optsEl.querySelector('.selected');
    if (sel) sel.scrollIntoView({ block: 'center' });
    if (options.length > 6) nuevoSearch.focus();
  });
  overlay.classList.add('active');
  panel.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarBottomSheet() {
  const overlay = document.getElementById('bs-overlay');
  const panel   = document.getElementById('bs-panel');
  if (!overlay || !panel) return;
  overlay.classList.remove('active');
  panel.classList.remove('active');
  document.body.style.overflow = '';
}

function habilitarSelect(id, valorInicial = '') {
  const input = document.getElementById(id);
  const key   = id.replace('p-', '');
  const config = CHIPS_OPTIONS[key];
  if (!config || !input) return;
  const fieldEl  = input.closest('.profile-field');
  const labelEl  = fieldEl ? fieldEl.querySelector('label') : null;
  const labelText = labelEl ? labelEl.textContent : key;
  input.style.display = 'none';
  let trigger = input.nextElementSibling;
  if (trigger && trigger.classList.contains('custom-select-trigger')) trigger.remove();
  trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  trigger.textContent = valorInicial || 'No definido';
  trigger.disabled = !modoEdicion;
  input.value = valorInicial;
  input.parentNode.insertBefore(trigger, input.nextSibling);
  trigger.addEventListener('click', () => {
    if (!modoEdicion) return;
    abrirBottomSheet(labelText, config.options, input.value, opcionElegida => {
      input.value = opcionElegida;
      trigger.textContent = opcionElegida;
    });
  });
}

// ── VALIDACIÓN ────────────────────────────────────────────────
const CAMPOS_OBLIGATORIOS = [
  'p-nombreCivil','p-nombre','p-cedulaPasaporte','p-pronombres',
  'p-fechaNacimiento','p-pais','p-codigoPais','p-telefono',
  'p-grupoSanguineo','p-contactoEmergencia','p-mostrarCumple',
  'p-mostrarEdad','p-mayor18'
];
const NOMBRES_CAMPOS = {
  'p-nombreCivil':'Nombre civil','p-nombre':'Nombre',
  'p-cedulaPasaporte':'Cédula / Pasaporte','p-pronombres':'Pronombres',
  'p-fechaNacimiento':'Fecha de nacimiento','p-pais':'País',
  'p-codigoPais':'Código de país','p-telefono':'Teléfono',
  'p-grupoSanguineo':'Grupo sanguíneo','p-contactoEmergencia':'Contacto de emergencia',
  'p-mostrarCumple':'Mostrar cumpleaños','p-mostrarEdad':'Mostrar edad',
  'p-mayor18':'Mayor de 18 años'
};

function validarCamposFrontend() {
  let primerError = null, camposFaltantes = [];
  CAMPOS_OBLIGATORIOS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('campo-error');
    if (!el.value?.trim()) {
      el.classList.add('campo-error');
      camposFaltantes.push(NOMBRES_CAMPOS[id] || id);
      if (!primerError) primerError = el;
    }
  });
  return { primerError, camposFaltantes };
}

function scrollAlCampoElemento(el) {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('campo-error');
  setTimeout(() => el.classList.remove('campo-error'), 2000);
}

// ── ARCHIVOS ──────────────────────────────────────────────────
function configurarTodasLasSubidas() {
  configurarUpload('p-adjPruebaFisica', 'prueba', 'adjPruebaFisica');
  configurarUpload('p-adjCedula',       'cedula', 'adjCedula');
  configurarUpload('p-fotoPerfil',      'foto',   'fotoPerfil');
}

function configurarUpload(inputId, tipoArchivo, campoDestino) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let inputReal = input;
  const btnSubir = document.getElementById(`btn-subir-${campoDestino}`);
  if (btnSubir) btnSubir.onclick = () => { if (modoEdicion) inputReal.click(); };
  if (campoDestino !== 'fotoPerfil') {
    const nuevoInput = input.cloneNode(true);
    input.parentNode.replaceChild(nuevoInput, input);
    inputReal = nuevoInput;
  }
  if (campoDestino === 'fotoPerfil') {
    const avatar = document.getElementById('avatar-container');
    if (avatar) avatar.onclick = () => { if (!modoEdicion) return; inputReal.click(); };
  }
  inputReal.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('El archivo no puede superar 5MB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = event.target.result;
      if (!base64) return;
      if (campoDestino === 'fotoPerfil') { abrirCropper(base64); return; }
      mostrarSubiendo(campoDestino);
      try {
        const result = await gasCall('subirArchivo', {
          base64Data: base64,
          tipoArchivo,
          email: CURRENT_USER.email,
        });
        window.myProfile[campoDestino] = result.url;
        renderEstadoArchivo(campoDestino, result.url);
        mostrarExito(campoDestino);
      } catch { mostrarErrorUpload(campoDestino); }
    };
    reader.readAsDataURL(file);
  });
}

function renderEstadoArchivo(campo, url) {
  const contenedor = document.getElementById(`estado-${campo}`);
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (!url) { contenedor.innerHTML = '<span class="file-status-vacio">No hay archivo cargado</span>'; return; }
  const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  let html = `<div class="file-status-ok"><span>Archivo cargado</span><a href="${url}" target="_blank" class="file-link">Ver archivo</a></div>`;
  if (esImagen) html += `<img src="${url}" class="file-preview" alt="Preview">`;
  contenedor.innerHTML = html;
}

function mostrarSubiendo(campo) {
  const el = document.getElementById(`upload-status-${campo}`);
  if (el) el.innerHTML = '<span>Subiendo...</span>';
  if (campo === 'fotoPerfil') document.getElementById('avatar-loader')?.classList.remove('hidden');
}
function mostrarExito(campo) {
  const el = document.getElementById(`upload-status-${campo}`);
  if (el) { el.innerHTML = '<span class="text-ok">✓ Subido</span>'; setTimeout(() => el.innerHTML = '', 3000); }
  if (campo === 'fotoPerfil') document.getElementById('avatar-loader')?.classList.add('hidden');
}
function mostrarErrorUpload(campo) {
  const el = document.getElementById(`upload-status-${campo}`);
  if (el) el.innerHTML = '<span class="text-error">Error al subir</span>';
  if (campo === 'fotoPerfil') document.getElementById('avatar-loader')?.classList.add('hidden');
}

// ── FOTO DE PERFIL ────────────────────────────────────────────
function renderFotoPerfil(url) {
  const img = document.getElementById('img-preview-foto');
  if (!img) return;
  const placeholder = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="#2b2b2b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-size="20" font-family="Arial">Sin foto</text></svg>`);
  img.onerror = () => { img.src = placeholder; };
  img.src = url || placeholder;
}

function normalizarDriveUrl(url) {
  if (!url) return '';
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return 'https://drive.google.com/thumbnail?id=' + m1[1] + '&sz=w500';
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return 'https://drive.google.com/thumbnail?id=' + m2[1] + '&sz=w500';
  return url;
}

function abrirCropper(base64) {
  const modal = document.getElementById('modal-crop');
  const image = document.getElementById('crop-image');
  modal.classList.remove('hidden'); modal.classList.add('flex');
  image.src = base64;
  if (cropper) cropper.destroy();
  cropper = new Cropper(image, {
    aspectRatio: 1, viewMode: 1, dragMode: 'move',
    responsive: true, restore: true, checkCrossOrigin: false,
    modal: true, guides: true, center: true, highlight: true,
    cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false,
  });
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) { btnAplicar.disabled = false; btnAplicar.onclick = () => confirmarCrop(); }
}

function confirmarCrop() {
  if (!cropper) return;
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) { btnAplicar.disabled = true; btnAplicar.textContent = 'Procesando...'; }
  const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
  const base64 = canvas.toDataURL('image/jpeg', 0.9);
  document.getElementById('modal-crop').classList.add('hidden');
  document.getElementById('modal-crop').classList.remove('flex');
  cropper.destroy(); cropper = null;
  subirImagenRecortada(base64);
}

async function subirImagenRecortada(base64) {
  const img     = document.getElementById('img-preview-foto');
  const overlay = document.getElementById('avatar-overlay');
  if (img) img.src = base64;
  if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('flex'); }
  fotoSubiendo = true;
  try {
    const result = await gasCall('subirArchivo', {
      base64Data: base64,
      tipoArchivo: 'foto',
      email: CURRENT_USER.email,
    });
    window.myProfile.fotoPerfil = result.url;
    renderEstadoArchivo('fotoPerfil', result.url);
    if (img) img.src = result.url;
  } catch {
    mostrarErrorUpload('fotoPerfil');
    if (img && window.myProfile.fotoPerfil) img.src = window.myProfile.fotoPerfil;
  } finally {
    if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
    fotoSubiendo = false;
  }
}

// ── UI HELPERS ────────────────────────────────────────────────
function setAvatarEditable(editable) {
  const avatar = document.getElementById('avatar-container');
  if (!avatar) return;
  avatar.classList.toggle('disabled', !editable);
  avatar.style.pointerEvents = editable ? 'auto' : 'none';
  avatar.style.cursor = editable ? 'pointer' : 'default';
}

function toggleUI(isEditing) {
  document.querySelectorAll('.editable').forEach(input => { input.disabled = !isEditing; });
  document.getElementById('btnEditar').style.display   = isEditing ? 'none'  : 'block';
  document.getElementById('btnGuardar').style.display  = isEditing ? 'block' : 'none';
  document.getElementById('btnCancelar').style.display = isEditing ? 'block' : 'none';
  document.getElementById('appContent').classList.toggle('is-editing', isEditing);
}

function cancelarCrop() {
  if (cropper) { cropper.destroy(); cropper = null; }
  document.getElementById('modal-crop').classList.add('hidden');
  document.getElementById('modal-crop').classList.remove('flex');
}
function rotarImagen() { if (cropper) cropper.rotate(90); }

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Cargar Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => initGoogleAuth();
  document.head.appendChild(script);
});

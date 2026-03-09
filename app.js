// ============================================================
//  QUINDES APP — app.js  (navegación por secciones)
// ============================================================

const CONFIG = {
  GAS_URL: 'https://black-snow-eff8.quindesvolcanicosrd.workers.dev',
  GOOGLE_CLIENT_ID: '190762038083-nlmie46eah0qq5kd5l86fiq3jteg2pr4.apps.googleusercontent.com',
};

let CURRENT_USER   = null;
let accessToken    = null;
let fotoSubiendo   = false;
let cropper;

// Estado de edición por sección
const edicionActiva = {
  generales: false, personales: false, contacto: false,
  salud: false, rendimiento: false,
};

// ── SERVICE WORKER ────────────────────────────────────────────
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

// ── API ───────────────────────────────────────────────────────
async function gasCall(action, data = {}) {
  const params = new URLSearchParams({ action, token: accessToken });
  if (action === 'updateMyProfile') {
    params.set('rowNumber', data.rowNumber);
    params.set('data', encodeURIComponent(JSON.stringify(data.data)));
  } else if (action === 'subirArchivo') {
    params.set('tipoArchivo', data.tipoArchivo);
    params.set('base64Data', encodeURIComponent(data.base64Data));
  } else {
    Object.entries(data).forEach(([k, v]) => params.set(k, v));
  }
  const url = CONFIG.GAS_URL + '?' + params.toString();
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta inválida: ' + text.substring(0, 100)); }
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
      document.getElementById('unauthorized').style.display  = 'flex';
      return;
    }

    CURRENT_USER = user;
    document.getElementById('user-email').textContent = user.email;

    const profile = await gasCall('getMyProfile', { rowNumber: user.rowNumber });
    window.myProfile = profile;

    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appContent').style.display    = 'block';

  } catch (err) {
    console.error(err);
    document.getElementById('loadingScreen').style.display = 'none';
    mostrarLoginScreen();
  }
}

// ── RENDER COMPLETO ───────────────────────────────────────────
function renderTodo(profile) {
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
  initFechaTrigger();
  set('p-contactoEmergencia', profile.contactoEmergencia);
  set('p-mayor18',            profile.mayor18);

  // Stats
  const mesEl  = document.getElementById('p-puntosMes');
  const mesLbl = document.getElementById('label-puntosMes');
  if (mesEl)  mesEl.textContent  = profile.puntosMes || '—';
  if (mesLbl) mesLbl.textContent = 'Mes de ' + (profile.labelMes || '');
  const trimEl  = document.getElementById('p-puntosTrim');
  const trimLbl = document.getElementById('label-puntosTrim');
  if (trimEl)  trimEl.textContent  = profile.puntosTrimestre || '—';
  if (trimLbl) trimLbl.textContent = profile.labelTrimestre  || 'Trimestre';
  const anioEl  = document.getElementById('p-puntosAnio');
  const anioLbl = document.getElementById('label-puntosAnio');
  if (anioEl)  anioEl.textContent  = profile.puntosAnio || '—';
  if (anioLbl) anioLbl.textContent = 'Año ' + (profile.labelAnio || '');

  // Hero
  const heroNombre = document.getElementById('hero-nombre-derby');
  if (heroNombre) heroNombre.textContent = profile.nombreDerby || '—';
  const heroSub = document.getElementById('hero-sub');
  if (heroSub) heroSub.textContent = (profile.numero ? '#' + profile.numero : '—') + ' · ' + (profile.rolJugadorx || '—');
  const heroRol = document.getElementById('hero-rol');
  if (heroRol) heroRol.textContent = profile.rolJugadorx || '—';
  const heroPron = document.getElementById('hero-pronombres');
  if (heroPron) heroPron.textContent = profile.pronombres || '—';

  // Subtítulos de las filas del menú
  actualizarSubtitulos(profile);

  // Foto
  renderFotoPerfil(normalizarDriveUrl(profile.fotoPerfil));
  // Foto en sección generales
  const secImg = document.getElementById('sec-img-foto');
  if (secImg) {
    const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#2b2b2b"/></svg>');
    secImg.src = normalizarDriveUrl(profile.fotoPerfil) || placeholder;
  }

  // Selects, chips, toggles
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id     = 'p-' + key;
    const config = CHIPS_OPTIONS[key];
    const valor  = profile[key] || '';
    if (config.ui === 'chips')       habilitarChips(id, valor);
    if (config.ui === 'multiselect') habilitarMultiSelect(id, valor);
    if (config.ui === 'select')      habilitarSelect(id, valor);
    if (config.ui === 'toggle')      habilitarToggle(id, valor);
  });

  // Archivos
  renderEstadoArchivo('adjPruebaFisica', profile.adjPruebaFisica);
  renderEstadoArchivo('adjCedula',       profile.adjCedula);

  // Email width
  ajustarAnchoEmail();
}

function actualizarSubtitulos(profile) {
  const sub = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  sub('sub-generales',   [profile.nombreDerby, profile.numero ? '#'+profile.numero : null, profile.rolJugadorx].filter(Boolean).join(' · ') || 'Nombre Derby, Número, Rol');
  sub('sub-personales',  [profile.cedulaPasaporte, profile.pais, profile.fechaNacimiento].filter(Boolean).join(' · ') || 'Documento, Nacionalidad');
  sub('sub-contacto',    [profile.email, profile.telefono ? (profile.codigoPais||'') + ' ' + profile.telefono : null].filter(Boolean).join(' · ') || 'Email, Teléfono');
  sub('sub-salud',       [profile.grupoSanguineo, profile.contactoEmergencia].filter(Boolean).join(' · ') || 'Contacto de emergencia, Grupo sanguíneo');
  sub('sub-rendimiento', [profile.estado, profile.asisteSemana].filter(Boolean).join(' · ') || 'Estado, Cuota, Asistencia');
}

function ajustarAnchoEmail() {
  const emailEl = document.getElementById('p-email');
  if (!emailEl) return;
  const tmp = document.createElement('span');
  tmp.style.cssText = 'position:absolute;visibility:hidden;font-size:16px;font-weight:400;white-space:pre;';
  tmp.textContent = emailEl.value || ' ';
  document.body.appendChild(tmp);
  emailEl.style.width = (tmp.offsetWidth + 4) + 'px';
  document.body.removeChild(tmp);
}

// ── NAVEGACIÓN ────────────────────────────────────────────────
let vistaActual = 'home';

function navegarSeccion(seccion) {
  const home = document.getElementById('view-home');
  const dest = document.getElementById('view-' + seccion);
  if (!dest) return;

  home.classList.add('slide-out');
  dest.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dest.classList.add('active');
      home.classList.remove('active');
    });
  });
  dest.addEventListener('transitionend', () => {
    home.classList.remove('slide-out');
    home.style.display = 'none';
  }, { once: true });

  vistaActual = seccion;
}

function volverHome() {
  // Cancelar edición si está activa
  if (edicionActiva[vistaActual]) {
    cancelarEdicionSeccion(vistaActual);
  }

  const home = document.getElementById('view-home');
  const curr = document.getElementById('view-' + vistaActual);
  if (!curr) return;

  home.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      home.classList.add('active');
      curr.classList.remove('active');
    });
  });
  curr.addEventListener('transitionend', () => {
    curr.style.display = 'none';
  }, { once: true });

  vistaActual = 'home';
}

// ── EDICIÓN POR SECCIÓN ───────────────────────────────────────
// Campos por sección
const CAMPOS_SECCION = {
  generales:   ['p-nombreDerby','p-numero','p-rolJugadorx','p-nombre','p-pronombres'],
  personales:  ['p-nombreCivil','p-cedulaPasaporte','p-pais','p-fechaNacimiento','p-mostrarCumple','p-mostrarEdad','p-mayor18','p-adjCedula'],
  contacto:    ['p-email','p-codigoPais','p-telefono'],
  salud:       ['p-contactoEmergencia','p-grupoSanguineo','p-alergias','p-dieta','p-aptoDeporte','p-adjPruebaFisica'],
  rendimiento: ['p-estado','p-asisteSemana','p-pruebaFisica','p-tipoUsuario','p-pagaCuota'],
};

// Campos que solo Admin puede editar
const SOLO_ADMIN = ['p-nombreCivil','p-nombre','p-estado','p-asisteSemana','p-pruebaFisica','p-aptoDeporte','p-tipoUsuario','p-email'];

function toggleEdicionSeccion(seccion) {
  if (edicionActiva[seccion]) {
    cancelarEdicionSeccion(seccion);
  } else {
    activarEdicionSeccion(seccion);
  }
}

function activarEdicionSeccion(seccion) {
  edicionActiva[seccion] = true;
  const view = document.getElementById('view-' + seccion);
  view.classList.add('is-editing');

  const role = CURRENT_USER.rolApp;
  CAMPOS_SECCION[seccion].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const soloAdmin = SOLO_ADMIN.includes(id);
    if (soloAdmin && role !== 'Admin') return;
    el.disabled = false;
    el.hidden   = false;
  });
  // Enable date picker trigger if in personales section
  if (seccion === 'personales') {
    const dt = document.querySelector('#view-personales .date-picker-trigger');
    if (dt) dt.disabled = false;
  }

  // Re-render widgets en modo edición
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id = 'p-' + key;
    if (!CAMPOS_SECCION[seccion].includes(id)) return;
    const config = CHIPS_OPTIONS[key];
    const valor  = document.getElementById(id)?.value || window.myProfile[key] || '';
    if (config.ui === 'chips')       habilitarChips(id, valor);
    if (config.ui === 'multiselect') habilitarMultiSelect(id, valor);
    if (config.ui === 'select')      habilitarSelect(id, valor);
    if (config.ui === 'toggle')      habilitarToggle(id, valor);
  });

  // Avatar editable en sección generales
  if (seccion === 'generales') setSecAvatarEditable(true);

  // Mostrar flechas de select
  mostrarFlechasSelect(seccion, true);

  // Animate header action row in
  const actionsRow = document.getElementById('header-actions-' + seccion);
  if (actionsRow) {
    actionsRow.style.display = 'flex';
    requestAnimationFrame(() => actionsRow.classList.add('visible'));
  }
}

function cancelarEdicionSeccion(seccion) {
  edicionActiva[seccion] = false;
  const view = document.getElementById('view-' + seccion);
  view.classList.remove('is-editing');

  // Re-render con datos originales
  renderTodo(window.myProfile);

  // Deshabilitar inputs
  CAMPOS_SECCION[seccion].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  // Disable date picker trigger
  if (seccion === 'personales') {
    const dt = document.querySelector('#view-personales .date-picker-trigger');
    if (dt) { dt.disabled = true; dt.textContent = document.getElementById('p-fechaNacimiento')?.value || '—'; }
  }

  if (seccion === 'generales') setSecAvatarEditable(false);
  mostrarFlechasSelect(seccion, false);

  // Animate header action row out
  const actionsRow = document.getElementById('header-actions-' + seccion);
  if (actionsRow) {
    actionsRow.classList.remove('visible');
    setTimeout(() => { actionsRow.style.display = 'none'; }, 280);
  }
}

async function guardarSeccion(seccion) {
  const errorBox = document.getElementById('error-' + seccion);
  if (errorBox) errorBox.style.display = 'none';

  if (fotoSubiendo) {
    if (errorBox) { errorBox.textContent = 'Esperando que la foto termine de subir...'; errorBox.style.display = 'block'; }
    await new Promise(resolve => {
      const iv = setInterval(() => { if (!fotoSubiendo) { clearInterval(iv); resolve(); } }, 100);
    });
    if (errorBox) errorBox.style.display = 'none';
  }

  const btnSave = document.getElementById('btn-hsave-' + seccion);
  if (btnSave) { btnSave.disabled = true; btnSave.textContent = '…'; }

  const v = id => document.getElementById(id)?.value || '';
  const datos = recogerTodosLosDatos();

  try {
    await gasCall('updateMyProfile', {
      rowNumber: CURRENT_USER.rowNumber,
      data: datos,
    });
    Object.assign(window.myProfile, datos);
    renderTodo(window.myProfile);
    cancelarEdicionSeccion(seccion);
  } catch (err) {
    if (errorBox) { errorBox.textContent = err.message || 'Error al guardar'; errorBox.style.display = 'block'; }
  } finally {
    if (btnSave) { btnSave.disabled = false; btnSave.textContent = 'Guardar'; }
  }
}

function recogerTodosLosDatos() {
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
    adjCedula:          window.myProfile.adjCedula,
    adjPruebaFisica:    window.myProfile.adjPruebaFisica,
  };
}

function mostrarFlechasSelect(seccion, mostrar) {
  const selectIds = {
    generales:   ['rolJugadorx'],
    personales:  ['pais'],
    contacto:    ['codigoPais'],
    salud:       ['grupoSanguineo'],
    rendimiento: ['estado','asisteSemana','pruebaFisica','tipoUsuario'],
  };
  (selectIds[seccion] || []).forEach(key => {
    const arr = document.getElementById('arrow-' + key);
    if (arr) arr.style.display = mostrar ? 'block' : 'none';
  });
}

// ── PERMISOS ──────────────────────────────────────────────────
function aplicarPermisos() {
  const role = CURRENT_USER.rolApp;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    const matches = roles.includes(role);
    // Preserve display type
    if (!matches) el.style.display = 'none';
    else if (el.style.display === 'none') el.style.display = '';
  });
  // Ocultar fila rendimiento si no corresponde
  const rowRend = document.getElementById('row-rendimiento');
  if (rowRend) rowRend.style.display = (role === 'Admin' || role === 'SemiAdmin') ? 'flex' : 'none';
}

// ── CHIPS Y SELECTS ───────────────────────────────────────────
const CHIPS_OPTIONS = {
  pronombres:     { multi: true,  ui: 'multiselect', options: ['Él','Ella','Elle','No definido'] },
  estado:         { multi: false, ui: 'select', options: ['Activx','No Activx','Satélite','Ausente','Técnico'] },
  asisteSemana:   { multi: false, ui: 'select', options: ['1 vez','2 veces','3 o más veces','No aplica'] },
  rolJugadorx:    { multi: false, ui: 'select', options: ['Jammer','Bloquer','Blammer','Ref','Coach','Coach/ref','Bench','No definido'] },
  pagaCuota:      { multi: false, ui: 'toggle', options: ['Sí','No'] },
  pruebaFisica:   { multi: false, ui: 'select', options: ['Realizada','No realizada'] },
  aptoDeporte:    { multi: false, ui: 'toggle', options: ['Sí','No'] },
  pais:           { multi: false, ui: 'select', options: ['Ecuador','Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba','El Salvador','Guatemala','Honduras','México','Nicaragua','Panamá','Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela','Canadá','Estados Unidos','Alemania','Francia','España','Italia','Reino Unido','Portugal','Suiza','Países Bajos','Suecia','Rusia','China','Japón','Corea del Sur','India','Israel','Emiratos Árabes Unidos','Arabia Saudita','Australia','Sudáfrica','Nigeria'] },
  codigoPais:     { multi: false, ui: 'select', options: ['🇪🇨 +593','🇦🇷 +54','🇧🇴 +591','🇧🇷 +55','🇨🇱 +56','🇨🇴 +57','🇨🇷 +506','🇨🇺 +53','🇸🇻 +503','🇬🇹 +502','🇭🇳 +504','🇲🇽 +52','🇳🇮 +505','🇵🇦 +507','🇵🇾 +595','🇵🇪 +51','🇵🇷 +1','🇩🇴 +1','🇺🇾 +598','🇻🇪 +58','🇨🇦 +1','🇺🇸 +1','🇩🇪 +49','🇫🇷 +33','🇪🇸 +34','🇮🇹 +39','🇬🇧 +44','🇵🇹 +351','🇨🇭 +41','🇳🇱 +31','🇸🇪 +46','🇷🇺 +7','🇨🇳 +86','🇯🇵 +81','🇰🇷 +82','🇮🇳 +91','🇮🇱 +972','🇦🇪 +971','🇸🇦 +966','🇦🇺 +61','🇿🇦 +27','🇳🇬 +234'] },
  grupoSanguineo: { multi: false, ui: 'select', options: ['A+','A-','AB+','AB-','B+','B-','O+','O-'] },
  mostrarCumple:  { multi: false, ui: 'toggle', options: ['Sí','No'] },
  mostrarEdad:    { multi: false, ui: 'toggle', options: ['Sí','No'] },
  mayor18:        { multi: false, ui: 'toggle', options: ['Sí','No'] },
  tipoUsuario:    { multi: false, ui: 'select', options: ['Admin','SemiAdmin','Invitado'] },
};

// Determina si alguna sección está en modo edición para este campo
function isEditing(id) {
  const seccion = Object.keys(CAMPOS_SECCION).find(s => CAMPOS_SECCION[s].includes(id));
  return seccion ? edicionActiva[seccion] : false;
}

function habilitarChips(id, valorInicial = '') {
  const input = document.getElementById(id);
  if (!input) return;
  const key    = id.replace(/^p-/, '');
  const config = CHIPS_OPTIONS[key];
  if (!config) return;
  input.style.display = 'none';
  const editing = isEditing(id);

  // Buscar o crear wrapper en sec-row-body o directamente en parentNode
  const container = input.closest('.sec-row-body') || input.parentNode;
  let wrapper = container.querySelector('.chip-wrapper');
  if (!wrapper) {
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
    if (!editing) chip.classList.add('opacity-50');
    chip.addEventListener('click', () => {
      if (!isEditing(id)) return;
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

function habilitarMultiSelect(id, valorInicial = '') {
  const input = document.getElementById(id);
  if (!input) return;
  const key    = id.replace(/^p-/, '');
  const config = CHIPS_OPTIONS[key];
  if (!config) return;
  input.style.display = 'none';
  input.style.position = 'absolute';
  input.style.visibility = 'hidden';
  const editing = isEditing(id);

  const container = input.closest('.sec-row-body') || input.parentNode;

  // Remove old trigger if exists
  const oldTrigger = container.querySelector('.multiselect-trigger');
  if (oldTrigger) oldTrigger.remove();

  // Build display value
  const selected = new Set(
    valorInicial ? valorInicial.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  const displayVal = selected.size > 0 ? Array.from(selected).join(', ') : '—';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'multiselect-trigger sec-input' + (editing ? ' multiselect-editable' : '');
  trigger.disabled = !editing;

  // Show value + chevron when editing
  function updateTrigger() {
    const val = input.value ? input.value.split(',').map(v=>v.trim()).filter(Boolean).join(', ') : '—';
    if (editing) {
      trigger.innerHTML = `<span class="ms-value">${val}</span><span class="material-icons ms-arrow">chevron_right</span>`;
    } else {
      trigger.textContent = val;
    }
  }
  input.value = valorInicial;
  updateTrigger();

  container.appendChild(trigger);

  trigger.addEventListener('click', () => {
    if (!isEditing(id)) return;
    const curSelected = new Set(
      input.value ? input.value.split(',').map(v=>v.trim()).filter(Boolean) : []
    );
    abrirMultiSelectModal('Pronombres', config.options, curSelected, (newSelected) => {
      input.value = Array.from(newSelected).join(',');
      updateTrigger();
    });
  });
}

function abrirMultiSelectModal(label, options, curSelected, onConfirm) {
  // Remove existing
  const old = document.getElementById('multiselect-overlay');
  if (old) old.remove();

  const working = new Set(curSelected);

  const overlay = document.createElement('div');
  overlay.id = 'multiselect-overlay';
  overlay.className = 'bs-overlay';

  const panel = document.createElement('div');
  panel.className = 'bs-panel ms-panel';
  panel.innerHTML = `
    <div class="bs-handle"></div>
    <div class="bs-title">${label}</div>
    <div class="ms-options" id="ms-options-list"></div>
    <div class="ms-footer">
      <button class="btn-cancel ms-cancel-btn">Cancelar</button>
      <button class="btn-save ms-confirm-btn">Listo</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  const optsList = panel.querySelector('#ms-options-list');
  function renderOpts() {
    optsList.innerHTML = '';
    options.forEach(opt => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ms-option-row' + (working.has(opt) ? ' ms-selected' : '');
      row.innerHTML = `
        <span class="ms-opt-label">${opt}</span>
        <span class="material-icons ms-check">${working.has(opt) ? 'check_circle' : 'radio_button_unchecked'}</span>
      `;
      row.addEventListener('click', () => {
        if (working.has(opt)) working.delete(opt); else working.add(opt);
        row.className = 'ms-option-row' + (working.has(opt) ? ' ms-selected' : '');
        row.querySelector('.ms-check').textContent = working.has(opt) ? 'check_circle' : 'radio_button_unchecked';
      });
      optsList.appendChild(row);
    });
  }
  renderOpts();

  function cerrar() {
    overlay.classList.remove('active');
    panel.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.remove(); panel.remove(); }, 300);
  }

  overlay.addEventListener('click', cerrar);
  panel.querySelector('.ms-cancel-btn').addEventListener('click', cerrar);
  panel.querySelector('.ms-confirm-btn').addEventListener('click', () => {
    onConfirm(working);
    cerrar();
  });

  requestAnimationFrame(() => {
    overlay.classList.add('active');
    panel.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

function habilitarSelect(id, valorInicial = '') {
  const input = document.getElementById(id);
  const key   = id.replace('p-', '');
  const config = CHIPS_OPTIONS[key];
  if (!config || !input) return;
  const editing = isEditing(id);

  // Label: buscar en sec-row-label o en label
  const rowBody   = input.closest('.sec-row-body');
  const labelEl   = rowBody ? rowBody.querySelector('.sec-row-label') : input.closest('.profile-field')?.querySelector('label');
  const labelText = labelEl ? labelEl.textContent : key;

  input.style.display = 'none';
  input.style.position = 'absolute';
  input.style.visibility = 'hidden';

  let trigger = input.parentNode.querySelector('.custom-select-trigger');
  if (trigger) trigger.remove();

  trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger sec-input';
  trigger.textContent = valorInicial || '—';
  trigger.disabled = !editing;
  input.value = valorInicial;
  input.parentNode.insertBefore(trigger, input.nextSibling);

  trigger.addEventListener('click', () => {
    if (!isEditing(id)) return;
    abrirBottomSheet(labelText, config.options, input.value, opcion => {
      input.value = opcion;
      trigger.textContent = opcion;
    });
  });
}

function habilitarToggle(id, valorInicial = '') {
  const input = document.getElementById(id);
  if (!input) return;
  input.style.display = 'none';
  const editing = isEditing(id);

  // Buscar contenedor (sec-row-toggle o profile-field-toggle)
  const container = input.parentNode;
  let existing = container.querySelector('.toggle-wrap');
  if (existing) existing.remove();

  const isOn = (valorInicial === 'Sí');
  const wrap = document.createElement('div');
  wrap.className = 'toggle-wrap';
  wrap.innerHTML = `
    <button type="button" class="toggle-btn ${isOn ? 'toggle-on' : 'toggle-off'}" aria-pressed="${isOn}">
      <span class="toggle-thumb"></span>
    </button>
  `;
  input.value = valorInicial;
  container.appendChild(wrap);

  const btn = wrap.querySelector('.toggle-btn');
  btn.disabled = !editing;
  btn.addEventListener('click', () => {
    if (!isEditing(id)) return;
    const on = btn.classList.contains('toggle-off');
    btn.classList.toggle('toggle-on', on);
    btn.classList.toggle('toggle-off', !on);
    btn.setAttribute('aria-pressed', on);
    input.value = on ? 'Sí' : 'No';
  });
}

// ── BOTTOM SHEET (selector modal centrado) ────────────────────
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
  const searchWrapper = document.getElementById('bs-search-wrapper');
  title.textContent = label;
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

  const searchEl = document.getElementById('bs-search');
  const nuevoSearch = searchEl.cloneNode(true);
  searchEl.parentNode.replaceChild(nuevoSearch, searchEl);
  nuevoSearch.value = '';
  nuevoSearch.addEventListener('input', () => renderOpciones(nuevoSearch.value));

  requestAnimationFrame(() => {
    const sel = optsEl.querySelector('.selected');
    if (sel) sel.scrollIntoView({ block: 'center' });
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

// ── ARCHIVOS ──────────────────────────────────────────────────
function configurarTodasLasSubidas() {
  configurarUpload('p-adjPruebaFisica', 'prueba', 'adjPruebaFisica');
  configurarUpload('p-adjCedula',       'cedula', 'adjCedula');
  configurarUpload('p-fotoPerfil',      'foto',   'fotoPerfil');
}

function configurarUpload(inputId, tipoArchivo, campoDestino) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Clone input to remove stale event listeners
  const nuevoInput = input.cloneNode(true);
  input.parentNode.replaceChild(nuevoInput, input);
  let inputReal = nuevoInput;
  // Reset value so same file can be selected again
  inputReal.addEventListener('click', () => { inputReal.value = ''; });

  const btnSubir = document.getElementById('btn-subir-' + campoDestino);
  if (btnSubir) btnSubir.onclick = () => {
    const pId = inputId; // e.g. 'p-adjPruebaFisica'
    if (isEditing(pId) || campoDestino === 'fotoPerfil') inputReal.click();
  };

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
        const result = await gasCall('subirArchivo', { base64Data: base64, tipoArchivo, email: CURRENT_USER.email });
        window.myProfile[campoDestino] = result.url;
        renderEstadoArchivo(campoDestino, result.url);
        mostrarExito(campoDestino);
      } catch { mostrarErrorUpload(campoDestino); }
    };
    reader.readAsDataURL(file);
  });
}

function renderEstadoArchivo(campo, url) {
  const contenedor = document.getElementById('estado-' + campo);
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (!url) {
    contenedor.innerHTML = '<span class="file-status-vacio">Sin archivo</span>';
    return;
  }
  const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  let html = `<div class="file-status-ok"><a href="${url}" target="_blank" class="file-link">VER ARCHIVO</a></div>`;
  if (esImagen) html += `<img src="${url}" class="file-preview" alt="Preview">`;
  contenedor.innerHTML = html;
}

function mostrarSubiendo(campo) {
  const el = document.getElementById('upload-status-' + campo);
  if (el) el.innerHTML = '<span>Subiendo...</span>';
}
function mostrarExito(campo) {
  const el = document.getElementById('upload-status-' + campo);
  if (el) { el.innerHTML = '<span class="text-ok">✓ Subido</span>'; setTimeout(() => el.innerHTML = '', 3000); }
}
function mostrarErrorUpload(campo) {
  const el = document.getElementById('upload-status-' + campo);
  if (el) el.innerHTML = '<span class="text-error">Error al subir</span>';
}

// ── FOTO DE PERFIL ────────────────────────────────────────────
function clickEditarFoto() {
  // Foto always editable — no edit mode required
  document.getElementById('p-fotoPerfil')?.click();
}

function abrirFotoSinEdicion() {
  // From hero card: always allowed to change photo
  document.getElementById('p-fotoPerfil')?.click();
}

function setSecAvatarEditable(editable) {
  // The main avatar-container (in hero) is always clickable
  // sec-row-avatar in generales section uses clickEditarFoto() which checks edit mode
}

function renderFotoPerfil(url) {
  const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="#2b2b2b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-size="20" font-family="Arial">Sin foto</text></svg>');
  [document.getElementById('img-preview-foto'), document.getElementById('sec-img-foto')].forEach(img => {
    if (!img) return;
    img.onerror = () => { img.src = placeholder; };
    img.src = url || placeholder;
  });
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
  modal.style.display = 'flex';
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
  document.getElementById('modal-crop').style.display = 'none';
  cropper.destroy(); cropper = null;
  subirImagenRecortada(base64);
}

async function subirImagenRecortada(base64) {
  // Block entire UI while uploading photo
  mostrarCargandoFoto(true);
  fotoSubiendo = true;
  try {
    const result = await gasCall('subirArchivo', { base64Data: base64, tipoArchivo: 'foto', email: CURRENT_USER.email });
    window.myProfile.fotoPerfil = result.url;
    renderFotoPerfil(normalizarDriveUrl(result.url));
  } catch (e) {
    console.error('Error subiendo foto:', e);
    alert('Error al subir la foto. Intenta de nuevo.');
  } finally {
    mostrarCargandoFoto(false);
    fotoSubiendo = false;
  }
}

function mostrarCargandoFoto(show) {
  let el = document.getElementById('foto-upload-blocker');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'foto-upload-blocker';
      el.innerHTML = '<div class="foto-blocker-inner"><div class="foto-blocker-spinner"></div><span>Cargando foto...</span></div>';
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  } else {
    if (el) el.style.display = 'none';
  }
}

function cancelarCrop() {
  if (cropper) { cropper.destroy(); cropper = null; }
  document.getElementById('modal-crop').style.display = 'none';
}
function rotarImagen() { if (cropper) cropper.rotate(90); }

// ── EMAIL WIDTH ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('p-email');
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailInput.value = emailInput.value.replace(/@.*/, '');
      ajustarAnchoEmail();
    });
  }
});

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => initGoogleAuth();
  document.head.appendChild(script);
});

// ── DATE PICKER ───────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

let dpState = {
  visible: false,
  viewYear: 2000, viewMonth: 0,
  selYear: null, selMonth: null, selDay: null,
  yearMode: false,
  onConfirm: null,
};

function parseFecha(str) {
  // Accepts M/D/YYYY or YYYY-MM-DD or DD/MM/YYYY
  if (!str) return null;
  const p1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (p1) return { month: parseInt(p1[1])-1, day: parseInt(p1[2]), year: parseInt(p1[3]) };
  const p2 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (p2) return { month: parseInt(p2[2])-1, day: parseInt(p2[3]), year: parseInt(p2[1]) };
  return null;
}

function formatFecha(y, m, d) {
  // Store as M/D/YYYY (compatible with GAS)
  return `${m+1}/${d}/${y}`;
}

function formatFechaDisplay(y, m, d) {
  return `${d} ${MESES_CORTO[m]} ${y}`;
}

function abrirDatePicker(valorActual, onConfirm) {
  const parsed = parseFecha(valorActual);
  const now = new Date();
  dpState.viewYear  = parsed ? parsed.year  : 1990;
  dpState.viewMonth = parsed ? parsed.month : 0;
  dpState.selYear   = parsed ? parsed.year  : null;
  dpState.selMonth  = parsed ? parsed.month : null;
  dpState.selDay    = parsed ? parsed.day   : null;
  dpState.yearMode  = false;
  dpState.onConfirm = onConfirm;

  renderDatePicker();
  document.getElementById('date-picker-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarDatePicker() {
  document.getElementById('date-picker-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderDatePicker() {
  const { viewYear, viewMonth, selYear, selMonth, selDay, yearMode } = dpState;

  // Header label
  const lbl = document.getElementById('dp-selected-label');
  if (selYear && selMonth !== null && selDay) {
    lbl.textContent = `${selDay} ${MESES[selMonth]} ${selYear}`;
  } else {
    lbl.textContent = 'Sin seleccionar';
  }

  const safeMonth = (typeof viewMonth === 'number' && viewMonth >= 0 && viewMonth <= 11) ? viewMonth : 0;
  document.getElementById('dp-month-label').textContent = MESES[safeMonth] || 'Enero';
  document.getElementById('dp-year-label').textContent  = viewYear || new Date().getFullYear();

  const gridWrap  = document.getElementById('dp-grid-wrap');
  const yearGrid  = document.getElementById('dp-year-grid');
  if (yearMode) {
    gridWrap.style.display = 'none';
    yearGrid.style.display = 'grid';
    renderYearGrid();
  } else {
    gridWrap.style.display = 'block';
    yearGrid.style.display = 'none';
    renderDaysGrid();
  }
}

function renderDaysGrid() {
  const { viewYear, viewMonth, selYear, selMonth, selDay } = dpState;
  const daysEl = document.getElementById('dp-days');
  daysEl.innerHTML = '';

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday-first

  const today = new Date();

  for (let i = 0; i < offset; i++) {
    const blank = document.createElement('div');
    blank.className = 'dp-day dp-other-month';
    daysEl.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dp-day';
    btn.textContent = d;
    const isSelected = selYear === viewYear && selMonth === viewMonth && selDay === d;
    const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
    if (isSelected) btn.classList.add('dp-selected');
    else if (isToday) btn.classList.add('dp-today');
    btn.addEventListener('click', () => {
      dpState.selYear = viewYear; dpState.selMonth = viewMonth; dpState.selDay = d;
      renderDatePicker();
    });
    daysEl.appendChild(btn);
  }
}

function renderYearGrid() {
  const yearGrid = document.getElementById('dp-year-grid');
  yearGrid.innerHTML = '';
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1920; y--) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dp-year-btn' + (y === dpState.viewYear ? ' dp-year-selected' : '');
    btn.textContent = y;
    btn.addEventListener('click', () => {
      dpState.viewYear = y;
      dpState.yearMode = false;
      // ensure viewMonth is still valid
      if (typeof dpState.viewMonth !== 'number' || dpState.viewMonth < 0 || dpState.viewMonth > 11) {
        dpState.viewMonth = 0;
      }
      renderDatePicker();
    });
    yearGrid.appendChild(btn);
  }
  // Scroll to selected
  requestAnimationFrame(() => {
    const sel = yearGrid.querySelector('.dp-year-selected');
    if (sel) sel.scrollIntoView({ block: 'center' });
  });
}

// Wire up date picker events once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dp-prev')?.addEventListener('click', () => {
    dpState.viewMonth--;
    if (dpState.viewMonth < 0) { dpState.viewMonth = 11; dpState.viewYear--; }
    renderDatePicker();
  });
  document.getElementById('dp-next')?.addEventListener('click', () => {
    dpState.viewMonth++;
    if (dpState.viewMonth > 11) { dpState.viewMonth = 0; dpState.viewYear++; }
    renderDatePicker();
  });
  document.getElementById('dp-month-year-btn')?.addEventListener('click', () => {
    dpState.yearMode = !dpState.yearMode;
    renderDatePicker();
  });
  document.getElementById('dp-cancel')?.addEventListener('click', cerrarDatePicker);
  document.getElementById('date-picker-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('date-picker-modal')) cerrarDatePicker();
  });
  document.getElementById('dp-ok')?.addEventListener('click', () => {
    if (!dpState.selYear || dpState.selMonth === null || !dpState.selDay) return;
    const val = formatFecha(dpState.selYear, dpState.selMonth, dpState.selDay);
    if (dpState.onConfirm) dpState.onConfirm(val);
    cerrarDatePicker();
  });
});

// Init date picker trigger for fechaNacimiento
function initFechaTrigger() {
  const input = document.getElementById('p-fechaNacimiento');
  if (!input) return;
  input.style.display = 'none';
  input.style.position = 'absolute';
  input.style.visibility = 'hidden';

  const container = input.closest('.sec-row-body') || input.parentNode;
  let trigger = container.querySelector('.date-picker-trigger');
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'date-picker-trigger';
    container.appendChild(trigger);
  }
  trigger.textContent = input.value || '—';
  trigger.disabled = false; // always clickable

  trigger.addEventListener('click', () => {
    if (!isEditing('p-fechaNacimiento')) return;
    const currentVal = input.value || '';
    abrirDatePicker(currentVal, val => {
      input.value = val;
      trigger.textContent = val || '—';
    });
  });
}

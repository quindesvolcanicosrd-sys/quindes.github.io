// ============================================================
//  QUINDES APP — ajustes.js  (ajustes, privacidad, notificaciones, nav)
// ============================================================

const AJUSTES_KEY = 'quindes_ajustes';

function cargarAjustes() {
  try { return JSON.parse(localStorage.getItem(AJUSTES_KEY) || '{}'); }
  catch { return {}; }
}

function guardarAjuste(key, val) {
  const a = cargarAjustes();
  a[key] = val;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
}

function inicializarAjustes() {
  const a = cargarAjustes();

  aplicarTema(a.tema || 'auto');
  marcarChipActivo('apr-theme-chips', a.tema || 'auto');

  const notifs = a.notificaciones || {};
  ['nuevosEventos','actualizacionesEventos','cancelaciones','cumpleanios','tareas'].forEach(key => {
    const val = notifs[key] !== undefined ? notifs[key] : true;
    sincronizarToggle('toggle-notif-' + key, val);
  });

  verificarEstadoPush();
  actualizarSeccionAdmin();
  inicializarCodigoInvitacion();

  const perfilVisible = getPriv('perfilVisible');
  sincronizarToggle('toggle-priv-perfilVisible',       perfilVisible);
  sincronizarToggle('toggle-priv-mostrarEstadisticas', getPriv('mostrarEstadisticas'));
  actualizarVisibilidadSeccionesPrivacidad(perfilVisible);

  const secContacto = getPriv('seccionContacto');
  sincronizarToggle('toggle-priv-seccion-contacto', secContacto);
  sincronizarToggle('toggle-priv-mostrarEmail',     getPriv('mostrarEmail'));
  sincronizarToggle('toggle-priv-mostrarTelefono',  getPriv('mostrarTelefono'));
  const itemsContacto = document.getElementById('priv-items-contacto');
  if (itemsContacto) { itemsContacto.style.opacity = secContacto ? '1' : '0.4'; itemsContacto.style.pointerEvents = secContacto ? 'auto' : 'none'; }

  const secPersonales = getPriv('seccionPersonales');
  sincronizarToggle('toggle-priv-seccion-personales',  secPersonales);
  sincronizarToggle('toggle-priv-mostrarDocumento',    getPriv('mostrarDocumento'));
  sincronizarToggle('toggle-priv-mostrarNacionalidad', getPriv('mostrarNacionalidad'));
  sincronizarToggle('toggle-mostrarCumple',            getPriv('mostrarCumple'));
  sincronizarToggle('toggle-mostrarEdad',              getPriv('mostrarEdad'));
  const itemsPersonales = document.getElementById('priv-items-personales');
  if (itemsPersonales) { itemsPersonales.style.opacity = secPersonales ? '1' : '0.4'; itemsPersonales.style.pointerEvents = secPersonales ? 'auto' : 'none'; }

  const secSalud = getPriv('seccionSalud');
  sincronizarToggle('toggle-priv-seccion-salud',         secSalud);
  sincronizarToggle('toggle-priv-mostrarEmergencia',     getPriv('mostrarEmergencia'));
  sincronizarToggle('toggle-priv-mostrarGrupoSanguineo', getPriv('mostrarGrupoSanguineo'));
  sincronizarToggle('toggle-priv-mostrarAlergias',       getPriv('mostrarAlergias'));
  sincronizarToggle('toggle-priv-mostrarDieta',          getPriv('mostrarDieta'));
  sincronizarToggle('toggle-priv-mostrarPruebaFisica',   getPriv('mostrarPruebaFisica'));
  const itemsSalud = document.getElementById('priv-items-salud');
  if (itemsSalud) { itemsSalud.style.opacity = secSalud ? '1' : '0.4'; itemsSalud.style.pointerEvents = secSalud ? 'auto' : 'none'; }
}

// ── Código de invitación ──────────────────────────────────────
let _codigoVisible = false;
let _codigoReal    = null;

function inicializarCodigoInvitacion() {
  _codigoReal    = null;
  _codigoVisible = false;
  cargarCodigoDesdeBackend();
}

async function cargarCodigoDesdeBackend() {
  try {
    const data = await apiCall('/codigo-invitacion?equipoId=' + (CURRENT_USER?.equipoId || ''));
    if (data && data.codigo) { _codigoReal = data.codigo; actualizarDisplayCodigo(); }
  } catch(e) {
    _codigoReal = null;
    actualizarDisplayCodigo();
  }
}

function actualizarDisplayCodigo() {
  const displayEl = document.getElementById('inv-codigo-display');
  const linkEl    = document.getElementById('inv-link-display');
  const icoEl     = document.getElementById('inv-toggle-ico');
  if (!displayEl) return;
  if (!_codigoReal) {
    displayEl.textContent = 'Sin código aún';
    if (linkEl) linkEl.textContent = '—';
    return;
  }
  if (_codigoVisible) {
    displayEl.textContent = _codigoReal;
    if (linkEl) linkEl.textContent = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
    if (icoEl)  icoEl.textContent  = 'visibility_off';
  } else {
    displayEl.textContent = '•'.repeat(_codigoReal.length);
    if (linkEl) linkEl.textContent = '••••••••••••••••••••••••';
    if (icoEl)  icoEl.textContent  = 'visibility';
  }
}

function toggleCodigoVisible() {
  if (!_codigoReal) return;
  _codigoVisible = !_codigoVisible;
  actualizarDisplayCodigo();
}

function copiarCodigo() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  navigator.clipboard.writeText(_codigoReal)
    .then(() => mostrarToastGuardado('✅ Código copiado'))
    .catch(() => prompt('Copia este código:', _codigoReal));
}

function compartirLink() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  const url = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
  if (navigator.share) {
    navigator.share({ title: 'Quindes Volcánicos — Invitación', text: '¡Te invito a unirte al equipo Quindes Volcánicos! Usa este link para crear tu perfil:', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => mostrarToastGuardado('✅ Link copiado'))
      .catch(() => prompt('Copia este link:', url));
  }
}

// ── Tema ──────────────────────────────────────────────────────
function setTheme(tema) {
  guardarAjuste('tema', tema);
  aplicarTema(tema);
  marcarChipActivo('apr-theme-chips', tema);
}

function aplicarTema(tema) {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  if (tema === 'light') root.classList.add('theme-light');
  if (tema === 'dark')  root.classList.add('theme-dark');
}

function marcarChipActivo(containerId, valor) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.apr-chip').forEach(btn => {
    const isActive = btn.dataset.theme === valor || btn.dataset.val === valor;
    btn.classList.toggle('active', isActive);
  });
}

// ── Tamaño de texto ───────────────────────────────────────────
let _tamanoOffset = 0;

function aplicarTamanoTexto(offset) {
  _tamanoOffset = offset;
  const pct = 100 + (offset * 5);
  document.documentElement.style.fontSize = pct + '%';
  const el = document.getElementById('apr-size-val');
  if (el) el.textContent = pct + '%';
}

function cambiarTamanoTexto(delta) {
  const a = cargarAjustes();
  const actual = a.tamanoTexto || 0;
  const nuevo  = Math.max(-2, Math.min(4, actual + delta));
  guardarAjuste('tamanoTexto', nuevo);
  aplicarTamanoTexto(nuevo);
}

// ── Alto contraste ────────────────────────────────────────────
function toggleAltoContraste() {
  const a = cargarAjustes();
  const nuevo = !a.altoContraste;
  guardarAjuste('altoContraste', nuevo);
  document.documentElement.classList.toggle('high-contrast', nuevo);
  sincronizarToggle('toggle-alto-contraste', nuevo);
}

// ── Privacidad ────────────────────────────────────────────────
const PRIV_DEFAULTS = {
  perfilVisible:         true,
  mostrarEstadisticas:   true,
  seccionContacto:       true,
  mostrarEmail:          true,
  mostrarTelefono:       true,
  seccionPersonales:     true,
  mostrarDocumento:      false,
  mostrarNacionalidad:   true,
  mostrarCumple:         false,
  mostrarEdad:           false,
  seccionSalud:          false,
  mostrarEmergencia:     false,
  mostrarGrupoSanguineo: false,
  mostrarAlergias:       false,
  mostrarDieta:          false,
  mostrarPruebaFisica:   false,
};

function getPriv(key) {
  const a = cargarAjustes();
  const priv = a.privacidad || {};
  return priv[key] !== undefined ? priv[key] : (PRIV_DEFAULTS[key] !== undefined ? PRIV_DEFAULTS[key] : true);
}

function setPriv(key, val) {
  const a = cargarAjustes();
  const priv = a.privacidad || {};
  priv[key] = val;
  a.privacidad = priv;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
}

function togglePrivacidad(key) {
  const nuevo = !getPriv(key);
  setPriv(key, nuevo);
  sincronizarToggle('toggle-priv-' + key, nuevo);
  if (key === 'perfilVisible') actualizarVisibilidadSeccionesPrivacidad(nuevo);
}

function actualizarVisibilidadSeccionesPrivacidad(perfilVisible) {
  ['priv-bloque-estadisticas','priv-bloque-contacto','priv-bloque-personales','priv-bloque-salud'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.style.opacity       = perfilVisible ? '1'    : '0.35';
    el.style.pointerEvents = perfilVisible ? 'auto' : 'none';
  });
}

function toggleSeccionPriv(seccion) {
  const key   = 'seccion' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
  const nuevo = !getPriv(key);
  setPriv(key, nuevo);
  sincronizarToggle('toggle-priv-seccion-' + seccion, nuevo);
  const items = document.getElementById('priv-items-' + seccion);
  if (items) {
    items.style.opacity       = nuevo ? '1'    : '0.4';
    items.style.pointerEvents = nuevo ? 'auto' : 'none';
  }
}

// ── Notificaciones ────────────────────────────────────────────
function toggleNotif(key) {
  const a = cargarAjustes();
  const notifs = a.notificaciones || {};
  notifs[key] = notifs[key] !== undefined ? !notifs[key] : false;
  a.notificaciones = notifs;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
  sincronizarToggle('toggle-notif-' + key, notifs[key]);
}

async function solicitarPermisoPush() {
  if (!('Notification' in window)) { mostrarToastGuardado('⚠️ Tu navegador no soporta notificaciones'); return; }
  const permiso = await Notification.requestPermission();
  if (permiso === 'granted') {
    guardarAjuste('pushActivo', true);
    document.getElementById('notif-push-banner')?.style.setProperty('display', 'none', 'important');
    mostrarToastGuardado('✅ Notificaciones push activadas');
  } else {
    mostrarToastGuardado('⚠️ Permiso denegado');
  }
}

function verificarEstadoPush() {
  const banner = document.getElementById('notif-push-banner');
  if (!banner) return;
  if (!('Notification' in window)) { banner.style.display = 'none'; return; }
  if (Notification.permission === 'granted') { banner.style.display = 'none'; return; }
  banner.style.display = 'flex';
}

// ── Acerca de ─────────────────────────────────────────────────
function abrirFeedback()   { window.open('mailto:victor@quindesvolcanicos.com?subject=Feedback%20Quindes%20App', '_blank'); }
function abrirDonaciones() { window.open('https://ko-fi.com', '_blank'); }
function abrirTerminos()   { window.open('https://quindesvolcanicos.com/terminos', '_blank'); }

// ── Admin ─────────────────────────────────────────────────────
function actualizarSeccionAdmin() {
  const adminSection = document.getElementById('apariencia-admin-section');
  if (!adminSection) return;
  adminSection.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'block' : 'none';
}

function cambiarLogoEquipo() { mostrarToastGuardado('🚧 Próximamente'); }
function abrirColorPicker()  { mostrarToastGuardado('🚧 Próximamente'); }

// ── Helper toggle ─────────────────────────────────────────────
function sincronizarToggle(wrapperId, isOn) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  const btn = wrap.querySelector('.toggle-btn');
  if (!btn) return;
  btn.classList.toggle('toggle-on',  isOn);
  btn.classList.toggle('toggle-off', !isOn);
  btn.setAttribute('aria-pressed', String(isOn));
}

// ── Bottom Nav ────────────────────────────────────────────────
let _navSeccionActual = 'ajustes';

function navIr(seccion) {
  if (_navSeccionActual === seccion) return;
  _navSeccionActual = seccion;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
  const navEl = document.getElementById('nav-' + seccion);
  if (navEl) { void navEl.offsetWidth; navEl.classList.add('nav-active'); }
  // TODO: mostrar sección correspondiente
}
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
  if (adminSection) adminSection.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'block' : 'none';

  const rowInvitacion = document.querySelector('[onclick="navegarSeccion(\'invitacion\')"]')?.closest('.settings-row');
  if (rowInvitacion) rowInvitacion.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';

  const rowLiga = document.getElementById('row-mi-liga');
  if (rowLiga) rowLiga.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';
}

function cambiarLogoEquipo() { mostrarToastGuardado('🚧 Próximamente'); }
function abrirColorPicker()  { mostrarToastGuardado('🚧 Próximamente'); }

// ── Mi Liga ───────────────────────────────────────────────────
let _ligaData = null;

async function cargarMiLiga() {
  const ligaId = CURRENT_USER?.ligaId;
  if (!ligaId) return;
  try {
    const data = await apiCall(`/liga/${ligaId}`, 'GET');
    _ligaData = data;
    renderMiLiga(data);
  } catch(e) {
    console.error('Error cargando liga:', e);
  }
}

function renderMiLiga(data) {
  const nombreEl = document.getElementById('liga-nombre');
  if (nombreEl) nombreEl.textContent = data.nombre || '—';

  const lista = document.getElementById('liga-equipos-list');
  if (!lista) return;

  if (!data.equipos || data.equipos.length === 0) {
    lista.innerHTML = '<div class="sec-row"><div class="sec-row-body"><span class="sec-row-label" style="opacity:0.5;">No hay equipos aún</span></div></div>';
    return;
  }

  lista.innerHTML = data.equipos.map((eq, i) => {
    const esActivo = eq.id === CURRENT_USER?.equipoId;
    const esBorde  = i === data.equipos.length - 1 ? 'border-bottom:none;' : '';
    return `
      <div class="sec-row" style="${esBorde}">
        <div class="sec-row-body">
          <span class="sec-row-label" style="font-weight:${esActivo ? '700' : '500'};">
            ${eq.nombre}
            ${esActivo ? '<span style="font-size:11px;color:var(--accent);font-weight:600;margin-left:6px;">· Activo</span>' : ''}
          </span>
          <span class="sec-row-sub" style="font-size:12px;margin-top:2px;">
            Código: <strong>${eq.codigo || '—'}</strong>
            ${eq.usosMax ? ` · ${eq.usosActuales}/${eq.usosMax} usos` : ` · ${eq.usosActuales} usos`}
          </span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
          ${!esActivo ? `<button class="inv-btn inv-btn-secondary" style="padding:6px 12px;font-size:12px;min-width:0;" onclick="switchearEquipo('${eq.id}','${eq.nombre}')">Cambiar</button>` : ''}
          <button class="home-btn-delete" style="padding:6px 10px;min-width:0;font-size:12px;" onclick="confirmarEliminarEquipo('${eq.id}','${eq.nombre}')">
            <span class="material-icons" style="font-size:16px;">delete</span>
          </button>
        </div>
      </div>`;
  }).join('');
}

function switchearEquipo(equipoId, nombreEquipo) {
  CURRENT_USER.equipoId = equipoId;
  localStorage.setItem('quindes_equipo_activo', equipoId);
  mostrarToastGuardado(`✅ Ahora gestionás "${nombreEquipo}"`);
  renderMiLiga(_ligaData);
}

function abrirCrearEquipo() {
  const nombre = prompt('Nombre del nuevo equipo:');
  if (!nombre || !nombre.trim()) return;
  crearEquipo(nombre.trim());
}

async function crearEquipo(nombre) {
  try {
    const result = await apiCall('/crear-equipo', 'POST', {
      nombre,
      ligaId: CURRENT_USER?.ligaId,
    });
    if (!result?.ok) throw new Error('Error creando equipo');
    _ligaData.equipos.push(result.equipo);
    renderMiLiga(_ligaData);
    mostrarToastGuardado(`✅ Equipo "${nombre}" creado`);
  } catch(e) {
    mostrarToastGuardado('❌ Error al crear el equipo');
    console.error(e);
  }
}

function confirmarEliminarEquipo(equipoId, nombreEquipo) {
  if (!confirm(`¿Eliminar el equipo "${nombreEquipo}"? Esto borrará todos sus miembros, perfiles y datos. Esta acción no se puede deshacer.`)) return;
  eliminarEquipo(equipoId, nombreEquipo);
}

async function eliminarEquipo(equipoId, nombreEquipo) {
  try {
    await apiCall(`/equipo/${equipoId}`, 'DELETE');
    _ligaData.equipos = _ligaData.equipos.filter(e => e.id !== equipoId);
    renderMiLiga(_ligaData);
    mostrarToastGuardado(`✅ Equipo "${nombreEquipo}" eliminado`);
  } catch(e) {
    mostrarToastGuardado('❌ Error al eliminar el equipo');
    console.error(e);
  }
}

function confirmarEliminarLiga() {
  const nombre = _ligaData?.nombre || 'la liga';
  if (!confirm(`⚠️ ¿Eliminar "${nombre}" y TODOS sus datos?\n\nEsto borrará equipos, miembros, perfiles, entrenamientos y toda la información. Esta acción es IRREVERSIBLE.`)) return;
  if (!confirm(`Confirmación final: ¿estás segura de que querés eliminar "${nombre}" para siempre?`)) return;
  eliminarLiga();
}

async function eliminarLiga() {
  try {
    await apiCall(`/liga/${CURRENT_USER?.ligaId}`, 'DELETE');
    mostrarToastGuardado('Liga eliminada');
    setTimeout(() => cerrarSesion(), 1500);
  } catch(e) {
    mostrarToastGuardado('❌ Error al eliminar la liga');
    console.error(e);
  }
}

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
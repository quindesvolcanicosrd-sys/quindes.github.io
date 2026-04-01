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
  if (itemsContacto) itemsContacto.classList.toggle('is-disabled', !secContacto);

  const secPersonales = getPriv('seccionPersonales');
  sincronizarToggle('toggle-priv-seccion-personales',  secPersonales);
  sincronizarToggle('toggle-priv-mostrarDocumento',    getPriv('mostrarDocumento'));
  sincronizarToggle('toggle-priv-mostrarNacionalidad', getPriv('mostrarNacionalidad'));
  sincronizarToggle('toggle-mostrarCumple',            getPriv('mostrarCumple'));
  sincronizarToggle('toggle-mostrarEdad',              getPriv('mostrarEdad'));
  const itemsPersonales = document.getElementById('priv-items-personales');
  if (itemsPersonales) itemsPersonales.classList.toggle('is-disabled', !secPersonales);

  
  const secSalud = getPriv('seccionSalud');
  sincronizarToggle('toggle-priv-seccion-salud',         secSalud);
  sincronizarToggle('toggle-priv-mostrarEmergencia',     getPriv('mostrarEmergencia'));
  sincronizarToggle('toggle-priv-mostrarGrupoSanguineo', getPriv('mostrarGrupoSanguineo'));
  sincronizarToggle('toggle-priv-mostrarAlergias',       getPriv('mostrarAlergias'));
  sincronizarToggle('toggle-priv-mostrarDieta',          getPriv('mostrarDieta'));
  sincronizarToggle('toggle-priv-mostrarPruebaFisica',   getPriv('mostrarPruebaFisica'));
  const itemsSalud = document.getElementById('priv-items-salud');
  if (itemsSalud) itemsSalud.classList.toggle('is-disabled', !secSalud);

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

function copiarLink() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  const url = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
  navigator.clipboard.writeText(url)
    .then(() => mostrarToastGuardado('✅ Link copiado'))
    .catch(() => prompt('Copia este link:', url));
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

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1-l);
  const f = n => l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
  return '#' + [f(0),f(8),f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function aplicarColorPrimario(hex, conFade = false) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const [h, s, l] = hexToHsl(hex);
  const root = document.documentElement;
  const appEl = document.getElementById('appContent');

  if (conFade && appEl && appEl.classList.contains('visible')) {
    appEl.classList.add('color-transition-out');
    setTimeout(() => {
      _aplicarTokensColor(hex, h, s, l, root);
      root.dataset.colorPrimario = hex;
      appEl.classList.remove('color-transition-out');
    }, 250);
    return;
  }
  _aplicarTokensColor(hex, h, s, l, root);
  root.dataset.colorPrimario = hex;
}

function _aplicarTokensColor(hex, h, s, l, root) {

  // Acento principal y variante oscura
  const accent        = hex;
  const accent2       = hslToHex(h, s, Math.max(l - 10, 10));

  // Gradiente botones primarios
  const gradFrom      = hslToHex(h, Math.min(s + 5, 100), Math.min(l + 6, 90));
  const gradTo        = hslToHex(h, s, Math.max(l - 14, 10));

  // Tokens con opacidad (como rgba)
  const toRgb = hx => [parseInt(hx.slice(1,3),16), parseInt(hx.slice(3,5),16), parseInt(hx.slice(5,7),16)];
  const [ar, ag, ab] = toRgb(accent);

  // Dark mode tokens
  const bgDark        = hslToHex(h, Math.min(s, 40), 8);
  const cardDark      = hslToHex(h, Math.min(s, 35), 11);
  const card2Dark     = hslToHex(h, Math.min(s, 30), 14);

  // Light mode tokens
  const bgLight       = hslToHex(h, Math.min(s, 30), 97);
  const cardLight     = '#ffffff';
  const card2Light    = hslToHex(h, Math.min(s, 25), 95);
  const accentLight   = hslToHex(h, Math.min(s, 80), Math.max(l - 8, 25));
  const accent2Light  = hslToHex(h, Math.min(s, 80), Math.max(l - 14, 18));

  const isDark = root.classList.contains('theme-dark') ||
    (!root.classList.contains('theme-light') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Color "ok" — complementario armónico (120° de distancia)
  const hOk = (h + 120) % 360;

  if (isDark) {
    root.style.setProperty('--badge-ok-color',  hslToHex(hOk, 70, 72));
    root.style.setProperty('--badge-ok-bg',     `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,70,72).slice(1+i*2,3+i*2),16)).join(',')},0.16)`);
    root.style.setProperty('--badge-ok-border', `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,70,72).slice(1+i*2,3+i*2),16)).join(',')},0.35)`);
    root.style.setProperty('--text2',                hslToHex(h, Math.min(s, 35), 63));
    root.style.setProperty('--text3',                hslToHex(h, Math.min(s, 28), 45));
    root.style.setProperty('--text4',                hslToHex(h, Math.min(s, 22), 35));
    root.style.setProperty('--label',                hslToHex(h, Math.min(s, 35), 63));
    root.style.setProperty('--accent',               accent);
    root.style.setProperty('--accent2',              accent2);
    root.style.setProperty('--accent-dim',           `rgba(${ar},${ag},${ab},0.18)`);
    root.style.setProperty('--accent-gradient-from', gradFrom);
    root.style.setProperty('--accent-gradient-to',   gradTo);
    root.style.setProperty('--bg',                   bgDark);
    root.style.setProperty('--card',                 cardDark);
    root.style.setProperty('--card2',                card2Dark);
    root.style.setProperty('--border',               `rgba(${ar},${ag},${ab},0.18)`);
    root.style.setProperty('--border2',              `rgba(${ar},${ag},${ab},0.12)`);
    root.style.setProperty('--border3',              `rgba(${ar},${ag},${ab},0.07)`);
    root.style.setProperty('--chip-bg',              `rgba(${ar},${ag},${ab},0.08)`);
    root.style.setProperty('--stat-bg',              `rgba(${ar},${ag},${ab},0.06)`);
    root.style.setProperty('--section-hd',           `rgba(${ar},${ag},${ab},0.05)`);
    root.style.setProperty('--header-bg',            `rgba(${ar},${ag},${ab},0.10)`);
  } else {
    const [alr, alg, alb] = toRgb(accentLight);
    root.style.setProperty('--badge-ok-color',  hslToHex(hOk, 60, 35));
    root.style.setProperty('--badge-ok-bg',     `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,60,35).slice(1+i*2,3+i*2),16)).join(',')},0.12)`);
    root.style.setProperty('--badge-ok-border', `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,60,35).slice(1+i*2,3+i*2),16)).join(',')},0.30)`);
    root.style.setProperty('--text2',                hslToHex(h, Math.min(s, 50), 38));
    root.style.setProperty('--text3',                hslToHex(h, Math.min(s, 40), 55));
    root.style.setProperty('--text4',                hslToHex(h, Math.min(s, 30), 69));
    root.style.setProperty('--label',                hslToHex(h, Math.min(s, 40), 55));
    root.style.setProperty('--accent',               accentLight);
    root.style.setProperty('--accent2',              accent2Light);
    root.style.setProperty('--accent-dim',           `rgba(${alr},${alg},${alb},0.10)`);
    root.style.setProperty('--accent-gradient-from', hslToHex(h, Math.min(s+5,100), Math.max(l-6,20)));
    root.style.setProperty('--accent-gradient-to',   hslToHex(h, s, Math.max(l-18,12)));
    root.style.setProperty('--bg',                   bgLight);
    root.style.setProperty('--card',                 cardLight);
    root.style.setProperty('--card2',                card2Light);
    root.style.setProperty('--border',               `rgba(${alr},${alg},${alb},0.15)`);
    root.style.setProperty('--border2',              `rgba(${alr},${alg},${alb},0.10)`);
    root.style.setProperty('--border3',              `rgba(${alr},${alg},${alb},0.06)`);
    root.style.setProperty('--chip-bg',              `rgba(${alr},${alg},${alb},0.07)`);
    root.style.setProperty('--stat-bg',              `rgba(${alr},${alg},${alb},0.05)`);
    root.style.setProperty('--section-hd',           `rgba(${alr},${alg},${alb},0.04)`);
    root.style.setProperty('--header-bg',            `rgba(${alr},${alg},${alb},0.08)`);
  }

  }

function aplicarTema(tema) {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  if (tema === 'light') root.classList.add('theme-light');
  if (tema === 'dark')  root.classList.add('theme-dark');
  // Re-derivar tokens si ya hay un color primario guardado
  const colorGuardado = root.dataset.colorPrimario;
  if (colorGuardado) aplicarColorPrimario(colorGuardado, true);
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
    el.classList.toggle('is-disabled', !perfilVisible);
  });
}

function toggleSeccionPriv(seccion) {
  const key   = 'seccion' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
  const nuevo = !getPriv(key);
  setPriv(key, nuevo);
  sincronizarToggle('toggle-priv-seccion-' + seccion, nuevo);
  const items = document.getElementById('priv-items-' + seccion);
  if (items) {
    items.classList.toggle('is-disabled', !nuevo);
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

  const rowInvitacion = document.querySelector('[onclick="navegarSeccion(\'invitacion\')"]')?.closest('.sec-row');  if (rowInvitacion) rowInvitacion.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';

  const rowLiga = document.getElementById('row-mi-liga');
  if (rowLiga) rowLiga.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';
}

function cambiarLogoEquipo() { mostrarToastGuardado('🚧 Próximamente'); }
const COLOR_PICKER_PRESETS = [
  '#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#14b8a6','#f43f5e','#a855f7','#64748b',
];

let _cpColorActual = '#ef4444';
let _cpColorOriginal = '#ef4444';

function abrirColorPicker() {
  _cpColorOriginal = document.documentElement.dataset.colorPrimario || '#ef4444';
  _cpColorActual   = _cpColorOriginal;

  // Renderizar swatches
  const wrap = document.getElementById('color-picker-swatches');
  wrap.innerHTML = COLOR_PICKER_PRESETS.map(c => `
    <button class="color-swatch-btn ${c === _cpColorActual ? 'selected' : ''}"
      style="background:${c}"
      onclick="seleccionarColorPreset('${c}')"
      data-color="${c}">
    </button>
  `).join('');

  // Sincronizar custom picker
  const input = document.getElementById('color-picker-input');
  input.value = _cpColorActual;
  document.getElementById('color-picker-custom-preview').style.background = _cpColorActual;
  document.getElementById('color-picker-custom-hex').textContent = _cpColorActual;

  input.oninput = (e) => {
    _cpColorActual = e.target.value;
    document.getElementById('color-picker-custom-preview').style.background = _cpColorActual;
    document.getElementById('color-picker-custom-hex').textContent = _cpColorActual;
    actualizarSwatchesSeleccion(_cpColorActual);
    aplicarColorPrimario(_cpColorActual);
  };

  mostrarFooterColorPicker();

  const overlay = document.getElementById('color-picker-overlay');
  const sheet   = document.getElementById('color-picker-sheet');
  overlay.style.pointerEvents = 'all';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
    sheet.classList.add('visible');
  }));
}

function seleccionarColorPreset(color) {
  _cpColorActual = color;
  actualizarSwatchesSeleccion(color);
  document.getElementById('color-picker-input').value = color;
  document.getElementById('color-picker-custom-preview').style.background = color;
  document.getElementById('color-picker-custom-hex').textContent = color;
  aplicarColorPrimario(color);
}

function actualizarSwatchesSeleccion(color) {
  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
}

function mostrarFooterColorPicker() {
  document.getElementById('color-picker-footer').innerHTML = `
    <button class="btn-cancel" onclick="cerrarColorPicker()">Cancelar</button>
    <button class="btn-save"   onclick="guardarColorPrimario()">Aplicar</button>
  `;
}

function cerrarColorPicker(e) {
  if (e && e.target !== document.getElementById('color-picker-overlay')) return;
  // Revertir preview si cancela
  aplicarColorPrimario(_cpColorOriginal);
  const overlay = document.getElementById('color-picker-overlay');
  const sheet   = document.getElementById('color-picker-sheet');
  overlay.classList.remove('visible');
  sheet.classList.remove('visible');
  setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 300);
}

async function guardarColorPrimario() {
  const equipoId = CURRENT_USER?.equipoId;
  if (!equipoId) return;

  // Mostrar spinner
  document.getElementById('color-picker-footer').innerHTML = `
    <div class="color-picker-saving">
      <div class="color-picker-spinner"></div>
      Guardando color…
    </div>
  `;

  try {
    await apiCall(`/equipo/${equipoId}/color`, 'PUT', { color: _cpColorActual });
    // Actualizar swatch en la fila de ajustes
    const swatch = document.getElementById('apr-color-swatch');
    if (swatch) swatch.style.background = _cpColorActual;
    // Cerrar y confirmar
    const overlay = document.getElementById('color-picker-overlay');
    const sheet   = document.getElementById('color-picker-sheet');
    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    setTimeout(() => {
      overlay.style.pointerEvents = 'none';
      mostrarToastGuardado('Color actualizado ✓');
    }, 300);
  } catch(e) {
    mostrarFooterColorPicker();
    mostrarToastGuardado('Error al guardar el color');
  }
}

// ── Mi Liga ───────────────────────────────────────────────────
let _ligaData = null;

async function cargarMiLiga({ render = true } = {}) {
  const ligaId = CURRENT_USER?.ligaId;
  if (!ligaId) return;
  try {
    const data = await apiCall(`/liga/${ligaId}`, 'GET');
    _ligaData = data;
    if (render) renderMiLiga(data);
  } catch(e) {
    console.error('Error cargando liga:', e);
  }
}

function renderMiLiga(data) {
  const nombreEl = document.getElementById('liga-nombre');
  if (nombreEl) {
    nombreEl.textContent = data.nombre || '—';
    nombreEl.classList.add('liga-nombre-editable');
    nombreEl.onclick = () => editarNombreLiga(data);
  }

  const lista = document.getElementById('liga-equipos-list');
  if (!lista) return;

  if (!data.equipos || data.equipos.length === 0) {
    lista.innerHTML = '<div class="sec-row"><div class="sec-row-body"><span class="sec-row-label equipo-empty-label">No hay equipos aún</span></div></div>';    return;
  }

  lista.innerHTML = data.equipos.map((eq) => {
    const esActivo = eq.id === CURRENT_USER?.equipoId;
    return `
      <div class="equipo-item">
        <div class="equipo-header">
          <span class="equipo-nombre ${esActivo ? 'equipo-nombre--activo' : ''}"
                onclick="editarNombreEquipo(${JSON.stringify(eq).replace(/"/g,'&quot;')})">
            ${eq.nombre}
            ${esActivo ? '<span class="equipo-activo-badge">· Activo</span>' : ''}
          </span>
          <button class="equipo-btn-delete" onclick="confirmarEliminarEquipo('${eq.id}','${eq.nombre}')">
            <span class="material-icons">delete</span>
          </button>
        </div>
        <div class="equipo-footer">
          <span class="equipo-codigo">
            🔑 <strong>${eq.codigo || '—'}</strong>
            <span class="equipo-codigo-sep">·</span>
            ${eq.usosMax ? `${eq.usosActuales}/${eq.usosMax} usos` : `${eq.usosActuales} usos`}
          </span>
          ${!esActivo ? `<button class="equipo-btn-gestionar" onclick="switchearEquipo('${eq.id}','${eq.nombre}')">Gestionar</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function editarNombreLiga(data) {
  abrirEditSheetGenerico('Nombre de la liga', data.nombre, async (nuevo) => {
    await apiCall(`/liga/${data.id}/nombre`, 'PUT', { nombre: nuevo });
    data.nombre = nuevo;
    renderMiLiga(data);
    mostrarToastGuardado('✅ Nombre de liga actualizado');
  });
}

function editarNombreEquipo(eq) {
  abrirEditSheetGenerico('Nombre del equipo', eq.nombre, async (nuevo) => {
    await apiCall(`/equipo/${eq.id}/nombre`, 'PUT', { nombre: nuevo });
    eq.nombre = nuevo;
    renderMiLiga(_ligaData);
    mostrarToastGuardado('✅ Nombre de equipo actualizado');
  });
}

function abrirEditSheetGenerico(label, valorActual, onGuardar) {
  const overlay = document.createElement('div');
  overlay.className = 'edit-field-overlay';
  overlay.innerHTML = `
    <div class="edit-field-sheet" id="edit-generic-sheet">
      <div class="edit-field-handle"></div>
      <div class="edit-field-header">
        <span class="edit-field-label">${label}</span>
        <button class="edit-field-close" onclick="this.closest('.edit-field-overlay').remove()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="edit-field-body">
        <input id="edit-generic-input" type="text" class="edit-field-input" value="${valorActual || ''}" placeholder="${label}">
      </div>
      <div style="padding:12px 0 0;">
        <button id="edit-generic-save" style="width:100%;padding:17px;border-radius:16px;border:none;background:var(--accent);color:#fff;font-size:16px;font-weight:700;font-family:var(--font);cursor:pointer;-webkit-tap-highlight-color:transparent;">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    document.getElementById('edit-generic-sheet')?.classList.add('visible');
  });
  const input = document.getElementById('edit-generic-input');
  setTimeout(() => input?.focus(), 300);
  document.getElementById('edit-generic-save').onclick = async () => {
    const nuevo = input.value.trim();
    if (!nuevo) { mostrarToastGuardado('⚠️ El nombre no puede estar vacío'); return; }
    if (nuevo === valorActual) { overlay.remove(); return; }
    try {
      await onGuardar(nuevo);
    } catch(e) {
      mostrarToastGuardado('❌ Error al guardar');
    }
    overlay.remove();
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function switchearEquipo(equipoId, nombreEquipo) {
  CURRENT_USER.equipoId = equipoId;
  localStorage.setItem('quindes_equipo_activo', equipoId);
  mostrarToastGuardado(`✅ Ahora gestionás "${nombreEquipo}"`);
  renderMiLiga(_ligaData);
}

// ── Wizard Crear Equipo ───────────────────────────────────────
let _wizEquipo = { nombre: '', categoria: '', logoBase64: null };
let _wizEquipoPaso = 1;

function abrirCrearEquipo() {
  _wizEquipo = { nombre: '', categoria: '', logoBase64: null };
  _wizEquipoPaso = 1;

  const overlay = document.createElement('div');
  overlay.id = 'wiz-equipo-overlay';
  overlay.className = 'wiz-equipo-overlay';
  overlay.innerHTML = `
    <header class="wiz-equipo-header">
      <button onclick="cerrarWizEquipo()" class="wiz-eq-close-btn">
        <span class="material-icons">close</span>
      </button>
      <span id="wiz-eq-paso-label" class="wiz-eq-paso-label">Paso 1 de 3</span>
      <div class="wiz-equipo-progress">
        <div id="wiz-eq-progress" class="wiz-equipo-progress-bar" style="width:33%;"></div>
      </div>
    </header>
    <div id="wiz-eq-contenido" class="wiz-equipo-contenido"></div>
    <div class="wiz-equipo-footer">
      <button id="wiz-eq-btn-back" onclick="wizEquipoPasoAnterior()" class="wiz-eq-btn-back" style="display:none;">Atrás</button>
      <button id="wiz-eq-btn-next" onclick="wizEquipoPasoSiguiente()" class="wiz-eq-btn-next">Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
  }));
  renderWizEquipoPaso(1);
}

function cerrarWizEquipo() {
  const overlay = document.getElementById('wiz-equipo-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 350);
}

function renderWizEquipoPaso(paso) {
  _wizEquipoPaso = paso;
  const contenido = document.getElementById('wiz-eq-contenido');
  const btnBack   = document.getElementById('wiz-eq-btn-back');
  const btnNext   = document.getElementById('wiz-eq-btn-next');
  const pasoLabel = document.getElementById('wiz-eq-paso-label');
  const progress  = document.getElementById('wiz-eq-progress');
  if (!contenido) return;

  if (btnBack) btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = `Paso ${paso} de 3`;
  if (progress) progress.style.width = (paso / 3 * 100) + '%';
  if (btnNext) btnNext.textContent = paso === 3 ? 'Crear equipo' : 'Continuar';

  if (paso === 1) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🛼</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Cómo se llama tu equipo?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Este será el nombre que verán todas las integrantes.</p>
      </div>
      <input id="wiz-eq-nombre" type="text" placeholder="Nombre del equipo" value="${_wizEquipo.nombre}"
        style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:17px;font-weight:600;box-sizing:border-box;outline:none;text-align:center;"
        oninput="_wizEquipo.nombre=this.value">
    `;
    setTimeout(() => document.getElementById('wiz-eq-nombre')?.focus(), 100);
  }

  if (paso === 2) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🏆</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Qué categoría es tu equipo?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Seleccioná la categoría en la que compite tu equipo.</p>
      </div>
      <div style="display:flex;gap:12px;width:100%;justify-content:center;">
        ${['A','B','C'].map(cat => `
          <button onclick="seleccionarCategoriaEquipo('${cat}')"
            id="wiz-eq-cat-${cat}"
            style="flex:1;padding:20px 8px;border-radius:16px;border:2px solid ${_wizEquipo.categoria === cat ? 'var(--accent)' : 'var(--border)'};
                   background:${_wizEquipo.categoria === cat ? 'var(--accent)' : 'var(--card)'};
                   color:${_wizEquipo.categoria === cat ? '#fff' : 'var(--text)'};
                   font-size:22px;font-weight:800;cursor:pointer;transition:all 0.2s ease;">
            ${cat}
          </button>`).join('')}
      </div>
    `;
  }

  if (paso === 3) {
    const preview = _wizEquipo.logoBase64
      ? `<img src="${_wizEquipo.logoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🎨</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¡Poné personalidad Derby!</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Subí el logo de tu equipo. Podés cambiarlo después.</p>
      </div>
      <label style="width:120px;height:120px;border-radius:20px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;background:var(--card);" id="wiz-eq-logo-label">
        ${preview}
        <input type="file" accept="image/*" style="display:none;" onchange="previewLogoEquipo(this)">
      </label>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — podés saltarte este paso</p>
    `;
    if (btnNext) btnNext.textContent = 'Crear equipo 🛼';
  }
}

function seleccionarCategoriaEquipo(cat) {
  _wizEquipo.categoria = cat;
  ['A','B','C'].forEach(c => {
    const btn = document.getElementById('wiz-eq-cat-' + c);
    if (!btn) return;
    const activo = c === cat;
    btn.style.borderColor = activo ? 'var(--accent)' : 'var(--border)';
    btn.style.background  = activo ? 'var(--accent)' : 'var(--card)';
    btn.style.color       = activo ? '#fff' : 'var(--text)';
  });
}

function previewLogoEquipo(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizEquipo.logoBase64 = e.target.result;
    const label = document.getElementById('wiz-eq-logo-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewLogoEquipo(this)">`;
  };
  reader.readAsDataURL(file);
}

function wizEquipoPasoSiguiente() {
  if (_wizEquipoPaso === 1) {
    if (!_wizEquipo.nombre.trim()) { mostrarToastGuardado('⚠️ Escribí el nombre del equipo'); return; }
  }
  if (_wizEquipoPaso === 2) {
    if (!_wizEquipo.categoria) { mostrarToastGuardado('⚠️ Seleccioná una categoría'); return; }
  }
  if (_wizEquipoPaso === 3) {
    crearEquipo(); return;
  }
  renderWizEquipoPaso(_wizEquipoPaso + 1);
}

function wizEquipoPasoAnterior() {
  if (_wizEquipoPaso > 1) renderWizEquipoPaso(_wizEquipoPaso - 1);
}

async function crearEquipo() {
  const btnNext = document.getElementById('wiz-eq-btn-next');
  if (btnNext) { btnNext.disabled = true; btnNext.textContent = 'Creando…'; }
  try {
    const result = await apiCall('/crear-equipo', 'POST', {
      nombre:      _wizEquipo.nombre.trim(),
      ligaId:      CURRENT_USER?.ligaId,
      categoria:   _wizEquipo.categoria,
      logoBase64:  _wizEquipo.logoBase64,
      email:       CURRENT_USER?.email,
    });
    if (!result?.ok) throw new Error('Error creando equipo');
    _ligaData.equipos.push(result.equipo);
    cerrarWizEquipo();
    setTimeout(() => {
      renderMiLiga(_ligaData);
      mostrarEquipoCreado(result.equipo);
    }, 400);
  } catch(e) {
    mostrarToastGuardado('❌ Error al crear el equipo');
    if (btnNext) { btnNext.disabled = false; btnNext.textContent = 'Crear equipo'; }
    console.error(e);
  }
}

function mostrarEquipoCreado(equipo) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-fullscreen-success';
  overlay.innerHTML = `
    <div style="text-align:center;max-width:320px;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:64px;animation:wiz-fade-up 0.5s ease 0.1s both;">🎉</div>
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0;animation:wiz-fade-up 0.5s ease 0.2s both;">¡Equipo creado!</h2>
      <p style="font-size:15px;color:var(--text2);line-height:1.6;margin:0;animation:wiz-fade-up 0.5s ease 0.3s both;">
        <strong style="color:var(--text);">${equipo.nombre}</strong> está listo. Ahora puedes invitar integrantes compartiendo el código:
      </p>
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:16px 24px;animation:wiz-fade-up 0.5s ease 0.4s both;">
        <p style="font-size:12px;color:var(--text3);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Código de invitación</p>
        <p id="equipo-creado-codigo" style="font-size:28px;font-weight:900;color:var(--accent);margin:0;letter-spacing:0.1em;">${equipo.codigo}</p>
        <button id="equipo-creado-copiar" style="margin-top:10px;padding:8px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--card2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;">
          Copiar código
        </button>
      </div>
      <p style="font-size:12px;color:var(--text3);margin:0;animation:wiz-fade-up 0.5s ease 0.5s both;">Puedes gestionar este equipo desde Mi Liga en Ajustes.</p>
      <button id="equipo-creado-listo"
        style="margin-top:8px;padding:14px 32px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:15px;font-weight:700;cursor:pointer;animation:wiz-fade-up 0.5s ease 0.6s both;width:100%;">
        ¡Listo!
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.classList.add('visible'); }));

  document.getElementById('equipo-creado-listo').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 350);
  };

  document.getElementById('equipo-creado-copiar').onclick = () => {
    navigator.clipboard.writeText(equipo.codigo).then(() => {
      mostrarToastGuardado('✅ Código copiado');
    }).catch(() => {
      mostrarToastGuardado('❌ No se pudo copiar');
    });
  };
}

function mostrarModalConfirmacion({ emoji, titulo, mensaje, labelConfirmar, onConfirmar }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-confirm-overlay';
  overlay.innerHTML = `
    <div class="modal-confirm-sheet" id="modal-confirm-sheet">
      <div class="modal-confirm-emoji">${emoji}</div>
      <h2 class="modal-confirm-title">${titulo}</h2>
      <p class="modal-confirm-msg">${mensaje}</p>
      <button id="modal-confirm-btn" class="modal-confirm-btn-primary">${labelConfirmar}</button>
      <button id="modal-cancel-btn" class="modal-confirm-btn-secondary">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const sheet = document.getElementById('modal-confirm-sheet');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
    sheet.classList.add('visible');
  }));
  const cerrar = () => {
    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    setTimeout(() => overlay.remove(), 280);
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
  document.getElementById('modal-cancel-btn').onclick = cerrar;
  document.getElementById('modal-confirm-btn').onclick = () => { cerrar(); setTimeout(onConfirmar, 350); };
}

function confirmarEliminarEquipo(equipoId, nombreEquipo) {
  mostrarModalConfirmacion({
    emoji: '⚠️',
    titulo: `¿Eliminar "${nombreEquipo}"?`,
    mensaje: 'Esto borrará todos sus miembros, perfiles y datos. Esta acción no se puede deshacer.',
    labelConfirmar: 'Sí, eliminar equipo',
    onConfirmar: () => eliminarEquipo(equipoId, nombreEquipo),
  });
}

async function eliminarEquipo(equipoId, nombreEquipo) {
  const item = document.querySelector(`.equipo-btn-delete[onclick*="${equipoId}"]`)?.closest('.equipo-item');
  if (item) {
    item.classList.add('is-disabled');
    const footer = item.querySelector('.equipo-footer');
    if (footer) footer.innerHTML = '<span class="sec-val-saving">Eliminando…</span>';
  }
  try {
    await apiCall(`/equipo/${equipoId}`, 'DELETE');
    _ligaData.equipos = _ligaData.equipos.filter(e => e.id !== equipoId);
    renderMiLiga(_ligaData);
    mostrarToastGuardado(`✅ Equipo "${nombreEquipo}" eliminado`);
  } catch(e) {
    mostrarToastGuardado('❌ Error al eliminar el equipo');
    if (item) {
      item.classList.remove('is-disabled');
      renderMiLiga(_ligaData);
    }
    console.error(e);
  }
}

function confirmarEliminarLiga() {
  const nombre = _ligaData?.nombre || 'la liga';
  mostrarModalConfirmacion({
    emoji: '⚠️',
    titulo: `¿Eliminar "${nombre}" y TODOS sus datos?`,
    mensaje: 'Esto borrará equipos, miembros, perfiles, entrenamientos y toda la información. Esta acción es IRREVERSIBLE.',
    labelConfirmar: 'Sí, eliminar liga para siempre',
    onConfirmar: () => eliminarLiga(),
  });
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
// ── Wizard Crear Liga ─────────────────────────────────────────
let _wizLiga = { nombreLiga: '', ligaImagenBase64: null, nombreEquipo: '', categoria: '', logoBase64: null };
let _wizLigaPaso = 1;
const _WIZ_LIGA_TOTAL = 10;

function mostrarWizardLiga() {
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  _wizLiga = { nombreLiga: '', ligaImagenBase64: null, nombreEquipo: '', categoria: '', logoBase64: null, pais: '', ciudad: '', anioFundacion: '', descripcion: '', contacto: '', contactoCodigo: '🇪🇨 +593', nombre: '', pronombres: [], paisPerfil: '', codigoPais: '', telefono: '', fechaNacimiento: '', nombreDerby: '', numeroDerby: '', rolJugadorx: '', asisteSemana: '', alergias: '', dieta: '', contactoEmergencia: '', fotoBase64: null };
  _wizLigaPaso = 0;

  const overlay = document.createElement('div');
  overlay.id = 'wiz-liga-overlay';
  overlay.className = 'wiz-equipo-overlay';
  overlay.innerHTML = `
    <header class="wiz-equipo-header">
      <button onclick="cerrarWizLiga()" class="wiz-eq-close-btn">
        <span class="material-icons">close</span>
      </button>
      <span id="wiz-liga-paso-label" class="wiz-eq-paso-label">Paso 1 de ${_WIZ_LIGA_TOTAL}</span>
      <div class="wiz-equipo-progress">
        <div id="wiz-liga-progress" class="wiz-equipo-progress-bar" style="width:${100/_WIZ_LIGA_TOTAL}%;"></div>
      </div>
    </header>
    <div id="wiz-liga-contenido" class="wiz-equipo-contenido"></div>
    <div class="wiz-equipo-footer">
      <button id="wiz-liga-btn-back" onclick="wizLigaPasoAnterior()" class="wiz-eq-btn-back" style="display:none;">Atrás</button>
      <button id="wiz-liga-btn-next" onclick="wizLigaPasoSiguiente()" class="wiz-eq-btn-next">Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
  const yaLogueado = !!(window._googleEmail || localStorage.getItem('quindes_email'));
  renderWizLigaPaso(yaLogueado ? 1 : 0);
}

function cerrarWizLiga() {
  const overlay = document.getElementById('wiz-liga-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 350);
  if (!window._enFlujoCrearLiga) sessionStorage.removeItem('_enFlujoCrearLiga');
}

function renderWizLigaPaso(paso) {
  _wizLigaPaso = paso;
  const contenido  = document.getElementById('wiz-liga-contenido');
  const btnBack    = document.getElementById('wiz-liga-btn-back');
  const btnNext    = document.getElementById('wiz-liga-btn-next');
  const pasoLabel  = document.getElementById('wiz-liga-paso-label');
  const progress   = document.getElementById('wiz-liga-progress');
  if (!contenido) return;

  // Paso 0 es el login con Google — ocultar footer y progress
  const esLogin = paso === 0;
  const footer  = document.querySelector('#wiz-liga-overlay .wiz-equipo-footer');
  if (footer)    footer.style.display  = esLogin ? 'none' : '';
  if (btnBack)   btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = esLogin ? 'Paso 1 de ' + _WIZ_LIGA_TOTAL : `Paso ${paso} de ${_WIZ_LIGA_TOTAL}`;
  if (progress)  progress.style.width  = esLogin ? '0%' : (paso / _WIZ_LIGA_TOTAL * 100) + '%';
  if (btnNext)   btnNext.textContent   = paso === _WIZ_LIGA_TOTAL ? 'Crear todo 🛼' : 'Continuar';

  if (paso === 0) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">👋</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">Primero, identifícate</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Inicia sesión con tu cuenta de Google para continuar.</p>
      </div>
      <div id="wiz-liga-google-btn" style="display:flex;justify-content:center;width:100%;min-height:48px;border-radius:4px;overflow:hidden;color-scheme:light;"></div>
      <button onclick="cerrarWizLiga()" style="background:none;border:none;color:var(--text3);font-size:14px;cursor:pointer;padding:8px;">Cancelar</button>
    `;
    requestAnimationFrame(() => {
      const wrap = document.getElementById('wiz-liga-google-btn');
      if (wrap && !wrap.dataset.rendered) {
        wrap.dataset.rendered = 'true';
        google.accounts.id.renderButton(wrap, {
          theme: getGoogleBtnTheme(), size: 'large', width: 300, text: 'continue_with',
        });
      }
    });
    return;
  }
  
  if (paso === 1) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🏟️</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Cómo se llama tu liga?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">El nombre de la organización.</p>
      </div>
      <input id="wiz-liga-nombre" type="text" placeholder="Nombre de la liga" value="${_wizLiga.nombreLiga}"
        style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:17px;font-weight:600;box-sizing:border-box;outline:none;text-align:center;"
        oninput="_wizLiga.nombreLiga=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    setTimeout(() => document.getElementById('wiz-liga-nombre')?.focus(), 100);
  }

  if (paso === 2) {
    const preview = _wizLiga.ligaImagenBase64
      ? `<img src="${_wizLiga.ligaImagenBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🖼️</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">Logo de la liga</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Sube un logo o ícono que represente a tu liga. Es opcional.</p>
      </div>
      <label style="width:120px;height:120px;border-radius:20px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;background:var(--card);" id="wiz-liga-img-label">
        ${preview}
        <input type="file" accept="image/*" style="display:none;" onchange="previewImagenLiga(this)">
      </label>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
  }

  if (paso === 3) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🛼</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Cómo se llama tu equipo?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Puede tener el mismo nombre que la liga. 
        Puedes agregar más equipos desde la sección de ajustes.</p>
      </div>
      <input id="wiz-liga-equipo-nombre" type="text" placeholder="Nombre del equipo" value="${_wizLiga.nombreEquipo}"
        style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:17px;font-weight:600;box-sizing:border-box;outline:none;text-align:center;"
        oninput="_wizLiga.nombreEquipo=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    setTimeout(() => document.getElementById('wiz-liga-equipo-nombre')?.focus(), 100);
  }

  if (paso === 4) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🏆</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Qué categoría es tu equipo?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Selecciona la categoría en la que compite.</p>
      </div>
      <div style="display:flex;gap:12px;width:100%;justify-content:center;">
        ${['A','B','C'].map(cat => `
          <button onclick="seleccionarCategoriaLigaWiz('${cat}')"
            id="wiz-liga-cat-${cat}"
            style="flex:1;padding:20px 8px;border-radius:16px;
                   border:2px solid ${_wizLiga.categoria === cat ? 'var(--accent)' : 'var(--border)'};
                   background:${_wizLiga.categoria === cat ? 'var(--accent)' : 'var(--card)'};
                   color:${_wizLiga.categoria === cat ? '#fff' : 'var(--text)'};
                   font-size:22px;font-weight:800;cursor:pointer;transition:all 0.2s ease;">
            ${cat}
          </button>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
  }

  if (paso === 5) {
    const preview = _wizLiga.logoBase64
      ? `<img src="${_wizLiga.logoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🎨</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">Logo del equipo</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Sube el logo de tu equipo. Puedes cambiarlo desde la sección de ajustes.</p>
      </div>
      <label style="width:120px;height:120px;border-radius:20px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;background:var(--card);" id="wiz-liga-logo-label">
        ${preview}
        <input type="file" accept="image/*" style="display:none;" onchange="previewLogoLigaWiz(this)">
      </label>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
  }

  if (paso === 6) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🌎</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿De qué país es tu liga?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Esto nos ayuda a construir una red de ligas por región. Opcional.</p>
      </div>
      <div style="width:100%;position:relative;">
        <input id="wiz-liga-pais-input" type="text" placeholder="Buscar país…" autocomplete="off"
          value="${_wizLiga.pais}"
          style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:15px;box-sizing:border-box;outline:none;"
          oninput="filtrarPaisesLiga(this.value)">
        <div id="wiz-liga-pais-lista" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--card);border:1.5px solid var(--border);border-radius:14px;margin-top:4px;max-height:200px;overflow-y:auto;z-index:10;"></div>
      </div>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
    setTimeout(() => document.getElementById('wiz-liga-pais-input')?.focus(), 100);
  }

  if (paso === 7) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🏙️</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿De qué ciudad?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">La ciudad donde opera principalmente tu liga. Opcional.</p>
      </div>
      <input id="wiz-liga-ciudad" type="text" placeholder="Ciudad" value="${_wizLiga.ciudad}"
        style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:17px;font-weight:600;box-sizing:border-box;outline:none;text-align:center;"
        oninput="_wizLiga.ciudad=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
    setTimeout(() => document.getElementById('wiz-liga-ciudad')?.focus(), 100);
  }

  if (paso === 8) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">📅</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿En qué año se fundó tu liga?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">El año de fundación de la liga. Opcional.</p>
      </div>
      <input id="wiz-liga-anio" type="number" placeholder="Ej: 2018" value="${_wizLiga.anioFundacion}"
        min="1990" max="${new Date().getFullYear()}"
        style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:24px;font-weight:800;box-sizing:border-box;outline:none;text-align:center;"
        oninput="_wizLiga.anioFundacion=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
    setTimeout(() => document.getElementById('wiz-liga-anio')?.focus(), 100);
  }

  if (paso === 9) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">📖</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">Cuéntanos sobre tu liga</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Su misión, origen e ideales. Esta info aparecerá en el directorio de ligas. Opcional.</p>
      </div>
      <div style="background:var(--card2);border:1.5px solid var(--border);border-radius:12px;padding:10px 14px;font-size:11px;color:var(--text3);line-height:1.5;">
        🌐 Esta información es parte del <strong style="color:var(--text2);">Directorio Global de Ligas de Roller Derby</strong> que estamos construyendo para conectar ligas de todo el mundo.
      </div>
      <textarea id="wiz-liga-descripcion" placeholder="Ej: Somos una liga inclusiva fundada en 2018 con el objetivo de…" rows="4"
        style="width:100%;padding:14px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:14px;box-sizing:border-box;outline:none;resize:none;font-family:var(--font);line-height:1.5;"
        oninput="_wizLiga.descripcion=this.value"
        maxlength="500">${_wizLiga.descripcion}</textarea>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
    setTimeout(() => document.getElementById('wiz-liga-descripcion')?.focus(), 100);
  }

  if (paso === 10) {
    const esNumero = _wizLiga.contacto && !_wizLiga.contacto.startsWith('@') && !_wizLiga.contacto.startsWith('http');
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">📬</div>
      <div style="text-align:center;">
        <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 8px;">¿Cómo pueden contactarte?</h2>
        <p style="font-size:14px;color:var(--text2);margin:0;">Deja un Instagram o un número de WhatsApp. Opcional.</p>
      </div>
      <div style="display:flex;gap:8px;width:100%;justify-content:center;margin-bottom:4px;">
        <button id="wiz-liga-tipo-social" onclick="toggleTipoContactoLiga('social')"
          style="flex:1;padding:10px;border-radius:12px;border:2px solid ${!esNumero ? 'var(--accent)' : 'var(--border)'};background:${!esNumero ? 'var(--accent)' : 'var(--card)'};color:${!esNumero ? '#fff' : 'var(--text)'};font-size:13px;font-weight:700;cursor:pointer;">
          Instagram / Red social
        </button>
        <button id="wiz-liga-tipo-tel" onclick="toggleTipoContactoLiga('tel')"
          style="flex:1;padding:10px;border-radius:12px;border:2px solid ${esNumero ? 'var(--accent)' : 'var(--border)'};background:${esNumero ? 'var(--accent)' : 'var(--card)'};color:${esNumero ? '#fff' : 'var(--text)'};font-size:13px;font-weight:700;cursor:pointer;">
          WhatsApp / Teléfono
        </button>
      </div>
      <div id="wiz-liga-contacto-social" style="width:100%;display:${!esNumero ? 'block' : 'none'};">
        <input id="wiz-liga-ig" type="text" placeholder="@tuliga o https://instagram.com/tuliga"
          value="${!esNumero ? (_wizLiga.contacto || '') : ''}"
          style="width:100%;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:15px;box-sizing:border-box;outline:none;"
          oninput="_wizLiga.contacto=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
      <div id="wiz-liga-contacto-tel" style="width:100%;display:${esNumero ? 'flex' : 'none'};gap:8px;">
        <button type="button" id="wiz-liga-codigo-btn" onclick="abrirSelectorCodigoLiga()"
          style="padding:14px 12px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer;min-width:90px;">
          ${_wizLiga.contactoCodigo}
        </button>
        <input id="wiz-liga-tel" type="tel" placeholder="Número" maxlength="20"
          value="${esNumero ? (_wizLiga.contacto || '') : ''}"
          style="flex:1;padding:16px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:15px;box-sizing:border-box;outline:none;"
          oninput="_wizLiga.contacto=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
      <p style="font-size:12px;color:var(--text3);text-align:center;margin:0;">Opcional — puedes saltarte este paso</p>
    `;
  }

function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 1) {
    if (!_wizLiga.nombreLiga.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return; }
  }
  if (_wizLigaPaso === 3) {
    if (!_wizLiga.nombreEquipo.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return; }
  }
  if (_wizLigaPaso === _WIZ_LIGA_TOTAL) {
    crearLigaYEquipo(); return;
  }
  renderWizLigaPaso(_wizLigaPaso + 1);
}

  if (paso === 12) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">✨</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Cómo te llamamos?</h2>
        <p class="wiz-liga-desc">Tu nombre o apodo en el equipo.</p>
      </div>
      <input id="wiz-liga-perfil-nombre" type="text" placeholder="Ej: Valentina, Val…" value="${_wizLiga.nombre || ''}"
        class="wiz-liga-input"
        oninput="_wizLiga.nombre=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    setTimeout(() => document.getElementById('wiz-liga-perfil-nombre')?.focus(), 100);
  }

  if (paso === 13) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏳️‍🌈</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Con qué pronombres te identificás?</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <div id="wiz-liga-pronombres-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChipsMulti('wiz-liga-pronombres-chips', REG_PRONOMBRES, _wizLiga.pronombres || [], v => { _wizLiga.pronombres = v; });
  }

  if (paso === 14) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🌎</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿De dónde sos?</h2>
        <p class="wiz-liga-desc">Tu país de origen.</p>
      </div>
      <button type="button" id="wiz-liga-perfil-pais-btn" class="wiz-liga-selector-btn">
        <span id="wiz-liga-perfil-pais-display">${_wizLiga.paisPerfil || 'Seleccionar país…'}</span>
        <span class="material-icons">expand_more</span>
      </button>
    `;
    document.getElementById('wiz-liga-perfil-pais-btn').onclick = () => {
      abrirBottomSheet('Nacionalidad', REG_PAISES, _wizLiga.paisPerfil || '', val => {
        _wizLiga.paisPerfil = val;
        document.getElementById('wiz-liga-perfil-pais-display').textContent = val;
      });
    };
  }

  if (paso === 15) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">📱</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu número de contacto</h2>
        <p class="wiz-liga-desc">Prefijo y número.</p>
      </div>
      <div class="wiz-liga-phone-row">
        <button type="button" id="wiz-liga-perfil-codigo-btn" class="wiz-liga-selector-btn wiz-liga-codigo-btn">
          <span id="wiz-liga-perfil-codigo-display">${_wizLiga.codigoPais || '+?'}</span>
          <span class="material-icons">expand_more</span>
        </button>
        <input id="wiz-liga-perfil-tel" type="tel" placeholder="Número" class="wiz-liga-input"
          value="${_wizLiga.telefono || ''}"
          oninput="_wizLiga.telefono=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
    `;
    document.getElementById('wiz-liga-perfil-codigo-btn').onclick = () => {
      abrirBottomSheet('Código de país', REG_CODIGOS, _wizLiga.codigoPais || '', val => {
        _wizLiga.codigoPais = val;
        document.getElementById('wiz-liga-perfil-codigo-display').textContent = val;
      });
    };
    setTimeout(() => document.getElementById('wiz-liga-perfil-tel')?.focus(), 100);
  }

  if (paso === 16) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🎂</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Fecha de nacimiento</h2>
        <p class="wiz-liga-desc">Obligatorio.</p>
      </div>
      <button type="button" id="wiz-liga-perfil-fecha-btn" class="wiz-liga-selector-btn">
        <span id="wiz-liga-perfil-fecha-display">${_wizLiga.fechaNacimiento || 'Seleccionar fecha…'}</span>
        <span class="material-icons">edit_calendar</span>
      </button>
    `;
    document.getElementById('wiz-liga-perfil-fecha-btn').onclick = () => {
      abrirDatePicker(_wizLiga.fechaNacimiento || '', val => {
        _wizLiga.fechaNacimiento = val;
        document.getElementById('wiz-liga-perfil-fecha-display').textContent = val;
      });
    };
  }

  if (paso === 17) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">⭐</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Datos Derby</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-derby" type="text" placeholder="Nombre Derby" class="wiz-liga-input"
        value="${_wizLiga.nombreDerby || ''}"
        oninput="_wizLiga.nombreDerby=this.value"
        onkeydown="if(event.key==='Enter') document.getElementById('wiz-liga-perfil-numero').focus()">
      <input id="wiz-liga-perfil-numero" type="text" placeholder="Número Derby" class="wiz-liga-input"
        value="${_wizLiga.numeroDerby || ''}"
        oninput="_wizLiga.numeroDerby=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()" style="margin-top:12px;">
    `;
    setTimeout(() => document.getElementById('wiz-liga-perfil-derby')?.focus(), 100);
  }

  if (paso === 18) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏅</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu rol en el equipo</h2>
        <p class="wiz-liga-desc">Seleccioná tu posición.</p>
      </div>
      <div id="wiz-liga-rol-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChips('wiz-liga-rol-chips', REG_ROLES, _wizLiga.rolJugadorx || '', v => { _wizLiga.rolJugadorx = v; });
  }

  if (paso === 19) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏋️</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Cuánto entrenás?</h2>
        <p class="wiz-liga-desc">Veces por semana.</p>
      </div>
      <div id="wiz-liga-asiste-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChips('wiz-liga-asiste-chips', REG_ASISTENCIA, _wizLiga.asisteSemana || '', v => { _wizLiga.asisteSemana = v; });
  }

  if (paso === 20) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🩺</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu salud nos importa</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-alergias" type="text" placeholder="Alergias o condiciones" class="wiz-liga-input"
        value="${_wizLiga.alergias || ''}"
        oninput="_wizLiga.alergias=this.value">
      <input id="wiz-liga-perfil-dieta" type="text" placeholder="Dieta especial" class="wiz-liga-input"
        value="${_wizLiga.dieta || ''}"
        oninput="_wizLiga.dieta=this.value" style="margin-top:12px;">
    `;
  }

  if (paso === 21) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🆘</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Contacto de emergencia</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-emergencia" type="text" placeholder="Nombre y teléfono" class="wiz-liga-input"
        value="${_wizLiga.contactoEmergencia || ''}"
        oninput="_wizLiga.contactoEmergencia=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    if (btnNext) btnNext.textContent = '¡Crear todo! 🛼';
    setTimeout(() => document.getElementById('wiz-liga-perfil-emergencia')?.focus(), 100);
  }
}

function abrirFotoLigaWiz() {
  document.getElementById('wiz-liga-foto-input')?.click();
}

function previewFotoLigaWiz(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.fotoBase64 = e.target.result;
    const avatar = document.getElementById('wiz-liga-avatar');
    if (avatar) avatar.innerHTML = `<img src="${e.target.result}" class="wiz-liga-avatar-img">`;
  };
  reader.readAsDataURL(file);
}

function seleccionarCategoriaLigaWiz(cat) {
  _wizLiga.categoria = cat;
  ['A','B','C'].forEach(c => {
    const btn = document.getElementById('wiz-liga-cat-' + c);
    if (!btn) return;
    const activo = c === cat;
    btn.style.borderColor = activo ? 'var(--accent)' : 'var(--border)';
    btn.style.background  = activo ? 'var(--accent)' : 'var(--card)';
    btn.style.color       = activo ? '#fff' : 'var(--text)';
  });
}

function previewImagenLiga(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.ligaImagenBase64 = e.target.result;
    const label = document.getElementById('wiz-liga-img-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewImagenLiga(this)">`;
  };
  reader.readAsDataURL(file);
}

function previewLogoLigaWiz(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.logoBase64 = e.target.result;
    const label = document.getElementById('wiz-liga-logo-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewLogoLigaWiz(this)">`;
  };
  reader.readAsDataURL(file);
}



function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 1) {
    if (!_wizLiga.nombreLiga.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return; }
  }
  if (_wizLigaPaso === 3) {
    if (!_wizLiga.nombreEquipo.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return; }
  }
  if (_wizLigaPaso === _WIZ_LIGA_TOTAL) {
    crearLigaYEquipo(); return;
  }
  renderWizLigaPaso(_wizLigaPaso + 1);
}

function wizLigaPasoAnterior() {
  if (_wizLigaPaso > 1) renderWizLigaPaso(_wizLigaPaso - 1);
}

async function crearLigaConPerfil() {
  const btnNext = document.getElementById('wiz-liga-btn-next');
  if (btnNext) { btnNext.disabled = true; btnNext.textContent = 'Creando…'; }
  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email');
    const result = await apiCall('/crear-liga', 'POST', {
      email,
      nombreLiga:          _wizLiga.nombreLiga.trim(),
      nombreEquipo:        _wizLiga.nombreEquipo.trim(),
      categoria:           _wizLiga.categoria || null,
      ligaImagenBase64:    _wizLiga.ligaImagenBase64 || null,
      logoBase64:          _wizLiga.logoBase64 || null,
      nombre:              _wizLiga.nombre?.trim() || '',
      pronombres:          Array.isArray(_wizLiga.pronombres) ? _wizLiga.pronombres.join(', ') : '',
      paisPerfil:          _wizLiga.paisPerfil || '',
      codigoPais:          _wizLiga.codigoPais || '',
      telefono:            _wizLiga.telefono || '',
      fechaNacimiento:     _wizLiga.fechaNacimiento || '',
      mostrarCumple:       'No',
      mostrarEdad:         'No',
      nombreDerby:         _wizLiga.nombreDerby || '',
      numero:              _wizLiga.numeroDerby || '',
      rolJugadorx:         _wizLiga.rolJugadorx || '',
      asisteSemana:        _wizLiga.asisteSemana || '',
      alergias:            _wizLiga.alergias || '',
      dieta:               _wizLiga.dieta || '',
      contactoEmergencia:  _wizLiga.contactoEmergencia || '',
      fotoBase64:          _wizLiga.fotoBase64 || null,
    });
    if (!result?.ok) throw new Error(result?.error || 'Error al crear');
    cerrarWizLiga();
    CURRENT_USER = {
      found: true, id: result.perfil.id, email,
      rolApp: 'Admin', equipoId: result.equipo.id, ligaId: result.liga.id,
    };
    localStorage.setItem('quindes_email', email);
    const profile = await apiCall('/perfil/' + result.perfil.id);
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();
    setTimeout(() => {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
      lanzarConfetti();
      mostrarBienvenida();
    }, 400);
  } catch(e) {
    mostrarToastGuardado('❌ Error al crear: ' + e.message);
    if (btnNext) { btnNext.disabled = false; btnNext.textContent = '¡Crear todo! 🛼'; }
    console.error(e);
  }
}

function filtrarPaisesLiga(query) {
  const lista = document.getElementById('wiz-liga-pais-lista');
  if (!lista) return;
  if (!query || query.length < 2) { lista.style.display = 'none'; return; }
  const filtrados = REG_PAISES.filter(p => p.toLowerCase().includes(query.toLowerCase()));
  if (filtrados.length === 0) { lista.style.display = 'none'; return; }
  lista.style.display = 'block';
  lista.innerHTML = filtrados.map(p =>
    `<div class="wiz-liga-pais-item" onclick="seleccionarPaisLiga('${p}')">${p}</div>`
  ).join('');
}

function seleccionarPaisLiga(pais) {
  _wizLiga.pais = pais;
  const input = document.getElementById('wiz-liga-pais-input');
  if (input) input.value = pais;
  const lista = document.getElementById('wiz-liga-pais-lista');
  if (lista) lista.style.display = 'none';
}

function toggleTipoContactoLiga(tipo) {
  const esSocial = tipo === 'social';
  const btnSocial = document.getElementById('wiz-liga-tipo-social');
  const btnTel    = document.getElementById('wiz-liga-tipo-tel');
  const divSocial = document.getElementById('wiz-liga-contacto-social');
  const divTel    = document.getElementById('wiz-liga-contacto-tel');
  if (btnSocial) btnSocial.classList.toggle('wiz-liga-tipo-activo', esSocial);
  if (btnTel)    btnTel.classList.toggle('wiz-liga-tipo-activo', !esSocial);
  if (divSocial) divSocial.style.display = esSocial ? 'block' : 'none';
  if (divTel)    divTel.style.display    = !esSocial ? 'flex' : 'none';
  _wizLiga.contacto = '';
}

function crearLigaYEquipo() {
  const email = window._googleEmail || localStorage.getItem('quindes_email');
  if (!email) { mostrarToastGuardado('⚠️ No se encontró tu sesión'); return; }
  window._googleEmail = email;
  window._enFlujoCrearLiga = true;
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  document.getElementById('loginScreen').style.display = 'none';
  cerrarWizLiga();
  setTimeout(() => {
    wizOrigen = 'crearLiga';
    mostrarRegistroWizard();
  }, 400);
}

function mostrarLigaCreada(result) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-fullscreen-success';
  overlay.innerHTML = `
    <div style="text-align:center;max-width:320px;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:64px;animation:wiz-fade-up 0.5s ease 0.1s both;">🎉</div>
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0;animation:wiz-fade-up 0.5s ease 0.2s both;">¡Todo listo!</h2>
      <p style="font-size:15px;color:var(--text2);line-height:1.6;margin:0;animation:wiz-fade-up 0.5s ease 0.3s both;">
        Liga <strong style="color:var(--text);">${result.liga.nombre}</strong> y equipo
        <strong style="color:var(--text);">${result.equipo.nombre}</strong> creados. Tu cuenta ya está activa como Admin.
      </p>
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:16px 24px;animation:wiz-fade-up 0.5s ease 0.4s both;width:100%;box-sizing:border-box;">
        <p style="font-size:12px;color:var(--text3);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Código de invitación del equipo</p>
        <p id="liga-creada-codigo" style="font-size:28px;font-weight:900;color:var(--accent);margin:0;letter-spacing:0.1em;">${result.equipo.codigo}</p>
        <button id="liga-creada-copiar" style="margin-top:10px;padding:8px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--card2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;">
          Copiar código
        </button>
      </div>
      <button id="liga-creada-entrar"
        style="margin-top:8px;padding:14px 32px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:15px;font-weight:700;cursor:pointer;animation:wiz-fade-up 0.5s ease 0.6s both;width:100%;">
        Entrar a la app
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));

  document.getElementById('liga-creada-copiar').onclick = () => {
    navigator.clipboard.writeText(result.equipo.codigo)
      .then(() => mostrarToastGuardado('✅ Código copiado'))
      .catch(() => mostrarToastGuardado('❌ No se pudo copiar'));
  };

  document.getElementById('liga-creada-entrar').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
      inviteCode = result.equipo.codigo;
      wizOrigen = 'crearLiga';
      mostrarRegistroWizard();
    }, 350);
  };
}
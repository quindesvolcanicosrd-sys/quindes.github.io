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
  if (nombreEl) {
    nombreEl.textContent = data.nombre || '—';
    nombreEl.style.cssText = 'cursor:pointer;';
    nombreEl.onclick = () => editarNombreLiga(data);
  }

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
      <div style="padding:14px 16px;${esBorde ? 'border-bottom:none;' : 'border-bottom:1px solid var(--border3);'}display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="font-size:15px;font-weight:${esActivo ? '700' : '600'};color:var(--text);cursor:pointer;" onclick="editarNombreEquipo(${JSON.stringify(eq).replace(/"/g,'&quot;')})">
            ${eq.nombre}
            ${esActivo ? '<span style="font-size:11px;color:var(--accent);font-weight:600;margin-left:6px;">· Activo</span>' : ''}
          </span>
          <button onclick="confirmarEliminarEquipo('${eq.id}','${eq.nombre}')" style="width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
            <span class="material-icons" style="font-size:18px;color:#f87171;">delete</span>
          </button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--text3);">
            🔑 <strong style="color:var(--text2);letter-spacing:0.05em;">${eq.codigo || '—'}</strong>
            <span style="color:var(--border);margin:0 4px;">·</span>
            ${eq.usosMax ? `${eq.usosActuales}/${eq.usosMax} usos` : `${eq.usosActuales} usos`}
          </span>
          ${!esActivo ? `<button onclick="switchearEquipo('${eq.id}','${eq.nombre}')" style="padding:6px 12px;border-radius:10px;border:1.5px solid var(--border);background:none;color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">Gestionar</button>` : ''}
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
  if (btnNext) btnNext.textContent = paso === 3 ? 'Crear equipo 🏒' : 'Continuar';

  if (paso === 1) {
    contenido.innerHTML = `
      <div style="font-size:48px;text-align:center;">🏒</div>
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
    if (btnNext) btnNext.textContent = 'Crear equipo 🏒';
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
    if (btnNext) { btnNext.disabled = false; btnNext.textContent = 'Crear equipo 🏒'; }
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
        <strong style="color:var(--text);">${equipo.nombre}</strong> está listo. Ahora podés invitar integrantes compartiendo el código:
      </p>
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:16px 24px;animation:wiz-fade-up 0.5s ease 0.4s both;">
        <p style="font-size:12px;color:var(--text3);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Código de invitación</p>
        <p style="font-size:28px;font-weight:900;color:var(--accent);margin:0;letter-spacing:0.1em;">${equipo.codigo}</p>
      </div>
      <p style="font-size:12px;color:var(--text3);margin:0;animation:wiz-fade-up 0.5s ease 0.5s both;">Podés gestionar este equipo desde Mi Liga en Ajustes.</p>
      <button onclick="this.closest('[style]').remove()" 
        style="margin-top:8px;padding:14px 32px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:15px;font-weight:700;cursor:pointer;animation:wiz-fade-up 0.5s ease 0.6s both;width:100%;">
        ¡Listo!
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.classList.add('visible'); }));
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
    setTimeout(() => overlay.remove(), 350);
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
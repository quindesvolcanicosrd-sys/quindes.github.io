// ============================================================
//  QUINDES APP — ui.js  (componentes visuales genéricos)
// ============================================================

// ── DERBY LOADER ─────────────────────────────────────────────
function _derbyNextIcon() {
  let next;
  do { next = Math.floor(Math.random() * DERBY_ICON_COUNT); }
  while (next === _derbyActiveIdx);

  for (let i = 0; i < DERBY_ICON_COUNT; i++) {
    const ic = document.getElementById('di-' + i);
    if (ic) ic.classList.remove('di-active', 'di-near');
  }

  const PAUSE = 110;
  _derbyIconTimer = setTimeout(() => {
    _derbyActiveIdx = next;
    const curr = document.getElementById('di-' + _derbyActiveIdx);
    if (curr) curr.classList.add('di-active');
    const leftIdx  = (_derbyActiveIdx - 1 + DERBY_ICON_COUNT) % DERBY_ICON_COUNT;
    const rightIdx = (_derbyActiveIdx + 1) % DERBY_ICON_COUNT;
    const leftEl   = document.getElementById('di-' + leftIdx);
    const rightEl  = document.getElementById('di-' + rightIdx);
    if (leftEl)  leftEl.classList.add('di-near');
    if (rightEl) rightEl.classList.add('di-near');
    const wait = 700 + Math.random() * 800;
    _derbyIconTimer = setTimeout(_derbyNextIcon, wait);
  }, PAUSE);
}

function iniciarDerbyLoader() {
  const shuffled = [...DERBY_MSGS].sort(() => Math.random() - 0.5);
  const el = document.getElementById('derby-loader-text');
  if (el) el.textContent = shuffled[0];
  let idx = 0;
  _derbyMsgTimer = setInterval(() => {
    idx = (idx + 1) % shuffled.length;
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => { if (el) { el.textContent = shuffled[idx]; el.style.opacity = ''; } }, 300);
    }
  }, 2200);

  _derbyActiveIdx = 0;
  for (let i = 0; i < DERBY_ICON_COUNT; i++) {
    const ic = document.getElementById('di-' + i);
    if (!ic) continue;
    ic.classList.remove('di-active','di-near');
    if (i === 0) ic.classList.add('di-active');
    if (i === 1 || i === DERBY_ICON_COUNT - 1) ic.classList.add('di-near');
  }
  _derbyIconTimer = setTimeout(_derbyNextIcon, 900);
}

function detenerDerbyLoader() {
  clearInterval(_derbyMsgTimer);
  clearTimeout(_derbyIconTimer);
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarDerbyLoader();
  mostrarInstallBannerSiCorresponde();
});

// ── EDICIÓN ───────────────────────────────────────────────────
function isEditing(id) {
  const seccion = Object.keys(CAMPOS_SECCION).find(s => CAMPOS_SECCION[s].includes(id));
  return seccion ? edicionActiva[seccion] : false;
}

// ── TOAST ─────────────────────────────────────────────────────
function mostrarToastGuardado(msg) {
    const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg || '✅ Guardado';
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => t.remove(), 300);
  }, 2500);
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
  const oldTrigger = container.querySelector('.multiselect-trigger');
  if (oldTrigger) oldTrigger.remove();

  const selected = new Set(
    valorInicial ? valorInicial.split(',').map(v => v.trim()).filter(Boolean) : []
  );

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'multiselect-trigger sec-input' + (editing ? ' multiselect-editable' : '');
  trigger.disabled = !editing;

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
    overlay.style.pointerEvents = 'none';
    panel.style.pointerEvents   = 'none';
    document.body.style.overflow = '';
    const reg = document.getElementById('registroScreen');
    if (reg) reg.style.overflowY = '';
    setTimeout(() => { overlay.remove(); panel.remove(); }, 220);
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
    const _regScr = document.getElementById('registroScreen');
    if (_regScr && _regScr.style.display !== 'none') _regScr.style.overflowY = 'hidden';
  });
}

function habilitarSelect(id, valorInicial = '') {
  const input = document.getElementById(id);
  const key   = id.replace('p-', '');
  const config = CHIPS_OPTIONS[key];
  if (!config || !input) return;
  const editing = isEditing(id);

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
  btn.disabled = false;
}

// ── BOTTOM SHEET ──────────────────────────────────────────────
let _bsClosing = false;

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

function abrirBottomSheet(label, options, valorActual, onSelect, aliases) {
  if (_bsClosing) return;
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
    const f = filtro.toLowerCase();
const filtradas = options.filter(function(o) {
  if (o.toLowerCase().includes(f)) return true;
  if (aliases) return Object.entries(aliases).some(function([nombre, codigo]) {
    return nombre.includes(f) && codigo === o;
  });
  return false;
});
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

  overlay.style.pointerEvents = '';
  panel.style.pointerEvents   = '';
  overlay.classList.add('active');
  panel.classList.add('active');
  document.body.style.overflow = 'hidden';
  const _regScr = document.getElementById('registroScreen');
  if (_regScr && _regScr.style.display !== 'none') _regScr.style.overflowY = 'hidden';
}

function cerrarBottomSheet() {
  const overlay = document.getElementById('bs-overlay');
  const panel   = document.getElementById('bs-panel');
  if (!overlay || !panel) return;
  overlay.style.pointerEvents = 'none';
  panel.style.pointerEvents   = 'none';
  overlay.classList.remove('active');
  panel.classList.remove('active');
  document.body.style.overflow = '';
  const reg = document.getElementById('registroScreen');
  if (reg) reg.style.overflowY = '';
  _bsClosing = true;
  setTimeout(() => { _bsClosing = false; }, 400);
}

// ── EDIT SHEET ────────────────────────────────────────────────
function abrirEditSheet(fieldKey, opciones) {
  const EMPTY   = 'No hay datos ingresados';
  const config  = CHIPS_OPTIONS[fieldKey];
  const currentVal = window.myProfile[fieldKey] || '';
  const label   = opciones?.label || fieldKey;
  const tipo    = opciones?.tipo  || (config ? config.ui : 'text');

  const overlay = document.createElement('div');
  overlay.className = 'edit-field-overlay';
  overlay.innerHTML = `
    <div class="edit-field-sheet" id="edit-field-sheet">
      <div class="edit-field-handle"></div>
      <div class="edit-field-header">
        <span class="edit-field-label">${label}</span>
        <button class="edit-field-close" onclick="cerrarEditarCampo()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="edit-field-body" id="edit-field-body"></div>
      <div class="edit-field-actions">
        <button class="edit-field-save" id="edit-field-save-btn" onclick="confirmarEditarCampo()">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  pushSentinel();

  const body = document.getElementById('edit-field-body');
  let getValue;

  if (tipo === 'text' || tipo === 'tel') {
    const cleanVal = (currentVal === EMPTY || !currentVal) ? '' : String(currentVal);
    body.innerHTML = `<input id="edit-field-input" class="edit-field-input"
      type="${tipo === 'tel' ? 'tel' : 'text'}"
      value="${cleanVal.replace(/"/g,'&quot;')}"
      placeholder="${label}…" autocomplete="off">`;
    const input = document.getElementById('edit-field-input');
    setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 150);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') confirmarEditarCampo(); });
    getValue = () => input.value.trim();

  } else if (tipo === 'select') {
    const opts = config.options;
    let selected = currentVal;
    body.innerHTML = `<div class="edit-chips-grid">${opts.map(o => `
      <button class="edit-chip-btn ${o === selected ? 'active' : ''}" onclick="editChipSelect(this)">
        ${o}
      </button>`).join('')}</div>`;
    getValue = () => body.querySelector('.edit-chip-btn.active')?.textContent.trim() || '';

  } else if (tipo === 'multiselect') {
    const opts = config.options;
    const selectedArr = currentVal ? currentVal.split(',').map(s => s.trim()) : [];
    body.innerHTML = `<div class="edit-chips-multi">${opts.map(o => `
      <button class="edit-chip-btn ${selectedArr.includes(o) ? 'active' : ''}" onclick="editChipToggle(this)">
        ${o}
      </button>`).join('')}</div>`;
    getValue = () => Array.from(body.querySelectorAll('.edit-chip-btn.active')).map(b => b.textContent.trim()).join(', ');

  } else if (tipo === 'fecha') {
    const cleanVal = (currentVal === EMPTY || !currentVal) ? '' : String(currentVal);
    document.body.removeChild(overlay);
    abrirDatePicker(cleanVal, null);
    dpState._fieldKey = fieldKey;
    return;
  }

  overlay._getValue = getValue;
  overlay._fieldKey = fieldKey;

  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    document.getElementById('edit-field-sheet')?.classList.add('visible');
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarEditarCampo(); });
}

function editChipSelect(btn) {
  btn.closest('.edit-field-body').querySelectorAll('.edit-chip-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function editChipToggle(btn) { btn.classList.toggle('active'); }

function cerrarEditarCampo() {
  const overlay = document.querySelector('.edit-field-overlay');
  if (!overlay) return;
  const sheet = document.getElementById('edit-field-sheet');
  overlay.classList.remove('visible');
  if (sheet) sheet.classList.remove('visible');
  setTimeout(() => overlay.remove(), 300);
}

async function confirmarEditarCampo() {
  const overlay = document.querySelector('.edit-field-overlay');
  if (!overlay) return;
  const fieldKey = overlay._fieldKey;
  const getValue = overlay._getValue;
  if (!getValue) return;

  const newVal = getValue();
  const btn = document.getElementById('edit-field-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    const datos = recogerTodosLosDatos();
    datos[fieldKey] = newVal;
    await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
    window.myProfile[fieldKey] = newVal;
    renderTodo(window.myProfile);
    cerrarEditarCampo();
    mostrarToastGuardado();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    alert('Error al guardar: ' + (err.message || err));
  }
}

// ── DATE PICKER ───────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const dpState = {
  viewYear: 1990, viewMonth: 0,
  selYear: null, selMonth: null, selDay: null,
  yearMode: false, monthMode: false,
  onConfirm: null, _fieldKey: null,
};

function parseFecha(str) {
  if (!str) return null;
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { month: parseInt(iso[2])-1, day: parseInt(iso[3]), year: parseInt(iso[1]) };
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = parseInt(slash[1]);
    const b = parseInt(slash[2]);
    const year = parseInt(slash[3]);
    if (b > 12) return { day: b, month: a - 1, year };
    else        return { day: a, month: b - 1, year };
  }
  return null;
}

function formatFecha(y, m, d) {
  const dd = String(d).padStart(2, '0');
  const mm = String(m + 1).padStart(2, '0');
  return `${dd}/${mm}/${y}`;
}

function formatFechaDisplay(y, m, d) {
  return `${d} ${MESES_CORTO[m]} ${y}`;
}

function abrirDatePicker(valorActual, onConfirm) {
  const parsed = parseFecha(valorActual);
  dpState.viewYear  = (parsed && parsed.year)  ? parsed.year  : 1990;
  dpState.viewMonth = (parsed && typeof parsed.month === 'number') ? parsed.month : 0;
  dpState.selYear   = parsed ? parsed.year  : null;
  dpState.selMonth  = (parsed && typeof parsed.month === 'number') ? parsed.month : null;
  dpState.selDay    = parsed ? parsed.day   : null;
  dpState.yearMode  = false;
  dpState.monthMode = false;
  dpState.onConfirm = onConfirm;
  const errEl = document.getElementById('dp-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  renderDatePicker();
  document.getElementById('date-picker-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarDatePicker() {
  document.getElementById('date-picker-modal').classList.remove('active');
  document.body.style.overflow = '';
  const dpModal = document.getElementById('date-picker-modal');
  if (dpModal) dpModal._saving = false;
  const okBtn  = document.getElementById('dp-ok');
  const canBtn = document.getElementById('dp-cancel');
  if (okBtn)  { okBtn.disabled  = false; okBtn.textContent  = 'Guardar'; }
  if (canBtn) { canBtn.disabled = false; }
}

function renderDatePicker() {
  const { viewYear, viewMonth, selYear, selMonth, selDay, yearMode } = dpState;
  const safeMonth = (Number.isInteger(viewMonth) && viewMonth >= 0 && viewMonth <= 11) ? viewMonth : 0;
  const safeYear  = (Number.isInteger(viewYear)  && viewYear > 1900) ? viewYear : 1990;

  const lbl = document.getElementById('dp-selected-label');
  if (lbl) {
    if (Number.isInteger(selYear) && Number.isInteger(selMonth) && Number.isInteger(selDay)) {
      lbl.textContent = `${selDay} ${MESES[selMonth]} ${selYear}`;
    } else {
      lbl.textContent = 'Sin seleccionar';
    }
  }

  const monthEl = document.getElementById('dp-month-label');
  const yearEl  = document.getElementById('dp-year-label');
  if (monthEl) monthEl.textContent = MESES[safeMonth];
  if (yearEl)  yearEl.textContent  = safeYear;

  const gridWrap  = document.getElementById('dp-grid-wrap');
  const yearGrid  = document.getElementById('dp-year-grid');
  const monthGrid = document.getElementById('dp-month-grid');
  const navArrows = document.getElementById('dp-nav-arrows');
  if (navArrows) navArrows.style.display = (yearMode || dpState.monthMode) ? 'none' : 'flex';

  if (yearMode) {
    gridWrap.style.display  = 'none';
    yearGrid.style.display  = 'grid';
    if (monthGrid) monthGrid.style.display = 'none';
    renderYearGrid();
  } else if (dpState.monthMode) {
    gridWrap.style.display  = 'none';
    yearGrid.style.display  = 'none';
    if (monthGrid) { monthGrid.style.display = 'grid'; renderMonthGrid(); }
  } else {
    gridWrap.style.display  = 'block';
    yearGrid.style.display  = 'none';
    if (monthGrid) monthGrid.style.display = 'none';
    renderDaysGrid();
  }
}

function renderDaysGrid() {
  const viewYear  = (Number.isInteger(dpState.viewYear) && dpState.viewYear > 1900) ? dpState.viewYear : 1990;
  const viewMonth = (Number.isInteger(dpState.viewMonth) && dpState.viewMonth >= 0 && dpState.viewMonth <= 11) ? dpState.viewMonth : 0;
  const { selYear, selMonth, selDay } = dpState;
  const daysEl = document.getElementById('dp-days');
  daysEl.innerHTML = '';

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;
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
      dpState.viewYear  = y;
      dpState.yearMode  = false;
      dpState.monthMode = false;
      if (typeof dpState.viewMonth !== 'number' || dpState.viewMonth < 0 || dpState.viewMonth > 11) {
        dpState.viewMonth = 0;
      }
      animateDp(); renderDatePicker();
    });
    yearGrid.appendChild(btn);
  }
  requestAnimationFrame(() => {
    const sel = yearGrid.querySelector('.dp-year-selected');
    if (sel) sel.scrollIntoView({ block: 'center' });
  });
}

function animateDp() {
  const grid  = document.getElementById('dp-grid-wrap');
  const yearG = document.getElementById('dp-year-grid');
  const lbl   = document.getElementById('dp-month-label');
  [grid, yearG, lbl].forEach(el => { if (el) { el.style.opacity = '0'; el.style.transition = 'none'; } });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      [grid, yearG, lbl].forEach(el => { if (el) { el.style.opacity = ''; el.style.transition = ''; } });
    });
  });
}

function renderMonthGrid() {
  const monthGrid = document.getElementById('dp-month-grid');
  if (!monthGrid) return;
  monthGrid.innerHTML = '';
  MESES.forEach((nombre, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isCurrent = idx === dpState.viewMonth;
    btn.className = 'dp-month-btn' + (isCurrent ? ' dp-month-selected' : '');
    btn.textContent = nombre;
    btn.addEventListener('click', () => {
      dpState.viewMonth = idx;
      dpState.monthMode = false;
      animateDp(); renderDatePicker();
    });
    monthGrid.appendChild(btn);
  });
}

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
    const txtNode = document.createTextNode('—');
    const icoSpan = document.createElement('span');
    icoSpan.className = 'material-icons dp-trig-ico';
    icoSpan.textContent = 'edit_calendar';
    trigger.appendChild(txtNode);
    trigger.appendChild(icoSpan);
    container.appendChild(trigger);
  }

  function getStoredValue() {
    return input.dataset.fecha || input.value || '';
  }

  function refreshTriggerDisplay() {
    const rawVal = getStoredValue();
    const p = parseFecha(rawVal);
    const txt = p
      ? `${p.day} ${MESES[p.month]} ${p.year}`
      : (rawVal && rawVal !== 'No hay datos' ? rawVal : '—');
    const textNode = trigger.childNodes[0]?.nodeType === Node.TEXT_NODE
      ? trigger.childNodes[0]
      : Array.from(trigger.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = txt;
    } else {
      trigger.insertBefore(document.createTextNode(txt), trigger.firstChild);
    }
  }

  refreshTriggerDisplay();
  trigger.disabled = false;

  trigger.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isEditing('p-fechaNacimiento')) return;
    const currentVal = getStoredValue();
    abrirDatePicker(currentVal, val => {
      input.value = val;
      input.textContent = val;
      refreshTriggerDisplay();
    });
  });
}

function initDatePickerListeners() {
  document.getElementById('dp-prev')?.addEventListener('click', () => {
    dpState.viewMonth--;
    if (dpState.viewMonth < 0) { dpState.viewMonth = 11; dpState.viewYear--; }
    animateDp(); renderDatePicker();
  });
  document.getElementById('dp-next')?.addEventListener('click', () => {
    dpState.viewMonth++;
    if (dpState.viewMonth > 11) { dpState.viewMonth = 0; dpState.viewYear++; }
    animateDp(); renderDatePicker();
  });
  const dpModal = document.getElementById('date-picker-modal');
  if (dpModal) {
    dpModal.addEventListener('click', (e) => {
      const tgt = e.target;
      if (tgt.id === 'dp-month-label' || tgt.closest('#dp-month-label')) {
        e.preventDefault(); e.stopPropagation();
        dpState.monthMode = !dpState.monthMode;
        dpState.yearMode  = false;
        animateDp(); renderDatePicker();
      } else if (tgt.id === 'dp-year-label' || tgt.closest('#dp-year-label')) {
        e.preventDefault(); e.stopPropagation();
        dpState.yearMode  = !dpState.yearMode;
        dpState.monthMode = false;
        animateDp(); renderDatePicker();
      }
    });
  }
  document.getElementById('dp-cancel')?.addEventListener('click', cerrarDatePicker);
  document.getElementById('date-picker-modal')?.addEventListener('click', e => {
    const dpModal = document.getElementById('date-picker-modal');
    if (dpModal?._saving) return;
    if (e.target === dpModal) cerrarDatePicker();
  });
  document.getElementById('dp-ok')?.addEventListener('click', async () => {
    const errEl  = document.getElementById('dp-error');
    const okBtn  = document.getElementById('dp-ok');
    const canBtn = document.getElementById('dp-cancel');

    if (!dpState.selDay) {
      if (errEl) {
        errEl.textContent = 'Falta seleccionar el día';
        errEl.style.display = 'block';
        clearTimeout(errEl._t);
        errEl._t = setTimeout(() => { errEl.style.display = 'none'; }, 3000);
      }
      return;
    }
    if (errEl) errEl.style.display = 'none';

    const val = formatFecha(dpState.selYear, dpState.selMonth, dpState.selDay);

    if (dpState._fieldKey) {
      const fieldKey = dpState._fieldKey;
      dpState._fieldKey = null;
      if (okBtn)  { okBtn.disabled  = true; okBtn.textContent  = 'Guardando…'; }
      if (canBtn) { canBtn.disabled = true; }
      const dpModal = document.getElementById('date-picker-modal');
      if (dpModal) dpModal._saving = true;
      try {
        window.myProfile[fieldKey] = val;
        const datos = recogerTodosLosDatos();
        datos[fieldKey] = val;
        await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
        const fechaSpan = document.getElementById('p-fechaNacimiento');
        if (fechaSpan) fechaSpan.dataset.fecha = val;
        cerrarDatePicker();
        renderTodo(window.myProfile);
      } catch(e) {
        console.error(e);
        if (okBtn)  { okBtn.disabled  = false; okBtn.textContent  = 'Guardar'; }
        if (canBtn) { canBtn.disabled = false; }
        if (dpModal) dpModal._saving = false;
        if (errEl) {
          errEl.textContent = 'Error al guardar. Intenta de nuevo.';
          errEl.style.display = 'block';
          clearTimeout(errEl._t);
          errEl._t = setTimeout(() => { errEl.style.display = 'none'; }, 3500);
        }
      }
      return;
    }

    if (dpState.onConfirm) dpState.onConfirm(val);
    cerrarDatePicker();
  });
}

// ── INSTALL PWA BANNER ────────────────────────────────────────
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function detectarEntorno() {
  const ua = navigator.userAgent;
  const isIOS        = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid    = /Android/i.test(ua);
  const isIPad       = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSamsungBrowser = /SamsungBrowser/i.test(ua);
  const isChrome         = /Chrome|CriOS/i.test(ua) && !/Edg|OPR|Opera|SamsungBrowser/i.test(ua);
  const isSafari         = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|OPR|SamsungBrowser/i.test(ua);
  const isFirefox        = /Firefox|FxiOS/i.test(ua);
  const isOpera          = /OPR|Opera/i.test(ua);
  const isEdge           = /Edg\//i.test(ua);
  const isMiui           = /XiaoMi|MIUI/i.test(ua);
  const isWebView = (isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua)) ||
                    /wv|WebView/i.test(ua) ||
                    /FBAN|FBAV|Instagram|Twitter|Line|Snapchat/i.test(ua);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  return { isIOS, isAndroid, isIPad, isSamsungBrowser, isChrome, isSafari,
           isFirefox, isOpera, isEdge, isMiui, isWebView, isStandalone };
}

function mostrarInstallBannerSiCorresponde() {
  const env = detectarEntorno();
  if (env.isStandalone) return;
  if (!env.isIOS && !env.isAndroid) return;
  const compatible =
    (env.isAndroid && (env.isChrome || env.isSamsungBrowser)) ||
    (env.isIOS && env.isSafari) ||
    env.isWebView;
  if (!compatible) { buildBlockedBrowser(env); return; }
  buildInstallBanner(env);
}

function buildBlockedBrowser(env) {
  const isIOS = env.isIOS;
  const recommended = isIOS ? 'Safari' : 'Chrome';
  const overlay = document.createElement('div');
  overlay.id = 'install-banner';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:360px;text-align:center;">
      <img src="icons/icon-192x192.png" style="width:72px;height:72px;border-radius:20px;margin-bottom:20px;">
      <h2 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 10px;line-height:1.2;">
        Abre en ${recommended}
      </h2>
      <p style="font-size:15px;color:var(--text2);line-height:1.6;margin:0 0 28px;">
        Para usar e instalar Quindes Volcánicos necesitas abrirla en
        <strong style="color:var(--text);">${recommended}</strong>.
        Tu navegador actual no es compatible.
      </p>
      <button id="btn-copiar-url" onclick="copiarURL()" style="
        display:flex;align-items:center;justify-content:center;gap:8px;
        width:100%;padding:16px;border-radius:16px;border:none;
        background:var(--accent);color:#fff;font-size:16px;font-weight:700;
        font-family:inherit;cursor:pointer;box-sizing:border-box;margin-bottom:12px;">
        📋 Copiar enlace
      </button>
      ${!isIOS ? `
      <a href="https://play.google.com/store/apps/details?id=com.android.chrome"
         target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;gap:8px;
           width:100%;padding:14px;border-radius:16px;
           border:1.5px solid var(--border);background:transparent;
           color:var(--text);font-size:15px;font-weight:600;
           font-family:inherit;cursor:pointer;box-sizing:border-box;text-decoration:none;">
        ↗️ Descargar Chrome
      </a>` : `
      <p style="font-size:13px;color:var(--text4);margin-top:8px;">
        Safari viene preinstalado en tu iPhone/iPad.
      </p>`}
    </div>
  `;
  document.body.appendChild(overlay);
}

function buildInstallBanner(env) {
  const overlay = document.createElement('div');
  overlay.id = 'install-banner';
  overlay.style.cssText = [
    'position:fixed;inset:0;z-index:99999;',
    'background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
    'display:flex;align-items:flex-end;justify-content:center;',
    'opacity:0;transition:opacity 0.3s ease;',
  ].join('');

  let title = 'Instala la app';
  let subtitle = '';
  let body = '';

  if (env.isWebView) {
    const browserName = env.isIOS ? 'Safari' : 'Chrome';
    subtitle = 'Abre en ' + browserName;
    body = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start;">
        <span style="font-size:22px;">⚠️</span>
        <p style="font-size:14px;color:var(--text2);margin:0;line-height:1.5;">
          Esta página se abrió dentro de otra app. Para instalar Quindes, ábrela directamente en <strong style="color:var(--text);">${browserName}</strong>.
        </p>
      </div>
      ${stepsHtml([
        { ico: env.isIOS ? '⬆️' : '⋮', txt: env.isIOS
            ? 'Toca el ícono de compartir y selecciona <strong>"Abrir en Safari"</strong>'
            : 'Toca los <strong>tres puntos</strong> o el ícono de compartir y elige <strong>"Abrir en Chrome"</strong>' },
        { ico: '📋', txt: 'O copia la dirección y pégala en ' + browserName },
      ])}
      <button onclick="copiarURL()" style="${btnStyle('var(--accent)')}">📋 Copiar enlace</button>`;

  } else if (env.isIOS && env.isSafari) {
    subtitle = env.isIPad ? 'iPad · Safari' : 'iPhone · Safari';
    const shareIcon = env.isIPad
      ? 'el ícono ⬆️ en la <strong>barra superior derecha</strong>'
      : 'el ícono ⬆️ en la <strong>barra inferior</strong>';
    body = `
      <p style="font-size:14px;color:var(--text2);margin:0 0 20px;line-height:1.6;">
        Toca ${shareIcon} de Safari, luego selecciona
        <strong style="color:var(--text);">"Agregar a pantalla de inicio"</strong>
        y toca <strong style="color:var(--text);">"Agregar"</strong>.
      </p>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
        <span style="font-size:28px;">${env.isIPad ? '↗️' : '⬆️'}</span>
        <span style="font-size:13px;color:var(--text3);line-height:1.5;">
          El ícono de compartir está ${env.isIPad ? 'arriba a la derecha' : 'abajo en el centro'} de Safari.
        </span>
      </div>`;

  } else if (env.isAndroid && env.isChrome && deferredInstallPrompt) {
    subtitle = 'Android · Chrome';
    body = `
      <button id="install-native-btn" style="
        display:flex;align-items:center;justify-content:center;gap:10px;
        width:100%;padding:16px;border-radius:16px;border:none;
        background:var(--accent);color:#fff;font-size:16px;font-weight:800;
        font-family:inherit;cursor:pointer;box-sizing:border-box;
      ">📲 Instalar ahora</button>`;

  } else if (env.isAndroid && env.isSamsungBrowser) {
    subtitle = 'Android · Samsung Internet';
    body = `
      <p style="font-size:14px;color:var(--text2);margin:0 0 20px;line-height:1.6;">
        Toca el ícono de <strong style="color:var(--text);">menú</strong> (☰) en la esquina inferior derecha,
        luego selecciona <strong style="color:var(--text);">"Añadir página a"</strong> →
        <strong style="color:var(--text);">"Pantalla de inicio"</strong> y toca <strong style="color:var(--text);">"Añadir"</strong>.
      </p>`;

  } else if (env.isAndroid) {
    subtitle = 'Requiere Chrome';
    body = `
      ${stepsHtml([
        { ico: '🔍', txt: 'Abre <strong>Chrome</strong> en tu teléfono' },
        { ico: '📋', txt: 'Pega esta dirección: <strong>app.quindesvolcanicos.com</strong>' },
      ])}
      <button onclick="copiarURL()" style="${btnStyle('var(--accent)')}">📋 Copiar enlace para Chrome</button>`;
  }

  overlay.innerHTML = `
    <div style="background:var(--bg);border-radius:24px 24px 0 0;padding:24px 24px 44px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.3);box-sizing:border-box;">
      <div style="width:40px;height:4px;border-radius:2px;background:var(--border);margin:0 auto 20px;"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <img src="icons/icon-192x192.png" style="width:48px;height:48px;border-radius:14px;flex-shrink:0;">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--text);">${title}</div>
          <div style="font-size:13px;color:var(--text3);">${subtitle}</div>
        </div>
      </div>
      ${body}
      <p onclick="confirmarContinuarSinInstalar()" style="text-align:center;font-size:12px;color:var(--text4);margin-top:20px;cursor:pointer;text-decoration:underline;padding-bottom:4px;">Continuar sin instalar</p>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => { overlay.style.opacity = '1'; }, 100);

  const nativeBtn = document.getElementById('install-native-btn');
  if (nativeBtn) {
    nativeBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        if (outcome === 'accepted') cerrarInstallBanner();
      }
    });
  }
}

function stepsHtml(steps) {
  return '<div style="margin-bottom:16px;">' + steps.map(s => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="width:30px;height:30px;border-radius:8px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">${s.ico}</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.5;padding-top:5px;">${s.txt}</div>
    </div>`).join('') + '</div>';
}

function btnStyle(bg, color, border) {
  color  = color  || '#fff';
  border = border || 'none';
  return `display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:14px;border:${border};background:${bg};color:${color};font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;margin-top:8px;box-sizing:border-box;`;
}

function copiarURL() {
  const url = 'https://app.quindesvolcanicos.com';
  const btn = document.getElementById('btn-copiar-url');
  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      btn.innerHTML = '✅ ¡Enlace copiado!';
      btn.style.background = 'var(--ok, #16a34a)';
      setTimeout(() => {
        btn.innerHTML = '📋 Copiar enlace';
        btn.style.background = 'var(--accent)';
      }, 3000);
    }
  }).catch(() => { prompt('Copia esta dirección:', url); });
}

function cerrarInstallBanner() {
  const el = document.getElementById('install-banner');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 300);
}

function confirmarContinuarSinInstalar() {
  if (confirm('La app funciona mejor instalada.\n\n¿Seguro que quieres continuar en el navegador?')) {
    cerrarInstallBanner();
  }
}
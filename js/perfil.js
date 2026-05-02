// ============================================================
//  QUINDES APP — perfil.js  (render, navegación, edición)
// ============================================================

// ── CONSTANTES ────────────────────────────────────────────────
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
  tipoUsuario:    { multi: false, ui: 'select', options: ['Admin','SemiAdmin','Invitado'] },
};

const CAMPOS_SECCION = {
  generales:   ['p-nombreDerby','p-numero','p-rolJugadorx','p-nombre','p-pronombres'],
  personales:  ['p-nombreCivil','p-cedulaPasaporte','p-pais','p-fechaNacimiento','p-mostrarCumple','p-mostrarEdad','p-adjCedula'],
  contacto:    ['p-email','p-codigoPais','p-telefono'],
  salud:       ['p-contactoEmergencia','p-grupoSanguineo','p-alergias','p-dieta','p-aptoDeporte','p-adjPruebaFisica'],
  rendimiento: ['p-estado','p-asisteSemana','p-pruebaFisica','p-tipoUsuario','p-pagaCuota'],
};

const SOLO_ADMIN = ['p-nombreCivil','p-nombre','p-estado','p-asisteSemana','p-pruebaFisica','p-aptoDeporte','p-tipoUsuario','p-email'];
const SEARCH_FIELDS = ['pais', 'codigoPais'];

// ── NAVEGACIÓN ────────────────────────────────────────────────
let vistaActual    = 'home';
let _vistaAnterior = 'home';
let _navegando     = false;

function navegarSeccion(seccion) {
  if (_navegando) return;
  _navegando = true;
  setTimeout(() => { _navegando = false; }, 400);
  if (seccion === 'liga') {
    if (_ligaData) renderMiLiga(_ligaData);
    else cargarMiLiga();
  }
  if (seccion === 'invitacion') inicializarCodigoInvitacion();
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
  setTimeout(() => {
    home.classList.remove('slide-out');
    home.style.display = 'none';
  }, 350);
  vistaActual = seccion;
  pushSentinel();
}

function navegarDesdePerfilASeccion(seccion) {
  if (_navegando) return;
  _navegando = true;
  setTimeout(() => { _navegando = false; }, 400);
  const perfil = document.getElementById('view-perfil');
  const dest   = document.getElementById('view-' + seccion);
  if (!dest || !perfil) return;
  perfil.classList.add('slide-out');
  dest.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dest.classList.add('active');
      perfil.classList.remove('active');
    });
  });
  dest.addEventListener('transitionend', () => {
    perfil.classList.remove('slide-out');
    perfil.style.display = 'none';
  }, { once: true });
  vistaActual = seccion;
  _vistaAnterior = 'perfil';
  pushSentinel();
}

function volverHome(fromPopState = false) {
  if (_navegando) return;
  _navegando = true;
  setTimeout(() => { _navegando = false; }, 400);
  if (edicionActiva[vistaActual]) cancelarEdicionSeccion(vistaActual);
  const destId = _vistaAnterior && _vistaAnterior !== 'home' ? _vistaAnterior : 'home';
  const dest   = document.getElementById('view-' + destId);
  const curr   = document.getElementById('view-' + vistaActual);
  if (!curr || !dest) return;
  dest.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dest.classList.add('active');
      curr.classList.remove('active');
    });
  });
  curr.addEventListener('transitionend', () => { curr.style.display = 'none'; }, { once: true });
  vistaActual    = destId;
  _vistaAnterior = 'home';
  if (!fromPopState) history.replaceState({ seccion: destId }, '', location.pathname);
}

function pushSentinel() {
  history.pushState({ sentinel: true }, '', location.pathname + '#_');
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.sentinel) history.go(1);
  const dpModal = document.getElementById('date-picker-modal');
  if (dpModal && dpModal.classList.contains('active')) { cerrarDatePicker(); return; }
  const editOverlay = document.querySelector('.edit-field-overlay');
  if (editOverlay) { cerrarEditarCampo(); return; }
  const filePageView = document.querySelector('.file-page-view');
  if (filePageView) { cerrarFilePage(filePageView, document.getElementById('view-' + vistaActual)); return; }
  const cropModal = document.getElementById('modal-crop');
  if (cropModal && cropModal.style.display !== 'none') { cancelarCrop(); return; }
  const regScr = document.getElementById('registroScreen');
  if (regScr && regScr.style.display !== 'none') {
    const step0 = document.getElementById('wiz-step-0');
    if (step0 && step0.style.display !== 'none') { wizStep0Volver(); return; }
    wizBack(); return;
  }
  const noEncScr = document.getElementById('noEncontradoScreen');
  if (noEncScr && noEncScr.style.display !== 'none') {
    noEncScr.style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    return;
  }
  if (vistaActual && vistaActual !== 'home') { volverHome(true); return; }
});

document.addEventListener('touchmove', (e) => {
  let el = e.target;
  let scrollable = false;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll = overflowY === 'auto' || overflowY === 'scroll';
    if (canScroll) {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      const notAtTop    = el.scrollTop > 0;
      const notAtBottom = el.scrollTop < el.scrollHeight - el.clientHeight - 1;
      if (hasOverflow && (notAtTop || notAtBottom)) { scrollable = true; break; }
    }
    el = el.parentElement;
  }
  if (!scrollable) e.preventDefault();
}, { passive: false });

// ── INICIALIZACIÓN ────────────────────────────────────────────
async function inicializarApp(email) {
  try {
    document.getElementById('loadingScreen').style.display  = 'flex';
    document.getElementById('loginScreen').style.display    = 'none';
    document.getElementById('registroScreen').style.display = 'none';
    detenerDerbyLoader();
    iniciarDerbyLoader();

    const user = await gasCall('getCurrentUser', { email });
    if (!user || !user.found) {
      detenerDerbyLoader();
      document.getElementById('loadingScreen').style.display = 'none';
      mostrarNoEncontrado(email);
      return;
    }

    if (wizOrigen === 'login') {
      wizOrigen = null;
      window._registroDesdeLogin = false;
      detenerDerbyLoader();
      document.getElementById('loadingScreen').style.display = 'none';
      mostrarCuentaYaRegistrada(email, user);
      return;
    }

    if (wizOrigen === 'noEncontrado') {
      wizOrigen = null;
      detenerDerbyLoader();
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('noEncontradoScreen').style.display = 'none';
      mostrarCuentaYaRegistrada(email, user);
      return;
    }

    CURRENT_USER = { ...user, rolApp: user.rol, ligaId: user.ligaId };
    aplicarColorPrimario(user.colorPrimario || '#ef4444');
    const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = user.email;

    const profile = await gasCall('getMyProfile', { rowNumber: user.id });
    window.myProfile = profile;

    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();

    const urlsAPrecargar = [
      normalizarDriveUrl(profile.fotoPerfil),
      profile.adjCedula,
      profile.adjPruebaFisica,
    ].filter(Boolean);

    await Promise.allSettled(
      urlsAPrecargar.map(url => new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = resolve;
        img.src = url;
      }))
    );

    detenerDerbyLoader();

    const loadingEl = document.getElementById('loadingScreen');
    const appEl     = document.getElementById('appContent');
    const irisEl    = document.getElementById('iris-overlay');

    // Mostrar app (aún tapada por el loader)
    appEl.style.display = 'block';

    // Pequeña pausa para que el browser pinte la app debajo, luego fade out del loader
    requestAnimationFrame(() => requestAnimationFrame(() => {
      appEl.classList.add('visible');
      loadingEl.classList.add('fadeout');
      setTimeout(() => {
        loadingEl.style.display = 'none';
        loadingEl.classList.remove('fadeout');
      }, 450);
    }));

    // Prefetch Mi Liga en background para que esté listo al navegar
    if (CURRENT_USER?.ligaId) cargarMiLiga({ render: false });

  } catch (err) {
    console.error(err);
    detenerDerbyLoader();
    document.getElementById('loadingScreen').style.display = 'none';
    mostrarLoginScreen();
  }
}

function mostrarCuentaYaRegistrada(email, user) {
  const overlay = document.createElement('div');
  overlay.id = 'ya-registrada-screen';
  overlay.className = 'ya-registrada-screen';
  overlay.innerHTML = `
    <div class="login-bg">
      <span class="login-bg-ring login-bg-ring-1"></span>
      <span class="login-bg-ring login-bg-ring-2"></span>
    </div>
    <div class="ya-registrada-content">
      <img src="icons/splash-512x512.png" alt="Quindes" class="ya-registrada-logo">
      <h2 class="ya-registrada-title">¡Ya tienes una cuenta!</h2>
      <p class="ya-registrada-desc">
        La cuenta <strong style="color:var(--text);">${email}</strong> ya está registrada. Ingresando…
      </p>
      <div class="ya-registrada-loader-wrap">
        <div class="derby-loader">
          <div class="derby-icons" id="ya-reg-icons">
            <span class="derby-icon di-active" id="ya-di-0">🛼</span>
            <span class="derby-icon di-near"   id="ya-di-1">⭐</span>
            <span class="derby-icon"           id="ya-di-2">💥</span>
            <span class="derby-icon di-near"   id="ya-di-3">🏆</span>
          </div>
          <p class="derby-loader-text" id="ya-reg-msg">${DERBY_MSGS[0]}</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % DERBY_MSGS.length;
    const el = document.getElementById('ya-reg-msg');
    if (el) { el.style.opacity = '0'; setTimeout(() => { if (el) { el.textContent = DERBY_MSGS[msgIdx]; el.style.opacity = ''; } }, 300); }
  }, 2200);

  let iconIdx = 0;
  const iconIds = ['ya-di-0','ya-di-1','ya-di-2','ya-di-3'];
  const iconTimer = setInterval(() => {
    iconIds.forEach((id, i) => {
      const el = document.getElementById(id); if (!el) return;
      el.classList.remove('di-active','di-near');
      const diff = (i - iconIdx + 4) % 4;
      if (diff === 0) el.classList.add('di-active');
      else if (diff === 1 || diff === 3) el.classList.add('di-near');
    });
    iconIdx = (iconIdx + 1) % 4;
  }, 900);

  CURRENT_USER = { ...user, rolApp: user.rol };
  const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = user.email;

  gasCall('getMyProfile', { rowNumber: user.id }).then(profile => {
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    clearInterval(msgTimer);
    clearInterval(iconTimer);
    document.getElementById('appContent').style.display = 'block';
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }).catch(err => {
    clearInterval(msgTimer);
    clearInterval(iconTimer);
    console.error(err);
    overlay.remove();
    mostrarLoginScreen();
  });
}

// ── PERMISOS ──────────────────────────────────────────────────
function aplicarPermisos() {
  const role = CURRENT_USER.rolApp;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    const matches = roles.includes(role);
    if (!matches) el.style.display = 'none';
    else if (el.style.display === 'none') el.style.display = '';
  });
  const rowRend = document.getElementById('row-rendimiento');
  if (rowRend) rowRend.style.display = (role === 'Admin' || role === 'SemiAdmin') ? 'flex' : 'none';
}

// ── RENDER ────────────────────────────────────────────────────
function renderTodo(profile) {
  if (!profile) return;
  const EMPTY = 'No hay datos';
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isEmpty = !val || val.toString().trim() === '';
    const text = isEmpty ? EMPTY : val.toString();
    if (el.tagName === 'INPUT') {
      if (el.type === 'file') return;
      el.value = text;
    } else {
      el.textContent = text;
    }
    if (isEmpty) el.classList.add('sec-input-empty');
    else el.classList.remove('sec-input-empty');
  };

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
  set('p-email',              profile.email || '');
  set('p-mostrarCumple',      profile.mostrarCumple);
  set('p-mostrarEdad',        profile.mostrarEdad);
  set('p-tipoUsuario',        profile.tipoUsuario);
  set('p-fechaNacimiento',    profile.fechaNacimiento);
  const fechaEl = document.getElementById('p-fechaNacimiento');
  if (fechaEl) fechaEl.dataset.fecha = profile.fechaNacimiento || '';
  initFechaTrigger();
  set('p-contactoEmergencia', profile.contactoEmergencia);

const setFileBadge = (id, url) => {
  const el = document.getElementById(id); 
  if (!el) return;

  if (url) {
    el.innerHTML = `
      <span class="file-badge file-badge-ok">
        <span class="material-icons">file_present</span>
        Archivo cargado
      </span>`;
  } else {
    el.innerHTML = `
      <span class="file-badge file-badge-missing">
        <span class="material-icons">file_copy_off</span>
        Archivo no cargado
      </span>`;
  }

  el.classList.remove('sec-input-empty');
};
  setFileBadge('p-adjCedula',       profile.adjCedula);
  setFileBadge('p-adjPruebaFisica', profile.adjPruebaFisica);

  const abreviarEstado = v => {
    if (!v) return '—';
    if (v.includes('Puede jugar'))         return 'Apta para jugar';
    if (v.includes('Asistencia y Tareas')) return 'Falta: Asist. y Tareas';
    if (v.includes('Asistencia'))          return 'Falta: Asistencia';
    if (v.includes('Tareas'))              return 'Falta: Tareas';
    return v;
  };

  const mesEl  = document.getElementById('p-puntosMes');   if (mesEl)  mesEl.textContent  = profile.puntosMes       || '—';
  const trimEl = document.getElementById('p-puntosTrim');  if (trimEl) trimEl.textContent  = profile.puntosTrimestre || '—';
  const anioEl = document.getElementById('p-puntosAnio');  if (anioEl) anioEl.textContent  = profile.puntosAnio      || '—';
  const horasEl = document.getElementById('p-horasPatinadas');  if (horasEl) horasEl.textContent = profile.horasPatinadas  || '—';
  const asistEl = document.getElementById('p-asistenciaAnual'); if (asistEl) asistEl.textContent = profile.asistenciaAnual || '—';

  const statMesNombre  = document.getElementById('stat-mes-nombre');  if (statMesNombre)  statMesNombre.textContent  = profile.labelMes       || '';
  const statTrimNombre = document.getElementById('stat-trim-nombre'); if (statTrimNombre) statTrimNombre.textContent = profile.labelTrimestre  || 'Trimestre';
  const statAnioNombre = document.getElementById('stat-anio-nombre'); if (statAnioNombre) statAnioNombre.textContent = profile.labelAnio       || '';

  const hMes   = document.getElementById('hero-puntosMes');   if (hMes)   hMes.textContent   = profile.puntosMes       || '—';
  const hTrim  = document.getElementById('hero-puntosTrim');  if (hTrim)  hTrim.textContent  = profile.puntosTrimestre || '—';
  const hAnio  = document.getElementById('hero-puntosAnio');  if (hAnio)  hAnio.textContent  = profile.puntosAnio      || '—';
  const hHoras = document.getElementById('hero-horasPatinadas');  if (hHoras) hHoras.textContent = profile.horasPatinadas  || '—';
  const hAsist = document.getElementById('hero-asistenciaAnual'); if (hAsist) hAsist.textContent = profile.asistenciaAnual || '—';
  const hLblMes  = document.getElementById('hero-label-puntosMes');  if (hLblMes)  hLblMes.textContent  = profile.labelMes || 'Mes';
  const hLblTrim = document.getElementById('hero-label-puntosTrim'); if (hLblTrim) hLblTrim.textContent = profile.labelTrimestre || 'Trim.';
  const hLblAnio = document.getElementById('hero-label-puntosAnio'); if (hLblAnio) hLblAnio.textContent = (profile.labelAnio ? 'Año ' + profile.labelAnio : 'Año');

  const heroNombre = document.getElementById('hero-nombre-derby'); if (heroNombre) heroNombre.textContent = profile.nombreDerby  || '—';
  const heroSub    = document.getElementById('hero-sub');           if (heroSub)    heroSub.textContent    = (profile.numero ? '#' + profile.numero : '—');
  const heroRol    = document.getElementById('hero-rol');           if (heroRol)    heroRol.textContent    = profile.rolJugadorx || '—';
  const heroPron   = document.getElementById('hero-pronombres');    if (heroPron)   heroPron.textContent   = profile.pronombres  || '—';

  actualizarSubtitulos(profile);
  renderFotoPerfil(normalizarDriveUrl(profile.fotoPerfil));
  const secImg = document.getElementById('sec-img-foto');
  if (secImg) {
    const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#2b2b2b"/></svg>');
    secImg.src = normalizarDriveUrl(profile.fotoPerfil) || placeholder;
  }

  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id     = 'p-' + key;
    const config = CHIPS_OPTIONS[key];
    const valor  = profile[key] || '';
    if (config.ui === 'multiselect') habilitarMultiSelect(id, valor);
    if (config.ui === 'select')      habilitarSelect(id, valor);
    if (config.ui === 'toggle')      habilitarToggle(id, valor);
  });

  renderEstadoArchivo('adjPruebaFisica', profile.adjPruebaFisica);
  renderEstadoArchivo('adjCedula',       profile.adjCedula);
  ajustarAnchoEmail();
}

function actualizarSubtitulos(profile) {
  const sub = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const fechaSub = (() => {
    const p = parseFecha(profile.fechaNacimiento);
    return p ? `${p.day} ${MESES[p.month]} ${p.year}` : profile.fechaNacimiento;
  })();
  sub('sub-generales',   [profile.nombreDerby, profile.numero ? '#'+profile.numero : null, profile.rolJugadorx].filter(Boolean).join(' · ') || 'Nombre Derby, Número, Rol');
  sub('sub-personales',  [profile.cedulaPasaporte, profile.pais, fechaSub].filter(Boolean).join(' · ') || 'Documento, Nacionalidad');
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

function toggleEdicionSeccion(seccion) {}
function guardarSeccion(seccion) {}

// ── EDICIÓN TAP-TO-EDIT ───────────────────────────────────────
function editarCampo(fieldKey, opciones) {
  const tipo = opciones?.tipo || 'text';
  if (tipo === 'toggle')  { toggleCampoInline(fieldKey); return; }
  if (tipo === 'archivo') { abrirPaginaArchivo(fieldKey, opciones); return; }
  if (tipo === 'select')  { abrirSelectorConBusqueda(fieldKey, opciones); return; }
  abrirEditSheet(fieldKey, opciones);
}

async function toggleCampoInline(fieldKey) {
  const current = window.myProfile[fieldKey];
  const newVal  = current === 'Sí' ? 'No' : 'Sí';
  window.myProfile[fieldKey] = newVal;
  const togEl = document.getElementById('p-' + fieldKey);
  const btn = togEl?.parentNode?.querySelector('.toggle-btn');
  if (btn) {
    btn.classList.toggle('toggle-on',  newVal === 'Sí');
    btn.classList.toggle('toggle-off', newVal !== 'Sí');
    btn.setAttribute('aria-pressed', String(newVal === 'Sí'));
  }
  try {
    const datos = recogerTodosLosDatos();
    datos[fieldKey] = newVal;
    await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
    mostrarToastGuardado();
  } catch(e) {
    window.myProfile[fieldKey] = current;
    console.error(e);
  }
}

// ── FILE PAGE ─────────────────────────────────────────────────
function cerrarFilePage(view, prevView) {
  if (!view) return;
  if (prevView) {
    prevView.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        prevView.classList.add('active');
        view.classList.remove('active');
      });
    });
    view.addEventListener('transitionend', () => { view.remove(); }, { once: true });
  } else {
    view.remove();
  }
}

function abrirPaginaArchivo(fieldKey, opciones) {
  const label  = opciones?.label || fieldKey;
  const fileId = 'p-' + fieldKey;
  const currentUrl = window.myProfile[fieldKey] || '';
  let thumbUrl = '';
  if (currentUrl) {
    const idMatch = currentUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || currentUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch) thumbUrl = 'https://drive.google.com/thumbnail?id=' + idMatch[1] + '&sz=w600';
    else thumbUrl = currentUrl;
  }

  const view = document.createElement('div');
  view.className = 'app-view file-page-view';
  view.innerHTML = `
    <header class="app-header app-header-section">
      <div class="header-row-top">
        <button class="header-back file-page-back-btn">
          <span class="material-icons">arrow_back</span>
        </button>
        <span class="app-header-title">${label}</span>
      </div>
    </header>
    <div class="app-scroll">
      ${currentUrl ? `
        <div class="file-page-preview">
          <img src="${thumbUrl}" class="file-page-img" alt="Vista previa"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="file-page-doc-icon" style="display:none;">
            <span class="material-icons">insert_drive_file</span>
            <span>Archivo subido</span>
          </div>
        </div>
        <a href="${currentUrl}" target="_blank" rel="noopener" download class="file-page-btn file-page-btn-primary">
          <span class="material-icons">download</span>
          Ver / Descargar archivo
        </a>
        <label class="file-page-btn file-page-btn-replace">
          <span class="material-icons">swap_horiz</span>
          Reemplazar archivo
          <input type="file" accept=".pdf,image/*" style="display:none;"
            onchange="subirArchivoDesdeFilePage(this, '${fieldKey}', '${fileId}')">
        </label>
        <button class="file-page-btn file-page-btn-drive" onclick="abrirDrivePickerArchivo('${fieldKey}')">
          <span class="material-icons">add_to_drive</span>
          Reemplazar desde Google Drive
        </button>` : `
        <div class="file-page-empty">
          <span class="material-icons">insert_drive_file</span>
          <p>No hay archivo subido todavía</p>
        </div>
        <label class="file-page-btn file-page-btn-primary">
          <span class="material-icons">upload</span>
          Subir archivo
          <input type="file" accept=".pdf,image/*" style="display:none;"
            onchange="subirArchivoDesdeFilePage(this, '${fieldKey}', '${fileId}')">
        </label>
        <button class="file-page-btn file-page-btn-drive" onclick="abrirDrivePickerArchivo('${fieldKey}')">
          <span class="material-icons">add_to_drive</span>
          Subir desde Google Drive
        </button>`}
      <div id="file-page-status" class="file-page-status-msg"></div>
      <div class="spacer-32"></div>
    </div>
  `;

  document.getElementById('appContent').appendChild(view);
  const currView = document.getElementById('view-' + vistaActual);
  if (currView) currView.classList.add('slide-out');
  view.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      view.classList.add('active');
      if (currView) currView.classList.remove('active');
    });
  });
  if (currView) {
    currView.addEventListener('transitionend', () => {
      currView.classList.remove('slide-out');
      currView.style.display = 'none';
    }, { once: true });
  }
  view.querySelector('.file-page-back-btn').addEventListener('click', () => { cerrarFilePage(view, currView); });
  pushSentinel();
}

async function subirArchivoDesdeFileDrive(fieldKey, base64) {
  const status = document.getElementById('file-page-status');
  if (status) status.textContent = 'Subiendo…';
  try {
    const result = await gasCall('subirArchivo', {
      base64Data: base64,
      tipoArchivo: fieldKey,
      email: CURRENT_USER.email || localStorage.getItem('quindes_email') || '',
    });
    if (!result?.url) throw new Error('No se recibió URL');
    window.myProfile[fieldKey] = result.url;
    const datos = recogerTodosLosDatos();
    datos[fieldKey] = result.url;
    await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
    if (status) status.textContent = '';
    mostrarToastGuardado('✅ Archivo actualizado');
    const filePageView = document.querySelector('.file-page-view');
    if (filePageView) {
      const emptyDiv   = filePageView.querySelector('.file-page-empty');
      const previewDiv = filePageView.querySelector('.file-page-preview');
      const urlConCache = result.url + '?t=' + Date.now();
      if (emptyDiv) emptyDiv.style.display = 'none';
      if (previewDiv) {
        previewDiv.innerHTML = `
          <img src="${urlConCache}" class="file-page-img" alt="Vista previa" style="opacity:0;transition:opacity 0.4s ease;"
            onload="this.style.opacity='1'"
            onerror="this.style.opacity='1';this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="file-page-doc-icon" style="display:none;">
            <span class="material-icons">insert_drive_file</span>
            <span>Archivo subido</span>
          </div>`;
      }
    }
  } catch(e) {
    console.error('[DRIVE] Error subiendo archivo:', e);
    if (status) status.textContent = '';
    mostrarToastGuardado('Error al subir el archivo');
  }
}

async function subirArchivoDesdeFilePage(input, fieldKey, fileInputId) {
  const file = input.files[0]; if (!file) return;
  const status = document.getElementById('file-page-status');
  if (status) status.textContent = 'Subiendo…';
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await gasCall('subirArchivo', {
        base64Data: e.target.result,
        tipoArchivo: fieldKey,
        email: CURRENT_USER.email || localStorage.getItem('quindes_email') || '',
      });
      if (!result?.url) throw new Error('No se recibió URL');
      window.myProfile[fieldKey] = result.url;
      const datos = recogerTodosLosDatos();
      datos[fieldKey] = result.url;
      await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
      if (status) status.textContent = '';
      mostrarToastGuardado('✅ Archivo actualizado');
      const filePageView = document.querySelector('.file-page-view');
      if (filePageView) {
        const previewDiv = filePageView.querySelector('.file-page-preview');
        const emptyDiv   = filePageView.querySelector('.file-page-empty');
        const urlConCache = result.url + '?t=' + Date.now();
        if (emptyDiv) emptyDiv.style.display = 'none';
        if (previewDiv) {
          previewDiv.querySelectorAll('img').forEach(img => { img.src = ''; });
          previewDiv.innerHTML = `
            <img src="${urlConCache}" class="file-page-img" alt="Vista previa" style="opacity:0;transition:opacity 0.4s ease;"
              onload="this.style.opacity='1'"
              onerror="this.style.opacity='1';this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="file-page-doc-icon" style="display:none;">
              <span class="material-icons">insert_drive_file</span>
              <span>Archivo subido</span>
            </div>`;
        }
      }
    };
    reader.readAsDataURL(file);
  } catch(e) {
    if (status) status.textContent = 'Error: ' + (e.message || e);
  }
}

// ── SEARCHABLE SELECTOR ───────────────────────────────────────
function abrirSelectorConBusqueda(fieldKey, opciones) {
  const label   = opciones?.label || fieldKey;
  const config  = CHIPS_OPTIONS[fieldKey];
  const options = config?.options || [];
  const current = window.myProfile[fieldKey] || '';

  const overlay = document.createElement('div');
  overlay.className = 'edit-field-overlay';
  overlay.innerHTML = `
    <div class="edit-field-sheet edit-field-sheet-tall" id="edit-field-sheet">
      <div class="edit-field-handle"></div>
      <div class="edit-field-header">
        <span class="edit-field-label">${label}</span>
        <button class="edit-field-close" onclick="cerrarEditarCampo()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="edit-search-list" id="edit-search-list"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._fieldKey = fieldKey;

  const list = document.getElementById('edit-search-list');
  list.innerHTML = options.map(o => `
    <div class="edit-search-item ${o === current ? 'active' : ''}"
         onclick="seleccionarOpcionBusqueda('${fieldKey}', this, '${o.replace(/'/g,"\\'")}')">
      ${o}
      ${o === current ? '<span class="material-icons edit-search-check">check</span>' : ''}
    </div>`).join('');

  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    document.getElementById('edit-field-sheet')?.classList.add('visible');
    const active = list.querySelector('.edit-search-item.active');
    if (active) active.scrollIntoView({ block: 'center' });
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarEditarCampo(); });
}

async function seleccionarOpcionBusqueda(fieldKey, el, value) {
  el.closest('.edit-search-list').querySelectorAll('.edit-search-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  window.myProfile[fieldKey] = value;
  renderTodo(window.myProfile);
  cerrarEditarCampo();
  const fieldEl = document.getElementById('p-' + fieldKey);
  if (fieldEl) {
    const orig = fieldEl.textContent;
    fieldEl.innerHTML = '<span class="sec-val-saving">Guardando…</span>';
    try {
      const datos = recogerTodosLosDatos();
      datos[fieldKey] = value;
      await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: datos });
      renderTodo(window.myProfile);
    } catch(e) {
      console.error(e);
      window.myProfile[fieldKey] = orig;
      renderTodo(window.myProfile);
    }
  }
}

function recogerTodosLosDatos() {
  return {
    nombreDerby:        window.myProfile.nombreDerby        || '',
    nombre:             window.myProfile.nombre             || '',
    nombreCivil:        window.myProfile.nombreCivil        || '',
    cedulaPasaporte:    window.myProfile.cedulaPasaporte    || '',
    numero:             window.myProfile.numero             || '',
    pronombres:         window.myProfile.pronombres         || '',
    estado:             window.myProfile.estado             || '',
    rolJugadorx:        window.myProfile.rolJugadorx        || '',
    pagaCuota:          window.myProfile.pagaCuota          || '',
    alergias:           window.myProfile.alergias           || '',
    dieta:              window.myProfile.dieta              || '',
    pais:               window.myProfile.pais               || '',
    codigoPais:         window.myProfile.codigoPais         || '',
    telefono:           window.myProfile.telefono           || '',
    grupoSanguineo:     window.myProfile.grupoSanguineo     || '',
    fechaNacimiento:    window.myProfile.fechaNacimiento    || '',
    contactoEmergencia: window.myProfile.contactoEmergencia || '',
    mostrarCumple:      window.myProfile.mostrarCumple      || '',
    mostrarEdad:        window.myProfile.mostrarEdad        || '',
    email:              window.myProfile.email              || '',
    asisteSemana:       window.myProfile.asisteSemana       || '',
    pruebaFisica:       window.myProfile.pruebaFisica       || '',
    aptoDeporte:        window.myProfile.aptoDeporte        || '',
    tipoUsuario:        window.myProfile.tipoUsuario        || '',
    fotoPerfil:         window.myProfile.fotoPerfil         || '',
    adjCedula:          window.myProfile.adjCedula          || '',
    adjPruebaFisica:    window.myProfile.adjPruebaFisica    || '',
  };
}

// ── ARCHIVOS ──────────────────────────────────────────────────
function configurarTodasLasSubidas() {
  configurarUpload('p-adjPruebaFisica', 'prueba', 'adjPruebaFisica');
  configurarUpload('p-adjCedula',       'cedula', 'adjCedula');
  configurarUpload('p-fotoPerfil',      'foto',   'fotoPerfil');
}

function configurarUpload(inputId, tipoArchivo, campoDestino) {
  const fileInputId = 'fileinput-' + campoDestino;
  let inputReal = document.getElementById(fileInputId);
  if (!inputReal) {
    inputReal = document.createElement('input');
    inputReal.type   = 'file';
    inputReal.id     = fileInputId;
    inputReal.accept = 'image/*';
    inputReal.style.display = 'none';
    document.body.appendChild(inputReal);
  }
  const originalInput = document.getElementById(inputId);
  if (originalInput && originalInput.tagName === 'INPUT' && originalInput.type === 'file') {
    const nuevoInput = document.createElement('input');
    nuevoInput.type   = 'file';
    nuevoInput.id     = inputId;
    nuevoInput.accept = 'image/*';
    nuevoInput.style.display = 'none';
    originalInput.parentNode.replaceChild(nuevoInput, originalInput);
    inputReal = nuevoInput;
  }
  inputReal.addEventListener('click', () => { inputReal.value = ''; });

  const btnSubir = document.getElementById('btn-subir-' + campoDestino);
  if (btnSubir) btnSubir.onclick = () => {
    if (isEditing(inputId) || campoDestino === 'fotoPerfil') inputReal.click();
  };

  inputReal.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:12px 18px;font-size:13px;font-weight:600;color:var(--text);z-index:9999;white-space:nowrap;';
      t.textContent = 'El archivo no puede superar 5 MB';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
      e.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = event.target.result; if (!base64) return;
      if (campoDestino === 'fotoPerfil') { abrirCropper(base64); return; }
      mostrarSubiendo(campoDestino);
      try {
        const result = await gasCall('subirArchivo', { base64Data: base64, tipoArchivo, email: CURRENT_USER.email });
        window.myProfile[campoDestino] = result.url;
        renderEstadoArchivo(campoDestino, result.url);
        mostrarExito(campoDestino);
      } catch(err) {
        console.error('Error subiendo archivo:', err);
        mostrarErrorUpload(campoDestino);
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderEstadoArchivo(campo, url) {
  const contenedor = document.getElementById('estado-' + campo);
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (!url) { contenedor.innerHTML = '<span class="file-status-vacio">Sin archivo</span>'; return; }
  const esImagen = /\.(jpg|jpeg|png|gif|webp)/i.test(url);
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

// ── FOTO ──────────────────────────────────────────────────────
function clickEditarFoto() {
  abrirBottomSheet('Foto de perfil', [
    { label: 'Desde el dispositivo', value: 'device' },
    { label: 'Desde Google Drive',   value: 'drive'  },
  ], null, (val) => {
    if (val === 'drive') { abrirDrivePicker('app'); return; }
    cropTarget = 'app';
    document.getElementById('p-fotoPerfil')?.click();
  });
}
function abrirFotoSinEdicion() { cropTarget = 'app'; document.getElementById('p-fotoPerfil')?.click(); }
function setSecAvatarEditable(editable) {}

function renderFotoPerfil(url) {
  const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="#2b2b2b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-size="20" font-family="Arial">Sin foto</text></svg>');
  [document.getElementById('img-preview-foto'), document.getElementById('sec-img-foto')].forEach(img => {
    if (!img) return;
    img.onerror = () => { img.src = placeholder; };
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';
    img.src = url || placeholder;
    img.onload = () => { img.style.opacity = '1'; };
  });
}

function normalizarDriveUrl(url) {
  if (!url) return '';
  let fileId = null;
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) fileId = m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && m2?.[1]) fileId = m2[1];
  if (!fileId) return url;
  return 'https://lh3.googleusercontent.com/d/' + fileId + '=w500';
}

let _cropOriginalBase64 = null;
function abrirCropper(base64) {
  _cropOriginalBase64 = base64;
  const modal = document.getElementById('modal-crop');
  const image = document.getElementById('crop-image');
  modal.style.display = 'flex';
  pushSentinel();
  if (cropper) { cropper.destroy(); cropper = null; }
  image.onload = null;
  image.src = base64;
  const initCropper = () => {
    cropper = new Cropper(image, {
      aspectRatio: NaN, viewMode: 1, dragMode: 'move',
      autoCrop: true, autoCropArea: 1,
      responsive: true, restore: true, checkCrossOrigin: false,
      modal: false, guides: false, center: false, highlight: false,
      cropBoxMovable: false, cropBoxResizable: false, toggleDragModeOnDblclick: false,
      ready() {
        const con = cropper.getContainerData();
        const img = cropper.getImageData();
        cropper.zoomTo(Math.min(con.width / img.naturalWidth, con.height / img.naturalHeight));
        cropper.setCropBoxData({ left: 0, top: 0, width: con.width, height: con.height });
        const cropBox = document.querySelector('.cropper-crop-box');
        if (cropBox) cropBox.style.visibility = 'hidden';
      }
    });
  };
  if (image.complete && image.naturalWidth) initCropper();
  else image.onload = initCropper;
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) { btnAplicar.disabled = false; btnAplicar.onclick = () => confirmarCrop(); }
}

function confirmarCrop() {
  if (!cropper) return;
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) btnAplicar.disabled = true;
  const con = cropper.getContainerData();
  cropper.setCropBoxData({ left: 0, top: 0, width: con.width, height: con.height });
  const tempCanvas = cropper.getCroppedCanvas({ fillColor: 'transparent' });
  const base64DataUrl = tempCanvas.toDataURL('image/png');
  document.getElementById('modal-crop').style.display = 'none';
  cropper.destroy(); cropper = null;
  if (cropTarget === 'registro') {
    cropTarget = 'app';
    regRecibirFotoRecortada(base64DataUrl);
  } else if (['ligaImagenBase64', 'logoBase64', 'fotoBase64'].includes(cropTarget)) {
    const key = cropTarget;
    cropTarget = 'app';
    wizLigaRecibirImagenRecortada(key, base64DataUrl);
  } else {
    subirImagenRecortada(base64DataUrl);
  }
}

async function subirImagenRecortada(base64) {
  mostrarCargandoFoto(true);
  fotoSubiendo = true;
  try {
    const result = await gasCall('subirArchivo', { base64Data: base64, tipoArchivo: 'foto', email: CURRENT_USER.email || localStorage.getItem('quindes_email') || '' });
    if (!result || !result.url) throw new Error('No se recibio URL');
    window.myProfile.fotoPerfil = result.url;
    renderFotoPerfil(result.url + '?t=' + Date.now());
    await gasCall('updateMyProfile', { rowNumber: CURRENT_USER.id, data: { fotoPerfil: result.url } });
  } catch (e) {
    console.error('Error subiendo foto:', e);
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:12px 18px;font-size:13px;font-weight:600;color:var(--text);z-index:9999;';
    t.textContent = 'Error al subir la foto. Intenta de nuevo.';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  } finally {
    try { mostrarCargandoFoto(false); } catch(e) {}
    fotoSubiendo = false;
  }
}

function mostrarCargandoFoto(show) {
  try {
    let el = document.getElementById('foto-upload-blocker');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'foto-upload-blocker';
        el.innerHTML = '<div class="foto-blocker-inner"><div class="foto-blocker-spinner"></div><span>Cargando foto...</span></div>';
        document.body.appendChild(el);
      }
      el.style.display = 'flex';
      clearTimeout(el._safetyTimer);
      el._safetyTimer = setTimeout(() => { el.style.display = 'none'; }, 15000);
    } else {
      if (el) { clearTimeout(el._safetyTimer); el.style.display = 'none'; }
    }
  } catch(e) {}
}

function cancelarCrop() {
  if (cropper) { cropper.destroy(); cropper = null; }
  document.getElementById('modal-crop').style.display = 'none';
}

// ── DOMContentLoaded ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  history.replaceState({ base: true }, '', location.pathname);
  pushSentinel();

  const emailInput = document.getElementById('p-email');
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailInput.value = emailInput.value.replace(/@.*/, '');
      ajustarAnchoEmail();
    });
  }

  cargarParciales().then(() => {
    initRegistroListeners();
    initDatePickerListeners();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => initGoogleAuth();
    document.head.appendChild(script);
  });
});
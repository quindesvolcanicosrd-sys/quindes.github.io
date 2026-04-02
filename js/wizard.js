// ============================================================
//  QUINDES APP — wizard.js  (flujo de registro)
// ============================================================

const REG_PAISES  = [
  // América Latina
  'Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba',
  'Ecuador','El Salvador','Guatemala','Honduras','México','Nicaragua',
  'Panamá','Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela',
  // América del Norte
  'Canadá','Estados Unidos',
  // Europa
  'Alemania','Austria','Bélgica','Croacia','Dinamarca','España','Finlandia',
  'Francia','Grecia','Hungría','Irlanda','Italia','Noruega','Países Bajos',
  'Polonia','Portugal','Reino Unido','República Checa','Rumania','Rusia',
  'Suecia','Suiza','Turquía','Ucrania',
  // Asia y Oceanía
  'Australia','China','Corea del Sur','Filipinas','India','Indonesia',
  'Israel','Japón','Nueva Zelanda','Singapur','Tailandia','Taiwán',
  // Medio Oriente y África
  'Arabia Saudita','Egipto','Emiratos Árabes Unidos','Nigeria','Sudáfrica',
  // Otros
  'Otro',
];
const REG_CODIGOS = [
  // América Latina
  '🇦🇷 +54','🇧🇴 +591','🇧🇷 +55','🇨🇱 +56','🇨🇴 +57','🇨🇷 +506','🇨🇺 +53',
  '🇪🇨 +593','🇸🇻 +503','🇬🇹 +502','🇭🇳 +504','🇲🇽 +52','🇳🇮 +505',
  '🇵🇦 +507','🇵🇾 +595','🇵🇪 +51','🇵🇷 +1','🇩🇴 +1','🇺🇾 +598','🇻🇪 +58',
  // América del Norte
  '🇨🇦 +1','🇺🇸 +1',
  // Europa
  '🇩🇪 +49','🇦🇹 +43','🇧🇪 +32','🇭🇷 +385','🇩🇰 +45','🇪🇸 +34','🇫🇮 +358',
  '🇫🇷 +33','🇬🇷 +30','🇭🇺 +36','🇮🇪 +353','🇮🇹 +39','🇳🇴 +47','🇳🇱 +31',
  '🇵🇱 +48','🇵🇹 +351','🇬🇧 +44','🇨🇿 +420','🇷🇴 +40','🇷🇺 +7',
  '🇸🇪 +46','🇨🇭 +41','🇹🇷 +90','🇺🇦 +380',
  // Asia y Oceanía
  '🇦🇺 +61','🇨🇳 +86','🇰🇷 +82','🇵🇭 +63','🇮🇳 +91','🇮🇩 +62',
  '🇮🇱 +972','🇯🇵 +81','🇳🇿 +64','🇸🇬 +65','🇹🇭 +66','🇹🇼 +886',
  // Medio Oriente y África
  '🇸🇦 +966','🇪🇬 +20','🇦🇪 +971','🇳🇬 +234','🇿🇦 +27',
  // Otros
  '🌐 +0',
];
const REG_PRONOMBRES = ['Él', 'Ella', 'Elle', 'No definido'];
const REG_ROLES      = ['Jammer', 'Bloquer', 'Blammer', 'Ref', 'Coach', 'Bench', 'No definido'];
const REG_ROLES_JUG  = ['Jammer', 'Bloquer', 'Blammer', 'No definido'];
const REG_ASISTENCIA = ['1 vez', '2 veces', '3 o más veces'];

const WIZ_STEPS_BASE = ['inv',1,2,3,4,5,6,7,8,10,11];
let wizStepSequence = [...WIZ_STEPS_BASE];
let wizStep = 1;
let cropTarget = 'app';

const regData = {
  nombre:'', pronombres:[], pais:'', codigoPais:'',
  telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
  nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
  alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null, codigoInvitacion:'',
};

function esJugadorx(rol) { return REG_ROLES_JUG.includes(rol); }

function wizRecalcSequence() {
  wizStepSequence = esJugadorx(regData.rolJugadorx)
    ? ['inv',1,2,3,4,5,6,7,8,9,10,11]
    : ['inv',1,2,3,4,5,6,7,8,10,11];
}

function wizPositionInSequence() { return wizStepSequence.indexOf(wizStep) + 1; }

function mostrarRegistroWizard() {
  wizStep = 'inv';
  if (!wizOrigen) wizOrigen = 'login';
  const desdeCrearLiga = wizOrigen === 'crearLiga';
  wizRecalcSequence();
  Object.assign(regData, {
    nombre:'', pronombres:[], pais:'', codigoPais:'',
    telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
    nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
    alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null
  });

  ['reg-nombre','reg-telefono','reg-nombreDerby','reg-numero',
   'reg-alergias','reg-dieta','reg-emergencia'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  regResetAvatar();
  regRenderChipsMulti('reg-pronombres-chips', REG_PRONOMBRES, [], v => { regData.pronombres = v; });
  regRenderChips('reg-cumple-chips',     ['Sí','No'],     '', v => { regData.mostrarCumple = v; });
  regRenderChips('reg-edad-chips',       ['Sí','No'],     '', v => { regData.mostrarEdad   = v; });
  regRenderChips('reg-rol-chips',        REG_ROLES,       '', wizOnRolSelected);
  regRenderChips('reg-asiste-chips',     REG_ASISTENCIA,  '', v => { regData.asisteSemana = v; });

  wizSetVal('reg-pais-display',   'Seleccionar país…');
  wizSetVal('reg-codigo-display', '+?');
  wizSetVal('reg-fecha-display',  'Seleccionar fecha…');
  ['reg-pais-btn','reg-codigo-btn','reg-fecha-btn'].forEach(id =>
    document.getElementById(id)?.classList.remove('has-value'));

  const fotoBtn = document.getElementById('wiz-btn-foto');
  if (fotoBtn) fotoBtn.style.display = 'none';

  wizHideError();

  const sInv = document.getElementById('wiz-step-inv');
  if (sInv) { sInv.classList.remove('wiz-active','wiz-animate'); sInv.style.transition = sInv.style.transform = sInv.style.visibility = ''; }
  for (let i = 1; i <= 11; i++) {
    const s = document.getElementById('wiz-step-' + i);
    if (!s) continue;
    s.classList.remove('wiz-active');
    s.style.transition = s.style.transform = s.style.visibility = '';
  }

  document.getElementById('registroScreen').style.display = 'flex';
  const step0 = document.getElementById('wiz-step-0');
  if (step0) step0.style.display = 'none';

  const introEl    = document.getElementById('wiz-intro');
  const headerEl   = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');
if (desdeCrearLiga) {
    document.getElementById('loginScreen').style.display = 'none';
    if (introEl)    introEl.style.display    = 'none';
    if (headerEl)   headerEl.style.display   = 'flex';
    if (viewportEl) viewportEl.style.display = 'block';
    regData.codigoInvitacion = inviteCode;
    wizUpdateHeader();
    wizGoTo(1, true);
  } else {
    if (introEl)    introEl.style.display    = 'flex';
    if (headerEl)   headerEl.style.display   = 'none';
    if (viewportEl) viewportEl.style.display = 'none';
  }

  history.pushState({ wizSentinel: true }, '', location.pathname + '#_wiz');
}

function wizStep0Volver() {
  const step0 = document.getElementById('wiz-step-0');
  if (step0) step0.style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const noEnc = document.getElementById('noEncontradoScreen');
    if (noEnc) noEnc.style.display = 'flex';
  } else {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.style.display = 'flex';
  }
  const regEl = document.getElementById('registroScreen');
  if (regEl) regEl.style.display = 'none';
}

function wizIntroVolver() {
  const introEl = document.getElementById('wiz-intro');
  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(24px)';
    setTimeout(() => {
      introEl.style.display = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }
  const regEl = document.getElementById('registroScreen');
  if (regEl) regEl.style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const noEnc = document.getElementById('noEncontradoScreen');
    if (noEnc) noEnc.style.display = 'flex';
  } else {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.style.display = 'flex';
  }
}

function wizStep0Volver() {
  const step0 = document.getElementById('wiz-step-0');
  if (step0) step0.style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const noEnc = document.getElementById('noEncontradoScreen');
    if (noEnc) noEnc.style.display = 'flex';
  } else {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.style.display = 'flex';
  }
  const regEl = document.getElementById('registroScreen');
  if (regEl) regEl.style.display = 'none';
}

function wizIntroVolver() {
  const introEl = document.getElementById('wiz-intro');
  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(24px)';
    setTimeout(() => {
      introEl.style.display = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }
  const regEl = document.getElementById('registroScreen');
  if (regEl) regEl.style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const noEnc = document.getElementById('noEncontradoScreen');
    if (noEnc) noEnc.style.display = 'flex';
  } else {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.style.display = 'flex';
  }
}

function wizIntroStart() {
  const introEl    = document.getElementById('wiz-intro');
  const headerEl   = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');

  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(-24px)';
    setTimeout(() => {
      introEl.style.display = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }

  setTimeout(() => {
    if (headerEl)   headerEl.style.display   = 'flex';
    if (viewportEl) viewportEl.style.display = 'block';
    wizUpdateHeader();
    const s1 = document.getElementById('wiz-step-inv');
    if (s1) {
      s1.classList.remove('wiz-animate');
      s1.classList.add('wiz-active');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { s1.classList.add('wiz-animate'); });
      });
    }
  }, 200);
}

function wizSetVal(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function wizOnRolSelected(val) {
  regData.rolJugadorx = val;
  regRenderChips('reg-rol-chips', REG_ROLES, val, wizOnRolSelected);
  wizRecalcSequence();
  wizUpdateHeader();
}

function wizGoTo(next, forward = true) {
  const DURATION = 280;
  const prevEl = document.getElementById('wiz-step-' + wizStep);
  const nextEl = document.getElementById('wiz-step-' + next);
  if (!nextEl) return;

  if (prevEl && prevEl._wizCleanup) {
    clearTimeout(prevEl._wizCleanup);
    prevEl._wizCleanup = null;
    prevEl.classList.remove('wiz-active');
    prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
  }

  nextEl.style.transition = 'none';
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-30%)';
  nextEl.style.visibility = 'visible';
  nextEl.classList.add('wiz-active');

  requestAnimationFrame(() => {
    const ease = `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1)`;
    if (prevEl) {
      prevEl.style.transition = ease;
      prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';
      prevEl._wizCleanup = setTimeout(() => {
        prevEl._wizCleanup = null;
        prevEl.classList.remove('wiz-active');
        prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
      }, DURATION + 20);
    }
    nextEl.style.transition = ease;
    nextEl.style.transform  = 'translateX(0)';
    setTimeout(() => { nextEl.classList.add('wiz-animate'); }, DURATION + 10);
    setTimeout(() => {
      if (next === 2) document.getElementById('reg-nombre')?.focus();
      if (next === 5) document.getElementById('reg-telefono')?.focus();
      if (next === 7) document.getElementById('reg-nombreDerby')?.focus();
    }, DURATION + 60);
  });

  wizStep = next;
  wizUpdateHeader();
}

function wizUpdateHeader() {
  const pos   = wizPositionInSequence();
  const total = wizStepSequence.length;
  const fill  = document.getElementById('wiz-progress-fill');
  const label = document.getElementById('wiz-step-label');
  if (fill)  fill.style.width = (pos / total * 100) + '%';
  if (label) label.textContent = 'Paso ' + pos + ' de ' + total;
}

async function wizNext() {
  wizHideError();
  if (wizStep === 'inv') {
    const val = document.getElementById('reg-codigo-inv')?.value.trim();
    if (!val) { wizShowError('Ingresá tu código de invitación 🔑'); return; }
    wizMostrarCargando();
    try {
      const check = await apiCall('/validar-codigo', 'POST', { codigo: val });
      if (!check.valido) { wizOcultarCargando(); wizShowError(check.error || 'Código inválido 🔑'); return; }
      regData.codigoInvitacion = val;
      inviteCode = val;
      wizOcultarCargando();
    } catch(e) {
      wizOcultarCargando();
      wizShowError('Error al verificar el código. Intenta de nuevo.'); return;
    }
  }
  if (wizStep === 2) {
    const val = document.getElementById('reg-nombre')?.value.trim();
    if (!val) { wizShowError('Escribe cómo quieres que te llamemos ✍️'); return; }
    regData.nombre = val;
  }
  if (wizStep === 4 && !regData.pais) { wizShowError('Selecciona tu país de origen 🌎'); return; }
  if (wizStep === 5) {
    if (!regData.codigoPais) { wizShowError('Selecciona el código de tu país 📱'); return; }
    const tel = document.getElementById('reg-telefono')?.value.trim();
    if (!tel) { wizShowError('Ingresa tu número de teléfono 📱'); return; }
    regData.telefono = tel;
  }
  if (wizStep === 6) {
    if (!regData.fechaNacimiento) { wizShowError('Ingresa tu fecha de nacimiento 🎂'); return; }
    if (!regData.mostrarCumple)   { wizShowError('Indica si quieres compartir tu cumpleaños 🎉'); return; }
    if (!regData.mostrarEdad)     { wizShowError('Indica si quieres compartir tu edad 🔢'); return; }
  }
  if (wizStep === 7) {
    regData.nombreDerby = document.getElementById('reg-nombreDerby')?.value.trim() || '';
    regData.numero      = document.getElementById('reg-numero')?.value.trim() || '';
  }
  if (wizStep === 8 && !regData.rolJugadorx) { wizShowError('Selecciona tu rol en el equipo 🏅'); return; }
  if (wizStep === 9 && !regData.asisteSemana) { wizShowError('Indica cuántas veces entrenas por semana 🏋️'); return; }
  if (wizStep === 10) {
    regData.alergias = document.getElementById('reg-alergias')?.value.trim() || '';
    regData.dieta    = document.getElementById('reg-dieta')?.value.trim() || '';
  }
  const idx = wizStepSequence.indexOf(wizStep);
  if (idx < wizStepSequence.length - 1) wizGoTo(wizStepSequence[idx + 1], true);
}

function wizBack() {
  wizHideError();
  const idx = wizStepSequence.indexOf(wizStep);
  if (idx > 0) {
    wizGoTo(wizStepSequence[idx - 1], false);
  } else if (wizOrigen === 'crearLiga') {
    // Volver al último paso del wizard de liga
    document.getElementById('registroScreen').style.display = 'none';
    mostrarWizardLiga();
    setTimeout(() => renderWizLigaPaso(_WIZ_LIGA_TOTAL), 400);
    return;
  } else {
    const introEl    = document.getElementById('wiz-intro');
    const headerEl   = document.getElementById('wiz-header');
    const viewportEl = document.getElementById('wiz-viewport');
    const s1 = document.getElementById('wiz-step-inv');
    if (s1) { s1.classList.remove('wiz-active','wiz-animate'); }
    if (headerEl)   headerEl.style.display   = 'none';
    if (viewportEl) viewportEl.style.display = 'none';
    if (introEl) {
      introEl.style.display   = 'flex';
      introEl.style.opacity   = '0';
      introEl.style.transform = 'translateY(24px)';
      requestAnimationFrame(() => {
        introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        introEl.style.opacity    = '1';
        introEl.style.transform  = 'translateY(0)';
        setTimeout(() => { introEl.style.transition = ''; }, 310);
      });
    }
  }
}

function wizShowError(msg) {
  const el = document.getElementById('reg-error');
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3500);
}
function wizHideError() { const el = document.getElementById('reg-error'); if (el) el.style.display = 'none'; }
function mostrarRegError(msg) { wizShowError(msg); }

function regRenderChips(containerId, opciones, valorActual, onSelect) {
  const el = document.getElementById(containerId); if (!el) return;
  el.innerHTML = '';
  opciones.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip ' + (opt === valorActual ? 'chip-active' : 'chip-inactive');
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      onSelect(opt);
      regRenderChips(containerId, opciones, opt, onSelect);
    });
    el.appendChild(btn);
  });
}

function regRenderChipsMulti(containerId, opciones, valoresActuales, onSelect) {
  const el = document.getElementById(containerId); if (!el) return;
  let seleccionados = Array.isArray(valoresActuales) ? [...valoresActuales] : [];
  const render = () => {
    el.innerHTML = '';
    opciones.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const activo = seleccionados.includes(opt);
      btn.className = 'chip ' + (activo ? 'chip-active' : 'chip-inactive');
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (seleccionados.includes(opt)) {
          seleccionados = seleccionados.filter(v => v !== opt);
        } else {
          seleccionados.push(opt);
        }
        onSelect([...seleccionados]);
        render();
      });
      el.appendChild(btn);
    });
  };
  render();
}

function regAbrirFoto() { document.getElementById('reg-foto-input').click(); }

function regResetAvatar() {
  const img = document.getElementById('reg-avatar-img');
  const ph  = document.getElementById('reg-avatar-placeholder');
  const ov  = document.getElementById('reg-avatar-overlay');
  const ht  = document.getElementById('reg-foto-hint');
  const btn = document.getElementById('wiz-btn-foto');
  if (img) { img.src = ''; img.style.display = 'none'; }
  if (ph)  ph.style.display = 'block';
  if (ov)  ov.style.display = 'none';
  if (ht) { ht.innerHTML = 'Toca para agregar'; ht.classList.remove('reg-foto-hint-compliment'); }
  if (btn) btn.style.display = 'none';
}

function regRecibirFotoRecortada(base64DataUrl) {
  regData.fotoBase64 = base64DataUrl;
  const img = document.getElementById('reg-avatar-img');
  const ph  = document.getElementById('reg-avatar-placeholder');
  const ov  = document.getElementById('reg-avatar-overlay');
  const ht  = document.getElementById('reg-foto-hint');
  const btn = document.getElementById('wiz-btn-foto');
  if (img) { img.src = base64DataUrl; img.style.display = 'block'; }
  if (ph)  ph.style.display = 'none';
  if (ov)  ov.style.display = 'flex';
  if (ht) {
    ht.innerHTML = '✨ <strong>¡Qué bien que te ves!</strong> ✨';
    ht.classList.add('reg-foto-hint-compliment');
  }
  if (btn) btn.style.display = 'flex';
}

function initRegistroListeners() {
  document.getElementById('wiz-back-btn')?.addEventListener('click', wizBack);

  const fi = document.getElementById('reg-foto-input');
  if (fi) {
    fi.addEventListener('click', () => { fi.value = ''; });
    fi.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 5*1024*1024) { alert('La imagen no puede superar 5 MB'); return; }
      const r = new FileReader();
      r.onload = ev => { cropTarget = 'registro'; abrirCropper(ev.target.result); };
      r.readAsDataURL(file);
    });
  }

  document.getElementById('reg-pais-btn')?.addEventListener('click', () => {
    abrirBottomSheet('Nacionalidad', REG_PAISES, regData.pais, val => {
      regData.pais = val; wizSetVal('reg-pais-display', val);
      document.getElementById('reg-pais-btn').classList.add('has-value');
    });
  });

  document.getElementById('reg-codigo-btn')?.addEventListener('click', () => {
    abrirBottomSheet('Código de país', REG_CODIGOS, regData.codigoPais, val => {
      regData.codigoPais = val; wizSetVal('reg-codigo-display', val);
      document.getElementById('reg-codigo-btn').classList.add('has-value');
    });
  });

  document.getElementById('reg-fecha-btn')?.addEventListener('click', () => {
    abrirDatePicker(regData.fechaNacimiento, val => {
      regData.fechaNacimiento = val;
      const p = parseFecha(val);
      const display = p ? `${String(p.day).padStart(2,'0')} ${MESES_CORTO[p.month]} ${p.year}` : val;
      wizSetVal('reg-fecha-display', display);
      document.getElementById('reg-fecha-btn').classList.add('has-value');
    });
  });

  document.getElementById('reg-telefono')?.addEventListener('input', e => { regData.telefono = e.target.value; });
}

const WIZ_LOADING_MSGS = [
  'Preparando todo para ti…', 'Guardando tu información…',
  'Creando tu perfil de estrella…', '¡Ya casi está!',
];

function wizMostrarCargando() {
  const overlay = document.getElementById('wiz-loading-overlay');
  const sub     = document.getElementById('wiz-loading-sub');
  if (!overlay) return;
  overlay.style.display = 'flex';
  let idx = 0;
  if (sub) sub.textContent = WIZ_LOADING_MSGS[0];
  overlay._interval = setInterval(() => {
    idx = (idx + 1) % WIZ_LOADING_MSGS.length;
    if (sub) {
      sub.style.opacity = '0';
      setTimeout(() => { if (sub) { sub.textContent = WIZ_LOADING_MSGS[idx]; sub.style.opacity = '1'; } }, 400);
    }
  }, 2200);
}

function wizOcultarCargando() {
  const overlay = document.getElementById('wiz-loading-overlay');
  if (!overlay) return;
  clearInterval(overlay._interval);
  overlay.style.display = 'none';
}

function lanzarConfetti() {
  const COLORS = ['#ff3b3b','#ff9500','#ffcc00','#34c759','#30b0c7','#af52de','#ff2d55'];
  const N = 90;
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  for (let i = 0; i < N; i++) {
    const el = document.createElement('div');
    const size = 7 + Math.random() * 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = Math.random() * 100;
    const rot = Math.random() * 360;
    const delay = Math.random() * 0.6;
    const dur = 1.8 + Math.random() * 1.2;
    const isCircle = Math.random() > 0.5;
    el.style.cssText = `
      position:absolute;
      left:${x}vw; top:-${size}px;
      width:${size}px; height:${isCircle ? size : size * 0.5}px;
      background:${color};
      border-radius:${isCircle ? '50%' : '2px'};
      opacity:1;
      animation: confetti-fall ${dur}s ${delay}s cubic-bezier(0.25,0,0.5,1) forwards;
      transform: rotate(${rot}deg);
    `;
    container.appendChild(el);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes confetti-fall {
    0%   { transform: translateY(0) rotate(0deg); opacity:1; }
    80%  { opacity:1; }
    100% { transform: translateY(105vh) rotate(720deg); opacity:0; }
  }`;
  document.head.appendChild(style);
  setTimeout(() => { container.remove(); style.remove(); }, 3500);
}

function mostrarBienvenida() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9998;
    background:rgba(0,0,0,0.55);
    display:flex;align-items:flex-end;justify-content:center;
    padding-bottom:env(safe-area-inset-bottom);
    animation: wiz-overlay-in 0.3s ease both;
  `;
  overlay.innerHTML = `
    <div style="
      background:var(--card);
      border-radius:24px 24px 0 0;
      padding:28px 24px 36px;
      max-width:480px;width:100%;
      display:flex;flex-direction:column;gap:16px;
      animation: wiz-fade-up 0.35s cubic-bezier(0.4,0,0.2,1) both;
    ">
      <div style="font-size:48px;text-align:center;line-height:1;">🎉</div>
      <h2 style="
        font-size:22px;font-weight:900;font-style:italic;text-transform:uppercase;
        letter-spacing:-0.3px;color:var(--text);-webkit-text-fill-color:var(--text);
        margin:0;text-align:center;
      ">¡Bienvenidx al equipo!</h2>
      <p style="
        font-size:14px;font-weight:400;line-height:1.65;
        color:var(--text2);-webkit-text-fill-color:var(--text2);
        margin:0;text-align:center;
      ">Recuerda que puedes actualizar o añadir información adicional en las secciones de tu perfil.<br><br>
      También podrás consultar próximos entrenamientos, marcar asistencias, revisar tareas disponibles, la tabla de puntajes, información del equipo y mucho más.</p>
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        margin-top:4px;padding:18px;border-radius:9999px;border:none;
        background:linear-gradient(135deg,#ff3b3b 0%,#c41212 100%);
        color:#fff;-webkit-text-fill-color:#fff;
        font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;
        cursor:pointer;font-family:inherit;
        box-shadow:0 8px 24px rgba(220,30,30,0.35);
      ">¡Vamos! 🛼</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function submitRegistro() {
  regData.contactoEmergencia = document.getElementById('reg-emergencia')?.value.trim() || '';
  wizHideError();
  const btnEl = document.getElementById('reg-submit');
  if (btnEl) btnEl.disabled = true;
  wizMostrarCargando();

  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email') || '';
    console.log('[SUBMIT] email:', email, '| wizOrigen:', wizOrigen, '| _wizLiga:', JSON.stringify(_wizLiga));

    if (wizOrigen === 'crearLiga') {
      console.log('[SUBMIT] entrando a crearLiga');
      const json = await apiCall('/crear-liga', 'POST', {
        email,
        nombreLiga:   _wizLiga.nombreLiga,
        nombreEquipo: _wizLiga.nombreEquipo,
        categoria:    _wizLiga.categoria || null,
        ligaImagenBase64: _wizLiga.ligaImagenBase64 || null,
        logoBase64:   _wizLiga.logoBase64 || null,
        nombre: regData.nombre.trim(),
        pronombres: Array.isArray(regData.pronombres) ? regData.pronombres.join(', ') : (regData.pronombres || ''),
        pais: regData.pais, codigoPais: regData.codigoPais,
        telefono: regData.telefono.trim(), fechaNacimiento: regData.fechaNacimiento,
        mostrarCumple: regData.mostrarCumple, mostrarEdad: regData.mostrarEdad,
        nombreDerby: regData.nombreDerby, numero: regData.numero,
        rolJugadorx: regData.rolJugadorx, asisteSemana: regData.asisteSemana,
        alergias: regData.alergias, dieta: regData.dieta,
        contactoEmergencia: regData.contactoEmergencia,
        fotoBase64: regData.fotoBase64 || null,
      });
      localStorage.setItem('quindes_email', email);
      CURRENT_USER = { found: true, id: json.perfil.id, email, rolApp: 'Admin', equipoId: json.equipo.id, ligaId: json.liga.id };
      const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = email;
      const profile = await apiCall('/perfil/' + json.perfil.id);
      window.myProfile = profile;
      configurarTodasLasSubidas();
      renderTodo(profile);
      aplicarPermisos();
      wizOcultarCargando();
      window._enFlujoCrearLiga = false;
      sessionStorage.removeItem('_enFlujoCrearLiga');
      inicializarAjustes();
      document.getElementById('registroScreen').style.display = 'none';
      document.getElementById('loadingScreen').style.display  = 'none';
      const appEl = document.getElementById('appContent');
      appEl.style.display = 'block';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        appEl.classList.add('visible');
        setTimeout(() => { lanzarConfetti(); mostrarBienvenida(); }, 400);
      }));
      if (CURRENT_USER?.ligaId) cargarMiLiga({ render: false });
      return;
    }

    const json = await apiCall('/registrar', 'POST', {
      email,
      nombre: regData.nombre.trim(),
      pronombres: Array.isArray(regData.pronombres) ? regData.pronombres.join(', ') : (regData.pronombres || ''),
      pais: regData.pais, codigoPais: regData.codigoPais,
      telefono: regData.telefono.trim(), fechaNacimiento: regData.fechaNacimiento,
      mostrarCumple: regData.mostrarCumple, mostrarEdad: regData.mostrarEdad,
      nombreDerby: regData.nombreDerby, numero: regData.numero,
      rolJugadorx: regData.rolJugadorx, asisteSemana: regData.asisteSemana,
      alergias: regData.alergias, dieta: regData.dieta,
      contactoEmergencia: regData.contactoEmergencia,
      fotoBase64: regData.fotoBase64 || null,
      codigoInvitacion: regData.codigoInvitacion || inviteCode || '',
    });

    CURRENT_USER = { found: true, id: json.perfilId, rowNumber: json.perfilId, email, rolApp: 'Invitado' };
    const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = email;

    const profile = await apiCall('/perfil/' + json.perfilId);
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    wizOcultarCargando();
    document.getElementById('registroScreen').style.display = 'none';
    document.getElementById('appContent').style.display    = 'block';
    sessionStorage.removeItem('quindes_invite');
    setTimeout(() => {
      lanzarConfetti();
      mostrarBienvenida();
    }, 400);

  } catch(err) {
    wizOcultarCargando();
    wizShowError(err.message || 'Algo salió mal. Intenta de nuevo 😅');
    if (btnEl) btnEl.disabled = false;
  }

}

function renderWizLigaPaso(paso) {
  const forward = paso >= _wizLigaPaso;
  _wizLigaPaso = paso;
  const btnBack   = document.getElementById('wiz-liga-btn-back');
  const btnNext   = document.getElementById('wiz-liga-btn-next');
  const pasoLabel = document.getElementById('wiz-liga-paso-label');
  const progress  = document.getElementById('wiz-liga-progress');
  const contenido = document.getElementById('wiz-liga-contenido');
  if (!contenido) return;

  const esIntro = paso === 0;
  const header  = document.querySelector('#wiz-liga-overlay .wiz-equipo-header');
  const footer  = document.querySelector('#wiz-liga-overlay .wiz-equipo-footer');
  if (header)    header.style.display  = esIntro ? 'none' : '';
  if (footer)    footer.style.display  = esIntro ? 'none' : '';
  if (btnBack)   btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = `Paso ${paso} de ${_WIZ_LIGA_TOTAL}`;
  if (progress)  progress.style.width  = (paso / _WIZ_LIGA_TOTAL * 100) + '%';
  if (btnNext)   btnNext.textContent   = paso === _WIZ_LIGA_TOTAL ? '¡Crear todo! 🛼' : 'Continuar';

  if (paso === 0) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-intro-bg">
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-1"></div>
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-2"></div>
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-3"></div>
        </div>
        <div class="wiz-liga-intro-content">
          <div class="wiz-intro-logo">🏟️</div>
          <h1 class="wiz-intro-title">Creá<br>tu liga</h1>
          <p class="wiz-intro-sub">En pocos pasos vas a tener tu liga, tu equipo y tu perfil listos.</p>
          <div class="wiz-intro-steps">
            <div class="wiz-intro-step wiz-intro-step-1"><span class="wiz-intro-step-ico">🏟️</span><span class="wiz-intro-step-txt">Datos de tu liga y equipo</span></div>
            <div class="wiz-intro-step wiz-intro-step-2"><span class="wiz-intro-step-ico">👤</span><span class="wiz-intro-step-txt">Tu perfil de administradorx del equipo</span></div>
            <div class="wiz-intro-step wiz-intro-step-3"><span class="wiz-intro-step-ico">🔑</span><span lass="wiz-intro-step-txt">Código para invitar patinadorxs y miembros de tu equipo</span></div>
          </div>
          <button onclick="wizLigaIntroStart()" class="wiz-intro-btn">
            Empezar <span class="material-icons">arrow_forward</span>
          </button>
          <button onclick="cerrarWizLiga()" class="wiz-btn-skip">Cancelar</button>
        </div>
      `;
      if (footer) footer.classList.add('wiz-hidden');
      if (btnBack) btnBack.classList.add('wiz-hidden');
    }, forward);
    return;
  }

  if (footer) footer.classList.remove('wiz-hidden');

  if (paso === 1) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-intro-bg">
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-1"></div>
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-2"></div>
          <div class="wiz-intro-bg-ring wiz-intro-bg-ring-3"></div>
        </div>
        <div class="wiz-liga-intro-content">
          <div class="wiz-intro-logo">👤</div>
          <h1 class="wiz-intro-title">Vamos a<br>registrarte</h1>
          <div id="wiz-liga-google-btn" class="wiz-liga-google-wrap"></div>
        </div>
      `;
      if (footer) footer.classList.add('wiz-hidden');
      if (btnBack) btnBack.classList.remove('wiz-hidden');
      requestAnimationFrame(() => {
        const wrap = document.getElementById('wiz-liga-google-btn');
        if (wrap) {
          google.accounts.id.renderButton(wrap, {
            theme: getGoogleBtnTheme(), size: 'large', width: 300, text: 'continue_with',
          });
          setTimeout(() => wrap.classList.add('visible'), 120);
        }
      });
    }, forward);
    return;
  }

  if (paso === 2) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🏟️</div>
        <h2 class="wiz-title">¿Cómo se llama tu liga?</h2>
        <p class="wiz-desc">El nombre de la organización.</p>
        <div class="wiz-content">
          <input id="wiz-liga-nombre" type="text" placeholder="Nombre de la liga" value="${_wizLiga.nombreLiga}"
            class="reg-input wiz-big-input"
            oninput="_wizLiga.nombreLiga=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-nombre')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 3) {
    const preview = _wizLiga.ligaImagenBase64
      ? `<img src="${_wizLiga.ligaImagenBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🖼️</div>
        <h2 class="wiz-title">Logo de tu liga</h2>
        <p class="wiz-desc">Subí un logo o ícono que la represente. Opcional.</p>
        <div class="wiz-content">
          <div class="wiz-liga-avatar-wrap">
            <label class="wiz-liga-avatar" id="wiz-liga-img-label">
              ${preview}
              <input type="file" accept="image/*" style="display:none;" onchange="previewImagenLiga(this)">
            </label>
          </div>
          <p class="reg-note">Opcional — puedes saltarte este paso</p>
        </div>
      `;
    }, forward);
    return;
  }

  if (paso === 4) {
    const ciudades = CIUDADES_POR_PAIS[_wizLiga.pais] || [];
    const ciudadOpts = ciudades.map(c =>
      `<option value="${c}" ${_wizLiga.ciudad === c ? 'selected' : ''}>${c}</option>`
    ).join('');
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🌎</div>
        <h2 class="wiz-title">¿De dónde es tu liga?</h2>
        <p class="wiz-desc">País y ciudad donde opera principalmente.</p>
        <div class="wiz-content">
          <select id="wiz-liga-pais-sel" class="reg-input" onchange="onWizLigaPaisChange(this.value)">
            <option value="">Seleccionar país…</option>
            ${REG_PAISES.map(p => `<option value="${p}" ${_wizLiga.pais === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          <div id="wiz-liga-ciudad-wrap" style="${_wizLiga.pais ? '' : 'display:none;'}margin-top:12px;">
            <select id="wiz-liga-ciudad-sel" class="reg-input" onchange="_wizLiga.ciudad=this.value;document.getElementById('wiz-liga-ciudad-custom-wrap').style.display=this.value==='__otro__'?'block':'none';">
              <option value="">Seleccionar ciudad…</option>
              ${ciudadOpts}
              <option value="__otro__" ${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? 'selected' : ''}>Mi ciudad no está en la lista…</option>
            </select>
            <div id="wiz-liga-ciudad-custom-wrap" style="display:${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? 'block' : 'none'};margin-top:8px;">
              <input id="wiz-liga-ciudad-custom" type="text" placeholder="Escribe tu ciudad"
                value="${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? _wizLiga.ciudad : ''}"
                class="reg-input" oninput="_wizLiga.ciudad=this.value">
            </div>
          </div>
          <p class="reg-note">Opcional — puedes saltarte este paso</p>
        </div>
      `;
    }, forward);
    return;
  }

  if (paso === 5) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">📅</div>
        <h2 class="wiz-title">Cuéntanos más</h2>
        <p class="wiz-desc">Año de fundación y una descripción de tu liga.</p>
        <div class="wiz-content">
          <input id="wiz-liga-anio" type="number" placeholder="Año de fundación (ej: 2018)"
            value="${_wizLiga.anioFundacion}" min="1990" max="${new Date().getFullYear()}"
            class="reg-input" oninput="_wizLiga.anioFundacion=this.value">
          <textarea id="wiz-liga-descripcion" placeholder="Describe tu liga: misión, origen, valores…" rows="4"
            class="reg-input" style="margin-top:12px;"
            oninput="_wizLiga.descripcion=this.value"
            maxlength="500">${_wizLiga.descripcion || ''}</textarea>
          <p class="reg-note">Ambos campos son opcionales</p>
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-anio')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 6) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">📬</div>
        <h2 class="wiz-title">Contacto de la liga</h2>
        <p class="wiz-desc">¿Dónde pueden encontrarlos online? Opcional.</p>
        <div class="wiz-content">
          <input id="wiz-liga-ig" type="text" placeholder="@tuliga o https://instagram.com/tuliga"
            value="${_wizLiga.contactoSocial || ''}"
            class="reg-input"
            oninput="_wizLiga.contactoSocial=this.value">
          <p class="reg-note">Opcional — puedes saltarte este paso</p>
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-ig')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 7) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🛼</div>
        <h2 class="wiz-title">¿Cómo se llama tu equipo?</h2>
        <p class="wiz-desc">Puedes agregar más equipos desde Ajustes después.</p>
        <div class="wiz-content">
          <input id="wiz-liga-equipo-nombre" type="text" placeholder="Nombre del equipo"
            value="${_wizLiga.nombreEquipo}"
            class="reg-input wiz-big-input"
            oninput="_wizLiga.nombreEquipo=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-equipo-nombre')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 8) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🏆</div>
        <h2 class="wiz-title">¿Qué categoría?</h2>
        <p class="wiz-desc">Selecciona la categoría en la que compite tu equipo.</p>
        <div class="wiz-content">
          <div class="wiz-chips">
            ${['A','B','C'].map(cat => `
              <button onclick="seleccionarCategoriaLigaWiz('${cat}')"
                id="wiz-liga-cat-${cat}"
                class="chip ${_wizLiga.categoria === cat ? 'chip-active' : 'chip-inactive'}">
                ${cat}
              </button>`).join('')}
          </div>
          <p class="reg-note">Opcional — puedes saltarte este paso</p>
        </div>
      `;
    }, forward);
    return;
  }

  if (paso === 9) {
    const preview = _wizLiga.logoBase64
      ? `<img src="${_wizLiga.logoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    const colorActual = _wizLiga.colorPrimario || document.documentElement.dataset.colorPrimario || '#ef4444';
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🎨</div>
        <h2 class="wiz-title">Personaliza tu equipo</h2>
        <p class="wiz-desc">Logo y color de énfasis. Así se verá la app cuando uses este equipo.</p>
        <div class="wiz-content">
          <div class="wiz-liga-avatar-wrap">
            <label class="wiz-liga-avatar" id="wiz-liga-logo-label">
              ${preview}
              <input type="file" accept="image/*" style="display:none;" onchange="previewLogoLigaWiz(this)">
            </label>
          </div>
          <p style="font-size:13px;color:var(--text3);margin:16px 0 8px;font-weight:600;">Color de énfasis</p>
          <div class="wiz-color-presets" id="wiz-color-presets">
            ${COLOR_PICKER_PRESETS.map(c => `
              <button class="color-swatch-btn ${c === colorActual ? 'selected' : ''}"
                style="background:${c}" onclick="seleccionarColorWiz('${c}')" data-color="${c}">
              </button>`).join('')}
          </div>
          <p class="reg-note">Opcional — puedes saltarte este paso</p>
        </div>
      `;
    }, forward);
    return;
  }

  if (paso === 10) {
    wizLigaGoTo(el => {
      const preview = _wizLiga.fotoBase64
        ? `<img src="${_wizLiga.fotoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:36px;">`
        : `<span class="material-icons reg-avatar-placeholder">add_a_photo</span>`;
      el.innerHTML = `
        <div class="wiz-emoji">📸</div>
        <h2 class="wiz-title">¡Ponele cara al nombre!</h2>
        <p class="wiz-desc">Subí una foto para que todxs en el equipo puedan identificarte. Opcional.</p>
        <div class="wiz-content">
          <div class="reg-foto-center">
            <label class="reg-avatar" id="wiz-liga-foto-label">
              ${preview}
              <input type="file" accept="image/*" id="wiz-liga-foto-input" style="display:none;" onchange="previewFotoLigaWiz(this)">
            </label>
            <p class="reg-foto-hint" id="wiz-liga-foto-hint">Toca para agregar tu foto</p>
          </div>
        </div>
        <div class="wiz-actions" style="margin-top:auto;padding-top:24px;">
          <button class="wiz-btn-skip" onclick="wizLigaPasoSiguiente()">Omitir por ahora</button>
        </div>
      `;
    }, forward);
    return;
  }

  if (paso === 11) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">✨</div>
        <h2 class="wiz-title">¿Cómo te llamamos?</h2>
        <p class="wiz-desc">Tu nombre o apodo en el equipo.</p>
        <div class="wiz-content">
          <input id="wiz-liga-perfil-nombre" type="text" placeholder="Ej: Valentina, Val…"
            value="${_wizLiga.nombre || ''}"
            class="reg-input wiz-big-input"
            oninput="_wizLiga.nombre=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-perfil-nombre')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 12) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🏳️‍🌈</div>
        <h2 class="wiz-title">¿Con qué pronombres te identificás?</h2>
        <p class="wiz-desc">Opcional.</p>
        <div class="wiz-content">
          <div id="wiz-liga-pronombres-chips" class="wiz-chips"></div>
        </div>
      `;
      regRenderChipsMulti('wiz-liga-pronombres-chips', REG_PRONOMBRES, _wizLiga.pronombres || [], v => { _wizLiga.pronombres = v; });
    }, forward);
    return;
  }

  if (paso === 13) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🌎</div>
        <h2 class="wiz-title">¿De dónde sos?</h2>
        <p class="wiz-desc">Tu país de origen.</p>
        <div class="wiz-content">
          <button type="button" id="wiz-liga-perfil-pais-btn" class="reg-selector-btn wiz-selector-btn">
            <span id="wiz-liga-perfil-pais-display" class="reg-selector-val">${_wizLiga.paisPerfil || 'Seleccionar país…'}</span>
            <span class="material-icons reg-selector-ico">expand_more</span>
          </button>
          <p class="reg-note">Opcional</p>
        </div>
      `;
      document.getElementById('wiz-liga-perfil-pais-btn').onclick = () => {
        abrirBottomSheet('Nacionalidad', REG_PAISES, _wizLiga.paisPerfil || '', val => {
          _wizLiga.paisPerfil = val;
          document.getElementById('wiz-liga-perfil-pais-display').textContent = val;
        });
      };
    }, forward);
    return;
  }

  if (paso === 14) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">📱</div>
        <h2 class="wiz-title">Tu número de contacto</h2>
        <p class="wiz-desc">Prefijo y número. Opcional.</p>
        <div class="wiz-content">
          <div class="reg-phone-row">
            <button type="button" id="wiz-liga-perfil-codigo-btn" class="reg-selector-btn reg-codigo-btn">
              <span class="reg-selector-val" id="wiz-liga-perfil-codigo-display">${_wizLiga.codigoPais || '+?'}</span>
              <span class="material-icons reg-selector-ico">expand_more</span>
            </button>
            <input id="wiz-liga-perfil-tel" type="tel" placeholder="Número" maxlength="20"
              value="${_wizLiga.telefono || ''}"
              class="reg-input reg-tel-input"
              oninput="_wizLiga.telefono=this.value"
              onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
          </div>
          <p class="reg-note">Opcional</p>
        </div>
      `;
      document.getElementById('wiz-liga-perfil-codigo-btn').onclick = () => {
        abrirBottomSheet('Código de país', REG_CODIGOS, _wizLiga.codigoPais || '', val => {
          _wizLiga.codigoPais = val;
          document.getElementById('wiz-liga-perfil-codigo-display').textContent = val;
        });
      };
      setTimeout(() => document.getElementById('wiz-liga-perfil-tel')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 15) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🎂</div>
        <h2 class="wiz-title">Fecha de nacimiento</h2>
        <p class="wiz-desc">Ingresá tu fecha. Luego elegís qué ve el equipo.</p>
        <div class="wiz-content">
          <button type="button" id="wiz-liga-perfil-fecha-btn" class="reg-selector-btn wiz-selector-btn">
            <span id="wiz-liga-perfil-fecha-display" class="reg-selector-val">${_wizLiga.fechaNacimiento || 'Seleccionar fecha…'}</span>
            <span class="material-icons reg-selector-ico">edit_calendar</span>
          </button>
          <div class="wiz-privacy-box">
            <p class="wiz-privacy-title">¿Qué ven tus compañerxs? 👀</p>
            <div class="wiz-privacy-row">
              <span class="wiz-privacy-q">Mostrar fecha de cumpleaños 🎉</span>
              <div id="wiz-liga-cumple-chips" class="wiz-chips-inline"></div>
            </div>
            <div class="wiz-privacy-row">
              <span class="wiz-privacy-q">Mostrar edad 🔢</span>
              <div id="wiz-liga-edad-chips" class="wiz-chips-inline"></div>
            </div>
          </div>
        </div>
      `;
      document.getElementById('wiz-liga-perfil-fecha-btn').onclick = () => {
        abrirDatePicker(_wizLiga.fechaNacimiento || '', val => {
          _wizLiga.fechaNacimiento = val;
          document.getElementById('wiz-liga-perfil-fecha-display').textContent = val;
        });
      };
      regRenderChips('wiz-liga-cumple-chips', ['Sí','No'], _wizLiga.mostrarCumple || '', v => { _wizLiga.mostrarCumple = v; });
      regRenderChips('wiz-liga-edad-chips',   ['Sí','No'], _wizLiga.mostrarEdad   || '', v => { _wizLiga.mostrarEdad   = v; });
    }, forward);
    return;
  }

  if (paso === 16) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">⭐</div>
        <h2 class="wiz-title">Datos Derby <span class="wiz-optional-badge">opcional</span></h2>
        <p class="wiz-desc">Tu nombre y número derby. Podés completarlo después.</p>
        <div class="wiz-content">
          <input id="wiz-liga-perfil-derby" type="text" placeholder="Nombre Derby"
            class="reg-input wiz-big-input"
            value="${_wizLiga.nombreDerby || ''}"
            oninput="_wizLiga.nombreDerby=this.value"
            onkeydown="if(event.key==='Enter') document.getElementById('wiz-liga-perfil-numero').focus()">
          <input id="wiz-liga-perfil-numero" type="text" placeholder="Número Derby"
            class="reg-input wiz-big-input" style="margin-top:12px;"
            value="${_wizLiga.numeroDerby || ''}"
            oninput="_wizLiga.numeroDerby=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-perfil-derby')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 17) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🏅</div>
        <h2 class="wiz-title">Tu rol en el equipo</h2>
        <p class="wiz-desc">Seleccioná tu posición.</p>
        <div class="wiz-content">
          <div id="wiz-liga-rol-chips" class="wiz-chips"></div>
        </div>
      `;
      regRenderChips('wiz-liga-rol-chips', REG_ROLES, _wizLiga.rolJugadorx || '', v => { _wizLiga.rolJugadorx = v; });
    }, forward);
    return;
  }

  if (paso === 18) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🏋️</div>
        <h2 class="wiz-title">¿Cuánto entrenás?</h2>
        <p class="wiz-desc">Veces por semana.</p>
        <div class="wiz-content">
          <div id="wiz-liga-asiste-chips" class="wiz-chips"></div>
        </div>
      `;
      regRenderChips('wiz-liga-asiste-chips', REG_ASISTENCIA, _wizLiga.asisteSemana || '', v => { _wizLiga.asisteSemana = v; });
    }, forward);
    return;
  }

  if (paso === 19) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🩺</div>
        <h2 class="wiz-title">Tu salud nos importa <span class="wiz-optional-badge">opcional</span></h2>
        <p class="wiz-desc">Alergias o condiciones que debamos conocer. Estrictamente confidencial.</p>
        <div class="wiz-content">
          <input id="wiz-liga-perfil-alergias" type="text" placeholder="Alergias o condiciones de salud"
            class="reg-input" value="${_wizLiga.alergias || ''}"
            oninput="_wizLiga.alergias=this.value"
            onkeydown="if(event.key==='Enter') document.getElementById('wiz-liga-perfil-dieta').focus()">
          <input id="wiz-liga-perfil-dieta" type="text" placeholder="Dieta especial"
            class="reg-input" style="margin-top:12px;" value="${_wizLiga.dieta || ''}"
            oninput="_wizLiga.dieta=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-perfil-alergias')?.focus(), 350);
    }, forward);
    return;
  }

  if (paso === 20) {
    wizLigaGoTo(el => {
      el.innerHTML = `
        <div class="wiz-emoji">🆘</div>
        <h2 class="wiz-title">Contacto de emergencia <span class="wiz-optional-badge">opcional</span></h2>
        <p class="wiz-desc">Nombre y teléfono de alguien de confianza.</p>
        <div class="wiz-content">
          <input id="wiz-liga-perfil-emergencia" type="text"
            placeholder="Ej: María García +593 999 123456" maxlength="150"
            class="reg-input" value="${_wizLiga.contactoEmergencia || ''}"
            oninput="_wizLiga.contactoEmergencia=this.value"
            onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
        </div>
      `;
      setTimeout(() => document.getElementById('wiz-liga-perfil-emergencia')?.focus(), 350);
    }, forward);
    return;
  }
}

function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 2 && !_wizLiga.nombreLiga.trim()) {
    mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return;
  }
  if (_wizLigaPaso === 7 && !_wizLiga.nombreEquipo.trim()) {
    mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return;
  }
  if (_wizLigaPaso === 11 && !_wizLiga.nombre.trim()) {
    mostrarToastGuardado('⚠️ Escribe cómo te llamamos'); return;
  }
  if (_wizLigaPaso === 15 && !_wizLiga.fechaNacimiento) {
    mostrarToastGuardado('⚠️ Ingresá tu fecha de nacimiento'); return;
  }
  if (_wizLigaPaso === _WIZ_LIGA_TOTAL) {
    wizLigaSubmit(); return;
  }
  renderWizLigaPaso(_wizLigaPaso + 1);
}

function wizLigaPasoAnterior() {
  if (_wizLigaPaso > 1) renderWizLigaPaso(_wizLigaPaso - 1);
  else cerrarWizLiga();
}
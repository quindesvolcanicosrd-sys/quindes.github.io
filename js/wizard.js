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
    if (introEl)    introEl.style.display    = 'none';
    if (headerEl)   headerEl.style.display   = 'flex';
    if (viewportEl) viewportEl.style.display = 'block';
    regData.codigoInvitacion = inviteCode;
    console.log('[WIZ-REG] desdeCrearLiga — registroScreen display:', document.getElementById('registroScreen')?.style.display);
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

    if (wizOrigen === 'crearLiga') {
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
      document.getElementById('registroScreen').style.display = 'none';
      document.getElementById('appContent').style.display    = 'block';
      setTimeout(() => { lanzarConfetti(); mostrarBienvenida(); }, 400);
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
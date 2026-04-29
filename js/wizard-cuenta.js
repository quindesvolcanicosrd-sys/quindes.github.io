// ============================================================
//  PIVOT APP — wizard-cuenta.js
//  Wizard de registro de cuenta/perfil
//  ⚠️  Este archivo expone globales usadas por wizard-liga.js:
//      procesarImagen, regRenderChips, regRenderChipsMulti,
//      wizMostrarCargando, wizOcultarCargando,
//      lanzarConfetti, mostrarBienvenida,
//      REG_PAISES, REG_CODIGOS, REG_PRONOMBRES,
//      REG_ROLES, REG_ROLES_JUG, REG_ASISTENCIA
//  ⚠️  Debe cargarse ANTES que wizard-liga.js en index.html
// ============================================================

// ── UTILIDAD COMPARTIDA: procesado de imagen ─────────────────
function procesarImagen(file, { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = width  * ratio;
          height = height * ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const isPng = file.type === 'image/png';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── UTILIDADES COMPARTIDAS: chips ────────────────────────────
function regRenderChips(containerId, opciones, valorActual, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!el.dataset.initialized) {
    el.innerHTML = '';
    opciones.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.className = 'chip chip-inactive';
      btn.addEventListener('click', () => {
        el.querySelectorAll('.chip').forEach(b => { b.classList.remove('chip-active'); b.classList.add('chip-inactive'); });
        btn.classList.add('chip-active');
        btn.classList.remove('chip-inactive');
        onSelect(opt);
      });
      el.appendChild(btn);
    });
    el.dataset.initialized = 'true';
  }
  el.querySelectorAll('.chip').forEach(btn => {
    btn.classList.toggle('chip-active',   btn.textContent === valorActual);
    btn.classList.toggle('chip-inactive', btn.textContent !== valorActual);
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
      btn.className = 'chip ' + (seleccionados.includes(opt) ? 'chip-active' : 'chip-inactive');
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (seleccionados.includes(opt)) seleccionados = seleccionados.filter(v => v !== opt);
        else seleccionados.push(opt);
        onSelect([...seleccionados]);
        render();
      });
      el.appendChild(btn);
    });
  };
  render();
}

// ── MOTOR GENÉRICO DE WIZARD ──────────────────────────────────
function createWizard(config) {
  let currentStep = config.initialStep;
  const sequence  = config.sequence;

  function next() {
    const idx        = sequence.indexOf(currentStep);
    const stepConfig = config.steps[currentStep];
    if (stepConfig && stepConfig.validate) {
      const error = stepConfig.validate();
      if (error) return config.onError && config.onError(error);
    }
    if (stepConfig && stepConfig.action) {
      return Promise.resolve(stepConfig.action()).then(err => {
        if (err) return config.onError && config.onError(err);
        resolveNext(stepConfig, idx);
      });
    }
    resolveNext(stepConfig, idx);
  }

  function resolveNext(stepConfig, idx) {
    let nextStep;
    if (stepConfig && typeof stepConfig.next === 'function') nextStep = stepConfig.next(regData);
    else if (stepConfig && stepConfig.next)                  nextStep = stepConfig.next;
    else                                                     nextStep = sequence[idx + 1];
    go(nextStep, true);
  }

  function back() {
    const idx        = sequence.indexOf(currentStep);
    const stepConfig = config.steps[currentStep];
    let prevStep;
    if (stepConfig && typeof stepConfig.back === 'function') prevStep = stepConfig.back(regData);
    else if (stepConfig && stepConfig.back)                  prevStep = stepConfig.back;
    else                                                     prevStep = sequence[idx - 1];
    go(prevStep, false);
  }

  function go(step, forward) {
    if (forward === undefined) forward = true;
    if (!step) return;
    if (config.onBeforeChange) config.onBeforeChange(currentStep, step);
    if (config.transition)     config.transition(currentStep, step, forward);
    currentStep = step;
    if (config.onAfterChange)  config.onAfterChange(step);
  }

  function getStep() { return currentStep; }

  return { next, back, go, getStep };
}

// ── VALIDATORS ────────────────────────────────────────────────
const WIZ_VALIDATORS = {
  nombre: function(v) { return !v ? 'Escribe cómo quieres que te llamemos ✍️' : null; },

  telefono: function(v) {
    if (!v) return null;
    const clean = v.replace(/\D/g, '');
    if (regData.codigoPais) {
      if (regData.codigoPais.includes('+593')) {
        if (clean.length !== 10) return 'El número debe tener 10 dígitos 🇪🇨';
        if (!clean.startsWith('0')) return 'Debe empezar con 0 🇪🇨';
      }
      if (regData.codigoPais.includes('+1')) {
        if (clean.length !== 10) return 'Número inválido 🇺🇸';
      }
    }
    if (clean.length < 7) return 'Número demasiado corto 📱';
    return null;
  },

  codigoPais:  function(v) { return !v ? 'Selecciona el código de tu país 📱' : null; },
  rol:         function(v) { return !v ? 'Selecciona tu rol en el equipo 🏅' : null; },
  asistencia:  function(v) { return !v ? 'Indica cuántas veces entrenas 🏋️' : null; },
};

// ── DATOS ESTÁTICOS (compartidos con wizard-liga.js) ──────────
const REG_PAISES = [
  'Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba',
  'Ecuador','El Salvador','Guatemala','Honduras','México','Nicaragua',
  'Panamá','Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela',
  'Canadá','Estados Unidos',
  'Alemania','Austria','Bélgica','Croacia','Dinamarca','España','Finlandia',
  'Francia','Grecia','Hungría','Irlanda','Italia','Noruega','Países Bajos',
  'Polonia','Portugal','Reino Unido','República Checa','Rumania','Rusia',
  'Suecia','Suiza','Turquía','Ucrania',
  'Australia','China','Corea del Sur','Filipinas','India','Indonesia',
  'Israel','Japón','Nueva Zelanda','Singapur','Tailandia','Taiwán',
  'Arabia Saudita','Egipto','Emiratos Árabes Unidos','Nigeria','Sudáfrica',
  'Otro',
];
const REG_CODIGOS = [
  '🇦🇷 +54','🇧🇴 +591','🇧🇷 +55','🇨🇱 +56','🇨🇴 +57','🇨🇷 +506','🇨🇺 +53',
  '🇪🇨 +593','🇸🇻 +503','🇬🇹 +502','🇭🇳 +504','🇲🇽 +52','🇳🇮 +505',
  '🇵🇦 +507','🇵🇾 +595','🇵🇪 +51','🇵🇷 +1','🇩🇴 +1','🇺🇾 +598','🇻🇪 +58',
  '🇨🇦 +1','🇺🇸 +1',
  '🇩🇪 +49','🇦🇹 +43','🇧🇪 +32','🇭🇷 +385','🇩🇰 +45','🇪🇸 +34','🇫🇮 +358',
  '🇫🇷 +33','🇬🇷 +30','🇭🇺 +36','🇮🇪 +353','🇮🇹 +39','🇳🇴 +47','🇳🇱 +31',
  '🇵🇱 +48','🇵🇹 +351','🇬🇧 +44','🇨🇿 +420','🇷🇴 +40','🇷🇺 +7',
  '🇸🇪 +46','🇨🇭 +41','🇹🇷 +90','🇺🇦 +380',
  '🇦🇺 +61','🇨🇳 +86','🇰🇷 +82','🇵🇭 +63','🇮🇳 +91','🇮🇩 +62',
  '🇮🇱 +972','🇯🇵 +81','🇳🇿 +64','🇸🇬 +65','🇹🇭 +66','🇹🇼 +886',
  '🇸🇦 +966','🇪🇬 +20','🇦🇪 +971','🇳🇬 +234','🇿🇦 +27',
  '🌐 +0',
];
const REG_PRONOMBRES = ['Él', 'Ella', 'Elle', 'No definido'];
const REG_ROLES      = ['Jammer', 'Bloquer', 'Blammer', 'Ref', 'Coach', 'Bench', 'No definido'];
const REG_ROLES_JUG  = ['Jammer', 'Bloquer', 'Blammer', 'No definido'];
const REG_ASISTENCIA = ['1 vez', '2 veces', '3 o más veces'];

// ── ESTADO ────────────────────────────────────────────────────
const WIZ_STEPS_BASE = ['inv','1','2','3','4','5','6','7','8','9','10','11'];
let wizStepSequence = [...WIZ_STEPS_BASE];
let wizStep = '1';
let cropTarget = 'app';

const regData = {
  nombre:'', pronombres:[], pais:'', codigoPais:'',
  telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
  nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
  alergias:'', dieta:'',
  contactoEmergenciaNombre:'', contactoEmergenciaCodigo:'', contactoEmergenciaTel:'',
  contactoEmergencia:'', fotoBase64:null, codigoInvitacion:'',
};

function esJugadorx(rol) { return REG_ROLES_JUG.includes(rol); }

function wizRecalcSequence() {
  wizStepSequence = esJugadorx(regData.rolJugadorx)
    ? ['inv','1','2','3','4','5','6','7','8','9','10','11']
    : ['inv','1','2','3','4','5','6','7','8','10','11'];
}

// ── CONFIGURACIÓN DE PASOS ────────────────────────────────────
const WIZ_STEPS_CONFIG = {
  'inv': { label: 'Código' },
  1:     { label: 'Intro' },
  2:     { label: 'Nombre' },
  3:     { label: 'Pronombres' },
  4:     { label: 'País' },
  5:     { label: 'Teléfono' },
  6:     { label: 'Nacimiento' },
  7:     { label: 'Derby' },
  8:     { label: 'Rol' },
  9:     { label: 'Asistencia' },
  10:    { label: 'Salud' },
  11:    { label: 'Emergencia' },
};

const WIZ_STEPS = {
  'inv': {
    label: 'Código',
    validate: function() {
      const val = document.getElementById('reg-codigo-inv') && document.getElementById('reg-codigo-inv').value.trim();
      if (!val) return 'Ingresá tu código de invitación 🔑';
      return null;
    },
    action: async function() {
      const val = document.getElementById('reg-codigo-inv') && document.getElementById('reg-codigo-inv').value.trim();
      wizMostrarCargando();
      try {
        const check = await apiCall('/validar-codigo', 'POST', { codigo: val });
        if (!check.valido) { wizOcultarCargando(); return check.error || 'Código inválido 🔑'; }
        regData.codigoInvitacion = val;
        inviteCode = val;
        wizOcultarCargando();
        return null;
      } catch (e) {
        wizOcultarCargando();
        return 'Error al verificar el código. Intenta de nuevo.';
      }
    }
  },

  '2': {
    label: 'Nombre',
    validate: function() {
      const el  = document.getElementById('reg-nombre');
      const val = el ? el.value.trim() : '';
      if (!val) return 'Escribe cómo quieres que te llamemos ✍️';
      regData.nombre = val;
      return null;
    }
  },

  '4': {
    label: 'País',
    validate: function() { return !regData.pais ? 'Selecciona tu país de origen 🌎' : null; }
  },

  '5': {
    label: 'Teléfono',
    validate: function() {
      if (!regData.codigoPais) return 'Selecciona el código de tu país 📱';
      const el    = document.getElementById('reg-telefono');
      const tel   = el ? el.value.trim() : '';
      const error = WIZ_VALIDATORS.telefono(tel);
      if (error) return error;
      if (!tel) return 'Ingresa tu número de teléfono 📱';
      regData.telefono = tel.replace(/\D/g, '');
      return null;
    }
  },

  '6': {
    label: 'Nacimiento',
    validate: function() {
      if (!regData.fechaNacimiento) return 'Ingresa tu fecha de nacimiento 🎂';
      if (!regData.mostrarCumple)   return 'Indica si quieres compartir tu cumpleaños 🎉';
      if (!regData.mostrarEdad)     return 'Indica si quieres compartir tu edad 🔢';
      return null;
    }
  },

  '7': {
    label: 'Derby',
    validate: function() {
      const elDerby  = document.getElementById('reg-nombreDerby');
      const elNumero = document.getElementById('reg-numero');
      regData.nombreDerby = elDerby  ? elDerby.value.trim()  : '';
      regData.numero      = elNumero ? elNumero.value.trim()  : '';
      return null;
    }
  },

  '8': {
    label: 'Rol',
    validate: function() { return !regData.rolJugadorx ? 'Selecciona tu rol en el equipo 🏅' : null; }
  },

  '9': {
    label: 'Asistencia',
    validate: function() { return !regData.asisteSemana ? 'Indica cuántas veces entrenas por semana 🏋️' : null; }
  },

  '10': {
    label: 'Salud',
    validate: function() {
      const elA = document.getElementById('reg-alergias');
      const elD = document.getElementById('reg-dieta');
      regData.alergias = elA ? elA.value.trim() : '';
      regData.dieta    = elD ? elD.value.trim() : '';
      return null;
    }
  },

  '11': {
    label: 'Final'
    // sin validate → permite terminar directo
  }
};

let registroWizard;

// ── ARRANQUE ──────────────────────────────────────────────────
function mostrarRegistroWizard() {
  wizStep = 'inv';
  if (!wizOrigen) wizOrigen = 'login';
  wizRecalcSequence();

  registroWizard = createWizard({
    initialStep:   'inv',
    sequence:      wizStepSequence,
    steps:         WIZ_STEPS,
    onError:       function(msg)           { wizShowError(msg); },
    transition:    function(from, to, fwd) { wizGoTo(to, fwd); },
    onAfterChange: function(step) {
      wizStep = step;
      wizUpdateHeader();
      wizSaveDraft();
    }
  });

  // Recuperar progreso guardado
  const saved = localStorage.getItem('regDraft');

  // Detectar país del usuario
  fetch('https://ipapi.co/json/')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!regData.codigoPais) {
        const match = REG_CODIGOS.find(function(c) { return c.includes(data.country_calling_code); });
        if (match) {
          regData.codigoPais = match;
          wizSetVal('reg-codigo-display', match);
          const btn = document.getElementById('reg-codigo-btn');
          if (btn) btn.classList.add('has-value');
        }
      }
    })
    .catch(function() {});

  if (saved) {
    try { Object.assign(regData, JSON.parse(saved)); }
    catch(e) { console.warn('Error cargando draft'); }
  } else {
    Object.assign(regData, {
      nombre:'', pronombres:[], pais:'', codigoPais:'',
      telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
      nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
      alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null
    });
  }

  ['reg-nombre','reg-telefono','reg-nombreDerby','reg-numero',
   'reg-alergias','reg-dieta','reg-emg-nombre','reg-emg-tel'].forEach(function(id) {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  regResetAvatar();
  regRenderChipsMulti('reg-pronombres-chips', REG_PRONOMBRES, [], function(v) { regData.pronombres = v; });
  regRenderChips('reg-cumple-chips', ['Sí','No'], '', function(v) { regData.mostrarCumple = v; });
  regRenderChips('reg-edad-chips',   ['Sí','No'], '', function(v) { regData.mostrarEdad   = v; });
  regRenderChips('reg-rol-chips',    REG_ROLES,   '', wizOnRolSelected);
  regRenderChips('reg-asiste-chips', REG_ASISTENCIA, '', function(v) { regData.asisteSemana = v; });

  wizSetVal('reg-pais-display',       'Seleccionar país…');
  wizSetVal('reg-codigo-display',     '+?');
  wizSetVal('reg-fecha-display',      'Seleccionar fecha…');
  wizSetVal('reg-emg-codigo-display', '+?');
  ['reg-pais-btn','reg-codigo-btn','reg-fecha-btn','reg-emg-codigo-btn'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('has-value');
  });

  const fotoBtn = document.getElementById('wiz-btn-foto');
  if (fotoBtn) fotoBtn.style.display = 'none';

  wizHideError();

  document.querySelectorAll('#wiz-viewport .wiz-step').forEach(function(s) {
    s.classList.remove('wiz-active','wiz-animate');
    s.style.transition = s.style.transform = s.style.visibility = '';
  });

  document.getElementById('registroScreen').style.display = 'flex';
  document.getElementById('wiz-google-login-screen').style.display = 'none';

  const introEl    = document.getElementById('wiz-intro');
  const headerEl   = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');

  if (introEl)    introEl.style.display    = 'flex';
  if (headerEl)   headerEl.style.display   = 'none';
  if (viewportEl) viewportEl.style.display = 'none';

  wizGoTo('inv', true);

  history.pushState({ wizSentinel: true }, '', location.pathname + '#_wiz');
}

function wizSaveDraft() {
  try { localStorage.setItem('regDraft', JSON.stringify(regData)); }
  catch (e) { console.warn('No se pudo guardar draft'); }
}

// ── NAVEGACIÓN INTRO ──────────────────────────────────────────
function wizStep0Volver() {
  const step0 = document.getElementById('wiz-google-login-screen');
  if (step0) step0.style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const el = document.getElementById('noEncontradoScreen');
    if (el) el.style.setProperty('display', 'flex');
  } else {
    const el = document.getElementById('loginScreen');
    if (el) el.style.setProperty('display', 'flex');
  }
  document.getElementById('registroScreen').style.display = 'none';
}

function wizIntroVolver() {
  const introEl = document.getElementById('wiz-intro');
  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(24px)';
    setTimeout(function() {
      introEl.style.display    = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }
  document.getElementById('registroScreen').style.display = 'none';
  if (wizOrigen === 'noEncontrado') {
    const el = document.getElementById('noEncontradoScreen');
    if (el) el.style.setProperty('display', 'flex');
  } else {
    const el = document.getElementById('loginScreen');
    if (el) el.style.setProperty('display', 'flex');
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
    setTimeout(function() {
      introEl.style.display    = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }

  setTimeout(function() {
    if (headerEl)   headerEl.style.display   = 'flex';
    if (viewportEl) viewportEl.style.display = 'block';
    wizUpdateHeader();
    const s1 = document.getElementById('wiz-step-inv');
    if (s1) {
      s1.classList.remove('wiz-animate');
      s1.classList.add('wiz-active');
      requestAnimationFrame(function() {
        requestAnimationFrame(function() { s1.classList.add('wiz-animate'); });
      });
    }
  }, 200);
}

// ── TRANSICIÓN DE PASOS ───────────────────────────────────────
function wizGoTo(next, forward) {
  if (forward === undefined) forward = true;
  const DURATION = 280;
  const getStepId = function(s) { return s === 'inv' ? 'wiz-step-inv' : 'wiz-step-' + s; };
  const prevEl = document.getElementById(getStepId(wizStep));
  const nextEl = document.getElementById(getStepId(next));
  if (!nextEl) return;

  if (prevEl && prevEl._wizCleanup) {
    clearTimeout(prevEl._wizCleanup);
    prevEl._wizCleanup = null;
    prevEl.classList.remove('wiz-active');
    prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
  }

  nextEl.style.transition = 'none';
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-105%)';
  nextEl.style.visibility = 'visible';
  nextEl.classList.add('wiz-active');

  requestAnimationFrame(function() {
    const ease = 'transform ' + DURATION + 'ms cubic-bezier(0.4,0,0.2,1)';
    if (prevEl) {
      prevEl.style.transition = ease;
      prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';
      prevEl._wizCleanup = setTimeout(function() {
        prevEl._wizCleanup = null;
        prevEl.classList.remove('wiz-active');
        prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
      }, DURATION + 20);
    }
    nextEl.style.transition = ease;
    nextEl.style.transform  = 'translateX(0)';
    setTimeout(function() { nextEl.classList.add('wiz-animate'); }, DURATION + 10);

    // Autofocus
    setTimeout(function() {
      const focusMap = { '2':'reg-nombre','5':'reg-telefono','7':'reg-nombreDerby','10':'reg-alergias','11':'reg-emg-nombre' };
      const id = focusMap[next];
      if (id) {
        const el = document.getElementById(id);
        if (el) el.focus();
      }
    }, DURATION + 60);
  });

  wizStep = next;
  wizUpdateHeader();
  wizToggleNext(false);
}

// ── HEADER Y PROGRESO ─────────────────────────────────────────
function wizUpdateHeader() {
  const idx = wizStepSequence.indexOf(wizStep);
  if (idx === -1) return;
  const pos   = idx + 1;
  const total = wizStepSequence.length;
  const fill  = document.getElementById('wiz-progress-fill');
  const label = document.getElementById('wiz-step-label');
  if (fill)  fill.style.width = ((pos / total) * 100) + '%';
  const stepName = WIZ_STEPS_CONFIG && WIZ_STEPS_CONFIG[wizStep] ? WIZ_STEPS_CONFIG[wizStep].label : '';
  if (label) label.textContent = 'Paso ' + pos + ' de ' + total + (stepName ? ' • ' + stepName : '');
}

// ── NAVEGACIÓN ────────────────────────────────────────────────
async function wizNext() {
  wizHideError();
  await registroWizard.next();
}

function wizBack() {
  wizHideError();
  const idx = wizStepSequence.indexOf(registroWizard.getStep());
  if (idx <= 0) {
    const introEl    = document.getElementById('wiz-intro');
    const headerEl   = document.getElementById('wiz-header');
    const viewportEl = document.getElementById('wiz-viewport');
    if (headerEl)   headerEl.style.display   = 'none';
    if (viewportEl) viewportEl.style.display = 'none';
    if (introEl) {
      introEl.style.display   = 'flex';
      introEl.style.opacity   = '0';
      introEl.style.transform = 'translateY(24px)';
      requestAnimationFrame(function() {
        introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        introEl.style.opacity    = '1';
        introEl.style.transform  = 'translateY(0)';
        setTimeout(function() { introEl.style.transition = ''; }, 310);
      });
    }
    return;
  }
  registroWizard.back();
}

// ── FEEDBACK ──────────────────────────────────────────────────
function wizShowError(msg) {
  const el = document.getElementById('reg-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.classList.remove('wiz-shake');
  void el.offsetWidth;
  el.classList.add('wiz-shake');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.style.display = 'none'; }, 3500);
}

function wizHideError() {
  const el = document.getElementById('reg-error');
  if (el) el.style.display = 'none';
}

function wizToggleNext(enabled) {
  const id     = wizStep === 'inv' ? 'wiz-step-inv' : 'wiz-step-' + wizStep;
  const stepEl = document.getElementById(id);
  if (!stepEl) return;
  const btn = stepEl.querySelector('.wiz-btn-primary');
  if (!btn) return;
  btn.disabled = !enabled;
  btn.classList.toggle('wiz-btn-disabled', !enabled);
}

function wizLiveValidate(opts) {
  const error = opts.validator(opts.value);
  if (error) {
    wizShowError(error);
    wizToggleNext(false);
    if (opts.onInvalid) opts.onInvalid(error);
  } else {
    wizHideError();
    wizToggleNext(true);
    if (opts.onValid) opts.onValid(opts.value);
    if (wizSaveDraft) wizSaveDraft();
  }
}

function mostrarRegError(msg) { wizShowError(msg); }

// ── HELPERS DE UI ─────────────────────────────────────────────
function wizSetVal(id, txt) {
  const el = document.getElementById(id); if (el) el.textContent = txt;
}

function wizOnRolSelected(val) {
  regData.rolJugadorx = val;
  regRenderChips('reg-rol-chips', REG_ROLES, val, wizOnRolSelected);
  wizRecalcSequence();
  wizUpdateHeader();
}

function wizOnCodigoSelected(val) {
  regData.codigoPais = val;
  wizSetVal('reg-codigo-display', val);
  const btn = document.getElementById('reg-codigo-btn');
  if (btn) btn.classList.add('has-value');
  if (val.includes('+593')) {
    const input = document.getElementById('reg-telefono');
    if (input && !input.value) input.value = '09';
  }
}

// ── FOTO PERFIL ───────────────────────────────────────────────
function regAbrirFoto() {
  const input = document.getElementById('reg-foto-input');
  if (input) input.click();
}

function regResetAvatar() {
  const img = document.getElementById('reg-avatar-img');
  const ph  = document.getElementById('reg-avatar-placeholder');
  const ov  = document.getElementById('reg-avatar-overlay');
  const ht  = document.getElementById('reg-foto-hint');
  const btn = document.getElementById('wiz-btn-foto');
  if (img) { img.src = ''; img.style.display = 'none'; }
  if (ph)  ph.style.display = 'block';
  if (ov)  ov.style.display = 'none';
  if (ht)  { ht.innerHTML = 'Toca para agregar'; ht.classList.remove('reg-foto-hint-compliment'); }
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
  if (ht)  { ht.innerHTML = '✨ <strong>¡Foto cargada con éxito!</strong> ✨'; ht.classList.add('reg-foto-hint-compliment'); }
  if (btn) btn.style.display = 'flex';
}

// ── LISTENERS ─────────────────────────────────────────────────
function initRegistroListeners() {
  const backBtn = document.getElementById('wiz-back-btn');
  if (backBtn) backBtn.addEventListener('click', wizBack);

  const fi = document.getElementById('reg-foto-input');
  if (fi) {
    fi.addEventListener('click', function() { fi.value = ''; });
    fi.addEventListener('change', function(e) {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = function(ev) { cropTarget = 'registro'; abrirCropper(ev.target.result); };
      r.readAsDataURL(file);
    });
  }

  const nombreInput = document.getElementById('reg-nombre');
  if (nombreInput) {
    nombreInput.addEventListener('input', function(e) {
      wizLiveValidate({
        value:     e.target.value.trim(),
        validator: WIZ_VALIDATORS.nombre,
        onValid:   function(v) { regData.nombre = v; }
      });
    });
  }

  const telInput = document.getElementById('reg-telefono');
  if (telInput) {
    telInput.addEventListener('input', function(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 3 && val.length <= 6)  val = val.replace(/(\d{3})(\d+)/, '$1 $2');
      else if (val.length > 6)                val = val.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
      e.target.value = val;
      wizLiveValidate({
        value:     val.replace(/\s/g, ''),
        validator: WIZ_VALIDATORS.telefono,
        onValid:   function(v) { regData.telefono = v; }
      });
    });
  }

  document.addEventListener('click', function(e) {
    if (e.target.id === 'reg-codigo-btn' || e.target.closest('#reg-codigo-btn')) {
      abrirBottomSheet('Código', REG_CODIGOS, regData.codigoPais || '', wizOnCodigoSelected, CODIGOS_PAISES_ALIASES);
    }
    if (e.target.id === 'reg-pais-btn' || e.target.closest('#reg-pais-btn')) {
      abrirBottomSheet('País', REG_PAISES, regData.pais || '', function(val) {
        regData.pais = val;
        wizSetVal('reg-pais-display', val);
        const btn = document.getElementById('reg-pais-btn');
        if (btn) btn.classList.add('has-value');
      });
    }
    if (e.target.id === 'reg-emg-codigo-btn' || e.target.closest('#reg-emg-codigo-btn')) {
      abrirBottomSheet('Código', REG_CODIGOS, regData.contactoEmergenciaCodigo || '', function(val) {
        regData.contactoEmergenciaCodigo = val;
        wizSetVal('reg-emg-codigo-display', val);
        const btn = document.getElementById('reg-emg-codigo-btn');
        if (btn) btn.classList.add('has-value');
      }, CODIGOS_PAISES_ALIASES);
    }
    if (e.target.id === 'reg-fecha-btn' || e.target.closest('#reg-fecha-btn')) {
      abrirDatePicker(regData.fechaNacimiento || '', function(val) {
        regData.fechaNacimiento = val;
        wizSetVal('reg-fecha-display', val);
        const btn = document.getElementById('reg-fecha-btn');
        if (btn) btn.classList.add('has-value');
      });
    }
  });
}

// ── LOADING OVERLAY (compartido con wizard-liga.js) ───────────
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
  overlay._interval = setInterval(function() {
    idx = (idx + 1) % WIZ_LOADING_MSGS.length;
    if (sub) {
      sub.style.opacity = '0';
      setTimeout(function() {
        if (sub) { sub.textContent = WIZ_LOADING_MSGS[idx]; sub.style.opacity = '1'; }
      }, 400);
    }
  }, 2200);
}

function wizOcultarCargando() {
  const overlay = document.getElementById('wiz-loading-overlay');
  if (!overlay) return;
  clearInterval(overlay._interval);
  overlay.style.display = 'none';
}

// ── CONFETTI (compartido con wizard-liga.js) ──────────────────
function lanzarConfetti() {
  const COLORS = ['#ff3b3b','#ff9500','#ffcc00','#34c759','#30b0c7','#af52de','#ff2d55'];
  const N = 90;
  const container = document.createElement('div');
  // Excepción permitida: valores calculados en runtime para la animación
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  for (let i = 0; i < N; i++) {
    const el    = document.createElement('div');
    const size  = 7 + Math.random() * 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x     = Math.random() * 100;
    const rot   = Math.random() * 360;
    const delay = Math.random() * 0.6;
    const dur   = 1.8 + Math.random() * 1.2;
    const isCir = Math.random() > 0.5;
    el.style.cssText = 'position:absolute;left:' + x + 'vw;top:-' + size + 'px;width:' + size + 'px;height:' + (isCir ? size : size * 0.5) + 'px;background:' + color + ';border-radius:' + (isCir ? '50%' : '2px') + ';opacity:1;animation:confetti-fall ' + dur + 's ' + delay + 's cubic-bezier(0.25,0,0.5,1) forwards;transform:rotate(' + rot + 'deg);';
    container.appendChild(el);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }';
  document.head.appendChild(style);
  setTimeout(function() { container.remove(); style.remove(); }, 4000);
}

// ── BIENVENIDA (compartido con wizard-liga.js) ────────────────
function mostrarBienvenida() {
  const overlay = document.createElement('div');
  overlay.className = 'wiz-bienvenida-overlay';
  const sheet = document.createElement('div');
  sheet.className = 'wiz-bienvenida-sheet';

  const emoji = document.createElement('div');
  emoji.className = 'wiz-bienvenida-emoji';
  emoji.textContent = '🛼';

  const title = document.createElement('h2');
  title.className = 'wiz-bienvenida-title';
  title.textContent = '¡Ya eres parte del equipo!';

  const desc = document.createElement('p');
  desc.className = 'wiz-bienvenida-desc';
  desc.innerHTML = 'Recuerda que puedes actualizar o añadir información adicional en las secciones de tu perfil.<br><br>También podrás consultar próximos entrenamientos, marcar asistencias, revisar tareas disponibles, la tabla de puntajes, información del equipo y mucho más.';

  const btn = document.createElement('button');
  btn.className = 'wiz-bienvenida-btn';
  btn.textContent = '¡Vamos! 🛼';
  btn.addEventListener('click', function() { overlay.remove(); });

  sheet.appendChild(emoji);
  sheet.appendChild(title);
  sheet.appendChild(desc);
  sheet.appendChild(btn);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ── SUBMIT REGISTRO ───────────────────────────────────────────
async function submitRegistro() {
  const emgNombre = (document.getElementById('reg-emg-nombre') || {}).value || '';
  const emgTel    = (document.getElementById('reg-emg-tel')    || {}).value || '';
  regData.contactoEmergenciaNombre  = emgNombre.trim();
  regData.contactoEmergenciaTel     = emgTel.trim();
  regData.contactoEmergencia = [
    regData.contactoEmergenciaNombre,
    regData.contactoEmergenciaCodigo,
    regData.contactoEmergenciaTel
  ].filter(Boolean).join(' ');
  wizHideError();
  const btnEl = document.getElementById('reg-submit');
  if (btnEl) btnEl.disabled = true;
  wizMostrarCargando();

  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email') || '';
    const json  = await apiCall('/registrar', 'POST', {
      email,
      nombre:             regData.nombre.trim(),
      pronombres:         Array.isArray(regData.pronombres) ? regData.pronombres.join(', ') : (regData.pronombres || ''),
      pais:               regData.pais,
      codigoPais:         regData.codigoPais,
      telefono:           regData.telefono.trim(),
      fechaNacimiento:    regData.fechaNacimiento,
      mostrarCumple:      regData.mostrarCumple,
      mostrarEdad:        regData.mostrarEdad,
      nombreDerby:        regData.nombreDerby,
      numero:             regData.numero,
      rolJugadorx:        regData.rolJugadorx,
      asisteSemana:       regData.asisteSemana,
      alergias:           regData.alergias,
      dieta:              regData.dieta,
      contactoEmergencia: regData.contactoEmergencia,
      fotoBase64:         regData.fotoBase64 || null,
      codigoInvitacion:   regData.codigoInvitacion || inviteCode || '',
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
    document.getElementById('appContent').style.display = 'block';
    sessionStorage.removeItem('quindes_invite');
    setTimeout(function() { lanzarConfetti(); mostrarBienvenida(); }, 400);

  } catch(err) {
    wizOcultarCargando();
    wizShowError(err.message || 'Algo salió mal. Intenta de nuevo 😅');
    if (btnEl) btnEl.disabled = false;
  }
  localStorage.removeItem('regDraft');
}
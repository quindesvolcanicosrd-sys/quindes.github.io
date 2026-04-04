
// ============================================================
//  QUINDES APP — wizard.js  (flujo de registro)
// ============================================================

/* ================================
   MOTOR BASE REUTILIZABLE
================================ */

// 🔹 UTILIDAD GLOBAL (poner arriba de todo el archivo)
function procesarImagen(file, { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        const isPng = file.type === 'image/png';

const base64 = canvas.toDataURL(
  isPng ? 'image/png' : 'image/jpeg',
  quality
);
        resolve(base64);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindImageInput({
  inputId,
  previewId,
  placeholderId,
  stateKey,
  config = {}
}) {
  const input = document.getElementById(inputId);
  const img = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);

  if (!input || !img || !placeholder) return;

  // 🧠 evitar múltiples bindings
  if (input.dataset.bound) return;
  input.dataset.bound = 'true';

  // ===== helper: mostrar preview =====
  const showPreview = (base64) => {
    img.src = base64;
    img.classList.remove('wiz-hidden');
    placeholder.classList.add('wiz-hidden');

    // ✨ animación fade-in
    img.style.opacity = '0';
    requestAnimationFrame(() => {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1';
      setTimeout(() => img.style.transition = '', 300);
    });
  };

  // ===== helper: reset =====
  const resetImage = () => {
    _wizLiga[stateKey] = null;
    img.src = '';
    img.classList.add('wiz-hidden');
    placeholder.classList.remove('wiz-hidden');

    if (removeBtn) removeBtn.style.display = 'none';
  };

  // ===== estado inicial =====
  if (_wizLiga[stateKey]) {
    showPreview(_wizLiga[stateKey]);
  } else {
    img.classList.add('wiz-hidden');
    placeholder.classList.remove('wiz-hidden');
  }

  // ===== botón eliminar (auto crear si no existe) =====
  let removeBtn = input.parentElement.querySelector('.wiz-remove-img');

  if (!removeBtn) {
    removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.className = 'wiz-remove-img';

    removeBtn.style.cssText = `
      position:absolute;
      top:8px;
      right:8px;
      width:28px;
      height:28px;
      border-radius:50%;
      border:none;
      background:rgba(0,0,0,0.6);
      color:#fff;
      cursor:pointer;
      display:none;
      z-index:5;
    `;

    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(removeBtn);
  }

  if (_wizLiga[stateKey]) {
    removeBtn.style.display = 'block';
  }

  removeBtn.addEventListener('click', resetImage);

  // ===== procesamiento =====
  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToastGuardado('⚠️ Solo imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mostrarToastGuardado('⚠️ Máximo 5MB');
      return;
    }

    try {
      const base64 = await procesarImagen(file, config);

      _wizLiga[stateKey] = base64;

      showPreview(base64);
      removeBtn.style.display = 'block';

    } catch (err) {
      console.error(err);
      mostrarToastGuardado('❌ Error procesando imagen');
    }
  };

  // ===== input normal =====
  input.addEventListener('change', e => {
    handleFile(e.target.files?.[0]);
  });

  // ===== drag & drop =====
  const dropZone = input.parentElement;

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('wiz-drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('wiz-drag-over');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('wiz-drag-over');

    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  });
}

function createWizard(config) {
  let currentStep = config.initialStep;
  const sequence = config.sequence;

  function next() {
    const idx = sequence.indexOf(currentStep);
    const stepConfig = config.steps[currentStep];

    // 🔹 Validación
    if (stepConfig?.validate) {
      const error = stepConfig.validate();
      if (error) return config.onError?.(error);
    }

    // 🔹 Acción (async o sync)
    if (stepConfig?.action) {
      return Promise.resolve(stepConfig.action()).then(err => {
        if (err) return config.onError?.(err);
        resolveNext(stepConfig, idx);
      });
    }

    resolveNext(stepConfig, idx);
  }

  function resolveNext(stepConfig, idx) {
    let nextStep;

    // 🧠 1. next dinámico
    if (typeof stepConfig?.next === 'function') {
      nextStep = stepConfig.next(regData);
    }

    // 🧠 2. next fijo
    else if (stepConfig?.next) {
      nextStep = stepConfig.next;
    }

    // 🧠 3. fallback (secuencia)
    else {
      nextStep = sequence[idx + 1];
    }

    go(nextStep, true);
  }

  function back() {
    const idx = sequence.indexOf(currentStep);
    const stepConfig = config.steps[currentStep];

    let prevStep;

    // 🧠 back dinámico
    if (typeof stepConfig?.back === 'function') {
      prevStep = stepConfig.back(regData);
    }

    // 🧠 back fijo
    else if (stepConfig?.back) {
      prevStep = stepConfig.back;
    }

    // 🧠 fallback
    else {
      prevStep = sequence[idx - 1];
    }

    go(prevStep, false);
  }

  function go(step, forward = true) {
    if (!step) return;

    config.onBeforeChange?.(currentStep, step);
    config.transition?.(currentStep, step, forward);

    currentStep = step;

    config.onAfterChange?.(step);
  }

  function getStep() {
    return currentStep;
  }

  return {
    next,
    back,
    go,
    getStep
  };
}

const WIZ_VALIDATORS = {
  nombre: v => !v ? 'Escribe cómo quieres que te llamemos ✍️' : null,

  telefono: (v) => {
  if (!v) return null;

  const clean = v.replace(/\D/g, '');

  // 🌎 Validación por país (si existe código)
  if (regData.codigoPais) {

    // 🇪🇨 Ecuador
    if (regData.codigoPais.includes('+593')) {
      if (clean.length !== 10) return 'El número debe tener 10 dígitos 🇪🇨';
      if (!clean.startsWith('0')) return 'Debe empezar con 0 🇪🇨';
    }

    // 🇺🇸 / 🇨🇦 (ejemplo)
    if (regData.codigoPais.includes('+1')) {
      if (clean.length !== 10) return 'Número inválido 🇺🇸';
    }

  }

  // 🌍 fallback global
  if (clean.length < 7) return 'Número demasiado corto 📱';

  return null;
},

  codigoPais: v => !v && 'Selecciona el código de tu país 📱',

  rol: v => !v && 'Selecciona tu rol en el equipo 🏅',

  asistencia: v => !v && 'Indica cuántas veces entrenas 🏋️',
};

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

const WIZ_STEPS_BASE = ['inv','1','2','3','4','5','6','7','8','9','10','11'];
let wizStepSequence = [...WIZ_STEPS_BASE];
let wizStep = '1';
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
  ? ['inv','1','2','3','4','5','6','7','8','9','10','11']
  : ['inv','1','2','3','4','5','6','7','8','10','11'];
}

function wizPositionInSequence() { return wizStepSequence.indexOf(wizStep) + 1; }

function mostrarRegistroWizard() {
  wizStep = 'inv';
  if (!wizOrigen) wizOrigen = 'login';
  wizRecalcSequence();

  registroWizard = createWizard({
  initialStep: 'inv',
  sequence: wizStepSequence,
  steps: WIZ_STEPS,

  onError: (msg) => wizShowError(msg),

  transition: (from, to, forward) => {
    wizGoTo(to, forward);
  },

  onAfterChange: (step) => {
    wizStep = step;
    wizUpdateHeader();
    wizSaveDraft();
  }
});

  // 🔥 Intentar recuperar progreso guardado
  const saved = localStorage.getItem('regDraft');

  // 🌍 detectar país del usuario
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      if (!regData.codigoPais) {
        const code = data.country_calling_code;

        const match = REG_CODIGOS.find(c => c.includes(code));
        if (match) {
          regData.codigoPais = match;
          wizSetVal('reg-codigo-display', match);
          document.getElementById('reg-codigo-btn')?.classList.add('has-value');
        }
      }
    })
    .catch(() => {});

  if (saved) {
    try {
      Object.assign(regData, JSON.parse(saved));
    } catch {
      console.warn('Error cargando draft');
    }
  } else {
    Object.assign(regData, {
      nombre:'', pronombres:[], pais:'', codigoPais:'',
      telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
      nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
      alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null
    });
  }

  ['reg-nombre','reg-telefono','reg-nombreDerby','reg-numero',
   'reg-alergias','reg-dieta','reg-emergencia'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  regResetAvatar();

  regRenderChipsMulti('reg-pronombres-chips', REG_PRONOMBRES, [], v => { regData.pronombres = v; });
  regRenderChips('reg-cumple-chips', ['Sí','No'], '', v => { regData.mostrarCumple = v; });
  regRenderChips('reg-edad-chips',   ['Sí','No'], '', v => { regData.mostrarEdad = v; });
  regRenderChips('reg-rol-chips',    REG_ROLES,   '', wizOnRolSelected);
  regRenderChips('reg-asiste-chips', REG_ASISTENCIA, '', v => { regData.asisteSemana = v; });

  wizSetVal('reg-pais-display',   'Seleccionar país…');
  wizSetVal('reg-codigo-display', '+?');
  wizSetVal('reg-fecha-display',  'Seleccionar fecha…');

  ['reg-pais-btn','reg-codigo-btn','reg-fecha-btn'].forEach(id =>
    document.getElementById(id)?.classList.remove('has-value')
  );

  const fotoBtn = document.getElementById('wiz-btn-foto');
  if (fotoBtn) fotoBtn.style.display = 'none';

  wizHideError();

  // 🔥 LIMPIAR TODOS LOS STEPS
  document.querySelectorAll('#wiz-viewport .wiz-step')
    .forEach(s => {
      s.classList.remove('wiz-active','wiz-animate');
      s.style.transition = '';
      s.style.transform = '';
      s.style.visibility = '';
    });

  document.getElementById('registroScreen').style.display = 'flex';

  const step0 = document.getElementById('wiz-google-login-screen');
  if (step0) step0.style.display = 'none';

  const introEl    = document.getElementById('wiz-intro');
  const headerEl   = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');

  if (introEl)    introEl.style.display    = 'flex';
  if (headerEl)   headerEl.style.display   = 'none';
  if (viewportEl) viewportEl.style.display = 'none';

  // 🔥 ARRANQUE FORZADO SIEMPRE EN INV
  wizGoTo('inv', true);

  history.pushState({ wizSentinel: true }, '', location.pathname + '#_wiz');
}

function wizSaveDraft() {
  try {
    localStorage.setItem('regDraft', JSON.stringify(regData));
  } catch (e) {
    console.warn('No se pudo guardar draft');
  }
}

function wizStep0Volver() {
  const step0 = document.getElementById('wiz-google-login-screen');
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

function wizOnCodigoSelected(val) {
  regData.codigoPais = val;

  wizSetVal('reg-codigo-display', val);
  document.getElementById('reg-codigo-btn')?.classList.add('has-value');

  // UX opcional Ecuador
  if (val.includes('+593')) {
    const input = document.getElementById('reg-telefono');
    if (input && !input.value) {
      input.value = '09';
    }
  }
}

function wizGoTo(next, forward = true) {
  const DURATION = 280;

  // 🔥 resolver IDs correctamente (inv vs numéricos)
  const getStepId = (s) => s === 'inv' ? 'wiz-step-inv' : 'wiz-step-' + s;

  const prevEl = document.getElementById(getStepId(wizStep));
  const nextEl = document.getElementById(getStepId(next));

  if (!nextEl) return;

  // 🧹 limpiar animación previa
  if (prevEl && prevEl._wizCleanup) {
    clearTimeout(prevEl._wizCleanup);
    prevEl._wizCleanup = null;
    prevEl.classList.remove('wiz-active');
    prevEl.style.visibility = '';
    prevEl.style.transition = '';
    prevEl.style.transform  = '';
  }

  // 🚀 preparar entrada
  nextEl.style.transition = 'none';
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-30%)';
  nextEl.style.visibility = 'visible';
  nextEl.classList.add('wiz-active');

  requestAnimationFrame(() => {
    const ease = `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1)`;

    // 🔙 salida del anterior
    if (prevEl) {
      prevEl.style.transition = ease;
      prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';

      prevEl._wizCleanup = setTimeout(() => {
        prevEl._wizCleanup = null;
        prevEl.classList.remove('wiz-active');
        prevEl.style.visibility = '';
        prevEl.style.transition = '';
        prevEl.style.transform  = '';
      }, DURATION + 20);
    }

    // ➡️ entrada del nuevo
    nextEl.style.transition = ease;
    nextEl.style.transform  = 'translateX(0)';

    setTimeout(() => {
      nextEl.classList.add('wiz-animate');
    }, DURATION + 10);

    // 🎯 autofocus (ahora con strings)
    setTimeout(() => {
      const focusMap = {
        '2': 'reg-nombre',
        '5': 'reg-telefono',
        '7': 'reg-nombreDerby',
        '10': 'reg-alergias',
        '11': 'reg-emergencia'
      };

      const id = focusMap[next];
      if (id) {
        document.getElementById(id)?.focus();
      }
    }, DURATION + 60);
  });

  // 🧠 actualizar estado
  wizStep = next;

  wizUpdateHeader();
  wizToggleNext(false);
}

function wizUpdateHeader() {
  const idx = wizStepSequence.indexOf(wizStep);
  if (idx === -1) return;

  const pos   = idx + 1;
  const total = wizStepSequence.length;

  const fill  = document.getElementById('wiz-progress-fill');
  const label = document.getElementById('wiz-step-label');

  // 📊 barra de progreso
  if (fill) {
    fill.style.width = ((pos / total) * 100) + '%';
  }

  // 🏷️ nombre del paso
  const stepConfig = WIZ_STEPS_CONFIG?.[wizStep];
  const stepName = stepConfig?.label || '';

  if (label) {
    label.textContent = `Paso ${pos} de ${total}` + (stepName ? ` • ${stepName}` : '');
  }
}

const WIZ_STEPS_CONFIG = {
  'inv': {
    label: 'Código',
  },
  1: { label: 'Intro' },
  2: { label: 'Nombre' },
  3: { label: 'Pronombres' },
  4: { label: 'País' },
  5: { label: 'Teléfono' },
  6: { label: 'Nacimiento' },
  7: { label: 'Derby' },
  8: { label: 'Rol' },
  9: { label: 'Asistencia' },
  10: { label: 'Salud' },
  11: { label: 'Emergencia' }
};

const WIZ_STEPS = {
  'inv': {
    label: 'Código',
    validate: () => {
      const val = document.getElementById('reg-codigo-inv')?.value.trim();
      if (!val) return 'Ingresá tu código de invitación 🔑';
      return null;
    },
    action: async () => {
      const val = document.getElementById('reg-codigo-inv')?.value.trim();

      wizMostrarCargando();
      try {
        const check = await apiCall('/validar-codigo', 'POST', { codigo: val });

        if (!check.valido) {
          wizOcultarCargando();
          return check.error || 'Código inválido 🔑';
        }

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
    validate: () => {
      const val = document.getElementById('reg-nombre')?.value.trim();
      if (!val) return 'Escribe cómo quieres que te llamemos ✍️';

      regData.nombre = val;
      return null;
    }
  },

  '4': {
    label: 'País',
    validate: () => {
      if (!regData.pais) return 'Selecciona tu país de origen 🌎';
      return null;
    }
  },

  '5': {
    label: 'Teléfono',
    validate: () => {
      if (!regData.codigoPais) {
        return 'Selecciona el código de tu país 📱';
      }

      const tel = document.getElementById('reg-telefono')?.value.trim();

      const error = WIZ_VALIDATORS.telefono(tel);
      if (error) return error;

      if (!tel) return 'Ingresa tu número de teléfono 📱';

      regData.telefono = tel.replace(/\D/g, '');
      return null;
    }
  },

  '6': {
    label: 'Nacimiento',
    validate: () => {
      if (!regData.fechaNacimiento) return 'Ingresa tu fecha de nacimiento 🎂';
      if (!regData.mostrarCumple) return 'Indica si quieres compartir tu cumpleaños 🎉';
      if (!regData.mostrarEdad) return 'Indica si quieres compartir tu edad 🔢';
      return null;
    }
  },

  '7': {
    label: 'Derby',
    validate: () => {
      regData.nombreDerby = document.getElementById('reg-nombreDerby')?.value.trim() || '';
      regData.numero = document.getElementById('reg-numero')?.value.trim() || '';
      return null;
    }
  },

  '8': {
    label: 'Rol',
    validate: () => {
      if (!regData.rolJugadorx) return 'Selecciona tu rol en el equipo 🏅';
      return null;
    }
  },

  '9': {
    label: 'Asistencia',
    validate: () => {
      if (!regData.asisteSemana) return 'Indica cuántas veces entrenas por semana 🏋️';
      return null;
    }
  },

  '10': {
    label: 'Salud',
    validate: () => {
      regData.alergias = document.getElementById('reg-alergias')?.value.trim() || '';
      regData.dieta = document.getElementById('reg-dieta')?.value.trim() || '';
      return null;
    }
  },

  '11': {
    label: 'Final'
    // sin validate → permite terminar directo
  }
};

let registroWizard;

async function wizNext() {
  wizHideError();
  await registroWizard.next();
}

function wizBack() {
  wizHideError();

  

  // 🔙 Si estamos en el primer paso → volver al intro
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

      requestAnimationFrame(() => {
        introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        introEl.style.opacity    = '1';
        introEl.style.transform  = 'translateY(0)';
        setTimeout(() => { introEl.style.transition = ''; }, 310);
      });
    }

    return;
  }

  // 🔙 navegación normal (usa el motor)
  registroWizard.back();
}

function wizShowError(msg) {
  const el = document.getElementById('reg-error');
  if (!el) return;

  el.textContent = msg;
  el.style.display = 'block';

  // 🔥 animación
  el.classList.remove('wiz-shake');
  void el.offsetWidth;
  el.classList.add('wiz-shake');

  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.display = 'none';
  }, 3500);
}

function wizHideError() { const el = document.getElementById('reg-error'); if (el) el.style.display = 'none'; }

function wizToggleNext(enabled) {
  const currentStepId = wizStep === 'inv' ? 'wiz-step-inv' : 'wiz-step-' + wizStep;
  const stepEl = document.getElementById(currentStepId);
  if (!stepEl) return;

  const btn = stepEl.querySelector('.wiz-btn-primary');
  if (!btn) return;

  btn.disabled = !enabled;
  btn.classList.toggle('wiz-btn-disabled', !enabled);
}

function wizLiveValidate({ 
  value, 
  validator, 
  onValid, 
  onInvalid 
}) {
  const error = validator(value);

  if (error) {
    wizShowError(error);
    wizToggleNext(false); // 👈 bloquea botón
    onInvalid?.(error);
  } else {
    wizHideError();
    wizToggleNext(true); // 👈 habilita botón
    onValid?.(value);
    wizSaveDraft?.();
  }
}

function mostrarRegError(msg) { wizShowError(msg); }

function regRenderChips(containerId, opciones, valorActual, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // 🚀 Solo render inicial
  if (!el.dataset.initialized) {
    el.innerHTML = '';

    opciones.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.className = 'chip chip-inactive';

      btn.addEventListener('click', () => {
        // quitar activos
        el.querySelectorAll('.chip').forEach(b => {
          b.classList.remove('chip-active');
          b.classList.add('chip-inactive');
        });

        // activar actual
        btn.classList.add('chip-active');
        btn.classList.remove('chip-inactive');

        onSelect(opt);
      });

      el.appendChild(btn);
    });

    el.dataset.initialized = 'true';
  }

  // 🔥 Solo actualizar estado visual
  el.querySelectorAll('.chip').forEach(btn => {
    if (btn.textContent === valorActual) {
      btn.classList.add('chip-active');
      btn.classList.remove('chip-inactive');
    } else {
      btn.classList.remove('chip-active');
      btn.classList.add('chip-inactive');
    }
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

  // 👇 AQUÍ VA TU UX PRO
  document.getElementById('reg-nombre')?.addEventListener('input', e => {
  wizLiveValidate({
    value: e.target.value.trim(),
    validator: WIZ_VALIDATORS.nombre,
    onValid: v => regData.nombre = v
  });
  });

  document.getElementById('reg-telefono')?.addEventListener('input', e => {
  let val = e.target.value.replace(/\D/g, '');

  // 👇 formato simple (Ecuador style)
  if (val.length > 3 && val.length <= 6) {
    val = val.replace(/(\d{3})(\d+)/, '$1 $2');
  } else if (val.length > 6) {
    val = val.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
  }

  e.target.value = val;

  wizLiveValidate({
    value: val.replace(/\s/g, ''), // validar sin espacios
    validator: WIZ_VALIDATORS.telefono,
    onValid: v => regData.telefono = v
  });
  });

document.addEventListener('click', e => {
  if (e.target.id === 'reg-codigo-btn') {
    abrirBottomSheet(
      'Código',
      REG_CODIGOS,
      regData.codigoPais || '',
      wizOnCodigoSelected
    );
  }
});

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
  overlay.className = 'wiz-bienvenida-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'wiz-bienvenida-sheet';

  const emoji = document.createElement('div');
  emoji.className = 'wiz-bienvenida-emoji';
  emoji.textContent = '🎉';

  const title = document.createElement('h2');
  title.className = 'wiz-bienvenida-title';
  title.textContent = '¡Bienvenidx al equipo!';

  const desc = document.createElement('p');
  desc.className = 'wiz-bienvenida-desc';
  desc.innerHTML = 'Recuerda que puedes actualizar o añadir información adicional en las secciones de tu perfil.<br><br>También podrás consultar próximos entrenamientos, marcar asistencias, revisar tareas disponibles, la tabla de puntajes, información del equipo y mucho más.';

  const btn = document.createElement('button');
  btn.className = 'wiz-bienvenida-btn';
  btn.textContent = '¡Vamos! 🛼';
  btn.addEventListener('click', () => overlay.remove());

  sheet.appendChild(emoji);
  sheet.appendChild(title);
  sheet.appendChild(desc);
  sheet.appendChild(btn);
  overlay.appendChild(sheet);
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
  localStorage.removeItem('regDraft');
}

function wizLigaIntroStart() {
  const introEl  = document.getElementById('wiz-liga-intro');
  const headerEl = document.getElementById('wiz-liga-header');
  const footerEl = document.getElementById('wiz-liga-footer');

  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(-24px)';
    setTimeout(() => {
      introEl.style.display    = 'none';
      introEl.style.transition = '';
      introEl.style.transform  = '';
      introEl.style.opacity    = '';
    }, 310);
  }

  setTimeout(() => {
    if (headerEl) {
      headerEl.style.opacity = '0';
      headerEl.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        headerEl.style.transition = 'opacity 0.35s ease';
        headerEl.style.opacity = '1';
        setTimeout(() => { headerEl.style.transition = ''; }, 370);
      }));
    }
    if (footerEl) {
      footerEl.style.opacity = '0';
      footerEl.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        footerEl.style.transition = 'opacity 0.35s ease';
        footerEl.style.opacity = '1';
        setTimeout(() => { footerEl.style.transition = ''; }, 370);
      }));
    }
    renderWizLigaPaso(1);
  }, 200);
}

function renderWizLigaPaso(paso) {
  const forward = paso >= _wizLigaPaso;
  _wizLigaPaso = paso;
  const btnBack   = document.getElementById('wiz-liga-btn-back');
  const pasoLabel = document.getElementById('wiz-liga-paso-label');
  const progress  = document.getElementById('wiz-liga-progress');
  const contenido = document.getElementById('wiz-liga-contenido');
  if (!contenido) return;

  if (btnBack)   btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = `Paso ${paso} de ${_WIZ_LIGA_TOTAL}`;
  if (progress)  progress.style.width  = (paso / _WIZ_LIGA_TOTAL * 100) + '%';

  if (paso === 1) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-1');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    if (btnBack) btnBack.classList.remove('wiz-hidden');

    requestAnimationFrame(() => {
      const wrap = document.getElementById('wiz-liga-google-btn');
      if (wrap) {
        google.accounts.id.renderButton(wrap, {
          theme: getGoogleBtnTheme(),
          size: 'large',
          width: 300,
          text: 'continue_with',
        });
        setTimeout(() => wrap.classList.add('visible'), 120);
      }
    });
  }, forward);
  return;
  }

  if (paso === 2) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-2');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const input = document.getElementById('wiz-liga-nombre');
    if (input) {
      input.value = _wizLiga.nombreLiga || '';

      input.addEventListener('input', e => {
        _wizLiga.nombreLiga = e.target.value;
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') wizLigaPasoSiguiente();
      });

      setTimeout(() => input.focus(), 350);
    }

  }, forward);
  return;
  }
  

  if (paso === 3) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-3');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    bindImageInput({
      inputId: 'wiz-liga-img-input',
      previewId: 'wiz-liga-img-preview',
      placeholderId: 'wiz-liga-img-placeholder',
      stateKey: 'ligaImagenBase64',
      config: {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.75
      }
    });

  }, forward);
  return;
  }

  if (paso === 4) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-4');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const selPais = document.getElementById('wiz-liga-pais-sel');
    const selCiudad = document.getElementById('wiz-liga-ciudad-sel');
    const wrapCiudad = document.getElementById('wiz-liga-ciudad-wrap');
    const wrapCustom = document.getElementById('wiz-liga-ciudad-custom-wrap');
    const inputCustom = document.getElementById('wiz-liga-ciudad-custom');

    // ===== PAÍSES =====
    REG_PAISES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (_wizLiga.pais === p) opt.selected = true;
      selPais.appendChild(opt);
    });

    // ===== FUNCIÓN PARA CARGAR CIUDADES =====
    function cargarCiudades(pais) {
      selCiudad.innerHTML = '<option value="">Seleccionar ciudad…</option>';

      const ciudades = CIUDADES_POR_PAIS[pais] || [];

      ciudades.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        if (_wizLiga.ciudad === c) opt.selected = true;
        selCiudad.appendChild(opt);
      });

      // opción "otro"
      const optOtro = document.createElement('option');
      optOtro.value = '__otro__';
      optOtro.textContent = 'Mi ciudad no está en la lista…';
      selCiudad.appendChild(optOtro);

      const esCustom = _wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad);

      if (esCustom) {
        selCiudad.value = '__otro__';
        wrapCustom.classList.remove('wiz-hidden');
        inputCustom.value = _wizLiga.ciudad;
      } else {
        wrapCustom.classList.add('wiz-hidden');
      }
    }

    // ===== ESTADO INICIAL =====
    if (_wizLiga.pais) {
      wrapCiudad.classList.remove('wiz-hidden');
      cargarCiudades(_wizLiga.pais);
    }

    // ===== EVENTOS =====

    selPais.addEventListener('change', e => {
      const val = e.target.value;
      _wizLiga.pais = val;
      _wizLiga.ciudad = '';

      if (val) {
        wrapCiudad.classList.remove('wiz-hidden');
        cargarCiudades(val);
      } else {
        wrapCiudad.classList.add('wiz-hidden');
      }
    });

    selCiudad.addEventListener('change', e => {
      const val = e.target.value;

      if (val === '__otro__') {
        wrapCustom.classList.remove('wiz-hidden');
        _wizLiga.ciudad = inputCustom.value || '';
      } else {
        wrapCustom.classList.add('wiz-hidden');
        _wizLiga.ciudad = val;
      }
    });

    inputCustom.addEventListener('input', e => {
      _wizLiga.ciudad = e.target.value;
    });

  }, forward);
  return;
  }

  if (paso === 5) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-5');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const inputAnio = document.getElementById('wiz-liga-anio');
    const inputDesc = document.getElementById('wiz-liga-descripcion');

    // valores iniciales
    if (inputAnio) {
      inputAnio.value = _wizLiga.anioFundacion || '';
      inputAnio.max = new Date().getFullYear();

      inputAnio.addEventListener('input', e => {
        _wizLiga.anioFundacion = e.target.value;
      });
    }

    if (inputDesc) {
      inputDesc.value = _wizLiga.descripcion || '';

      inputDesc.addEventListener('input', e => {
        _wizLiga.descripcion = e.target.value;
      });
    }

    setTimeout(() => inputAnio?.focus(), 350);

  }, forward);
  return;
  }

  if (paso === 6) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-6');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const input = document.getElementById('wiz-liga-ig');

    if (input) {
      input.value = _wizLiga.contactoSocial || '';

      input.addEventListener('input', e => {
        _wizLiga.contactoSocial = e.target.value;
      });

      setTimeout(() => input.focus(), 350);
    }

  }, forward);
  return;
  }

  if (paso === 7) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-7');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const input = document.getElementById('wiz-liga-equipo-nombre');

    if (input) {
      input.value = _wizLiga.nombreEquipo || '';

      input.addEventListener('input', e => {
        _wizLiga.nombreEquipo = e.target.value;
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') wizLigaPasoSiguiente();
      });

      setTimeout(() => input.focus(), 350);
    }

  }, forward);
  return;
  }

  if (paso === 8) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-8');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const wrap = document.getElementById('wiz-liga-cat-chips');

    ['A','B','C'].forEach(cat => {
      const btn = document.createElement('button');

      btn.textContent = cat;
      btn.className = 'chip ' + (_wizLiga.categoria === cat ? 'chip-active' : 'chip-inactive');

      btn.addEventListener('click', () => {
        _wizLiga.categoria = cat;

        // actualizar UI
        [...wrap.children].forEach(b => {
          b.classList.remove('chip-active');
          b.classList.add('chip-inactive');
        });

        btn.classList.add('chip-active');
        btn.classList.remove('chip-inactive');
      });

      wrap.appendChild(btn);
    });

  }, forward);
  return;
  }

if (paso === 9) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-9');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const wrapColors = document.getElementById('wiz-color-presets');

    const colorActual =
      _wizLiga.colorPrimario ||
      document.documentElement.dataset.colorPrimario ||
      '#ef4444';

    // ===== LOGO (helper) =====
    bindImageInput({
      inputId: 'wiz-liga-logo-input',
      previewId: 'wiz-liga-logo-preview',
      placeholderId: 'wiz-liga-logo-placeholder',
      stateKey: 'logoBase64',
      config: {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8
      }
    });

    // ===== COLORES =====
    COLOR_PICKER_PRESETS.forEach(color => {
      const btn = document.createElement('button');

      btn.className = 'color-swatch-btn';
      if (color === colorActual) btn.classList.add('selected');

      btn.style.background = color;

      btn.addEventListener('click', () => {
        _wizLiga.colorPrimario = color;

        aplicarColorPrimario(color);

        [...wrapColors.children].forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });

      wrapColors.appendChild(btn);
    });

  }, forward);
  return;
}

  if (paso === 10) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-10');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    // ===== FOTO (helper) =====
    bindImageInput({
      inputId: 'wiz-liga-foto-input',
      previewId: 'wiz-liga-foto-preview',
      placeholderId: 'wiz-liga-foto-placeholder',
      stateKey: 'fotoBase64',
      config: {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.7
      }
    });

    const skip = document.getElementById('wiz-liga-skip-10');
    skip?.addEventListener('click', wizLigaPasoSiguiente);

  }, forward);
  return;
}

  if (paso === 11) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-11');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const input = document.getElementById('wiz-liga-perfil-nombre');

    input.value = _wizLiga.nombre || '';

    input.addEventListener('input', e => {
      _wizLiga.nombre = e.target.value;
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') wizLigaPasoSiguiente();
    });

    setTimeout(() => input.focus(), 300);

  }, forward);
  return;
  }

  if (paso === 12) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-12');
    if (!tpl) return;

    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    regRenderChipsMulti(
      'wiz-liga-pronombres-chips',
      REG_PRONOMBRES,
      _wizLiga.pronombres || [],
      v => { _wizLiga.pronombres = v; }
    );

  }, forward);
  return;
  }

  if (paso === 13) {
    wizLigaGoTo(el => {
      const tpl = document.getElementById('tpl-wiz-liga-13');
      el.innerHTML = '';
      el.appendChild(tpl.content.cloneNode(true));

      const display = document.getElementById('wiz-liga-perfil-pais-display');

      display.textContent = _wizLiga.paisPerfil || 'Seleccionar país…';

      document.getElementById('wiz-liga-perfil-pais-btn').onclick = () => {
        abrirBottomSheet('Nacionalidad', REG_PAISES, _wizLiga.paisPerfil || '', val => {
          _wizLiga.paisPerfil = val;
          display.textContent = val;
        });
      };

    }, forward);
    return;
  }

if (paso === 14) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-14');
    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const tel = document.getElementById('wiz-liga-perfil-tel');
    const display = document.getElementById('wiz-liga-perfil-codigo-display');

    tel.value = _wizLiga.telefono || '';
    display.textContent = _wizLiga.codigoPais || '+?';

    tel.addEventListener('input', e => _wizLiga.telefono = e.target.value);

    document.getElementById('wiz-liga-perfil-codigo-btn').onclick = () => {
      abrirBottomSheet('Código', REG_CODIGOS, _wizLiga.codigoPais || '', val => {
        _wizLiga.codigoPais = val;
        display.textContent = val;
      });
    };

  }, forward);
  return;
}

if (paso === 15) {
  wizLigaGoTo(el => {
    const tpl = document.getElementById('tpl-wiz-liga-15');
    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));

    const display = document.getElementById('wiz-liga-perfil-fecha-display');

    display.textContent = _wizLiga.fechaNacimiento || 'Seleccionar fecha…';

    document.getElementById('wiz-liga-perfil-fecha-btn').onclick = () => {
      abrirDatePicker(_wizLiga.fechaNacimiento || '', val => {
        _wizLiga.fechaNacimiento = val;
        display.textContent = val;
      });
    };

    regRenderChips('wiz-liga-cumple-chips', ['Sí','No'], _wizLiga.mostrarCumple || '', v => _wizLiga.mostrarCumple = v);
    regRenderChips('wiz-liga-edad-chips', ['Sí','No'], _wizLiga.mostrarEdad || '', v => _wizLiga.mostrarEdad = v);

  }, forward);
  return;
}

if (paso === 16) {
  wizLigaGoTo(el => {
    el.innerHTML = '';
    el.appendChild(document.getElementById('tpl-wiz-liga-16').content.cloneNode(true));

    const derby = document.getElementById('wiz-liga-perfil-derby');
    const num = document.getElementById('wiz-liga-perfil-numero');

    derby.value = _wizLiga.nombreDerby || '';
    num.value = _wizLiga.numeroDerby || '';

    derby.oninput = e => _wizLiga.nombreDerby = e.target.value;
    num.oninput = e => _wizLiga.numeroDerby = e.target.value;
  }, forward);
  return;
}

if (paso === 17) {
  wizLigaGoTo(el => {
    el.innerHTML = '';
    el.appendChild(document.getElementById('tpl-wiz-liga-17').content.cloneNode(true));

    regRenderChips('wiz-liga-rol-chips', REG_ROLES, _wizLiga.rolJugadorx || '', v => _wizLiga.rolJugadorx = v);
  }, forward);
  return;
}

if (paso === 18) {
  wizLigaGoTo(el => {
    el.innerHTML = '';
    el.appendChild(document.getElementById('tpl-wiz-liga-18').content.cloneNode(true));

    regRenderChips('wiz-liga-asiste-chips', REG_ASISTENCIA, _wizLiga.asisteSemana || '', v => _wizLiga.asisteSemana = v);
  }, forward);
  return;
}

if (paso === 19) {
  wizLigaGoTo(el => {
    el.innerHTML = '';
    el.appendChild(document.getElementById('tpl-wiz-liga-19').content.cloneNode(true));

    document.getElementById('wiz-liga-perfil-alergias').oninput = e => _wizLiga.alergias = e.target.value;
    document.getElementById('wiz-liga-perfil-dieta').oninput = e => _wizLiga.dieta = e.target.value;
  }, forward);
  return;
}

  if (paso === 20) {
  wizLigaGoTo(el => {
    el.innerHTML = '';
    el.appendChild(document.getElementById('tpl-wiz-liga-20').content.cloneNode(true));

    document.getElementById('wiz-liga-perfil-emergencia').oninput =
      e => _wizLiga.contactoEmergencia = e.target.value;
  }, forward);
  return;
}

} // cierre renderWizLigaPaso

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

async function wizLigaSubmit() {
  wizMostrarCargando();
  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email');
    if (!email) { mostrarToastGuardado('⚠️ No se encontró tu sesión'); wizOcultarCargando(); return; }
    const result = await apiCall('/crear-liga', 'POST', {
      email,
      nombreLiga:         _wizLiga.nombreLiga.trim(),
      nombreEquipo:       _wizLiga.nombreEquipo.trim(),
      categoria:          _wizLiga.categoria || null,
      ligaImagenBase64:   _wizLiga.ligaImagenBase64 || null,
      logoBase64:         _wizLiga.logoBase64 || null,
      colorPrimario:      _wizLiga.colorPrimario || null,
      nombre:             _wizLiga.nombre.trim(),
      pronombres:         Array.isArray(_wizLiga.pronombres) ? _wizLiga.pronombres.join(', ') : '',
      pais:               _wizLiga.paisPerfil || '',
      codigoPais:         _wizLiga.codigoPais || '',
      telefono:           _wizLiga.telefono || '',
      fechaNacimiento:    _wizLiga.fechaNacimiento || '',
      mostrarCumple:      _wizLiga.mostrarCumple || 'No',
      mostrarEdad:        _wizLiga.mostrarEdad || 'No',
      nombreDerby:        _wizLiga.nombreDerby || '',
      numero:             _wizLiga.numeroDerby || '',
      rolJugadorx:        _wizLiga.rolJugadorx || '',
      asisteSemana:       _wizLiga.asisteSemana || '',
      alergias:           _wizLiga.alergias || '',
      dieta:              _wizLiga.dieta || '',
      contactoEmergencia: _wizLiga.contactoEmergencia || '',
      fotoBase64:         _wizLiga.fotoBase64 || null,
    });
    if (!result?.ok) throw new Error(result?.error || 'Error al crear');
    wizOcultarCargando();
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('noEncontradoScreen').style.display = 'none';
    cerrarWizLiga();
    CURRENT_USER = {
      found: true, id: result.perfil.id, email,
      rolApp: 'Admin', equipoId: result.equipo.id, ligaId: result.liga.id,
      colorPrimario: _wizLiga.colorPrimario || '#ef4444',
    };
    if (_wizLiga.colorPrimario) aplicarColorPrimario(_wizLiga.colorPrimario);
    localStorage.setItem('quindes_email', email);
    window._enFlujoCrearLiga = false;
    sessionStorage.removeItem('_enFlujoCrearLiga');
    const profile = await apiCall('/perfil/' + result.perfil.id);
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();
    const appEl = document.getElementById('appContent');
    document.getElementById('loadingScreen').style.display = 'none';
    appEl.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      appEl.classList.add('visible');
      setTimeout(() => { lanzarConfetti(); mostrarBienvenida(); }, 400);
    }));
    if (CURRENT_USER?.ligaId) cargarMiLiga({ render: false });
  } catch(e) {
    wizOcultarCargando();
    mostrarToastGuardado('❌ Error al crear: ' + e.message);
    console.error(e);
  }
}

function mostrarWizardLiga() {
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  window._colorAntesDeLiga = document.documentElement.dataset.colorPrimario || '#ef4444';
  _wizLiga = { nombreLiga: '', ligaImagenBase64: null, nombreEquipo: '', categoria: '', logoBase64: null, colorPrimario: '', pais: '', ciudad: '', anioFundacion: '', descripcion: '', contactoSocial: '', nombre: '', pronombres: [], paisPerfil: '', codigoPais: '', telefono: '', fechaNacimiento: '', mostrarCumple: '', mostrarEdad: '', nombreDerby: '', numeroDerby: '', rolJugadorx: '', asisteSemana: '', alergias: '', dieta: '', contactoEmergencia: '', fotoBase64: null };
  _wizLigaPaso = 0;

  const overlay  = document.getElementById('wiz-liga-overlay');
  const introEl  = document.getElementById('wiz-liga-intro');
  const headerEl = document.getElementById('wiz-liga-header');
  const footerEl = document.getElementById('wiz-liga-footer');
  const contenido = document.getElementById('wiz-liga-contenido');

  // Resetear estado
  if (introEl)  { introEl.style.display = ''; introEl.style.opacity = ''; introEl.style.transform = ''; }
  if (headerEl) headerEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'none';
  if (contenido) contenido.innerHTML = '';

  overlay.classList.remove('visible');
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
}

function cerrarWizLiga() {
  const overlay = document.getElementById('wiz-liga-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  if (!window._enFlujoCrearLiga) sessionStorage.removeItem('_enFlujoCrearLiga');
  aplicarColorPrimario(window._colorAntesDeLiga || '#ef4444');
}

function wizLigaGoTo(renderFn, forward = true) {
  const viewport = document.getElementById('wiz-liga-contenido');
  if (!viewport) return;
  if (viewport._wizAnimating) return;
  const DURATION = 280;
  viewport._wizAnimating = true;
  const prevEl = viewport.querySelector('.wiz-liga-step');

  const nextEl = document.createElement('div');
  nextEl.className = 'wiz-liga-step';
  nextEl.style.transform = forward ? 'translateX(105%)' : 'translateX(-30%)';
  nextEl.style.transition = 'none';
  viewport.appendChild(nextEl);

  requestAnimationFrame(() => {
    renderFn(nextEl);
    requestAnimationFrame(() => {
    const ease = `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1)`;
    if (prevEl) {
      prevEl.style.transition = ease;
      prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';
      setTimeout(() => prevEl.remove(), DURATION + 20);
    }
    nextEl.style.transition = ease;
      nextEl.style.transform  = 'translateX(0)';
      setTimeout(() => {
        nextEl.style.transition = '';
        nextEl.style.transform  = '';
        nextEl.classList.add('wiz-liga-step--animated');
        viewport._wizAnimating = false;
      }, DURATION + 20);
    });
  });
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'next') {
    wizLigaPasoSiguiente();
  }

  if (action === 'back') {
    wizLigaPasoAnterior();
  }

  if (action === 'skip') {
    wizLigaPasoSiguiente();
  }
});
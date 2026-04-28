// ============================================================
//  PIVOT APP — wizard-liga.js
//  Wizard de crear liga
//  ⚠️  Depende de wizard-cuenta.js (debe cargarse antes):
//      procesarImagen, regRenderChips, regRenderChipsMulti,
//      wizMostrarCargando, wizOcultarCargando,
//      lanzarConfetti, mostrarBienvenida,
//      REG_PAISES, REG_CODIGOS, REG_PRONOMBRES,
//      REG_ROLES, REG_ASISTENCIA, COLOR_PICKER_PRESETS,
//      CIUDADES_POR_PAIS (ajustes.js)
// ============================================================

// ── UTILIDAD: binding de input de imagen ─────────────────────
// ── BOTÓN ÚNICO OPCIONAL (OMITIR ↔ CONTINUAR) ────────────────
function wizLigaActualizarBtnOpcional(hasData, textoActivo) {
  const label = document.querySelector('#wiz-liga-contenido .wiz-opt-btn-label');
  if (!label) return;
  const texto = hasData ? (textoActivo || 'CONTINUAR') : 'OMITIR';
  if (label.textContent.trim() === texto) return;
  label.classList.add('is-fading');
  setTimeout(function() {
    label.textContent = texto;
    label.classList.remove('is-fading');
  }, 180);
}

function bindImageInput(opts) {
  // opts: { inputId, previewId, placeholderId, stateKey, config }
  const input       = document.getElementById(opts.inputId);
  const img         = document.getElementById(opts.previewId);
  const placeholder = document.getElementById(opts.placeholderId);
  if (!input || !img || !placeholder) return;
  if (input.dataset.bound) return;
  input.dataset.bound = 'true';

  const showPreview = function(base64) {
    img.src = base64;
    img.classList.remove('wiz-hidden');
    placeholder.classList.add('wiz-hidden');
    img.style.opacity = '0';
    requestAnimationFrame(function() {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1';
      setTimeout(function() { img.style.transition = ''; }, 300);
    });
  };

  // Botón eliminar imagen — usa clase CSS, sin style.cssText
  let removeBtn = input.parentElement.querySelector('.wiz-remove-img');
  if (!removeBtn) {
    removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.className = 'wiz-remove-img';
    input.parentElement.style.position = 'relative'; // excepción: posición dinámica necesaria
    input.parentElement.appendChild(removeBtn);
  }

const resetImage = function() {
    _wizLiga[opts.stateKey] = null;
    img.src = '';
    img.classList.add('wiz-hidden');
    placeholder.classList.remove('wiz-hidden');
    removeBtn.classList.remove('wiz-remove-img--visible');
    if (opts.onUpdate) opts.onUpdate(false);
  };
    
  if (_wizLiga[opts.stateKey]) {
    showPreview(_wizLiga[opts.stateKey]);
    removeBtn.classList.add('wiz-remove-img--visible');
  } else {
    img.classList.add('wiz-hidden');
    placeholder.classList.remove('wiz-hidden');
  }

  removeBtn.addEventListener('click', resetImage);

  const handleFile = async function(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { mostrarToastGuardado('⚠️ Solo imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { mostrarToastGuardado('⚠️ Máximo 5MB'); return; }
    try {
        const base64 = await procesarImagen(file, opts.config || {});
        _wizLiga[opts.stateKey] = base64;
        showPreview(base64);
        removeBtn.classList.add('wiz-remove-img--visible');
        if (opts.onUpdate) opts.onUpdate(true);
      } catch (err) {
      console.error(err);
      mostrarToastGuardado('❌ Error procesando imagen');
    }
  };

  input.addEventListener('change', function(e) { handleFile(e.target.files && e.target.files[0]); });

  const dropZone = input.parentElement;
  dropZone.addEventListener('dragover',  function(e) { e.preventDefault(); dropZone.classList.add('wiz-drag-over'); });
  dropZone.addEventListener('dragleave', function()  { dropZone.classList.remove('wiz-drag-over'); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('wiz-drag-over');
    handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
}

// ── ESTADO ────────────────────────────────────────────────────
const _WIZ_LIGA_TOTAL = 19;
let _wizLigaPaso = 0;
let _wizLiga = {};

// ── HELPERS DE BOTÓN (liga) ───────────────────────────────────
// Pasos requeridos: deshabilita hasta que haya valor
function wlToggleNext(enabled, el) {
  if (!el) return;
  const btn = el.querySelector('.wiz-btn-primary');
  if (!btn) return;
  btn.disabled = !enabled;
  btn.classList.toggle('wiz-btn-disabled', !enabled);
}

// ── TOGGLE BOTÓN SIGUIENTE (liga) ────────────────────────────
function wlToggleNext(enabled, el) {
  if (!el) return;
  const btn = el.querySelector('.wiz-btn-primary');
  if (!btn) return;
  btn.disabled = !enabled;
  btn.classList.toggle('wiz-btn-disabled', !enabled);
}

// ── APERTURA / CIERRE ─────────────────────────────────────────
function mostrarWizardLiga() {
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  localStorage.setItem('_enFlujoCrearLiga', '1');
  window._colorAntesDeLiga = document.documentElement.dataset.colorPrimario || '#ef4444';

  _wizLiga = {
    nombreLiga:'', ligaImagenBase64:null, nombreEquipo:'', categoria:'',
    logoBase64:null, colorPrimario:'', pais:'', ciudad:'',
    anioFundacion:'', descripcion:'', contactoSocial:'',
    nombre:'', pronombres:[], paisPerfil:'', codigoPais:'', telefono:'',
    fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
    nombreDerby:'', numeroDerby:'', rolJugadorx:'', asisteSemana:'',
    alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null,
  };
  _wizLigaPaso = 0;

  const overlay    = document.getElementById('wiz-liga-overlay');
  const loginScr   = document.getElementById('wiz-liga-login-screen');
  const introEl    = document.getElementById('wiz-liga-intro');
  const headerEl   = document.getElementById('wiz-liga-header');
  const footerEl   = document.getElementById('wiz-liga-footer');
  const contenido  = document.getElementById('wiz-liga-contenido');

  if (headerEl)  headerEl.style.display  = 'none';
  if (footerEl)  footerEl.style.display  = 'none';
  if (contenido) contenido.innerHTML     = '';

  const email = window._googleEmail || localStorage.getItem('quindes_email');
  if (email) {
    if (loginScr) loginScr.style.display = 'none';
    if (introEl)  { introEl.style.display = ''; introEl.style.opacity = ''; introEl.style.transform = ''; }
  } else {
    if (introEl)  introEl.style.display  = 'none';
    if (loginScr) { loginScr.style.display = ''; loginScr.style.opacity = ''; }
    requestAnimationFrame(function() {
      const wrap = document.getElementById('wiz-liga-google-btn');
      if (wrap && !wrap.dataset.rendered) {
        renderGoogleButton('wiz-liga-google-btn', 'continue_with');
      }
    });
  }

  overlay.classList.remove('visible');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { overlay.classList.add('visible'); });
  });
}

function cerrarWizLiga() {
  const overlay = document.getElementById('wiz-liga-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  if (!window._enFlujoCrearLiga) sessionStorage.removeItem('_enFlujoCrearLiga');
  localStorage.removeItem('_enFlujoCrearLiga');
  aplicarColorPrimario(window._colorAntesDeLiga || '#ef4444');
}

// ── INTRO LIGA ────────────────────────────────────────────────
function wizLigaIntroStart() {
  const introEl  = document.getElementById('wiz-liga-intro');
  const headerEl = document.getElementById('wiz-liga-header');
  const footerEl = document.getElementById('wiz-liga-footer');

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
    if (headerEl) {
      headerEl.style.opacity = '0';
      headerEl.style.display = 'flex';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          headerEl.style.transition = 'opacity 0.35s ease';
          headerEl.style.opacity    = '1';
          setTimeout(function() { headerEl.style.transition = ''; }, 370);
        });
      });
    }
    if (footerEl) {
      footerEl.style.opacity = '0';
      footerEl.style.display = 'flex';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          footerEl.style.transition = 'opacity 0.35s ease';
          footerEl.style.opacity    = '1';
          setTimeout(function() { footerEl.style.transition = ''; }, 370);
        });
      });
    }
// REEMPLAZAR:
    renderWizLigaPaso(1);
  }, 200);
}

// ── PANTALLA LOGIN → INTRO (llamado desde auth.js tras Google sign-in) ───
function wizLigaDesdeGoogle() {
  const loginScr = document.getElementById('wiz-liga-login-screen');
  const introEl  = document.getElementById('wiz-liga-intro');
  if (loginScr) {
    loginScr.style.transition = 'opacity 0.3s ease';
    loginScr.style.opacity    = '0';
    setTimeout(function() { loginScr.style.display = 'none'; loginScr.style.transition = loginScr.style.opacity = ''; }, 310);
  }
  if (introEl) {
    introEl.style.opacity   = '0';
    introEl.style.transform = 'translateY(24px)';
    introEl.style.display   = '';
    requestAnimationFrame(function() {
      introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
      introEl.style.opacity    = '1';
      introEl.style.transform  = 'translateY(0)';
      setTimeout(function() { introEl.style.transition = ''; }, 310);
    });
  }
}

// ── TRANSICIÓN DE PASOS ───────────────────────────────────────
function wizLigaGoTo(renderFn, forward) {
  if (forward === undefined) forward = true;
  const viewport = document.getElementById('wiz-liga-contenido');
  if (!viewport || viewport._wizAnimating) return;

  const DURATION = 280;
  viewport._wizAnimating = true;

  const prevEl = viewport.querySelector('.wiz-liga-step');
  const nextEl = document.createElement('div');
  nextEl.className  = 'wiz-liga-step';
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-30%)';
  nextEl.style.transition = 'none';
  viewport.appendChild(nextEl);

  requestAnimationFrame(function() {
    renderFn(nextEl);
    requestAnimationFrame(function() {
      const ease = 'transform ' + DURATION + 'ms cubic-bezier(0.4,0,0.2,1)';
      if (prevEl) {
        prevEl.style.transition = ease;
        prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';
        setTimeout(function() { prevEl.remove(); }, DURATION + 20);
      }
      nextEl.style.transition = ease;
      nextEl.style.transform  = 'translateX(0)';
      setTimeout(function() {
        nextEl.style.transition = nextEl.style.transform = '';
        nextEl.classList.add('wiz-liga-step--animated');
        viewport._wizAnimating = false;
      }, DURATION + 20);
    });
  });
}

// ── RENDER DE PASOS ───────────────────────────────────────────
function renderWizLigaPaso(paso) {
  const forward   = paso >= _wizLigaPaso;
  _wizLigaPaso    = paso;
  const btnBack   = document.getElementById('wiz-liga-btn-back');
  const pasoLabel = document.getElementById('wiz-liga-step-label');
  const progress  = document.getElementById('wiz-liga-progress-fill');
  const contenido = document.getElementById('wiz-liga-contenido');
  if (!contenido) return;

  if (btnBack) btnBack.style.display = 'block';
  if (pasoLabel) pasoLabel.textContent = 'Paso ' + paso + ' de ' + _WIZ_LIGA_TOTAL;
  if (progress)  progress.style.width  = (paso / _WIZ_LIGA_TOTAL * 100) + '%';

  // Helper para clonar template
  const cloneTpl = function(id, el) {
    const tpl = document.getElementById(id);
    if (!tpl) return;
    el.innerHTML = '';
    el.appendChild(tpl.content.cloneNode(true));
  };

if (paso === 1) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-1', el);
      if (btnBack) btnBack.classList.remove('wiz-hidden');
      const input = el.querySelector('#wiz-liga-nombre');
      if (input) {
        input.value = _wizLiga.nombreLiga || '';
        input.addEventListener('input', function(e) {
          _wizLiga.nombreLiga = e.target.value;
          wlToggleNext(!!e.target.value.trim(), el);
        });
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') wizLigaPasoSiguiente(); });
        setTimeout(function() { input.focus(); }, 350);
      }
      wlToggleNext(!!(_wizLiga.nombreLiga || '').trim(), el);
    }, forward);
    return;
  }

  if (paso === 2) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-2', el);
      bindImageInput({
      inputId:'wiz-liga-img-input', previewId:'wiz-liga-img-preview',
      placeholderId:'wiz-liga-img-placeholder', stateKey:'ligaImagenBase64',
      config:{ maxWidth:1000, maxHeight:1000, quality:0.75 },
      onUpdate: function(has) { wizLigaActualizarBtnOpcional(has); }
    });
    wizLigaActualizarBtnOpcional(!!_wizLiga.ligaImagenBase64);
    }, forward);
    return;
  }

  if (paso === 3) {
  wizLigaGoTo(function(el) {
    cloneTpl('tpl-wiz-liga-3', el);

    const wrapCiudad = el.querySelector('#wiz-liga-ciudad-wrap');
    const wrapCustom = el.querySelector('#wiz-liga-ciudad-custom-wrap');
    const inputCustom = el.querySelector('#wiz-liga-ciudad-custom');
    const paisDisplay = el.querySelector('#wiz-liga-pais-display');
    const ciudadDisplay = el.querySelector('#wiz-liga-ciudad-display');

    function actualizarCiudadBtn(ciudad) {
      if (ciudadDisplay) ciudadDisplay.textContent = ciudad || 'Seleccionar ciudad…';
    }

    function updateBtn() {
      wizLigaActualizarBtnOpcional(!!(_wizLiga.pais && _wizLiga.ciudad));
    }

    function abrirSelectorCiudad(pais) {
      const ciudades = CIUDADES_POR_PAIS[pais] || [];
      const opciones = ciudades.concat(['Mi ciudad no está en la lista…']);

      abrirBottomSheet('Ciudad', opciones, _wizLiga.ciudad || '', function(val) {
        if (val === 'Mi ciudad no está en la lista…') {
          _wizLiga.ciudad = inputCustom ? inputCustom.value : '';
          wrapCustom.classList.remove('wiz-hidden');
          actualizarCiudadBtn('Otra ciudad…');
        } else {
          _wizLiga.ciudad = val;
          wrapCustom.classList.add('wiz-hidden');
          actualizarCiudadBtn(val);
        }
        updateBtn();
      });
    }

    if (paisDisplay) paisDisplay.textContent = _wizLiga.pais || 'Seleccionar país…';
    if (_wizLiga.pais) wrapCiudad.classList.remove('wiz-hidden');
    actualizarCiudadBtn(_wizLiga.ciudad);

    const paisBtn = el.querySelector('#wiz-liga-pais-btn');
    if (paisBtn) paisBtn.onclick = function() {
      abrirBottomSheet('País', REG_PAISES, _wizLiga.pais || '', function(val) {
        _wizLiga.pais = val;
        _wizLiga.ciudad = '';
        if (paisDisplay) paisDisplay.textContent = val;
        wrapCiudad.classList.remove('wiz-hidden');
        actualizarCiudadBtn('');
        wrapCustom.classList.add('wiz-hidden');
        updateBtn();
      });
    };

    const ciudadBtn = el.querySelector('#wiz-liga-ciudad-btn');
    if (ciudadBtn) ciudadBtn.onclick = function() {
      if (!_wizLiga.pais) {
        mostrarToastGuardado('⚠️ Primero seleccioná un país');
        return;
      }
      abrirSelectorCiudad(_wizLiga.pais);
    };

    if (inputCustom) {
      inputCustom.addEventListener('input', function(e) {
        _wizLiga.ciudad = e.target.value;
        updateBtn();
      });
    }

    updateBtn();
  }, forward);
  return;
}

  if (paso === 4) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-4', el);
      const inputAnio = document.getElementById('wiz-liga-anio');
      const inputDesc = document.getElementById('wiz-liga-descripcion');
      if (inputAnio) {
        inputAnio.value = _wizLiga.anioFundacion || '';
        inputAnio.max = new Date().getFullYear();
        inputAnio.addEventListener('input', function(e) {
          _wizLiga.anioFundacion = e.target.value;
          wizLigaActualizarBtnOpcional(!!(e.target.value || _wizLiga.descripcion));
        });
      }
      if (inputDesc) {
        inputDesc.value = _wizLiga.descripcion || '';
        inputDesc.addEventListener('input', function(e) {
          _wizLiga.descripcion = e.target.value;
          wizLigaActualizarBtnOpcional(!!(e.target.value || _wizLiga.anioFundacion));
        });
      }
      wizLigaActualizarBtnOpcional(!!(_wizLiga.anioFundacion || _wizLiga.descripcion));
      setTimeout(function() { if (inputAnio) inputAnio.focus(); }, 350);
      wizLigaActualizarBtnOpcional(!!(_wizLiga.anioFundacion || _wizLiga.descripcion));
    }, forward);
    return;
  }

  if (paso === 5) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-5', el);
      const input = document.getElementById('wiz-liga-ig');
      if (input) {
        input.value = _wizLiga.contactoSocial || '';
        input.addEventListener('input', function(e) {
          _wizLiga.contactoSocial = e.target.value;
          wizLigaActualizarBtnOpcional(!!e.target.value);
        });
        wizLigaActualizarBtnOpcional(!!_wizLiga.contactoSocial);
        setTimeout(function() { input.focus(); }, 350);
      }
      wizLigaActualizarBtnOpcional(!!(_wizLiga.contactoSocial || '').trim());
    }, forward);
    return;
  }

if (paso === 6) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-6', el);
      const input = el.querySelector('#wiz-liga-equipo-nombre');
      if (input) {
        input.value = _wizLiga.nombreEquipo || '';
        input.addEventListener('input', function(e) {
          _wizLiga.nombreEquipo = e.target.value;
          wlToggleNext(!!e.target.value.trim(), el);
        });
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') wizLigaPasoSiguiente(); });
        setTimeout(function() { input.focus(); }, 350);
      }
      wlToggleNext(!!(_wizLiga.nombreEquipo || '').trim(), el);
    }, forward);
    return;
  }

if (paso === 7) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-7', el);
      const wrap = document.getElementById('wiz-liga-cat-chips');
      ['A','B','C'].forEach(function(cat) {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = 'chip ' + (_wizLiga.categoria === cat ? 'chip-active' : 'chip-inactive');
        btn.addEventListener('click', function() {
          _wizLiga.categoria = cat;
          Array.from(wrap.children).forEach(function(b) { b.classList.remove('chip-active'); b.classList.add('chip-inactive'); });
          btn.classList.add('chip-active'); btn.classList.remove('chip-inactive');
          wizLigaActualizarBtnOpcional(true);
        });
        wrap.appendChild(btn);
      });
      wizLigaActualizarBtnOpcional(!!_wizLiga.categoria);
    }, forward);
    return;
  }

if (paso === 8) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-8', el);
      bindImageInput({
      inputId:'wiz-liga-logo-input', previewId:'wiz-liga-logo-preview',
      placeholderId:'wiz-liga-logo-placeholder', stateKey:'logoBase64',
      config:{ maxWidth:500, maxHeight:500, quality:0.8 },
      onUpdate: function(has) { wizLigaActualizarBtnOpcional(has || !!_wizLiga.colorPrimario); }
    });
    }, forward);
    return;
  }

  if (paso === 9) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-color', el);
      const wrapColors = document.getElementById('wiz-color-presets');
      if (!wrapColors) return;
      const colorActual = _wizLiga.colorPrimario || document.documentElement.dataset.colorPrimario || '#ef4444';
      COLOR_PICKER_PRESETS.forEach(function(color) {
        const btn = document.createElement('button');
        btn.className = 'color-swatch-btn';
        if (color === colorActual) btn.classList.add('selected');
        btn.style.background = color; // excepción: valor dinámico de runtime
        btn.addEventListener('click', function() {
          _wizLiga.colorPrimario = color;
          aplicarColorPrimario(color);
          Array.from(wrapColors.children).forEach(function(b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          wizLigaActualizarBtnOpcional(true);
        });
        wrapColors.appendChild(btn);
      });
      // Botón personalizado
      const customBtn = document.createElement('button');
      customBtn.className = 'color-swatch-btn color-swatch-btn--custom';
      customBtn.title = 'Color personalizado';
      customBtn.innerHTML = '<span class="material-icons" aria-hidden="true">colorize</span>';
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'wiz-color-custom-input';
      colorInput.value = (_wizLiga.colorPrimario && !COLOR_PICKER_PRESETS.includes(_wizLiga.colorPrimario))
        ? _wizLiga.colorPrimario : '#ef4444';
      customBtn.appendChild(colorInput);
      if (_wizLiga.colorPrimario && !COLOR_PICKER_PRESETS.includes(_wizLiga.colorPrimario)) {
        customBtn.style.background = _wizLiga.colorPrimario;
        customBtn.classList.add('selected');
      }
      customBtn.addEventListener('click', function(e) {
        if (e.target !== colorInput) colorInput.click();
      });
      colorInput.addEventListener('input', function(e) {
        const color = e.target.value;
        customBtn.style.background = color; // excepción: valor dinámico de runtime
        _wizLiga.colorPrimario = color;
        aplicarColorPrimario(color);
        Array.from(wrapColors.children).forEach(function(b) { b.classList.remove('selected'); });
        customBtn.classList.add('selected');
      });
      wrapColors.appendChild(customBtn);
      wizLigaActualizarBtnOpcional(!!(_wizLiga.logoBase64 || _wizLiga.colorPrimario));
    
    }, forward);
    return;
  }

if (paso === 10) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-10', el);
      const input = el.querySelector('#wiz-liga-perfil-nombre');
      if (input) {
        input.value = _wizLiga.nombre || '';
        input.addEventListener('input', function(e) {
          _wizLiga.nombre = e.target.value;
          wlToggleNext(!!e.target.value.trim(), el);
        });
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') wizLigaPasoSiguiente(); });
        setTimeout(function() { input.focus(); }, 300);
      }
      wlToggleNext(!!(_wizLiga.nombre || '').trim(), el);
    }, forward);
    return;
  }

  if (paso === 11) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-11', el);
      let _initPronombres = true;

regRenderChipsMulti('wiz-liga-pronombres-chips', REG_PRONOMBRES, _wizLiga.pronombres || [], function(v) {
  _wizLiga.pronombres = v;

  if (_initPronombres) {
    _initPronombres = false;
    return;
  }

  wizLigaActualizarBtnOpcional(v.length > 0);
});

// estado inicial correcto (forzado)
wizLigaActualizarBtnOpcional((_wizLiga.pronombres || []).length > 0);

    }, forward);
    return;
  }

  if (paso === 12) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-12', el);
      const display = el.querySelector('#wiz-liga-perfil-pais-display');
      if (display) display.textContent = _wizLiga.paisPerfil || 'Seleccionar país…';
      const paisBtn = el.querySelector('#wiz-liga-perfil-pais-btn');
      if (paisBtn) paisBtn.onclick = function() {
      abrirBottomSheet('Nacionalidad', REG_PAISES, _wizLiga.paisPerfil || '', function(val) {
        _wizLiga.paisPerfil = val;
        if (display) display.textContent = val;
        wizLigaActualizarBtnOpcional(!!val);
      });
    };
    wizLigaActualizarBtnOpcional(!!_wizLiga.paisPerfil);
      wizLigaActualizarBtnOpcional(!!_wizLiga.paisPerfil);
    }, forward);
    return;
  }

  if (paso === 13) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-13', el);
      const tel = el.querySelector('#wiz-liga-perfil-tel');
      const display = el.querySelector('#wiz-liga-perfil-codigo-display');
      if (tel) tel.value = _wizLiga.telefono || '';
      if (display) display.textContent = _wizLiga.codigoPais || '+?';
      if (tel) tel.addEventListener('input', function(e) {
  _wizLiga.telefono = e.target.value;
  wlToggleNext(!!(_wizLiga.telefono && _wizLiga.codigoPais), el);
});
      const codigoBtn = el.querySelector('#wiz-liga-perfil-codigo-btn');
      if (codigoBtn) codigoBtn.onclick = function() {
        abrirBottomSheet('Código', REG_CODIGOS, _wizLiga.codigoPais || '', function(val) {
          _wizLiga.codigoPais = val;
          wlToggleNext(!!(_wizLiga.telefono && _wizLiga.codigoPais), el);
          if (display) display.textContent = val;
        });
      };
      wlToggleNext(!!(_wizLiga.telefono && _wizLiga.codigoPais), el);
    }, forward);
    return;
  }

if (paso === 14) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-14', el);
      const display = el.querySelector('#wiz-liga-perfil-fecha-display');
      if (display) display.textContent = _wizLiga.fechaNacimiento || 'Seleccionar fecha…';
      const fechaBtn = el.querySelector('#wiz-liga-perfil-fecha-btn');
      if (fechaBtn) fechaBtn.onclick = function() {
        abrirDatePicker(_wizLiga.fechaNacimiento || '', function(val) {
          _wizLiga.fechaNacimiento = val;
          if (display) display.textContent = val;
          wlToggleNext(true, el);
        });
      };
      regRenderChips('wiz-liga-cumple-chips', ['Sí','No'], _wizLiga.mostrarCumple || '', function(v) { _wizLiga.mostrarCumple = v; });
      regRenderChips('wiz-liga-edad-chips', ['Sí','No'], _wizLiga.mostrarEdad || '', function(v) { _wizLiga.mostrarEdad = v; });
      wlToggleNext(!!_wizLiga.fechaNacimiento, el);
    }, forward);
    return;
  }

  if (paso === 15) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-15', el);
      const derby = el.querySelector('#wiz-liga-perfil-derby');
      const num = el.querySelector('#wiz-liga-perfil-numero');
      if (derby) {
      derby.value = _wizLiga.nombreDerby || '';
      derby.oninput = function(e) {
        _wizLiga.nombreDerby = e.target.value;
        wizLigaActualizarBtnOpcional(!!e.target.value || !!_wizLiga.numeroDerby);
      };
    }
    if (num) {
      num.value = _wizLiga.numeroDerby || '';
      num.oninput = function(e) {
        _wizLiga.numeroDerby = e.target.value;
        wizLigaActualizarBtnOpcional(!!e.target.value || !!_wizLiga.nombreDerby);
      };
    }
    wizLigaActualizarBtnOpcional(!!_wizLiga.nombreDerby || !!_wizLiga.numeroDerby);
      wizLigaActualizarBtnOpcional(!!(_wizLiga.nombreDerby || _wizLiga.numeroDerby));
    }, forward);
    return;
  }

  if (paso === 16) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-16', el);
      regRenderChips('wiz-liga-rol-chips', REG_ROLES, _wizLiga.rolJugadorx || '', function(v) {
        _wizLiga.rolJugadorx = v;
        wlToggleNext(true, el);
      });
      wlToggleNext(!!_wizLiga.rolJugadorx, el);
    }, forward);
    return;
  }

  if (paso === 17) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-17', el);
      regRenderChips('wiz-liga-asiste-chips', REG_ASISTENCIA, _wizLiga.asisteSemana || '', function(v) {
        _wizLiga.asisteSemana = v;
        wlToggleNext(true, el);
      });
      wlToggleNext(!!_wizLiga.asisteSemana, el);
    }, forward);
    return;
  }

  if (paso === 18) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-18', el);
      const elA = el.querySelector('#wiz-liga-perfil-alergias');
      const elD = el.querySelector('#wiz-liga-perfil-dieta');
      if (elA) elA.oninput = function(e) {
      _wizLiga.alergias = e.target.value;
      wizLigaActualizarBtnOpcional(!!e.target.value || !!_wizLiga.dieta);
    };
    if (elD) elD.oninput = function(e) {
      _wizLiga.dieta = e.target.value;
      wizLigaActualizarBtnOpcional(!!e.target.value || !!_wizLiga.alergias);
    };
    wizLigaActualizarBtnOpcional(!!_wizLiga.alergias || !!_wizLiga.dieta);
      wizLigaActualizarBtnOpcional(!!(_wizLiga.alergias || _wizLiga.dieta));
    }, forward);
    return;
  }

  if (paso === 19) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-19', el);
      const elE = el.querySelector('#wiz-liga-perfil-emergencia');
      if (elE) elE.oninput = function(e) {
      _wizLiga.contactoEmergencia = e.target.value;
      wizLigaActualizarBtnOpcional(!!e.target.value, 'OMITIR Y FINALIZAR');
    };
    wizLigaActualizarBtnOpcional(   !!_wizLiga.contactoEmergencia,   'FINALIZAR <span class="material-icons">check</span>' );
    }, forward);
    return;
  }

  if (paso === 20) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-19', el);
      const elE = document.getElementById('wiz-liga-perfil-emergencia');
      if (elE) elE.oninput = function(e) { _wizLiga.contactoEmergencia = e.target.value; };
    }, forward);
    return;
  }

}

// ── VALIDACIÓN Y NAVEGACIÓN ───────────────────────────────────
function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 1  && !_wizLiga.nombreLiga.trim())    { mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return; }
if (_wizLigaPaso === 6 && !_wizLiga.nombreEquipo.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return; }
  if (_wizLigaPaso === 11 && !_wizLiga.nombre.trim()) { mostrarToastGuardado('⚠️ Escribe cómo te llamamos'); return; }
  if (_wizLigaPaso === 13 && !_wizLiga.telefono.trim()) { mostrarToastGuardado('⚠️ Ingresá tu número de teléfono'); return; }
  if (_wizLigaPaso === 14 && !_wizLiga.fechaNacimiento) { mostrarToastGuardado('⚠️ Ingresá tu fecha de nacimiento'); return; }
  renderWizLigaPaso(_wizLigaPaso + 1);
}

function wizLigaPasoAnterior() {
  if (_wizLigaPaso > 1) renderWizLigaPaso(_wizLigaPaso - 1);
  else cerrarWizLiga();
}

// ── SUBMIT LIGA ───────────────────────────────────────────────
async function wizLigaSubmit() {
  wizMostrarCargando();
  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email');
    if (!email) { mostrarToastGuardado('⚠️ No se encontró tu sesión'); wizOcultarCargando(); return; }

    const result = await apiCall('/crear-liga', 'POST', {
      email,
      nombreLiga:         _wizLiga.nombreLiga.trim(),
      nombreEquipo:       _wizLiga.nombreEquipo.trim(),
      categoria:          _wizLiga.categoria          || null,
      ligaImagenBase64:   _wizLiga.ligaImagenBase64   || null,
      logoBase64:         _wizLiga.logoBase64          || null,
      colorPrimario:      _wizLiga.colorPrimario       || null,
      nombre:             _wizLiga.nombre.trim(),
      pronombres:         Array.isArray(_wizLiga.pronombres) ? _wizLiga.pronombres.join(', ') : '',
      pais:               _wizLiga.paisPerfil          || '',
      codigoPais:         _wizLiga.codigoPais          || '',
      telefono:           _wizLiga.telefono            || '',
      fechaNacimiento:    _wizLiga.fechaNacimiento     || '',
      mostrarCumple:      _wizLiga.mostrarCumple       || 'No',
      mostrarEdad:        _wizLiga.mostrarEdad         || 'No',
      nombreDerby:        _wizLiga.nombreDerby         || '',
      numero:             _wizLiga.numeroDerby         || '',
      rolJugadorx:        _wizLiga.rolJugadorx         || '',
      asisteSemana:       _wizLiga.asisteSemana        || '',
      alergias:           _wizLiga.alergias            || '',
      dieta:              _wizLiga.dieta               || '',
      contactoEmergencia: _wizLiga.contactoEmergencia  || '',
      fotoBase64:         _wizLiga.fotoBase64          || null,
    });

    if (!result || !result.ok) throw new Error((result && result.error) || 'Error al crear');

    wizOcultarCargando();
    const loginScr = document.getElementById('loginScreen');
    const noEncScr = document.getElementById('noEncontradoScreen');
    if (loginScr) loginScr.style.display = 'none';
    if (noEncScr) noEncScr.style.display = 'none';
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
  localStorage.removeItem('_enFlujoCrearLiga');

    const profile = await apiCall('/perfil/' + result.perfil.id);
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();

    const appEl = document.getElementById('appContent');
    const loadEl = document.getElementById('loadingScreen');
    if (loadEl) loadEl.style.display = 'none';
    if (appEl)  appEl.style.display  = 'block';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (appEl) appEl.classList.add('visible');
        setTimeout(function() { lanzarConfetti(); mostrarBienvenida(); }, 400);
      });
    });
    if (CURRENT_USER && CURRENT_USER.ligaId) cargarMiLiga({ render: false });

  } catch(e) {
    wizOcultarCargando();
    mostrarToastGuardado('❌ Error al crear: ' + e.message);
    console.error(e);
  }
}

// ── DELEGACIÓN DE CLICKS (data-action en templates de liga) ───
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'next')  wizLigaPasoSiguiente();
  if (action === 'back')  wizLigaPasoAnterior();
  if (action === 'skip') {
    if (_wizLigaPaso < _WIZ_LIGA_TOTAL) renderWizLigaPaso(_wizLigaPaso + 1);
    else wizLigaSubmit();
  }
});


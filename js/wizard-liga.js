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
    const overlay = input.parentElement.querySelector('.reg-avatar-overlay');
    if (overlay) overlay.classList.remove('wiz-hidden');
    requestAnimationFrame(function() {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1';
      setTimeout(function() { img.style.transition = ''; }, 300);
    });
  };

  if (input.parentElement.tagName !== 'LABEL') {
    input.parentElement.addEventListener('click', function() {
      input.value = '';
      input.click();
    });
  }

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
    if (opts.onChange) opts.onChange(false);
  };
    
  if (_wizLiga[opts.stateKey]) {
    showPreview(_wizLiga[opts.stateKey]);
    removeBtn.classList.add('wiz-remove-img--visible');
  } else {
    img.classList.add('wiz-hidden');
    placeholder.classList.remove('wiz-hidden');
  }

  removeBtn.addEventListener('click', resetImage);

const handleFile = function(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { mostrarToastGuardado('⚠️ Solo imágenes'); return; }
  const r = new FileReader();
  r.onload = function(ev) {
    cropTarget = opts.stateKey;
    abrirCropper(ev.target.result);
  };
  r.readAsDataURL(file);
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
const _WIZ_LIGA_TOTAL = 20;

const CODIGOS_PAISES_ALIASES = {
  'ecuador':'🇪🇨 +593','argentina':'🇦🇷 +54','bolivia':'🇧🇴 +591',
  'brasil':'🇧🇷 +55','chile':'🇨🇱 +56','colombia':'🇨🇴 +57',
  'costa rica':'🇨🇷 +506','cuba':'🇨🇺 +53','el salvador':'🇸🇻 +503',
  'guatemala':'🇬🇹 +502','honduras':'🇭🇳 +504','méxico':'🇲🇽 +52','mexico':'🇲🇽 +52',
  'nicaragua':'🇳🇮 +505','panamá':'🇵🇦 +507','panama':'🇵🇦 +507',
  'paraguay':'🇵🇾 +595','perú':'🇵🇪 +51','peru':'🇵🇪 +51',
  'puerto rico':'🇵🇷 +1','república dominicana':'🇩🇴 +1','dominicana':'🇩🇴 +1',
  'uruguay':'🇺🇾 +598','venezuela':'🇻🇪 +58',
  'canadá':'🇨🇦 +1','canada':'🇨🇦 +1','estados unidos':'🇺🇸 +1','usa':'🇺🇸 +1',
  'alemania':'🇩🇪 +49','francia':'🇫🇷 +33','españa':'🇪🇸 +34','espana':'🇪🇸 +34',
  'italia':'🇮🇹 +39','reino unido':'🇬🇧 +44','portugal':'🇵🇹 +351',
  'suiza':'🇨🇭 +41','países bajos':'🇳🇱 +31','suecia':'🇸🇪 +46',
  'rusia':'🇷🇺 +7','china':'🇨🇳 +86','japón':'🇯🇵 +81','japon':'🇯🇵 +81',
  'corea del sur':'🇰🇷 +82','india':'🇮🇳 +91','israel':'🇮🇱 +972',
  'emiratos':'🇦🇪 +971','arabia saudita':'🇸🇦 +966',
  'australia':'🇦🇺 +61','sudáfrica':'🇿🇦 +27','nigeria':'🇳🇬 +234',
};
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
// Pasos opcionales: un solo botón que actualiza el label interno
function wlOptBtn(el, hasValue) {
  const btn = el.querySelector('.wiz-opt-btn[data-action="next"]');
  if (!btn) return;
  const label = btn.querySelector('.wiz-opt-btn-label');
  if (!label) return;
  const textoNuevo = hasValue ? 'CONTINUAR' : 'OMITIR';
  if (label.textContent.trim() === textoNuevo) return;
  label.classList.add('is-fading');
  setTimeout(function() {
    label.textContent = textoNuevo;
    label.classList.remove('is-fading');
  }, 180);
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

  var _accentHex = (document.documentElement.dataset.colorPrimario || '#ef4444').replace('#', '');
  ['instagram','facebook','tiktok','x','youtube'].forEach(function(p) {
    var img = new Image();
    img.src = 'https://cdn.simpleicons.org/' + p + '/' + _accentHex;
  });

  _wizLiga = {
    nombreLiga:'', ligaImagenBase64:null, nombreEquipo:'', categoria:'',
    logoBase64:null, colorPrimario:'', pais:'', ciudad:'',
    anioFundacion:'', descripcion:'', redesSociales:[],
    nombre:'', pronombres:[], paisPerfil:'', codigoPais:'', telefono:'',
    fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
    nombreDerby:'', numeroDerby:'', rolJugadorx:'', asisteSemana:'',
    alergias:'', dieta:'',
    contactoEmergenciaNombre:'', contactoEmergenciaCodigo:'', contactoEmergenciaTel:'',
    fotoBase64:null,
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
        setTimeout(function() {
          const mask = document.getElementById('wiz-liga-google-mask');
          if (mask) {
            mask.style.opacity = '0';
            setTimeout(function() { if (mask) mask.remove(); }, 450);
          }
          var btnVolver = document.getElementById('wiz-liga-btn-volver');
          if (btnVolver) btnVolver.style.opacity = '1';
        }, 800);
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
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-105%)';
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
          onChange: function(hasImg) {
            wlOptBtn(el, hasImg);
            var overlay = el.querySelector('#wiz-liga-img-overlay');
            if (overlay) {
              overlay.classList.toggle('wiz-hidden', !hasImg);
              overlay.classList.toggle('reg-avatar-overlay--badge', hasImg);
            }
          }
        });
        wlOptBtn(el, !!_wizLiga.ligaImagenBase64);
      }, forward);
      return;
    }

  if (paso === 3) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-3', el);
      const wrapCiudad = document.getElementById('wiz-liga-ciudad-wrap');
      const wrapCustom = document.getElementById('wiz-liga-ciudad-custom-wrap');
      const inputCustom = document.getElementById('wiz-liga-ciudad-custom');
      const paisDisplay = document.getElementById('wiz-liga-pais-display');
      const ciudadDisplay = document.getElementById('wiz-liga-ciudad-display');

      function actualizarCiudadBtn(ciudad) {
        if (ciudadDisplay) ciudadDisplay.textContent = ciudad || 'Seleccionar ciudad…';
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
          wlOptBtn(el, true);
        });
      }

      if (paisDisplay) paisDisplay.textContent = _wizLiga.pais || 'Seleccionar país…';
      if (_wizLiga.pais) wrapCiudad.classList.remove('wiz-hidden');
      actualizarCiudadBtn(_wizLiga.ciudad);

      const paisBtn = document.getElementById('wiz-liga-pais-btn');
      if (paisBtn) paisBtn.onclick = function() {
        abrirBottomSheet('País', REG_PAISES, _wizLiga.pais || '', function(val) {
          _wizLiga.pais = val;
          _wizLiga.ciudad = '';
          if (paisDisplay) paisDisplay.textContent = val;
          wrapCiudad.classList.remove('wiz-hidden');
          actualizarCiudadBtn('');
          wrapCustom.classList.add('wiz-hidden');
          wlOptBtn(el, true);
        });
      };

      const ciudadBtn = document.getElementById('wiz-liga-ciudad-btn');
      if (ciudadBtn) ciudadBtn.onclick = function() {
        if (!_wizLiga.pais) { mostrarToastGuardado('⚠️ Primero seleccioná un país'); return; }
        abrirSelectorCiudad(_wizLiga.pais);
      };

      if (inputCustom) inputCustom.addEventListener('input', function(e) { _wizLiga.ciudad = e.target.value; });
    }, forward);
    return;
  }

  if (paso === 4) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-4', el);
      const inputDesc = document.getElementById('wiz-liga-descripcion');
      const anioBtn = document.getElementById('wiz-liga-anio-btn');
      const anioDisplay = document.getElementById('wiz-liga-anio-display');

      var anioActual = new Date().getFullYear();
      var años = [];
      for (var a = anioActual; a >= 2005; a--) años.push(String(a));

      function actualizarAnioDisplay() {
        if (_wizLiga.anioFundacion) {
          anioDisplay.textContent = _wizLiga.anioFundacion;
          anioBtn.classList.add('has-value');
        } else {
          anioDisplay.textContent = 'Seleccionar año…';
          anioBtn.classList.remove('has-value');
        }
      }

      if (anioBtn) {
        actualizarAnioDisplay();
        anioBtn.addEventListener('click', function() {
          abrirBottomSheet('Año de fundación', años, _wizLiga.anioFundacion || null, function(val) {
            _wizLiga.anioFundacion = val;
            actualizarAnioDisplay();
            wlOptBtn(el, true);
          });
        });
      }
      if (inputDesc) {
        inputDesc.value = _wizLiga.descripcion || '';
        inputDesc.addEventListener('input', function(e) {
          _wizLiga.descripcion = e.target.value;
          wizLigaActualizarBtnOpcional(!!e.target.value || !!_wizLiga.anioFundacion);
        });
      }
      wizLigaActualizarBtnOpcional(!!_wizLiga.anioFundacion || !!_wizLiga.descripcion);
      setTimeout(function() { if (inputAnio) inputAnio.focus(); }, 350);
      wlOptBtn(el, !!(_wizLiga.anioFundacion || _wizLiga.descripcion));
    }, forward);
    return;
  }

if (paso === 5) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-5', el);
      if (!Array.isArray(_wizLiga.redesSociales)) _wizLiga.redesSociales = [];
      var accentHex = (_wizLiga.colorPrimario || document.documentElement.dataset.colorPrimario || '#ef4444').replace('#', '');
      el.querySelectorAll('.wiz-red-icon[src]').forEach(function(img) {
        img.src = img.src.replace(/\/[^/]+$/, '/' + accentHex);
      });
      el.querySelectorAll('.wiz-red-icon-mat').forEach(function(span) {
        span.style.color = '#' + accentHex; // excepción: valor dinámico de runtime
      });

      var platSeleccionada = null;

      function renderItem(red, idx, lista) {
        var item = document.createElement('div');
        item.className = 'wiz-red-item';
        var iconHtml = red.plataforma === 'web'
          ? '<span class="material-icons wiz-red-item-icon" style="font-size:18px">language</span>'
          : '<img class="wiz-red-item-icon" src="https://cdn.simpleicons.org/' + red.plataforma + '/' + accentHex + '">';
        item.innerHTML = iconHtml +
          '<span class="wiz-red-item-url">' + red.url + '</span>' +
          '<button class="wiz-red-item-del"><span class="material-icons">close</span></button>';
        item.querySelector('.wiz-red-item-del').addEventListener('click', function() {
          item.classList.add('removing');
          setTimeout(function() {
            _wizLiga.redesSociales.splice(idx, 1);
            renderLista();
            wlOptBtn(el, _wizLiga.redesSociales.length > 0);
          }, 200);
        });
        lista.appendChild(item);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            item.classList.add('visible');
          });
        });
      }

      function renderLista() {
        var lista = document.getElementById('wiz-redes-lista');
        if (!lista) return;
        lista.innerHTML = '';
        _wizLiga.redesSociales.forEach(function(red, idx) {
          renderItem(red, idx, lista);
        });
      }

      function seleccionarPlat(chip) {
        document.querySelectorAll('.wiz-red-chip').forEach(function(c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
        platSeleccionada = {
          plat: chip.dataset.plat,
          prefix: chip.dataset.prefix,
        };
        var wrap = document.getElementById('wiz-redes-input-wrap');
        var prefixEl = document.getElementById('wiz-redes-prefix');
        var handle = document.getElementById('wiz-redes-handle');
        if (wrap) wrap.classList.remove('wiz-hidden');
        if (prefixEl) prefixEl.textContent = chip.dataset.prefix;
        if (handle) {
          handle.placeholder = chip.dataset.placeholder;
          handle.value = '';
          setTimeout(function() { handle.focus(); }, 100);
        }
      }

      document.querySelectorAll('.wiz-red-chip').forEach(function(chip) {
        chip.addEventListener('click', function() { seleccionarPlat(chip); });
      });

      var btnAgregar = document.getElementById('wiz-redes-agregar');
      if (btnAgregar) {
        btnAgregar.addEventListener('click', function() {
          var handle = document.getElementById('wiz-redes-handle');
          if (!handle || !handle.value.trim() || !platSeleccionada) return;
          var url = platSeleccionada.prefix + handle.value.trim();
          var yaExiste = _wizLiga.redesSociales.some(function(r) { return r.plataforma === platSeleccionada.plat; });
          if (yaExiste) {
            _wizLiga.redesSociales = _wizLiga.redesSociales.filter(function(r) { return r.plataforma !== platSeleccionada.plat; });
          }
          _wizLiga.redesSociales.push({ plataforma: platSeleccionada.plat, url: url });
          renderLista();
          wlOptBtn(el, true);
          handle.value = '';
          document.querySelectorAll('.wiz-red-chip').forEach(function(c) { c.classList.remove('selected'); });
          document.getElementById('wiz-redes-input-wrap').classList.add('wiz-hidden');
          platSeleccionada = null;
        });
      }

      renderLista();
      wlOptBtn(el, _wizLiga.redesSociales.length > 0);
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
        onChange: function(has) { wlOptBtn(el, has); }
      });
      wlOptBtn(el, !!_wizLiga.logoBase64);
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
          wizLigaActualizarBtnOpcional(!!_wizLiga.logoBase64 || true);
        });
        wrapColors.appendChild(btn);
      });
      wlOptBtn(el, !!_wizLiga.colorPrimario);
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
      wizLigaActualizarBtnOpcional(!!_wizLiga.logoBase64 || !!_wizLiga.colorPrimario);
    
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
      cloneTpl('tpl-wiz-liga-foto-perfil', el);
      var avatarDiv = el.querySelector('#wiz-liga-foto-avatar');
      var input     = el.querySelector('#wiz-liga-foto-input');
      var img       = el.querySelector('#wiz-liga-foto-preview');
      var ph        = el.querySelector('#wiz-liga-foto-placeholder');
      var overlay   = el.querySelector('#wiz-liga-foto-overlay');
      var hint      = el.querySelector('#wiz-liga-foto-hint');

      function mostrarFotoLiga(base64) {
        img.src = base64;
        img.classList.remove('wiz-hidden');
        ph.style.display = 'none';
        if (overlay) overlay.classList.remove('wiz-hidden');
        if (hint) { hint.innerHTML = '✨ <strong>¡Foto cargada con éxito!</strong> ✨'; hint.classList.add('reg-foto-hint-compliment'); }
        wlOptBtn(el, true);
      }

      if (_wizLiga.fotoBase64) mostrarFotoLiga(_wizLiga.fotoBase64);

      if (avatarDiv) avatarDiv.addEventListener('click', function() {
        if (input) { input.value = ''; input.click(); }
      });

      if (input) input.addEventListener('change', function(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { mostrarToastGuardado('⚠️ Solo imágenes'); return; }
        var r = new FileReader();
        r.onload = function(ev) { cropTarget = 'fotoBase64'; abrirCropper(ev.target.result); };
        r.readAsDataURL(file);
      });

      wlOptBtn(el, !!_wizLiga.fotoBase64);
    }, forward);
    return;
  }

  if (paso === 12) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-11', el);
      setTimeout(function() {
        regRenderChipsMulti('wiz-liga-pronombres-chips', REG_PRONOMBRES, _wizLiga.pronombres || [], function(v) {
          _wizLiga.pronombres = v;
          wlOptBtn(el, v.length > 0);
        });
        wlOptBtn(el, (_wizLiga.pronombres || []).length > 0);
      }, 320);
    }, forward);
    return;
  }

  if (paso === 13) {
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
      wlOptBtn(el, !!_wizLiga.paisPerfil);
    }, forward);
    return;
  }

   if (paso === 14) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-13', el);
      const tel = el.querySelector('#wiz-liga-perfil-tel');
      const display = el.querySelector('#wiz-liga-perfil-codigo-display');
      if (tel) tel.value = _wizLiga.telefono || '';
      if (display) display.textContent = _wizLiga.codigoPais || '+?';

      function validarTel() {
  const clean = (_wizLiga.telefono || '').replace(/\D/g, '');
  let error = null;
  if (!_wizLiga.codigoPais) {
    error = 'Selecciona el código de tu país 📱';
  } else if (_wizLiga.codigoPais.includes('+593')) {
    if (clean.length !== 10)       error = 'El número debe tener 10 dígitos 🇪🇨';
    else if (!clean.startsWith('0')) error = 'Debe empezar con 0 🇪🇨';
  } else if (_wizLiga.codigoPais.includes('+1')) {
    if (clean.length !== 10)       error = 'Número inválido 🇺🇸';
  } else if (clean.length < 7) {
    error = 'Número demasiado corto 📱';
  }
  wlToggleNext(!error, el);
  if (error && clean.length > 0) mostrarToastGuardado('⚠️ ' + error);
}

      if (tel) tel.addEventListener('input', function(e) {
        _wizLiga.telefono = e.target.value;
        validarTel();
      });
      const codigoBtn = el.querySelector('#wiz-liga-perfil-codigo-btn');
      if (codigoBtn) codigoBtn.onclick = function() {
        abrirBottomSheet('Código', REG_CODIGOS, _wizLiga.codigoPais || '', function(val) {
          _wizLiga.codigoPais = val;
          if (display) display.textContent = val;
          validarTel();
        }, CODIGOS_PAISES_ALIASES);
      };
      validarTel();
    }, forward);
    return;
  }

if (paso === 15) {
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

  if (paso === 16) {
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
      wlOptBtn(el, !!(_wizLiga.nombreDerby || _wizLiga.numeroDerby));
    }, forward);
    return;
  }

  if (paso === 17) {
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

  if (paso === 18) {
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

  if (paso === 19) {
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
      wlOptBtn(el, !!(_wizLiga.alergias || _wizLiga.dieta));
    }, forward);
    return;
  }

  if (paso === 20) {
    wizLigaGoTo(function(el) {
      cloneTpl('tpl-wiz-liga-19', el);

      const elNombre  = el.querySelector('#wiz-liga-emg-nombre');
      const elTel     = el.querySelector('#wiz-liga-emg-tel');
      const elDisplay = el.querySelector('#wiz-liga-emg-codigo-display');
      const elBtn     = el.querySelector('#wiz-liga-emg-codigo-btn');

      if (elNombre) elNombre.value = _wizLiga.contactoEmergenciaNombre || '';
      if (elTel)    elTel.value    = _wizLiga.contactoEmergenciaTel    || '';
      if (elDisplay) elDisplay.textContent = _wizLiga.contactoEmergenciaCodigo || '+?';

      function actualizarLabel() {
        const tieneAlgo = !!(_wizLiga.contactoEmergenciaNombre || _wizLiga.contactoEmergenciaTel);
        wlOptBtn(el, tieneAlgo);
      }

      if (elNombre) elNombre.oninput = function(e) {
        _wizLiga.contactoEmergenciaNombre = e.target.value;
        actualizarLabel();
      };
      if (elTel) elTel.oninput = function(e) {
        _wizLiga.contactoEmergenciaTel = e.target.value;
        actualizarLabel();
      };
      if (elBtn) elBtn.onclick = function() {
        abrirBottomSheet('Código', REG_CODIGOS, _wizLiga.contactoEmergenciaCodigo || '', function(val) {
          _wizLiga.contactoEmergenciaCodigo = val;
          if (elDisplay) elDisplay.textContent = val;
          actualizarLabel();
        }, CODIGOS_PAISES_ALIASES);
      };

      actualizarLabel();
    }, forward);
    return;
  }

}

// ── VALIDACIÓN Y NAVEGACIÓN ───────────────────────────────────
function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 1  && !_wizLiga.nombreLiga.trim())    { mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return; }
  if (_wizLigaPaso === 6 && !_wizLiga.nombreEquipo.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return; }
  if (_wizLigaPaso === 10 && !_wizLiga.nombre.trim()) { mostrarToastGuardado('⚠️ Escribe cómo te llamamos'); return; }
  if (_wizLigaPaso === 14 && _wizLiga.telefono.replace(/\D/g,'').length < 6) { mostrarToastGuardado('⚠️ Ingresá un número válido'); return; }
  if (_wizLigaPaso === 15 && !_wizLiga.fechaNacimiento) { mostrarToastGuardado('⚠️ Ingresá tu fecha de nacimiento'); return; }
  if (_wizLigaPaso === 20) { wizLigaSubmit(); return; }
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
      redesSociales:      _wizLiga.redesSociales        || [],
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
      contactoEmergencia: [
        _wizLiga.contactoEmergenciaNombre,
        _wizLiga.contactoEmergenciaCodigo,
        _wizLiga.contactoEmergenciaTel
      ].filter(Boolean).join(' '),
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

function wizLigaRecibirImagenRecortada(stateKey, base64DataUrl) {
  _wizLiga[stateKey] = base64DataUrl;
  const map = {
    'ligaImagenBase64': { previewId: 'wiz-liga-img-preview',  placeholderId: 'wiz-liga-img-placeholder',  inputId: 'wiz-liga-img-input'  },
    'logoBase64':       { previewId: 'wiz-liga-logo-preview', placeholderId: 'wiz-liga-logo-placeholder', inputId: 'wiz-liga-logo-input' },
    'fotoBase64':       { previewId: 'wiz-liga-foto-preview', placeholderId: 'wiz-liga-foto-placeholder', inputId: 'wiz-liga-foto-input' },
  };
  const ids = map[stateKey];
  if (!ids) return;
  const img         = document.getElementById(ids.previewId);
  const placeholder = document.getElementById(ids.placeholderId);
  const removeBtn   = document.getElementById(ids.inputId)?.parentElement?.querySelector('.wiz-remove-img');
  if (img) {
    img.src = base64DataUrl;
    img.classList.remove('wiz-hidden');
    img.style.opacity = '0';
    requestAnimationFrame(function() {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1';
      setTimeout(function() { img.style.transition = ''; }, 300);
    });
  }
  if (placeholder) placeholder.classList.add('wiz-hidden');
  if (removeBtn)   removeBtn.classList.add('wiz-remove-img--visible');
  if (stateKey === 'fotoBase64') {
    var overlay = document.getElementById('wiz-liga-foto-overlay');
    var hint    = document.getElementById('wiz-liga-foto-hint');
    if (overlay) overlay.classList.remove('wiz-hidden');
    if (hint)    { hint.innerHTML = '✨ <strong>¡Foto cargada con éxito!</strong> ✨'; hint.classList.add('reg-foto-hint-compliment'); }
  }
  // Actualizar botón OMITIR → CONTINUAR
  const contenido = document.getElementById('wiz-liga-contenido');
  if (contenido) wlOptBtn(contenido, true);
}
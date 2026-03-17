// ============================================================
//  QUINDES APP — app.js  (navegación por secciones)
// ============================================================

const CONFIG = {
  GAS_URL: 'https://black-snow-eff8.quindesvolcanicosrd.workers.dev',
  GOOGLE_CLIENT_ID: '190762038083-nlmie46eah0qq5kd5l86fiq3jteg2pr4.apps.googleusercontent.com',
};

let CURRENT_USER   = null;
let accessToken    = null;
let wizOrigen      = null; // 'login' | 'noEncontrado' — tracks where wizard was launched from
let fotoSubiendo   = false;
let cropper;

// Estado de edición por sección
const edicionActiva = {
  generales: false, personales: false, contacto: false,
  salud: false, rendimiento: false,
};

// ── SERVICE WORKER ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── DERBY LOADER ─────────────────────────────────────────────
const DERBY_MSGS = [
  'Cargando…',
  'Atando los patines…',
  'Calentando motores…',
  'Ajustando el casco…',
  'Entrando a la pista…',
];

let _derbyMsgTimer  = null;
let _derbyIconTimer = null;
let _derbyActiveIdx = 0;
const DERBY_ICON_COUNT = 4;

function _derbyNextIcon() {
  // Pick a random different index
  let next;
  do { next = Math.floor(Math.random() * DERBY_ICON_COUNT); }
  while (next === _derbyActiveIdx);

  // ── Phase 1: shrink current — all icons go small (the "pause") ──
  for (let i = 0; i < DERBY_ICON_COUNT; i++) {
    const ic = document.getElementById('di-' + i);
    if (ic) ic.classList.remove('di-active', 'di-near');
  }

  // ── Phase 2: after short pause, grow the next one ──
  const PAUSE = 110; // ms — the beat where everything is small
  _derbyIconTimer = setTimeout(() => {

    _derbyActiveIdx = next;
    const curr = document.getElementById('di-' + _derbyActiveIdx);
    if (curr) curr.classList.add('di-active');

    // Neighbors get pulled in
    const leftIdx  = (_derbyActiveIdx - 1 + DERBY_ICON_COUNT) % DERBY_ICON_COUNT;
    const rightIdx = (_derbyActiveIdx + 1) % DERBY_ICON_COUNT;
    const leftEl   = document.getElementById('di-' + leftIdx);
    const rightEl  = document.getElementById('di-' + rightIdx);
    if (leftEl)  leftEl.classList.add('di-near');
    if (rightEl) rightEl.classList.add('di-near');

    // Random hold 700–1500ms before next cycle
    const wait = 700 + Math.random() * 800;
    _derbyIconTimer = setTimeout(_derbyNextIcon, wait);

  }, PAUSE);
}

function iniciarDerbyLoader() {
  // Messages
  const el = document.getElementById('derby-loader-text');
  if (el) el.textContent = DERBY_MSGS[0];
  let idx = 0;
  _derbyMsgTimer = setInterval(() => {
    idx = (idx + 1) % DERBY_MSGS.length;
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => { if (el) { el.textContent = DERBY_MSGS[idx]; el.style.opacity = ''; } }, 300);
    }
  }, 2200);

  // Icons — start with index 0 active, neighbors pulled in
  _derbyActiveIdx = 0;
  for (let i = 0; i < DERBY_ICON_COUNT; i++) {
    const ic = document.getElementById('di-' + i);
    if (!ic) continue;
    ic.classList.remove('di-active','di-near');
    if (i === 0) ic.classList.add('di-active');
    if (i === 1 || i === DERBY_ICON_COUNT - 1) ic.classList.add('di-near');
  }
  // First switch after a short delay
  _derbyIconTimer = setTimeout(_derbyNextIcon, 900);
}

function detenerDerbyLoader() {
  clearInterval(_derbyMsgTimer);
  clearTimeout(_derbyIconTimer);
}

// Start derby loader immediately
document.addEventListener('DOMContentLoaded', () => {
  iniciarDerbyLoader();
  mostrarInstallBannerSiCorresponde();
});

// ── GOOGLE IDENTITY SERVICES ─────────────────────────────────
// Fix Google button flicker: fade in iframe once it loads
// Get Google button theme based on current color scheme
function getGoogleBtnTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'filled_black' : 'outline';
}

// Render a single Google button by id, with flicker prevention
function renderGoogleButton(id, text, suppressReveal) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.dataset.rendered === 'true') return;
  el.dataset.rendered = 'true';
  el.style.opacity = '0';
  const theme = getGoogleBtnTheme();
  google.accounts.id.renderButton(el, {
    theme, size: 'large', width: 300, text, logo_alignment: 'center',
  });
  if (suppressReveal) return; // caller handles the reveal
  // Fade in once the iframe loads
  const reveal = () => {
    el.style.transition = 'opacity 0.25s ease';
    el.style.opacity = '1';
  };
  const iframe = el.querySelector('iframe');
  if (iframe) {
    iframe.addEventListener('load', reveal, { once: true });
    setTimeout(reveal, 800);
  } else {
    const obs = new MutationObserver(() => {
      const f = el.querySelector('iframe');
      if (!f) return;
      obs.disconnect();
      f.addEventListener('load', reveal, { once: true });
      setTimeout(reveal, 800);
    });
    obs.observe(el, { childList: true, subtree: true });
  }
}

function fixGoogleButtonFlicker() {
  // Called once on init — buttons rendered on-demand when their screen shows
  // Listen for color scheme changes to re-render buttons
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    ['google-signin-btn', 'google-resignin-btn', 'wiz-google-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.innerHTML = ''; el.dataset.rendered = ''; }
    });
    // Re-render whichever button is currently visible
    const loginVisible = document.getElementById('loginScreen')?.style.display !== 'none';
    const noEncVisible = document.getElementById('noEncontradoScreen')?.style.display !== 'none';
    const wizVisible   = document.getElementById('wiz-step-0')?.style.display !== 'none';
    if (loginVisible) renderGoogleButton('google-signin-btn', 'signin_with');
    if (noEncVisible) renderGoogleButton('google-resignin-btn', 'signin_with');
    if (wizVisible)   renderGoogleButton('wiz-google-btn', 'continue_with');
  });
}

function initGoogleAuth() {
  fixGoogleButtonFlicker();
  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn,
    auto_select: false,
  });


  // Skip One Tap popup — use explicit login screen button only
  // Show login screen directly (safety net still applies if auto_select resolves)
  setTimeout(() => {
    const loading = document.getElementById('loadingScreen');
    if (loading && loading.style.display !== 'none') {
      mostrarLoginScreen();
    }
  }, 1200);

  // Pre-render the re-sign-in button early
  preRenderResigninButton();
}

function onGoogleSignIn(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  accessToken = response.credential;
  inicializarApp(payload.email);
}

function mostrarLoginScreen() {
  const loginScr = document.getElementById('loginScreen');

  // Render button hidden — it will fade in after 2s
  renderGoogleButton('google-signin-btn', 'signin_with', true);

  // Show login screen immediately
  detenerDerbyLoader();
  document.getElementById('loadingScreen').style.display = 'none';
  loginScr.style.opacity    = '0';
  loginScr.style.display    = 'flex';
  setTimeout(() => {
    loginScr.style.transition = 'opacity 0.3s ease';
    loginScr.style.opacity    = '1';
    setTimeout(() => { loginScr.style.transition = ''; }, 310);
  }, 60);

  // Fade in the Google button after 1s (hides the render glitch)
  const btn = document.getElementById('google-signin-btn');
  if (btn) {
    btn.style.opacity    = '0';
    btn.style.transition = 'none';
    setTimeout(() => {
      btn.style.transition = 'opacity 0.4s ease';
      btn.style.opacity    = '1';
    }, 1000);
  }
}

// ── API ───────────────────────────────────────────────────────
async function gasCall(action, data = {}) {
  let res;

  if (action === 'subirArchivo') {
    // POST with JSON body — base64 is too large for URL query params
    const params = new URLSearchParams({ action, token: accessToken });
    const url = CONFIG.GAS_URL + '?' + params.toString();
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoArchivo: data.tipoArchivo,
        base64Data:  data.base64Data,
        email:       data.email,
      }),
      redirect: 'follow',
    });
  } else {
    const params = new URLSearchParams({ action, token: accessToken });
    if (action === 'updateMyProfile') {
      params.set('rowNumber', data.rowNumber);
      // Let URLSearchParams handle encoding — don't double-encode
      params.set('data', JSON.stringify(data.data));
    } else {
      Object.entries(data).forEach(([k, v]) => params.set(k, v));
    }
    const url = CONFIG.GAS_URL + '?' + params.toString();
    res = await fetch(url, { redirect: 'follow' });
  }

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta inválida: ' + text.substring(0, 200)); }
  if (json.error) throw new Error(json.error);
  return json;
}

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

    // Si venía del flujo "Crear mi perfil" pero la cuenta ya existe — mostrar mensaje
    if (wizOrigen === 'login') {
      wizOrigen = null;
      window._registroDesdeLogin = false;
      detenerDerbyLoader();
      document.getElementById('loadingScreen').style.display = 'none';
      mostrarCuentaYaRegistrada(email, user);
      return;
    }

    CURRENT_USER = user;
    document.getElementById('user-email').textContent = user.email;

    const profile = await gasCall('getMyProfile', { rowNumber: user.rowNumber });
    window.myProfile = profile;

    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();

    detenerDerbyLoader();
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('appContent').style.display    = 'block';

  } catch (err) {
    console.error(err);
    detenerDerbyLoader();
    document.getElementById('loadingScreen').style.display = 'none';
    mostrarLoginScreen();
  }
}


// ── REGISTRO DESDE LOGIN ──────────────────────────────────────
function mostrarCuentaYaRegistrada(email, user) {
  // Show a friendly screen when user tries to "create" but already has an account
  const overlay = document.createElement('div');
  overlay.id = 'ya-registrada-screen';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);padding:32px;';

  // Reuse login-bg rings
  overlay.innerHTML = `
    <div class="login-bg" style="display:block;">
      <span class="login-bg-ring login-bg-ring-1"></span>
      <span class="login-bg-ring login-bg-ring-2"></span>
    </div>
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:0;width:100%;max-width:360px;text-align:center;">
      <div style="font-size:52px;margin-bottom:16px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.1s both;">🛼</div>
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0 0 10px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.2s both;">¡Ya tienes una cuenta!</h2>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 8px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.3s both;">
        La cuenta <strong style="color:var(--text);">${email}</strong> ya está registrada en el equipo.
      </p>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 28px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.35s both;">
        Ingresando con tu cuenta…
      </p>
      <div style="animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.45s both;width:100%;">
        <div class="derby-loader" style="margin:0 auto 24px;">
          <div class="derby-icons">
            <span class="derby-icon">🛼</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // After 2s continue loading the app normally
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      // Now load the app with the found user
      CURRENT_USER = user;
      document.getElementById('loadingScreen').style.display = 'flex';
      iniciarDerbyLoader();
      gasCall('getMyProfile', { rowNumber: user.rowNumber }).then(profile => {
        window.myProfile = profile;
        configurarTodasLasSubidas();
        renderTodo(profile);
        aplicarPermisos();
        detenerDerbyLoader();
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('appContent').style.display    = 'block';
        document.getElementById('user-email').textContent = user.email;
      }).catch(err => {
        console.error(err);
        mostrarLoginScreen();
      });
    }, 300);
  }, 2200);
}

function mostrarRegistroDesdeLogin() {
  window._registroDesdeLogin = true;
  wizOrigen = 'login';
  // Show registroScreen with step-0 (Google login step)
  document.getElementById('loginScreen').style.display    = 'none';
  document.getElementById('registroScreen').style.display = 'flex';
  document.getElementById('wiz-intro').style.display      = 'none';
  document.getElementById('wiz-step-0').style.display     = 'flex';
  document.getElementById('wiz-header').style.display     = 'none';
  document.getElementById('wiz-viewport').style.display   = 'none';

  // Render Google button — reset if already rendered to clear cached account
  requestAnimationFrame(() => {
    const wrap = document.getElementById('wiz-google-btn');
    if (wrap) {
      // Always reset to clear any previously selected Google account
      resetGoogleButton('wiz-google-btn', 'continue_with');
    }
  });

  // Add create-Google-account link as a separate line below the note
  const note = document.querySelector('.wiz-step0-note');
  if (note && !note.querySelector('a')) {
    const link = document.createElement('a');
    link.href = 'https://accounts.google.com/signup';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Crear cuenta de Google';
    link.style.cssText = 'display:block;margin-top:8px;color:var(--accent);font-weight:700;font-size:13px;text-decoration:underline;';
    note.appendChild(link);
  }

  // Push history state so back gesture returns to login
  history.pushState({ wizStep0: true }, '');
}

function resetGoogleButton(id, text) {
  // Clear Google cached selection and re-render the button fresh
  try { google.accounts.id.disableAutoSelect(); } catch(e) {}
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  el.dataset.rendered = '';
  el.style.opacity = '0';
  renderGoogleButton(id, text, true);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity    = '1';
  }, 600);
}

function wizStep0Volver() {
  document.getElementById('registroScreen').style.display = 'none';
  document.getElementById('wiz-step-0').style.display     = 'none';
  window._registroDesdeLogin = false;
  wizOrigen = null;
  mostrarLoginScreen();
}

function wizIntroVolver() {
  if (wizOrigen === 'login') {
    document.getElementById('wiz-intro').style.display  = 'none';
    document.getElementById('wiz-step-0').style.display = 'flex';
  } else if (wizOrigen === 'noEncontrado') {
    document.getElementById('registroScreen').style.display     = 'none';
    document.getElementById('noEncontradoScreen').style.display = 'flex';
  } else {
    // Default: go back to main login screen
    document.getElementById('registroScreen').style.display = 'none';
    mostrarLoginScreen();
  }
}

// ── NO ENCONTRADO ─────────────────────────────────────────────

// Called once on app init to pre-render the Google button before the screen is shown
function preRenderResigninButton() {
  const container = document.getElementById('google-resignin-btn');
  if (!container || container.dataset.rendered === 'true') return;
  renderGoogleButton('google-resignin-btn', 'signin_with');
}

function mostrarNoEncontrado(email) {
  // If user came from "Crear mi perfil" on login screen, go straight to wizard
  if (window._registroDesdeLogin) {
    window._registroDesdeLogin = false;
    wizOrigen = 'login';
    mostrarRegistroWizard();
    return;
  }
  const el = document.getElementById('no-enc-email');
  if (el) el.textContent = email || '';

  // Wire button before showing screen
  document.getElementById('btn-ir-registro').onclick = () => {
    wizOrigen = 'noEncontrado';
    document.getElementById('noEncontradoScreen').style.display = 'none';
    mostrarRegistroWizard();
  };

  // Reset the button to clear any previously selected Google account
  resetGoogleButton('google-resignin-btn', 'signin_with');

  // Show screen immediately
  const screen = document.getElementById('noEncontradoScreen');
  screen.style.opacity = '0';
  screen.style.display = 'flex';
  requestAnimationFrame(() => {
    screen.style.transition = 'opacity 0.3s ease';
    screen.style.opacity    = '1';
    setTimeout(() => { screen.style.transition = ''; }, 310);
  });

  // Fade in Google button after 1s — same as login screen
  const resignBtn = document.getElementById('google-resignin-btn');
  if (resignBtn) {
    resignBtn.style.opacity    = '0';
    resignBtn.style.transition = 'none';
    setTimeout(() => {
      resignBtn.style.transition = 'opacity 0.4s ease';
      resignBtn.style.opacity    = '1';
    }, 1000);
  }

  // Push sentinel so back gesture is absorbed, not passed to OS
  pushSentinel();
}

// ── WIZARD DE REGISTRO ────────────────────────────────────────

const REG_PAISES  = ['Ecuador','Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba','El Salvador','Guatemala','Honduras','México','Nicaragua','Panamá','Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela','Canadá','Estados Unidos','Alemania','Francia','España','Italia','Reino Unido','Portugal','Suiza','Países Bajos','Suecia','Rusia','China','Japón','Corea del Sur','India','Israel','Emiratos Árabes Unidos','Arabia Saudita','Australia','Sudáfrica','Nigeria'];
const REG_CODIGOS = ['🇪🇨 +593','🇦🇷 +54','🇧🇴 +591','🇧🇷 +55','🇨🇱 +56','🇨🇴 +57','🇨🇷 +506','🇨🇺 +53','🇸🇻 +503','🇬🇹 +502','🇭🇳 +504','🇲🇽 +52','🇳🇮 +505','🇵🇦 +507','🇵🇾 +595','🇵🇪 +51','🇵🇷 +1','🇩🇴 +1','🇺🇾 +598','🇻🇪 +58','🇨🇦 +1','🇺🇸 +1','🇩🇪 +49','🇫🇷 +33','🇪🇸 +34','🇮🇹 +39','🇬🇧 +44','🇵🇹 +351','🇨🇭 +41','🇳🇱 +31','🇸🇪 +46','🇷🇺 +7','🇨🇳 +86','🇯🇵 +81','🇰🇷 +82','🇮🇳 +91','🇮🇱 +972','🇦🇪 +971','🇸🇦 +966','🇦🇺 +61','🇿🇦 +27','🇳🇬 +234'];
const REG_PRONOMBRES = ['Él', 'Ella', 'Elle', 'No definido'];
const REG_ROLES      = ['Jammer', 'Bloquer', 'Blammer', 'Ref', 'Coach', 'Bench', 'No definido'];
const REG_ROLES_JUG  = ['Jammer', 'Bloquer', 'Blammer', 'No definido'];
const REG_ASISTENCIA = ['1 vez', '2 veces', '3 o más veces'];

const WIZ_STEPS_BASE = [1,2,3,4,5,6,7,8,10,11];
let wizStepSequence = [...WIZ_STEPS_BASE];
let wizStep = 1;
let cropTarget = 'app';

const regData = {
  nombre:'', pronombres:[], pais:'', codigoPais:'',
  telefono:'', fechaNacimiento:'', mostrarCumple:'', mostrarEdad:'',
  nombreDerby:'', numero:'', rolJugadorx:'', asisteSemana:'',
  alergias:'', dieta:'', contactoEmergencia:'', fotoBase64:null,
};

function esJugadorx(rol) { return REG_ROLES_JUG.includes(rol); }

function wizRecalcSequence() {
  wizStepSequence = esJugadorx(regData.rolJugadorx)
    ? [1,2,3,4,5,6,7,8,9,10,11]
    : [1,2,3,4,5,6,7,8,10,11];
}

function wizPositionInSequence() { return wizStepSequence.indexOf(wizStep) + 1; }

function mostrarRegistroWizard() {
  wizStep = 1;
  if (!wizOrigen) wizOrigen = 'login'; // fallback
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

  for (let i = 1; i <= 11; i++) {
    const s = document.getElementById('wiz-step-' + i);
    if (!s) continue;
    s.classList.remove('wiz-active');
    s.style.transition = s.style.transform = s.style.visibility = '';
  }

  document.getElementById('registroScreen').style.display = 'flex';

  // Hide step-0 (login screen for new users) if it was showing
  const step0 = document.getElementById('wiz-step-0');
  if (step0) step0.style.display = 'none';

  // Show intro, hide header+viewport until user taps Comenzar
  const introEl   = document.getElementById('wiz-intro');
  const headerEl  = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');
  if (introEl)    introEl.style.display    = 'flex';
  if (headerEl)   headerEl.style.display   = 'none';
  if (viewportEl) viewportEl.style.display = 'none';

  history.pushState({ wizSentinel: true }, '', location.pathname + '#_wiz');
}

// Called by "Comenzar" button on intro screen
function wizIntroStart() {
  const introEl    = document.getElementById('wiz-intro');
  const headerEl   = document.getElementById('wiz-header');
  const viewportEl = document.getElementById('wiz-viewport');

  // Slide intro out upward
  if (introEl) {
    introEl.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    introEl.style.opacity    = '0';
    introEl.style.transform  = 'translateY(-24px)';
    setTimeout(() => {
      introEl.style.display = 'none';
      introEl.style.transition = introEl.style.transform = introEl.style.opacity = '';
    }, 310);
  }

  // Show header + viewport
  setTimeout(() => {
    if (headerEl)   headerEl.style.display   = 'flex';
    if (viewportEl) viewportEl.style.display = 'block';
    wizUpdateHeader();
    const s1 = document.getElementById('wiz-step-1');
    if (s1) {
      s1.classList.remove('wiz-animate');
      s1.classList.add('wiz-active');
      // Let the browser render the active state first, then animate content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          s1.classList.add('wiz-animate');
        });
      });
    }
  }, 200);
}

function wizSetVal(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function wizOnRolSelected(val) {
  regData.rolJugadorx = val;
  regRenderChips('reg-rol-chips', REG_ROLES, val, wizOnRolSelected);
  wizRecalcSequence();
  wizUpdateHeader(); // update total count when sequence changes
}

function wizGoTo(next, forward = true) {
  const DURATION = 280;
  const prevEl = document.getElementById('wiz-step-' + wizStep);
  const nextEl = document.getElementById('wiz-step-' + next);
  if (!nextEl) return;

  // Cancel any in-flight cleanup on prevEl from a previous transition
  if (prevEl && prevEl._wizCleanup) {
    clearTimeout(prevEl._wizCleanup);
    prevEl._wizCleanup = null;
    // Make sure prev is fully off-screen before we start
    prevEl.classList.remove('wiz-active');
    prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
  }

  // Position next step off-screen instantly (no transition yet)
  nextEl.style.transition = 'none';
  nextEl.style.transform  = forward ? 'translateX(105%)' : 'translateX(-30%)';
  // Make visible so transform is meaningful (CSS default is visibility:hidden)
  nextEl.style.visibility = 'visible';
  nextEl.classList.add('wiz-active');

  requestAnimationFrame(() => {
    const ease = `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1)`;

    // Slide previous step out
    if (prevEl) {
      prevEl.style.transition = ease;
      prevEl.style.transform  = forward ? 'translateX(-30%)' : 'translateX(105%)';
      // Use setTimeout as guaranteed cleanup — transitionend can be skipped
      // if user taps quickly or browser throttles
      prevEl._wizCleanup = setTimeout(() => {
        prevEl._wizCleanup = null;
        prevEl.classList.remove('wiz-active');
        prevEl.style.visibility = prevEl.style.transition = prevEl.style.transform = '';
      }, DURATION + 20);
    }

    // Slide next step in
    nextEl.style.transition = ease;
    nextEl.style.transform  = 'translateX(0)';

    // Fire content fade-in after slide completes
    setTimeout(() => {
      nextEl.classList.add('wiz-animate');
    }, DURATION + 10);

    // Focus inputs
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

function wizNext() {
  wizHideError();

  if (wizStep === 2) {
    const val = document.getElementById('reg-nombre')?.value.trim();
    if (!val) { wizShowError('Escribe cómo quieres que te llamemos ✍️'); return; }
    regData.nombre = val;
  }
  if (wizStep === 4 && !regData.pais) {
    wizShowError('Selecciona tu país de origen 🌎'); return;
  }
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
  if (wizStep === 8 && !regData.rolJugadorx) {
    wizShowError('Selecciona tu rol en el equipo 🏅'); return;
  }
  if (wizStep === 9 && !regData.asisteSemana) {
    wizShowError('Indica cuántas veces entrenas por semana 🏋️'); return;
  }
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
    // Back from step 1 → show intro screen again
    const introEl    = document.getElementById('wiz-intro');
    const headerEl   = document.getElementById('wiz-header');
    const viewportEl = document.getElementById('wiz-viewport');
    // Hide steps
    const s1 = document.getElementById('wiz-step-1');
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
  // Show compliment text + sparkles
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

// ── Confetti ─────────────────────────────────────────────────
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

// ── Welcome dialog ────────────────────────────────────────────
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
    const params = new URLSearchParams({ action: 'registrarUsuario', token: accessToken });
    const res = await fetch(CONFIG.GAS_URL + '?' + params.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: regData.nombre.trim(), pronombres: Array.isArray(regData.pronombres) ? regData.pronombres.join(', ') : (regData.pronombres || ''),
        pais: regData.pais, codigoPais: regData.codigoPais,
        telefono: regData.telefono.trim(), fechaNacimiento: regData.fechaNacimiento,
        mostrarCumple: regData.mostrarCumple, mostrarEdad: regData.mostrarEdad,
        nombreDerby: regData.nombreDerby, numero: regData.numero,
        rolJugadorx: regData.rolJugadorx, asisteSemana: regData.asisteSemana,
        alergias: regData.alergias, dieta: regData.dieta,
        contactoEmergencia: regData.contactoEmergencia,
        fotoBase64: regData.fotoBase64 || null,
      }),
      redirect: 'follow',
    });
    const json = JSON.parse(await res.text());
    if (json.error) throw new Error(json.error);

    CURRENT_USER = { found: true, rowNumber: json.rowNumber, email: json.email, rolApp: 'Invitado' };
    document.getElementById('user-email').textContent = json.email;

    // Photo URL returned directly from registrarUsuario (uploaded atomically in GAS)
    const profile = await gasCall('getMyProfile', { rowNumber: json.rowNumber });
    if (json.fotoUrl) {
      profile.fotoPerfil = json.fotoUrl;
    }
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    wizOcultarCargando();
    document.getElementById('registroScreen').style.display = 'none';
    document.getElementById('appContent').style.display    = 'block';
    // First-time welcome
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


// ── RENDER COMPLETO ───────────────────────────────────────────
function renderTodo(profile) {
  if (!profile) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

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
  set('p-email',              profile.email ? profile.email.replace(/@gmail\.com$/, '') : '');
  set('p-mostrarCumple',      profile.mostrarCumple);
  set('p-mostrarEdad',        profile.mostrarEdad);
  set('p-tipoUsuario',        profile.tipoUsuario);
  set('p-fechaNacimiento',    profile.fechaNacimiento);
  initFechaTrigger();
  set('p-contactoEmergencia', profile.contactoEmergencia);

  // Stats
  const mesEl  = document.getElementById('p-puntosMes');
  const mesLbl = document.getElementById('label-puntosMes');
  if (mesEl)  mesEl.textContent  = profile.puntosMes || '—';
  if (mesLbl) mesLbl.textContent = 'Mes de ' + (profile.labelMes || '');
  const trimEl  = document.getElementById('p-puntosTrim');
  const trimLbl = document.getElementById('label-puntosTrim');
  if (trimEl)  trimEl.textContent  = profile.puntosTrimestre || '—';
  if (trimLbl) trimLbl.textContent = profile.labelTrimestre  || 'Trimestre';
  const anioEl  = document.getElementById('p-puntosAnio');
  const anioLbl = document.getElementById('label-puntosAnio');
  if (anioEl)  anioEl.textContent  = profile.puntosAnio || '—';
  if (anioLbl) anioLbl.textContent = 'Año ' + (profile.labelAnio || '');

  // Hero
  const heroNombre = document.getElementById('hero-nombre-derby');
  if (heroNombre) heroNombre.textContent = profile.nombreDerby || '—';
  const heroSub = document.getElementById('hero-sub');
  if (heroSub) heroSub.textContent = (profile.numero ? '#' + profile.numero : '—') + ' · ' + (profile.rolJugadorx || '—');
  const heroRol = document.getElementById('hero-rol');
  if (heroRol) heroRol.textContent = profile.rolJugadorx || '—';
  const heroPron = document.getElementById('hero-pronombres');
  if (heroPron) heroPron.textContent = profile.pronombres || '—';

  // Subtítulos de las filas del menú
  actualizarSubtitulos(profile);

  // Foto
  renderFotoPerfil(normalizarDriveUrl(profile.fotoPerfil));
  // Foto en sección generales
  const secImg = document.getElementById('sec-img-foto');
  if (secImg) {
    const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#2b2b2b"/></svg>');
    secImg.src = normalizarDriveUrl(profile.fotoPerfil) || placeholder;
  }

  // Selects, chips, toggles
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id     = 'p-' + key;
    const config = CHIPS_OPTIONS[key];
    const valor  = profile[key] || '';
    if (config.ui === 'chips')       habilitarChips(id, valor);
    if (config.ui === 'multiselect') habilitarMultiSelect(id, valor);
    if (config.ui === 'select')      habilitarSelect(id, valor);
    if (config.ui === 'toggle')      habilitarToggle(id, valor);
  });

  // Archivos
  renderEstadoArchivo('adjPruebaFisica', profile.adjPruebaFisica);
  renderEstadoArchivo('adjCedula',       profile.adjCedula);

  // Email width
  ajustarAnchoEmail();
}

function actualizarSubtitulos(profile) {
  const sub = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  sub('sub-generales',   [profile.nombreDerby, profile.numero ? '#'+profile.numero : null, profile.rolJugadorx].filter(Boolean).join(' · ') || 'Nombre Derby, Número, Rol');
  sub('sub-personales',  [profile.cedulaPasaporte, profile.pais, profile.fechaNacimiento].filter(Boolean).join(' · ') || 'Documento, Nacionalidad');
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

// ── NAVEGACIÓN ────────────────────────────────────────────────
let vistaActual = 'home';

function navegarSeccion(seccion) {
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
  dest.addEventListener('transitionend', () => {
    home.classList.remove('slide-out');
    home.style.display = 'none';
  }, { once: true });

  vistaActual = seccion;
  // No history manipulation needed — sentinel handles back gesture globally
}

function volverHome(fromPopState = false) {
  // Cancelar edición si está activa
  if (edicionActiva[vistaActual]) {
    cancelarEdicionSeccion(vistaActual);
  }

  const home = document.getElementById('view-home');
  const curr = document.getElementById('view-' + vistaActual);
  if (!curr) return;

  home.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      home.classList.add('active');
      curr.classList.remove('active');
    });
  });
  curr.addEventListener('transitionend', () => {
    curr.style.display = 'none';
  }, { once: true });

  vistaActual = 'home';

  // Clean up hash from URL
  if (!fromPopState) {
    history.replaceState({ seccion: 'home' }, '', location.pathname);
  }
}

// ── Handle browser back gesture / button ──────────────────────
// Strategy: always keep 2 history entries when at home so the OS back
// gesture hits our popstate handler instead of closing the app/tab.
//
// Stack looks like:
//   [entry-A: home]  ← current when at home (replaceState)
//   [entry-B: home]  ← one behind it (pushState on load)
//
// When in a section: [entry-A: home] [entry-B: section]
// Back gesture pops entry-B → popstate fires → we call volverHome()
// then pushState to restore the buffer entry.

// ── BACK GESTURE TRAP ────────────────────────────────────────
// Strategy: keep a sentinel entry AHEAD of current position.
// On popstate we immediately go(+1) to undo the pop, then handle
// in-app navigation ourselves. Works on Android & iOS PWA.

function pushSentinel() {
  history.pushState({ sentinel: true }, '', location.pathname + '#_');
}

window.addEventListener('popstate', (e) => {
  // Immediately reverse the back navigation so we stay in the PWA
  history.go(1);

  // Wizard open? handle wizard back
  const regScr = document.getElementById('registroScreen');
  if (regScr && regScr.style.display !== 'none') {
    // Step-0 (login para registro)? volver al login principal
    const step0 = document.getElementById('wiz-step-0');
    if (step0 && step0.style.display !== 'none') {
      wizStep0Volver();
      return;
    }
    wizBack();
    return;
  }

  // noEncontrado screen? go back to login
  const noEncScr = document.getElementById('noEncontradoScreen');
  if (noEncScr && noEncScr.style.display !== 'none') {
    noEncScr.style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    return;
  }

  // In-app section? go back to home
  if (vistaActual && vistaActual !== 'home') {
    volverHome(true);
    return;
  }
  // Already at home — silently absorbed, app stays open
});

// ── Block body scroll/bounce on mobile (iOS rubber-band + Android overscroll) ──
document.addEventListener('touchmove', (e) => {
  let el = e.target;
  let scrollable = false;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll = overflowY === 'auto' || overflowY === 'scroll';
    if (canScroll) {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1; // +1 for rounding
      const notAtTop    = el.scrollTop > 0;
      const notAtBottom = el.scrollTop < el.scrollHeight - el.clientHeight - 1;
      // Allow scroll only if there's real overflow AND we're not already at the boundary
      if (hasOverflow && (notAtTop || notAtBottom)) {
        scrollable = true;
        break;
      }
    }
    el = el.parentElement;
  }
  if (!scrollable) e.preventDefault();
}, { passive: false });

window.addEventListener('DOMContentLoaded', () => {
  // Base entry (no hash)
  history.replaceState({ base: true }, '', location.pathname);
  // Sentinel entry ahead — this is what gets popped on back gesture
  pushSentinel();
  // Registro form listeners
  initRegistroListeners();
});

// ── EDICIÓN POR SECCIÓN ───────────────────────────────────────
// Campos por sección
const CAMPOS_SECCION = {
  generales:   ['p-nombreDerby','p-numero','p-rolJugadorx','p-nombre','p-pronombres'],
  personales:  ['p-nombreCivil','p-cedulaPasaporte','p-pais','p-fechaNacimiento','p-mostrarCumple','p-mostrarEdad','p-adjCedula'],
  contacto:    ['p-email','p-codigoPais','p-telefono'],
  salud:       ['p-contactoEmergencia','p-grupoSanguineo','p-alergias','p-dieta','p-aptoDeporte','p-adjPruebaFisica'],
  rendimiento: ['p-estado','p-asisteSemana','p-pruebaFisica','p-tipoUsuario','p-pagaCuota'],
};

// Campos que solo Admin puede editar
const SOLO_ADMIN = ['p-nombreCivil','p-nombre','p-estado','p-asisteSemana','p-pruebaFisica','p-aptoDeporte','p-tipoUsuario','p-email'];

function toggleEdicionSeccion(seccion) {
  if (edicionActiva[seccion]) {
    cancelarEdicionSeccion(seccion);
  } else {
    activarEdicionSeccion(seccion);
  }
}

function activarEdicionSeccion(seccion) {
  edicionActiva[seccion] = true;
  const view = document.getElementById('view-' + seccion);
  view.classList.add('is-editing');

  const role = CURRENT_USER.rolApp;
  CAMPOS_SECCION[seccion].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const soloAdmin = SOLO_ADMIN.includes(id);
    if (soloAdmin && role !== 'Admin') return;
    el.disabled = false;
    el.hidden   = false;
  });
  // Enable date picker trigger if in personales section
  if (seccion === 'personales') {
    const dt = document.querySelector('#view-personales .date-picker-trigger');
    if (dt) dt.disabled = false;
  }

  // Re-render widgets en modo edición
  Object.keys(CHIPS_OPTIONS).forEach(key => {
    const id = 'p-' + key;
    if (!CAMPOS_SECCION[seccion].includes(id)) return;
    const config = CHIPS_OPTIONS[key];
    const valor  = document.getElementById(id)?.value || window.myProfile[key] || '';
    if (config.ui === 'chips')       habilitarChips(id, valor);
    if (config.ui === 'multiselect') habilitarMultiSelect(id, valor);
    if (config.ui === 'select')      habilitarSelect(id, valor);
    if (config.ui === 'toggle')      habilitarToggle(id, valor);
  });

  // Avatar editable en sección generales
  if (seccion === 'generales') setSecAvatarEditable(true);

  // Mostrar flechas de select
  mostrarFlechasSelect(seccion, true);

  // Animate header action row in
  const actionsRow = document.getElementById('header-actions-' + seccion);
  if (actionsRow) {
    actionsRow.style.display = 'flex';
    requestAnimationFrame(() => actionsRow.classList.add('visible'));
  }
}

function cancelarEdicionSeccion(seccion) {
  edicionActiva[seccion] = false;
  const view = document.getElementById('view-' + seccion);
  view.classList.remove('is-editing');

  // Re-render con datos originales
  renderTodo(window.myProfile);

  // Deshabilitar inputs
  CAMPOS_SECCION[seccion].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  // Disable date picker trigger
  if (seccion === 'personales') {
    const dt = document.querySelector('#view-personales .date-picker-trigger');
    if (dt) { dt.disabled = true; dt.textContent = document.getElementById('p-fechaNacimiento')?.value || '—'; }
  }

  if (seccion === 'generales') setSecAvatarEditable(false);
  mostrarFlechasSelect(seccion, false);

  // Animate header action row out
  const actionsRow = document.getElementById('header-actions-' + seccion);
  if (actionsRow) {
    actionsRow.classList.remove('visible');
    setTimeout(() => { actionsRow.style.display = 'none'; }, 280);
  }
}

async function guardarSeccion(seccion) {
  const errorBox = document.getElementById('error-' + seccion);
  if (errorBox) errorBox.style.display = 'none';

  if (fotoSubiendo) {
    if (errorBox) { errorBox.textContent = 'Esperando que la foto termine de subir...'; errorBox.style.display = 'block'; }
    await new Promise(resolve => {
      const iv = setInterval(() => { if (!fotoSubiendo) { clearInterval(iv); resolve(); } }, 100);
    });
    if (errorBox) errorBox.style.display = 'none';
  }

  const btnSave = document.getElementById('btn-hsave-' + seccion);
  if (btnSave) { btnSave.disabled = true; btnSave.textContent = '…'; }

  const v = id => document.getElementById(id)?.value || '';
  const datos = recogerTodosLosDatos();

  try {
    await gasCall('updateMyProfile', {
      rowNumber: CURRENT_USER.rowNumber,
      data: datos,
    });
    Object.assign(window.myProfile, datos);
    renderTodo(window.myProfile);
    cancelarEdicionSeccion(seccion);
  } catch (err) {
    if (errorBox) { errorBox.textContent = err.message || 'Error al guardar'; errorBox.style.display = 'block'; }
  } finally {
    if (btnSave) { btnSave.disabled = false; btnSave.textContent = 'Guardar'; }
  }
}

function recogerTodosLosDatos() {
  const v = id => document.getElementById(id)?.value || '';
  return {
    nombreDerby:        v('p-nombreDerby'),
    nombre:             v('p-nombre'),
    nombreCivil:        v('p-nombreCivil'),
    cedulaPasaporte:    v('p-cedulaPasaporte'),
    numero:             v('p-numero'),
    pronombres:         v('p-pronombres'),
    estado:             v('p-estado'),
    rolJugadorx:        v('p-rolJugadorx'),
    pagaCuota:          v('p-pagaCuota'),
    alergias:           v('p-alergias'),
    dieta:              v('p-dieta'),
    pais:               v('p-pais'),
    codigoPais:         v('p-codigoPais'),
    telefono:           v('p-telefono'),
    grupoSanguineo:     v('p-grupoSanguineo'),
    fechaNacimiento:    v('p-fechaNacimiento'),
    contactoEmergencia: v('p-contactoEmergencia'),
    mostrarCumple:      v('p-mostrarCumple'),
    mostrarEdad:        v('p-mostrarEdad'),
    email:              v('p-email').trim() + '@gmail.com',
    asisteSemana:       v('p-asisteSemana'),
    pruebaFisica:       v('p-pruebaFisica'),
    aptoDeporte:        v('p-aptoDeporte'),
    tipoUsuario:        v('p-tipoUsuario'),
    fotoPerfil:         window.myProfile.fotoPerfil,
    adjCedula:          window.myProfile.adjCedula,
    adjPruebaFisica:    window.myProfile.adjPruebaFisica,
  };
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

// ── PERMISOS ──────────────────────────────────────────────────
function aplicarPermisos() {
  const role = CURRENT_USER.rolApp;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    const matches = roles.includes(role);
    // Preserve display type
    if (!matches) el.style.display = 'none';
    else if (el.style.display === 'none') el.style.display = '';
  });
  // Ocultar fila rendimiento si no corresponde
  const rowRend = document.getElementById('row-rendimiento');
  if (rowRend) rowRend.style.display = (role === 'Admin' || role === 'SemiAdmin') ? 'flex' : 'none';
}

// ── CHIPS Y SELECTS ───────────────────────────────────────────
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

// Determina si alguna sección está en modo edición para este campo
function isEditing(id) {
  const seccion = Object.keys(CAMPOS_SECCION).find(s => CAMPOS_SECCION[s].includes(id));
  return seccion ? edicionActiva[seccion] : false;
}

function habilitarChips(id, valorInicial = '') {
  const input = document.getElementById(id);
  if (!input) return;
  const key    = id.replace(/^p-/, '');
  const config = CHIPS_OPTIONS[key];
  if (!config) return;
  input.style.display = 'none';
  const editing = isEditing(id);

  // Buscar o crear wrapper en sec-row-body o directamente en parentNode
  const container = input.closest('.sec-row-body') || input.parentNode;
  let wrapper = container.querySelector('.chip-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'chip-wrapper';
    input.parentNode.insertBefore(wrapper, input.nextSibling);
  }
  wrapper.innerHTML = '';
  const selected = new Set(
    valorInicial ? valorInicial.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  config.options.forEach(opt => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = opt;
    chip.className = 'chip ' + (selected.has(opt) ? 'chip-active' : 'chip-inactive');
    if (!editing) chip.classList.add('opacity-50');
    chip.addEventListener('click', () => {
      if (!isEditing(id)) return;
      if (config.multi) { selected.has(opt) ? selected.delete(opt) : selected.add(opt); }
      else              { selected.clear(); selected.add(opt); }
      input.value = Array.from(selected).join(',');
      Array.from(wrapper.children).forEach(c => {
        c.className = 'chip ' + (selected.has(c.textContent) ? 'chip-active' : 'chip-inactive');
      });
    });
    wrapper.appendChild(chip);
  });
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

  // Remove old trigger if exists
  const oldTrigger = container.querySelector('.multiselect-trigger');
  if (oldTrigger) oldTrigger.remove();

  // Build display value
  const selected = new Set(
    valorInicial ? valorInicial.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  const displayVal = selected.size > 0 ? Array.from(selected).join(', ') : '—';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'multiselect-trigger sec-input' + (editing ? ' multiselect-editable' : '');
  trigger.disabled = !editing;

  // Show value + chevron when editing
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
  // Remove existing
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

  // Label: buscar en sec-row-label o en label
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
  const editing = isEditing(id);

  // Buscar contenedor (sec-row-toggle o profile-field-toggle)
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
  btn.disabled = !editing;
  btn.addEventListener('click', () => {
    if (!isEditing(id)) return;
    const on = btn.classList.contains('toggle-off');
    btn.classList.toggle('toggle-on', on);
    btn.classList.toggle('toggle-off', !on);
    btn.setAttribute('aria-pressed', on);
    input.value = on ? 'Sí' : 'No';
  });
}

// ── BOTTOM SHEET (selector modal centrado) ────────────────────
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

function abrirBottomSheet(label, options, valorActual, onSelect) {
  if (_bsClosing) return; // still closing, ignore this tap
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
    const filtradas = options.filter(o => o.toLowerCase().includes(filtro.toLowerCase()));
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

let _bsClosing = false; // guard against immediate reopen after close

function cerrarBottomSheet() {
  const overlay = document.getElementById('bs-overlay');
  const panel   = document.getElementById('bs-panel');
  if (!overlay || !panel) return;
  // Kill pointer-events immediately so taps below work right away
  overlay.style.pointerEvents = 'none';
  panel.style.pointerEvents   = 'none';
  overlay.classList.remove('active');
  panel.classList.remove('active');
  document.body.style.overflow = '';
  const reg = document.getElementById('registroScreen');
  if (reg) reg.style.overflowY = '';
  // Block reopening for 400ms — prevents the closing tap from firing the button below
  _bsClosing = true;
  setTimeout(() => { _bsClosing = false; }, 400);
}

// ── ARCHIVOS ──────────────────────────────────────────────────
function configurarTodasLasSubidas() {
  configurarUpload('p-adjPruebaFisica', 'prueba', 'adjPruebaFisica');
  configurarUpload('p-adjCedula',       'cedula', 'adjCedula');
  configurarUpload('p-fotoPerfil',      'foto',   'fotoPerfil');
}

function configurarUpload(inputId, tipoArchivo, campoDestino) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Fully reset input by replacing with fresh element (not cloneNode which can carry file state)
  const nuevoInput = document.createElement('input');
  nuevoInput.type   = 'file';
  nuevoInput.id     = inputId;
  nuevoInput.accept = 'image/*';
  nuevoInput.style.display = 'none';
  input.parentNode.replaceChild(nuevoInput, input);
  let inputReal = nuevoInput;
  inputReal.addEventListener('click', () => { inputReal.value = ''; });

  const btnSubir = document.getElementById('btn-subir-' + campoDestino);
  if (btnSubir) btnSubir.onclick = () => {
    const pId = inputId; // e.g. 'p-adjPruebaFisica'
    if (isEditing(pId) || campoDestino === 'fotoPerfil') inputReal.click();
  };

  inputReal.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
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
      const base64 = event.target.result;
      if (!base64) return;
      if (campoDestino === 'fotoPerfil') { abrirCropper(base64); return; }
      mostrarSubiendo(campoDestino);
      try {
        // GAS expects full data URL with prefix
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
  if (!url) {
    contenedor.innerHTML = '<span class="file-status-vacio">Sin archivo</span>';
    return;
  }
  const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
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

// ── FOTO DE PERFIL ────────────────────────────────────────────
function clickEditarFoto() {
  // Foto always editable — no edit mode required
  document.getElementById('p-fotoPerfil')?.click();
}

function abrirFotoSinEdicion() {
  cropTarget = 'app';
  document.getElementById('p-fotoPerfil')?.click();
}

function setSecAvatarEditable(editable) {
  // The main avatar-container (in hero) is always clickable
  // sec-row-avatar in generales section uses clickEditarFoto() which checks edit mode
}

function renderFotoPerfil(url) {
  console.log('[renderFotoPerfil] url:', url);
  const placeholder = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="#2b2b2b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-size="20" font-family="Arial">Sin foto</text></svg>');
  [document.getElementById('img-preview-foto'), document.getElementById('sec-img-foto')].forEach(img => {
    if (!img) return;
    img.onerror = (e) => { console.log('[renderFotoPerfil] img error, falling to placeholder. src was:', img.src); img.src = placeholder; };
    img.src = url || placeholder;
    console.log('[renderFotoPerfil] set img.src to:', img.src, 'element:', img.id);
  });
}

function normalizarDriveUrl(url) {
  if (!url) return '';
  console.log('[normalizarDriveUrl] input:', url);
  // Extract Drive file ID from any Drive URL format
  let fileId = null;
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) fileId = m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileId && m2?.[1]) fileId = m2[1];
  if (!fileId) { console.log('[normalizarDriveUrl] no fileId found, returning raw:', url); return url; }
  const result = 'https://lh3.googleusercontent.com/d/' + fileId + '=w500';
  console.log('[normalizarDriveUrl] output:', result);
  return result;
}

function abrirCropper(base64) {
  const modal = document.getElementById('modal-crop');
  const image = document.getElementById('crop-image');
  modal.style.display = 'flex';
  image.src = base64;
  if (cropper) cropper.destroy();
  cropper = new Cropper(image, {
    aspectRatio: 1, viewMode: 1, dragMode: 'move',
    responsive: true, restore: true, checkCrossOrigin: false,
    modal: true, guides: true, center: true, highlight: true,
    cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false,
  });
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) { btnAplicar.disabled = false; btnAplicar.onclick = () => confirmarCrop(); }
}

function confirmarCrop() {
  if (!cropper) return;
  const btnAplicar = document.getElementById('btn-aplicar-crop');
  if (btnAplicar) btnAplicar.disabled = true;
  const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
  const base64DataUrl = canvas.toDataURL('image/jpeg', 0.85);
  document.getElementById('modal-crop').style.display = 'none';
  cropper.destroy(); cropper = null;
  if (cropTarget === 'registro') {
    cropTarget = 'app';
    regRecibirFotoRecortada(base64DataUrl);
  } else {
    subirImagenRecortada(base64DataUrl);
  }
}

async function subirImagenRecortada(base64) {
  mostrarCargandoFoto(true);
  fotoSubiendo = true;
  try {
    const result = await gasCall('subirArchivo', { base64Data: base64, tipoArchivo: 'foto', email: CURRENT_USER.email });
    if (!result || !result.url) throw new Error('No se recibio URL');
    window.myProfile.fotoPerfil = result.url;
    renderFotoPerfil(normalizarDriveUrl(result.url));
    await gasCall('updateMyProfile', {
      rowNumber: CURRENT_USER.rowNumber,
      data: { fotoPerfil: result.url },
    });
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
      // Safety net: auto-remove after 15s in case cleanup fails
      clearTimeout(el._safetyTimer);
      el._safetyTimer = setTimeout(() => { el.style.display = 'none'; }, 15000);
    } else {
      if (el) {
        clearTimeout(el._safetyTimer);
        el.style.display = 'none';
      }
    }
  } catch(e) { console.warn('mostrarCargandoFoto error:', e); }
}

function cancelarCrop() {
  if (cropper) { cropper.destroy(); cropper = null; }
  document.getElementById('modal-crop').style.display = 'none';
}
function rotarImagen() { if (cropper) cropper.rotate(90); }

// ── EMAIL WIDTH ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('p-email');
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailInput.value = emailInput.value.replace(/@.*/, '');
      ajustarAnchoEmail();
    });
  }
});

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => initGoogleAuth();
  document.head.appendChild(script);
});

// ── DATE PICKER ───────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

let dpState = {
  visible: false,
  viewYear: 2000, viewMonth: 0,
  selYear: null, selMonth: null, selDay: null,
  yearMode: false,
  monthMode: false,
  onConfirm: null,
};

function parseFecha(str) {
  // Accepts DD/MM/YYYY (primary), YYYY-MM-DD, or legacy M/D/YYYY
  if (!str) return null;
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    // DD/MM/YYYY — day is first (our stored format)
    return { day: parseInt(slash[1]), month: parseInt(slash[2])-1, year: parseInt(slash[3]) };
  }
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { month: parseInt(iso[2])-1, day: parseInt(iso[3]), year: parseInt(iso[1]) };
  return null;
}

function formatFecha(y, m, d) {
  // Store as DD/MM/YYYY
  const dd = String(d).padStart(2, '0');
  const mm = String(m + 1).padStart(2, '0');
  return `${dd}/${mm}/${y}`;
}

function formatFechaDisplay(y, m, d) {
  return `${d} ${MESES_CORTO[m]} ${y}`;
}

function abrirDatePicker(valorActual, onConfirm) {
  const parsed = parseFecha(valorActual);
  // Always ensure valid numbers
  dpState.viewYear  = (parsed && parsed.year)  ? parsed.year  : 1990;
  dpState.viewMonth = (parsed && typeof parsed.month === 'number') ? parsed.month : 0;
  dpState.selYear   = parsed ? parsed.year  : null;
  dpState.selMonth  = (parsed && typeof parsed.month === 'number') ? parsed.month : null;
  dpState.selDay    = parsed ? parsed.day   : null;
  dpState.yearMode  = false;
  dpState.monthMode = false;
  dpState.onConfirm = onConfirm;
  // Clear any previous error
  const errEl = document.getElementById('dp-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  renderDatePicker();
  document.getElementById('date-picker-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarDatePicker() {
  document.getElementById('date-picker-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderDatePicker() {
  const { viewYear, viewMonth, selYear, selMonth, selDay, yearMode } = dpState;

  // Guard: ensure month is always a valid 0-11 integer
  const safeMonth = (Number.isInteger(viewMonth) && viewMonth >= 0 && viewMonth <= 11) ? viewMonth : 0;
  const safeYear  = (Number.isInteger(viewYear)  && viewYear > 1900) ? viewYear : 1990;

  // Header label
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

  const gridWrap   = document.getElementById('dp-grid-wrap');
  const yearGrid   = document.getElementById('dp-year-grid');
  const monthGrid  = document.getElementById('dp-month-grid');

  // Hide/show prev-next arrows in month/year mode
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

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday-first

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
  // Scroll to selected
  requestAnimationFrame(() => {
    const sel = yearGrid.querySelector('.dp-year-selected');
    if (sel) sel.scrollIntoView({ block: 'center' });
  });
}

function animateDp() {
  // Briefly fade out the grid so re-render feels animated
  const grid = document.getElementById('dp-grid-wrap');
  const yearG = document.getElementById('dp-year-grid');
  const lbl = document.getElementById('dp-month-label');
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

// Wire up date picker events once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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
  // Use event delegation on the modal — labels get recreated by renderDatePicker
  // so we can't attach listeners directly; listen on the stable modal container instead
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
    if (e.target === document.getElementById('date-picker-modal')) cerrarDatePicker();
  });
  document.getElementById('dp-ok')?.addEventListener('click', () => {
    const errEl = document.getElementById('dp-error');
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
    if (dpState.onConfirm) dpState.onConfirm(val);
    cerrarDatePicker();
  });
});

// Init date picker trigger for fechaNacimiento
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
    // Build: [date text LEFT] [icon RIGHT]
    const txtNode = document.createTextNode('—');
    const icoSpan = document.createElement('span');
    icoSpan.className = 'material-icons dp-trig-ico';
    icoSpan.textContent = 'edit_calendar';
    trigger.appendChild(txtNode);  // first = left
    trigger.appendChild(icoSpan);  // second = right
    container.appendChild(trigger);
  }
  // Refresh the text node (second child), icon span stays untouched
  function refreshTriggerDisplay() {
    const p = parseFecha(input.value);
    const txt = p
      ? `${p.day} ${MESES_CORTO[p.month]} ${p.year}`
      : (input.value || '—');
    // Text node is first child, icon span is last
    const textNode = trigger.childNodes[0]?.nodeType === Node.TEXT_NODE ? trigger.childNodes[0] : Array.from(trigger.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = txt;
    } else {
      trigger.appendChild(document.createTextNode(txt));
    }
  }
  refreshTriggerDisplay();
  trigger.disabled = false;

  trigger.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isEditing('p-fechaNacimiento')) return;
    const currentVal = input.value || '';
    abrirDatePicker(currentVal, val => {
      input.value = val;
      refreshTriggerDisplay();
    });
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

  // Browser detection
  const isSamsungBrowser = /SamsungBrowser/i.test(ua);
  const isChrome         = /Chrome|CriOS/i.test(ua) && !/Edg|OPR|Opera|SamsungBrowser/i.test(ua);
  const isSafari         = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|OPR|SamsungBrowser/i.test(ua);
  const isFirefox        = /Firefox|FxiOS/i.test(ua);
  const isOpera          = /OPR|Opera/i.test(ua);
  const isEdge           = /Edg\//i.test(ua);
  const isMiui           = /XiaoMi|MIUI/i.test(ua);

  // WebView detection (WhatsApp, Instagram, Telegram, etc.)
  const isWebView = (isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua)) ||
                    /wv|WebView/i.test(ua) ||
                    /FBAN|FBAV|Instagram|Twitter|Line|Snapchat/i.test(ua);

  // Standalone = already installed
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  return { isIOS, isAndroid, isIPad, isSamsungBrowser, isChrome, isSafari,
           isFirefox, isOpera, isEdge, isMiui, isWebView, isStandalone };
}

function mostrarInstallBannerSiCorresponde() {
  const env = detectarEntorno();

  // Already installed as PWA — no banner needed
  if (env.isStandalone) return;

  // Desktop — no banner
  if (!env.isIOS && !env.isAndroid) return;

  // Incompatible browser — block app entirely, force Chrome/Safari
  const compatible =
    (env.isAndroid && (env.isChrome || env.isSamsungBrowser)) ||
    (env.isIOS && env.isSafari) ||
    env.isWebView; // webview handled separately inside banner

  if (!compatible) {
    buildBlockedBrowser(env);
    return;
  }

  buildInstallBanner(env);
}

function buildBlockedBrowser(env) {
  const isIOS = env.isIOS;
  const recommended = isIOS ? 'Safari' : 'Chrome';
  const url = 'https://app.quindesvolcanicos.com';

  const overlay = document.createElement('div');
  overlay.id = 'install-banner';
  overlay.style.cssText = [
    'position:fixed;inset:0;z-index:99999;',
    'background:var(--bg);',
    'display:flex;align-items:center;justify-content:center;padding:24px;',
  ].join('');

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
        font-family:inherit;cursor:pointer;box-sizing:border-box;margin-bottom:12px;
        transition:background 0.3s ease;
      ">
        📋
        Copiar enlace
      </button>
      ${!isIOS ? `
      <a href="https://play.google.com/store/apps/details?id=com.android.chrome"
         target="_blank" rel="noopener"
         style="
           display:flex;align-items:center;justify-content:center;gap:8px;
           width:100%;padding:14px;border-radius:16px;
           border:1.5px solid var(--border);background:transparent;
           color:var(--text);font-size:15px;font-weight:600;
           font-family:inherit;cursor:pointer;box-sizing:border-box;text-decoration:none;
         ">
        ↗️
        Descargar Chrome
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

  // ── CASO 1: WebView (abierto desde WhatsApp, Instagram, etc.) ──
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
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
        🔗
        <span style="font-size:13px;color:var(--text3);word-break:break-all;">app.quindesvolcanicos.com</span>
      </div>
      ${stepsHtml([
        { ico: env.isIOS ? '⬆️' : '⋮', txt: env.isIOS
            ? 'Toca el ícono de compartir y selecciona <strong>"Abrir en Safari"</strong>'
            : 'Toca los <strong>tres puntos</strong> o el ícono de compartir y elige <strong>"Abrir en Chrome"</strong>' },
        { ico: '📋', txt: 'O copia la dirección y pégala en ' + browserName },
      ])}
      <button onclick="copiarURL()" style="${btnStyle('var(--accent)')}">
        📋
        Copiar enlace
      </button>`;

  // ── CASO 2: iOS Safari ──
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
      <div style="
        background:var(--card);border:1px solid var(--border);border-radius:14px;
        padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;
      ">
        <span style="font-size:28px;">${env.isIPad ? '↗️' : '⬆️'}</span>
        <span style="font-size:13px;color:var(--text3);line-height:1.5;">
          El ícono de compartir está ${env.isIPad ? 'arriba a la derecha' : 'abajo en el centro'} de Safari.
        </span>
      </div>`;

  // ── CASO 3: iOS pero NO Safari (Chrome, Firefox, etc.) ──
  } else if (env.isIOS && !env.isSafari) {
    subtitle = 'iPhone / iPad · Requiere Safari';
    body = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start;">
        <span style="font-size:22px;">⚠️</span>
        <p style="font-size:14px;color:var(--text2);margin:0;line-height:1.5;">
          En iPhone e iPad, la instalación solo funciona desde <strong style="color:var(--text);">Safari</strong>. Tu navegador actual no lo permite.
        </p>
      </div>
      ${stepsHtml([
        { ico: '🔍', txt: 'Abre <strong>Safari</strong> en tu dispositivo' },
        { ico: '📋', txt: 'Pega esta dirección: <strong>app.quindesvolcanicos.com</strong>' },
        { ico: '⬆️', txt: 'Toca compartir → <strong>"Agregar a pantalla de inicio"</strong>' },
      ])}
      <button id="btn-copiar-url" onclick="copiarURL()" style="${btnStyle('var(--accent)')}">
        📋
        Copiar enlace para Safari
      </button>`;

  // ── CASO 4: Android Chrome con prompt nativo disponible ──
  } else if (env.isAndroid && env.isChrome && deferredInstallPrompt) {
    subtitle = 'Android · Chrome';
    body = `
      <div style="display:flex;flex-direction:column;gap:0;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:900;color:var(--text);">⋮</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Abre el menú</div>
            <div style="font-size:13px;color:var(--text3);">Toca los tres puntos (esquina superior derecha)</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">📲</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Agregar a pantalla principal</div>
            <div style="font-size:13px;color:var(--text3);">Selecciona esta opción en el menú</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;">
          <div style="width:44px;height:44px;border-radius:12px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;">
            <img src="icons/icon-192x192.png" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Instalar Quindes</div>
            <div style="font-size:13px;color:var(--text3);">Toca "Instalar" en el diálogo que aparece</div>
          </div>
        </div>
      </div>
      <button id="install-native-btn" style="
        display:flex;align-items:center;justify-content:center;gap:10px;
        width:100%;padding:16px;border-radius:16px;border:none;
        background:var(--accent);color:#fff;font-size:16px;font-weight:800;
        font-family:inherit;cursor:pointer;box-sizing:border-box;
      ">📲 Instalar ahora</button>`;

  // ── CASO 5: Android Chrome sin prompt (ya se mostró o no aplica) ──
  } else if (env.isAndroid && env.isChrome) {
    subtitle = 'Android · Chrome';
    body = `
      <div style="display:flex;flex-direction:column;gap:0;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:900;color:var(--text);">⋮</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Abre el menú</div>
            <div style="font-size:13px;color:var(--text3);">Toca los tres puntos (esquina superior derecha)</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">📲</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Agregar a pantalla principal</div>
            <div style="font-size:13px;color:var(--text3);">Selecciona esta opción en el menú</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;">
          <div style="width:44px;height:44px;border-radius:12px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;">
            <img src="icons/icon-192x192.png" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">Instalar Quindes</div>
            <div style="font-size:13px;color:var(--text3);">Toca "Instalar" en el diálogo que aparece</div>
          </div>
        </div>
      </div>`;

  // ── CASO 6: Samsung Browser ──
  } else if (env.isAndroid && env.isSamsungBrowser) {
    subtitle = 'Android · Samsung Internet';
    body = `
      <p style="font-size:14px;color:var(--text2);margin:0 0 20px;line-height:1.6;">
        Toca el ícono de <strong style="color:var(--text);">menú</strong> (☰) en la esquina inferior derecha,
        luego selecciona <strong style="color:var(--text);">"Añadir página a"</strong> →
        <strong style="color:var(--text);">"Pantalla de inicio"</strong> y toca
        <strong style="color:var(--text);">"Añadir"</strong>.
      </p>
      <div style="
        background:var(--card);border:1px solid var(--border);border-radius:14px;
        padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;
      ">
        <span style="font-size:28px;">☰</span>
        <span style="font-size:13px;color:var(--text3);line-height:1.5;">
          El menú está abajo a la derecha en Samsung Internet.
        </span>
      </div>`;

  // ── CASO 7: Android con browser no compatible (Firefox, Opera, etc.) ──
  } else if (env.isAndroid) {
    subtitle = 'Requiere Chrome';
    body = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start;">
        <span style="font-size:22px;">⚠️</span>
        <p style="font-size:14px;color:var(--text2);margin:0;line-height:1.5;">
          Tu navegador actual no permite instalar la app. Necesitas abrirla en <strong style="color:var(--text);">Chrome</strong>.
        </p>
      </div>
      ${stepsHtml([
        { ico: '🔍', txt: 'Abre <strong>Chrome</strong> en tu teléfono' },
        { ico: '📋', txt: 'Pega esta dirección: <strong>app.quindesvolcanicos.com</strong>' },
      ])}
      <button onclick="copiarURL()" style="${btnStyle('var(--accent)')}">
        📋
        Copiar enlace para Chrome
      </button>
      <a href="https://play.google.com/store/apps/details?id=com.android.chrome" target="_blank" rel="noopener" style="${btnStyle('transparent','var(--text3)','1.5px solid var(--border)')}text-decoration:none;">
        ↗️
        Descargar Chrome
      </a>`;
  }

  overlay.innerHTML = `
    <div style="
      background:var(--bg);border-radius:24px 24px 0 0;
      padding:24px 24px 44px;width:100%;max-width:480px;
      max-height:90vh;overflow-y:auto;
      box-shadow:0 -8px 40px rgba(0,0,0,0.3);
      box-sizing:border-box;
    ">
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

  // Native install button
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
  return `
    display:flex;align-items:center;justify-content:center;gap:8px;
    width:100%;padding:14px;border-radius:14px;border:${border};
    background:${bg};color:${color};font-size:15px;font-weight:700;
    font-family:inherit;cursor:pointer;margin-top:8px;box-sizing:border-box;
  `;
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
  }).catch(() => {
    prompt('Copia esta dirección:', url);
  });
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

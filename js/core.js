// ============================================================
//  QUINDES APP — app.js  (navegación por secciones)
// ============================================================

const CONFIG = {
  API_URL: 'https://quindesgithubio-production.up.railway.app',
  GOOGLE_CLIENT_ID: '190762038083-nlmie46eah0qq5kd5l86fiq3jteg2pr4.apps.googleusercontent.com',
};

let CURRENT_USER   = null;
let accessToken    = null;
let wizOrigen      = null;
const _urlParams   = new URLSearchParams(window.location.search);
let inviteCode     = _urlParams.get('invite') || null; // 'login' | 'noEncontrado' — tracks where wizard was launched from
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
  'Buscando protecciones…',
  'Ajustando patines…',
  'Ajustando casco…',
  '¡5 segundos!',
  'Entrando a pista…',
  'Cumpliendo penalizaciones…',
  'Reingresando a pista…',
  'Buscando cubrecascos…',
  'Saltando un Apex…',
  'Haciendo ofensas…',
  'Evitando ser Jammer…',
  'Ajustando ruedas…',
  'Lavando protecciones…',
  'Gestionando espacios de entrenamiento…',
  'Revisando condiciones climaticas…',
  'Bloqueando Jammer…',
  'Cayendo dramaticamente…',
  'Rotando Paredes…',
  'Encintando Pista…',
  'Encintando Patines…',
  'Hechando perros del recinto…',
  'Barriendo pista…',
  'Llegando a tiempo al entrenamiento…',
  'Sumando puntos…',
  'Pasando la estrella…',
  'Preparando MVPS…',
  'Calculando física de caidas en patines…',
  'Leyendo el reglamento…',
  'Preparando comentarios…',
  'Cortando pista…',
  'Reciclando…',
  'Calculando distancia del pack…',
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
  // Messages — shuffle a copy so they play in random order without repeats
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


// ── CERRAR SESIÓN ─────────────────────────────────────────────
function cerrarSesion() {
  try { google.accounts.id.disableAutoSelect(); } catch(e) {}
  // Borrar sesión del worker y limpiar localStorage
  try {
    const t = localStorage.getItem('quindes_token');
    // sesión limpiada localmente
    localStorage.removeItem('quindes_email');
    localStorage.removeItem('quindes_token');
  } catch(e) {}
  // Reset all state
  CURRENT_USER = null;
  window.myProfile = null;
  accessToken = null;
  wizOrigen = null;
  window._registroDesdeLogin = false;
  // Hide app, show login
  document.getElementById('appContent').style.display = 'none';
  mostrarLoginScreen();
}

// ── BORRAR PERFIL ──────────────────────────────────────────────
function confirmarBorrarPerfil() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;padding:24px;transition:background 0.25s ease;';
  overlay.innerHTML = `
    <div style="background:var(--bg);border-radius:20px;padding:28px 24px;max-width:340px;width:100%;text-align:center;">
      <span class="material-icons" style="font-size:48px;color:var(--accent);margin-bottom:12px;display:block;">warning</span>
      <h3 style="font-size:20px;font-weight:800;color:var(--text);margin:0 0 10px;">¿Borrar tu perfil?</h3>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 24px;">
        Esta acción eliminará <strong>todos tus datos</strong> de la app y de la planilla. No se puede deshacer.
      </p>
      <button onclick="ejecutarBorrarPerfil()" style="
        width:100%;padding:14px;border-radius:12px;border:none;
        background:var(--accent);color:#fff;font-size:15px;font-weight:700;
        font-family:inherit;cursor:pointer;margin-bottom:10px;
      ">Sí, borrar mi perfil</button>
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        width:100%;padding:14px;border-radius:12px;border:none;
        background:var(--card);color:var(--text);font-size:15px;font-weight:600;
        font-family:inherit;cursor:pointer;
      ">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  // Animar entrada
  const card = overlay.querySelector('div');
  if (card) {
    card.style.transform = 'scale(0.88) translateY(16px)';
    card.style.opacity = '0';
    card.style.transition = 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease';
  }
  requestAnimationFrame(() => {
    overlay.style.background = 'rgba(0,0,0,0.6)';
    requestAnimationFrame(() => {
      if (card) {
        card.style.transform = 'scale(1) translateY(0)';
        card.style.opacity = '1';
      }
    });
  });
}

async function ejecutarBorrarPerfil() {
  const overlay = document.querySelector('[style*="position:fixed"][style*="9999"]');
  if (overlay) overlay.remove();
  try {
    await gasCall('borrarPerfil', { rowNumber: CURRENT_USER.id });
    cerrarSesion();
  } catch(e) {
    alert('Error al borrar el perfil: ' + (e.message || e));
  }
}

function initGoogleAuth() {
  fixGoogleButtonFlicker();

  // ── SESIÓN GUARDADA: si hay email en localStorage, cargar directo ──
  const savedEmail = localStorage.getItem('quindes_email');
  const savedToken = localStorage.getItem('quindes_token');
  if (savedEmail && savedToken) {
    // Sesión guardada — validar y cargar perfil sin pasar por Google
    (async () => {
      try {
        // 1. Validar sessionToken contra el worker
        // Sesión guardada — verificar que el usuario existe en el nuevo backend
        const valData = await apiCall('/usuario?email=' + encodeURIComponent(savedEmail));
        if (!valData.found) throw new Error('invalid session');

        // 2. Mostrar loader
        document.getElementById('loadingScreen').style.display  = 'flex';
        document.getElementById('loginScreen').style.display    = 'none';
        detenerDerbyLoader();
        iniciarDerbyLoader();

        // 3. Llamadas sin token de Google — el worker las autentica con apiKey
        const user = await gasCallNoToken('getCurrentUser', { email: savedEmail });
        if (!user || !user.found) throw new Error('user not found');

        CURRENT_USER = { ...user, rolApp: user.rol };
        const profile = await gasCallNoToken('getMyProfile', { rowNumber: user.id });
        window.myProfile = profile;

        configurarTodasLasSubidas();
        renderTodo(profile);
        aplicarPermisos();
        detenerDerbyLoader();
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('appContent').style.display    = 'block';

      } catch(e) {
        console.warn('[SESSION] Saved session failed, showing login:', e.message);
        localStorage.removeItem('quindes_email');
        localStorage.removeItem('quindes_token');
        accessToken = null;
        detenerDerbyLoader();
        mostrarLoginScreen();
      }
    })();
    // Inicializar Google en background por si necesitamos el botón
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: onGoogleSignIn,
      auto_select: false,
    });
    preRenderResigninButton();
    return;
  }

  // Sin sesión guardada — flujo normal de login
  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn,
    auto_select: false,
  });

  setTimeout(() => {
    const loading = document.getElementById('loadingScreen');
    if (loading && loading.style.display !== 'none') {
      mostrarLoginScreen();
    }
  }, 1200);

  preRenderResigninButton();
}

function onGoogleSignIn(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  accessToken = response.credential;
  const email = payload.email;

  // Crear sesión persistente en el worker
  console.log('[SESSION] Creating persistent session for:', email);
  try {
    localStorage.setItem('quindes_email', email);
    localStorage.setItem('quindes_token', accessToken);
  } catch(e) {}

  inicializarApp(email);
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

async function apiCall(endpoint, method = 'GET', body = null) {
  const url = CONFIG.API_URL + endpoint;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error('Respuesta inválida: ' + text.substring(0, 200)); }
  if (json.error) throw new Error(json.error);
  return json;
}

async function gasCall(action, data = {}) {
  if (action === 'getCurrentUser') {
    return apiCall('/usuario?email=' + encodeURIComponent(data.email));
  }
  if (action === 'getMyProfile') {
    return apiCall('/perfil/' + data.rowNumber);
  }
  if (action === 'updateMyProfile') {
    return apiCall('/perfil/' + data.rowNumber, 'PUT', data.data);
  }
  if (action === 'subirArchivo') {
    return apiCall('/archivo', 'POST', {
      base64Data: data.base64Data,
      tipoArchivo: data.tipoArchivo,
      email: data.email,
    });
  }
  if (action === 'borrarPerfil') {
    return apiCall('/perfil/' + data.rowNumber, 'DELETE');
  }
  throw new Error('Acción no soportada: ' + action);
}

async function gasCallNoToken(action, data = {}) {
  return gasCall(action, data);
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

    // Si venía de "no encontrado" y ahora entró con una cuenta que sí existe
    if (wizOrigen === 'noEncontrado') {
      wizOrigen = null;
      detenerDerbyLoader();
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('noEncontradoScreen').style.display = 'none';
      mostrarCuentaYaRegistrada(email, user);
      return;
    }

    CURRENT_USER = { ...user, rolApp: user.rol };
    const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = user.email;

    const profile = await gasCall('getMyProfile', { rowNumber: user.id });
    window.myProfile = profile;

    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();

    // Precargar imágenes antes de mostrar la app
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
  const overlay = document.createElement('div');
  overlay.id = 'ya-registrada-screen';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);padding:32px;';

  overlay.innerHTML = `
    <div class="login-bg" style="display:block;">
      <span class="login-bg-ring login-bg-ring-1"></span>
      <span class="login-bg-ring login-bg-ring-2"></span>
    </div>
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:0;width:100%;max-width:360px;text-align:center;">
      <img src="icons/splash-512x512.png" alt="Quindes"
           style="width:88px;height:88px;border-radius:22px;object-fit:contain;margin-bottom:20px;
                  animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.1s both;">
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0 0 10px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.2s both;">¡Ya tienes una cuenta!</h2>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 28px;animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.3s both;">
        La cuenta <strong style="color:var(--text);">${email}</strong> ya está registrada. Ingresando…
      </p>
      <div style="animation:wiz-fade-up 0.45s cubic-bezier(0.4,0,0.2,1) 0.4s both;width:100%;">
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

  // Run the message cycle for this screen
  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % DERBY_MSGS.length;
    const el = document.getElementById('ya-reg-msg');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => { if (el) { el.textContent = DERBY_MSGS[msgIdx]; el.style.opacity = ''; } }, 300);
    }
  }, 2200);

  // Run icon animation cycle
  let iconIdx = 0;
  const iconIds = ['ya-di-0','ya-di-1','ya-di-2','ya-di-3'];
  const iconTimer = setInterval(() => {
    iconIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('di-active','di-near');
      const diff = (i - iconIdx + 4) % 4;
      if (diff === 0) el.classList.add('di-active');
      else if (diff === 1 || diff === 3) el.classList.add('di-near');
    });
    iconIdx = (iconIdx + 1) % 4;
  }, 900);

  document.body.appendChild(overlay);

  // Start loading the app immediately in the background — keep overlay visible the whole time
  CURRENT_USER = { ...user, rolApp: user.rol };
  const _uel = document.getElementById('user-email'); if (_uel) _uel.textContent = user.email;

  gasCall('getMyProfile', { rowNumber: user.id }).then(profile => {
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();

    // App is ready — now fade out overlay and show app
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
  // Track that we're in noEncontrado flow — so if user logs in with existing account
  // we show the ya-registrada screen instead of the generic loader
  wizOrigen = 'noEncontrado';
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

  // Limpiar wiz-step-inv también
  const sInv = document.getElementById('wiz-step-inv');
  if (sInv) { sInv.classList.remove('wiz-active','wiz-animate'); sInv.style.transition = sInv.style.transform = sInv.style.visibility = ''; }
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
    const s1 = document.getElementById('wiz-step-inv');
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


  if (wizStep === 'inv') {
    const val = document.getElementById('reg-codigo-inv')?.value.trim();
    if (!val) { wizShowError('Ingresá tu código de invitación 🔑'); return; }
    regData.codigoInvitacion = val;
    inviteCode = val;
  }
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
    const email = localStorage.getItem('quindes_email') || '';
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

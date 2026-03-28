// ============================================================
//  QUINDES APP — auth.js  (Google Auth, sesión, login screens)
// ============================================================

function getGoogleBtnTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'filled_black' : 'outline';
}

function fixResigninBorder() {
  const el = document.getElementById('google-resignin-btn');
  if (!el) return;
  const iframe = el.querySelector('iframe');
  if (iframe) {
    iframe.style.border = 'none';
    iframe.style.outline = 'none';
    iframe.style.boxShadow = 'none';
  }
  el.style.border = 'none';
  el.style.outline = 'none';
  el.style.boxShadow = 'none';
}

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
  if (suppressReveal) return;
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
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    ['google-signin-btn', 'google-resignin-btn', 'wiz-google-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.innerHTML = ''; el.dataset.rendered = ''; }
    });
    const loginVisible = document.getElementById('loginScreen')?.style.display !== 'none';
    const noEncVisible = document.getElementById('noEncontradoScreen')?.style.display !== 'none';
    const wizVisible   = document.getElementById('wiz-step-0')?.style.display !== 'none';
    if (loginVisible) renderGoogleButton('google-signin-btn', 'signin_with');
    if (noEncVisible) renderGoogleButton('google-resignin-btn', 'signin_with');
    if (wizVisible)   renderGoogleButton('wiz-google-btn', 'continue_with');
  });
}

function resetGoogleButton(id, text) {
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

function preRenderResigninButton() {
  const container = document.getElementById('google-resignin-btn');
  if (!container || container.dataset.rendered === 'true') return;
  renderGoogleButton('google-resignin-btn', 'signin_with');
}

// ── CERRAR SESIÓN ─────────────────────────────────────────────
function cerrarSesion() {
  try { google.accounts.id.disableAutoSelect(); } catch(e) {}
  try {
    localStorage.removeItem('quindes_email');
    localStorage.removeItem('quindes_token');
  } catch(e) {}
  CURRENT_USER = null;
  window.myProfile = null;
  accessToken = null;
  wizOrigen = null;
  window._registroDesdeLogin = false;
  document.getElementById('appContent').style.display = 'none';
  mostrarLoginScreen();
}

// ── BORRAR PERFIL ─────────────────────────────────────────────
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
  overlay.dataset.dialogoBorrar = '1';
  document.body.appendChild(overlay);
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
  document.querySelectorAll('[data-dialogo-borrar]').forEach(el => el.remove());
  document.querySelectorAll('[style*="position:fixed"][style*="9999"]').forEach(el => el.remove());
  try {
    await gasCall('borrarPerfil', { rowNumber: CURRENT_USER.id });
    cerrarSesion();
    mostrarModalCuentaBorrada();
  } catch(e) {
    alert('Error al borrar el perfil: ' + (e.message || e));
  }
}

function mostrarModalCuentaBorrada() {
  // Cerrar cualquier diálogo previo
  document.querySelectorAll('[data-dialogo-borrar]').forEach(el => el.remove());

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;opacity:0;transform:scale(0.92) translateY(24px);transition:opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);';
  modal.innerHTML = `
    <span style="font-size:56px;margin-bottom:16px;">🗑️</span>
    <h2 style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:12px;">Cuenta borrada</h2>
    <p style="font-size:15px;color:var(--text-secondary);line-height:1.5;margin-bottom:32px;">Podés crear una nueva cuenta o solicitar un código de registro al administradorx de tu equipo.</p>
    <button id="btn-aceptar-borrada" style="background:var(--accent);color:#fff;border:none;border-radius:14px;padding:14px 32px;font-size:16px;font-weight:700;cursor:pointer;width:100%;max-width:280px;">Aceptar</button>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1) translateY(0)';
    });
  });

  document.getElementById('btn-aceptar-borrada').addEventListener('click', () => {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 400);
  });
}

// ── GOOGLE AUTH ───────────────────────────────────────────────
function initGoogleAuth() {
  console.log('[INVITE] inviteCode al init:', inviteCode);
  fixGoogleButtonFlicker();

  const savedEmail = localStorage.getItem('quindes_email');
  const savedToken = localStorage.getItem('quindes_token');
  if (savedEmail && savedToken && !inviteCode) {
    (async () => {
      try {
        const valData = await apiCall('/usuario?email=' + encodeURIComponent(savedEmail));
        if (!valData.found) throw new Error('invalid session');

        document.getElementById('loadingScreen').style.display  = 'flex';
        document.getElementById('loginScreen').style.display    = 'none';
        detenerDerbyLoader();
        iniciarDerbyLoader();

        const user = await gasCallNoToken('getCurrentUser', { email: savedEmail });
        if (!user || !user.found) throw new Error('user not found');

        CURRENT_USER = { ...user, rolApp: user.rol };

        if (inviteCode) {
          detenerDerbyLoader();
          document.getElementById('loadingScreen').style.display = 'none';
          wizOrigen = 'noEncontrado';
          console.log('[INVITE] llamando mostrarRegistroWizard, registroScreen:', document.getElementById('registroScreen'));
          mostrarRegistroWizard();
          return;
        }

        const profile = await gasCallNoToken('getMyProfile', { rowNumber: user.id });
        window.myProfile = profile;

        configurarTodasLasSubidas();
        renderTodo(profile);
        aplicarPermisos();
        inicializarAjustes();
        detenerDerbyLoader();
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('appContent').style.display    = 'block';

      } catch(e) {
        console.error('[SESSION] Saved session failed:', e);
        localStorage.removeItem('quindes_email');
        localStorage.removeItem('quindes_token');
        accessToken = null;
        detenerDerbyLoader();
        mostrarLoginScreen();
      }
    })();
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: onGoogleSignIn,
      auto_select: false,
    });
    preRenderResigninButton();
    return;
  }

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
  console.log('[SESSION] Creating persistent session for:', email);
  try {
    localStorage.setItem('quindes_email', email);
    localStorage.setItem('quindes_token', accessToken);
  } catch(e) {}
  inicializarApp(email);
}

function mostrarLoginScreen() {
  const loginScr = document.getElementById('loginScreen');
  renderGoogleButton('google-signin-btn', 'signin_with', true);
  detenerDerbyLoader();
  document.getElementById('loadingScreen').style.display = 'none';
  loginScr.style.opacity = '0';
  loginScr.style.display = 'flex';
  setTimeout(() => {
    loginScr.style.transition = 'opacity 0.3s ease';
    loginScr.style.opacity    = '1';
    setTimeout(() => { loginScr.style.transition = ''; }, 310);
  }, 60);
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

function mostrarRegistroDesdeLogin() {
  window._registroDesdeLogin = true;
  wizOrigen = 'login';
  document.getElementById('loginScreen').style.display    = 'none';
  document.getElementById('registroScreen').style.display = 'flex';
  document.getElementById('wiz-intro').style.display      = 'none';
  document.getElementById('wiz-step-0').style.display     = 'flex';
  document.getElementById('wiz-header').style.display     = 'none';
  document.getElementById('wiz-viewport').style.display   = 'none';
  requestAnimationFrame(() => {
    const wrap = document.getElementById('wiz-google-btn');
    if (wrap) resetGoogleButton('wiz-google-btn', 'continue_with');
  });
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
  history.pushState({ wizStep0: true }, '');
}

function mostrarNoEncontrado(email) {
  if (window._registroDesdeLogin) {
    window._registroDesdeLogin = false;
    wizOrigen = 'login';
    mostrarRegistroWizard();
    return;
  }
  if (inviteCode) {
    wizOrigen = 'noEncontrado';
    mostrarRegistroWizard();
    return;
  }
  wizOrigen = 'noEncontrado';
  const el = document.getElementById('no-enc-email');
  if (el) el.textContent = email || '';
  document.getElementById('btn-ir-registro').onclick = () => {
    wizOrigen = 'noEncontrado';
    document.getElementById('noEncontradoScreen').style.display = 'none';
    mostrarRegistroWizard();
  };
  resetGoogleButton('google-resignin-btn', 'signin_with');
  const screen = document.getElementById('noEncontradoScreen');
  screen.style.opacity = '0';
  screen.style.display = 'flex';
  requestAnimationFrame(() => {
    screen.style.transition = 'opacity 0.3s ease';
    screen.style.opacity    = '1';
    setTimeout(() => { screen.style.transition = ''; }, 310);
  });
  const resignBtn = document.getElementById('google-resignin-btn');
  if (resignBtn) {
    resignBtn.style.opacity    = '0';
    resignBtn.style.transition = 'none';
    setTimeout(() => {
      resignBtn.style.transition = 'opacity 0.4s ease';
      resignBtn.style.opacity    = '1';
      fixResigninBorder();
    }, 1000);
  }
  pushSentinel();
}
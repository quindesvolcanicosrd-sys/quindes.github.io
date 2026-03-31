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
overlay.className = 'dialog-borrar-overlay';
  overlay.dataset.dialogoBorrar = '1';
  overlay.innerHTML = `
    <div class="dialog-borrar-card" id="dialog-borrar-card">
      <span class="material-icons" style="font-size:48px;color:var(--accent);margin-bottom:12px;display:block;">warning</span>
      <h3 style="font-size:20px;font-weight:800;color:var(--text);margin:0 0 10px;">¿Borrar tu perfil?</h3>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 24px;">
        Esta acción eliminará <strong>todos tus datos</strong> de la app y de la planilla. No se puede deshacer.
      </p>
      <button onclick="ejecutarBorrarPerfil()" class="dialog-borrar-btn-confirm">Sí, borrar mi perfil</button>
      <button onclick="this.closest('.dialog-borrar-overlay').remove()" class="dialog-borrar-btn-cancel">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const card = document.getElementById('dialog-borrar-card');
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    requestAnimationFrame(() => {
      if (card) card.classList.add('visible');
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
  modal.className = 'modal-cuenta-borrada';
  modal.innerHTML = `
    <span style="font-size:56px;margin-bottom:16px;">🗑️</span>
    <h2 style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:12px;">Cuenta borrada</h2>
    <p style="font-size:15px;color:var(--text2);line-height:1.5;margin-bottom:32px;">Podés crear una nueva cuenta o solicitar un código de registro al administradorx de tu equipo.</p>
    <button id="btn-aceptar-borrada" class="modal-cuenta-borrada-btn">Aceptar</button>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('visible');
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
        console.log('[AUTH] verificando sesión para:', savedEmail);
        const valData = await apiCall('/usuario?email=' + encodeURIComponent(savedEmail));
        console.log('[AUTH] valData:', valData);
        if (!valData.found) throw new Error('invalid session');
        window._googleEmail = savedEmail;
        inicializarApp(savedEmail);
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
  window._googleEmail = email;
  // Si el wizard de crear liga está abierto, avanzar al paso 1
  const wizLiga = document.getElementById('wiz-liga-overlay');
  if (wizLiga) {
    renderWizLigaPaso(1);
    return;
  }
  inicializarApp(email);
}

function mostrarLoginScreen() {
  if (inviteCode) {
    detenerDerbyLoader();
    document.getElementById('loadingScreen').style.display = 'none';
    mostrarRegistroDesdeLogin();
    const step0 = document.getElementById('wiz-step-0');
    if (step0) {
      const volverBtn = step0.querySelector('.wiz-btn-skip');
      if (volverBtn) volverBtn.style.display = 'none';
    }
    return;
  }
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
  const btnVolver = document.getElementById('wiz-step0-volver');
  if (btnVolver) btnVolver.style.display = inviteCode ? 'none' : '';
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
  console.log('[NO-ENC] inviteCode:', inviteCode);
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
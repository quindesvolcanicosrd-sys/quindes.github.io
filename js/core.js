// ============================================================
//  QUINDES APP — core.js  (config, globals, service worker)
// ============================================================

const CONFIG = {
  API_URL: 'https://quindesgithubio-production.up.railway.app',
  GOOGLE_CLIENT_ID: '190762038083-nlmie46eah0qq5kd5l86fiq3jteg2pr4.apps.googleusercontent.com',
};

let CURRENT_USER   = null;
let accessToken    = null;
let wizOrigen      = null;
const _urlParams   = new URLSearchParams(window.location.search);
let inviteCode     = _urlParams.get('invite') || null;
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

async function cargarParciales() {
  const parciales = [
    { url: './html/login.html',   ref: document.getElementById('loadingScreen') },
    { url: './html/wizard.html',  ref: document.getElementById('loadingScreen') },
    { url: './html/modals.html',  ref: document.body },
  ];

  for (const { url, ref } of parciales) {
    try {
      const res  = await fetch(url);
      const html = await res.text();
      ref.insertAdjacentHTML('afterend', html);
    } catch(e) {
      console.error('Error cargando parcial:', url, e);
    }
  }

  // Nav va dentro de appContent, antes del cierre
  try {
    const res  = await fetch('./html/nav.html');
    const html = await res.text();
    document.getElementById('appContent').insertAdjacentHTML('beforeend', html);
  } catch(e) {
    console.error('Error cargando nav.html', e);
  }
}
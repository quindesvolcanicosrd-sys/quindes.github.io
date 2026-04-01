// ============================================================
//  QUINDES APP — ajustes.js  (ajustes, privacidad, notificaciones, nav)
// ============================================================

const AJUSTES_KEY = 'quindes_ajustes';

const CIUDADES_POR_PAIS = {
  'Argentina': ['Buenos Aires','Córdoba','Rosario','Mendoza','La Plata','Tucumán','Mar del Plata','Salta','Santa Fe','San Juan','Neuquén','Resistencia','Corrientes','Posadas','Bahía Blanca','Paraná','San Salvador de Jujuy','Formosa','San Luis','Santiago del Estero'],
  'Bolivia': ['La Paz','Santa Cruz de la Sierra','Cochabamba','Sucre','Oruro','Potosí','Tarija','Trinidad','Cobija'],
  'Brasil': ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza','Belo Horizonte','Manaus','Curitiba','Recife','Porto Alegre','Belém','Goiânia','Florianópolis','Maceió','Natal'],
  'Chile': ['Santiago','Valparaíso','Concepción','La Serena','Antofagasta','Temuco','Rancagua','Talca','Arica','Puerto Montt','Iquique','Coquimbo'],
  'Colombia': ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Cúcuta','Bucaramanga','Pereira','Santa Marta','Ibagué','Manizales','Villavicencio'],
  'Costa Rica': ['San José','Alajuela','Cartago','Heredia','Liberia','Limón','Pérez Zeledón'],
  'Cuba': ['La Habana','Santiago de Cuba','Camagüey','Holguín','Guantánamo','Santa Clara'],
  'Ecuador': ['Guayaquil','Quito','Cuenca','Ambato','Manta','Portoviejo','Machala','Riobamba','Loja'],
  'El Salvador': ['San Salvador','Santa Ana','San Miguel','Soyapango','Mejicanos','Apopa'],
  'Guatemala': ['Ciudad de Guatemala','Mixco','Villa Nueva','Quetzaltenango','San Pedro Carchá','Chinautla'],
  'Honduras': ['Tegucigalpa','San Pedro Sula','Choloma','La Ceiba','El Progreso','Choluteca'],
  'México': ['Ciudad de México','Guadalajara','Monterrey','Puebla','Toluca','Tijuana','León','Ciudad Juárez','Mérida','Querétaro','San Luis Potosí','Aguascalientes','Hermosillo','Chihuahua','Cancún','Veracruz','Culiacán','Acapulco','Saltillo','Morelia'],
  'Nicaragua': ['Managua','León','Masaya','Chinandega','Matagalpa','Estelí'],
  'Panamá': ['Ciudad de Panamá','San Miguelito','Colón','David','La Chorrera'],
  'Paraguay': ['Asunción','Ciudad del Este','San Lorenzo','Luque','Capiatá','Lambaré'],
  'Perú': ['Lima','Arequipa','Trujillo','Chiclayo','Piura','Iquitos','Cusco','Huancayo','Tacna','Juliaca'],
  'Puerto Rico': ['San Juan','Bayamón','Carolina','Ponce','Caguas','Guaynabo'],
  'República Dominicana': ['Santo Domingo','Santiago de los Caballeros','San Pedro de Macorís','La Romana','San Francisco de Macorís'],
  'Uruguay': ['Montevideo','Salto','Ciudad de la Costa','Paysandú','Las Piedras','Rivera'],
  'Venezuela': ['Caracas','Maracaibo','Valencia','Barquisimeto','Maracay','Ciudad Guayana','Maturín','Barinas','Cumaná','Mérida'],
  'Canadá': ['Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg','Quebec','Hamilton','Kitchener','London','Halifax'],
  'Estados Unidos': ['Nueva York','Los Ángeles','Chicago','Houston','Phoenix','Filadelfia','San Antonio','San Diego','Dallas','San José','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle','Denver','Nashville','Portland','Las Vegas','Memphis','Louisville','Baltimore','Atlanta','Miami','Minneapolis','Tucson','Fresno'],
  'Alemania': ['Berlín','Hamburgo','Múnich','Colonia','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden','Hannover','Nuremberg'],
  'Austria': ['Viena','Graz','Linz','Salzburgo','Innsbruck','Klagenfurt'],
  'Bélgica': ['Bruselas','Amberes','Gante','Charleroi','Lieja','Brujas'],
  'Croacia': ['Zagreb','Split','Rijeka','Osijek','Zadar','Slavonski Brod'],
  'Dinamarca': ['Copenhague','Aarhus','Odense','Aalborg','Esbjerg','Randers'],
  'España': ['Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia','Palma','Las Palmas','Bilbao','Alicante','Córdoba','Valladolid','Vigo','Gijón','Granada'],
  'Finlandia': ['Helsinki','Espoo','Tampere','Vantaa','Oulu','Turku'],
  'Francia': ['París','Marsella','Lyon','Toulouse','Niza','Nantes','Estrasburgo','Montpellier','Burdeos','Lille','Rennes','Reims'],
  'Grecia': ['Atenas','Salónica','Patras','Heraclión','Larisa','Volos'],
  'Hungría': ['Budapest','Debrecen','Miskolc','Szeged','Pécs','Győr'],
  'Irlanda': ['Dublín','Cork','Limerick','Galway','Waterford','Drogheda'],
  'Italia': ['Roma','Milán','Nápoles','Turín','Palermo','Génova','Bolonia','Florencia','Bari','Catania','Venecia','Verona'],
  'Noruega': ['Oslo','Bergen','Trondheim','Stavanger','Drammen','Fredrikstad'],
  'Países Bajos': ['Ámsterdam','Rotterdam','La Haya','Utrecht','Eindhoven','Groningen','Tilburg','Almere'],
  'Polonia': ['Varsovia','Cracovia','Lodz','Wroclaw','Poznan','Gdansk','Szczecin','Katowice'],
  'Portugal': ['Lisboa','Oporto','Braga','Setúbal','Coimbra','Funchal'],
  'Reino Unido': ['Londres','Birmingham','Manchester','Glasgow','Liverpool','Bristol','Edinburgh','Cardiff','Leicester','Leeds','Sheffield','Bradford','Coventry','Nottingham','Southampton'],
  'República Checa': ['Praga','Brno','Ostrava','Plzeň','Liberec','Olomouc'],
  'Rumania': ['Bucarest','Cluj-Napoca','Timișoara','Iași','Constanta','Craiova'],
  'Rusia': ['Moscú','San Petersburgo','Novosibirsk','Ekaterimburgo','Nizhny Novgorod','Kazán','Cheliábinsk','Omsk','Samara','Rostov del Don'],
  'Suecia': ['Estocolmo','Gotemburgo','Malmö','Uppsala','Västerås','Örebro','Linköping'],
  'Suiza': ['Zúrich','Ginebra','Basilea','Berna','Lausana','Winterthur'],
  'Turquía': ['Estambul','Ankara','Esmirna','Bursa','Adana','Gaziantep','Konya','Antalya'],
  'Ucrania': ['Kiev','Járkiv','Odessa','Dnipro','Donetsk','Zaporiyia','Lviv'],
  'Australia': ['Sídney','Melbourne','Brisbane','Perth','Adelaida','Gold Coast','Newcastle','Canberra','Wollongong','Hobart'],
  'China': ['Shanghái','Pekín','Cantón','Shenzhen','Chengdu','Tianjin','Wuhan','Chongqing','Nanjing','Hangzhou','Xi\'an','Suzhou'],
  'Corea del Sur': ['Seúl','Busan','Incheon','Daegu','Daejeon','Gwangju','Suwon','Ulsan'],
  'Filipinas': ['Manila','Davao','Caloocan','Zamboanga','Cebú','Antipolo'],
  'India': ['Bombay','Delhi','Bangalore','Hyderabad','Ahmedabad','Chennai','Kolkata','Pune','Surat','Jaipur','Lucknow','Kanpur'],
  'Indonesia': ['Yakarta','Surabaya','Bandung','Medan','Semarang','Palembang','Makassar','Depok','Tangerang','Bekasi'],
  'Israel': ['Jerusalén','Tel Aviv','Haifa','Rishon LeZion','Petah Tikva','Ashdod','Netanya','Be\'er Sheva'],
  'Japón': ['Tokio','Yokohama','Osaka','Nagoya','Sapporo','Fukuoka','Kobe','Kioto','Kawasaki','Saitama','Hiroshima','Sendai'],
  'Nueva Zelanda': ['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Napier','Dunedin'],
  'Singapur': ['Singapur'],
  'Tailandia': ['Bangkok','Nonthaburi','Pak Kret','Hat Yai','Chiang Mai','Pattaya'],
  'Taiwán': ['Taipéi','Kaohsiung','Taichung','Tainan','Hsinchu','Keelung'],
  'Arabia Saudita': ['Riad','Yeda','Meca','Medina','Damam','Tabuk'],
  'Egipto': ['El Cairo','Alejandría','Giza','Shubra el-Jeima','Puerto Said','Suez'],
  'Emiratos Árabes Unidos': ['Dubái','Abu Dabi','Sharjah','Al Ain','Ajmán','Ras al-Jaima'],
  'Nigeria': ['Lagos','Kano','Ibadan','Abuja','Port Harcourt','Benin City'],
  'Sudáfrica': ['Johannesburgo','Ciudad del Cabo','Durban','Pretoria','Port Elizabeth','Bloemfontein'],
  'Otro': [],
};

function cargarAjustes() {
  try { return JSON.parse(localStorage.getItem(AJUSTES_KEY) || '{}'); }
  catch { return {}; }
}

function guardarAjuste(key, val) {
  const a = cargarAjustes();
  a[key] = val;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
}

function inicializarAjustes() {
  const a = cargarAjustes();

  aplicarTema(a.tema || 'auto');
  marcarChipActivo('apr-theme-chips', a.tema || 'auto');

  const notifs = a.notificaciones || {};
  ['nuevosEventos','actualizacionesEventos','cancelaciones','cumpleanios','tareas'].forEach(key => {
    const val = notifs[key] !== undefined ? notifs[key] : true;
    sincronizarToggle('toggle-notif-' + key, val);
  });

  verificarEstadoPush();
  actualizarSeccionAdmin();
  inicializarCodigoInvitacion();

  const perfilVisible = getPriv('perfilVisible');
  sincronizarToggle('toggle-priv-perfilVisible',       perfilVisible);
  sincronizarToggle('toggle-priv-mostrarEstadisticas', getPriv('mostrarEstadisticas'));
  actualizarVisibilidadSeccionesPrivacidad(perfilVisible);

  const secContacto = getPriv('seccionContacto');
  sincronizarToggle('toggle-priv-seccion-contacto', secContacto);
  sincronizarToggle('toggle-priv-mostrarEmail',     getPriv('mostrarEmail'));
  sincronizarToggle('toggle-priv-mostrarTelefono',  getPriv('mostrarTelefono'));
  const itemsContacto = document.getElementById('priv-items-contacto');
  if (itemsContacto) itemsContacto.classList.toggle('is-disabled', !secContacto);

  const secPersonales = getPriv('seccionPersonales');
  sincronizarToggle('toggle-priv-seccion-personales',  secPersonales);
  sincronizarToggle('toggle-priv-mostrarDocumento',    getPriv('mostrarDocumento'));
  sincronizarToggle('toggle-priv-mostrarNacionalidad', getPriv('mostrarNacionalidad'));
  sincronizarToggle('toggle-mostrarCumple',            getPriv('mostrarCumple'));
  sincronizarToggle('toggle-mostrarEdad',              getPriv('mostrarEdad'));
  const itemsPersonales = document.getElementById('priv-items-personales');
  if (itemsPersonales) itemsPersonales.classList.toggle('is-disabled', !secPersonales);

  
  const secSalud = getPriv('seccionSalud');
  sincronizarToggle('toggle-priv-seccion-salud',         secSalud);
  sincronizarToggle('toggle-priv-mostrarEmergencia',     getPriv('mostrarEmergencia'));
  sincronizarToggle('toggle-priv-mostrarGrupoSanguineo', getPriv('mostrarGrupoSanguineo'));
  sincronizarToggle('toggle-priv-mostrarAlergias',       getPriv('mostrarAlergias'));
  sincronizarToggle('toggle-priv-mostrarDieta',          getPriv('mostrarDieta'));
  sincronizarToggle('toggle-priv-mostrarPruebaFisica',   getPriv('mostrarPruebaFisica'));
  const itemsSalud = document.getElementById('priv-items-salud');
  if (itemsSalud) itemsSalud.classList.toggle('is-disabled', !secSalud);

}

// ── Código de invitación ──────────────────────────────────────
let _codigoVisible = false;
let _codigoReal    = null;

function inicializarCodigoInvitacion() {
  _codigoReal    = null;
  _codigoVisible = false;
  cargarCodigoDesdeBackend();
}

async function cargarCodigoDesdeBackend() {
  try {
    const data = await apiCall('/codigo-invitacion?equipoId=' + (CURRENT_USER?.equipoId || ''));
    if (data && data.codigo) { _codigoReal = data.codigo; actualizarDisplayCodigo(); }
  } catch(e) {
    _codigoReal = null;
    actualizarDisplayCodigo();
  }
}

function actualizarDisplayCodigo() {
  const displayEl = document.getElementById('inv-codigo-display');
  const linkEl    = document.getElementById('inv-link-display');
  const icoEl     = document.getElementById('inv-toggle-ico');
  if (!displayEl) return;
  if (!_codigoReal) {
    displayEl.textContent = 'Sin código aún';
    if (linkEl) linkEl.textContent = '—';
    return;
  }
  if (_codigoVisible) {
    displayEl.textContent = _codigoReal;
    if (linkEl) linkEl.textContent = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
    if (icoEl)  icoEl.textContent  = 'visibility_off';
  } else {
    displayEl.textContent = '•'.repeat(_codigoReal.length);
    if (linkEl) linkEl.textContent = '••••••••••••••••••••••••';
    if (icoEl)  icoEl.textContent  = 'visibility';
  }
}

function toggleCodigoVisible() {
  if (!_codigoReal) return;
  _codigoVisible = !_codigoVisible;
  actualizarDisplayCodigo();
}

function copiarCodigo() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  navigator.clipboard.writeText(_codigoReal)
    .then(() => mostrarToastGuardado('✅ Código copiado'))
    .catch(() => prompt('Copia este código:', _codigoReal));
}

function copiarLink() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  const url = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
  navigator.clipboard.writeText(url)
    .then(() => mostrarToastGuardado('✅ Link copiado'))
    .catch(() => prompt('Copia este link:', url));
}

function compartirLink() {
  if (!_codigoReal) { mostrarToastGuardado('⚠️ No hay código disponible'); return; }
  const url = 'https://app.quindesvolcanicos.com?invite=' + _codigoReal;
  if (navigator.share) {
    navigator.share({ title: 'Quindes Volcánicos — Invitación', text: '¡Te invito a unirte al equipo Quindes Volcánicos! Usa este link para crear tu perfil:', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => mostrarToastGuardado('✅ Link copiado'))
      .catch(() => prompt('Copia este link:', url));
  }
}

// ── Tema ──────────────────────────────────────────────────────
function setTheme(tema) {
  guardarAjuste('tema', tema);
  aplicarTema(tema);
  marcarChipActivo('apr-theme-chips', tema);
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1-l);
  const f = n => l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
  return '#' + [f(0),f(8),f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function aplicarColorPrimario(hex, conFade = false) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const [h, s, l] = hexToHsl(hex);
  const root = document.documentElement;
  const appEl = document.getElementById('appContent');

  if (conFade && appEl && appEl.classList.contains('visible')) {
    appEl.classList.add('color-transition-out');
    setTimeout(() => {
      _aplicarTokensColor(hex, h, s, l, root);
      root.dataset.colorPrimario = hex;
      appEl.classList.remove('color-transition-out');
    }, 250);
    return;
  }
  _aplicarTokensColor(hex, h, s, l, root);
  root.dataset.colorPrimario = hex;
}

function _aplicarTokensColor(hex, h, s, l, root) {

  // Acento principal y variante oscura
  const accent        = hex;
  const accent2       = hslToHex(h, s, Math.max(l - 10, 10));

  // Gradiente botones primarios
  const gradFrom      = hslToHex(h, Math.min(s + 5, 100), Math.min(l + 6, 90));
  const gradTo        = hslToHex(h, s, Math.max(l - 14, 10));

  // Tokens con opacidad (como rgba)
  const toRgb = hx => [parseInt(hx.slice(1,3),16), parseInt(hx.slice(3,5),16), parseInt(hx.slice(5,7),16)];
  const [ar, ag, ab] = toRgb(accent);

  // Dark mode tokens
  const bgDark        = hslToHex(h, Math.min(s, 40), 8);
  const cardDark      = hslToHex(h, Math.min(s, 35), 11);
  const card2Dark     = hslToHex(h, Math.min(s, 30), 14);

  // Light mode tokens
  const bgLight       = hslToHex(h, Math.min(s, 30), 97);
  const cardLight     = '#ffffff';
  const card2Light    = hslToHex(h, Math.min(s, 25), 95);
  const accentLight   = hslToHex(h, Math.min(s, 80), Math.max(l - 8, 25));
  const accent2Light  = hslToHex(h, Math.min(s, 80), Math.max(l - 14, 18));

  const isDark = root.classList.contains('theme-dark') ||
    (!root.classList.contains('theme-light') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Color "ok" — complementario armónico (120° de distancia)
  const hOk = (h + 120) % 360;

  if (isDark) {
    root.style.setProperty('--badge-ok-color',  hslToHex(hOk, 70, 72));
    root.style.setProperty('--badge-ok-bg',     `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,70,72).slice(1+i*2,3+i*2),16)).join(',')},0.16)`);
    root.style.setProperty('--badge-ok-border', `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,70,72).slice(1+i*2,3+i*2),16)).join(',')},0.35)`);
    root.style.setProperty('--text2',                hslToHex(h, Math.min(s, 35), 63));
    root.style.setProperty('--text3',                hslToHex(h, Math.min(s, 28), 45));
    root.style.setProperty('--text4',                hslToHex(h, Math.min(s, 22), 35));
    root.style.setProperty('--label',                hslToHex(h, Math.min(s, 35), 63));
    root.style.setProperty('--accent',               accent);
    root.style.setProperty('--accent2',              accent2);
    root.style.setProperty('--accent-dim',           `rgba(${ar},${ag},${ab},0.18)`);
    root.style.setProperty('--accent-gradient-from', gradFrom);
    root.style.setProperty('--accent-gradient-to',   gradTo);
    root.style.setProperty('--bg',                   bgDark);
    root.style.setProperty('--card',                 cardDark);
    root.style.setProperty('--card2',                card2Dark);
    root.style.setProperty('--border',               `rgba(${ar},${ag},${ab},0.18)`);
    root.style.setProperty('--border2',              `rgba(${ar},${ag},${ab},0.12)`);
    root.style.setProperty('--border3',              `rgba(${ar},${ag},${ab},0.07)`);
    root.style.setProperty('--chip-bg',              `rgba(${ar},${ag},${ab},0.08)`);
    root.style.setProperty('--stat-bg',              `rgba(${ar},${ag},${ab},0.06)`);
    root.style.setProperty('--section-hd',           `rgba(${ar},${ag},${ab},0.05)`);
    root.style.setProperty('--header-bg',            `rgba(${ar},${ag},${ab},0.10)`);
  } else {
    const [alr, alg, alb] = toRgb(accentLight);
    root.style.setProperty('--badge-ok-color',  hslToHex(hOk, 60, 35));
    root.style.setProperty('--badge-ok-bg',     `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,60,35).slice(1+i*2,3+i*2),16)).join(',')},0.12)`);
    root.style.setProperty('--badge-ok-border', `rgba(${[...Array(3)].map((_,i) => parseInt(hslToHex(hOk,60,35).slice(1+i*2,3+i*2),16)).join(',')},0.30)`);
    root.style.setProperty('--text2',                hslToHex(h, Math.min(s, 50), 38));
    root.style.setProperty('--text3',                hslToHex(h, Math.min(s, 40), 55));
    root.style.setProperty('--text4',                hslToHex(h, Math.min(s, 30), 69));
    root.style.setProperty('--label',                hslToHex(h, Math.min(s, 40), 55));
    root.style.setProperty('--accent',               accentLight);
    root.style.setProperty('--accent2',              accent2Light);
    root.style.setProperty('--accent-dim',           `rgba(${alr},${alg},${alb},0.10)`);
    root.style.setProperty('--accent-gradient-from', hslToHex(h, Math.min(s+5,100), Math.max(l-6,20)));
    root.style.setProperty('--accent-gradient-to',   hslToHex(h, s, Math.max(l-18,12)));
    root.style.setProperty('--bg',                   bgLight);
    root.style.setProperty('--card',                 cardLight);
    root.style.setProperty('--card2',                card2Light);
    root.style.setProperty('--border',               `rgba(${alr},${alg},${alb},0.15)`);
    root.style.setProperty('--border2',              `rgba(${alr},${alg},${alb},0.10)`);
    root.style.setProperty('--border3',              `rgba(${alr},${alg},${alb},0.06)`);
    root.style.setProperty('--chip-bg',              `rgba(${alr},${alg},${alb},0.07)`);
    root.style.setProperty('--stat-bg',              `rgba(${alr},${alg},${alb},0.05)`);
    root.style.setProperty('--section-hd',           `rgba(${alr},${alg},${alb},0.04)`);
    root.style.setProperty('--header-bg',            `rgba(${alr},${alg},${alb},0.08)`);
  }

  }

function aplicarTema(tema) {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  if (tema === 'light') root.classList.add('theme-light');
  if (tema === 'dark')  root.classList.add('theme-dark');
  // Re-derivar tokens si ya hay un color primario guardado
  const colorGuardado = root.dataset.colorPrimario;
  if (colorGuardado) aplicarColorPrimario(colorGuardado, true);
}

function marcarChipActivo(containerId, valor) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.apr-chip').forEach(btn => {
    const isActive = btn.dataset.theme === valor || btn.dataset.val === valor;
    btn.classList.toggle('active', isActive);
  });
}

// ── Tamaño de texto ───────────────────────────────────────────
let _tamanoOffset = 0;

function aplicarTamanoTexto(offset) {
  _tamanoOffset = offset;
  const pct = 100 + (offset * 5);
  document.documentElement.style.fontSize = pct + '%';
  const el = document.getElementById('apr-size-val');
  if (el) el.textContent = pct + '%';
}

function cambiarTamanoTexto(delta) {
  const a = cargarAjustes();
  const actual = a.tamanoTexto || 0;
  const nuevo  = Math.max(-2, Math.min(4, actual + delta));
  guardarAjuste('tamanoTexto', nuevo);
  aplicarTamanoTexto(nuevo);
}

// ── Alto contraste ────────────────────────────────────────────
function toggleAltoContraste() {
  const a = cargarAjustes();
  const nuevo = !a.altoContraste;
  guardarAjuste('altoContraste', nuevo);
  document.documentElement.classList.toggle('high-contrast', nuevo);
  sincronizarToggle('toggle-alto-contraste', nuevo);
}

// ── Privacidad ────────────────────────────────────────────────
const PRIV_DEFAULTS = {
  perfilVisible:         true,
  mostrarEstadisticas:   true,
  seccionContacto:       true,
  mostrarEmail:          true,
  mostrarTelefono:       true,
  seccionPersonales:     true,
  mostrarDocumento:      false,
  mostrarNacionalidad:   true,
  mostrarCumple:         false,
  mostrarEdad:           false,
  seccionSalud:          false,
  mostrarEmergencia:     false,
  mostrarGrupoSanguineo: false,
  mostrarAlergias:       false,
  mostrarDieta:          false,
  mostrarPruebaFisica:   false,
};

function getPriv(key) {
  const a = cargarAjustes();
  const priv = a.privacidad || {};
  return priv[key] !== undefined ? priv[key] : (PRIV_DEFAULTS[key] !== undefined ? PRIV_DEFAULTS[key] : true);
}

function setPriv(key, val) {
  const a = cargarAjustes();
  const priv = a.privacidad || {};
  priv[key] = val;
  a.privacidad = priv;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
}

function togglePrivacidad(key) {
  const nuevo = !getPriv(key);
  setPriv(key, nuevo);
  sincronizarToggle('toggle-priv-' + key, nuevo);
  if (key === 'perfilVisible') actualizarVisibilidadSeccionesPrivacidad(nuevo);
}

function actualizarVisibilidadSeccionesPrivacidad(perfilVisible) {
  ['priv-bloque-estadisticas','priv-bloque-contacto','priv-bloque-personales','priv-bloque-salud'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.classList.toggle('is-disabled', !perfilVisible);
  });
}

function toggleSeccionPriv(seccion) {
  const key   = 'seccion' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
  const nuevo = !getPriv(key);
  setPriv(key, nuevo);
  sincronizarToggle('toggle-priv-seccion-' + seccion, nuevo);
  const items = document.getElementById('priv-items-' + seccion);
  if (items) {
    items.classList.toggle('is-disabled', !nuevo);
  }
}

// ── Notificaciones ────────────────────────────────────────────
function toggleNotif(key) {
  const a = cargarAjustes();
  const notifs = a.notificaciones || {};
  notifs[key] = notifs[key] !== undefined ? !notifs[key] : false;
  a.notificaciones = notifs;
  localStorage.setItem(AJUSTES_KEY, JSON.stringify(a));
  sincronizarToggle('toggle-notif-' + key, notifs[key]);
}

async function solicitarPermisoPush() {
  if (!('Notification' in window)) { mostrarToastGuardado('⚠️ Tu navegador no soporta notificaciones'); return; }
  const permiso = await Notification.requestPermission();
  if (permiso === 'granted') {
    guardarAjuste('pushActivo', true);
    document.getElementById('notif-push-banner')?.style.setProperty('display', 'none', 'important');
    mostrarToastGuardado('✅ Notificaciones push activadas');
  } else {
    mostrarToastGuardado('⚠️ Permiso denegado');
  }
}

function verificarEstadoPush() {
  const banner = document.getElementById('notif-push-banner');
  if (!banner) return;
  if (!('Notification' in window)) { banner.style.display = 'none'; return; }
  if (Notification.permission === 'granted') { banner.style.display = 'none'; return; }
  banner.style.display = 'flex';
}

// ── Acerca de ─────────────────────────────────────────────────
function abrirFeedback()   { window.open('mailto:victor@quindesvolcanicos.com?subject=Feedback%20Quindes%20App', '_blank'); }
function abrirDonaciones() { window.open('https://ko-fi.com', '_blank'); }
function abrirTerminos()   { window.open('https://quindesvolcanicos.com/terminos', '_blank'); }

// ── Admin ─────────────────────────────────────────────────────
function actualizarSeccionAdmin() {
  const adminSection = document.getElementById('apariencia-admin-section');
  if (adminSection) adminSection.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'block' : 'none';

  const rowInvitacion = document.querySelector('[onclick="navegarSeccion(\'invitacion\')"]')?.closest('.sec-row');  if (rowInvitacion) rowInvitacion.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';

  const rowLiga = document.getElementById('row-mi-liga');
  if (rowLiga) rowLiga.style.display = CURRENT_USER?.rolApp === 'Admin' ? 'flex' : 'none';
}

function cambiarLogoEquipo() { mostrarToastGuardado('🚧 Próximamente'); }
const COLOR_PICKER_PRESETS = [
  '#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#14b8a6','#f43f5e','#a855f7','#64748b',
];

let _cpColorActual = '#ef4444';
let _cpColorOriginal = '#ef4444';

function abrirColorPicker() {
  _cpColorOriginal = document.documentElement.dataset.colorPrimario || '#ef4444';
  _cpColorActual   = _cpColorOriginal;

  // Renderizar swatches
  const wrap = document.getElementById('color-picker-swatches');
  wrap.innerHTML = COLOR_PICKER_PRESETS.map(c => `
    <button class="color-swatch-btn ${c === _cpColorActual ? 'selected' : ''}"
      style="background:${c}"
      onclick="seleccionarColorPreset('${c}')"
      data-color="${c}">
    </button>
  `).join('');

  // Sincronizar custom picker
  const input = document.getElementById('color-picker-input');
  input.value = _cpColorActual;
  document.getElementById('color-picker-custom-preview').style.background = _cpColorActual;
  document.getElementById('color-picker-custom-hex').textContent = _cpColorActual;

  input.oninput = (e) => {
    _cpColorActual = e.target.value;
    document.getElementById('color-picker-custom-preview').style.background = _cpColorActual;
    document.getElementById('color-picker-custom-hex').textContent = _cpColorActual;
    actualizarSwatchesSeleccion(_cpColorActual);
    aplicarColorPrimario(_cpColorActual);
  };

  mostrarFooterColorPicker();

  const overlay = document.getElementById('color-picker-overlay');
  const sheet   = document.getElementById('color-picker-sheet');
  overlay.style.pointerEvents = 'all';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
    sheet.classList.add('visible');
  }));
}

function seleccionarColorPreset(color) {
  _cpColorActual = color;
  actualizarSwatchesSeleccion(color);
  document.getElementById('color-picker-input').value = color;
  document.getElementById('color-picker-custom-preview').style.background = color;
  document.getElementById('color-picker-custom-hex').textContent = color;
  aplicarColorPrimario(color);
}

function actualizarSwatchesSeleccion(color) {
  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
}

function mostrarFooterColorPicker() {
  document.getElementById('color-picker-footer').innerHTML = `
    <button class="btn-cancel" onclick="cerrarColorPicker()">Cancelar</button>
    <button class="btn-save"   onclick="guardarColorPrimario()">Aplicar</button>
  `;
}

function cerrarColorPicker(e) {
  if (e && e.target !== document.getElementById('color-picker-overlay')) return;
  // Revertir preview si cancela
  aplicarColorPrimario(_cpColorOriginal);
  const overlay = document.getElementById('color-picker-overlay');
  const sheet   = document.getElementById('color-picker-sheet');
  overlay.classList.remove('visible');
  sheet.classList.remove('visible');
  setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 300);
}

async function guardarColorPrimario() {
  const equipoId = CURRENT_USER?.equipoId;
  if (!equipoId) return;

  // Mostrar spinner
  document.getElementById('color-picker-footer').innerHTML = `
    <div class="color-picker-saving">
      <div class="color-picker-spinner"></div>
      Guardando color…
    </div>
  `;

  try {
    await apiCall(`/equipo/${equipoId}/color`, 'PUT', { color: _cpColorActual });
    // Actualizar swatch en la fila de ajustes
    const swatch = document.getElementById('apr-color-swatch');
    if (swatch) swatch.style.background = _cpColorActual;
    // Cerrar y confirmar
    const overlay = document.getElementById('color-picker-overlay');
    const sheet   = document.getElementById('color-picker-sheet');
    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    setTimeout(() => {
      overlay.style.pointerEvents = 'none';
      mostrarToastGuardado('Color actualizado ✓');
    }, 300);
  } catch(e) {
    mostrarFooterColorPicker();
    mostrarToastGuardado('Error al guardar el color');
  }
}

// ── Mi Liga ───────────────────────────────────────────────────
let _ligaData = null;

async function cargarMiLiga({ render = true } = {}) {
  const ligaId = CURRENT_USER?.ligaId;
  if (!ligaId) return;
  try {
    const data = await apiCall(`/liga/${ligaId}`, 'GET');
    _ligaData = data;
    if (render) renderMiLiga(data);
  } catch(e) {
    console.error('Error cargando liga:', e);
  }
}

function renderMiLiga(data) {
  const nombreEl = document.getElementById('liga-nombre');
  if (nombreEl) {
    nombreEl.textContent = data.nombre || '—';
    nombreEl.classList.add('liga-nombre-editable');
    nombreEl.onclick = () => editarNombreLiga(data);
  }

  const lista = document.getElementById('liga-equipos-list');
  if (!lista) return;

  if (!data.equipos || data.equipos.length === 0) {
    lista.innerHTML = '<div class="sec-row"><div class="sec-row-body"><span class="sec-row-label equipo-empty-label">No hay equipos aún</span></div></div>';    return;
  }

  lista.innerHTML = data.equipos.map((eq) => {
    const esActivo = eq.id === CURRENT_USER?.equipoId;
    return `
      <div class="equipo-item">
        <div class="equipo-header">
          <span class="equipo-nombre ${esActivo ? 'equipo-nombre--activo' : ''}"
                onclick="editarNombreEquipo(${JSON.stringify(eq).replace(/"/g,'&quot;')})">
            ${eq.nombre}
            ${esActivo ? '<span class="equipo-activo-badge">· Activo</span>' : ''}
          </span>
          <button class="equipo-btn-delete" onclick="confirmarEliminarEquipo('${eq.id}','${eq.nombre}')">
            <span class="material-icons">delete</span>
          </button>
        </div>
        <div class="equipo-footer">
          <span class="equipo-codigo">
            🔑 <strong>${eq.codigo || '—'}</strong>
            <span class="equipo-codigo-sep">·</span>
            ${eq.usosMax ? `${eq.usosActuales}/${eq.usosMax} usos` : `${eq.usosActuales} usos`}
          </span>
          ${!esActivo ? `<button class="equipo-btn-gestionar" onclick="switchearEquipo('${eq.id}','${eq.nombre}')">Gestionar</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function editarNombreLiga(data) {
  abrirEditSheetGenerico('Nombre de la liga', data.nombre, async (nuevo) => {
    await apiCall(`/liga/${data.id}/nombre`, 'PUT', { nombre: nuevo });
    data.nombre = nuevo;
    renderMiLiga(data);
    mostrarToastGuardado('✅ Nombre de liga actualizado');
  });
}

function editarNombreEquipo(eq) {
  abrirEditSheetGenerico('Nombre del equipo', eq.nombre, async (nuevo) => {
    await apiCall(`/equipo/${eq.id}/nombre`, 'PUT', { nombre: nuevo });
    eq.nombre = nuevo;
    renderMiLiga(_ligaData);
    mostrarToastGuardado('✅ Nombre de equipo actualizado');
  });
}

function abrirEditSheetGenerico(label, valorActual, onGuardar) {
  const overlay = document.createElement('div');
  overlay.className = 'edit-field-overlay';
  overlay.innerHTML = `
    <div class="edit-field-sheet" id="edit-generic-sheet">
      <div class="edit-field-handle"></div>
      <div class="edit-field-header">
        <span class="edit-field-label">${label}</span>
        <button class="edit-field-close" onclick="this.closest('.edit-field-overlay').remove()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="edit-field-body">
        <input id="edit-generic-input" type="text" class="edit-field-input" value="${valorActual || ''}" placeholder="${label}">
      </div>
      <div style="padding:12px 0 0;">
        <button id="edit-generic-save" style="width:100%;padding:17px;border-radius:16px;border:none;background:var(--accent);color:#fff;font-size:16px;font-weight:700;font-family:var(--font);cursor:pointer;-webkit-tap-highlight-color:transparent;">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    document.getElementById('edit-generic-sheet')?.classList.add('visible');
  });
  const input = document.getElementById('edit-generic-input');
  setTimeout(() => input?.focus(), 300);
  document.getElementById('edit-generic-save').onclick = async () => {
    const nuevo = input.value.trim();
    if (!nuevo) { mostrarToastGuardado('⚠️ El nombre no puede estar vacío'); return; }
    if (nuevo === valorActual) { overlay.remove(); return; }
    try {
      await onGuardar(nuevo);
    } catch(e) {
      mostrarToastGuardado('❌ Error al guardar');
    }
    overlay.remove();
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function switchearEquipo(equipoId, nombreEquipo) {
  CURRENT_USER.equipoId = equipoId;
  localStorage.setItem('quindes_equipo_activo', equipoId);
  mostrarToastGuardado(`✅ Ahora gestionás "${nombreEquipo}"`);
  renderMiLiga(_ligaData);
}

// ── Wizard Crear Equipo ───────────────────────────────────────
let _wizEquipo = { nombre: '', categoria: '', logoBase64: null };
let _wizEquipoPaso = 1;

function abrirCrearEquipo() {
  _wizEquipo = { nombre: '', categoria: '', logoBase64: null };
  _wizEquipoPaso = 1;

  const overlay = document.createElement('div');
  overlay.id = 'wiz-equipo-overlay';
  overlay.className = 'wiz-equipo-overlay';
  overlay.innerHTML = `
    <header class="wiz-equipo-header">
      <button onclick="cerrarWizEquipo()" class="wiz-eq-close-btn">
        <span class="material-icons">close</span>
      </button>
      <span id="wiz-eq-paso-label" class="wiz-eq-paso-label">Paso 1 de 3</span>
      <div class="wiz-equipo-progress">
        <div id="wiz-eq-progress" class="wiz-equipo-progress-bar" style="width:33%;"></div>
      </div>
    </header>
    <div id="wiz-eq-contenido" class="wiz-equipo-contenido"></div>
    <div class="wiz-equipo-footer">
      <button id="wiz-eq-btn-back" onclick="wizEquipoPasoAnterior()" class="wiz-eq-btn-back" style="display:none;">Atrás</button>
      <button id="wiz-eq-btn-next" onclick="wizEquipoPasoSiguiente()" class="wiz-eq-btn-next">Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
  }));
  renderWizEquipoPaso(1);
}

function cerrarWizEquipo() {
  const overlay = document.getElementById('wiz-equipo-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 350);
}

function renderWizEquipoPaso(paso) {
  _wizEquipoPaso = paso;
  const contenido = document.getElementById('wiz-eq-contenido');
  const btnBack   = document.getElementById('wiz-eq-btn-back');
  const btnNext   = document.getElementById('wiz-eq-btn-next');
  const pasoLabel = document.getElementById('wiz-eq-paso-label');
  const progress  = document.getElementById('wiz-eq-progress');
  if (!contenido) return;

  if (btnBack) btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = `Paso ${paso} de 3`;
  if (progress) progress.style.width = (paso / 3 * 100) + '%';
  if (btnNext) btnNext.textContent = paso === 4 ? 'Crear equipo' : 'Continuar';

if (paso === 1) {
    contenido.innerHTML = `
      <div class="wiz-emoji">🛼</div>
      <h2 class="wiz-title">¿Cómo se llama tu equipo?</h2>
      <p class="wiz-desc">El nombre que verán todas las integrantes.</p>
      <div class="wiz-content">
        <input id="wiz-eq-nombre" type="text" placeholder="Nombre del equipo" value="${_wizEquipo.nombre}"
          class="reg-input wiz-big-input"
          oninput="_wizEquipo.nombre=this.value"
          onkeydown="if(event.key==='Enter') wizEquipoPasoSiguiente()">
      </div>
    `;
    setTimeout(() => document.getElementById('wiz-eq-nombre')?.focus(), 100);
  }

  if (paso === 2) {
    contenido.innerHTML = `
      <div class="wiz-emoji">🏆</div>
      <h2 class="wiz-title">¿Qué categoría?</h2>
      <p class="wiz-desc">Seleccioná la categoría en la que compite tu equipo.</p>
      <div class="wiz-content">
        <div class="wiz-chips">
          ${['A','B','C'].map(cat => `
            <button onclick="seleccionarCategoriaEquipo('${cat}')"
              id="wiz-eq-cat-${cat}"
              class="chip ${_wizEquipo.categoria === cat ? 'chip-active' : 'chip-inactive'}">
              ${cat}
            </button>`).join('')}
        </div>
      </div>
    `;
  }

if (paso === 3) {
    const preview = _wizEquipo.logoBase64
      ? `<img src="${_wizEquipo.logoBase64}" class="wiz-liga-avatar-img">`
      : `<span class="material-icons wiz-liga-avatar-ph">add_photo_alternate</span>`;
    contenido.innerHTML = `
      <div class="wiz-emoji">🎨</div>
      <h2 class="wiz-title">¡Poné personalidad!</h2>
      <p class="wiz-desc">Subí el logo de tu equipo. Podés cambiarlo después.</p>
      <div class="wiz-content">
        <label class="wiz-liga-avatar" id="wiz-eq-logo-label">
          ${preview}
          <input type="file" accept="image/*" style="display:none;" onchange="previewLogoEquipo(this)">
        </label>
        <p class="reg-note">Opcional — podés saltarte este paso</p>
      </div>
    `;
    if (btnNext) btnNext.textContent = 'Crear equipo 🛼';
  }
}

function seleccionarCategoriaEquipo(cat) {
  _wizEquipo.categoria = cat;
  ['A','B','C'].forEach(c => {
    const btn = document.getElementById('wiz-eq-cat-' + c);
    if (!btn) return;
    btn.classList.toggle('chip-active',   c === cat);
    btn.classList.toggle('chip-inactive', c !== cat);
  });
}

function previewLogoEquipo(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizEquipo.logoBase64 = e.target.result;
    const label = document.getElementById('wiz-eq-logo-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewLogoEquipo(this)">`;
  };
  reader.readAsDataURL(file);
}

function wizEquipoPasoSiguiente() {
  if (_wizEquipoPaso === 1) {
    if (!_wizEquipo.nombre.trim()) { mostrarToastGuardado('⚠️ Escribí el nombre del equipo'); return; }
  }
  if (_wizEquipoPaso === 2) {
    if (!_wizEquipo.categoria) { mostrarToastGuardado('⚠️ Seleccioná una categoría'); return; }
  }
  if (_wizEquipoPaso === 3) {
    crearEquipo(); return;
  }
  renderWizEquipoPaso(_wizEquipoPaso + 1);
}

function wizEquipoPasoAnterior() {
  if (_wizEquipoPaso > 1) renderWizEquipoPaso(_wizEquipoPaso - 1);
}

async function crearEquipo() {
  const btnNext = document.getElementById('wiz-eq-btn-next');
  if (btnNext) { btnNext.disabled = true; btnNext.textContent = 'Creando…'; }
  try {
    const result = await apiCall('/crear-equipo', 'POST', {
      nombre:      _wizEquipo.nombre.trim(),
      ligaId:      CURRENT_USER?.ligaId,
      categoria:   _wizEquipo.categoria,
      logoBase64:  _wizEquipo.logoBase64,
      email:       CURRENT_USER?.email,
    });
    if (!result?.ok) throw new Error('Error creando equipo');
    _ligaData.equipos.push(result.equipo);
    cerrarWizEquipo();
    setTimeout(() => {
      renderMiLiga(_ligaData);
      mostrarEquipoCreado(result.equipo);
    }, 400);
  } catch(e) {
    mostrarToastGuardado('❌ Error al crear el equipo');
    if (btnNext) { btnNext.disabled = false; btnNext.textContent = 'Crear equipo'; }
    console.error(e);
  }
}

function mostrarEquipoCreado(equipo) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-fullscreen-success';
  overlay.innerHTML = `
    <div style="text-align:center;max-width:320px;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:64px;animation:wiz-fade-up 0.5s ease 0.1s both;">🎉</div>
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0;animation:wiz-fade-up 0.5s ease 0.2s both;">¡Equipo creado!</h2>
      <p style="font-size:15px;color:var(--text2);line-height:1.6;margin:0;animation:wiz-fade-up 0.5s ease 0.3s both;">
        <strong style="color:var(--text);">${equipo.nombre}</strong> está listo. Ahora puedes invitar integrantes compartiendo el código:
      </p>
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:16px 24px;animation:wiz-fade-up 0.5s ease 0.4s both;">
        <p style="font-size:12px;color:var(--text3);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Código de invitación</p>
        <p id="equipo-creado-codigo" style="font-size:28px;font-weight:900;color:var(--accent);margin:0;letter-spacing:0.1em;">${equipo.codigo}</p>
        <button id="equipo-creado-copiar" style="margin-top:10px;padding:8px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--card2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;">
          Copiar código
        </button>
      </div>
      <p style="font-size:12px;color:var(--text3);margin:0;animation:wiz-fade-up 0.5s ease 0.5s both;">Puedes gestionar este equipo desde Mi Liga en Ajustes.</p>
      <button id="equipo-creado-listo"
        style="margin-top:8px;padding:14px 32px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:15px;font-weight:700;cursor:pointer;animation:wiz-fade-up 0.5s ease 0.6s both;width:100%;">
        ¡Listo!
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.classList.add('visible'); }));

  document.getElementById('equipo-creado-listo').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 350);
  };

  document.getElementById('equipo-creado-copiar').onclick = () => {
    navigator.clipboard.writeText(equipo.codigo).then(() => {
      mostrarToastGuardado('✅ Código copiado');
    }).catch(() => {
      mostrarToastGuardado('❌ No se pudo copiar');
    });
  };
}

function mostrarModalConfirmacion({ emoji, titulo, mensaje, labelConfirmar, onConfirmar }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-confirm-overlay';
  overlay.innerHTML = `
    <div class="modal-confirm-sheet" id="modal-confirm-sheet">
      <div class="modal-confirm-emoji">${emoji}</div>
      <h2 class="modal-confirm-title">${titulo}</h2>
      <p class="modal-confirm-msg">${mensaje}</p>
      <button id="modal-confirm-btn" class="modal-confirm-btn-primary">${labelConfirmar}</button>
      <button id="modal-cancel-btn" class="modal-confirm-btn-secondary">Cancelar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const sheet = document.getElementById('modal-confirm-sheet');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible');
    sheet.classList.add('visible');
  }));
  const cerrar = () => {
    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    setTimeout(() => overlay.remove(), 280);
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(); });
  document.getElementById('modal-cancel-btn').onclick = cerrar;
  document.getElementById('modal-confirm-btn').onclick = () => { cerrar(); setTimeout(onConfirmar, 350); };
}

function confirmarEliminarEquipo(equipoId, nombreEquipo) {
  mostrarModalConfirmacion({
    emoji: '⚠️',
    titulo: `¿Eliminar "${nombreEquipo}"?`,
    mensaje: 'Esto borrará todos sus miembros, perfiles y datos. Esta acción no se puede deshacer.',
    labelConfirmar: 'Sí, eliminar equipo',
    onConfirmar: () => eliminarEquipo(equipoId, nombreEquipo),
  });
}

async function eliminarEquipo(equipoId, nombreEquipo) {
  const item = document.querySelector(`.equipo-btn-delete[onclick*="${equipoId}"]`)?.closest('.equipo-item');
  if (item) {
    item.classList.add('is-disabled');
    const footer = item.querySelector('.equipo-footer');
    if (footer) footer.innerHTML = '<span class="sec-val-saving">Eliminando…</span>';
  }
  try {
    await apiCall(`/equipo/${equipoId}`, 'DELETE');
    _ligaData.equipos = _ligaData.equipos.filter(e => e.id !== equipoId);
    renderMiLiga(_ligaData);
    mostrarToastGuardado(`✅ Equipo "${nombreEquipo}" eliminado`);
  } catch(e) {
    mostrarToastGuardado('❌ Error al eliminar el equipo');
    if (item) {
      item.classList.remove('is-disabled');
      renderMiLiga(_ligaData);
    }
    console.error(e);
  }
}

function confirmarEliminarLiga() {
  const nombre = _ligaData?.nombre || 'la liga';
  mostrarModalConfirmacion({
    emoji: '⚠️',
    titulo: `¿Eliminar "${nombre}" y TODOS sus datos?`,
    mensaje: 'Esto borrará equipos, miembros, perfiles, entrenamientos y toda la información. Esta acción es IRREVERSIBLE.',
    labelConfirmar: 'Sí, eliminar liga para siempre',
    onConfirmar: () => eliminarLiga(),
  });
}

async function eliminarLiga() {
  try {
    await apiCall(`/liga/${CURRENT_USER?.ligaId}`, 'DELETE');
    mostrarToastGuardado('Liga eliminada');
    setTimeout(() => cerrarSesion(), 1500);
  } catch(e) {
    mostrarToastGuardado('❌ Error al eliminar la liga');
    console.error(e);
  }
}

// ── Helper toggle ─────────────────────────────────────────────
function sincronizarToggle(wrapperId, isOn) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  const btn = wrap.querySelector('.toggle-btn');
  if (!btn) return;
  btn.classList.toggle('toggle-on',  isOn);
  btn.classList.toggle('toggle-off', !isOn);
  btn.setAttribute('aria-pressed', String(isOn));
}

// ── Bottom Nav ────────────────────────────────────────────────
let _navSeccionActual = 'ajustes';

function navIr(seccion) {
  if (_navSeccionActual === seccion) return;
  _navSeccionActual = seccion;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
  const navEl = document.getElementById('nav-' + seccion);
  if (navEl) { void navEl.offsetWidth; navEl.classList.add('nav-active'); }
  // TODO: mostrar sección correspondiente
}
// ── Wizard Crear Liga ─────────────────────────────────────────
let _wizLiga = { nombreLiga: '', ligaImagenBase64: null, nombreEquipo: '', categoria: '', logoBase64: null };
let _wizLigaPaso = 1;
const _WIZ_LIGA_TOTAL = 9;

function mostrarWizardLiga() {
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  _wizLiga = { nombreLiga: '', ligaImagenBase64: null, nombreEquipo: '', categoria: '', logoBase64: null, pais: '', ciudad: '', anioFundacion: '', descripcion: '', contacto: '', contactoCodigo: '🇪🇨 +593', nombre: '', pronombres: [], paisPerfil: '', codigoPais: '', telefono: '', fechaNacimiento: '', nombreDerby: '', numeroDerby: '', rolJugadorx: '', asisteSemana: '', alergias: '', dieta: '', contactoEmergencia: '', fotoBase64: null };
  _wizLigaPaso = 0;

  const overlay = document.createElement('div');
  overlay.id = 'wiz-liga-overlay';
  overlay.className = 'wiz-equipo-overlay';
  overlay.innerHTML = `
    <header class="wiz-equipo-header">
      <button onclick="cerrarWizLiga()" class="wiz-eq-close-btn">
        <span class="material-icons">close</span>
      </button>
      <span id="wiz-liga-paso-label" class="wiz-eq-paso-label">Paso 1 de ${_WIZ_LIGA_TOTAL}</span>
      <div class="wiz-equipo-progress">
        <div id="wiz-liga-progress" class="wiz-equipo-progress-bar" style="width:${100/_WIZ_LIGA_TOTAL}%;"></div>
      </div>
    </header>
    <div id="wiz-liga-contenido" class="wiz-equipo-contenido"></div>
    <div class="wiz-equipo-footer">
      <button id="wiz-liga-btn-back" onclick="wizLigaPasoAnterior()" class="wiz-eq-btn-back" style="display:none;">Atrás</button>
      <button id="wiz-liga-btn-next" onclick="wizLigaPasoSiguiente()" class="wiz-eq-btn-next">Continuar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
  renderWizLigaPaso(0);
}

function cerrarWizLiga() {
  const overlay = document.getElementById('wiz-liga-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 350);
  if (!window._enFlujoCrearLiga) sessionStorage.removeItem('_enFlujoCrearLiga');
}

function wizLigaIntroStart() {
  const contenido = document.querySelector('.wiz-equipo-contenido');
  if (contenido) contenido.innerHTML = '';
  renderWizLigaPaso(1);
}

function renderWizLigaPaso(paso) {
  _wizLigaPaso = paso;
  const contenido  = document.getElementById('wiz-liga-contenido');
  const btnBack    = document.getElementById('wiz-liga-btn-back');
  const btnNext    = document.getElementById('wiz-liga-btn-next');
  const pasoLabel  = document.getElementById('wiz-liga-paso-label');
  const progress   = document.getElementById('wiz-liga-progress');
  if (!contenido) return;

  // Paso 0 es el login con Google — ocultar footer y progress
  const esLogin = paso === 0;
  const footer  = document.querySelector('#wiz-liga-overlay .wiz-equipo-footer');
  if (footer)    footer.style.display  = esLogin ? 'none' : '';
  if (btnBack)   btnBack.style.display = paso > 1 ? 'block' : 'none';
  if (pasoLabel) pasoLabel.textContent = esLogin ? 'Paso 1 de ' + _WIZ_LIGA_TOTAL : `Paso ${paso} de ${_WIZ_LIGA_TOTAL}`;
  if (progress)  progress.style.width  = esLogin ? '0%' : (paso / _WIZ_LIGA_TOTAL * 100) + '%';
  if (btnNext)   btnNext.textContent   = paso === _WIZ_LIGA_TOTAL ? 'Crear todo 🛼' : 'Continuar';

  if (paso === 0) {
    contenido.innerHTML = `
      <div class="wiz-intro-bg">
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-1"></div>
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-2"></div>
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-3"></div>
      </div>
      <div class="wiz-liga-intro-content">
        <div class="wiz-intro-logo">🏟️</div>
        <h1 class="wiz-intro-title">Creá<br>tu liga</h1>
        <p class="wiz-intro-sub">En pocos pasos vas a tener tu liga, tu equipo y tu perfil listos para entrenar.</p>
        <div class="wiz-intro-steps">
          <div class="wiz-intro-step wiz-intro-step-1"><span class="wiz-intro-step-ico">🏟️</span><span class="wiz-intro-step-txt">Datos de tu liga y equipo</span></div>
          <div class="wiz-intro-step wiz-intro-step-2"><span class="wiz-intro-step-ico">👤</span><span class="wiz-intro-step-txt">Tu perfil como Admin</span></div>
          <div class="wiz-intro-step wiz-intro-step-3"><span class="wiz-intro-step-ico">🔑</span><span class="wiz-intro-step-txt">Código para invitar a tu equipo</span></div>
        </div>
        <button onclick="wizLigaIntroStart()" class="wiz-intro-btn">
          Empezar <span class="material-icons">arrow_forward</span>
        </button>
        <button onclick="cerrarWizLiga()" class="wiz-btn-skip">Cancelar</button>
      </div>
    `;
    const footer = document.querySelector('#wiz-liga-overlay .wiz-equipo-footer');
    if (footer) footer.classList.add('wiz-hidden');
    if (btnBack) btnBack.classList.add('wiz-hidden');
    return;
  }

  // A partir del paso 1 — mostrar footer
  const footer2 = document.querySelector('#wiz-liga-overlay .wiz-equipo-footer');
  if (footer2) footer2.classList.remove('wiz-hidden');

  if (paso === 1) {
    contenido.innerHTML = `
      <div class="wiz-intro-bg">
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-1"></div>
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-2"></div>
        <div class="wiz-intro-bg-ring wiz-intro-bg-ring-3"></div>
      </div>
      <div class="wiz-liga-intro-content">
        <div class="wiz-intro-logo">👤</div>
        <h1 class="wiz-intro-title">Vamos a<br>registrarte</h1>
        <p class="wiz-intro-sub">Inicia sesión con Google para continuar. Solo toma un momento.</p>
        <div id="wiz-liga-google-btn" class="wiz-liga-google-wrap"></div>
      </div>
    `;
    if (footer2) footer2.classList.add('wiz-hidden');
    if (btnBack) btnBack.classList.remove('wiz-hidden');
    requestAnimationFrame(() => {
      const wrap = document.getElementById('wiz-liga-google-btn');
      if (wrap) {
        wrap.dataset.rendered = '';
        google.accounts.id.renderButton(wrap, {
          theme: getGoogleBtnTheme(), size: 'large', width: 300, text: 'continue_with',
        });
      }
    });
    return;
  }

  if (paso === 2) {
    contenido.innerHTML = `
      <div class="wiz-emoji">🏟️</div>
      <h2 class="wiz-title">¿Cómo se llama tu liga?</h2>
      <p class="wiz-desc">El nombre de la organización.</p>
      <div class="wiz-content">
        <input id="wiz-liga-nombre" type="text" placeholder="Nombre de la liga" value="${_wizLiga.nombreLiga}"
          class="reg-input wiz-big-input"
          oninput="_wizLiga.nombreLiga=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
    `;
    setTimeout(() => document.getElementById('wiz-liga-nombre')?.focus(), 100);
  }

  if (paso === 3) {
    const preview = _wizLiga.ligaImagenBase64
      ? `<img src="${_wizLiga.ligaImagenBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    contenido.innerHTML = `
      <div class="wiz-emoji">🖼️</div>
      <h2 class="wiz-title">Logo de tu liga</h2>
      <p class="wiz-desc">Subí un logo o ícono que la represente. Opcional.</p>
      <div class="wiz-content">
        <div class="wiz-liga-avatar-wrap">
          <label class="wiz-liga-avatar" id="wiz-liga-img-label">
            ${preview}
            <input type="file" accept="image/*" style="display:none;" onchange="previewImagenLiga(this)">
          </label>
        </div>
        <p class="reg-note">Opcional — puedes saltarte este paso</p>
      </div>
    `;
  }

  if (paso === 4) {
    const ciudades = CIUDADES_POR_PAIS[_wizLiga.pais] || [];
    const ciudadOpts = ciudades.map(c =>
      `<option value="${c}" ${_wizLiga.ciudad === c ? 'selected' : ''}>${c}</option>`
    ).join('');
    contenido.innerHTML = `
      <div class="wiz-emoji">🌎</div>
      <h2 class="wiz-title">¿De dónde es tu liga?</h2>
      <p class="wiz-desc">País y ciudad donde opera principalmente.</p>
      <div class="wiz-content">
        <select id="wiz-liga-pais-sel" class="reg-input" onchange="onWizLigaPaisChange(this.value)">
          <option value="">Seleccionar país…</option>
          ${REG_PAISES.map(p => `<option value="${p}" ${_wizLiga.pais === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <div id="wiz-liga-ciudad-wrap" style="${_wizLiga.pais ? '' : 'display:none;'}margin-top:12px;">
          <select id="wiz-liga-ciudad-sel" class="reg-input" onchange="_wizLiga.ciudad=this.value;document.getElementById('wiz-liga-ciudad-custom-wrap').style.display=this.value==='__otro__'?'block':'none';">
            <option value="">Seleccionar ciudad…</option>
            ${ciudadOpts}
            <option value="__otro__" ${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? 'selected' : ''}>Mi ciudad no está en la lista…</option>
          </select>
          <div id="wiz-liga-ciudad-custom-wrap" style="display:${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? 'block' : 'none'};margin-top:8px;">
            <input id="wiz-liga-ciudad-custom" type="text" placeholder="Escribe tu ciudad" value="${_wizLiga.ciudad && !ciudades.includes(_wizLiga.ciudad) ? _wizLiga.ciudad : ''}"
              class="reg-input"
              oninput="_wizLiga.ciudad=this.value">
          </div>
        </div>
        <p class="reg-note">Opcional — puedes saltarte este paso</p>
      </div>
    `;
  }

  if (paso === 5) {
    contenido.innerHTML = `
      <div class="wiz-emoji">📅</div>
      <h2 class="wiz-title">Cuéntanos más</h2>
      <p class="wiz-desc">Año de fundación y una descripción de tu liga.</p>
      <div class="wiz-content">
        <input id="wiz-liga-anio" type="number" placeholder="Año de fundación (ej: 2018)" value="${_wizLiga.anioFundacion}"
          min="1990" max="${new Date().getFullYear()}"
          class="reg-input"
          oninput="_wizLiga.anioFundacion=this.value">
        <textarea id="wiz-liga-descripcion" placeholder="Describe tu liga: misión, origen, valores…" rows="4"
          class="reg-input"
          style="margin-top:12px;"
          oninput="_wizLiga.descripcion=this.value"
          maxlength="500">${_wizLiga.descripcion}</textarea>
        <p class="reg-note">Ambos campos son opcionales</p>
      </div>
    `;
    setTimeout(() => document.getElementById('wiz-liga-anio')?.focus(), 100);
  }

  if (paso === 6) {
    contenido.innerHTML = `
      <div class="wiz-emoji">📬</div>
      <h2 class="wiz-title">Contacto de la liga</h2>
      <p class="wiz-desc">¿Cómo pueden encontrarlos? Puedes completar uno o ambos.</p>
      <div class="wiz-content">

        <div class="wiz-accordion-item" id="wiz-acc-social">
          <button class="wiz-accordion-header wiz-acc-open" onclick="toggleWizAccordion('social')">
            <span>🌐 Red social / Instagram</span>
            <span class="material-icons wiz-acc-chevron">expand_less</span>
          </button>
          <div class="wiz-accordion-body" id="wiz-acc-body-social">
            <input id="wiz-liga-ig" type="text" placeholder="@tuliga o https://instagram.com/tuliga"
              value="${_wizLiga.contactoSocial || ''}"
              class="reg-input"
              oninput="_wizLiga.contactoSocial=this.value">
          </div>
        </div>

        <div class="wiz-accordion-item" id="wiz-acc-tel" style="margin-top:8px;">
          <button class="wiz-accordion-header" onclick="toggleWizAccordion('tel')">
            <span>📱 WhatsApp / Teléfono</span>
            <span class="material-icons wiz-acc-chevron">expand_more</span>
          </button>
          <div class="wiz-accordion-body wiz-hidden" id="wiz-acc-body-tel">
            <div class="reg-phone-row" style="margin-top:8px;">
              <button type="button" id="wiz-liga-codigo-btn" onclick="abrirSelectorCodigoLiga()"
                class="reg-selector-btn reg-codigo-btn">
                <span class="reg-selector-val" id="wiz-liga-codigo-val">${_wizLiga.contactoCodigo || '🇪🇨 +593'}</span>
                <span class="material-icons reg-selector-ico">expand_more</span>
              </button>
              <input id="wiz-liga-tel" type="tel" placeholder="Número" maxlength="20"
                value="${_wizLiga.contactoTel || ''}"
                class="reg-input reg-tel-input"
                oninput="_wizLiga.contactoTel=this.value">
            </div>
          </div>
        </div>

        <p class="reg-note">Opcional — puedes saltarte este paso</p>
      </div>
    `;
  }

  if (paso === 7) {
    contenido.innerHTML = `
      <div class="wiz-emoji">🛼</div>
      <h2 class="wiz-title">¿Cómo se llama tu equipo?</h2>
      <p class="wiz-desc">Puedes agregar más equipos desde Ajustes después.</p>
      <div class="wiz-content">
        <input id="wiz-liga-equipo-nombre" type="text" placeholder="Nombre del equipo" value="${_wizLiga.nombreEquipo}"
          class="reg-input wiz-big-input"
          oninput="_wizLiga.nombreEquipo=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
    `;
    setTimeout(() => document.getElementById('wiz-liga-equipo-nombre')?.focus(), 100);
  }

  if (paso === 8) {
    contenido.innerHTML = `
      <div class="wiz-emoji">🏆</div>
      <h2 class="wiz-title">¿Qué categoría?</h2>
      <p class="wiz-desc">Selecciona la categoría en la que compite tu equipo.</p>
      <div class="wiz-content">
        <div class="wiz-chips">
          ${['A','B','C'].map(cat => `
            <button onclick="seleccionarCategoriaLigaWiz('${cat}')"
              id="wiz-liga-cat-${cat}"
              class="chip ${_wizLiga.categoria === cat ? 'chip-active' : 'chip-inactive'}">
              ${cat}
            </button>`).join('')}
        </div>
        <p class="reg-note">Opcional — puedes saltarte este paso</p>
      </div>
    `;
  }

  if (paso === 9) {
    const preview = _wizLiga.logoBase64
      ? `<img src="${_wizLiga.logoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">`
      : `<span class="material-icons" style="font-size:40px;color:var(--text3);">add_photo_alternate</span>`;
    const colorActual = _wizLiga.colorPrimario || document.documentElement.dataset.colorPrimario || '#ef4444';
    contenido.innerHTML = `
      <div class="wiz-emoji">🎨</div>
      <h2 class="wiz-title">Personaliza tu equipo</h2>
      <p class="wiz-desc">Logo y color de énfasis. Así se verá la app cuando uses este equipo.</p>
      <div class="wiz-content">
        <div class="wiz-liga-avatar-wrap">
          <label class="wiz-liga-avatar" id="wiz-liga-logo-label">
            ${preview}
            <input type="file" accept="image/*" style="display:none;" onchange="previewLogoLigaWiz(this)">
          </label>
        </div>
        <p style="font-size:13px;color:var(--text3);margin:16px 0 8px;font-weight:600;">Color de énfasis</p>
        <div class="wiz-color-presets" id="wiz-color-presets">
          ${COLOR_PICKER_PRESETS.map(c => `
            <button class="color-swatch-btn ${c === colorActual ? 'selected' : ''}"
              style="background:${c}"
              onclick="seleccionarColorWiz('${c}')"
              data-color="${c}">
            </button>
          `).join('')}
        </div>
        <p class="reg-note">Opcional — puedes saltarte este paso</p>
      </div>
    `;
  }

  // ── ícono de fondo ──
  const emojis = { 0:'🏟️', 1:'👤', 2:'🏟️', 3:'🖼️', 4:'🌎', 5:'📅', 6:'📬', 7:'🛼', 8:'🏆', 9:'🎨' };
  requestAnimationFrame(() => {
    if (contenido && emojis[paso]) {
      const existing = contenido.querySelector('.wiz-bg-emoji');
      if (!existing) {
        const bg = document.createElement('div');
        bg.className = 'wiz-bg-emoji';
        bg.textContent = emojis[paso];
        contenido.appendChild(bg);
      } else {
        existing.textContent = emojis[paso];
      }
    }
  });
}

if (paso === 12) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">✨</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Cómo te llamamos?</h2>
        <p class="wiz-liga-desc">Tu nombre o apodo en el equipo.</p>
      </div>
      <input id="wiz-liga-perfil-nombre" type="text" placeholder="Ej: Valentina, Val…" value="${_wizLiga.nombre || ''}"
        class="wiz-liga-input"
        oninput="_wizLiga.nombre=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    setTimeout(() => document.getElementById('wiz-liga-perfil-nombre')?.focus(), 100);
  }

  if (paso === 13) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏳️‍🌈</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Con qué pronombres te identificás?</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <div id="wiz-liga-pronombres-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChipsMulti('wiz-liga-pronombres-chips', REG_PRONOMBRES, _wizLiga.pronombres || [], v => { _wizLiga.pronombres = v; });
  }

  if (paso === 14) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🌎</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿De dónde sos?</h2>
        <p class="wiz-liga-desc">Tu país de origen.</p>
      </div>
      <button type="button" id="wiz-liga-perfil-pais-btn" class="wiz-liga-selector-btn">
        <span id="wiz-liga-perfil-pais-display">${_wizLiga.paisPerfil || 'Seleccionar país…'}</span>
        <span class="material-icons">expand_more</span>
      </button>
    `;
    document.getElementById('wiz-liga-perfil-pais-btn').onclick = () => {
      abrirBottomSheet('Nacionalidad', REG_PAISES, _wizLiga.paisPerfil || '', val => {
        _wizLiga.paisPerfil = val;
        document.getElementById('wiz-liga-perfil-pais-display').textContent = val;
      });
    };
  }

  if (paso === 15) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">📱</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu número de contacto</h2>
        <p class="wiz-liga-desc">Prefijo y número.</p>
      </div>
      <div class="wiz-liga-phone-row">
        <button type="button" id="wiz-liga-perfil-codigo-btn" class="wiz-liga-selector-btn wiz-liga-codigo-btn">
          <span id="wiz-liga-perfil-codigo-display">${_wizLiga.codigoPais || '+?'}</span>
          <span class="material-icons">expand_more</span>
        </button>
        <input id="wiz-liga-perfil-tel" type="tel" placeholder="Número" class="wiz-liga-input"
          value="${_wizLiga.telefono || ''}"
          oninput="_wizLiga.telefono=this.value"
          onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
      </div>
    `;
    document.getElementById('wiz-liga-perfil-codigo-btn').onclick = () => {
      abrirBottomSheet('Código de país', REG_CODIGOS, _wizLiga.codigoPais || '', val => {
        _wizLiga.codigoPais = val;
        document.getElementById('wiz-liga-perfil-codigo-display').textContent = val;
      });
    };
    setTimeout(() => document.getElementById('wiz-liga-perfil-tel')?.focus(), 100);
  }

  if (paso === 16) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🎂</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Fecha de nacimiento</h2>
        <p class="wiz-liga-desc">Obligatorio.</p>
      </div>
      <button type="button" id="wiz-liga-perfil-fecha-btn" class="wiz-liga-selector-btn">
        <span id="wiz-liga-perfil-fecha-display">${_wizLiga.fechaNacimiento || 'Seleccionar fecha…'}</span>
        <span class="material-icons">edit_calendar</span>
      </button>
    `;
    document.getElementById('wiz-liga-perfil-fecha-btn').onclick = () => {
      abrirDatePicker(_wizLiga.fechaNacimiento || '', val => {
        _wizLiga.fechaNacimiento = val;
        document.getElementById('wiz-liga-perfil-fecha-display').textContent = val;
      });
    };
  }

  if (paso === 17) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">⭐</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Datos Derby</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-derby" type="text" placeholder="Nombre Derby" class="wiz-liga-input"
        value="${_wizLiga.nombreDerby || ''}"
        oninput="_wizLiga.nombreDerby=this.value"
        onkeydown="if(event.key==='Enter') document.getElementById('wiz-liga-perfil-numero').focus()">
      <input id="wiz-liga-perfil-numero" type="text" placeholder="Número Derby" class="wiz-liga-input"
        value="${_wizLiga.numeroDerby || ''}"
        oninput="_wizLiga.numeroDerby=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()" style="margin-top:12px;">
    `;
    setTimeout(() => document.getElementById('wiz-liga-perfil-derby')?.focus(), 100);
  }

  if (paso === 18) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏅</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu rol en el equipo</h2>
        <p class="wiz-liga-desc">Seleccioná tu posición.</p>
      </div>
      <div id="wiz-liga-rol-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChips('wiz-liga-rol-chips', REG_ROLES, _wizLiga.rolJugadorx || '', v => { _wizLiga.rolJugadorx = v; });
  }

  if (paso === 19) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🏋️</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">¿Cuánto entrenás?</h2>
        <p class="wiz-liga-desc">Veces por semana.</p>
      </div>
      <div id="wiz-liga-asiste-chips" class="chip-wrapper wiz-chips"></div>
    `;
    regRenderChips('wiz-liga-asiste-chips', REG_ASISTENCIA, _wizLiga.asisteSemana || '', v => { _wizLiga.asisteSemana = v; });
  }

  if (paso === 20) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🩺</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Tu salud nos importa</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-alergias" type="text" placeholder="Alergias o condiciones" class="wiz-liga-input"
        value="${_wizLiga.alergias || ''}"
        oninput="_wizLiga.alergias=this.value">
      <input id="wiz-liga-perfil-dieta" type="text" placeholder="Dieta especial" class="wiz-liga-input"
        value="${_wizLiga.dieta || ''}"
        oninput="_wizLiga.dieta=this.value" style="margin-top:12px;">
    `;
  }

  if (paso === 21) {
    contenido.innerHTML = `
      <div class="wiz-liga-paso-emoji">🆘</div>
      <div class="wiz-liga-paso-titulo">
        <h2 class="wiz-liga-h2">Contacto de emergencia</h2>
        <p class="wiz-liga-desc">Opcional.</p>
      </div>
      <input id="wiz-liga-perfil-emergencia" type="text" placeholder="Nombre y teléfono" class="wiz-liga-input"
        value="${_wizLiga.contactoEmergencia || ''}"
        oninput="_wizLiga.contactoEmergencia=this.value"
        onkeydown="if(event.key==='Enter') wizLigaPasoSiguiente()">
    `;
    if (btnNext) btnNext.textContent = '¡Crear todo! 🛼';
    setTimeout(() => document.getElementById('wiz-liga-perfil-emergencia')?.focus(), 100);
  }

function abrirFotoLigaWiz() {
  document.getElementById('wiz-liga-foto-input')?.click();
}

function previewFotoLigaWiz(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.fotoBase64 = e.target.result;
    const avatar = document.getElementById('wiz-liga-avatar');
    if (avatar) avatar.innerHTML = `<img src="${e.target.result}" class="wiz-liga-avatar-img">`;
  };
  reader.readAsDataURL(file);
}

function onWizLigaPaisChange(pais) {
  _wizLiga.pais = pais;
  _wizLiga.ciudad = '';
  const wrap = document.getElementById('wiz-liga-ciudad-wrap');
  const sel = document.getElementById('wiz-liga-ciudad-sel');
  if (!wrap || !sel) return;
  if (!pais) { wrap.style.display = 'none'; return; }
  const ciudades = CIUDADES_POR_PAIS[pais] || [];
  sel.innerHTML = `<option value="">Seleccionar ciudad…</option>` +
    ciudades.map(c => `<option value="${c}">${c}</option>`).join('') +
    `<option value="__otro__">Mi ciudad no está en la lista…</option>`;
  wrap.style.display = 'block';
  document.getElementById('wiz-liga-ciudad-custom-wrap').style.display = 'none';
}

function toggleWizAccordion(tipo) {
  const bodyS = document.getElementById('wiz-acc-body-social');
  const bodyT = document.getElementById('wiz-acc-body-tel');
  const hdrS  = document.querySelector('#wiz-acc-social .wiz-accordion-header');
  const hdrT  = document.querySelector('#wiz-acc-tel .wiz-accordion-header');
  const chevS = document.querySelector('#wiz-acc-social .wiz-acc-chevron');
  const chevT = document.querySelector('#wiz-acc-tel .wiz-acc-chevron');
  if (tipo === 'social') {
    bodyS.classList.remove('wiz-hidden');
    bodyT.classList.add('wiz-hidden');
    hdrS.classList.add('wiz-acc-open');
    hdrT.classList.remove('wiz-acc-open');
    chevS.textContent = 'expand_less';
    chevT.textContent = 'expand_more';
  } else {
    bodyT.classList.remove('wiz-hidden');
    bodyS.classList.add('wiz-hidden');
    hdrT.classList.add('wiz-acc-open');
    hdrS.classList.remove('wiz-acc-open');
    chevT.textContent = 'expand_less';
    chevS.textContent = 'expand_more';
  }
}

function abrirSelectorCodigoLiga() {
  abrirBottomSheet('Código de país', REG_CODIGOS, _wizLiga.contactoCodigo || '', val => {
    _wizLiga.contactoCodigo = val;
    const el = document.getElementById('wiz-liga-codigo-val');
    if (el) el.textContent = val;
  });
}

function seleccionarColorWiz(color) {
  _wizLiga.colorPrimario = color;
  document.querySelectorAll('#wiz-color-presets .color-swatch-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === color);
  });
  aplicarColorPrimario(color);
}

function seleccionarCategoriaLigaWiz(cat) {
  _wizLiga.categoria = cat;
  ['A','B','C'].forEach(c => {
    const btn = document.getElementById('wiz-liga-cat-' + c);
    if (!btn) return;
    btn.classList.toggle('chip-active',   c === cat);
    btn.classList.toggle('chip-inactive', c !== cat);
  });
}

function previewImagenLiga(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.ligaImagenBase64 = e.target.result;
    const label = document.getElementById('wiz-liga-img-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewImagenLiga(this)">`;
  };
  reader.readAsDataURL(file);
}

function previewLogoLigaWiz(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _wizLiga.logoBase64 = e.target.result;
    const label = document.getElementById('wiz-liga-logo-label');
    if (label) label.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;"><input type="file" accept="image/*" style="display:none;" onchange="previewLogoLigaWiz(this)">`;
  };
  reader.readAsDataURL(file);
}



function wizLigaPasoSiguiente() {
  if (_wizLigaPaso === 2) {
    if (!_wizLiga.nombreLiga.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre de la liga'); return; }
  }
  if (_wizLigaPaso === 7) {
    if (!_wizLiga.nombreEquipo.trim()) { mostrarToastGuardado('⚠️ Escribe el nombre del equipo'); return; }
  }
  if (_wizLigaPaso === _WIZ_LIGA_TOTAL) {
    crearLigaYEquipo(); return;
  }
  renderWizLigaPaso(_wizLigaPaso + 1);
}

function wizLigaPasoAnterior() {
  if (_wizLigaPaso > 1) renderWizLigaPaso(_wizLigaPaso - 1);
}

async function crearLigaConPerfil() {
  const btnNext = document.getElementById('wiz-liga-btn-next');
  if (btnNext) { btnNext.disabled = true; btnNext.textContent = 'Creando…'; }
  try {
    const email = window._googleEmail || localStorage.getItem('quindes_email');
    const result = await apiCall('/crear-liga', 'POST', {
      email,
      nombreLiga:          _wizLiga.nombreLiga.trim(),
      nombreEquipo:        _wizLiga.nombreEquipo.trim(),
      categoria:           _wizLiga.categoria || null,
      ligaImagenBase64:    _wizLiga.ligaImagenBase64 || null,
      logoBase64:          _wizLiga.logoBase64 || null,
      nombre:              _wizLiga.nombre?.trim() || '',
      pronombres:          Array.isArray(_wizLiga.pronombres) ? _wizLiga.pronombres.join(', ') : '',
      paisPerfil:          _wizLiga.paisPerfil || '',
      codigoPais:          _wizLiga.codigoPais || '',
      telefono:            _wizLiga.telefono || '',
      fechaNacimiento:     _wizLiga.fechaNacimiento || '',
      mostrarCumple:       'No',
      mostrarEdad:         'No',
      nombreDerby:         _wizLiga.nombreDerby || '',
      numero:              _wizLiga.numeroDerby || '',
      rolJugadorx:         _wizLiga.rolJugadorx || '',
      asisteSemana:        _wizLiga.asisteSemana || '',
      alergias:            _wizLiga.alergias || '',
      dieta:               _wizLiga.dieta || '',
      contactoEmergencia:  _wizLiga.contactoEmergencia || '',
      fotoBase64:          _wizLiga.fotoBase64 || null,
    });
    if (!result?.ok) throw new Error(result?.error || 'Error al crear');
    cerrarWizLiga();
    CURRENT_USER = {
      found: true, id: result.perfil.id, email,
      rolApp: 'Admin', equipoId: result.equipo.id, ligaId: result.liga.id,
    };
    localStorage.setItem('quindes_email', email);
    const profile = await apiCall('/perfil/' + result.perfil.id);
    window.myProfile = profile;
    configurarTodasLasSubidas();
    renderTodo(profile);
    aplicarPermisos();
    inicializarAjustes();
    setTimeout(() => {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
      lanzarConfetti();
      mostrarBienvenida();
    }, 400);
  } catch(e) {
    mostrarToastGuardado('❌ Error al crear: ' + e.message);
    if (btnNext) { btnNext.disabled = false; btnNext.textContent = '¡Crear todo! 🛼'; }
    console.error(e);
  }
}

function filtrarPaisesLiga(query) {
  const lista = document.getElementById('wiz-liga-pais-lista');
  if (!lista) return;
  if (!query || query.length < 2) { lista.style.display = 'none'; return; }
  const filtrados = REG_PAISES.filter(p => p.toLowerCase().includes(query.toLowerCase()));
  if (filtrados.length === 0) { lista.style.display = 'none'; return; }
  lista.style.display = 'block';
  lista.innerHTML = filtrados.map(p =>
    `<div class="wiz-liga-pais-item" onclick="seleccionarPaisLiga('${p}')">${p}</div>`
  ).join('');
}

function seleccionarPaisLiga(pais) {
  _wizLiga.pais = pais;
  const input = document.getElementById('wiz-liga-pais-input');
  if (input) input.value = pais;
  const lista = document.getElementById('wiz-liga-pais-lista');
  if (lista) lista.style.display = 'none';
}

function toggleTipoContactoLiga(tipo) {
  const esSocial = tipo === 'social';
  const btnSocial = document.getElementById('wiz-liga-tipo-social');
  const btnTel    = document.getElementById('wiz-liga-tipo-tel');
  const divSocial = document.getElementById('wiz-liga-contacto-social');
  const divTel    = document.getElementById('wiz-liga-contacto-tel');
  if (btnSocial) { btnSocial.classList.toggle('chip-active', esSocial); btnSocial.classList.toggle('chip-inactive', !esSocial); }
  if (btnTel)    { btnTel.classList.toggle('chip-active', !esSocial);   btnTel.classList.toggle('chip-inactive', esSocial); }
  if (divSocial) divSocial.classList.toggle('wiz-hidden', !esSocial);
  if (divTel)    divTel.classList.toggle('wiz-hidden', esSocial);
  _wizLiga.contacto = '';
}

function crearLigaYEquipo() {
  const email = window._googleEmail || localStorage.getItem('quindes_email');
  if (!email) { mostrarToastGuardado('⚠️ No se encontró tu sesión'); return; }
  window._googleEmail = email;
  window._enFlujoCrearLiga = true;
  sessionStorage.setItem('_enFlujoCrearLiga', '1');
  document.getElementById('loginScreen').style.display = 'none';
  cerrarWizLiga();
  setTimeout(() => {
    wizOrigen = 'crearLiga';
    mostrarRegistroWizard();
  }, 400);
}

function mostrarLigaCreada(result) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-fullscreen-success';
  overlay.innerHTML = `
    <div style="text-align:center;max-width:320px;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:64px;animation:wiz-fade-up 0.5s ease 0.1s both;">🎉</div>
      <h2 style="font-size:24px;font-weight:800;color:var(--text);margin:0;animation:wiz-fade-up 0.5s ease 0.2s both;">¡Todo listo!</h2>
      <p style="font-size:15px;color:var(--text2);line-height:1.6;margin:0;animation:wiz-fade-up 0.5s ease 0.3s both;">
        Liga <strong style="color:var(--text);">${result.liga.nombre}</strong> y equipo
        <strong style="color:var(--text);">${result.equipo.nombre}</strong> creados. Tu cuenta ya está activa como Admin.
      </p>
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:16px 24px;animation:wiz-fade-up 0.5s ease 0.4s both;width:100%;box-sizing:border-box;">
        <p style="font-size:12px;color:var(--text3);margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Código de invitación del equipo</p>
        <p id="liga-creada-codigo" style="font-size:28px;font-weight:900;color:var(--accent);margin:0;letter-spacing:0.1em;">${result.equipo.codigo}</p>
        <button id="liga-creada-copiar" style="margin-top:10px;padding:8px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--card2);color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;">
          Copiar código
        </button>
      </div>
      <button id="liga-creada-entrar"
        style="margin-top:8px;padding:14px 32px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:15px;font-weight:700;cursor:pointer;animation:wiz-fade-up 0.5s ease 0.6s both;width:100%;">
        Entrar a la app
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));

  document.getElementById('liga-creada-copiar').onclick = () => {
    navigator.clipboard.writeText(result.equipo.codigo)
      .then(() => mostrarToastGuardado('✅ Código copiado'))
      .catch(() => mostrarToastGuardado('❌ No se pudo copiar'));
  };

  document.getElementById('liga-creada-entrar').onclick = () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
      inviteCode = result.equipo.codigo;
      wizOrigen = 'crearLiga';
      mostrarRegistroWizard();
    }, 350);
  };
}
// ── BOTTOM NAV ────────────────────────────────────────────────
let _navSeccionActual = 'ajustes';

function navIr(seccion) {
  if (_navSeccionActual === seccion) return;
  _navSeccionActual = seccion;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
  const navEl = document.getElementById('nav-' + seccion);
  if (navEl) {
    void navEl.offsetWidth; // fuerza re-trigger animación
    navEl.classList.add('nav-active');
  }
  // TODO: mostrar sección correspondiente
}
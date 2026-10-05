// Controles flotantes del tema glass (portado del prototipo E-liquid-glass):
// - barra de pestañas: scroll-spy, gota "gel" bajo la pestaña activa, se encoge al bajar y se expande al subir,
//   y cambia de tono sobre la banda de contacto (inversa);
// - luz especular que sigue al puntero y brillo interior al presionar;
// - refracción real del borde en Chromium (backdrop-filter: url(#filtro)); el resto queda solo con blur.
// Todo es mejora progresiva: sin JS la barra y los controles funcionan como enlaces normales.

const NS = 'http://www.w3.org/2000/svg';

export function prefersMotion(): boolean {
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Mueve la gota bajo `target`; si hay movimiento, la estira como un gel entre posición vieja y nueva. */
export function gelMove(dropEl: HTMLElement, container: HTMLElement, target: HTMLElement, animate: boolean, motion: boolean): void {
  const cr = container.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  const left = tr.left - cr.left;
  const width = tr.width;
  const oldL = parseFloat(dropEl.style.left) || 0;
  const oldW = parseFloat(dropEl.style.width) || 0;
  dropEl.style.left = `${left}px`;
  dropEl.style.width = `${width}px`;
  if (animate && motion && oldW > 0 && typeof dropEl.animate === 'function' && Math.abs(oldL - left) > 1) {
    const minL = Math.min(oldL, left);
    const maxR = Math.max(oldL + oldW, left + width);
    dropEl.animate(
      [
        { left: `${oldL}px`, width: `${oldW}px`, transform: 'scaleY(1)' },
        { left: `${minL + (left < oldL ? 0 : (maxR - minL) * 0.18)}px`, width: `${(maxR - minL) * 0.82}px`, transform: 'scaleY(.84)', offset: 0.42 },
        { left: `${left}px`, width: `${width}px`, transform: 'scaleY(1)' },
      ],
      { duration: 560, easing: 'cubic-bezier(.3,.8,.25,1)' },
    );
  }
}

/** ¿Hay foco de teclado dentro de `el`? Sin soporte de :focus-visible, cuenta cualquier foco. */
function hasKeyboardFocus(el: HTMLElement): boolean {
  try {
    return el.querySelector(':focus-visible') !== null;
  } catch {
    return el.contains(document.activeElement);
  }
}

/* ---------------- barra de pestañas ---------------- */
function initTabBar(nav: HTMLElement, motion: () => boolean): void {
  const doc = document.documentElement;
  const navDrop = nav.querySelector<HTMLElement>('.drop');
  const navLinks = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'));
  const controls = document.querySelector<HTMLElement>('.controls');
  const contact = document.getElementById('contact');
  const secLinks = navLinks.filter((a) => a.dataset.sec);
  const secIds = secLinks.map((a) => a.dataset.sec as string).filter((id) => document.getElementById(id));
  // modo páginas (sin secciones): la pestaña actual es la de la página y no hay scroll-spy
  let current: HTMLAnchorElement | null = secLinks.length > 0 ? null : nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');

  let trackUntil = 0;
  let trackRaf = 0;
  function trackNav(): void {
    trackUntil = performance.now() + 620;
    cancelAnimationFrame(trackRaf); // un solo bucle a la vez aunque se llame seguido
    const step = (): void => {
      if (current && navDrop) gelMove(navDrop, nav, current, false, motion());
      trackRaf = performance.now() < trackUntil ? requestAnimationFrame(step) : 0;
    };
    step();
  }

  // Barra encogida: las pestañas ocultas (ancho 0) salen del orden de tabulación y del árbol de accesibilidad.
  function syncHidden(): void {
    const min = nav.classList.contains('is-min');
    for (const a of navLinks) a.inert = min && a !== current;
  }

  function setMin(min: boolean): void {
    if (min === nav.classList.contains('is-min')) return;
    nav.classList.toggle('is-min', min);
    syncHidden();
    trackNav();
  }

  function placeNavDrop(animate: boolean): void {
    if (!current || !navDrop) {
      nav.classList.remove('has-active');
      return;
    }
    nav.classList.add('has-active');
    gelMove(navDrop, nav, current, animate, motion());
  }

  function setCurrent(sec: string | null): void {
    const link = sec ? (secLinks.find((a) => a.dataset.sec === sec) ?? null) : null;
    if (link === current) return;
    secLinks.forEach((a) => a.setAttribute('aria-current', a === link ? 'true' : 'false'));
    current = link;
    placeNavDrop(true);
    if (nav.classList.contains('is-min')) {
      syncHidden();
      trackNav();
    }
  }

  function spy(): void {
    if (secIds.length === 0) return;
    const probe = innerHeight * 0.45;
    let found: string | null = null;
    for (const id of secIds) {
      const r = (document.getElementById(id) as HTMLElement).getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) found = id;
    }
    if (!found && contact && secIds.includes('contact') && contact.getBoundingClientRect().top < innerHeight * 0.7) found = 'contact';
    setCurrent(found);
  }

  let lastY = scrollY;
  let ticking = false;
  function onScroll(): void {
    ticking = false;
    const y = scrollY;
    const dy = y - lastY;
    doc.classList.toggle('scrolled', y > 40);
    if (Math.abs(dy) > 6) {
      // con foco de teclado dentro de la barra no se encoge (el foco quedaría en una pestaña oculta)
      const shouldMin = dy > 0 && y > innerHeight * 0.8 && !!current && !hasKeyboardFocus(nav);
      setMin(shouldMin);
      lastY = y;
    }
    spy();
    // entorno adaptativo: el vidrio cambia de tono sobre la banda inversa
    if (contact) {
      const cTop = contact.getBoundingClientRect().top;
      const nr = nav.getBoundingClientRect();
      nav.classList.toggle('on-inverse', cTop < nr.top + nr.height / 2);
      if (controls) {
        const tr = controls.getBoundingClientRect();
        controls.classList.toggle('on-inverse', cTop < tr.top + tr.height / 2);
      }
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  // barra encogida: el primer toque la expande en vez de navegar
  nav.addEventListener('click', (e) => {
    if (nav.classList.contains('is-min')) {
      e.preventDefault();
      setMin(false);
    }
  });
  // teclado: al recibir foco la barra se expande para que se vea la pestaña enfocada
  // (solo foco de teclado: con el mouse, el clic ya expande y no debe navegar en el mismo gesto)
  nav.addEventListener('focusin', () => {
    if (hasKeyboardFocus(nav)) setMin(false);
  });
  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => placeNavDrop(false), 140);
    },
    { passive: true },
  );
  // el ancho de las etiquetas cambia mientras cargan las fuentes
  document.fonts?.ready.then(() => placeNavDrop(false)).catch(() => {});

  placeNavDrop(false);
  onScroll();
}

/* ---------------- luz = puntero, y brillo al presionar ---------------- */
function initLight(motion: () => boolean): void {
  const doc = document.documentElement;
  if (window.matchMedia('(hover: hover)').matches) {
    let raf = 0;
    let last: PointerEvent | null = null;
    window.addEventListener(
      'pointermove',
      (e) => {
        if (!motion()) return;
        last = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!last) return;
          const dx = last.clientX - innerWidth / 2;
          const dy = last.clientY - innerHeight / 2 - innerHeight * 0.6;
          const len = Math.hypot(dx, dy) || 1;
          const deg = (Math.atan2(dx / len, -dy / len) * 180) / Math.PI + 180;
          doc.style.setProperty('--light', `${deg.toFixed(1)}deg`);
        });
      },
      { passive: true },
    );
  }
  document.querySelectorAll<HTMLElement>('.glass').forEach((g) => {
    g.addEventListener(
      'pointerdown',
      (e) => {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--px', `${e.clientX - r.left}px`);
        g.style.setProperty('--py', `${e.clientY - r.top}px`);
        g.classList.add('is-pressed');
      },
      { passive: true },
    );
    for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
      g.addEventListener(type, () => g.classList.remove('is-pressed'), { passive: true });
    }
  });
}

/* ---------------- refracción del borde (solo Chromium) ---------------- */
const mapCache = new Map<string, string>();

/** Mapa de desplazamiento para una cápsula (radio = alto/2). Muestreo hacia dentro: el backdrop está recortado a la caja. */
function capsuleMap(width: number, height: number, edge: number): string {
  const W = Math.max(2, Math.round(width));
  const H = Math.max(2, Math.round(height));
  const key = `${W}x${H}`;
  const cached = mapCache.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const r = H / 2;
  const hx = W / 2 - r;
  const hy = H / 2 - r;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - W / 2;
      const py = y + 0.5 - H / 2;
      const qx = Math.abs(px) - hx;
      const qy = Math.abs(py) - hy;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const sdf = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r; // <0 dentro
      let nx: number;
      let ny: number;
      if (ox > 0 || oy > 0) {
        const l = Math.hypot(ox, oy) || 1;
        nx = (Math.sign(px) * ox) / l;
        ny = (Math.sign(py) * oy) / l;
      } else if (qx > qy) {
        nx = Math.sign(px);
        ny = 0;
      } else {
        nx = 0;
        ny = Math.sign(py);
      }
      const dist = -sdf; // distancia al borde, positiva dentro
      const t = Math.min(1, Math.max(0, 1 - dist / edge));
      const k = t * t * (3 - 2 * t);
      const o = (y * W + x) * 4;
      d[o] = 128 - 127 * k * nx;
      d[o + 1] = 128 - 127 * k * ny;
      d[o + 2] = 255 * k;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL();
  mapCache.set(key, url);
  return url;
}

function svgEl(tag: string, attrs: Record<string, string>, parent: Element): SVGElement {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent.appendChild(n);
  return n;
}

function initRefraction(): void {
  // Safari interpreta backdrop-filter:url() y luego no pinta nada; Firefox lo ignora: solo Chromium.
  const ua = navigator.userAgent;
  const chromium = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && 'chrome' in window;
  const defs = document.querySelector('#lg-defs defs');
  if (!chromium || !defs || !window.CSS?.supports('backdrop-filter', 'blur(1px)')) return;
  document.documentElement.classList.add('lg-refract');
  document.querySelectorAll<HTMLElement>('.glass[data-lg]').forEach((g, i) => {
    const id = `lgf${i + 1}`;
    const f = svgEl('filter', { id, x: '0', y: '0', filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, defs);
    const im = svgEl('feImage', { x: '0', y: '0', preserveAspectRatio: 'none', result: 'map' }, f);
    svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '7', result: 'frost' }, f);
    const dm = svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: '30', xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' }, f);
    svgEl('feColorMatrix', { in: 'map', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0', result: 'rimA' }, f);
    svgEl('feComposite', { in: 'bent', in2: 'rimA', operator: 'in', result: 'rim' }, f);
    svgEl('feComposite', { in: 'rim', in2: 'frost', operator: 'over' }, f);
    let pending = 0;
    const update = (): void => {
      pending = 0;
      const w = g.offsetWidth;
      const h = g.offsetHeight;
      if (!w || !h) return;
      for (const n of [f, im]) {
        n.setAttribute('width', String(w));
        n.setAttribute('height', String(h));
      }
      im.setAttribute('href', capsuleMap(w, h, Math.min(h * 0.4, 18)));
      dm.setAttribute('scale', String(Math.round(Math.min(22, h * 0.4))));
      g.style.setProperty('--lg-filter', `url(#${id})`);
    };
    update();
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        if (!pending) pending = window.setTimeout(update, 60);
      }).observe(g);
    }
  });
}

/** Punto de entrada. No hace nada si la página no tiene `.tabbar`. */
export function initControls(): void {
  const nav = document.querySelector<HTMLElement>('.tabbar');
  if (!nav) return;
  let motion = prefersMotion();
  try {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      motion = !e.matches;
      document.documentElement.classList.toggle('motion', motion);
    });
  } catch {
    // navegadores antiguos sin addEventListener en MediaQueryList: se queda el valor inicial
  }
  const getMotion = (): boolean => motion;
  initTabBar(nav, getMotion);
  initLight(getMotion);
  initRefraction();
}

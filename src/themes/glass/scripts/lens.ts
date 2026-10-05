// Lente de vidrio sobre los diagramas del tema glass (portado del prototipo E-liquid-glass:
// circleMap ~1029, Lens ~1305, Stage ~1412–1473).
// - Una copia del diagrama recortada a un círculo, ampliada y, en Chromium, doblada en el borde con
//   feDisplacementMap (el mapa radial se dibuja una sola vez en un canvas). En Safari/Firefox: ampliación
//   y un borde esmerilado (blur) sin desplazamiento, con el mismo gating que la refracción de los controles.
// - El brillo del borde sigue al puntero; al moverse la lente se estira como un gel.
// - Las posiciones salen de los <g data-step> que genera Diagram.astro, no de datos fijos.
// - Teclado: la <figure> es enfocable; ←/→ (e Inicio/Fin) mueven la lente de paso en paso.
// - prefers-reduced-motion: sin recorrido ni gel; la lente queda fija en el primer paso.
// Mejora progresiva: sin JS no se ejecuta nada y la lista de pasos queda visible.

const NS = 'http://www.w3.org/2000/svg';

let motion = true;
let uidN = 0;
const uid = (p: string): string => `${p}${++uidN}`;
const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------------- luz = puntero (vector unitario del centro hacia la luz) ---------------- */
const light = { x: -0.7071, y: -0.7071 };
const lightListeners = new Set<() => void>();
let lightReady = false;
function initLight(): void {
  if (lightReady) return;
  lightReady = true;
  if (!window.matchMedia('(hover: hover)').matches) return;
  let raf = 0;
  let last: PointerEvent | null = null;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!motion) return;
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!last) return;
        const dx = last.clientX - innerWidth / 2;
        const dy = last.clientY - innerHeight / 2 - innerHeight * 0.6;
        const len = Math.hypot(dx, dy) || 1;
        light.x = dx / len;
        light.y = dy / len;
        lightListeners.forEach((f) => f());
      });
    },
    { passive: true },
  );
}

/* ---------------- mapa de desplazamiento (una vez, canvas fuera de pantalla) ---------------- */
let circleMapUrl = '';
/** Lente circular: el borde empuja el muestreo hacia fuera, como el canto grueso de una lente real. */
function circleMap(N: number): string {
  if (circleMapUrl) return circleMapUrl;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(N, N);
  const d = img.data;
  const rim = 0.27;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = ((i + 0.5) / N) * 2 - 1;
      const v = ((j + 0.5) / N) * 2 - 1;
      const r = Math.hypot(u, v);
      const o = (j * N + i) * 4;
      let R = 128;
      let G = 128;
      let B = 0;
      if (r < 1 && r > 0) {
        const t = clamp((r - (1 - rim)) / rim, 0, 1);
        const k = Math.pow(t * t * (3 - 2 * t), 1.4);
        R = 128 + (127 * k * u) / r;
        G = 128 + (127 * k * v) / r;
        B = 255 * k;
      }
      d[o] = R;
      d[o + 1] = G;
      d[o + 2] = B;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  circleMapUrl = c.toDataURL();
  return circleMapUrl;
}

/**
 * ¿Refracción con desplazamiento? Mismo gating que los controles flotantes (controls.ts): Safari interpreta
 * los filtros SVG de vidrio y pinta mal, Firefox los ignora en backdrop-filter; solo Chromium recibe el borde doblado.
 */
function canRefract(): boolean {
  const ua = navigator.userAgent;
  const chromium = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && 'chrome' in window;
  return chromium && !!window.CSS?.supports('backdrop-filter', 'blur(1px)');
}

/* ---------------- bucle de animación compartido ---------------- */
const active = new Set<Lens>();
let raf = 0;
function kick(): void {
  if (!raf) raf = requestAnimationFrame(loop);
}
function loop(): void {
  raf = 0;
  let busy = false;
  active.forEach((l) => {
    if (l.visible && l.step()) busy = true;
  });
  if (busy) kick();
}

interface StepNode { i: number; x: number; y: number; w: number; h: number; g: SVGGElement }

/** Lee los nodos de los <g data-step> del SVG generado por Diagram.astro. */
function readNodes(svg: SVGSVGElement): StepNode[] {
  return Array.from(svg.querySelectorAll<SVGGElement>('.dg:not(.in-lens) > g[data-step]')).map((g) => {
    const r = g.querySelector('rect');
    const num = (a: string): number => parseFloat(r?.getAttribute(a) ?? '0');
    const w = num('width');
    const h = num('height');
    return { i: Number(g.dataset.step), x: num('x') + w / 2, y: num('y') + h / 2, w, h, g };
  });
}

interface LensOptions {
  R: number;
  mag: number;
  refract: boolean;
  start: number;
  onStep: (i: number) => void;
  onMove: (lens: Lens) => void;
}

class Lens {
  readonly svg: SVGSVGElement;
  readonly nodes: StepNode[];
  readonly R: number;
  private readonly m: number;
  private readonly S: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  private vx = 0;
  private vy = 0;
  mat = 0;
  matT = 0;
  private shadow = 0.6;
  visible = true;
  cur = -1;
  /** Paso pedido explícitamente (teclado, clic, recorrido): mientras viaja no se cambia de paso por cercanía. */
  private target = -1;
  private readonly root: SVGGElement;
  private readonly layer: SVGGElement;
  private readonly sh: SVGCircleElement;
  private readonly mags: SVGGElement[] = [];
  private readonly clones: SVGGElement[] = [];
  readonly cloneFlows: SVGPathElement[] = [];
  private readonly disp: SVGFEDisplacementMapElement | null = null;
  private readonly rimGrad: SVGLinearGradientElement;
  private readonly defsAdded: Element[] = [];
  private readonly lightFn: () => void;
  private readonly onStep: (i: number) => void;
  private readonly onMove: (lens: Lens) => void;

  constructor(svg: SVGSVGElement, nodes: StepNode[], o: LensOptions) {
    this.svg = svg;
    this.nodes = nodes;
    this.R = o.R;
    this.m = o.mag;
    this.S = o.R * 0.5;
    this.onStep = o.onStep;
    this.onMove = o.onMove;
    const first = nodes[o.start] ?? nodes[0];
    this.x = this.tx = first.x;
    this.y = this.ty = first.y;
    const R = this.R;
    const pad = this.S + 4;
    const id = uid('ln');
    const defs = svg.querySelector('defs') ?? svgEl('defs', {}, svg);
    const def = <T extends Element>(n: T): T => {
      this.defsAdded.push(n);
      return n;
    };

    const cp = def(svgEl('clipPath', { id: `${id}c` }, defs));
    svgEl('circle', { r: R }, cp);
    const sb = def(svgEl('filter', { id: `${id}s`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs));
    svgEl('feGaussianBlur', { stdDeviation: (R * 0.12).toFixed(2) }, sb);
    const rim = def(svgEl('linearGradient', { id: `${id}r`, gradientUnits: 'userSpaceOnUse' }, defs));
    svgEl('stop', { offset: '0', class: 'rim-a' }, rim);
    svgEl('stop', { offset: '.4', class: 'rim-0' }, rim);
    svgEl('stop', { offset: '.62', class: 'rim-0' }, rim);
    svgEl('stop', { offset: '1', class: 'rim-b' }, rim);
    this.rimGrad = rim;
    const edge = def(svgEl('radialGradient', { id: `${id}e`, r: '.5' }, defs));
    svgEl('stop', { offset: '.78', class: 'edge-0' }, edge);
    svgEl('stop', { offset: '.95', class: 'edge-1', 'stop-opacity': '.55' }, edge);
    svgEl('stop', { offset: '1', class: 'edge-2', 'stop-opacity': '.6' }, edge);

    this.layer = svgEl('g', { class: 'lens-layer', 'aria-hidden': 'true' }, svg);
    this.root = svgEl('g', {}, this.layer);
    this.sh = svgEl('circle', { class: 'lens-shadow', r: R * 0.96, cy: R * 0.1, filter: `url(#${id}s)` }, this.root);
    const clip = svgEl('g', { 'clip-path': `url(#${id}c)` }, this.root);
    svgEl('circle', { class: 'lens-bed', r: R }, clip);

    const source = svg.querySelector<SVGGElement>('.dg:not(.in-lens)');
    if (!source) throw new Error('diagram svg without .dg');
    const addClone = (parent: Element): void => {
      const mag = svgEl('g', {}, parent);
      const clone = source.cloneNode(true) as SVGGElement;
      clone.setAttribute('class', 'dg in-lens');
      mag.appendChild(clone);
      this.mags.push(mag);
      this.clones.push(clone);
      const f = clone.querySelector<SVGPathElement>('.flow');
      if (f) this.cloneFlows.push(f);
    };

    if (o.refract) {
      // Chromium: borde doblado por el mapa radial.
      const f = def(
        svgEl(
          'filter',
          { id: `${id}f`, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', x: -R - pad, y: -R - pad, width: 2 * (R + pad), height: 2 * (R + pad), 'color-interpolation-filters': 'sRGB' },
          defs,
        ),
      );
      const im = svgEl('feImage', { x: -R, y: -R, width: 2 * R, height: 2 * R, preserveAspectRatio: 'none', result: 'map' }, f);
      im.setAttribute('href', circleMap(256));
      this.disp = svgEl('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: 0, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
      addClone(svgEl('g', { filter: `url(#${id}f)` }, clip));
    } else {
      // Safari/Firefox: ampliación + borde esmerilado (copia desenfocada debajo, copia nítida enmascarada al centro).
      const fb = def(svgEl('filter', { id: `${id}b`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs));
      svgEl('feGaussianBlur', { stdDeviation: '1.6' }, fb);
      const mg = def(svgEl('radialGradient', { id: `${id}g`, r: '.5' }, defs));
      svgEl('stop', { offset: '0', class: 'mask-in' }, mg);
      svgEl('stop', { offset: '.74', class: 'mask-in' }, mg);
      svgEl('stop', { offset: '.96', class: 'mask-out' }, mg);
      const mk = def(svgEl('mask', { id: `${id}m`, maskContentUnits: 'userSpaceOnUse' }, defs));
      svgEl('circle', { r: R, fill: `url(#${id}g)` }, mk);
      addClone(svgEl('g', { filter: `url(#${id}b)` }, clip));
      addClone(svgEl('g', { mask: `url(#${id}m)` }, clip));
    }

    svgEl('circle', { class: 'lens-tint', r: R }, clip);
    svgEl('circle', { r: R, fill: `url(#${id}e)` }, clip);
    svgEl('circle', { r: R - 0.75, fill: 'none', stroke: `url(#${id}r)`, 'stroke-width': 1.5 }, this.root);

    this.lightFn = () => this.setLight();
    lightListeners.add(this.lightFn);
    this.setLight();
    this.apply(0, 0);
    active.add(this);
  }

  private setLight(): void {
    const R = this.R;
    this.rimGrad.setAttribute('x1', (light.x * R).toFixed(2));
    this.rimGrad.setAttribute('y1', (light.y * R).toFixed(2));
    this.rimGrad.setAttribute('x2', (-light.x * R).toFixed(2));
    this.rimGrad.setAttribute('y2', (-light.y * R).toFixed(2));
  }

  destroy(): void {
    active.delete(this);
    lightListeners.delete(this.lightFn);
    this.layer.remove();
    this.defsAdded.forEach((n) => n.remove());
    this.nodes.forEach((n) => n.g.classList.remove('is-on'));
  }

  /** Mueve la lente a un punto libre (puntero). */
  to(x: number, y: number, now = false): void {
    this.target = -1;
    this.go(x, y, now);
  }

  /** Mueve la lente a un paso concreto y lo marca ya como actual. */
  toStep(i: number, now = false): void {
    const n = this.nodes[i];
    if (!n) return;
    this.target = i;
    this.setCur(i);
    this.go(n.x, n.y, now);
  }

  private go(x: number, y: number, now: boolean): void {
    this.tx = x;
    this.ty = y;
    this.matT = 1;
    if (now || !motion) {
      this.x = x;
      this.y = y;
      this.vx = this.vy = 0;
    }
    if (!motion) this.mat = 1;
    if (now || !motion) this.apply(0, 0);
    kick();
  }

  nearest(x: number, y: number): { n: StepNode | null; d: number } {
    let best: StepNode | null = null;
    let bd = Infinity;
    for (const n of this.nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return { n: best, d: bd };
  }

  private setCur(i: number): void {
    if (this.cur === i) return;
    this.nodes[this.cur]?.g.classList.remove('is-on');
    for (const c of this.clones) {
      c.querySelector('.node.is-on')?.classList.remove('is-on');
      c.querySelector(`.node[data-step="${i}"]`)?.classList.add('is-on');
    }
    this.cur = i;
    this.nodes[i]?.g.classList.add('is-on');
    this.onStep(i);
  }

  /** Un paso de física (muelle amortiguado). Devuelve true mientras siga en movimiento. */
  step(): boolean {
    const k = 0.12;
    const damp = 0.74;
    this.vx = (this.vx + (this.tx - this.x) * k) * damp;
    this.vy = (this.vy + (this.ty - this.y) * k) * damp;
    this.x += this.vx;
    this.y += this.vy;
    this.mat += (this.matT - this.mat) * 0.11;
    const near = this.nearest(this.x, this.y);
    const shT = near.d < this.R * 0.9 ? 1 : 0.55; // sombra más marcada sobre texto, más suave sobre el lienzo
    this.shadow += (shT - this.shadow) * 0.15;
    this.apply(this.vx, this.vy);
    if (this.target < 0 && near.n && near.d < this.R * 0.45) this.setCur(near.n.i);
    const moving =
      Math.abs(this.tx - this.x) > 0.05 ||
      Math.abs(this.ty - this.y) > 0.05 ||
      Math.abs(this.vx) + Math.abs(this.vy) > 0.05 ||
      Math.abs(this.matT - this.mat) > 0.003 ||
      Math.abs(shT - this.shadow) > 0.01;
    if (!moving) {
      this.mat = this.matT;
      this.target = -1;
      this.apply(0, 0);
    }
    return moving;
  }

  /** Pinta la posición: traslación, estiramiento tipo gel en la dirección de la velocidad, aumento y desplazamiento. */
  apply(vx: number, vy: number): void {
    const v = Math.hypot(vx, vy);
    const s = motion ? Math.min(v * 0.011, 0.16) : 0;
    const a = (Math.atan2(vy, vx) * 180) / Math.PI;
    const sc = 0.86 + 0.14 * this.mat;
    this.root.setAttribute(
      'transform',
      `translate(${this.x.toFixed(2)} ${this.y.toFixed(2)}) rotate(${a.toFixed(1)}) scale(${(sc * (1 + s)).toFixed(4)} ${(sc * (1 - s * 0.55)).toFixed(4)}) rotate(${(-a).toFixed(1)})`,
    );
    this.root.style.opacity = Math.min(1, this.mat * 1.4).toFixed(3);
    const m = 1 + (this.m - 1) * this.mat;
    const t = `scale(${m.toFixed(4)}) translate(${(-this.x).toFixed(2)} ${(-this.y).toFixed(2)})`;
    for (const g of this.mags) g.setAttribute('transform', t);
    this.disp?.setAttribute('scale', (this.S * this.mat).toFixed(2));
    this.sh.style.opacity = (this.shadow * this.mat).toFixed(3);
    this.onMove(this);
  }
}

/* ---------------- un diagrama: elige el SVG visible, monta la lente y conecta puntero y teclado ---------------- */
const io =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (es) => {
          for (const e of es) {
            const st = stages.get(e.target);
            if (!st) continue;
            st.visible = e.isIntersecting;
            if (st.lens) st.lens.visible = e.isIntersecting;
            if (e.isIntersecting) {
              st.reveal();
              kick();
            }
          }
        },
        { rootMargin: '80px' },
      )
    : null;
const stages = new WeakMap<Element, Stage>();

class Stage {
  readonly fig: HTMLElement;
  readonly cap: HTMLElement | null;
  readonly details: string[];
  readonly refract: boolean;
  lens: Lens | null = null;
  svg: SVGSVGElement | null = null;
  visible = true;
  private flowMax = 0;
  private revealed = false;
  private touring = false;
  private tourTimers: number[] = [];

  constructor(fig: HTMLElement, refract: boolean) {
    this.fig = fig;
    this.refract = refract;
    this.cap = fig.querySelector<HTMLElement>('[data-cap]');
    this.details = Array.from(fig.querySelectorAll('.diagram-steps > li > span')).map((s) => s.textContent?.trim() ?? '');
    stages.set(fig, this);
    this.bind();
    this.build();
    if ('ResizeObserver' in window) new ResizeObserver(() => this.build()).observe(fig);
    if (io) io.observe(fig);
    else this.reveal();
    if (fig.hasAttribute('data-tour')) this.setupTour();
  }

  /** SVG que el CSS muestra ahora mismo (fila o columna). */
  private visibleSvg(): SVGSVGElement | null {
    for (const s of this.fig.querySelectorAll<SVGSVGElement>('svg[data-orient]')) {
      if (s.getBoundingClientRect().width > 0) return s;
    }
    return null;
  }

  /** (Re)monta la lente si cambió el SVG visible (p. ej. al cruzar el ancho de la columna móvil). */
  build(): void {
    const svg = this.visibleSvg();
    if (svg === this.svg) return;
    const keep = this.lens ? this.lens.cur : -1;
    const mat = this.lens ? this.lens.mat : 0;
    this.lens?.destroy();
    this.lens = null;
    this.svg = svg;
    if (!svg) return;
    const nodes = readNodes(svg);
    if (nodes.length === 0) return;
    const vb = svg.viewBox.baseVal;
    const horizontal = svg.dataset.orient === 'h';
    const n0 = nodes[0];
    const cross = horizontal ? vb.height : vb.width;
    const R = Math.round(Math.min(Math.hypot(n0.w / 2, n0.h / 2) + 4, cross * 0.48));
    const start = keep >= 0 ? keep : 0;
    this.lens = new Lens(svg, nodes, {
      R,
      mag: horizontal ? 1.12 : 1.08,
      refract: this.refract,
      start,
      onStep: (i) => {
        if (this.cap) this.cap.textContent = this.details[i] ?? '';
      },
      onMove: (l) => this.fillFlow(l),
    });
    this.lens.visible = this.visible;
    if (keep >= 0 || this.revealed) {
      this.lens.mat = mat || (this.revealed ? 1 : 0);
      this.lens.toStep(start, true);
    }
  }

  /** Primera vez en pantalla: la lente se materializa sobre el primer paso (o queda fija sin movimiento). */
  reveal(): void {
    if (this.revealed || !this.lens) return;
    if (this.fig.hasAttribute('data-tour') && motion) return; // el recorrido se encarga (setupTour)
    this.revealed = true;
    if (!motion) {
      this.flowMax = 1;
      this.lens.mat = 1;
    }
    this.lens.toStep(this.lens.cur >= 0 ? this.lens.cur : 0, true);
  }

  /** La línea coral se llena hasta donde ha llegado la lente (nunca retrocede). */
  private fillFlow(l: Lens): void {
    if (!motion) this.flowMax = 1;
    const a = l.nodes[0];
    const b = l.nodes[l.nodes.length - 1];
    const horizontal = this.svg?.dataset.orient === 'h';
    const p = horizontal ? (l.x - a.x) / (b.x - a.x || 1) : (l.y - a.y) / (b.y - a.y || 1);
    this.flowMax = Math.max(this.flowMax, clamp(p, 0, 1) * l.mat);
    const off = (1 - this.flowMax).toFixed(4);
    l.svg.querySelector('.dg:not(.in-lens) > .flow')?.setAttribute('stroke-dashoffset', off);
    for (const f of l.cloneFlows) f.setAttribute('stroke-dashoffset', off);
  }

  private point(e: PointerEvent | MouseEvent): [number, number] | null {
    if (!this.svg) return null;
    const r = this.svg.getBoundingClientRect();
    const vb = this.svg.viewBox.baseVal;
    if (!r.width || !r.height) return null;
    return [((e.clientX - r.left) * vb.width) / r.width, ((e.clientY - r.top) * vb.height) / r.height];
  }

  private user(): void {
    this.revealed = true;
    if (this.touring) this.endTour();
  }

  private bind(): void {
    const stage = this.fig.querySelector<HTMLElement>('.stage');
    if (!stage) return;
    stage.addEventListener('pointermove', (e) => {
      if (!this.lens || e.pointerType === 'touch') return;
      const p = this.point(e);
      if (!p) return;
      this.user();
      this.lens.to(p[0], p[1]);
    });
    stage.addEventListener('pointerleave', (e) => {
      if (!this.lens || e.pointerType === 'touch') return;
      const nn = this.lens.nearest(this.lens.tx, this.lens.ty).n;
      if (nn) this.lens.toStep(nn.i);
    });
    stage.addEventListener('click', (e) => {
      if (!this.lens) return;
      const p = this.point(e);
      if (!p) return;
      this.user();
      const nn = this.lens.nearest(p[0], p[1]).n;
      if (nn) this.lens.toStep(nn.i);
    });
    this.fig.addEventListener('keydown', (e) => {
      if (!this.lens) return;
      const last = this.lens.nodes.length - 1;
      const cur = this.lens.cur < 0 ? 0 : this.lens.cur;
      let next: number;
      if (e.key === 'ArrowRight') next = Math.min(last, cur + 1);
      else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      else return;
      e.preventDefault();
      this.user();
      this.lens.toStep(next);
    });
  }

  /* ----- recorrido del hero: la lente pasa por cada paso una vez, cuando el diagrama está a la vista ----- */
  private setupTour(): void {
    if (!motion) return;
    const start = (): void => {
      if (this.revealed || !this.lens) return;
      this.revealed = true;
      this.touring = true;
      // durante el recorrido automático el pie no se anuncia (evita leer cinco pasos seguidos sin pedirlo)
      this.cap?.setAttribute('aria-live', 'off');
      const count = this.lens.nodes.length;
      const t0 = 380;
      this.tourTimers.push(
        window.setTimeout(() => {
          if (!this.lens) return;
          this.lens.mat = 0;
          this.lens.toStep(0, true);
        }, t0),
      );
      for (let i = 1; i < count; i++) {
        this.tourTimers.push(window.setTimeout(() => this.touring && this.lens?.toStep(i), t0 + 900 + (i - 1) * 1500));
      }
      this.tourTimers.push(window.setTimeout(() => this.endTour(), t0 + 900 + count * 1500));
    };
    if ('IntersectionObserver' in window) {
      const tio = new IntersectionObserver(
        (es) => {
          if (es.some((e) => e.isIntersecting)) {
            tio.disconnect();
            start();
          }
        },
        { threshold: 0.45 },
      );
      tio.observe(this.fig);
    } else start();
  }

  private endTour(): void {
    this.touring = false;
    this.tourTimers.forEach((t) => clearTimeout(t));
    this.tourTimers = [];
    this.cap?.setAttribute('aria-live', 'polite');
  }
}

/** Activa la lente en cada [data-diagram] de `root`. Idempotente. */
let motionReady = false;
export function initLenses(root: ParentNode = document): void {
  if (!motionReady) {
    motionReady = true;
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      motion = !mq.matches;
      mq.addEventListener('change', (e) => {
        motion = !e.matches;
      });
    } catch {
      motion = false;
    }
  }
  initLight();
  const refract = canRefract();
  root.querySelectorAll<HTMLElement>('[data-diagram]').forEach((fig) => {
    if (stages.has(fig)) return;
    new Stage(fig, refract);
  });
}

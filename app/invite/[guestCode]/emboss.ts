// Embossed paper drawn in code (no photos): motifs are drawn as alpha, a blurred copy becomes a height map,
// an SVG lighting filter turns it into highlights and shadows, and the result is multiplied onto the paper
// colour. Returned as a data-URI so the browser rasterises it once (cheap to move during the opening).

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}
const f = (n: number) => n.toFixed(1)
/** height as a grey level (0 = paper, 1 = highest): the filter reads luminance as height */
const g = (v: number) => {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")
  return `#${c}${c}${c}`
}

/** One peony-like bloom: rings of ruffled petals, each ring raised a little higher than the one under it */
export function bloom(cx: number, cy: number, r: number, rot: number, rand: () => number) {
  let s = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})">`
  const rings = [
    { n: 8, len: 1, w: 0.78, a: 0.42 },
    { n: 7, len: 0.8, w: 0.74, a: 0.52 },
    { n: 6, len: 0.6, w: 0.72, a: 0.62 },
    { n: 5, len: 0.4, w: 0.8, a: 0.72 },
    { n: 4, len: 0.22, w: 0.9, a: 0.82 },
  ]
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.n; i++) {
      const ang = (360 / ring.n) * i + ri * 21 + rand() * 14
      const L = r * ring.len * (0.9 + rand() * 0.2)
      const W = L * ring.w
      const d = `M0 ${f(-L * 0.05)} C${f(-W * 0.95)} ${f(-L * 0.2)} ${f(-W * 1.05)} ${f(-L * 0.78)} ${f(-W * 0.55)} ${f(-L * 0.93)} Q${f(-W * 0.3)} ${f(-L * 1.05)} ${f(-W * 0.1)} ${f(-L * 0.94)} Q${f(0)} ${f(-L * 1.04)} ${f(W * 0.12)} ${f(-L * 0.95)} Q${f(W * 0.32)} ${f(-L * 1.06)} ${f(W * 0.56)} ${f(-L * 0.92)} C${f(W * 1.05)} ${f(-L * 0.76)} ${f(W * 0.95)} ${f(-L * 0.2)} 0 ${f(-L * 0.05)}Z`
      s += `<path d="${d}" transform="rotate(${f(ang)})" fill="${g(ring.a + (rand() - 0.5) * 0.06)}" stroke="${g(ring.a - 0.14)}" stroke-width="${f(Math.max(1, r / 60))}"/>`
      if (ri < 2) s += `<path d="M0 ${f(-L * 0.3)} Q${f(W * 0.1)} ${f(-L * 0.6)} 0 ${f(-L * 0.85)}" transform="rotate(${f(ang)})" fill="none" stroke="${g(ring.a - 0.08)}" stroke-width="${f(Math.max(0.7, r / 90))}"/>`
    }
  })
  return s + `</g>`
}

/** Long leaf with a midrib and side veins */
export function leaf(x: number, y: number, len: number, rot: number) {
  const w = len * 0.28
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`
  s += `<path d="M0 0 C${f(w)} ${f(-len * 0.3)} ${f(w * 0.8)} ${f(-len * 0.75)} 0 ${f(-len)} C${f(-w * 0.8)} ${f(-len * 0.75)} ${f(-w)} ${f(-len * 0.3)} 0 0Z" fill="${g(0.3)}" stroke="${g(0.2)}" stroke-width="1.4"/>`
  s += `<path d="M0 0 L0 ${f(-len * 0.96)}" stroke="${g(0.4)}" stroke-width="1.3"/>`
  for (let i = 1; i < 6; i++) {
    const yy = -len * (i / 6.4)
    s += `<path d="M0 ${f(yy)} L${f(w * 0.6)} ${f(yy - len * 0.1)} M0 ${f(yy)} L${f(-w * 0.6)} ${f(yy - len * 0.1)}" stroke="${g(0.22)}" stroke-width=".9"/>`
  }
  return s + `</g>`
}

/** Curling stem with small leaves, from (x1,y1) to (x2,y2) */
export function stem(x1: number, y1: number, x2: number, y2: number, bend: number) {
  const mx = (x1 + x2) / 2 + bend
  const my = (y1 + y2) / 2
  return `<path d="M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}" fill="none" stroke="${g(0.26)}" stroke-width="3" stroke-linecap="round"/>`
}

/**
 * Wraps motif markup into an embossed image (data-URI for CSS backgrounds).
 * `ink`: colour of the raised areas (e.g. gold on red lacquer); `metal`: adds a specular shine to them.
 */
export function embossed(...args: Parameters<typeof embossSvg>) {
  return `url("data:image/svg+xml,${encodeURIComponent(embossSvg(...args))}")`
}

/** Same as embossed() but returns the SVG document itself (for blob URLs) */
export function embossSvg(
  w: number,
  h: number,
  paper: string,
  art: string,
  opts: { depth?: number; blur?: number; light?: number; ink?: string; metal?: string } = {}
) {
  const depth = opts.depth ?? 3
  const blur = opts.blur ?? 1.8
  const elev = opts.light ?? 58
  const flat = Math.sin((elev * Math.PI) / 180)
  // multiply: flat areas keep their colour, slopes facing the light get lighter, the others darker
  const k1 = (1 / flat).toFixed(3)
  const mask = opts.ink || opts.metal ? `<feComponentTransfer in='h' result='m'><feFuncA type='discrete' tableValues='0 1 1 1 1 1 1 1'/></feComponentTransfer>` : ""
  const base = opts.ink
    ? `<feFlood flood-color='${paper}' result='p0'/>` + mask +
      `<feFlood flood-color='${opts.ink}'/><feComposite in2='m' operator='in' result='ink'/><feComposite in='ink' in2='p0' operator='over' result='p'/>`
    : mask + `<feFlood flood-color='${paper}' result='p'/>`
  const shine = opts.metal
    ? `<feSpecularLighting in='b' surfaceScale='${depth}' specularConstant='.9' specularExponent='22' lighting-color='${opts.metal}' result='s'><feDistantLight azimuth='225' elevation='${elev}'/></feSpecularLighting>` +
      `<feComposite in='s' in2='m' operator='in' result='s2'/><feComposite in='lit' in2='s2' operator='arithmetic' k1='0' k2='1' k3='.85' k4='0'/>`
    : ""
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<defs><filter id='e' filterUnits='userSpaceOnUse' x='0' y='0' width='${w}' height='${h}' color-interpolation-filters='sRGB'>` +
    `<feColorMatrix in='SourceGraphic' type='luminanceToAlpha' result='h'/><feGaussianBlur in='h' stdDeviation='${blur}' result='b'/>` +
    `<feDiffuseLighting in='b' surfaceScale='${depth}' diffuseConstant='1' lighting-color='#fff' result='l'><feDistantLight azimuth='225' elevation='${elev}'/></feDiffuseLighting>` +
    base +
    `<feComposite in='p' in2='l' operator='arithmetic' k1='${k1}' k2='0' k3='0' k4='0' result='lit'/>` +
    shine +
    `</filter></defs>` +
    `<g filter='url(#e)'><rect width='${w}' height='${h}' fill='#000' fill-opacity='0'/>${art.replace(/"/g, "'")}</g>` +
    `</svg>`
  return svg
}

/** Auspicious cloud (tường vân) as a raised shape */
export function cloud(x: number, y: number, s: number, flip = false) {
  const t = `translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s})`
  return (
    `<g transform="${t}">` +
    `<path d="M-50 12 H44 C58 12 60 -4 48 -8 C52 -24 32 -30 24 -18 C20 -34 -4 -38 -10 -20 C-18 -30 -38 -26 -34 -8 C-48 -10 -58 6 -50 12Z" fill="${g(0.5)}" stroke="${g(0.3)}" stroke-width="2"/>` +
    `<path d="M-10 -20 C-4 -10 8 -10 10 -18 C12 -25 3 -27 1 -21" fill="none" stroke="${g(0.75)}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M24 -18 C27 -9 38 -9 39 -15 C40 -21 33 -21 32 -17" fill="none" stroke="${g(0.75)}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M-34 -8 C-29 0 -20 -1 -20 -7 C-20 -12 -26 -12 -26 -8" fill="none" stroke="${g(0.75)}" stroke-width="2" stroke-linecap="round"/>` +
    `</g>`
  )
}

/** Red lacquer door leaf: carved mouldings, a peony branch in the upper panel, lattice and a cloud below */
export function doorArt(w: number, h: number, mirror = false, seed = 21) {
  const r = rng(seed)
  let s = ""
  s += `<rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="${g(0.55)}" stroke-width="3.2"/>`
  s += `<rect x="21" y="21" width="${w - 42}" height="${h - 42}" fill="none" stroke="${g(0.38)}" stroke-width="1.4"/>`
  const top = 64
  const ph = h * 0.36
  s += `<rect x="34" y="${top}" width="${w - 68}" height="${ph}" rx="10" fill="none" stroke="${g(0.5)}" stroke-width="2.2"/>`
  // peony branch
  const cx = w * 0.5
  const cy = top + ph * 0.5
  s += `<path d="M${f(cx - (mirror ? -1 : 1) * w * 0.28)} ${f(top + ph - 20)} Q${f(cx)} ${f(cy + 30)} ${f(cx + (mirror ? -1 : 1) * 10)} ${f(cy - 10)}" fill="none" stroke="${g(0.35)}" stroke-width="3"/>`
  for (let k = 0; k < 4; k++) s += leaf(cx + (r() - 0.5) * w * 0.3, cy + 10 + r() * ph * 0.3, w * 0.16, (mirror ? 1 : -1) * (30 + k * 40))
  s += outlineBloom(cx, cy - ph * 0.08, w * 0.2)
  s += outlineBloom(cx + (mirror ? 1 : -1) * w * 0.2, cy + ph * 0.26, w * 0.1)
  // lower panel: lattice + cloud
  const ly = h * 0.55
  const lh = h * 0.37
  s += `<rect x="34" y="${f(ly)}" width="${w - 68}" height="${f(lh)}" rx="10" fill="none" stroke="${g(0.5)}" stroke-width="2.2"/>`
  const step = (w - 88) / 5
  for (let i = 1; i < 5; i++) s += `<path d="M${f(44 + i * step)} ${f(ly + 10)} V${f(ly + lh - 10)}" stroke="${g(0.3)}" stroke-width="1.4"/>`
  for (let j = 1; j < 9; j++) s += `<path d="M44 ${f(ly + (lh / 9) * j)} H${w - 44}" stroke="${g(0.3)}" stroke-width="1.4"/>`

  for (const y of [h * 0.045, h * 0.495, h * 0.955]) for (const x of [w * 0.28, w * 0.72]) s += `<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${g(0.85)}"/>`
  return s
}

/** Peony carved as lines only (petal outlines in rings), reads as fine metal relief */
export function outlineBloom(cx: number, cy: number, r: number) {
  let s = `<g transform="translate(${f(cx)} ${f(cy)})">`
  const rings = [
    { n: 8, len: 1 },
    { n: 6, len: 0.72 },
    { n: 5, len: 0.46 },
  ]
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.n; i++) {
      const ang = (360 / ring.n) * i + ri * 22
      const L = r * ring.len
      const W = L * 0.7
      s += `<path d="M0 ${f(-L * 0.1)} C${f(-W)} ${f(-L * 0.25)} ${f(-W)} ${f(-L * 0.85)} 0 ${f(-L)} C${f(W)} ${f(-L * 0.85)} ${f(W)} ${f(-L * 0.25)} 0 ${f(-L * 0.1)}" transform="rotate(${f(ang)})" fill="none" stroke="${g(0.55 + ri * 0.12)}" stroke-width="${f(Math.max(1.2, r / 26))}"/>`
    }
  })
  s += `<circle r="${f(r * 0.14)}" fill="${g(0.8)}"/>`
  return s + `</g>`
}

/** Tone-on-tone carving for red backgrounds: scattered clouds and blooms */
export function lacquerArt(w: number, h: number, seed = 31) {
  const r = rng(seed)
  let s = ""
  for (let y = 40; y < h; y += 150) for (let x = (y / 150) % 2 ? 60 : 160; x < w + 60; x += 200) s += cloud(x + (r() - 0.5) * 30, y + (r() - 0.5) * 20, 0.8 + r() * 0.3, r() < 0.5)
  for (let k = 0; k < 4; k++) s += bloom(r() * w, r() * h, 34 + r() * 20, r() * 90, r)
  return s
}

/** Repeating band of clouds for red sections */
export function cloudBand(w: number, h: number) {
  return cloud(w * 0.25, h * 0.5, w / 420) + cloud(w * 0.75, h * 0.55, w / 460, true)
}

/** Envelope back: large overlapping blooms with fans of leaves and curling stems (seeded, so stable) */
export function envelopeArt(w: number, h: number, seed = 5) {
  const r = rng(seed)
  let s = ""
  const spots: [number, number, number][] = [
    [0.08, 0.06, 0.62], [0.74, 0.02, 0.5], [0.44, 0.2, 0.36], [1.02, 0.3, 0.56], [-0.04, 0.38, 0.5],
    [0.36, 0.52, 0.3], [0.92, 0.6, 0.44], [0.14, 0.74, 0.56], [0.62, 0.84, 0.5], [1.0, 0.98, 0.5], [0.3, 1.02, 0.46],
  ]
  // stems first (lowest relief), then leaves, then blooms on top
  // small leafy sprays in the gaps
  for (let k = 0; k < 10; k++) {
    const x = r() * w
    const y = r() * h
    const a = r() * 360
    for (let j = 0; j < 3; j++) s += leaf(x, y, 30 + r() * 20, a + j * 38 - 38)
  }
  for (const [px, py, pr] of spots) {
    const rad = pr * w * 0.5
    const base = r() * 360
    for (let k = 0; k < 4; k++) s += leaf(px * w, py * h, rad * (1.55 + r() * 0.4), base + k * 90 + (r() - 0.5) * 30)
  }
  for (const [px, py, pr] of spots) s += bloom(px * w, py * h, pr * w * 0.5, r() * 360, r)
  return s
}

/** Vertical border: a raised double moulding that runs straight down (no repeating motif, so the page
 *  does not seem to slide when scrolled) */
export function borderArt(w: number, h: number) {
  return (
    `<rect x="${w * 0.42}" y="-4" width="${w * 0.16}" height="${h + 8}" fill="${g(0.45)}"/>` +
    `<rect x="${w * 0.26}" y="-4" width="2" height="${h + 8}" fill="${g(0.35)}"/>` +
    `<rect x="${w * 0.7}" y="-4" width="2" height="${h + 8}" fill="${g(0.35)}"/>`
  )
}

/** Lotus pad seen from above: round leaf with a notch and radiating veins */
export function lotusPad(x: number, y: number, r: number, rot: number) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`
  s += `<path d="M0 0 L${f(r * Math.cos(-0.25))} ${f(r * Math.sin(-0.25))} A${f(r)} ${f(r)} 0 1 1 ${f(r * Math.cos(0.25))} ${f(r * Math.sin(0.25))} Z" fill="${g(0.34)}" stroke="${g(0.26)}" stroke-width="2"/>`
  for (let i = 0; i < 9; i++) {
    const a = 0.5 + (i / 8) * (Math.PI * 2 - 1)
    s += `<path d="M0 0 Q${f(r * 0.45 * Math.cos(a + 0.08))} ${f(r * 0.45 * Math.sin(a + 0.08))} ${f(r * 0.86 * Math.cos(a))} ${f(r * 0.86 * Math.sin(a))}" fill="none" stroke="${g(0.39)}" stroke-width=".9"/>`
  }
  s += `<circle r="${f(r * 0.08)}" fill="${g(0.55)}"/>`
  return s + `</g>`
}

/** Lotus flower seen from the side: layered pointed petals on a short stem */
export function lotusFlower(x: number, y: number, s0: number, rot = 0) {
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s0)})">`
  s += `<path d="M0 0 C-2 30 2 60 0 90" fill="none" stroke="${g(0.3)}" stroke-width="3"/>`
  const petal = (ang: number, len: number, v: number) =>
    `<path d="M0 0 C${f(-len * 0.32)} ${f(-len * 0.3)} ${f(-len * 0.2)} ${f(-len * 0.8)} 0 ${f(-len)} C${f(len * 0.2)} ${f(-len * 0.8)} ${f(len * 0.32)} ${f(-len * 0.3)} 0 0Z" transform="rotate(${f(ang)})" fill="${g(v)}" stroke="${g(v - 0.14)}" stroke-width="1.4"/>`
  for (const a of [-70, 70]) s += petal(a, 46, 0.42)
  for (const a of [-42, 42]) s += petal(a, 54, 0.52)
  for (const a of [-16, 16]) s += petal(a, 60, 0.62)
  s += petal(0, 64, 0.72)
  return s + `</g>`
}

/** Lotus leaf seen from the side: a wide shallow umbrella on a long stem */
export function lotusLeafSide(x: number, y: number, w0: number, tilt: number) {
  const hw = w0 / 2
  let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(tilt)})">`
  s += `<path d="M0 0 C-2 60 2 120 0 400" fill="none" stroke="${g(0.3)}" stroke-width="3"/>`
  s += `<path d="M${f(-hw)} 0 C${f(-hw * 0.6)} ${f(-hw * 0.38)} ${f(hw * 0.6)} ${f(-hw * 0.38)} ${f(hw)} 0 C${f(hw * 0.5)} ${f(hw * 0.16)} ${f(-hw * 0.5)} ${f(hw * 0.16)} ${f(-hw)} 0Z" fill="${g(0.4)}" stroke="${g(0.28)}" stroke-width="1.8"/>`
  for (let i = -3; i <= 3; i++) s += `<path d="M0 ${f(-hw * 0.05)} Q${f(i * hw * 0.13)} ${f(-hw * 0.2)} ${f(i * hw * 0.29)} ${f(-hw * 0.27 + Math.abs(i) * hw * 0.06)}" fill="none" stroke="${g(0.48)}" stroke-width="1"/>`
  return s + `</g>`
}

/** Pond scene (fits inside its tile, so it repeats sideways without seams) */
export function pondArt(w: number, h: number) {
  let s = ""
  s += lotusLeafSide(w * 0.16, h * 0.55, w * 0.34, -6)
  s += lotusLeafSide(w * 0.62, h * 0.66, w * 0.4, 5)
  s += lotusLeafSide(w * 0.9, h * 0.48, w * 0.22, 8)
  s += lotusFlower(w * 0.38, h * 0.4, 0.95, -4)
  s += lotusFlower(w * 0.8, h * 0.3, 0.75, 7)
  // bud
  s += `<g transform="translate(${f(w * 0.05)} ${f(h * 0.32)})"><path d="M0 0 C-2 60 2 120 0 300" fill="none" stroke="${g(0.3)}" stroke-width="2.6"/><path d="M0 0 C-11 -12 -9 -34 0 -46 C9 -34 11 -12 0 0Z" fill="${g(0.6)}" stroke="${g(0.45)}" stroke-width="1.4"/></g>`
  return s
}

/** Wreath of small blooms and leaves around a circle (for a lid or a photo frame) */
export function wreathArt(w: number, h: number, radius: number, seed = 51) {
  const r = rng(seed)
  const cx = w / 2
  const cy = h / 2
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(radius)}" fill="none" stroke="${g(0.32)}" stroke-width="2.4"/>`
  const n = 22
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const x = cx + Math.cos(a) * radius
    const y = cy + Math.sin(a) * radius
    const tangent = (a * 180) / Math.PI + 90
    s += leaf(x, y, radius * 0.24, tangent + 50 + (r() - 0.5) * 20)
    s += leaf(x, y, radius * 0.2, tangent - 130 + (r() - 0.5) * 20)
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2
    s += bloom(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, radius * (i % 3 === 0 ? 0.2 : 0.14), r() * 90, r)
  }
  return s
}

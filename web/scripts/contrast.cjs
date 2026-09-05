/**
 * Contrast harness for text sitting over the live 3D scene.
 *
 * Needs playwright, which is deliberately not a dependency of this app:
 *   npm i -D playwright && npx playwright install chromium
 *   npm run dev            # in another terminal
 *   node scripts/contrast.cjs          # desktop
 *   node scripts/contrast.cjs mobile   # 390x844, touch, MOBILE_FRAMING
 *
 * Hides every text element, photographs the frame underneath, and measures the
 * WCAG ratio of each text colour against the real ground inside its own box.
 *
 * Eyeballing a scrim cannot do this: the ground moves and changes brightness as
 * modules light, the boot flare fires and the reveal surges, so one scrim is
 * generous at one scroll position and failing at another, and neither state
 * looks wrong to the person who tuned it.
 *
 * Two things this got wrong on the first pass, both worth keeping fixed:
 *   - Tailwind 4 emits oklch(). Parsing getComputedStyle().color as rgb() reads
 *     lightness/chroma/hue as sRGB channels and reports ~1.0:1 on perfectly
 *     legible copper text. Colours are resolved by painting them to a canvas.
 *   - Text scrolled under the fixed header is occluded by the nav, not by the
 *     scene, so measuring it says nothing about the scrims.
 *
 * Worst case is the 98th-percentile luminance under the box, not the brightest
 * pixel, so a single dust mote cannot fail a heading.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = process.cwd();
const URL = 'http://localhost:5173';

const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => { const hi = a >= b ? a : b; const lo = a >= b ? b : a; return (hi + 0.05) / (lo + 0.05); };

const collect = (page) => page.evaluate(() => {
  const out = [];
  let i = 0;
  const cc = document.createElement('canvas'); cc.width = cc.height = 1;
  const cctx = cc.getContext('2d', { willReadFrequently: true });
  const resolve = (css) => {
    cctx.clearRect(0, 0, 1, 1);
    cctx.fillStyle = '#000';
    cctx.fillStyle = css;
    cctx.fillRect(0, 0, 1, 1);
    const d = cctx.getImageData(0, 0, 1, 1).data;
    return { rgb: [d[0], d[1], d[2]], a: d[3] / 255 };
  };
  const hdr = document.querySelector('header');
  const navBottom = hdr ? hdr.getBoundingClientRect().bottom : 0;

  for (const el of document.querySelectorAll('h1,h2,h3,p,a,span,li,button')) {
    const direct = Array.from(el.childNodes).filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join(' ').trim();
    if (direct.length < 2) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 6) continue;
    if (r.bottom < 4 || r.top > innerHeight - 4 || r.right < 0 || r.left > innerWidth) continue;
    if (r.top < navBottom + 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.95) continue;
    const res = resolve(cs.color);
    if (res.a < 0.12) continue;
    // An ancestor can hide this without the element itself saying so - the
    // collapsed mobile menu is opacity:0 on its wrapper, and its links were
    // being measured against a frame they are not actually in.
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) continue;
    const fsz = parseFloat(cs.fontSize);
    const wt = parseInt(cs.fontWeight, 10) || 400;
    el.setAttribute('data-ct', String(i));
    out.push({
      i, text: direct.slice(0, 44), tag: el.tagName.toLowerCase(),
      color: res.rgb, alpha: res.a, fontSize: fsz, bold: wt >= 700,
      rect: {
        x: Math.max(0, r.left), y: Math.max(0, r.top),
        w: Math.min(r.width, innerWidth - Math.max(0, r.left)),
        h: Math.min(r.height, innerHeight - Math.max(0, r.top)),
      },
    });
    i++;
  }
  return out;
});

async function measure(page, sampler, label, frac, vp) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * frac));
  await page.waitForTimeout(1800);

  const targets = await collect(page);
  await page.addStyleTag({ content: '[data-ct]{visibility:hidden}' });
  await page.waitForTimeout(200);
  const shot = path.join(OUT, 'ct-' + vp + '-' + label + '.png');
  await page.screenshot({ path: shot });
  const dpr = await page.evaluate(() => devicePixelRatio);

  const stats = await sampler.evaluate(async (args) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + args.b64; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const sr = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return args.boxes.map((b) => {
      const x = Math.round(b.rect.x * args.dpr), y = Math.round(b.rect.y * args.dpr);
      const w = Math.max(1, Math.round(b.rect.w * args.dpr));
      const h = Math.max(1, Math.round(b.rect.h * args.dpr));
      const d = ctx.getImageData(x, y, w, h).data;
      const n = d.length / 4;
      const L = new Float64Array(n);
      for (let p = 0, k = 0; p < d.length; p += 4, k++) {
        L[k] = 0.2126 * sr(d[p]) + 0.7152 * sr(d[p + 1]) + 0.0722 * sr(d[p + 2]);
      }
      const sorted = Float64Array.from(L).sort();
      const hiL = sorted[Math.min(n - 1, Math.floor(n * 0.98))];
      let best = 0, bd = Infinity;
      for (let k = 0; k < n; k++) { const dd = Math.abs(L[k] - hiL); if (dd < bd) { bd = dd; best = k; } }
      const o = best * 4;
      return { i: b.i, hiL, bg: [d[o], d[o + 1], d[o + 2]] };
    });
  }, { b64: fs.readFileSync(shot).toString('base64'), boxes: targets, dpr });

  await page.evaluate(() => {
    document.querySelectorAll('style').forEach((s) => {
      if (s.textContent.indexOf('[data-ct]') !== -1) s.remove();
    });
    document.querySelectorAll('[data-ct]').forEach((e) => e.removeAttribute('data-ct'));
  });

  const rows = [];
  for (const t of targets) {
    const s = stats.find((x) => x.i === t.i);
    if (!s) continue;
    const fg = t.alpha < 1 ? t.color.map((c, k) => c * t.alpha + s.bg[k] * (1 - t.alpha)) : t.color;
    const r = ratio(lum(fg), s.hiL);
    const large = t.fontSize >= 24 || (t.bold && t.fontSize >= 18.66);
    const need = large ? 3.0 : 4.5;
    rows.push(Object.assign({}, t, { ratio: r, need, pass: r >= need, hiL: s.hiL, bg: s.bg }));
  }
  return rows;
}

(async () => {
  const mobile = process.argv[2] === 'mobile';
  const vp = mobile ? 'mobile' : 'desktop';
  const b = await chromium.launch();
  const ctx = await b.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const sampler = await ctx.newPage();
  await sampler.goto('about:blank');
  await page.bringToFront();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForTimeout(3200);

  const stops = [['hero', 0], ['about', 0.2], ['services', 0.4], ['projects', 0.72], ['cta', 0.93]];
  let fails = 0, total = 0;
  for (const stop of stops) {
    const rows = await measure(page, sampler, stop[0], stop[1], vp);
    total += rows.length;
    const bad = rows.filter((r) => !r.pass).sort((a, z) => a.ratio - z.ratio);
    console.log('\n=== ' + vp + ' @ ' + stop[0] + ' - ' + rows.length + ' measured, ' + bad.length + ' below threshold');
    for (const r of bad) {
      fails++;
      console.log('  FAIL ' + r.ratio.toFixed(2) + ':1 (needs ' + r.need + ') <' + r.tag + '> '
        + JSON.stringify(r.text) + ' fg=[' + r.color + '] bgL=' + r.hiL.toFixed(3)
        + ' bg=[' + r.bg + '] @' + Math.round(r.rect.x) + ',' + Math.round(r.rect.y));
    }
    for (const r of rows.filter((x) => x.pass).sort((a, z) => a.ratio - z.ratio).slice(0, 2)) {
      console.log('  ok   ' + r.ratio.toFixed(2) + ':1 (needs ' + r.need + ') <' + r.tag + '> ' + JSON.stringify(r.text));
    }
  }
  console.log('\nTOTAL ' + vp + ': ' + fails + ' failing of ' + total + ' measured');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });

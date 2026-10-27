// ---- Fun: entrance stagger, ripples, confetti ----
let enterTimer;
export function enterAnim() {
  document.querySelectorAll('.tl-comment, .TLI, .thread, .sb-item, .merge-card, .composer, .pr-title-area').forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 14)); el.classList.add('enter-in'); });
  clearTimeout(enterTimer); enterTimer = setTimeout(() => document.querySelectorAll('.enter-in').forEach((el) => el.classList.remove('enter-in')), 1800);
}

document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, rip = document.createElement('span');
  rip.className = 'ripple'; rip.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  b.style.overflow = 'hidden'; b.appendChild(rip); setTimeout(() => rip.remove(), 650);
  if (b.matches('.reaction, .react-add')) burst(e.clientX, e.clientY, b.textContent.trim().slice(0, 2) || '✨', 6);
});

export function burst(x, y, ch, n) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span'); p.className = 'burst'; p.textContent = ch;
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.6, v = 40 + Math.random() * 50;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * v}px;--dy:${Math.sin(a) * v - 30}px`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 900);
  }
}

export function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const g = c.getContext('2d'), cols = ['#0969da', '#1f883d', '#8250df', '#f2cc60', '#cf222e', '#ff8fb1'];
  const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * cols.length) | 0] }));
  let t = 0;
  (function f() {
    g.clearRect(0, 0, c.width, c.height); t++;
    ps.forEach((p) => { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - t / 130); g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
    if (t < 130) requestAnimationFrame(f); else c.remove();
  })();
}

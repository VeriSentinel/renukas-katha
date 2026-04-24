/* ============================================
   MAIN.JS — Pure Starfield + Text Transitions
   One continuous galaxy canvas
   Text fades in/out with zoom as you scroll
   Lens flares change color per section
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initScroll();
  loadPosts();
  initCategoryFilter();
});

/* ---- Galaxy Canvas ---- */
function initCanvas() {
  const c = document.getElementById('galaxyCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, cx, cy, t = 0, af;
  const stars = [], NEB = [];

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    cx = W / 2; cy = H / 2;
    makeStars(); makeNeb();
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 2200; i++) {
      const a = Math.random() * 6.28, d = Math.random() * Math.max(W, H) * 0.9, l = Math.random();
      const r = Math.random();
      const col = r < 0.55 ? [255,255,255] : r < 0.72 ? [200,220,255] : r < 0.84 ? [255,230,180] : r < 0.93 ? [255,200,150] : [180,160,255];
      stars.push({ a, d, s: 0.3 + Math.random() * 2.5 * l, b: 0.3 + Math.random() * 0.7, ts: 0.5 + Math.random() * 3, to: Math.random() * 6.28, l, col });
    }
  }

  function makeNeb() {
    NEB.length = 0;
    const cols = [[60,20,120,0.035],[120,40,80,0.03],[20,40,100,0.035],[80,60,20,0.025],[30,80,100,0.025],[100,30,60,0.03],[50,10,90,0.02],[40,60,80,0.02]];
    for (let i = 0; i < 8; i++) NEB.push({ a: Math.random() * 6.28, d: 80 + Math.random() * Math.max(W, H) * 0.4, r: 150 + Math.random() * 400, c: cols[i] });
  }

  function draw() {
    t += 0.016;
    ctx.fillStyle = '#040410';
    ctx.fillRect(0, 0, W, H);
    const br = t * 0.018;
    for (const n of NEB) {
      const r = br * 0.25 + n.a, nx = cx + Math.cos(r) * n.d, ny = cy + Math.sin(r) * n.d;
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
      g.addColorStop(0, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.c[3] * 1.5})`);
      g.addColorStop(0.5, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.c[3] * 0.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(nx - n.r, ny - n.r, n.r * 2, n.r * 2);
    }
    for (const s of stars) {
      const a = s.a + br * (0.01 + s.l * 0.025);
      const x = cx + Math.cos(a) * s.d, y = cy + Math.sin(a) * s.d;
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * s.ts + s.to);
      const al = s.b * (0.5 + tw * 0.5), sz = s.s * (0.8 + tw * 0.2);
      if (sz > 1.3) { ctx.beginPath(); ctx.arc(x, y, sz * 2.5, 0, 6.28); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${al * 0.08})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.28); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${al})`; ctx.fill();
    }
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.3);
    cg.addColorStop(0, 'rgba(212,168,83,0.04)'); cg.addColorStop(0.4, 'rgba(180,140,80,0.015)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    af = requestAnimationFrame(draw);
  }

  resize(); draw();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(af); else draw(); });
}

/* ---- Scroll animations ---- */
function initScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  gsap.from('.hero-title', { opacity: 0, y: 50, scale: 0.9, duration: 2, ease: 'power3.out', delay: 0.3 });
  gsap.from('#s1 .sloka', { opacity: 0, y: 30, duration: 1.5, ease: 'power3.out', delay: 1 });
  gsap.from('#s1 .sloka-en', { opacity: 0, y: 25, duration: 1.5, ease: 'power3.out', delay: 1.3 });

  // Each scene: text fades in from below, then zooms out + fades when leaving
  const scenes = gsap.utils.toArray('.scene');

  scenes.forEach((scene, i) => {
    // Fade IN (skip first — it animates on load)
    if (i > 0) {
      gsap.from(scene.querySelector('.scene-content'), {
        opacity: 0, y: 80, scale: 0.92,
        scrollTrigger: { trigger: scene, start: 'top 80%', end: 'top 30%', scrub: 0.5 }
      });
    }

    // Fade OUT + zoom: as you scroll past, text zooms in and fades
    gsap.to(scene.querySelector('.scene-content'), {
      opacity: 0, scale: 1.3, y: -50,
      scrollTrigger: { trigger: scene, start: 'bottom 70%', end: 'bottom 10%', scrub: 0.5 }
    });
  });

  // Lens flare color changes
  const f1 = document.querySelector('.f1'), f2 = document.querySelector('.f2');
  if (f1 && f2) {
    // Solar section: bright yellow flares
    ScrollTrigger.create({
      trigger: '#s2', start: 'top 60%',
      onEnter: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(255,220,80,0.55) 0%,transparent 70%)', x: -60, opacity: 0.8, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(255,200,60,0.4) 0%,transparent 70%)', x: 40, opacity: 0.5, duration: 1.5 }); },
      onLeaveBack: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(212,168,83,0.45) 0%,transparent 70%)', x: 0, opacity: 0.5, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(100,180,255,0.35) 0%,transparent 70%)', x: 0, opacity: 0.3, duration: 1.5 }); }
    });
    // Earth section: blue flares
    ScrollTrigger.create({
      trigger: '#s3', start: 'top 60%',
      onEnter: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(80,180,255,0.5) 0%,transparent 70%)', x: 40, opacity: 0.7, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(150,220,255,0.4) 0%,transparent 70%)', x: -30, opacity: 0.6, duration: 1.5 }); },
      onLeaveBack: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(255,220,80,0.55) 0%,transparent 70%)', x: -60, opacity: 0.8, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(255,200,60,0.4) 0%,transparent 70%)', x: 40, opacity: 0.5, duration: 1.5 }); }
    });
    // India section: warm golden
    ScrollTrigger.create({
      trigger: '#s4', start: 'top 60%',
      onEnter: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(212,168,83,0.6) 0%,transparent 70%)', x: -30, opacity: 0.85, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(232,168,124,0.4) 0%,transparent 70%)', x: 50, opacity: 0.6, duration: 1.5 }); },
      onLeaveBack: () => { gsap.to(f1, { background: 'radial-gradient(circle,rgba(80,180,255,0.5) 0%,transparent 70%)', x: 40, opacity: 0.7, duration: 1.5 }); gsap.to(f2, { background: 'radial-gradient(circle,rgba(150,220,255,0.4) 0%,transparent 70%)', x: -30, opacity: 0.6, duration: 1.5 }); }
    });
    // Content: hide flares
    ScrollTrigger.create({
      trigger: '#content-section', start: 'top 80%',
      onEnter: () => { gsap.to([f1, f2], { opacity: 0, duration: 0.8 }); },
      onLeaveBack: () => { gsap.to(f1, { opacity: 0.85, duration: 1 }); gsap.to(f2, { opacity: 0.6, duration: 1 }); }
    });
  }

  // Scroll indicator
  ScrollTrigger.create({
    trigger: '#s2', start: 'top 80%',
    onEnter: () => document.getElementById('scrollIndicator')?.classList.add('hidden'),
    onLeaveBack: () => document.getElementById('scrollIndicator')?.classList.remove('hidden')
  });

  // Content section reveal
  const sh = document.querySelector('#content-section .section-header');
  if (sh) {
    gsap.set(sh, { opacity: 0, y: 50 });
    new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { gsap.to(e.target, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }); } });
    }, { threshold: 0.1 }).observe(sh);
  }
}

/* ---- Posts ---- */
let allPosts = [];
async function loadPosts() {
  const g = document.getElementById('postsGrid'); if (!g) return;
  try { const r = await fetch('data/posts.json'); allPosts = await r.json(); renderPosts(allPosts); }
  catch { g.innerHTML = '<div class="no-posts"><div class="icon">📚</div><p>Unable to load posts.</p></div>'; }
}
function renderPosts(posts) {
  const g = document.getElementById('postsGrid');
  if (!posts.length) { g.innerHTML = '<div class="no-posts"><div class="icon">📚</div><p>No posts yet!</p></div>'; return; }
  g.innerHTML = posts.map(p => `
    <article class="post-card" onclick="location.href='/post/${p.id}'" data-category="${p.category}">
      ${p.coverImage ? `<div class="card-image"><img src="${p.coverImage}" alt="${p.title}" loading="lazy"><span class="category-badge">${p.category}</span></div>` : `<div class="no-image"><span class="category-badge" style="position:relative">${p.category==='Story'?'📖':'🪶'}</span></div>`}
      <div class="card-body"><h3>${esc(p.title)}</h3><p class="excerpt">${esc(p.excerpt)}</p><div class="card-meta"><span>${fmtDate(p.createdAt)}</span><span class="read-more">Read ${p.category==='Poem'?'Poem':'Story'} →</span></div></div>
    </article>`).join('');
  if (typeof gsap !== 'undefined') {
    const cards = document.querySelectorAll('.post-card');
    gsap.set(cards, { opacity: 0, y: 40 });
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { gsap.to(e.target, { opacity: 1, y: 0, duration: 0.5, delay: [...cards].indexOf(e.target) * 0.1 }); obs.unobserve(e.target); } }), { threshold: 0.1 });
    cards.forEach(c => obs.observe(c));
  }
}
function initCategoryFilter() {
  document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
    const f = b.dataset.filter; renderPosts(f === 'all' ? allPosts : allPosts.filter(p => p.category === f));
  }));
}
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }); }

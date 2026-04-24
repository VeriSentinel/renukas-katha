/* ============================================
   MAIN.JS — Cinematic Homepage
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initScroll();
  initPosts();
  initFilters();
});

/* ---- 🌌 CONTINUOUS GALAXY CANVAS ---- */
function initCanvas() {
  const canvas = document.getElementById('galaxyCanvas');
  const ctx = canvas.getContext('2d');
  
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  const stars = [];
  const starCount = 2200; // Dense starfield

  for(let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 2, // parallax depth
      r: Math.random() * 1.5 + 0.2, // size
      color: `rgba(${Math.floor(Math.random()*55)+200}, ${Math.floor(Math.random()*55)+200}, 255, ${Math.random()})`,
      vel: (Math.random() * 0.05 + 0.01) // rotation velocity
    });
  }

  let angle = 0;

  function draw() {
    // Dark space background
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, w, h);

    // Save context for rotation
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(angle);
    
    // Draw stars
    for(let s of stars) {
      ctx.beginPath();
      ctx.fillStyle = s.color;
      // Slight twinkle using sine save
      const twinkle = Math.abs(Math.sin(Date.now() * 0.001 * s.vel * 50));
      ctx.globalAlpha = Math.max(0.2, twinkle);
      
      // Rotate coordinates manually or rely on context rotate
      ctx.arc(s.x - w/2, s.y - h/2, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    angle += 0.0003; // Extremely slow cosmic rotation
    
    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });
}

/* ---- 🎬 CINEMATIC SCROLL TRANSITIONS ---- */
function initScroll() {
  gsap.registerPlugin(ScrollTrigger);

  const scenes = document.querySelectorAll('.scene');
  const indicator = document.getElementById('scrollIndicator');

  // Hide scroll indicator on scroll
  ScrollTrigger.create({
    trigger: scenes[0],
    start: "top top",
    onUpdate: (self) => {
      if(self.progress > 0.05) indicator.classList.add('hidden');
      else indicator.classList.remove('hidden');
    }
  });

  // Fade and zoom each text scene
  scenes.forEach((scene, i) => {
    const content = scene.querySelector('.scene-content');
    
    // Initial state
    gsap.set(content, { opacity: 0, scale: 0.8, y: 50 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top center",
        end: "bottom center",
        scrub: 1, // Smooth scrub
        onEnter: () => updateFlares(i),
        onEnterBack: () => updateFlares(i)
      }
    });

    // Fade in & zoom to normal
    tl.to(content, { opacity: 1, scale: 1, y: 0, duration: 1 })
      // Fade out & zoom larger when scrolling past
      .to(content, { opacity: 0, scale: 1.3, duration: 1 }, "+=0.5");
  });
}

/* ---- 🌟 DYNAMIC LENS FLARES ---- */
function updateFlares(sceneIndex) {
  const f1 = document.querySelector('.f1');
  const f2 = document.querySelector('.f2');
  
  const colors = [
    // 0: Hero - Gold & Soft Blue
    { c1: 'rgba(212,168,83,0.45)', c2: 'rgba(100,180,255,0.35)' },
    // 1: Solar System - Bright Yellow & Orange
    { c1: 'rgba(255,200,50,0.5)', c2: 'rgba(255,100,50,0.3)' },
    // 2: Earth - Deep Blue & Green
    { c1: 'rgba(50,150,255,0.6)', c2: 'rgba(50,255,150,0.3)' },
    // 3: India - Warm Gold & Saffron
    { c1: 'rgba(255,153,51,0.5)', c2: 'rgba(212,168,83,0.4)' }
  ];

  const target = colors[sceneIndex] || colors[0];
  
  if (f1) f1.style.background = `radial-gradient(circle, ${target.c1} 0%, transparent 70%)`;
  if (f2) f2.style.background = `radial-gradient(circle, ${target.c2} 0%, transparent 70%)`;
}

/* ---- 📖 POSTS SYSTEM (Client-side) ---- */
let allPosts = [];
const POSTS_KEY = 'rkl_posts';

async function initPosts() {
  const g = document.getElementById('postsGrid'); 
  if (!g) return;

  // 1. Try local storage
  let postsStr = localStorage.getItem(POSTS_KEY);
  
  if (postsStr) {
    try {
      allPosts = JSON.parse(postsStr);
    } catch (e) {
      allPosts = [];
    }
  }

  // 2. If empty, try fetching static JSON
  if (allPosts.length === 0) {
    try { 
      const r = await fetch('data/posts.json'); 
      allPosts = await r.json(); 
      localStorage.setItem(POSTS_KEY, JSON.stringify(allPosts));
    } catch { 
      g.innerHTML = '<div class="no-posts"><div class="icon">📚</div><p>Unable to load posts.</p></div>'; 
      return;
    }
  }
  
  renderPosts(allPosts);
}

function renderPosts(posts) {
  const g = document.getElementById('postsGrid');
  if (!g) return;

  if (posts.length === 0) {
    g.innerHTML = `
      <div class="no-posts">
        <div class="icon">🪶</div>
        <p>No posts found. They will appear here once published.</p>
      </div>`;
    return;
  }

  g.innerHTML = posts.map(post => `
    <div class="post-card" onclick="window.location.href='post.html?id=${post.id}'">
      <div class="card-image">
        ${post.coverImage 
          ? `<img src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="lazy">`
          : `<div class="no-image">${post.category === 'Story' ? '📖' : '🪶'}</div>`
        }
        <span class="category-badge">${post.category}</span>
      </div>
      <div class="card-body">
        <h3>${escapeHtml(post.title)}</h3>
        <p class="excerpt">${escapeHtml(post.excerpt || post.content.substring(0, 150))}...</p>
        <div class="card-meta">
          <span class="date">${formatDate(post.createdAt)}</span>
          <span class="read-more">Read ${post.category} →</span>
        </div>
      </div>
    </div>
  `).join('');
}

function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      if (filter === 'all') {
        renderPosts(allPosts);
      } else {
        renderPosts(allPosts.filter(p => p.category === filter));
      }
    });
  });
}

/* ---- Helpers ---- */
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }

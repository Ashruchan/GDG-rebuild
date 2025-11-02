/* script.js
   - Top navbar implementation: mobile toggle, smooth scroll, active link highlight
   - Theme toggle, custom cursor, reveal/parallax, form submit (no backend)
   - Intro animation added (plays on page open). Particles start after intro completes.
*/

/* ---- Utilities ---- */
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

/* ---- DOM Elements ---- */
const navLinks = qsa('.nav-link');
const mobileLinks = qsa('.mobile-link');
const scrollButtons = qsa('[data-scroll-to]');
const hamburger = qs('#hamburger');
const mobileMenu = qs('#mobileMenu');
const navIndicator = qs('.nav-indicator');
const nav = qs('.nav');
const themeToggle = qs('#theme-toggle');
const cursor = qs('#cursor');
const revealElems = qsa('.reveal');
const parallaxElems = qsa('[data-parallax]');
const form = qs('#joinForm');
const formSuccess = qs('#formSuccess');
const yearEl = qs('#year');
const joinNow = qs('#joinNow');

if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- Theme ---- */
(function initTheme(){
  const saved = localStorage.getItem('gdg-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
})();
if (themeToggle){
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gdg-theme', next);
  });
}

/* ---- Intro animation manager ---- */
(function introManager(){
  const intro = document.getElementById('intro');
  if (!intro) {
    // no intro present — immediately signal completion
    document.dispatchEvent(new CustomEvent('introComplete'));
    return;
  }

  const introInner = document.getElementById('introInner');
  const progress = document.getElementById('introProgress');
  const progressBar = progress ? progress.querySelector('.bar') : null;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If reduced motion, skip animation quickly
  if (prefersReduced) {
    intro.classList.add('finish');
    setTimeout(()=> {
      intro.classList.add('hidden');
      document.dispatchEvent(new CustomEvent('introComplete'));
    }, 260);
    return;
  }

  // Play staged intro:
  // 1) show intro with pulsing logo (CSS)
  // 2) animate progress bar ~1.6s
  // 3) fade out intro, then dispatch 'introComplete'
  let played = false;

  function startIntro(){
    if (played) return;
    played = true;

    // animate progress
    if (progressBar){
      // stagger: fill to 70% -> wait -> finish to 100%
      progressBar.style.width = '72%';
      setTimeout(()=> progressBar.style.width = '100%', 900);
    }

    // after total duration, finish
    const total = 1650; // ms
    setTimeout(()=> {
      intro.classList.add('finish'); // triggers CSS fade/translate
      // small delay to allow fade
      setTimeout(()=> {
        intro.classList.add('hidden');
        introInner.setAttribute('aria-hidden','true');
        // tell the app particles can start now
        document.dispatchEvent(new CustomEvent('introComplete'));
      }, 420);
    }, total);
  }

  // Start automatically after small delay so user sees logo briefly
  setTimeout(startIntro, 220);

  // allow skipping by click or key
  function skipIntro(){
    if (!played) {
      played = true;
      if (progressBar) progressBar.style.width = '100%';
      intro.classList.add('finish');
      setTimeout(()=> {
        intro.classList.add('hidden');
        introInner.setAttribute('aria-hidden','true');
        document.dispatchEvent(new CustomEvent('introComplete'));
      }, 260);
    }
  }

  intro.addEventListener('click', skipIntro);
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') skipIntro();
  });
})();

/* ---- Custom Cursor ---- */
let mouse = {x: window.innerWidth/2, y: window.innerHeight/2};
let targetSize = 14;
function rafCursor(){
  if (cursor) {
    cursor.style.left = (mouse.x) + 'px';
    cursor.style.top = (mouse.y) + 'px';
    cursor.style.width = targetSize + 'px';
    cursor.style.height = targetSize + 'px';
  }
  requestAnimationFrame(rafCursor);
}
window.addEventListener('mousemove', (e)=>{
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (cursor) cursor.style.opacity = 1;
});
requestAnimationFrame(rafCursor);

const interactive = 'button, a, .btn, input, textarea, .nav-link, .mobile-link';
document.addEventListener('mouseover', (e)=>{
  if (e.target.closest(interactive)) {
    targetSize = 36;
    if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1.02)';
  }
});
document.addEventListener('mouseout', (e)=>{
  if (!e.relatedTarget || !e.relatedTarget.closest(interactive)) {
    targetSize = 14;
    if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)';
  }
});

/* ---- Smooth Scroll ---- */
function smoothScrollTo(targetY, duration=700){
  const startY = window.scrollY || window.pageYOffset;
  const diff = targetY - startY;
  let start;
  const easing = t => (--t)*t*t+1;
  return new Promise(resolve=>{
    function step(timestamp){
      if (!start) start = timestamp;
      const time = timestamp - start;
      const t = Math.min(1, time / duration);
      window.scrollTo(0, Math.round(startY + diff * easing(t)));
      if (time < duration) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

/* ---- NAV: indicator and links ---- */
function updateIndicator(el){
  if (!el || !navIndicator) { if (navIndicator) navIndicator.style.opacity = 0; return; }
  const rect = el.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();
  const left = rect.left - navRect.left;
  navIndicator.style.left = `${left}px`;
  navIndicator.style.width = `${rect.width}px`;
  navIndicator.style.opacity = 1;
}
function setActiveById(id){
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  const active = nav.querySelector(`.nav-link[href="#${id}"]`);
  if (active) updateIndicator(active);
}
navLinks.forEach(link => {
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    const target = link.getAttribute('href').replace('#','');
    const el = document.getElementById(target);
    if (el) {
      smoothScrollTo(el.offsetTop - 12, 700).then(()=> {
        el.setAttribute('tabindex','-1');
        el.focus({preventScroll:true});
      });
    }
  });
});
if (hamburger){
  hamburger.addEventListener('click', ()=>{
    const open = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (mobileMenu){
      mobileMenu.style.display = open ? 'block' : 'none';
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
  });
}
qsa('.mobile-link').forEach(link => {
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    const target = link.getAttribute('href').replace('#','');
    const el = document.getElementById(target);
    if (el) {
      smoothScrollTo(el.offsetTop - 12, 700).then(()=> {
        if (hamburger){
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded','false');
        }
        if (mobileMenu){
          mobileMenu.style.display = 'none';
          mobileMenu.setAttribute('aria-hidden','true');
        }
        el.setAttribute('tabindex','-1');
        el.focus({preventScroll:true});
      });
    }
  });
});
window.addEventListener('resize', ()=> {
  const active = document.querySelector('.nav-link.active');
  if (active) updateIndicator(active);
});
const sections = qsa('main .section[id]');
const sectionObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if (entry.isIntersecting){
      const id = entry.target.id;
      setActiveById(id);
    }
  });
}, { root: null, threshold: 0.35 });
sections.forEach(s => sectionObserver.observe(s));

/* ---- Reveal animations ---- */
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if (entry.isIntersecting){
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { root: null, rootMargin: '0px', threshold: 0.12 });
revealElems.forEach(el => revealObserver.observe(el));

/* ---- Parallax ---- */
function updateParallax(){
  const sc = window.scrollY;
  parallaxElems.forEach(el => {
    const speed = parseFloat(el.getAttribute('data-parallax')) || 0;
    el.style.transform = `translateY(${sc * speed}px)`;
  });
}
window.addEventListener('scroll', updateParallax);
updateParallax();

/* ---- Form (no backend) ---- */
if (form){
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) {
      form.classList.remove('invalid');
      void form.offsetWidth;
      form.classList.add('invalid');
      return;
    }
    formSuccess.hidden = false;
    form.reset();
    formSuccess.classList.add('pulse');
    setTimeout(()=> formSuccess.classList.remove('pulse'), 900);
    setTimeout(()=> formSuccess.hidden = true, 3200);
  });
}

/* ---- Accessibility: close mobile menu on Escape ---- */
window.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') {
    if (hamburger && hamburger.classList.contains('open')){
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded','false');
      if (mobileMenu) { mobileMenu.style.display = 'none'; mobileMenu.setAttribute('aria-hidden','true'); }
    }
  }
});

/* ========================
   ORBITING PARTICLES (Canvas)
   - Canvas drawing at DPR resolution
   - 10-20 particles, Google colors
   - Smooth orbits using trig (angle += speed)
   - Responsive: resizes to hero section
   - Interaction: mouse repels/follows; scroll alters parallax radius
   - Respects prefers-reduced-motion
   - Starts AFTER introComplete event (or immediately if no intro)
   ======================== */

(function initParticles(){
  const canvas = qs('#heroCanvas');
  const heroSection = qs('#hero');
  if (!canvas || !heroSection) return;

  // respect reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = canvas.getContext('2d', { alpha: true });
  let DPR = Math.max(1, window.devicePixelRatio || 1);

  // Colors from request
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

  // Tunables
  const PARTICLE_COUNT = Math.min(20, Math.max(10, Math.floor((window.innerWidth/100)))); // responsive count
  const MIN_ORBIT = 40;
  const MAX_ORBIT = Math.min(380, Math.max(120, Math.min(window.innerWidth*0.22, 380)));
  const BASE_SPEED = 0.0028; // radians per ms base
  const GLOW_ALPHA = 0.12;
  const PARTICLE_MIN_R = 3;
  const PARTICLE_MAX_R = 9;
  const INFLUENCE_RADIUS = 140; // px
  const MOUSE_REPEL_FORCE = 0.18;
  const FOLLOW_FORCE = 0.06; // if choosing follow behavior
  const SCROLL_PARALLAX_FACTOR = 0.06;

  let width = 0;
  let height = 0;
  let cx = 0;
  let cy = 0;
  let lastTs = performance.now();
  let particles = [];
  let running = false;

  // mouse state
  const mouseState = { x: window.innerWidth/2, y: window.innerHeight/2, active: false };

  // set canvas size
  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    width = heroSection.clientWidth;
    height = heroSection.clientHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // draw in CSS pixels
    cx = width * 0.45; // center slightly left of center for composition
    cy = height * 0.5;
  }

  // Particle class (plain object)
  function makeParticle(i){
    const orbitRadius = MIN_ORBIT + (Math.random() ** 1.3) * (MAX_ORBIT - MIN_ORBIT);
    const angle = Math.random() * Math.PI * 2;
    const speed = (BASE_SPEED * (0.6 + Math.random() * 1.4)) * (i % 2 === 0 ? 1 : 0.85);
    const radius = PARTICLE_MIN_R + Math.random() * (PARTICLE_MAX_R - PARTICLE_MIN_R);
    const color = colors[Math.floor(Math.random() * colors.length)];
    // each particle stores an offset used by mouse interaction
    return {
      angle,
      baseOrbit: orbitRadius,
      orbitRadius,
      speed,
      r: radius,
      color,
      offsetX: 0,
      offsetY: 0,
      wobble: 0.5 + Math.random() * 1.2,
      id: i
    };
  }

  function initParticlesArray(){
    particles = [];
    for (let i=0;i<PARTICLE_COUNT;i++){
      particles.push(makeParticle(i));
    }
  }

  // draw single particle with glow
  function drawParticle(p){
    const x = cx + Math.cos(p.angle) * p.orbitRadius + p.offsetX;
    const y = cy + Math.sin(p.angle) * p.orbitRadius + p.offsetY;

    // soft glow: shadow and radial gradient
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = Math.max(8, p.r * 6);
    ctx.globalAlpha = 0.95;
    ctx.arc(x, y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // inner soft highlight (subtle)
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, p.r*2.6);
    grad.addColorStop(0, hexToRGBA('#ffffff', 0.10));
    grad.addColorStop(0.08, hexToRGBA(p.color, 0.12));
    grad.addColorStop(1, hexToRGBA(p.color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, p.r*2.8, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // small helper to convert hex to rgba
  function hexToRGBA(hex, alpha=1){
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // animation loop
  function step(ts){
    if (!running) return;
    const dt = Math.min(40, ts - lastTs); // clamp delta for stability
    lastTs = ts;

    // clear canvas
    ctx.clearRect(0,0,width,height);

    // subtle parallax change of center based on scroll
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollShift = scrollY * SCROLL_PARALLAX_FACTOR;
    const localCx = cx;
    const localCy = cy + scrollShift;

    // update & draw particles
    for (let p of particles){
      // advance angle
      p.angle += p.speed * dt * (0.9 + 0.25 * Math.sin(ts * 0.0002 + p.id));
      // small wobble variation to orbit radius
      p.orbitRadius = p.baseOrbit + Math.sin(ts * 0.001 * p.wobble + p.id) * (p.r * 1.4);

      // mouse interaction: repel if within influence
      if (mouseState.active){
        // compute particle current pos
        const px = localCx + Math.cos(p.angle) * p.orbitRadius;
        const py = localCy + Math.sin(p.angle) * p.orbitRadius;
        const dx = px - mouseState.x;
        const dy = py - mouseState.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < INFLUENCE_RADIUS){
          const force = (1 - (dist / INFLUENCE_RADIUS)); // 0..1
          // repel direction
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          // apply to offset with smooth lerp
          p.offsetX += (nx * force * p.r * MOUSE_REPEL_FORCE - p.offsetX) * 0.12;
          p.offsetY += (ny * force * p.r * MOUSE_REPEL_FORCE - p.offsetY) * 0.12;
        } else {
          // relax offset back to zero
          p.offsetX += (0 - p.offsetX) * 0.06;
          p.offsetY += (0 - p.offsetY) * 0.06;
        }
      } else {
        // relax offsets if no pointer
        p.offsetX += (0 - p.offsetX) * 0.06;
        p.offsetY += (0 - p.offsetY) * 0.06;
      }

      drawParticle({
        ...p,
        angle: p.angle,
        orbitRadius: p.orbitRadius,
        offsetX: p.offsetX,
        offsetY: p.offsetY
      });
    }

    // pulse the Join button subtly in sync with time
    if (joinNow){
      const t = ts * 0.001;
      const scale = 1 + 0.02 * Math.sin(t * 2.0);
      joinNow.style.transform = `scale(${scale})`;
      joinNow.style.boxShadow = `0 14px 40px rgba(8,31,28,${0.08 + 0.02*Math.abs(Math.sin(t))})`;
    }

    requestAnimationFrame(step);
  }

  // mouse handling
  function onMove(e){
    mouseState.active = true;
    mouseState.x = e.clientX - canvas.getBoundingClientRect().left;
    mouseState.y = e.clientY - canvas.getBoundingClientRect().top;
  }
  function onLeave(){
    mouseState.active = false;
  }

  // touch support
  function onTouchMove(e){
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    mouseState.active = true;
    mouseState.x = t.clientX - canvas.getBoundingClientRect().left;
    mouseState.y = t.clientY - canvas.getBoundingClientRect().top;
  }
  function onTouchEnd(){
    mouseState.active = false;
  }

  // pause when document hidden
  function handleVisibility(){
    if (document.hidden) running = false;
    else {
      running = true;
      lastTs = performance.now();
      requestAnimationFrame(step);
    }
  }

  // Initialize/responsive
  function start(){
    if (running) return;
    resize();
    initParticlesArray();
    lastTs = performance.now();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      running = true;
      requestAnimationFrame(step);
    } else {
      drawStaticFrame();
    }
  }

  function drawStaticFrame(){
    ctx.clearRect(0,0,width,height);
    for (let p of particles){
      const x = cx + Math.cos(p.angle) * p.orbitRadius;
      const y = cy + Math.sin(p.angle) * p.orbitRadius;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = Math.max(6, p.r * 4);
      ctx.arc(x, y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // adapt number of particles and orbits on resize
  function adapt(){
    resize();
    const desiredCount = Math.min(20, Math.max(10, Math.floor((window.innerWidth/100))));
    if (desiredCount !== particles.length){
      initParticlesArray();
    }
  }

  // event listeners
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('touchmove', onTouchMove, {passive:true});
  canvas.addEventListener('touchend', onTouchEnd);

  window.addEventListener('resize', adapt);
  window.addEventListener('scroll', () => {}, {passive:true});
  document.addEventListener('visibilitychange', handleVisibility);

  // start after intro completes
  if (document.getElementById('intro')){
    document.addEventListener('introComplete', ()=> {
      // tiny delay so DOM reveal animations can run
      setTimeout(start, 10);
    }, {once:true});
  } else {
    start();
  }

  // expose debug
  window.__gdgcParticles = { start, resize: adapt, stop: () => running = false };
})();
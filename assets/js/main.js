/* =========================================================
   Analyst Consultants — Homepage interactions
   ========================================================= */
(function () {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------------------------------------------------------
     THEME
     --------------------------------------------------------- */
  const themeBtn = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#F5F2EC' : '#07090E');
    themeBtn && themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  applyTheme(html.getAttribute('data-theme') || 'dark');

  themeBtn && themeBtn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('ac-theme', next); } catch (e) {}

    if (!document.startViewTransition || reduceMotion) { applyTheme(next); return; }

    // Circular reveal from the toggle
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    html.classList.add('theme-switching');
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      html.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
    vt.finished.finally(() => html.classList.remove('theme-switching'));
  });

  // Follow the OS theme until the visitor picks one
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem('ac-theme')) applyTheme(e.matches ? 'light' : 'dark');
    });
  } catch (e) {}

  /* ---------------------------------------------------------
     NO-GSAP FALLBACK
     --------------------------------------------------------- */
  if (!hasGSAP) {
    html.classList.remove('js');
    const pl = $('#preloader');
    pl && pl.remove();
    body.classList.remove('is-loading');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  /* ---------------------------------------------------------
     SMOOTH SCROLL (Lenis)
     --------------------------------------------------------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('.offcanvas, .mega').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMega();
      const inOffcanvas = a.closest('.offcanvas');
      setTimeout(() => scrollToTarget(id === '#top' ? 0 : target), inOffcanvas ? 380 : 0);
    });
  });

  /* ---------------------------------------------------------
     TEXT SPLITTING
     --------------------------------------------------------- */
  // Wrap every word in a node, keeping inline elements like <em> intact
  function splitWords(el, wrapFn) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else frag.appendChild(wrapFn(p, !!child.parentElement.closest('em')));
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
  }

  $$('.split-title').forEach((el) => {
    splitWords(el, (word, inEm) => {
      const w = document.createElement('span');
      w.className = 'w' + (inEm ? ' w--em' : '');
      const i = document.createElement('span');
      i.textContent = word;
      w.appendChild(i);
      return w;
    });
  });

  $$('[data-split-words]').forEach((el) => {
    splitWords(el, (word, inEm) => {
      const s = document.createElement('span');
      s.className = 'word' + (inEm ? ' word--em' : '');
      s.textContent = word;
      return s;
    });
  });

  /* ---------------------------------------------------------
     PRELOADER → HERO INTRO
     --------------------------------------------------------- */
  const preloader = $('#preloader');
  lenis && lenis.stop();

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__title .line__inner', { y: 0, duration: 1.4, stagger: 0.1 })
      .to('.hero-reveal', { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, '-=1.1')
      .fromTo('.hero-frame', { clipPath: 'inset(100% 0% 0% 0% round 34px)' }, { clipPath: 'inset(0% 0% 0% 0% round 34px)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .from('.hero-slide.is-active img', { scale: 1.4, duration: 2.2 }, 0.2)
      .from('.hero-chip', { opacity: 0, y: 20, scale: 0.92, stagger: 0.12, duration: 1 }, 0.9)
      .from('.spin-badge', { opacity: 0, scale: 0.4, rotate: -90, duration: 1.4 }, 0.8)
      .add(drawBlueprint, 0.7);
    return tl;
  }

  function drawBlueprint() {
    const paths = $$('.blueprint .draw');
    paths.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    const tl = gsap.timeline();
    tl.to('.bp-struct .draw, .bp-dim .draw', { strokeDashoffset: 0, duration: 2.2, stagger: 0.12, ease: 'power2.inOut' })
      .to('.bp-duct .draw', { strokeDashoffset: 0, duration: 1.8, stagger: 0.15, ease: 'power2.inOut' }, 0.8)
      .from('.bp-elec', { opacity: 0, duration: 1.2 }, 1.2)
      .from('.bp-nodes circle', { scale: 0, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'back.out(3)' }, 1.8)
      .from('.bp-text', { opacity: 0, duration: 1 }, 2);
    gsap.to('.bp-nodes circle', { scale: 1.6, opacity: 0.5, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.18, from: 'random' }, delay: 3.2 });
  }

  function finishLoading() {
    body.classList.remove('is-loading');
    lenis && lenis.start();
    heroIntro();
    ScrollTrigger.refresh();
  }

  if (preloader && !reduceMotion) {
    const pl = { v: 0 };
    const countEl = $('#plCount');
    const pathEl = $('.pl-path');
    const len = pathEl.getTotalLength();
    gsap.set(pathEl, { strokeDasharray: len, strokeDashoffset: len });

    gsap.timeline()
      .from('.preloader__word', { opacity: 0, y: 14, duration: 0.8 }, 0)
      .to(pathEl, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(pathEl, { fill: 'url(#plg)', duration: 0.5 }, 1.3)
      .to(pl, { v: 100, duration: 1.7, ease: 'power3.inOut', onUpdate: () => { countEl.textContent = Math.round(pl.v); } }, 0)
      .to('#plBar', { width: '100%', duration: 1.7, ease: 'power3.inOut' }, 0)
      .to('.preloader__inner', { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 1.9)
      .to(preloader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 2.2)
      .add(finishLoading, 2.55)
      .add(() => preloader.remove());
  } else {
    preloader && preloader.remove();
    finishLoading();
  }

  /* ---------------------------------------------------------
     HEADER — scrolled state, hide on scroll down
     --------------------------------------------------------- */
  const header = $('#siteHeader');
  const progressBar = $('.scroll-progress i');
  const toTop = $('#toTop');
  const toTopRing = $('#toTopRing');
  const RING = 125.66;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      const megaOpen = $('.has-mega.is-open');
      if (y > 400 && self.direction === 1 && !megaOpen) header.classList.add('is-hidden');
      else if (self.direction === -1) header.classList.remove('is-hidden');
      gsap.set(progressBar, { scaleX: self.progress });
      toTop.classList.toggle('is-visible', y > 700);
      toTopRing.style.strokeDashoffset = RING - RING * self.progress;
    }
  });
  toTop.addEventListener('click', () => scrollToTarget(0));

  /* ---------------------------------------------------------
     MEGA MENU
     --------------------------------------------------------- */
  const megaLi = $('.has-mega');
  const megaBtn = $('.mega-trigger');
  let megaTimer;
  function openMega() { clearTimeout(megaTimer); megaLi.classList.add('is-open'); megaBtn.setAttribute('aria-expanded', 'true'); }
  function closeMega() { if (!megaLi) return; megaLi.classList.remove('is-open'); megaBtn.setAttribute('aria-expanded', 'false'); }
  if (megaLi) {
    megaLi.addEventListener('mouseenter', openMega);
    megaLi.addEventListener('mouseleave', () => { megaTimer = setTimeout(closeMega, 180); });
    megaBtn.addEventListener('click', () => (megaLi.classList.contains('is-open') ? closeMega() : openMega()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMega(); });
    document.addEventListener('click', (e) => { if (!megaLi.contains(e.target)) closeMega(); });
  }

  /* ---------------------------------------------------------
     HERO — slider, rotator, tilt, parallax
     --------------------------------------------------------- */
  const slides = $$('.hero-slide');
  const dots = $$('.hero-frame__dots button');
  const capMain = $('[data-slide-caption]');
  const capSub = $('[data-slide-sub]');
  const captions = [
    ['Commercial Tower · MEP', 'Design → Commissioning'],
    ['Expressway Lighting · 62 km', 'Highway Electrical Works'],
    ['Site Supervision · Delhi NCR', 'Quality on the ground']
  ];
  let slideIdx = 0;
  let slideTimer;

  function goSlide(i) {
    slides[slideIdx].classList.remove('is-active');
    dots[slideIdx].classList.remove('is-active');
    slideIdx = (i + slides.length) % slides.length;
    slides[slideIdx].classList.add('is-active');
    dots[slideIdx].classList.add('is-active');
    gsap.fromTo([capMain, capSub], { opacity: 0, y: 8 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.06,
      onStart: () => { capMain.textContent = captions[slideIdx][0]; capSub.textContent = captions[slideIdx][1]; }
    });
  }
  function startSlides() { clearInterval(slideTimer); slideTimer = setInterval(() => goSlide(slideIdx + 1), 5500); }
  dots.forEach((d, i) => d.addEventListener('click', () => { goSlide(i); startSlides(); }));
  startSlides();

  // Rotating words
  const words = $$('.hero__rotator-words span');
  let wordIdx = 0;
  setInterval(() => {
    const cur = words[wordIdx];
    wordIdx = (wordIdx + 1) % words.length;
    const nxt = words[wordIdx];
    gsap.to(cur, { yPercent: -110, opacity: 0, duration: 0.7, ease: 'power3.inOut', onComplete: () => cur.classList.remove('is-active') });
    gsap.fromTo(nxt, { yPercent: 110, opacity: 0, y: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.inOut', onStart: () => nxt.classList.add('is-active') });
  }, 2600);

  // 3D tilt on the hero frame
  const frame = $('.hero-frame');
  if (frame && finePointer && !reduceMotion) {
    const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.8, ease: 'power3' });
    const visual = $('.hero__visual');
    visual.addEventListener('mousemove', (e) => {
      const r = visual.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 10); rx(-py * 8);
    });
    visual.addEventListener('mouseleave', () => { rx(0); ry(0); });
  }

  // Hero scroll parallax
  gsap.to('.hero__copy', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__visual', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.aurora', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------------------------------------------------------
     MARQUEES (scroll-velocity reactive)
     --------------------------------------------------------- */
  $$('.marquee').forEach((mq) => {
    const track = $('.marquee__track', mq);
    const trackW = track.offsetWidth || 1000;
    const copies = Math.max(1, Math.ceil(window.innerWidth / trackW));
    for (let i = 0; i < copies; i++) {
      const c = track.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      mq.appendChild(c);
    }
    const tracks = $$('.marquee__track', mq);
    const speed = parseFloat(mq.dataset.speed) || 40;
    const reverse = mq.classList.contains('marquee--reverse');
    const tween = gsap.fromTo(tracks,
      { xPercent: reverse ? -100 : 0 },
      { xPercent: reverse ? 0 : -100, duration: speed, ease: 'none', repeat: -1 });
    if (reduceMotion) tween.pause();

    ScrollTrigger.create({
      trigger: mq, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
        gsap.to(tween, { timeScale: 1 + v, duration: 0.2, overwrite: true });
        gsap.to(tween, { timeScale: 1, duration: 1.2, delay: 0.2 });
      }
    });
  });

  /* ---------------------------------------------------------
     SCROLL REVEALS
     --------------------------------------------------------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 1.2 })
  });

  $$('.split-title').forEach((el) => {
    gsap.set($$('.w > span', el), { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el, start: 'top 86%', once: true,
      onEnter: () => gsap.to($$('.w > span', el), { yPercent: 0, duration: 1.3, stagger: 0.05 })
    });
  });

  // Intro statement — words light up while scrolling
  const introWords = $$('.intro__statement .word');
  if (introWords.length) {
    gsap.to(introWords, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '.intro__statement', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 }
    });
  }

  // Counters
  $$('.counter').forEach((el) => {
    const to = parseFloat(el.dataset.to) || 0;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN'); } })
    });
  });

  /* ---------------------------------------------------------
     EXPERTISE — floating image preview
     --------------------------------------------------------- */
  const preview = $('.svc-preview');
  const previewInner = $('.svc-preview__inner');
  if (preview && finePointer && window.innerWidth >= 992) {
    // Preload images
    $$('.svc').forEach((s) => { const im = new Image(); im.src = s.dataset.img; });
    const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
    const pr = gsap.quickTo(preview, 'rotation', { duration: 0.8, ease: 'power3' });
    let lastX = 0;
    gsap.set(preview, { xPercent: -50, yPercent: -50 });

    const list = $('#svcList');
    list.addEventListener('mousemove', (e) => {
      px(e.clientX + 170); py(e.clientY);
      pr(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6)));
      lastX = e.clientX;
    });
    $$('.svc', list).forEach((s) => {
      s.addEventListener('mouseenter', () => {
        previewInner.style.backgroundImage = `url("${s.dataset.img}")`;
        gsap.fromTo(previewInner, { scale: 1.25 }, { scale: 1, duration: 0.9 });
      });
    });
    list.addEventListener('mouseenter', () => gsap.to(preview, { opacity: 1, scale: 1, duration: 0.6 }));
    list.addEventListener('mouseleave', () => gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.5 }));
  }

  /* ---------------------------------------------------------
     SECTORS — pinned horizontal scroll on desktop
     --------------------------------------------------------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 992px)', () => {
    const section = $('.sectors');
    const track = $('.sectors__track');
    const bar = $('.sectors__progress-bar i');
    const num = $('.sectors__progress-num');
    const cards = $$('.sector-card', track);
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(bar, { scaleX: 0.2 + self.progress * 0.8 });
          num.textContent = String(Math.min(cards.length, 1 + Math.round(self.progress * (cards.length - 1)))).padStart(2, '0');
        }
      }
    });

    // Subtle inner parallax on each card image
    cards.forEach((card) => {
      const img = $('img', card);
      if (!img) return;
      gsap.fromTo(img, { xPercent: -6 }, {
        xPercent: 6, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
  });

  /* ---------------------------------------------------------
     PROJECTS CAROUSEL
     --------------------------------------------------------- */
  if (typeof window.Swiper !== 'undefined') {
    const bar = $('.swiper-progress i');
    const sw = new Swiper('.projects-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 24,
      speed: 900,
      grabCursor: true,
      navigation: { nextEl: '.proj-next', prevEl: '.proj-prev' },
      breakpoints: { 0: { spaceBetween: 16 }, 768: { spaceBetween: 24 } },
      on: {
        progress(s, p) { if (bar) bar.style.transform = `scaleX(${0.12 + Math.max(0, Math.min(1, p)) * 0.88})`; }
      }
    });
    if (bar) bar.style.transform = 'scaleX(0.12)';
    window.addEventListener('load', () => sw.update());
  }

  /* ---------------------------------------------------------
     DRAWINGS — sheets fan out on scroll
     --------------------------------------------------------- */
  gsap.set('.sheet--1', { xPercent: -50, yPercent: -50, rotation: -2 });
  gsap.set('.sheet--2', { xPercent: -50, yPercent: -50, rotation: 1, x: 0, y: 0 });
  gsap.set('.sheet--3', { xPercent: -50, yPercent: -50, rotation: 2, x: 0, y: 0 });
  const sheetsTl = gsap.timeline({ scrollTrigger: { trigger: '.sheets', start: 'top 85%', end: 'center 45%', scrub: 1 } });
  sheetsTl
    .to('.sheet--3', { rotation: 12, x: 70, y: -70, ease: 'none' }, 0)
    .to('.sheet--2', { rotation: 5, x: 34, y: -36, ease: 'none' }, 0)
    .to('.sheet--1', { rotation: -5, x: -20, y: 14, ease: 'none' }, 0)
    .from('.price-tag', { y: 60, opacity: 0, ease: 'none' }, 0.2);

  /* ---------------------------------------------------------
     SPOTLIGHT CARDS
     --------------------------------------------------------- */
  $$('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------------------------------------------------------
     MAGNETIC BUTTONS + CUSTOM CURSOR (fine pointers only)
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }); });
    });

    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    window.addEventListener('mousemove', (e) => { if (!cursor.dataset.on) { cursor.dataset.on = 1; gsap.to(cursor, { opacity: 1, duration: 0.3 }); } dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });

    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, .svc');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-hover', !view && !!hov);
      if (view) label.textContent = view.dataset.cursor;
    });
    document.addEventListener('mouseleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to(cursor, { opacity: 1, duration: 0.3 }));
  }

  /* ---------------------------------------------------------
     NEWSLETTER (front-end demo only)
     --------------------------------------------------------- */
  const nl = $('#newsletterForm');
  if (nl) {
    nl.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#nlEmail');
      const msg = $('#nlMsg');
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      msg.textContent = ok ? 'Thank you. You’re on the list.' : 'Please enter a valid email address.';
      if (ok) { input.value = ''; gsap.fromTo(nl, { scale: 0.98 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.5)' }); }
    });
  }

  /* ---------------------------------------------------------
     Refresh once fonts/images settle
     --------------------------------------------------------- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-navigation');
  if (!header || !toggle || !navigation) return;

  const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(item => item.section);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();

  // Keep the full role available to assistive technology while the visual label types.
  const role = document.querySelector('.hero-role');
  if (role) {
    const original = role.textContent;
    const accessible = document.createElement('span');
    accessible.className = 'visually-hidden';
    accessible.textContent = original;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.className = 'typed-role';
    visual.textContent = original;
    role.replaceChildren(accessible, visual);
    const titles = ['Odoo ERP Specialist', 'Business Analyst', 'Odoo Techno-Functional Consultant'];
    let timer;
    let index = 0;
    let length = titles[0].length;
    let deleting = true;
    function tick() {
      if (reducedMotion.matches || document.hidden) return;
      const title = titles[index];
      length += deleting ? -1 : 1;
      visual.textContent = title.slice(0, length);
      let delay = deleting ? 42 : 85;
      if (length === 0) {
        deleting = false;
        index = (index + 1) % titles.length;
        delay = 300;
      } else if (!deleting && length === title.length) {
        deleting = true;
        delay = 2200;
      }
      timer = window.setTimeout(tick, delay);
    }
    function syncTyping() {
      window.clearTimeout(timer);
      role.classList.toggle('is-typing', !reducedMotion.matches);
      if (reducedMotion.matches) {
        visual.textContent = original;
        return;
      }
      if (document.hidden) return;
      index = 0;
      length = titles[0].length;
      deleting = true;
      visual.textContent = titles[0];
      timer = window.setTimeout(tick, 2200);
    }
    reducedMotion.addEventListener('change', syncTyping);
    document.addEventListener('visibilitychange', syncTyping);
    syncTyping();
  }


  // Animate only on entry: content remains visible if animation is unavailable.
  function animateEntry(element, distance = 16) {
    if (reducedMotion.matches || !element.animate || element.contains(document.activeElement)) return;
    const animation = element.animate([
      { opacity: 0.25, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.65,.3,1)' });
    animations.add(animation);
    const cleanup = () => animations.delete(animation);
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches) animations.forEach(animation => animation.cancel());
  });

  function closeMenu(returnFocus = false) {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
  });

  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
    const anchor = event.target.closest('a[href^="#"]');
    if (anchor) {
      try {
        const target = document.getElementById(decodeURIComponent(anchor.hash.slice(1)));
        if (target && target.matches('details')) target.open = true;
      } catch { /* Ignore malformed fragment links. */ }
    }
  });

  window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  function revealHashTarget() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    const target = id && document.getElementById(id);
    if (target && target.matches('details')) {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
  window.addEventListener('hashchange', revealHashTarget);
  revealHashTarget();

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.hidden = true;
  const arrow = document.createElement('i');
  arrow.className = 'bi bi-arrow-up';
  arrow.setAttribute('aria-hidden', 'true');
  backToTop.append(arrow);
  document.body.append(backToTop);
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    // Move keyboard focus before the button becomes hidden at the top.
    document.querySelector('.brand')?.focus({ preventScroll: true });
  });

  let framePending = false;
  let currentLink = null;
  function updateScrollState() {
    framePending = false;
    const offset = window.matchMedia('(min-width: 1101px)').matches ? 140 : header.getBoundingClientRect().height + 120;
    const active = sections.find(({ section }) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= offset && bounds.bottom > offset;
    })?.link || null;
    if (active !== currentLink) {
      navLinks.forEach(link => {
        if (link === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      currentLink = active;
    }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--reading-progress', String(maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0));
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    backToTop.hidden = window.scrollY < window.innerHeight;
  }
  function scheduleScrollUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateScrollState);
  }
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);
  window.addEventListener('load', scheduleScrollUpdate);

  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
      scheduleScrollUpdate();
      const content = details.querySelector('.role-body, .capability-content, p');
      if (details.open && content) animateEntry(content, 8);
    });
  });

  if ('ResizeObserver' in window) new ResizeObserver(scheduleScrollUpdate).observe(document.body);
  updateScrollState();

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateEntry(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .expertise-row, .credential-card, .about-visual, .quote, .contact-grid').forEach(element => {
      // Initial content is immediately readable; reveal subsequent sections once.
      if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
    });
  }
})();

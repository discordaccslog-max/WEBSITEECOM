/* ==========================================================================
   EcomCla — Shared site script
   Injects the ticker bar, header, footer and guarantee popup into every
   page, and runs the shared interactions (scroll header, mobile menu,
   fade-up animations, revenue counters, reviews carousel, FAQ accordion).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Site config — edit these in one place
     ------------------------------------------------------------------------ */

  var CONFIG = {
    // Paste your Stripe / Shopify / PayPal checkout link here. Until it is set,
    // the "Buy Now" checkout button on buy.html opens an order email instead.
    checkoutUrl: '',
    supportEmail: 'support@ecomcla.com',
    price: '$48.99',
    popupDelayMs: 4000,
    popupStorageKey: 'ecomcla_popup_shown'
  };

  // Real customer reviews go here. The homepage reviews section stays hidden
  // while this list is empty. Format:
  // { name: 'First L.', location: 'US', title: 'Short headline', text: 'Full review text.', rating: 5 }
  var REVIEWS = [];

  var NAV_LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'whats-included.html', label: "What's Included" },
    { href: 'buy.html', label: 'Buy Now' },
    { href: 'faq.html', label: 'FAQ' }
  ];

  /* ------------------------------------------------------------------------
     Thin-stroke line icons used inside injected markup
     ------------------------------------------------------------------------ */

  function svg(paths, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
  }

  var ICONS = {
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18"/><path d="M7 15h3"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    support: '<path d="M4.5 13v-1.5a7.5 7.5 0 0 1 15 0V13"/><rect x="3.5" y="13" width="4" height="6" rx="1"/><rect x="16.5" y="13" width="4" height="6" rx="1"/><path d="M18.5 19a3 3 0 0 1-3 2.5H13"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
    arrowRight: '<path d="M9 5l7 7-7 7"/>'
  };

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */

  function currentPage() {
    var file = window.location.pathname.split('/').pop().toLowerCase();
    if (!file) return 'index.html';
    if (file.indexOf('.') === -1) file += '.html';
    var known = NAV_LINKS.some(function (link) { return link.href === file; });
    return known ? file : 'index.html';
  }

  function storageGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function navLinksHTML(page) {
    return NAV_LINKS.map(function (link) {
      var active = link.href === page;
      var isBuy = link.href === 'buy.html';
      return '<li' + (isBuy ? ' class="nav-buy-item"' : '') + '><a href="' + link.href + '"' +
        (active ? ' class="active" aria-current="page"' : '') + '>' +
        link.label + '</a></li>';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     Header: scrolling ticker + navbar
     ------------------------------------------------------------------------ */

  var TICKER_ITEMS = [
    { icon: 'award', text: 'Ranked #2 — 2026 Global Marketplace Excellence Awards' },
    { icon: 'shield', text: '$2,500 in your first 30 days or a full refund' },
    { icon: 'users', text: '2,400+ businesses sold' },
    { icon: 'clock', text: '48hr business delivery' },
    { icon: 'card', text: 'One-time payment · No subscriptions' },
    { icon: 'star', text: '4.9★ customer rating' }
  ];

  function tickerGroupHTML(hidden) {
    return '<div class="ticker-group"' + (hidden ? ' aria-hidden="true"' : '') + '>' +
      TICKER_ITEMS.map(function (item) {
        return '<span class="ticker-item">' + svg(ICONS[item.icon], 'icon--xs') + item.text + '</span>';
      }).join('') +
      '</div>';
  }

  function renderHeader(page) {
    var mount = document.getElementById('site-header');
    if (!mount) {
      mount = document.createElement('div');
      document.body.insertBefore(mount, document.body.firstChild);
    }

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="ticker" role="region" aria-label="EcomCla highlights">' +
        '<div class="ticker-track">' + tickerGroupHTML(false) + tickerGroupHTML(true) + '</div>' +
      '</div>' +
      '<nav class="navbar" aria-label="Main">' +
        '<div class="container navbar-inner">' +
          '<div class="nav-left">' +
            '<button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">' +
              '<span class="nav-toggle-bars" aria-hidden="true"></span>' +
            '</button>' +
            '<div class="nav-menu" id="nav-menu">' +
              '<ul class="nav-links">' + navLinksHTML(page) + '</ul>' +
            '</div>' +
          '</div>' +
          '<a href="index.html" class="wordmark" aria-label="EcomCla home">EcomCla</a>' +
          '<div class="nav-right">' +
            '<a href="buy.html" class="btn btn-primary btn-sm nav-cta"' +
              (page === 'buy.html' ? ' aria-current="page"' : '') + '>Buy Now<span class="nav-cta-price"> — ' + CONFIG.price + '</span></a>' +
          '</div>' +
        '</div>' +
      '</nav>';

    mount.replaceWith(header);
    return header;
  }

  function initNavbar(header) {
    var navbar = header.querySelector('.navbar');
    var toggle = header.querySelector('.nav-toggle');
    var menu = header.querySelector('.nav-menu');

    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      menu.classList.toggle('open', open);
      navbar.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
    });

    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !navbar.contains(e.target)) setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768 && menu.classList.contains('open')) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     Footer
     ------------------------------------------------------------------------ */

  function renderFooter(page) {
    var mount = document.getElementById('site-footer');
    if (!mount) {
      mount = document.createElement('div');
      document.body.appendChild(mount);
    }

    var links = NAV_LINKS.map(function (link) {
      return '<li><a href="' + link.href + '"' + (link.href === page ? ' class="active"' : '') + '>' +
        link.label + '</a></li>';
    }).join('');

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<svg class="wave wave--footer" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="wave-back" d="M0 50 C 240 10 480 90 720 55 S 1200 15 1440 45 V90 H0 Z"/>' +
        '<path class="wave-front" d="M0 65 C 300 30 520 95 780 65 S 1220 35 1440 60 V90 H0 Z"/>' +
      '</svg>' +
      '<div class="footer-body">' +
        '<div class="container">' +
          '<div class="footer-grid">' +
            '<div class="footer-brand">' +
              '<a href="index.html" class="wordmark">EcomCla</a>' +
              '<p class="footer-tagline">Own a Business. Skip the Hard Part.</p>' +
              '<p class="footer-award">' + svg(ICONS.award, 'icon--sm') + 'Ranked #2 — 2026 Global Marketplace Excellence Awards</p>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h2 class="footer-heading">Navigation</h2>' +
              '<ul class="footer-links">' + links + '</ul>' +
            '</div>' +
            '<div class="footer-col">' +
              '<h2 class="footer-heading">Support</h2>' +
              '<ul class="footer-links">' +
                '<li><a href="faq.html">Frequently Asked Questions</a></li>' +
                '<li><a href="mailto:' + CONFIG.supportEmail + '">' + CONFIG.supportEmail + '</a></li>' +
                '<li><span>48hr onboarding support</span></li>' +
              '</ul>' +
            '</div>' +
            '<div class="footer-col footer-guarantee">' +
              '<h2 class="footer-heading">Our Promise</h2>' +
              '<p>If your EcomCla business doesn’t generate at least $2,500 in your first 30 days, we’ll refund every penny.</p>' +
              '<a href="buy.html" class="btn btn-primary btn-sm">Get Your Business — ' + CONFIG.price + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bottom">' +
            '<p class="footer-copy">© 2026 EcomCla. All rights reserved.</p>' +
            '<p class="footer-disclaimer">EcomCla is not affiliated with any third-party marketplace or platform.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    mount.replaceWith(footer);
  }

  /* ------------------------------------------------------------------------
     Revenue counter
     ------------------------------------------------------------------------ */

  function formatMoney(value) {
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function animateCounter(element, target, duration) {
    duration = duration || 2200;
    if (prefersReducedMotion) {
      element.textContent = formatMoney(target);
      return;
    }
    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatMoney(target * eased);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        element.textContent = formatMoney(target);
      }
    }
    window.requestAnimationFrame(tick);
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    function run(el) {
      animateCounter(el, parseFloat(el.getAttribute('data-counter')),
        parseInt(el.getAttribute('data-duration'), 10) || 2200);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Fade-up section animations with staggered children
     ------------------------------------------------------------------------ */

  function initFadeUp() {
    var sections = document.querySelectorAll('.fade-up');
    if (!sections.length) return;

    sections.forEach(function (section) {
      var children = section.querySelectorAll('.stagger-child');
      if (children.length) {
        section.classList.add('has-stagger');
        children.forEach(function (child, i) {
          child.style.transitionDelay = (i * 100) + 'ms';
        });
      }
    });

    function reveal(section) {
      section.classList.add('in-view');
      var children = section.querySelectorAll('.stagger-child');
      if (!children.length) return;
      // Clear delays once the entrance is done so hover effects respond instantly.
      window.setTimeout(function () {
        children.forEach(function (child) { child.style.transitionDelay = ''; });
      }, children.length * 100 + 1000);
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      sections.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ------------------------------------------------------------------------
     Reviews carousel (homepage) — renders REVIEWS, hidden while empty
     ------------------------------------------------------------------------ */

  function starsHTML(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += svg(ICONS.star, 'review-star' + (i <= rating ? ' is-on' : ''));
    }
    return '<span class="review-stars" role="img" aria-label="' + rating + ' out of 5 stars">' + out + '</span>';
  }

  function initReviews() {
    var section = document.getElementById('reviews');
    if (!section || !REVIEWS.length) return;

    var track = section.querySelector('.reviews-track');
    track.innerHTML = REVIEWS.map(function (r) {
      var rating = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      var initial = escapeHTML((r.name || '?').trim().charAt(0).toUpperCase());
      return '<article class="review-card">' +
        '<header class="review-head">' +
          '<span class="review-avatar" aria-hidden="true">' + initial + '</span>' +
          '<span><span class="review-name">' + escapeHTML(r.name || '') + '</span>' +
          '<span class="review-meta">' + escapeHTML(r.location || '') + '</span></span>' +
        '</header>' +
        starsHTML(rating) +
        (r.title ? '<h3 class="review-title">' + escapeHTML(r.title) + '</h3>' : '') +
        '<p class="review-text">' + escapeHTML(r.text || '') + '</p>' +
      '</article>';
    }).join('');

    section.hidden = false;

    var prev = section.querySelector('.reviews-prev');
    var next = section.querySelector('.reviews-next');

    function step(direction) {
      var card = track.querySelector('.review-card');
      var amount = card ? card.getBoundingClientRect().width + 20 : track.clientWidth;
      track.scrollBy({ left: direction * amount, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    function updateButtons() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  /* ------------------------------------------------------------------------
     FAQ accordion — one open at a time
     ------------------------------------------------------------------------ */

  function initAccordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
    if (!items.length) return;

    function close(item) {
      item.classList.remove('open');
      item.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      item.querySelector('.faq-a').style.maxHeight = '0px';
    }

    function open(item) {
      var answer = item.querySelector('.faq-a');
      item.classList.add('open');
      item.querySelector('.faq-q').setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    items.forEach(function (item) {
      item.querySelector('.faq-q').addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        items.forEach(function (other) { if (other !== item) close(other); });
        if (wasOpen) close(item); else open(item);
      });
    });

    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('open')) {
          var answer = item.querySelector('.faq-a');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Checkout links
     ------------------------------------------------------------------------ */

  function initCheckoutLinks() {
    var href = CONFIG.checkoutUrl ||
      'mailto:' + CONFIG.supportEmail + '?subject=' + encodeURIComponent('EcomCla Order — Pre-Built Business');
    document.querySelectorAll('[data-checkout]').forEach(function (el) {
      el.setAttribute('href', href);
    });
  }

  /* ------------------------------------------------------------------------
     Guarantee popup
     ------------------------------------------------------------------------ */

  function initGuaranteePopup() {
    // Only show once per session
    if (storageGet(CONFIG.popupStorageKey)) return;

    var onBuyPage = currentPage() === 'buy.html';
    var previousFocus = document.activeElement;

    // Build backdrop
    var backdrop = document.createElement('div');
    backdrop.id = 'guarantee-backdrop';

    // Build modal
    var modal = document.createElement('div');
    modal.id = 'guarantee-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'guarantee-title');
    modal.setAttribute('aria-describedby', 'guarantee-body');
    modal.innerHTML =
      '<button type="button" id="guarantee-close" class="gm-close" aria-label="Close">✕</button>' +
      '<div class="gm-seal" aria-hidden="true">' +
        '<div class="gm-seal-inner">' +
          '<span class="gm-seal-pct">100%</span>' +
          '<span class="gm-seal-word">MONEY</span>' +
          '<span class="gm-seal-word">BACK</span>' +
        '</div>' +
      '</div>' +
      '<p class="gm-eyebrow">Limited time promise</p>' +
      '<h2 class="gm-title" id="guarantee-title">Don’t Risk a Single Dollar.</h2>' +
      '<p class="gm-body" id="guarantee-body">If your EcomCla business doesn’t generate at least $2,500 in your first 30 days, we’ll refund every penny. No questions. No hassle. You have nothing to lose.</p>' +
      '<hr class="gm-rule">' +
      '<ul class="gm-points">' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">🛡️</span><span class="gm-label">Full Refund</span><span class="gm-sub">All ' + CONFIG.price + ' back</span></li>' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">' + svg(ICONS.calendar) + '</span><span class="gm-label">30 Days</span><span class="gm-sub">To hit $2,500</span></li>' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">' + svg(ICONS.support) + '</span><span class="gm-label">Online Support</span><span class="gm-sub">24 / 7</span></li>' +
      '</ul>' +
      '<hr class="gm-rule">' +
      '<a href="' + (onBuyPage ? '#product' : 'buy.html') + '" class="gm-cta" id="guarantee-cta">Get Your Business — ' + CONFIG.price + '</a>' +
      '<button type="button" id="guarantee-dismiss" class="gm-dismiss">No thanks, I’ll take the risk.</button>' +
      '<p class="gm-fine">$2,500 revenue guarantee applies to first 30 days. Full terms at checkout.</p>';

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Trigger fade-in after a brief paint delay
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        backdrop.classList.add('visible');
        modal.classList.add('visible');
        var closeBtn = document.getElementById('guarantee-close');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
      }, 16);
    });

    var closed = false;

    function closePopup() {
      if (closed) return;
      closed = true;
      backdrop.classList.remove('visible');
      modal.classList.remove('visible');
      document.removeEventListener('keydown', onKeydown);
      window.setTimeout(function () {
        backdrop.remove();
        modal.remove();
      }, 350);
      storageSet(CONFIG.popupStorageKey, 'true');
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closePopup();
        return;
      }
      // Keep keyboard focus inside the dialog while it is open
      if (e.key === 'Tab') {
        var focusable = modal.querySelectorAll('a[href], button');
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Close triggers
    backdrop.addEventListener('click', closePopup);
    document.getElementById('guarantee-close').addEventListener('click', closePopup);
    document.getElementById('guarantee-dismiss').addEventListener('click', closePopup);
    document.addEventListener('keydown', onKeydown);

    // The CTA closes the popup too (on buy.html it scrolls to the product card)
    document.getElementById('guarantee-cta').addEventListener('click', closePopup);

    // Prevent modal click from closing via backdrop
    modal.addEventListener('click', function (e) { e.stopPropagation(); });

    storageSet(CONFIG.popupStorageKey, 'true');
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  function boot() {
    var page = currentPage();
    var header = renderHeader(page);
    renderFooter(page);
    initNavbar(header);
    initCheckoutLinks();
    initReviews();
    initFadeUp();
    initCounters();
    initAccordion();

    // Fire the guarantee popup after 4 seconds
    if (!storageGet(CONFIG.popupStorageKey)) {
      window.setTimeout(initGuaranteePopup, CONFIG.popupDelayMs);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose the counter for reuse on any page
  window.animateCounter = animateCounter;
})();

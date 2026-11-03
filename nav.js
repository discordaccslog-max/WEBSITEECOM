/* ==========================================================================
   EcomCla — Shared site script
   Injects the announcement bar, navbar, footer and guarantee popup into
   every page, and runs the shared interactions (scroll navbar, hamburger,
   fade-up animations, revenue counters, FAQ accordion).
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

  var NAV_LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'whats-included.html', label: "What's Included" },
    { href: 'buy.html', label: 'Buy Now' },
    { href: 'faq.html', label: 'FAQ' }
  ];

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

  function navLinksHTML(page) {
    return NAV_LINKS.map(function (link) {
      var active = link.href === page;
      return '<li><a href="' + link.href + '"' +
        (active ? ' class="active" aria-current="page"' : '') + '>' +
        link.label + '</a></li>';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     Header: announcement bar + navbar
     ------------------------------------------------------------------------ */

  function renderHeader(page) {
    var mount = document.getElementById('site-header');
    if (!mount) {
      mount = document.createElement('div');
      document.body.insertBefore(mount, document.body.firstChild);
    }

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="announce-bar">' +
        '🏆 Ranked #2 — 2026 Global Marketplace Excellence Awards · Pre-Built Business Marketplace Category' +
      '</div>' +
      '<nav class="navbar" aria-label="Main">' +
        '<div class="container navbar-inner">' +
          '<a href="index.html" class="wordmark" aria-label="EcomCla home">EcomCla</a>' +
          '<button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">☰</button>' +
          '<div class="nav-menu" id="nav-menu">' +
            '<ul class="nav-links">' + navLinksHTML(page) + '</ul>' +
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
      toggle.textContent = open ? '✕' : '☰';
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
      return '<a href="' + link.href + '"' + (link.href === page ? ' class="active"' : '') + '>' +
        link.label + '</a>';
    }).join('<span class="sep" aria-hidden="true">·</span>');

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container">' +
        '<a href="index.html" class="wordmark">EcomCla</a>' +
        '<p class="footer-tagline">Own a Business. Skip the Hard Part.</p>' +
        '<nav class="footer-links" aria-label="Footer">' + links + '</nav>' +
        '<hr class="footer-rule">' +
        '<p class="footer-copy">© 2026 EcomCla. All rights reserved.</p>' +
        '<p class="footer-disclaimer">EcomCla is not affiliated with any third-party marketplace or platform.</p>' +
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
      }, children.length * 100 + 900);
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
      '<p class="gm-eyebrow">Limited Time Promise</p>' +
      '<h2 class="gm-title" id="guarantee-title">Don’t Risk a Single Dollar.</h2>' +
      '<p class="gm-body" id="guarantee-body">If your EcomCla business doesn’t generate at least $2,500 in your first 30 days, we’ll refund every penny. No questions. No hassle. You have nothing to lose.</p>' +
      '<hr class="gm-rule">' +
      '<ul class="gm-points">' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">🛡️</span><span class="gm-label">Full Refund</span><span class="gm-sub">All ' + CONFIG.price + ' back</span></li>' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">📅</span><span class="gm-label">30 Days</span><span class="gm-sub">To hit $2,500</span></li>' +
        '<li class="gm-point"><span class="gm-emoji" aria-hidden="true">✓</span><span class="gm-label">Online Support</span><span class="gm-sub">24 / 7</span></li>' +
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

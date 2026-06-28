/**
 * modelhead - Unified Navigation Menu
 * Generates a sticky top menu bar with brand, page navigation, language selector, and auth.
 * Runs synchronously so i18n.js and auth.js can find the injected elements via DOMContentLoaded.
 *
 * Set window.MENU_MODE = 'minimal' before loading this script to show
 * only brand + language selector (used on login page).
 */

(function () {
  // Only run if not already injected (guard against double-include)
  if (document.getElementById('mainMenu')) return;

  var currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var isMinimal = window.MENU_MODE === 'minimal';

  // ── Build menu HTML ──
  var nav = document.createElement('nav');
  nav.className = 'main-menu';
  nav.id = 'mainMenu';

  // Brand
  var brandDiv = document.createElement('div');
  brandDiv.className = 'menu-brand';
  brandDiv.innerHTML = '<a href="index.html">🧠 modelhead</a>';

  // Navigation links (not on login page or minimal mode)
  var navDiv = document.createElement('div');
  navDiv.className = 'menu-nav';
  navDiv.id = 'menuNav';

  if (!isMinimal) {
    var links = [
      { href: 'index.html', key: 'menuRapid', label: 'Rapid' },
      { href: 'index2.html', key: 'menuPro', label: 'Pro' },
      { href: 'image_enhance.html', key: 'menuEnhance', label: 'Enhance' },
      { href: 'profile.html', key: 'menuProfile', label: 'Profile' }
    ];

    links.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.href;
      a.className = 'menu-nav-link';
      a.setAttribute('data-i18n', link.key);
      a.textContent = link.label;

      // Highlight active page
      if (currentPage === link.href) {
        a.classList.add('active');
      }

      navDiv.appendChild(a);
    });
  }

  // Right side: language + auth
  var rightDiv = document.createElement('div');
  rightDiv.className = 'menu-right';

  var langSlot = document.createElement('div');
  langSlot.id = 'menuLang';

  rightDiv.appendChild(langSlot);

  // Auth slot (skip in minimal mode — login page has its own form)
  if (!isMinimal) {
    var authSlot = document.createElement('div');
    authSlot.id = 'menuAuth';
    rightDiv.appendChild(authSlot);
  }

  // Mobile hamburger (only when nav links exist)
  if (!isMinimal) {
    var hamburger = document.createElement('button');
    hamburger.className = 'menu-hamburger';
    hamburger.id = 'menuHamburger';
    hamburger.innerHTML = '☰';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.addEventListener('click', function () {
      nav.classList.toggle('menu-open');
    });
    nav.appendChild(hamburger);
  }

  // Assemble
  nav.appendChild(brandDiv);
  nav.appendChild(navDiv);
  nav.appendChild(rightDiv);
  // Insert hamburger (if created) — insertBefore ensures correct order
  if (!isMinimal) {
    nav.appendChild(nav.querySelector('.menu-hamburger'));
  }

  // Inject at top of body
  document.body.insertBefore(nav, document.body.firstChild);
})();
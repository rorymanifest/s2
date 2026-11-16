// Shared behaviour for the inner pages (services, about, our-work, contact, blog, legal).
// Every block checks for its elements first, so it is safe to load on any page.
(function () {
  // Mobile nav: hamburger toggle for the collapsed menu
  (function () {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    function closeMenu() {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeMenu();
    });
  })();

  // Nav bar: switch from translucent (over the hero) to solid navy once scrolled, so the white logo stays readable
  (function () {
    var navBar = document.querySelector('.nav-bar');
    if (!navBar || !navBar.hasAttribute('data-transparent')) return;
    function updateNav() {
      navBar.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  })();

  // Gallery filter tabs
  (function () {
    var tabs  = document.querySelectorAll('.gal-tab');
    var cards = document.querySelectorAll('[data-cat]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-filter');
        tabs.forEach(function (t) { t.classList.toggle('gal-tab--active', t === tab); });
        cards.forEach(function (card) {
          var show = (filter === 'all') || (card.getAttribute('data-cat') === filter);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  })();

  // About Us photo gallery: scrolls sideways through on-the-job photos, 3 at a time.
  (function () {
    var track = document.getElementById('about-track');
    if (!track) return;
    var slides = track.querySelectorAll('.about-slide');
    var prevBtn = document.getElementById('about-prev');
    var nextBtn = document.getElementById('about-next');

    function step() {
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
  })();

  // Quote form — submits to the /api/contact serverless function.
  (function () {
    var form = document.getElementById('quote-form');
    if (!form) return;
    var btn = document.getElementById('submit-btn');
    var status = document.getElementById('form-status');
    var btnDefaultText = btn.textContent;

    function setStatus(message, isError) {
      status.textContent = message;
      status.style.color = isError ? '#c0392b' : '#1a7f4b';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', false);
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.textContent = 'Sending…';

      var data = Object.fromEntries(new FormData(form).entries());

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (result.ok && result.body.success) {
            form.reset();
            btn.textContent = "Thanks — we'll be in touch ✓";
            setStatus("Got it! Will or Rory will call you within 2 business hours.", false);
            if (typeof gtag === 'function') {
              gtag('event', 'conversion', { 'send_to': 'AW-18434846558/8_HRCM_d3fscEN7etdZE' });
            }
          } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = btnDefaultText;
            setStatus(result.body.error || 'Something went wrong. Please try again or call us.', true);
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.textContent = btnDefaultText;
          setStatus('Network error — please try again or call us on 0426 666 354.', true);
        });
    });
  })();
})();

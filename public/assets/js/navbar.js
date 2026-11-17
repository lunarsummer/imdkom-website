// Navbar sudah di-inject inline oleh scripts/sync-navbar.mjs (single source:
// components/navbar.html). File ini hanya menangani interaksi:
//   - set --nav-h (tinggi navbar, dipakai layout fixed)
//   - highlight link halaman aktif
//   - toggle menu mobile (hamburger + Escape)
//   - init lucide icons & shadow saat scroll (varian fixed)
(function () {
    var nav = document.getElementById('mainNavbar');
    if (!nav) return;

    var isFixed = nav.id === 'mainNavbar' && nav.classList.contains('is-fixed');

    function currentPage() {
        // Segmen terakhir path sebagai nama halaman, konsisten di Netlify
        // (pretty URL) maupun Live Server / server lokal ('/public/kursus.html').
        var page = (window.location.pathname.toLowerCase().replace(/\/+$/, '').split('/').pop() || '')
            .replace(/\.html$/, '');
        var map = {
            '': '/',
            'index': '/',
            'kursus': '/kursus',
            'program-detail': '/kursus',
            'service': '/service',
            'service-laptop': '/service',
            'service-pc': '/service',
            'service-printer': '/service',
            'service-panggil': '/service',
            'service-detail': '/service',
            'rakit-komputer': '/rakit-komputer',
            'tentang': '/tentang',
            'karir': '/karir',
            'kontak': '/kontak'
        };
        return Object.prototype.hasOwnProperty.call(map, page) ? map[page] : null;
    }

    function setNavHeightVar(nav) {
        function update() {
            var h = Math.ceil(nav.getBoundingClientRect().height);
            if (h > 0) document.documentElement.style.setProperty('--nav-h', h + 'px');
        }
        update();
        window.addEventListener('resize', update);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(update);
        }
    }

    function applyVariant(nav) {
        if (!isFixed) return;
        window.addEventListener('scroll', function () {
            nav.classList.toggle('scrolled', window.scrollY > 8);
        }, { passive: true });
    }

    function applyActive(nav) {
        var active = currentPage();
        if (!active) return;
        nav.querySelectorAll('#mainNav a, #mobileNav a').forEach(function (link) {
            var href = (link.getAttribute('href') || '').toLowerCase();
            if (href !== active) return;
            if (link.closest('#mainNav')) {
                link.classList.add('nav-link-active');
            } else {
                link.classList.add('text-brand', 'font-semibold');
            }
        });
    }

    function bindToggle(nav) {
        var btn = nav.querySelector('#mobileMenuBtn');
        var mobileNav = nav.querySelector('#mobileNav');
        if (!btn || !mobileNav) return;

        function setOpen(open) {
            mobileNav.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        }

        function isOpen() {
            return mobileNav.classList.contains('is-open');
        }

        btn.addEventListener('click', function () {
            setOpen(!isOpen());
        });
        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                setOpen(false);
            });
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isOpen()) {
                setOpen(false);
                btn.focus();
            }
        });
        document.addEventListener('click', function (event) {
            if (isOpen() && !nav.contains(event.target)) {
                setOpen(false);
            }
        });
    }

    setNavHeightVar(nav);
    applyVariant(nav);
    applyActive(nav);
    bindToggle(nav);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
})();

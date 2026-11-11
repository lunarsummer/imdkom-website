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
        var path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
        if (!path) path = '/';
        if (path === '/program-detail' || path === '/program-detail.html') return '/kursus';
        if (path.indexOf('/service') === 0) return '/service';
        return path;
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
        btn.addEventListener('click', function () {
            mobileNav.classList.toggle('hidden');
        });
        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.add('hidden');
            });
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') mobileNav.classList.add('hidden');
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

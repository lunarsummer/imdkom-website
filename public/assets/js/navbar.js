(function () {
    var mount = document.getElementById('navbarMount');
    if (!mount) return;

    var variant = mount.getAttribute('data-variant') === 'fixed' ? 'fixed' : 'sticky';

    // Fallback inline — dijaga sinkron dengan components/navbar.html.
    // Dipakai saat fetch komponen gagal (file://, komponen belum ter-deploy,
    // atau _redirects mem-fallback request ke index.html).
    var FALLBACK_NAVBAR = '<nav id="mainNavbar"><div class="container mx-auto px-4 flex items-center justify-between"><a href="index.html" class="flex items-center gap-3 logo-shine"><img src="assets/images/logo/imd.svg" alt="IMDKOM — Kursus & Service Komputer Yogyakarta" class="h-7 w-auto" loading="eager" /><span class="text-sm text-gray-500 hidden xl:inline">Kursus &amp; Pelatihan • Computer Service</span></a><button id="mobileMenuBtn" class="lg:hidden text-gray-600 hover:text-brand focus:outline-none p-1" aria-label="Toggle menu"><i data-lucide="menu" class="w-6 h-6"></i></button><div id="mainNav" class="hidden lg:flex items-center gap-2"><a href="index.html" class="nav-link">Beranda</a><a href="kursus.html" class="nav-link">Kursus &amp; Pelatihan</a><a href="service.html" class="nav-link">Computer Service</a><a href="rakit-komputer.html" class="nav-link">Rakit Komputer</a><a href="tentang.html" class="nav-link">Tentang</a><a href="karir.html" class="nav-link">Karir</a><a href="kontak.html" class="nav-link">Kontak</a></div></div><div id="mobileNav" class="hidden lg:hidden bg-white/95 backdrop-blur-md border-t border-white/40 mt-3 py-3"><div class="container mx-auto px-4 flex flex-col gap-2"><a href="index.html" class="text-gray-600 hover:text-brand py-1.5">Beranda</a><a href="kursus.html" class="text-gray-600 hover:text-brand py-1.5">Kursus &amp; Pelatihan</a><a href="service.html" class="mobile-menu-highlight"><span class="menu-icon-wrap"><i data-lucide="wrench" class="w-4 h-4"></i>Computer Service</span><i data-lucide="arrow-right" class="menu-arrow"></i></a><a href="rakit-komputer.html" class="text-gray-600 hover:text-brand py-1.5">Rakit Komputer</a><a href="tentang.html" class="text-gray-600 hover:text-brand py-1.5">Tentang</a><a href="karir.html" class="text-gray-600 hover:text-brand py-1.5">Karir</a><a href="kontak.html" class="text-gray-600 hover:text-brand py-1.5">Kontak</a></div></div></nav>';

    function currentPage() {
        var file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (!file) file = 'index.html';
        if (file === 'program-detail.html') return 'kursus.html';
        if (file.indexOf('service') === 0) return 'service.html';
        return file;
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
        if (variant === 'fixed') {
            nav.className = 'bg-white/80 backdrop-blur-md border-b border-white/40 py-3 fixed top-0 left-0 right-0 z-50';
            nav.classList.add('is-fixed');
            window.addEventListener('scroll', function () {
                nav.classList.toggle('scrolled', window.scrollY > 8);
            }, { passive: true });
        } else {
            nav.className = 'bg-white border-b border-gray-200 py-3 sticky top-0 z-40';
        }
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

    function render(html) {
        mount.innerHTML = html;
        var nav = mount.querySelector('#mainNavbar');
        if (!nav) return;
        applyVariant(nav);
        setNavHeightVar(nav);
        applyActive(nav);
        bindToggle(nav);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    fetch('components/navbar.html', { cache: 'no-cache' })
        .then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        })
        .then(function (html) {
            if (html.indexOf('id="mainNavbar"') === -1) {
                throw new Error('navbar markup tidak ditemukan (kemungkinan _redirects mem-fallback ke index.html)');
            }
            render(html);
        })
        .catch(function (error) {
            console.warn('Navbar gagal dimuat via fetch, memakai fallback inline. Sebab:', error);
            render(FALLBACK_NAVBAR);
        });
})();

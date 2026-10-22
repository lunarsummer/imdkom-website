// ============================================================
// PC BUILDER — Lazy Fetch + Pagination + Sticky Nav + Search + Use Case Filter
// IMDKOM Yogyakarta
// ============================================================

import { db, collection, getDocs, query, where, orderBy, limit } from './firebase.js';

// ============================================================
// KONFIGURASI
// ============================================================
const STORAGE_KEY = 'imdkom_pc_build';
const CACHE_PREFIX = 'imdkom_pc_comp_';
const COMPONENTS_CACHE_TTL = 60 * 60 * 1000; // 1 jam
const WA_NUMBER = '6285601913435';

const VISIBLE_DEFAULT = 6;
const VISIBLE_INCREMENT = 6;
const FETCH_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 250;

const CATEGORIES = [
    { id: 'cpu',       label: 'Processor',    short: 'CPU', icon: 'cpu',           required: true,  dependsOn: null,        fetchOn: 'init' },
    { id: 'mainboard', label: 'Motherboard',  short: 'MB',  icon: 'circuit-board', required: true,  dependsOn: 'cpu',       fetchOn: 'cpu' },
    { id: 'ram',       label: 'RAM',          short: 'RAM', icon: 'memory-stick',  required: true,  dependsOn: 'mainboard', fetchOn: 'mainboard' },
    { id: 'storage',   label: 'Storage',      short: 'SSD', icon: 'hard-drive',    required: true,  dependsOn: 'mainboard', fetchOn: 'mainboard' },
    { id: 'vga',       label: 'VGA',          short: 'VGA', icon: 'gpu',           required: false, dependsOn: 'cpu',       fetchOn: 'cpu' },
    { id: 'psu',       label: 'Power Supply', short: 'PSU', icon: 'plug-zap',      required: true,  dependsOn: null,        fetchOn: 'init' },
    { id: 'casing',    label: 'Casing',       short: 'Case',icon: 'box',           required: true,  dependsOn: 'mainboard', fetchOn: 'mainboard' }
];

const GOOGLE_CONTEXT = {
    cpu: 'processor', mainboard: 'motherboard', ram: 'RAM memory',
    storage: 'SSD HDD', vga: 'graphics card GPU', psu: 'power supply', casing: 'PC case'
};

const TIER_COLORS = {
    1: '#10b981', 2: '#059669', 3: '#0891b2', 4: '#2563eb',
    5: '#7c3aed', 6: '#c2410c', 7: '#dc2626'
};

const TIER_LABELS = {
    1: 'Entry', 2: 'Low', 3: 'Mid-Low', 4: 'Mainstream',
    5: 'Mid-High', 6: 'Performance', 7: 'Enthusiast'
};

// ============================================================
// USE CASE GUIDE (untuk CPU)
// ============================================================
const CPU_USE_CASES = [
    {
        id: 'office',
        icon: 'file-text',
        label: 'Office & Web',
        desc: 'Surat, Excel, browsing, video call',
        tiers: [1, 2, 3],
        color: '#059669'
    },
    {
        id: 'study',
        icon: 'graduation-cap',
        label: 'Belajar & Multimedia',
        desc: 'Zoom, coding ringan, nonton',
        tiers: [2, 3, 4],
        color: '#0891b2'
    },
    {
        id: 'gaming',
        icon: 'gamepad-2',
        label: 'Gaming',
        desc: 'Game e-sports hingga AAA',
        tiers: [4, 5, 6],
        color: '#7c3aed'
    },
    {
        id: 'editing',
        icon: 'film',
        label: 'Editing & Desain',
        desc: 'Premiere, Photoshop, 3D',
        tiers: [5, 6, 7],
        color: '#c2410c'
    },
    {
        id: 'custom',
        icon: 'settings-2',
        label: 'Custom',
        desc: 'Saya tahu spesifikasi',
        tiers: 'all',
        color: '#6b7280'
    }
];

// ============================================================
// USE CASE FILTER CONFIG (untuk semua kategori)
// ============================================================
const USE_CASE_FILTERS = {
    office: {
        label: 'Office & Web',
        icon: 'file-text',
        color: '#059669',
        cpu:       { tiers: [1, 2, 3], requireIgpu: true },
        mainboard: { chipsetTiers: [1, 2, 3] },
        ram:       { maxCapacity: 16 },
        storage:   { allowedTypes: ['SSD', 'HDD'] },
        vga:       { skip: true },
        psu:       { maxWatt: 500 },
        casing:    { formFactors: ['mATX', 'ITX'] }
    },
    study: {
        label: 'Belajar & Multimedia',
        icon: 'graduation-cap',
        color: '#0891b2',
        cpu:       { tiers: [2, 3, 4] },
        mainboard: { chipsetTiers: [2, 3, 4] },
        ram:       { maxCapacity: 16 },
        storage:   { allowedTypes: ['SSD', 'HDD', 'NVMe'] },
        vga:       { optional: true },
        psu:       { maxWatt: 600 },
        casing:    { formFactors: ['mATX', 'ATX'] }
    },
    gaming: {
        label: 'Gaming',
        icon: 'gamepad-2',
        color: '#7c3aed',
        cpu:       { tiers: [4, 5, 6] },
        mainboard: { chipsetTiers: [4, 5, 6] },
        ram:       { minCapacity: 16, maxCapacity: 32 },
        storage:   { allowedTypes: ['SSD', 'NVMe'] },
        vga:       { tiers: [4, 5, 6] },
        psu:       { minWatt: 550, maxWatt: 750 },
        casing:    { formFactors: ['ATX', 'mATX'] }
    },
    editing: {
        label: 'Editing & Desain',
        icon: 'film',
        color: '#c2410c',
        cpu:       { tiers: [5, 6, 7] },
        mainboard: { chipsetTiers: [5, 6, 7] },
        ram:       { minCapacity: 32 },
        storage:   { allowedTypes: ['NVMe'] },
        vga:       { tiers: [5, 6, 7] },
        psu:       { minWatt: 650 },
        casing:    { formFactors: ['ATX', 'E-ATX'] }
    },
    custom: {
        label: 'Custom',
        icon: 'settings-2',
        color: '#6b7280',
        cpu:       { tiers: 'all' },
        mainboard: { chipsetTiers: 'all' },
        ram:       {},
        storage:   {},
        vga:       {},
        psu:       {},
        casing:    {}
    }
};

// ============================================================
// CHIPSET → TIER MAPPING (untuk mainboard)
// ============================================================
const CHIPSET_TIER_MAP = {
    // Intel LGA1155 (jadul)
    'H61': 1, 'B75': 2, 'H67': 3, 'H77': 3, 'P67': 4, 'Z68': 4, 'Z75': 4, 'Z77': 5,
    // Intel LGA1150
    'H81': 1, 'B85': 2, 'H87': 3, 'H97': 3, 'Z87': 4, 'Z97': 5,
    // Intel LGA1151
    'H110': 1, 'B150': 2, 'B250': 3, 'H170': 3, 'H270': 3, 'Z170': 5, 'Z270': 5,
    'H310': 1, 'B360': 3, 'B365': 3, 'H370': 3, 'Z370': 5, 'Z390': 5,
    // Intel LGA1200
    'H410': 1, 'H510': 1, 'B460': 3, 'B560': 4, 'H470': 4, 'H570': 4, 'Z490': 6, 'Z590': 6,
    // Intel LGA1700
    'H610': 2, 'B660': 4, 'B760': 4, 'H670': 5, 'H770': 5, 'Z690': 6, 'Z790': 7,
    // Intel LGA1851
    'H810': 2, 'B860': 4, 'Z890': 7,
    // AMD AM4
    'A320': 1, 'A520': 1, 'B350': 2, 'B450': 3, 'B550': 4, 'X370': 4, 'X470': 5, 'X570': 6,
    // AMD AM5
    'A620': 2, 'B650': 4, 'B650E': 5, 'X670': 6, 'X670E': 7,
    // AMD FM2/AM3
    'A68H': 1, 'A78': 2, 'A88X': 3
};

// ============================================================
// STATE
// ============================================================
let buildState = {
    cpu: null, mainboard: null, ram: null,
    storage: null, vga: null, psu: null, casing: null
};

let pcComponents = {
    cpu: [], mainboard: [], ram: [], storage: [],
    vga: [], psu: [], casing: []
};

let fetchStatus = {
    cpu: 'idle', mainboard: 'idle', ram: 'idle', storage: 'idle',
    vga: 'idle', psu: 'idle', casing: 'idle'
};

let visibleCount = {
    cpu: VISIBLE_DEFAULT, mainboard: VISIBLE_DEFAULT, ram: VISIBLE_DEFAULT,
    storage: VISIBLE_DEFAULT, vga: VISIBLE_DEFAULT, psu: VISIBLE_DEFAULT, casing: VISIBLE_DEFAULT
};

let cpuBrandFilter = 'all';
let cpuUseCase = null;          // 'office' | 'study' | 'gaming' | 'editing' | 'custom' | null
let vgaEnabled = false;         // khusus office — user bisa aktifkan VGA manual
let tierFilters = { cpu: 'all', vga: 'all' };
let psuWattFilter = 'all';
let casingFFFilter = 'all';

// Search per kategori
let searchQueries = {
    cpu: '', mainboard: '', ram: '', storage: '',
    vga: '', psu: '', casing: ''
};

let searchOpen = {
    cpu: false, mainboard: false, ram: false, storage: false,
    vga: false, psu: false, casing: false
};

let searchDebounceTimers = {};

// ============================================================
// TIER MAPPING HELPERS
// ============================================================
function getMainboardTier(mb) {
    const chipset = (mb.spesifikasi?.chipset || '').toUpperCase().trim();
    if (CHIPSET_TIER_MAP[chipset]) return CHIPSET_TIER_MAP[chipset];
    for (const [key, tier] of Object.entries(CHIPSET_TIER_MAP)) {
        if (chipset.startsWith(key)) return tier;
    }
    const socket = (mb.spesifikasi?.socket || '').toUpperCase();
    if (socket.includes('1155') || socket.includes('1150') || socket.includes('FM2') || socket.includes('AM3')) return 1;
    if (socket.includes('1151')) return 2;
    const ff = (mb.spesifikasi?.formFactor || '').toLowerCase();
    if (ff.includes('eatx')) return 7;
    if (ff.includes('atx')) return 4;
    if (ff.includes('matx')) return 3;
    if (ff.includes('itx')) return 3;
    return 3;
}

function getRamTier(ram) {
    const type = (ram.spesifikasi?.type || '').toUpperCase();
    const capacity = ram.spesifikasi?.capacity || 8;
    const speed = parseInt((ram.spesifikasi?.speed || '0').replace(/[^0-9]/g, '')) || 0;

    let genScore = 3;
    if (type.includes('DDR3')) genScore = 1;
    else if (type.includes('DDR4')) genScore = 3;
    else if (type.includes('DDR5')) genScore = 5;

    let capBonus = 0;
    if (capacity >= 64) capBonus = 2;
    else if (capacity >= 32) capBonus = 1;
    else if (capacity <= 4) capBonus = -1;

    let speedBonus = 0;
    if (type.includes('DDR5') && speed >= 6000) speedBonus = 1;
    if (type.includes('DDR4') && speed >= 3600) speedBonus = 1;

    return Math.min(7, Math.max(1, genScore + capBonus + speedBonus));
}

function getStorageTier(storage) {
    const type = (storage.spesifikasi?.type || '').toUpperCase();
    const iface = (storage.spesifikasi?.interface || '').toUpperCase();
    const capacity = storage.spesifikasi?.capacity || 256;
    const speedMatch = (storage.spesifikasi?.speed || '').match(/(\d+)/);
    const speed = speedMatch ? parseInt(speedMatch[1]) : 0;

    let baseTier = 2;
    if (type.includes('HDD')) {
        baseTier = 1;
    } else if (type.includes('SSD')) {
        if (iface.includes('NVME') || iface.includes('M.2')) {
            if (speed >= 7000) baseTier = 7;
            else if (speed >= 5000) baseTier = 6;
            else if (speed >= 3000) baseTier = 5;
            else if (speed >= 1500) baseTier = 4;
            else baseTier = 3;
        } else if (iface.includes('SATA')) {
            baseTier = 3;
        }
    }
    let capBonus = 0;
    if (capacity >= 2000) capBonus = 1;
    else if (capacity < 256) capBonus = -1;
    return Math.min(7, Math.max(1, baseTier + capBonus));
}

function getPsuTier(psu) {
    const watt = psu.spesifikasi?.wattage || 500;
    const eff = (psu.spesifikasi?.efficiency || '').toUpperCase();

    let baseTier;
    if (watt < 400) baseTier = 1;
    else if (watt < 500) baseTier = 2;
    else if (watt < 600) baseTier = 3;
    else if (watt < 700) baseTier = 4;
    else if (watt < 800) baseTier = 5;
    else if (watt < 1000) baseTier = 6;
    else baseTier = 7;

    let effBonus = 0;
    if (eff.includes('TITANIUM')) effBonus = 2;
    else if (eff.includes('PLATINUM')) effBonus = 1.5;
    else if (eff.includes('GOLD')) effBonus = 1;
    else if (eff.includes('SILVER')) effBonus = 0.5;

    return Math.min(7, Math.round(baseTier + effBonus));
}

function getCasingTier(casing) {
    const ff = (casing.spesifikasi?.formFactor || []).map(f => f.toUpperCase());
    const maxGpu = casing.spesifikasi?.maxGpuLength || 0;

    if (ff.includes('E-ATX') || ff.includes('EATX')) return 7;
    if (ff.includes('ATX')) {
        if (maxGpu >= 400) return 6;
        if (maxGpu >= 350) return 5;
        return 4;
    }
    if (ff.includes('MATX')) {
        if (maxGpu >= 350) return 4;
        return 3;
    }
    if (ff.includes('ITX')) {
        if (maxGpu >= 330) return 6;
        if (maxGpu >= 300) return 5;
        return 4;
    }
    return 3;
}

function getComponentTier(comp) {
    if (comp.spesifikasi?.tier) return comp.spesifikasi.tier;
    switch (comp.kategori) {
        case 'mainboard': return getMainboardTier(comp);
        case 'ram':       return getRamTier(comp);
        case 'storage':   return getStorageTier(comp);
        case 'psu':       return getPsuTier(comp);
        case 'casing':    return getCasingTier(comp);
        default:          return 3;
    }
}

// ============================================================
// INIT
// ============================================================
export async function initPcBuilder() {
    renderStickyNav();
    loadBuildFromStorage();

    try {
        await Promise.all([fetchCategory('cpu'), fetchCategory('psu')]);
    } catch (err) {
        console.error('Init fetch error:', err);
    }

    if (buildState.cpu) {
        try {
            await Promise.all([fetchCategory('mainboard'), fetchCategory('vga')]);
        } catch (err) { console.error('Init dependent fetch error:', err); }
    }
    if (buildState.mainboard) {
        try {
            await Promise.all([fetchCategory('ram'), fetchCategory('storage'), fetchCategory('casing')]);
        } catch (err) { console.error('Init dependent2 fetch error:', err); }
    }

    renderProgress();
    renderSteps();
    renderSummary();
    renderStickyNav();

    if (typeof lucide !== 'undefined') lucide.createIcons();

    console.log('✅ PC Builder initialized');
}

// ============================================================
// FETCH PER KATEGORI (LAZY)
// ============================================================
async function fetchCategory(catId) {
    if (pcComponents[catId].length > 0 && fetchStatus[catId] === 'loaded') return;

    const cached = getCacheFromStorage(catId);
    if (cached) {
        pcComponents[catId] = cached;
        fetchStatus[catId] = 'loaded';
        tryRestoreFromSaved(catId);
        return;
    }

    fetchStatus[catId] = 'loading';
    updateCategoryUI(catId);

    try {
        const q = query(
            collection(db, 'pc_components'),
            where('aktif', '==', true),
            where('kategori', '==', catId),
            orderBy('order', 'asc'),
            limit(FETCH_LIMIT)
        );
        const snapshot = await getDocs(q);
        pcComponents[catId] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchStatus[catId] = 'loaded';
        saveCacheToStorage(catId, pcComponents[catId]);
        tryRestoreFromSaved(catId);
    } catch (error) {
        console.error(`Fetch ${catId} error:`, error);
        fetchStatus[catId] = 'error';
    }

    updateCategoryUI(catId);
}

// ============================================================
// CACHE PER KATEGORI
// ============================================================
function getCacheFromStorage(catId) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + catId);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp > COMPONENTS_CACHE_TTL) {
            localStorage.removeItem(CACHE_PREFIX + catId);
            return null;
        }
        return data;
    } catch (e) { return null; }
}

function saveCacheToStorage(catId, data) {
    try {
        localStorage.setItem(CACHE_PREFIX + catId, JSON.stringify({
            data, timestamp: Date.now()
        }));
    } catch (e) {}
}

function clearCacheForCategory(catId) {
    try { localStorage.removeItem(CACHE_PREFIX + catId); } catch (e) {}
}

function getDependentCategories(catId) {
    if (catId === 'cpu') return ['mainboard', 'ram', 'storage', 'casing', 'vga'];
    if (catId === 'mainboard') return ['ram', 'storage', 'casing'];
    return [];
}

// ============================================================
// UPDATE UI PER KATEGORI
// ============================================================
function updateCategoryUI(catId) {
    const section = document.getElementById(`step-${catId}`);
    if (!section) return;
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// STICKY NAV
// ============================================================
function renderStickyNav() {
    const container = document.getElementById('stepNavInner');
    if (!container) return;

    let html = '';
    CATEGORIES.forEach((cat) => {
    const value = buildState[cat.id];
    const isDone = value !== null;
    const unlocked = isStepUnlocked(cat.id);
    const isActive = !isDone && unlocked;

// Deteksi bottleneck khusus untuk step VGA
let bottleneckLevel = null;
if (cat.id === 'vga' && isDone) {
    const bn = checkBottleneck();
    if (bn) {
        // danger → merah, warning/info → kuning
        if (bn.level === 'danger') bottleneckLevel = 'danger';
        else if (bn.level === 'warning' || bn.level === 'info') bottleneckLevel = 'warning';
    }
}

let cls = 'step-nav-item';
if (bottleneckLevel === 'danger') cls += ' bottleneck-danger';
else if (bottleneckLevel === 'warning') cls += ' bottleneck-warning';
else if (isDone) cls += ' done';
else if (isActive) cls += ' active';
else if (!unlocked) cls += ' locked';

let title = cat.label;
if (bottleneckLevel === 'danger') title = '🚨 Bottleneck parah terdeteksi';
else if (bottleneckLevel === 'warning') {
    // Bedakan pesan warning vs info
    const bn = checkBottleneck();
    if (bn && bn.level === 'info') title = 'ℹ️ Kurang seimbang';
    else title = '⚠️ Bottleneck ringan terdeteksi';
}

    html += `
        <div class="${cls}" data-cat="${cat.id}" title="${title}">
            <span class="step-nav-icon">
                <i data-lucide="${cat.icon}" class="w-3 h-3"></i>
            </span>
            <span class="step-label">${cat.short}</span>
        </div>
    `;
});
    container.innerHTML = html;

    const requiredCount = CATEGORIES.filter(c => c.required).length;
    const requiredDone = CATEGORIES.filter(c => c.required && buildState[c.id]).length;
    const pct = Math.round((requiredDone / requiredCount) * 100);

    const fill = document.getElementById('stepProgressFill');
    const label = document.getElementById('stepProgressLabel');
    const count = document.getElementById('stepProgressCount');
    if (fill) fill.style.width = pct + '%';
    if (count) count.textContent = `${requiredDone}/${requiredCount}`;
    if (label) {
        if (requiredDone === 0) label.textContent = 'Mulai dari Processor';
        else if (requiredDone < requiredCount) label.textContent = `${requiredCount - requiredDone} komponen lagi`;
        else label.textContent = 'Build siap! ✓';
    }

    container.querySelectorAll('.step-nav-item').forEach(el => {
        el.addEventListener('click', () => {
            const catId = el.dataset.cat;
            if (!isStepUnlocked(catId)) return;
            const target = document.getElementById(`step-${catId}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.classList.add('highlight');
                setTimeout(() => target.classList.remove('highlight'), 1200);
            }
        });
    });
}

function renderProgress() {
    renderStickyNav();
}

// ============================================================
// USE CASE BADGE (untuk semua step selain CPU)
// ============================================================
function renderUseCaseBadge(catId) {
    if (!cpuUseCase || cpuUseCase === 'custom') return '';
    const uc = USE_CASE_FILTERS[cpuUseCase];
    if (!uc) return '';

    // Hint spesifik per kategori
    let hint = '';
    if (catId === 'mainboard') hint = '— chipset hemat daya';
    if (catId === 'ram') hint = '— kapasitas wajar';
    if (catId === 'storage') hint = '— penyimpanan cukup';
    if (catId === 'vga' && uc.vga?.skip) hint = '— tidak diperlukan (CPU sudah iGPU)';
    if (catId === 'psu') hint = '— watt sesuai kebutuhan';
    if (catId === 'casing') hint = '— ukuran sesuai';

    return `
        <div class="use-case-badge mb-3"
             style="background: ${uc.color}12; border: 1px solid ${uc.color}40; color: ${uc.color};">
            <i data-lucide="${uc.icon}" class="w-3.5 h-3.5 flex-shrink-0"></i>
            <span class="text-xs">Tersortir untuk <strong>${uc.label}</strong> ${hint}</span>
        </div>
    `;
}

// ============================================================
// VGA DISABLED STATE (untuk Office)
// ============================================================
function renderVgaDisabledState() {
    const uc = USE_CASE_FILTERS[cpuUseCase];
    return `
        <div class="vga-disabled-box">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style="background: ${uc.color}15;">
                    <i data-lucide="check-circle" class="w-5 h-5" style="color: ${uc.color};"></i>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-sm" style="color: ${uc.color};">
                        Tidak diperlukan untuk ${uc.label}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        CPU yang Anda pilih sudah punya <strong>iGPU</strong> — grafis terintegrasi sudah cukup untuk kebutuhan office.
                    </p>
                    <button onclick="enableVgaForOffice()"
                            class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
                            style="border-color: ${uc.color}40; color: ${uc.color}; background: white;">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                        Tetap tambahkan VGA
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.enableVgaForOffice = function() {
    vgaEnabled = true;
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// RENDER STEPS
// ============================================================
function renderSteps() {
    const container = document.getElementById('stepsContainer');
    if (!container) return;
    let html = '';

    CATEGORIES.forEach((cat, i) => {
        const unlocked = isStepUnlocked(cat.id);
        const selected = buildState[cat.id];
        const status = fetchStatus[cat.id];
        const tierFilterActive = tierFilters[cat.id] && tierFilters[cat.id] !== 'all';

        let sectionCls = 'step-section';
        if (!unlocked) sectionCls += ' locked';
        else if (!selected) sectionCls += ' active';

        // VGA skip logic (Office)
        const isVgaSkipped = cat.id === 'vga' && cpuUseCase === 'office' && !vgaEnabled && !selected;

        html += `
            <div class="${sectionCls}" id="step-${cat.id}">
                <div class="flex items-center justify-between mb-4 gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <i data-lucide="${cat.icon}" class="w-5 h-5 text-brand"></i>
                        </div>
                        <div class="min-w-0">
                            <h3 class="font-bold text-brand text-base sm:text-lg truncate">
                                ${i + 1}. ${cat.label}
                                ${cat.required ? '<span class="text-red-500 text-sm">*</span>' : '<span class="text-gray-400 text-xs font-normal ml-2">(Opsional)</span>'}
                            </h3>
                            <p class="text-[11px] sm:text-xs text-gray-500 truncate">${getStepHint(cat.id)}</p>
                        </div>
                    </div>
                    <div class="step-header-actions">
                        ${!selected && unlocked && !isVgaSkipped ? `
                            <button class="search-toggle-btn ${searchOpen[cat.id] ? 'active' : ''}"
                                    onclick="toggleSearch('${cat.id}')"
                                    title="Cari ${cat.label}"
                                    aria-label="Cari ${cat.label}">
                                <i data-lucide="${searchOpen[cat.id] ? 'x' : 'search'}" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        ${selected ? `
                            <button onclick="clearStep('${cat.id}')" class="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 flex-shrink-0">
                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Ganti</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${!unlocked ? `
                    <div class="text-center py-6 text-gray-400 text-sm">
                        <i data-lucide="lock" class="w-5 h-5 mx-auto mb-2"></i>
                        ${getLockMessage(cat.id)}
                    </div>
                ` : selected ? `
                    <div class="component-card selected" style="cursor: default;">
                        ${renderComponentInfo(selected)}
                    </div>
                ` : isVgaSkipped ? `
                    ${renderUseCaseBadge(cat.id)}
                    ${renderVgaDisabledState()}
                ` : `
                    ${cat.id === 'cpu' ? renderCpuUseCaseGuide() : renderUseCaseBadge(cat.id)}
                    ${renderSearchForm(cat.id)}
                    ${cat.id === 'cpu' && cpuUseCase ? renderCpuTabs() : ''}
                    ${cat.id === 'cpu' && cpuUseCase ? renderTierFilter(cat.id) : ''}
                    ${cat.id !== 'cpu' ? renderTierFilter(cat.id) : ''}
                    ${cat.id === 'psu' ? renderPsuFilter() : ''}
                    ${cat.id === 'casing' ? renderCasingFilter() : ''}
                    ${renderWarningBox(cat.id)}
                    ${renderCategoryGrid(cat.id, status, tierFilterActive)}
                `}
            </div>
        `;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// CPU USE CASE GUIDE
// ============================================================
function renderCpuUseCaseGuide() {
    if (cpuUseCase) {
        const uc = CPU_USE_CASES.find(u => u.id === cpuUseCase);
        if (!uc) return '';
        const tierText = uc.tiers === 'all' ? 'semua tier' : `Tier ${uc.tiers.join(', ')}`;
        const igpuNote = (cpuUseCase === 'office') ? ' — wajib punya iGPU' : '';
        return `
            <div class="warning-box mb-3" style="background: ${uc.color}12; border-color: ${uc.color}40; color: ${uc.color};">
                <i data-lucide="${uc.icon}" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <div class="flex-1">
                    <span class="text-xs">Menampilkan CPU untuk <strong>${uc.label}</strong> (${tierText}${igpuNote})</span>
                </div>
                <button onclick="resetCpuUseCase()" class="text-xs underline font-semibold flex-shrink-0">Ganti</button>
            </div>
        `;
    }

    return `
        <div class="use-case-guide mb-4">
            <div class="flex items-center gap-2 mb-3">
                <i data-lucide="help-circle" class="w-4 h-4 text-brand"></i>
                <span class="text-sm font-bold text-brand">Komputer ini akan digunakan untuk apa?</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                ${CPU_USE_CASES.map(uc => `
                    <button onclick="selectCpuUseCase('${uc.id}')"
                            class="use-case-card"
                            style="--uc-color: ${uc.color};">
                        <i data-lucide="${uc.icon}" class="w-5 h-5" style="color: ${uc.color};"></i>
                        <div class="font-bold text-xs text-gray-800 mt-1">${uc.label}</div>
                        <div class="text-[10px] text-gray-500 mt-0.5 leading-tight">${uc.desc}</div>
                    </button>
                `).join('')}
            </div>
            <div class="text-center mt-3">
                <button onclick="skipCpuUseCase()" class="text-xs text-brand hover:underline font-medium inline-flex items-center gap-1">
                    <i data-lucide="arrow-right" class="w-3 h-3"></i>
                    Lihat semua CPU tanpa panduan
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// RESET BUILD HELPER
// ============================================================
function resetBuildState() {
    buildState = { cpu: null, mainboard: null, ram: null, storage: null, vga: null, psu: null, casing: null };
    cpuBrandFilter = 'all';
    vgaEnabled = false;
    tierFilters = { cpu: 'all', vga: 'all' };
    psuWattFilter = 'all';
    casingFFFilter = 'all';
    Object.keys(searchQueries).forEach(k => searchQueries[k] = '');
    Object.keys(searchOpen).forEach(k => searchOpen[k] = false);
    Object.keys(visibleCount).forEach(k => visibleCount[k] = VISIBLE_DEFAULT);
    saveBuildToStorage();
}

window.selectCpuUseCase = function(useCaseId) {
    // Kalau ganti use case setelah pilih CPU → reset build
    if (cpuUseCase && cpuUseCase !== useCaseId && buildState.cpu) {
        if (!confirm('Mengganti kebutuhan akan mereset semua komponen yang sudah dipilih. Lanjutkan?')) {
            return;
        }
        resetBuildState();
    }
    cpuUseCase = useCaseId;
    tierFilters.cpu = 'all';
    visibleCount.cpu = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    renderSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.resetCpuUseCase = function() {
    if (buildState.cpu) {
        if (!confirm('Mengganti kebutuhan akan mereset semua komponen yang sudah dipilih. Lanjutkan?')) {
            return;
        }
        resetBuildState();
    }
    cpuUseCase = null;
    tierFilters.cpu = 'all';
    visibleCount.cpu = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    renderSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.skipCpuUseCase = function() {
    if (buildState.cpu && cpuUseCase !== 'custom') {
        if (!confirm('Mengganti kebutuhan akan mereset semua komponen yang sudah dipilih. Lanjutkan?')) {
            return;
        }
        resetBuildState();
    }
    cpuUseCase = 'custom';
    visibleCount.cpu = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    renderSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// SEARCH FORM PER KATEGORI
// ============================================================
function renderSearchForm(catId) {
    const isOpen = searchOpen[catId];
    const value = searchQueries[catId] || '';
    const cat = CATEGORIES.find(c => c.id === catId);

    return `
        <div class="search-form-wrapper ${isOpen ? 'open' : ''}" id="search-wrapper-${catId}">
            <div class="search-input-wrapper">
                <i data-lucide="search" class="w-4 h-4 search-icon-left"></i>
                <input type="text"
                       id="search-input-${catId}"
                       placeholder="Cari ${cat ? cat.label : ''}..."
                       value="${escapeHtml(value)}"
                       autocomplete="off"
                       oninput="onSearchInput('${catId}', this.value)"
                       onkeydown="onSearchKeydown(event, '${catId}')" />
                <button class="search-clear-btn ${value ? 'visible' : ''}"
                        id="search-clear-${catId}"
                        onclick="clearSearch('${catId}')"
                        title="Bersihkan"
                        aria-label="Bersihkan pencarian">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            </div>
            ${value ? renderSearchResultInfo(catId) : ''}
        </div>
    `;
}

function renderSearchResultInfo(catId) {
    const q = searchQueries[catId] || '';
    if (!q.trim()) return '';
    const allFiltered = getFilteredComponents(catId);
    const total = allFiltered.length;
    const visible = Math.min(visibleCount[catId], total);

    if (total === 0) {
        return `
            <div class="search-result-info" style="color: #dc2626;">
                <i data-lucide="search-x" class="w-3 h-3"></i>
                Tidak ada hasil untuk "<strong>${escapeHtml(q)}</strong>"
            </div>
        `;
    }

    return `
        <div class="search-result-info">
            <i data-lucide="check-circle" class="w-3 h-3" style="color: #059669;"></i>
            Ditemukan <strong>${total}</strong> komponen — menampilkan ${visible}
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// SEARCH HANDLERS
// ============================================================
window.toggleSearch = function(catId) {
    searchOpen[catId] = !searchOpen[catId];

    if (!searchOpen[catId]) {
        searchQueries[catId] = '';
        visibleCount[catId] = VISIBLE_DEFAULT;
    }

    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (searchOpen[catId]) {
        setTimeout(() => {
            const input = document.getElementById(`search-input-${catId}`);
            if (input) {
                input.focus();
                const rect = input.getBoundingClientRect();
                if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 320);
    }
};

window.onSearchInput = function(catId, value) {
    searchQueries[catId] = value;
    visibleCount[catId] = VISIBLE_DEFAULT;

    const clearBtn = document.getElementById(`search-clear-${catId}`);
    if (clearBtn) {
        if (value) clearBtn.classList.add('visible');
        else clearBtn.classList.remove('visible');
    }

    if (searchDebounceTimers[catId]) {
        clearTimeout(searchDebounceTimers[catId]);
    }
    searchDebounceTimers[catId] = setTimeout(() => {
        const input = document.getElementById(`search-input-${catId}`);
        const cursorPos = input ? input.selectionStart : null;
        const scrollY = window.scrollY;

        rerenderSearchResults(catId);

        const newInput = document.getElementById(`search-input-${catId}`);
        if (newInput) {
            newInput.focus();
            if (cursorPos !== null) {
                try { newInput.setSelectionRange(cursorPos, cursorPos); } catch(e) {}
            }
        }
        window.scrollTo({ top: scrollY, behavior: 'instant' });
    }, SEARCH_DEBOUNCE_MS);
};

function rerenderSearchResults(catId) {
    const wrapper = document.getElementById(`search-wrapper-${catId}`);
    if (wrapper) {
        const oldInfo = wrapper.querySelector('.search-result-info');
        const newInfoHTML = renderSearchResultInfo(catId);
        if (oldInfo) {
            const temp = document.createElement('div');
            temp.innerHTML = newInfoHTML;
            const newInfo = temp.firstElementChild;
            if (newInfo) oldInfo.replaceWith(newInfo);
            else oldInfo.remove();
        } else if (newInfoHTML) {
            wrapper.insertAdjacentHTML('beforeend', newInfoHTML);
        }
    }

    const stepSection = document.getElementById(`step-${catId}`);
    if (!stepSection) return;

    const oldGrid = stepSection.querySelector('.grid');
    if (!oldGrid) {
        renderSteps();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const status = fetchStatus[catId];
    const tierFilterActive = tierFilters[catId] && tierFilters[catId] !== 'all';
    const temp = document.createElement('div');
    temp.innerHTML = renderCategoryGrid(catId, status, tierFilterActive);
    const newGrid = temp.firstElementChild;

    if (newGrid) {
        oldGrid.replaceWith(newGrid);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.clearSearch = function(catId) {
    searchQueries[catId] = '';
    visibleCount[catId] = VISIBLE_DEFAULT;

    const input = document.getElementById(`search-input-${catId}`);
    if (input) {
        input.value = '';
        input.focus();
    }

    const clearBtn = document.getElementById(`search-clear-${catId}`);
    if (clearBtn) clearBtn.classList.remove('visible');

    rerenderSearchResults(catId);
};

window.onSearchKeydown = function(event, catId) {
    if (event.key === 'Escape') {
        event.preventDefault();
        if (searchQueries[catId]) {
            clearSearch(catId);
        } else {
            toggleSearch(catId);
        }
    }
};

// ============================================================
// RENDER GRID PER KATEGORI
// ============================================================
function renderCategoryGrid(catId, status, tierFilterActive) {
    if (status === 'loading' || status === 'idle') {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                ${renderSkeletonCard()}
                ${renderSkeletonCard()}
                ${renderSkeletonCard()}
                ${renderSkeletonCard()}
            </div>
        `;
    }

    if (status === 'error') {
        return `
            <div class="mt-3 text-center py-8 px-4 bg-red-50 border border-red-200 rounded-xl">
                <i data-lucide="alert-circle" class="w-10 h-10 mx-auto text-red-400 mb-2"></i>
                <p class="text-sm font-medium text-red-700 mb-1">Gagal memuat komponen</p>
                <p class="text-xs text-red-500 mb-3">Periksa koneksi internet Anda</p>
                <button onclick="retryFetchCategory('${catId}')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Coba Lagi
                </button>
            </div>
        `;
    }

    // CPU belum pilih use case → jangan render
    if (catId === 'cpu' && !cpuUseCase) return '';

    const allFiltered = getFilteredComponents(catId);
    const visible = allFiltered.slice(0, visibleCount[catId]);
    const hasMore = allFiltered.length > visibleCount[catId];
    const remaining = allFiltered.length - visibleCount[catId];

    if (allFiltered.length === 0) {
        return renderEmptyState(catId, tierFilterActive);
    }

    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">`;

    visible.forEach(c => {
        if (catId === 'casing' && buildState.vga && buildState.vga.spesifikasi?.length) {
            const vgaLen = buildState.vga.spesifikasi.length;
            const maxGpu = c.spesifikasi.maxGpuLength || 0;
            if (vgaLen > maxGpu) {
                html += `
                    <div class="component-card disabled">
                        ${renderComponentInfo(c)}
                    </div>
                `;
                return;
            }
        }
        html += renderComponentCard(c, catId);
    });

    if (hasMore) {
        html += `
            <button onclick="showMore('${catId}')" class="show-more-btn">
                <i data-lucide="chevron-down" class="w-4 h-4"></i>
                Tampilkan ${Math.min(VISIBLE_INCREMENT, remaining)} lagi
                <span class="text-xs text-gray-400 font-normal">(${remaining} tersisa)</span>
            </button>
        `;
    }

    html += `</div>`;
    return html;
}

function renderSkeletonCard() {
    return `
        <div class="skeleton-card">
            <div class="skeleton-line h-6 w-3-4"></div>
            <div class="skeleton-line w-1-2"></div>
            <div class="skeleton-line w-2-3"></div>
            <div class="skeleton-line w-1-3"></div>
        </div>
    `;
}

// ============================================================
// SHOW MORE
// ============================================================
window.showMore = function(catId) {
    visibleCount[catId] += VISIBLE_INCREMENT;
    const scrollY = window.scrollY;
    renderSteps();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.scrollTo({ top: scrollY, behavior: 'instant' });
};

window.retryFetchCategory = async function(catId) {
    fetchStatus[catId] = 'idle';
    clearCacheForCategory(catId);
    await fetchCategory(catId);
};

// ============================================================
// CPU TABS
// ============================================================
function renderCpuTabs() {
    return `
        <div class="flex gap-2 mb-3">
            <button onclick="setCpuBrand('all')" class="cpu-tab ${cpuBrandFilter === 'all' ? 'active' : ''}">Semua</button>
            <button onclick="setCpuBrand('Intel')" class="cpu-tab ${cpuBrandFilter === 'Intel' ? 'active' : ''}">Intel</button>
            <button onclick="setCpuBrand('AMD')" class="cpu-tab ${cpuBrandFilter === 'AMD' ? 'active' : ''}">AMD</button>
        </div>
    `;
}

// ============================================================
// TIER FILTER (khusus CPU & VGA)
// ============================================================
function renderTierFilter(categoryId) {
    const tierEnabledCategories = ['cpu', 'vga'];
    if (!tierEnabledCategories.includes(categoryId)) return '';

    const currentFilter = tierFilters[categoryId] || 'all';
    let baseList = pcComponents[categoryId].filter(c => c.aktif);

    if (categoryId === 'cpu' && cpuBrandFilter !== 'all') {
        baseList = baseList.filter(c => c.brand === cpuBrandFilter);
    }

    const tierCounts = {};
    baseList.forEach(c => {
        const t = c.spesifikasi?.tier;
        if (t) tierCounts[t] = (tierCounts[t] || 0) + 1;
    });

    if (baseList.length === 0) return '';

    let html = `
        <div class="tier-filter mb-3">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="filter" class="w-3 h-3 text-brand"></i>
                <span class="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Filter Tier</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="setTierFilter('${categoryId}', 'all')"
                        class="tier-filter-btn ${currentFilter === 'all' ? 'active' : ''}">
                    Semua (${baseList.length})
                </button>
    `;

    [1, 2, 3, 4, 5, 6, 7].forEach(tier => {
        const count = tierCounts[tier] || 0;
        if (count === 0) return;
        const isActive = String(currentFilter) === String(tier);
        html += `
            <button onclick="setTierFilter('${categoryId}', ${tier})"
                    class="tier-filter-btn ${isActive ? 'active' : ''}"
                    style="${isActive ? `background: ${TIER_COLORS[tier]}; border-color: ${TIER_COLORS[tier]}; color: white;` : ''}">
                T${tier} (${count})
            </button>
        `;
    });

    html += `</div></div>`;
    return html;
}

// ============================================================
// PSU FILTER
// ============================================================
function renderPsuFilter() {
    const currentFilter = psuWattFilter;
    const watt = calculateTotalWatt();
    const minWatt = watt > 0 ? Math.ceil((watt + 100) * 1.2) : 0;
    let baseList = pcComponents.psu.filter(c => c.aktif);
    if (minWatt > 0) baseList = baseList.filter(c => c.spesifikasi.wattage >= minWatt);

    const wattCounts = {};
    baseList.forEach(c => {
        const w = c.spesifikasi.wattage;
        let label;
        if (w < 500) label = '450W';
        else if (w < 550) label = '500W';
        else if (w < 600) label = '550W';
        else if (w < 650) label = '600W';
        else if (w < 700) label = '650W';
        else label = '750W+';
        wattCounts[label] = (wattCounts[label] || 0) + 1;
    });

    if (baseList.length === 0) return '';

    const ranges = ['450W', '500W', '550W', '600W', '650W', '750W+'];

    let html = `
        <div class="tier-filter mb-3">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="zap" class="w-3 h-3 text-brand"></i>
                <span class="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Filter Wattage</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="setPsuWattFilter('all')"
                        class="tier-filter-btn ${currentFilter === 'all' ? 'active' : ''}">
                    Semua (${baseList.length})
                </button>
    `;

    ranges.forEach(range => {
        const count = wattCounts[range] || 0;
        if (count === 0) return;
        const isActive = currentFilter === range;
        html += `
            <button onclick="setPsuWattFilter('${range}')"
                    class="tier-filter-btn ${isActive ? 'active' : ''}">
                ${range} (${count})
            </button>
        `;
    });

    html += `</div></div>`;
    return html;
}

// ============================================================
// CASING FILTER
// ============================================================
function renderCasingFilter() {
    const currentFilter = casingFFFilter;
    let baseList = pcComponents.casing.filter(c => c.aktif);

    if (buildState.mainboard) {
        const mbForm = buildState.mainboard.spesifikasi.formFactor;
        baseList = baseList.filter(c => c.spesifikasi.formFactor.includes(mbForm));
    }

    const ffCounts = {};
    baseList.forEach(c => {
        const ff = c.spesifikasi.formFactor;
        if (ff.includes('E-ATX')) ffCounts['E-ATX'] = (ffCounts['E-ATX'] || 0) + 1;
        else if (ff.includes('ATX')) ffCounts['ATX'] = (ffCounts['ATX'] || 0) + 1;
        else if (ff.includes('mATX')) ffCounts['mATX'] = (ffCounts['mATX'] || 0) + 1;
        else if (ff.includes('ITX')) ffCounts['ITX'] = (ffCounts['ITX'] || 0) + 1;
    });

    if (baseList.length === 0) return '';

    const ffTypes = ['ITX', 'mATX', 'ATX', 'E-ATX'];

    let html = `
        <div class="tier-filter mb-3">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="box" class="w-3 h-3 text-brand"></i>
                <span class="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Filter Form Factor</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="setCasingFFFilter('all')"
                        class="tier-filter-btn ${currentFilter === 'all' ? 'active' : ''}">
                    Semua (${baseList.length})
                </button>
    `;

    ffTypes.forEach(ff => {
        const count = ffCounts[ff] || 0;
        if (count === 0) return;
        const isActive = currentFilter === ff;
        html += `
            <button onclick="setCasingFFFilter('${ff}')"
                    class="tier-filter-btn ${isActive ? 'active' : ''}">
                ${ff} (${count})
            </button>
        `;
    });

    html += `</div></div>`;
    return html;
}

// ============================================================
// SET FILTER HANDLERS
// ============================================================
window.setTierFilter = function(catId, tier) {
    tierFilters[catId] = tier;
    visibleCount[catId] = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.setPsuWattFilter = function(watt) {
    psuWattFilter = watt;
    visibleCount.psu = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.setCasingFFFilter = function(ff) {
    casingFFFilter = ff;
    visibleCount.casing = VISIBLE_DEFAULT;
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.setCpuBrand = function(brand) {
    cpuBrandFilter = brand;
    visibleCount.cpu = VISIBLE_DEFAULT;
    tierFilters.cpu = 'all';
    renderSteps();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// RENDER COMPONENT CARD & INFO
// ============================================================
function renderComponentCard(comp, categoryId) {
    return `
        <div class="component-card" onclick="selectComponent('${categoryId}', '${comp.id}')">
            ${renderComponentInfo(comp)}
        </div>
    `;
}

function renderComponentInfo(comp) {
    const specs = comp.spesifikasi || {};
    let specsHtml = '';

    switch (comp.kategori) {
        case 'cpu':
            specsHtml = `
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    ${renderTierBadge(specs.tier)}
                    ${specs.tahun ? `<span class="text-xs text-gray-500">${specs.tahun}</span>` : ''}
                    <span class="text-xs text-gray-500">· ${specs.socket} · ${specs.core}C/${specs.thread}T · ${specs.tdp}W</span>
                </div>
                <div class="text-xs mt-1 ${specs.igpu ? 'text-success' : 'text-gray-400'}">
                    ${specs.igpu ? '✓ Ada iGPU' : '✗ Tanpa iGPU (butuh VGA)'}
                </div>
            `;
            break;
        case 'mainboard':
            specsHtml = `
                <div class="text-xs text-gray-500 mt-1">${specs.socket} · ${specs.chipset} · ${specs.ramType}</div>
                <div class="text-xs text-gray-500">${specs.formFactor} · ${(specs.storageSupport || []).join(', ')}</div>
            `;
            break;
        case 'ram':
            specsHtml = `
                <div class="text-xs text-gray-500 mt-1">${specs.type} · ${specs.capacity}GB · ${specs.speed}</div>
                <div class="text-xs text-gray-500">${specs.kit}</div>
            `;
            break;
        case 'storage':
            specsHtml = `
                <div class="text-xs text-gray-500 mt-1">${specs.type} · ${specs.interface} · ${specs.capacity}GB</div>
                ${specs.speed ? `<div class="text-xs text-gray-500">${specs.speed}</div>` : ''}
            `;
            break;
        case 'vga':
            specsHtml = `
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    ${renderTierBadge(specs.tier)}
                    ${specs.tahun ? `<span class="text-xs text-gray-500">${specs.tahun}</span>` : ''}
                    <span class="text-xs text-gray-500">· ${specs.vram} · ${specs.tdp}W</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">${specs.powerConnector || 'Slot-powered'} · PCIe ${specs.pcieVersion || '?'}</div>
            `;
            break;
        case 'psu':
            const totalWattBuild = calculateTotalWatt();
            const headroom = totalWattBuild > 0 ? Math.round((specs.wattage / totalWattBuild) * 100) : null;
            let recommendBadge = '';
            if (headroom && headroom >= 30 && headroom <= 60) {
                recommendBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style="background: rgba(5, 150, 105, 0.1); color: #059669;">⭐ REKOMENDASI</span>`;
            }
            specsHtml = `
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-xs font-bold text-brand">${specs.wattage}W</span>
                    ${recommendBadge}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">${specs.efficiency} · ${specs.modular}</div>
                ${headroom ? `<div class="text-xs mt-1 ${headroom > 60 ? 'text-amber-600' : 'text-gray-500'}">Headroom: ~${headroom}%</div>` : ''}
            `;
            break;
        case 'casing':
            const vgaLength = buildState.vga?.spesifikasi?.length || null;
            const casingMaxGpu = specs.maxGpuLength || 0;
            let compatBadge = '';
            if (vgaLength && casingMaxGpu) {
                if (vgaLength <= casingMaxGpu) {
                    compatBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style="background: rgba(5, 150, 105, 0.1); color: #059669;">✓ VGA COCOK</span>`;
                } else {
                    compatBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style="background: rgba(220, 38, 38, 0.1); color: #dc2626;">✗ VGA TERLALU PANJANG</span>`;
                }
            }
            specsHtml = `
                ${compatBadge ? `<div class="mt-1">${compatBadge}</div>` : ''}
                <div class="text-xs text-gray-500 mt-1">${(specs.formFactor || []).join(', ')}</div>
                <div class="text-xs text-gray-500">Max VGA ${specs.maxGpuLength}mm${vgaLength ? ` · Anda: ${vgaLength}mm` : ''}</div>
                <div class="text-xs text-gray-500">Max cooler ${specs.maxCoolerHeight}mm</div>
            `;
            break;
    }

    return `
        <div class="font-semibold text-gray-800 text-sm">${comp.nama}</div>
        <div class="text-xs text-gray-400 mt-0.5">${comp.brand}</div>
        ${specsHtml}
        <button type="button" onclick="event.stopPropagation(); searchGoogleImages('${comp.kategori}', '${comp.id}')"
                class="google-search-btn mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-brand/40 text-gray-500 hover:text-brand rounded-lg transition-all text-[11px] font-medium">
            <i data-lucide="search" class="w-3 h-3"></i>
            <span>Cari di Google</span>
        </button>
    `;
}

// ============================================================
// TIER BADGE
// ============================================================
function renderTierBadge(tier) {
    if (!tier) return '';
    const color = TIER_COLORS[tier] || '#6b7280';
    const label = TIER_LABELS[tier] || '';
    return `
        <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
              style="background: ${color};" title="Tier ${tier} — ${label}">
            T${tier}
        </span>
    `;
}

// ============================================================
// GOOGLE SEARCH
// ============================================================
window.searchGoogleImages = function(categoryId, componentId) {
    const comp = pcComponents[categoryId].find(c => c.id === componentId);
    if (!comp) return;
    const context = GOOGLE_CONTEXT[comp.kategori] || '';
    const q = `${comp.brand} ${comp.nama} ${context}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`, '_blank', 'noopener,noreferrer');
};

// ============================================================
// WARNING BOX
// ============================================================
function renderWarningBox(categoryId) {
    if (categoryId === 'mainboard' && buildState.cpu) {
        return `
            <div class="warning-box mb-3">
                <i data-lucide="info" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>Hanya mainboard dengan socket <strong>${buildState.cpu.spesifikasi.socket}</strong></span>
            </div>
        `;
    }
    if (categoryId === 'ram' && buildState.mainboard) {
        return `
            <div class="warning-box mb-3">
                <i data-lucide="info" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>Hanya RAM bertipe <strong>${buildState.mainboard.spesifikasi.ramType}</strong></span>
            </div>
        `;
    }
    if (categoryId === 'vga' && buildState.cpu && !buildState.cpu.spesifikasi.igpu) {
        return `
            <div class="warning-box error mb-3">
                <i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>CPU Anda <strong>tidak memiliki iGPU</strong> — VGA <strong>WAJIB</strong></span>
            </div>
        `;
    }
    if (categoryId === 'psu') {
        const watt = calculateTotalWatt();
        const recommended = Math.ceil((watt + 100) * 1.3 / 50) * 50;
        return `
            <div class="warning-box mb-3">
                <i data-lucide="zap" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <div>
                    <span>Kebutuhan daya build: <strong>~${watt}W</strong></span>
                    <br>
                    <span class="text-xs opacity-75">PSU direkomendasikan: <strong>${recommended}W</strong> ke atas (headroom 30%)</span>
                </div>
            </div>
        `;
    }
    if (categoryId === 'casing' && buildState.mainboard) {
        const mbForm = buildState.mainboard.spesifikasi.formFactor;
        const vgaLength = buildState.vga?.spesifikasi?.length || null;
        let info = `Mainboard: <strong>${mbForm}</strong>`;
        if (vgaLength) info += ` · VGA panjang: <strong>${vgaLength}mm</strong>`;
        return `
            <div class="warning-box mb-3">
                <i data-lucide="info" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>${info}</span>
            </div>
        `;
    }
    return '';
}

// ============================================================
// GET FILTERED COMPONENTS (dengan Use Case Filter)
// ============================================================
function getFilteredComponents(categoryId) {
    let list = pcComponents[categoryId].filter(c => c.aktif);

    // SEARCH FILTER (nama + brand)
    const q = (searchQueries[categoryId] || '').toLowerCase().trim();
    if (q) {
        list = list.filter(c => {
            const nama = (c.nama || '').toLowerCase();
            const brand = (c.brand || '').toLowerCase();
            return nama.includes(q) || brand.includes(q);
        });
    }

    // ============================================
    // USE CASE FILTER (semua kategori)
    // ============================================
    if (cpuUseCase && cpuUseCase !== 'custom') {
        const uc = USE_CASE_FILTERS[cpuUseCase];

        if (categoryId === 'cpu' && uc.cpu) {
            // Filter tier
            if (uc.cpu.tiers && uc.cpu.tiers !== 'all') {
                list = list.filter(c => uc.cpu.tiers.includes(c.spesifikasi?.tier));
            }
            // Filter wajib iGPU (untuk Office)
            if (uc.cpu.requireIgpu) {
                list = list.filter(c => c.spesifikasi?.igpu === true);
            }
        }

        if (categoryId === 'mainboard' && uc.mainboard) {
            if (uc.mainboard.chipsetTiers && uc.mainboard.chipsetTiers !== 'all') {
                list = list.filter(c => uc.mainboard.chipsetTiers.includes(getMainboardTier(c)));
            }
        }

        if (categoryId === 'ram' && uc.ram) {
            if (uc.ram.maxCapacity) list = list.filter(c => (c.spesifikasi?.capacity || 0) <= uc.ram.maxCapacity);
            if (uc.ram.minCapacity) list = list.filter(c => (c.spesifikasi?.capacity || 0) >= uc.ram.minCapacity);
        }

        if (categoryId === 'storage' && uc.storage) {
            if (uc.storage.allowedTypes) {
                list = list.filter(c => {
                    const type = (c.spesifikasi?.type || '').toUpperCase();
                    const iface = (c.spesifikasi?.interface || '').toUpperCase();
                    return uc.storage.allowedTypes.some(t => {
                        if (t === 'NVMe') return iface.includes('NVME') || iface.includes('M.2');
                        return type.includes(t.toUpperCase());
                    });
                });
            }
        }

        if (categoryId === 'vga' && uc.vga) {
            if (uc.vga.skip && !vgaEnabled) return [];
            if (uc.vga.tiers && uc.vga.tiers !== 'all') {
                list = list.filter(c => uc.vga.tiers.includes(c.spesifikasi?.tier));
            }
        }

        if (categoryId === 'psu' && uc.psu) {
            if (uc.psu.maxWatt) list = list.filter(c => (c.spesifikasi?.wattage || 0) <= uc.psu.maxWatt);
            if (uc.psu.minWatt) list = list.filter(c => (c.spesifikasi?.wattage || 0) >= uc.psu.minWatt);
        }

        if (categoryId === 'casing' && uc.casing) {
            if (uc.casing.formFactors) {
                list = list.filter(c => {
                    const ff = c.spesifikasi?.formFactor || [];
                    return ff.some(f => uc.casing.formFactors.includes(f));
                });
            }
        }
    }

    // ============================================
    // KOMPATIBILITAS FILTER (existing)
    // ============================================
    switch (categoryId) {
        case 'cpu':
            if (cpuBrandFilter !== 'all') list = list.filter(c => c.brand === cpuBrandFilter);
            break;
        case 'mainboard':
            if (buildState.cpu) list = list.filter(c => c.spesifikasi.socket === buildState.cpu.spesifikasi.socket);
            break;
        case 'ram':
            if (buildState.mainboard) list = list.filter(c => c.spesifikasi.type === buildState.mainboard.spesifikasi.ramType);
            break;
        case 'storage':
            if (buildState.mainboard) {
                const supported = buildState.mainboard.spesifikasi.storageSupport || [];
                list = list.filter(c => supported.includes(c.spesifikasi.interface));
            }
            break;
        case 'psu':
            const totalWatt = calculateTotalWatt();
            const minWatt = totalWatt > 0 ? Math.ceil((totalWatt + 100) * 1.2) : 0;
            if (minWatt > 0) list = list.filter(c => c.spesifikasi.wattage >= minWatt);
            if (psuWattFilter && psuWattFilter !== 'all') {
                list = list.filter(c => {
                    const w = c.spesifikasi.wattage;
                    if (psuWattFilter === '450W') return w < 500;
                    if (psuWattFilter === '500W') return w >= 500 && w < 550;
                    if (psuWattFilter === '550W') return w >= 550 && w < 600;
                    if (psuWattFilter === '600W') return w >= 600 && w < 650;
                    if (psuWattFilter === '650W') return w >= 650 && w < 700;
                    if (psuWattFilter === '750W+') return w >= 700;
                    return true;
                });
            }
            break;
        case 'casing':
            if (buildState.mainboard) {
                const mbForm = buildState.mainboard.spesifikasi.formFactor;
                list = list.filter(c => c.spesifikasi.formFactor.includes(mbForm));
            }
            if (casingFFFilter && casingFFFilter !== 'all') {
                list = list.filter(c => c.spesifikasi.formFactor.includes(casingFFFilter));
            }
            break;
    }

    // ============================================
    // MANUAL TIER FILTER (CPU & VGA only)
    // ============================================
    const tierFilter = tierFilters[categoryId];
    if (tierFilter && tierFilter !== 'all') {
        list = list.filter(c => c.spesifikasi?.tier === parseInt(tierFilter));
    }

    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

// ============================================================
// STEP UNLOCK
// ============================================================
function isStepUnlocked(categoryId) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat || !cat.dependsOn) return true;
    return buildState[cat.dependsOn] !== null;
}

function getStepHint(categoryId) {
    const hints = {
        cpu: 'Pilih processor — ini menentukan komponen lainnya',
        mainboard: 'Pilih motherboard (otomatis disaring sesuai socket CPU)',
        ram: 'Pilih RAM (otomatis disaring sesuai mainboard)',
        storage: 'Pilih penyimpanan (SSD/HDD)',
        vga: 'Pilih kartu grafis (opsional jika CPU ada iGPU)',
        psu: 'Pilih power supply (otomatis disaring sesuai watt)',
        casing: 'Pilih casing (otomatis disaring sesuai form factor & VGA)'
    };
    return hints[categoryId] || '';
}

function getLockMessage(categoryId) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat || !cat.dependsOn) return 'Terkunci';
    const dep = CATEGORIES.find(c => c.id === cat.dependsOn);
    return `Pilih ${dep?.label || cat.dependsOn} terlebih dahulu`;
}

// ============================================================
// EMPTY STATE
// ============================================================
function renderEmptyState(categoryId, tierFilterActive) {
    const q = searchQueries[categoryId] || '';

    if (q.trim()) {
        return `
            <div class="col-span-full text-center py-8 px-4 mt-3">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
                    <i data-lucide="search-x" class="w-7 h-7 text-gray-400"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-sm mb-2">Tidak Ada Hasil</h4>
                <p class="text-xs text-gray-500 max-w-md mx-auto">
                    Tidak ditemukan komponen dengan kata kunci "<strong>${escapeHtml(q)}</strong>".
                </p>
                <button onclick="clearSearch('${categoryId}')" class="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold">
                    Bersihkan Pencarian
                </button>
            </div>
        `;
    }

    if (tierFilterActive) {
        return `
            <div class="col-span-full text-center py-6 text-gray-400 text-sm mt-3">
                <i data-lucide="filter-x" class="w-6 h-6 mx-auto mb-2 text-gray-300"></i>
                Tidak ada komponen di <strong>Tier ${tierFilters[categoryId]}</strong>.
                <button onclick="setTierFilter('${categoryId}', 'all')" class="text-brand hover:underline ml-1 font-medium">Reset filter</button>
            </div>
        `;
    }

    if (categoryId === 'mainboard' && buildState.cpu) {
        const cpuSocket = buildState.cpu.spesifikasi.socket;
        return `
            <div class="col-span-full text-center py-8 px-4 mt-3">
                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-3">
                    <i data-lucide="alert-triangle" class="w-7 h-7 text-amber-600"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-sm mb-2">Tidak Ada Mainboard yang Cocok</h4>
                <p class="text-xs text-gray-500 max-w-md mx-auto">
                    CPU <strong>${buildState.cpu.nama}</strong> butuh socket
                    <span class="inline-block bg-brand/10 text-brand px-2 py-0.5 rounded font-mono text-[11px] font-bold">${cpuSocket}</span>.
                    Belum ada mainboard socket ini.
                </p>
                <button onclick="clearStep('cpu')" class="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold">
                    Ganti CPU
                </button>
            </div>
        `;
    }

    // Empty karena use case filter
    if (cpuUseCase && cpuUseCase !== 'custom') {
        const uc = USE_CASE_FILTERS[cpuUseCase];
        return `
            <div class="col-span-full text-center py-6 text-gray-400 text-sm mt-3">
                <i data-lucide="inbox" class="w-6 h-6 mx-auto mb-2 text-gray-300"></i>
                Tidak ada komponen yang cocok untuk <strong>${uc.label}</strong>.
            </div>
        `;
    }

    return `
        <div class="col-span-full text-center py-6 text-gray-400 text-sm mt-3">
            <i data-lucide="inbox" class="w-6 h-6 mx-auto mb-2 text-gray-300"></i>
            Tidak ada komponen yang kompatibel
        </div>
    `;
}

// ============================================================
// SELECT / CLEAR
// ============================================================
window.selectComponent = async function(categoryId, componentId) {
    const comp = pcComponents[categoryId].find(c => c.id === componentId);
    if (!comp) return;

    buildState[categoryId] = comp;
    resetDependents(categoryId);
    saveBuildToStorage();

    searchQueries[categoryId] = '';
    searchOpen[categoryId] = false;
    visibleCount[categoryId] = VISIBLE_DEFAULT;

    await fetchDependentCategories(categoryId);

    renderProgress();
    renderSteps();
    renderSummary();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const catIndex = CATEGORIES.findIndex(c => c.id === categoryId);
    if (catIndex < CATEGORIES.length - 1) {
        setTimeout(() => {
            const nextCat = CATEGORIES[catIndex + 1];
            const nextEl = document.getElementById(`step-${nextCat.id}`);
            if (nextEl && !nextEl.classList.contains('locked')) {
                nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 250);
    }
};

async function fetchDependentCategories(catId) {
    const deps = getDependentCategories(catId);
    const toFetch = deps.filter(d => fetchStatus[d] === 'idle' || fetchStatus[d] === 'error');
    if (toFetch.length === 0) return;

    toFetch.forEach(d => { fetchStatus[d] = 'loading'; });
    renderSteps();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    await Promise.all(toFetch.map(d => fetchCategory(d)));
}

function resetDependents(categoryId) {
    const deps = getDependentCategories(categoryId);
    deps.forEach(d => {
        buildState[d] = null;
        visibleCount[d] = VISIBLE_DEFAULT;
        searchQueries[d] = '';
        searchOpen[d] = false;
    });
    if (categoryId === 'cpu') {
        psuWattFilter = 'all';
        casingFFFilter = 'all';
        tierFilters.vga = 'all';
        vgaEnabled = false;
    }
    if (categoryId === 'mainboard') {
        casingFFFilter = 'all';
    }
}

window.clearStep = function(categoryId) {
    buildState[categoryId] = null;
    resetDependents(categoryId);

    searchQueries[categoryId] = '';
    searchOpen[categoryId] = false;
    visibleCount[categoryId] = VISIBLE_DEFAULT;

    if (categoryId === 'cpu') {
        cpuUseCase = null;
        cpuBrandFilter = 'all';
        tierFilters.cpu = 'all';
    }

    saveBuildToStorage();
    renderProgress();
    renderSteps();
    renderSummary();
    renderStickyNav();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// CALCULATE WATT
// ============================================================
function calculateTotalWatt() {
    let total = 0;
    if (buildState.cpu) total += buildState.cpu.spesifikasi.tdp || 0;
    if (buildState.vga) total += buildState.vga.spesifikasi.tdp || 0;
    total += 50;
    return total;
}

// ============================================================
// BOTTLENECK
// ============================================================
function checkBottleneck() {
    if (!buildState.cpu || !buildState.vga) return null;
    const cpu = buildState.cpu.spesifikasi;
    const vga = buildState.vga.spesifikasi;
    if (!cpu.tier || !vga.tier) return null;

    const gapTier = Math.abs(cpu.tier - vga.tier);
    const gapTahun = Math.abs((cpu.tahun || 2020) - (vga.tahun || 2020));

    if (gapTier >= 3 && vga.tier > cpu.tier) {
        const estimasiPerforma = Math.max(20, 100 - gapTier * 15);
        return {
            level: 'danger', icon: 'alert-octagon',
            title: '⚠️ Bottleneck Parah',
            message: `CPU Anda (${cpu.tahun || '?'}, tier ${cpu.tier} · ${TIER_LABELS[cpu.tier] || '?'}) terlalu lemah untuk VGA ini (${vga.tahun || '?'}, tier ${vga.tier}). VGA tidak akan bekerja maksimal — mungkin hanya sekitar <strong>${estimasiPerforma}%</strong> dari kemampuannya.`,
            suggestion: `Pilih VGA maksimal tier ${cpu.tier + 1}, atau upgrade CPU ke tier ${Math.max(1, vga.tier - 1)}+.`
        };
    }

    if (gapTier >= 3 && cpu.tier > vga.tier) {
        return {
            level: 'warning', icon: 'alert-triangle',
            title: '⚠️ CPU Overkill',
            message: `CPU Anda (tier ${cpu.tier}) jauh lebih kuat dari VGA (tier ${vga.tier}). Performa CPU terbuang.`,
            suggestion: `Pilih VGA minimal tier ${cpu.tier - 1}, atau turunkan CPU.`
        };
    }

    if (gapTahun >= 8) {
        return {
            level: 'warning', icon: 'alert-triangle',
            title: '⚠️ Generasi Terlalu Jauh',
            message: `CPU (${cpu.tahun}) dan VGA (${vga.tahun}) berbeda ${gapTahun} tahun.`,
            suggestion: 'Pilih komponen era berdekatan.'
        };
    }

    if (gapTier === 2) {
        return {
            level: 'info', icon: 'info',
            title: 'ℹ️ Kurang Seimbang',
            message: `CPU tier ${cpu.tier} dengan VGA tier ${vga.tier}. Potensi bottleneck ringan.`,
            suggestion: 'Cari CPU & VGA tier berdekatan.'
        };
    }

    return null;
}

// ============================================================
// RENDER SUMMARY
// ============================================================
function renderSummary() {
    const desktopContainer = document.getElementById('summarySidebar');
    const mobileContainer = document.getElementById('summaryBottomSheet');
    const mobileCount = document.getElementById('mobileSummaryCount');

    const totalWatt = calculateTotalWatt();
    const requiredCount = CATEGORIES.filter(c => c.required).length;
    const requiredCompleted = CATEGORIES.filter(c => c.required && buildState[c.id]).length;

    if (mobileCount) mobileCount.textContent = `${requiredCompleted}/${requiredCount}`;

    let html = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-brand">Ringkasan Build</h3>
            <button onclick="resetBuild()" class="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset
            </button>
        </div>
        <div class="space-y-2 mb-4">
    `;

    CATEGORIES.forEach(cat => {
        const val = buildState[cat.id];
        const isVgaSkipped = cat.id === 'vga' && cpuUseCase === 'office' && !vgaEnabled && !val;
        let displayVal;
        if (val) displayVal = val.nama;
        else if (isVgaSkipped) displayVal = '— Dilewati (iGPU cukup)';
        else displayVal = cat.required ? 'Belum dipilih' : 'Opsional';

        html += `
            <div class="flex items-start gap-2 text-xs py-2 border-b border-gray-100 last:border-0">
                <div class="w-5 h-5 rounded flex items-center justify-center bg-brand/5 flex-shrink-0 mt-0.5">
                    <i data-lucide="${cat.icon}" class="w-3 h-3 text-brand"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">${cat.label}</div>
                    <div class="text-gray-800 font-medium text-xs ${val ? '' : 'text-gray-400 italic'} truncate">
                        ${displayVal}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (totalWatt > 0) {
        html += `
            <div class="bg-brand/5 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span class="text-xs text-gray-600">Estimasi Watt</span>
                <span class="font-bold text-brand">~${totalWatt}W</span>
            </div>
        `;
    }

    const bottleneck = checkBottleneck();
    if (bottleneck) {
        const styles = {
            danger: { bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.3)', text: '#991b1b' },
            warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', text: '#92400e' },
            info: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.3)', text: '#1e40af' }
        };
        const style = styles[bottleneck.level] || styles.info;
        html += `
            <div class="rounded-xl p-3 mb-4" style="background: ${style.bg}; border: 1px solid ${style.border}; color: ${style.text}">
                <div class="flex items-start gap-2">
                    <i data-lucide="${bottleneck.icon}" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                    <div class="flex-1 text-xs">
                        <p class="font-bold">${bottleneck.title}</p>
                        <p class="mt-1 leading-relaxed">${bottleneck.message}</p>
                        <p class="mt-1.5 italic opacity-90">💡 ${bottleneck.suggestion}</p>
                    </div>
                </div>
            </div>
        `;
    }

    const buildComplete = requiredCompleted >= requiredCount;

    html += `
        <div class="space-y-2">
            <button onclick="shareToWhatsApp()" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25d366] hover:bg-[#1fb855] text-white rounded-xl text-sm font-semibold"
                    ${!buildComplete ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                Konsultasi via WhatsApp
            </button>
            <button onclick="printBuild()" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
                    ${!buildComplete ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                <i data-lucide="printer" class="w-4 h-4"></i> Print / Save PDF
            </button>
        </div>
    `;

    if (!buildComplete) {
        html += `<div class="warning-box mt-3 text-xs"><i data-lucide="info" class="w-4 h-4 inline mr-1"></i>Lengkapi <strong>${requiredCount - requiredCompleted} komponen</strong> lagi</div>`;
    } else {
        html += `<div class="warning-box success mt-3 text-xs"><i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>Build siap!</div>`;
    }

    if (desktopContainer) desktopContainer.innerHTML = html;
    if (mobileContainer) mobileContainer.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// WHATSAPP SHARE
// ============================================================
window.shareToWhatsApp = function() {
    const requiredCompleted = CATEGORIES.filter(c => c.required && buildState[c.id]).length;
    const requiredCount = CATEGORIES.filter(c => c.required).length;
    if (requiredCompleted < requiredCount) { alert('Lengkapi komponen wajib dulu.'); return; }

    let msg = `*RENCANA RAKIT KOMPUTER - IMDKOM*\n\n`;
    CATEGORIES.forEach(cat => {
        const val = buildState[cat.id];
        if (!val) return;
        msg += `*${cat.label.toUpperCase()}*\n• ${val.nama}\n`;
        const s = val.spesifikasi;
        switch (val.kategori) {
            case 'cpu': msg += `• ${s.socket} · ${s.core}C/${s.thread}T · ${s.tdp}W`; if (s.tier) msg += ` · T${s.tier}`; msg += `\n`; break;
            case 'mainboard': msg += `• ${s.socket} · ${s.chipset} · ${s.ramType} · ${s.formFactor}\n`; break;
            case 'ram': msg += `• ${s.type} · ${s.capacity}GB · ${s.speed}\n`; break;
            case 'storage': msg += `• ${s.type} · ${s.interface} · ${s.capacity}GB\n`; break;
            case 'vga': msg += `• ${s.vram} · ${s.tdp}W`; if (s.tier) msg += ` · T${s.tier}`; msg += `\n`; break;
            case 'psu': msg += `• ${s.wattage}W · ${s.efficiency}\n`; break;
            case 'casing': msg += `• ${(s.formFactor || []).join('/')} · Max VGA ${s.maxGpuLength}mm\n`; break;
        }
        msg += `\n`;
    });
    const totalWatt = calculateTotalWatt();
    msg += `*ESTIMASI TOTAL WATT: ~${totalWatt}W*\n\n`;
    const bottleneck = checkBottleneck();
    if (bottleneck) {
        const clean = bottleneck.message.replace(/<strong>/g, '').replace(/<\/strong>/g, '');
        msg += `*${bottleneck.title}*\n${clean}\n💡 ${bottleneck.suggestion}\n\n`;
    }
    msg += `Mohon konfirmasi. Terima kasih!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

// ============================================================
// PRINT BUILD
// ============================================================
window.printBuild = function() {
    const requiredCompleted = CATEGORIES.filter(c => c.required && buildState[c.id]).length;
    const requiredCount = CATEGORIES.filter(c => c.required).length;
    if (requiredCompleted < requiredCount) { alert('Lengkapi komponen wajib dulu.'); return; }

    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const totalWatt = calculateTotalWatt();

    const tiers = [];
    if (buildState.cpu?.spesifikasi?.tier) tiers.push(buildState.cpu.spesifikasi.tier);
    if (buildState.vga?.spesifikasi?.tier) tiers.push(buildState.vga.spesifikasi.tier);
    const avgTier = tiers.length > 0 ? Math.round(tiers.reduce((a,b) => a+b, 0) / tiers.length) : null;

    let componentRows = '';
    CATEGORIES.forEach((cat, idx) => {
        const val = buildState[cat.id];
        if (!val) return;
        const specs = val.spesifikasi || {};
        let detail = '';
        switch (val.kategori) {
            case 'cpu': detail = `${val.brand} · ${specs.socket} · ${specs.core}C/${specs.thread}T · ${specs.tdp}W`; if (specs.igpu) detail += ' · Ada iGPU'; break;
            case 'mainboard': detail = `${val.brand} · ${specs.socket} · ${specs.chipset} · ${specs.ramType} · ${specs.formFactor}`; break;
            case 'ram': detail = `${val.brand} · ${specs.type} · ${specs.capacity}GB · ${specs.speed}`; break;
            case 'storage': detail = `${val.brand} · ${specs.type} · ${specs.interface} · ${specs.capacity}GB`; break;
            case 'vga': detail = `${val.brand} · ${specs.vram} · ${specs.tdp}W`; break;
            case 'psu': detail = `${val.brand} · ${specs.wattage}W · ${specs.efficiency}`; break;
            case 'casing': detail = `${val.brand} · ${(specs.formFactor || []).join('/')} · Max VGA ${specs.maxGpuLength}mm`; break;
        }
        let tierBadge = '';
        if ((val.kategori === 'cpu' || val.kategori === 'vga') && specs.tier) {
            tierBadge = `<span style="display:inline-block;color:white;font-size:7pt;font-weight:800;padding:2px 6px;border-radius:10px;background:${TIER_COLORS[specs.tier]};">T${specs.tier}</span>`;
        }
        const isLast = idx === CATEGORIES.length - 1;
        componentRows += `
            <div style="padding:6px 0;border-bottom:${isLast ? 'none' : '1px solid #f3f4f6'};">
                <div style="color:#9ca3af;font-size:7pt;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:2px;">${cat.label.toUpperCase()}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <span style="color:#1f2937;font-size:10.5pt;font-weight:600;">${val.nama}</span>
                    ${tierBadge}
                </div>
                <div style="color:#6b7280;font-size:8pt;margin-top:1px;">${detail}</div>
            </div>
        `;
    });

    const bottleneck = checkBottleneck();
    let warningHTML = '';
    if (bottleneck) {
        const wStyles = {
            danger: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', title: 'Bottleneck Parah' },
            warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', title: 'Perhatian' },
            info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', title: 'Catatan' }
        };
        const ws = wStyles[bottleneck.level] || wStyles.info;
        const clean = bottleneck.message.replace(/<strong>/g, '').replace(/<\/strong>/g, '').replace(/<[^>]*>/g, '');
        warningHTML = `
            <div style="margin-bottom:12px;">
                <div style="color:#1a3c5e;font-size:8pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:5px;margin-bottom:6px;border-bottom:1px solid #e5e7eb;">CATATAN PENTING</div>
                <div style="background:${ws.bg};border:1.5px solid ${ws.border};border-radius:6px;padding:10px 12px;color:${ws.text};">
                    <div style="font-size:10pt;font-weight:700;margin-bottom:3px;">⚠️ ${ws.title}</div>
                    <div style="font-size:8.5pt;line-height:1.5;margin-bottom:4px;">${clean}</div>
                    <div style="font-size:8pt;font-style:italic;opacity:0.9;">💡 ${bottleneck.suggestion}</div>
                </div>
            </div>
        `;
    }

    const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Spesifikasi Komputer - IMDKOM</title><style>
        @page { size: A4; margin: 15mm 18mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; color: #1f2937; line-height: 1.5; }
        .header { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 2.5px solid #1a3c5e; margin-bottom: 18px; }
        .header-logo { height: 45px; }
        .header-title { color: #1a3c5e; font-size: 16pt; font-weight: 700; line-height: 1.1; }
        .header-subtitle { color: #6b7280; font-size: 8.5pt; margin-top: 2px; }
        .section-title { color: #1a3c5e; font-size: 9pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 6px; margin-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
        .component-list { margin-bottom: 14px; }
        .summary-bar { background: #1a3c5e; color: white; border-radius: 6px; padding: 10px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; }
        .summary-cell { flex: 1; text-align: center; }
        .summary-label { font-size: 7pt; letter-spacing: 1px; text-transform: uppercase; opacity: 0.75; margin-bottom: 3px; }
        .summary-value { font-size: 14pt; font-weight: 800; }
        .summary-divider { width: 1px; background: rgba(255,255,255,0.25); }
        .consult-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 14px; display: flex; gap: 14px; margin-bottom: 12px; }
        .consult-qr { width: 60px; height: 60px; flex-shrink: 0; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px; }
        .consult-qr img { width: 100%; height: 100%; object-fit: contain; }
        .consult-title { color: #1a3c5e; font-size: 9.5pt; font-weight: 700; margin-bottom: 3px; }
        .consult-desc { color: #6b7280; font-size: 8pt; margin-bottom: 3px; }
        .consult-contact { color: #1a3c5e; font-size: 11pt; font-weight: 700; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #9ca3af; }
        .footer-brand { color: #1a3c5e; font-weight: 700; }
        .print-actions { text-align: center; margin-top: 18px; padding: 12px; background: #f9fafb; border-radius: 8px; }
        .print-actions button { font-family: inherit; font-size: 10pt; font-weight: 600; padding: 10px 24px; border-radius: 6px; cursor: pointer; margin: 0 4px; border: none; }
        .btn-primary { background: #1a3c5e; color: white; }
        .btn-secondary { background: white; color: #1a3c5e; border: 1px solid #d1d5db; }
        @media print { .print-actions { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
        <div class="header">
            <img src="${window.location.origin}/assets/images/logo/imd.svg" class="header-logo" onerror="this.style.display='none'">
            <div>
                <div class="header-title">SPESIFIKASI KOMPUTER</div>
                <div class="header-subtitle">IMDKOM Yogyakarta · Kursus &amp; Pelatihan • Computer Service</div>
            </div>
        </div>
        <div class="section-title">Daftar Komponen</div>
        <div class="component-list">${componentRows}</div>
        <div class="summary-bar">
            <div class="summary-cell"><div class="summary-label">Total</div><div class="summary-value">${requiredCompleted}/7</div></div>
            <div class="summary-divider"></div>
            <div class="summary-cell"><div class="summary-label">Watt</div><div class="summary-value">~${totalWatt}W</div></div>
            <div class="summary-divider"></div>
            <div class="summary-cell"><div class="summary-label">Tier</div><div class="summary-value">${avgTier ? 'T' + avgTier : '—'}</div></div>
        </div>
        ${warningHTML}
        <div class="consult-box">
            <div class="consult-qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=0&data=${encodeURIComponent('https://wa.me/6285601913435?text=Halo%20IMDKOM')}" onerror="this.style.display='none'"></div>
            <div>
                <div class="consult-title">Konsultasi Lanjutan</div>
                <div class="consult-desc">Scan QR code atau hubungi kami untuk konsultasi lebih lanjut.</div>
                <div class="consult-contact">WhatsApp 0856-0191-3435</div>
            </div>
        </div>
        <div class="footer">
            <div>Dibuat: <strong>${timestamp}</strong></div>
            <div class="footer-brand">IMDKOM Yogyakarta · imdkom.com</div>
        </div>
        <div class="print-actions">
            <button class="btn-primary" onclick="window.print()">Simpan sebagai PDF</button>
            <button class="btn-secondary" onclick="window.close()">Tutup</button>
        </div>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.onload = function() { setTimeout(() => printWindow.focus(), 100); };
};

// ============================================================
// RESET BUILD
// ============================================================
window.resetBuild = function() {
    if (!confirm('Yakin ingin mereset semua komponen?')) return;
    resetBuildState();
    cpuUseCase = null;
    renderProgress();
    renderSteps();
    renderSummary();
    renderStickyNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// LOCALSTORAGE BUILD
// ============================================================
function saveBuildToStorage() {
    try {
        const data = {};
        Object.keys(buildState).forEach(key => { data[key] = buildState[key] ? buildState[key].id : null; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
}

function loadBuildFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        window.__savedBuildIds = data;
    } catch (e) {}
}

function tryRestoreFromSaved(catId) {
    if (!window.__savedBuildIds) return;
    const savedId = window.__savedBuildIds[catId];
    if (!savedId) return;
    if (buildState[catId]) return;
    const comp = pcComponents[catId].find(c => c.id === savedId);
    if (comp) buildState[catId] = comp;
}

// ============================================================
// BOTTOM SHEET
// ============================================================
window.openBottomSheet = function() {
    document.getElementById('bottomSheet').classList.add('open');
    document.getElementById('bottomSheetOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeBottomSheet = function() {
    document.getElementById('bottomSheet').classList.remove('open');
    document.getElementById('bottomSheetOverlay').classList.remove('open');
    document.body.style.overflow = '';
};

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mobileSummaryBtn');
    const overlay = document.getElementById('bottomSheetOverlay');
    if (btn) btn.addEventListener('click', openBottomSheet);
    if (overlay) overlay.addEventListener('click', closeBottomSheet);
});
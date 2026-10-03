// ============================================================
// PC BUILDER — Logic Rakit Komputer (FASE 2 + Filter Lengkap)
// ============================================================

import { db, collection, getDocs, query, where } from './firebase.js';

// ============================================================
// KONFIGURASI
// ============================================================
const STORAGE_KEY = 'imdkom_pc_build';
const COMPONENTS_CACHE_KEY = 'imdkom_pc_components';
const COMPONENTS_CACHE_TTL = 60 * 60 * 1000;
const WA_NUMBER = '6285601913435';

const CATEGORIES = [
    { id: 'cpu',       label: 'Processor',     icon: 'cpu',           required: true,  dependsOn: null },
    { id: 'mainboard', label: 'Motherboard',   icon: 'circuit-board', required: true,  dependsOn: 'cpu' },
    { id: 'ram',       label: 'RAM',           icon: 'memory-stick',  required: true,  dependsOn: 'mainboard' },
    { id: 'storage',   label: 'Storage',       icon: 'hard-drive',    required: true,  dependsOn: 'mainboard' },
    { id: 'vga',       label: 'VGA',           icon: 'gpu',           required: false, dependsOn: 'cpu' },
    { id: 'psu',       label: 'Power Supply',  icon: 'plug-zap',      required: true,  dependsOn: null },
    { id: 'casing',    label: 'Casing',        icon: 'box',           required: true,  dependsOn: 'mainboard' }
];

const GOOGLE_CONTEXT = {
    cpu: 'processor',
    mainboard: 'motherboard',
    ram: 'RAM memory',
    storage: 'SSD HDD',
    vga: 'graphics card GPU',
    psu: 'power supply',
    casing: 'PC case'
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
// STATE
// ============================================================
let buildState = {
    cpu: null, mainboard: null, ram: null,
    storage: null, vga: null, psu: null, casing: null
};

let cpuBrandFilter = 'all';
let pcComponents = [];
let isLoading = true;

let tierFilters = {
    cpu: 'all',
    vga: 'all'
};

let psuWattFilter = 'all';
let casingFFFilter = 'all';

// ============================================================
// INIT
// ============================================================
export async function initPcBuilder() {
    showLoadingState();
    
    try {
        await loadComponentsFromFirestore();
        loadBuildFromStorage();
        renderProgress();
        renderSteps();
        renderSummary();
        console.log(`✅ PC Builder initialized dengan ${pcComponents.length} komponen`);
    } catch (error) {
        console.error('❌ Failed to init PC Builder:', error);
        showErrorState(error.message);
    }
}

// ============================================================
// LOAD COMPONENTS FROM FIRESTORE
// ============================================================
async function loadComponentsFromFirestore() {
    const cached = getComponentsFromCache();
    if (cached) {
        pcComponents = cached;
        isLoading = false;
        return;
    }
    
    const q = query(collection(db, 'pc_components'), where('aktif', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        throw new Error('Tidak ada komponen aktif di database.');
    }
    
    pcComponents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    saveComponentsToCache(pcComponents);
    isLoading = false;
}

function getComponentsFromCache() {
    try {
        const raw = localStorage.getItem(COMPONENTS_CACHE_KEY);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp > COMPONENTS_CACHE_TTL) {
            localStorage.removeItem(COMPONENTS_CACHE_KEY);
            return null;
        }
        return data;
    } catch (e) { return null; }
}

function saveComponentsToCache(data) {
    try {
        localStorage.setItem(COMPONENTS_CACHE_KEY, JSON.stringify({
            data, timestamp: Date.now()
        }));
    } catch (e) {}
}

// ============================================================
// LOADING & ERROR STATE
// ============================================================
function showLoadingState() {
    const container = document.getElementById('stepsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="text-center py-20">
            <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent"></div>
            <p class="mt-4 text-sm text-gray-500 font-medium">Memuat komponen...</p>
        </div>
    `;
}

function showErrorState(message) {
    const container = document.getElementById('stepsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="glass rounded-2xl p-8 text-center max-w-lg mx-auto">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Gagal Memuat</h3>
            <p class="text-sm text-gray-500 mb-4">${message}</p>
            <button onclick="location.reload()" class="btn-primary">Coba Lagi</button>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// CHECK BOTTLENECK
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
// RENDER TIER BADGE
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
// RENDER PROGRESS
// ============================================================
function renderProgress() {
    const container = document.getElementById('progressIndicator');
    if (!container) return;
    let html = '';
    CATEGORIES.forEach((cat, i) => {
        const value = buildState[cat.id];
        const isDone = value !== null;
        const isActive = !isDone && isStepUnlocked(cat.id) && !isStepDone(cat.id);
        let cls = 'progress-step';
        if (isDone) cls += ' done';
        else if (isActive) cls += ' active';
        html += `
            <div class="${cls}">
                <span class="progress-icon">
                    ${isDone ? '<i data-lucide="check" class="w-3 h-3"></i>' : (i + 1)}
                </span>
                <span>${cat.label}</span>
            </div>
        `;
    });
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

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
        const components = getFilteredComponents(cat.id);
        const tierFilterActive = tierFilters[cat.id] && tierFilters[cat.id] !== 'all';
        
        let sectionCls = 'step-section';
        if (!unlocked) sectionCls += ' locked';
        else if (!selected) sectionCls += ' active';
        
        html += `
            <div class="${sectionCls}" id="step-${cat.id}">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <i data-lucide="${cat.icon}" class="w-5 h-5 text-brand"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-brand text-lg">
                                ${i + 1}. ${cat.label}
                                ${cat.required ? '<span class="text-red-500 text-sm">*</span>' : '<span class="text-gray-400 text-xs font-normal ml-2">(Opsional)</span>'}
                            </h3>
                            <p class="text-xs text-gray-500">${getStepHint(cat.id)}</p>
                        </div>
                    </div>
                    ${selected ? `
                        <button onclick="clearStep('${cat.id}')" class="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i> Ganti
                        </button>
                    ` : ''}
                </div>
                
                ${!unlocked ? `
                    <div class="text-center py-6 text-gray-400 text-sm">
                        <i data-lucide="lock" class="w-5 h-5 mx-auto mb-2"></i>
                        ${getLockMessage(cat.id)}
                    </div>
                ` : selected ? `
                    <div class="component-card selected">
                        ${renderComponentInfo(selected)}
                    </div>
                ` : `
                    ${cat.id === 'cpu' ? renderCpuTabs() : ''}
                    ${renderTierFilter(cat.id)}
                    ${cat.id === 'psu' ? renderPsuFilter() : ''}
                    ${cat.id === 'casing' ? renderCasingFilter() : ''}
                    ${renderWarningBox(cat.id)}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        ${components.length > 0 
                            ? components.map(c => {
                                if (cat.id === 'casing' && buildState.vga && buildState.vga.spesifikasi?.length) {
                                    const vgaLen = buildState.vga.spesifikasi.length;
                                    const maxGpu = c.spesifikasi.maxGpuLength || 0;
                                    if (vgaLen > maxGpu) {
                                        return `
                                            <div class="component-card disabled" style="opacity: 0.5; cursor: not-allowed; pointer-events: none;">
                                                ${renderComponentInfo(c)}
                                            </div>
                                        `;
                                    }
                                }
                                return renderComponentCard(c, cat.id);
                            }).join('')
                            : renderEmptyState(cat.id, tierFilterActive)
                        }
                    </div>
                `}
            </div>
        `;
    });
    
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// RENDER CPU TABS
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
// RENDER TIER FILTER
// ============================================================
function renderTierFilter(categoryId) {
    const tierEnabledCategories = ['cpu', 'vga'];
    if (!tierEnabledCategories.includes(categoryId)) return '';
    
    const currentFilter = tierFilters[categoryId] || 'all';
    let baseList = pcComponents.filter(c => c.kategori === categoryId && c.aktif);
    
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
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-brand">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
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
    
    if (currentFilter !== 'all') {
        html += `
            <button onclick="setTierFilter('${categoryId}', 'all')" class="tier-filter-btn reset-btn">
                ✕ Reset
            </button>
        `;
    }
    
    html += `</div></div>`;
    return html;
}

// ============================================================
// RENDER PSU FILTER
// ============================================================
function renderPsuFilter() {
    const currentFilter = psuWattFilter;
    const watt = calculateTotalWatt();
    const minWatt = watt > 0 ? Math.ceil((watt + 100) * 1.2) : 0;
    let baseList = pcComponents.filter(c => c.kategori === 'psu' && c.aktif);
    if (minWatt > 0) {
        baseList = baseList.filter(c => c.spesifikasi.wattage >= minWatt);
    }
    
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
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-brand">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
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
    
    if (currentFilter !== 'all') {
        html += `
            <button onclick="setPsuWattFilter('all')" class="tier-filter-btn reset-btn">
                ✕ Reset
            </button>
        `;
    }
    
    html += `</div></div>`;
    return html;
}

// ============================================================
// RENDER CASING FILTER
// ============================================================
function renderCasingFilter() {
    const currentFilter = casingFFFilter;
    let baseList = pcComponents.filter(c => c.kategori === 'casing' && c.aktif);
    
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
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-brand">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
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
    
    if (currentFilter !== 'all') {
        html += `
            <button onclick="setCasingFFFilter('all')" class="tier-filter-btn reset-btn">
                ✕ Reset
            </button>
        `;
    }
    
    html += `</div></div>`;
    return html;
}

// ============================================================
// SET FILTER HANDLERS
// ============================================================
window.setTierFilter = function(categoryId, tier) {
    tierFilters[categoryId] = tier;
    renderSteps();
};

window.setPsuWattFilter = function(watt) {
    psuWattFilter = watt;
    renderSteps();
};

window.setCasingFFFilter = function(ff) {
    casingFFFilter = ff;
    renderSteps();
};

function clearAllTierFilters() {
    Object.keys(tierFilters).forEach(key => { tierFilters[key] = 'all'; });
}

function clearPsuCasingFilters() {
    psuWattFilter = 'all';
    casingFFFilter = 'all';
}

// ============================================================
// RENDER COMPONENT CARD
// ============================================================
function renderComponentCard(comp, categoryId) {
    return `
        <div class="component-card" onclick="selectComponent('${categoryId}', '${comp.id}')">
            ${renderComponentInfo(comp)}
        </div>
    `;
}

// ============================================================
// RENDER COMPONENT INFO
// ============================================================
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
                <div class="text-xs text-gray-500">${specs.formFactor} · ${specs.storageSupport.join(', ')}</div>
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
                <div class="text-xs text-gray-500 mt-1">${specs.formFactor.join(', ')}</div>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
            </svg>
            <span>Cari di Google</span>
        </button>
    `;
}

// ============================================================
// SEARCH GOOGLE
// ============================================================
window.searchGoogleImages = function(categoryId, componentId) {
    const comp = pcComponents.find(c => c.id === componentId);
    if (!comp) return;
    const context = GOOGLE_CONTEXT[comp.kategori] || '';
    const query = `${comp.brand} ${comp.nama} ${context}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`, '_blank', 'noopener,noreferrer');
};

// ============================================================
// RENDER WARNING BOX
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
// GET FILTERED COMPONENTS
// ============================================================
function getFilteredComponents(categoryId) {
    let list = pcComponents.filter(c => c.kategori === categoryId && c.aktif);
    
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
            
            // ⭐ Filter wattage
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
            // ⭐ Filter form factor
            if (casingFFFilter && casingFFFilter !== 'all') {
                list = list.filter(c => c.spesifikasi.formFactor.includes(casingFFFilter));
            }
            break;
    }
    
    const tierFilter = tierFilters[categoryId];
    if (tierFilter && tierFilter !== 'all') {
        list = list.filter(c => c.spesifikasi?.tier === parseInt(tierFilter));
    }
    
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

// ============================================================
// STEP UNLOCK / DONE
// ============================================================
function isStepUnlocked(categoryId) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat || !cat.dependsOn) return true;
    return buildState[cat.dependsOn] !== null;
}

function isStepDone(categoryId) {
    return buildState[categoryId] !== null;
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
    if (tierFilterActive) {
        return `
            <div class="col-span-full text-center py-6 text-gray-400 text-sm">
                <i data-lucide="filter-x" class="w-6 h-6 mx-auto mb-2 text-gray-300"></i>
                Tidak ada komponen di <strong>Tier ${tierFilters[categoryId]}</strong>.
                <button onclick="setTierFilter('${categoryId}', 'all')" class="text-brand hover:underline ml-1 font-medium">Reset filter</button>
            </div>
        `;
    }
    
    if (categoryId === 'mainboard' && buildState.cpu) {
        const cpuSocket = buildState.cpu.spesifikasi.socket;
        return `
            <div class="col-span-full text-center py-8 px-4">
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
    
    return `
        <div class="col-span-full text-center py-6 text-gray-400 text-sm">
            <i data-lucide="inbox" class="w-6 h-6 mx-auto mb-2 text-gray-300"></i>
            Tidak ada komponen yang kompatibel
        </div>
    `;
}

// ============================================================
// SELECT / CLEAR COMPONENT
// ============================================================
window.selectComponent = function(categoryId, componentId) {
    const comp = pcComponents.find(c => c.id === componentId);
    if (!comp) return;
    buildState[categoryId] = comp;
    resetDependents(categoryId);
    saveBuildToStorage();
    renderProgress();
    renderSteps();
    renderSummary();
    
    const catIndex = CATEGORIES.findIndex(c => c.id === categoryId);
    if (catIndex < CATEGORIES.length - 1) {
        setTimeout(() => {
            const nextCat = CATEGORIES[catIndex + 1];
            const nextEl = document.getElementById(`step-${nextCat.id}`);
            if (nextEl && !nextEl.classList.contains('locked')) {
                nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function resetDependents(categoryId) {
    if (categoryId === 'cpu') {
        buildState.mainboard = null;
        buildState.ram = null;
        buildState.storage = null;
        buildState.casing = null;
    }
    if (categoryId === 'mainboard') {
        buildState.ram = null;
        buildState.storage = null;
        buildState.casing = null;
    }
}

window.clearStep = function(categoryId) {
    buildState[categoryId] = null;
    resetDependents(categoryId);
    saveBuildToStorage();
    renderProgress();
    renderSteps();
    renderSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.setCpuBrand = function(brand) {
    cpuBrandFilter = brand;
    renderSteps();
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
        html += `
            <div class="flex items-start gap-2 text-xs py-2 border-b border-gray-100 last:border-0">
                <div class="w-5 h-5 rounded flex items-center justify-center bg-brand/5 flex-shrink-0 mt-0.5">
                    <i data-lucide="${cat.icon}" class="w-3 h-3 text-brand"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">${cat.label}</div>
                    <div class="text-gray-800 font-medium text-xs ${val ? '' : 'text-gray-400 italic'} truncate">
                        ${val ? val.nama : (cat.required ? 'Belum dipilih' : 'Opsional')}
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
    
    html += `
        <div class="space-y-2">
            <button onclick="shareToWhatsApp()" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25d366] hover:bg-[#1fb855] text-white rounded-xl text-sm font-semibold"
                    ${requiredCompleted < requiredCount ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                Konsultasi via WhatsApp
            </button>
            <button onclick="printBuild()" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold">
                <i data-lucide="printer" class="w-4 h-4"></i> Print / Save PDF
            </button>
        </div>
    `;
    
    if (requiredCompleted < requiredCount) {
        html += `<div class="warning-box mt-3 text-xs"><i data-lucide="info" class="w-4 h-4 inline mr-1"></i>Lengkapi <strong>${requiredCount - requiredCompleted} komponen</strong> lagi</div>`;
    } else {
        html += `<div class="warning-box success mt-3 text-xs"><i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>Build siap!</div>`;
    }
    
    if (desktopContainer) desktopContainer.innerHTML = html;
    if (mobileContainer) mobileContainer.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================
// SHARE TO WHATSAPP
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
            case 'casing': msg += `• ${s.formFactor.join('/')} · Max VGA ${s.maxGpuLength}mm\n`; break;
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
    buildState = { cpu: null, mainboard: null, ram: null, storage: null, vga: null, psu: null, casing: null };
    cpuBrandFilter = 'all';
    clearAllTierFilters();
    clearPsuCasingFilters();
    saveBuildToStorage();
    renderProgress();
    renderSteps();
    renderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ============================================================
// LOCALSTORAGE
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
        Object.keys(data).forEach(key => {
            if (data[key]) {
                const comp = pcComponents.find(c => c.id === data[key]);
                if (comp) buildState[key] = comp;
            }
        });
    } catch (e) {}
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
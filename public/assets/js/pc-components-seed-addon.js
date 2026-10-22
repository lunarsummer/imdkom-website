// ============================================================
// PC COMPONENTS SEED — ADDON (Generasi Lama)
// Tambahan komponen: Intel Gen 3-11, AMD Ryzen 2000-3000,
// Mainboard LGA1150, LGA1151, LGA1151v2, LGA1200
// ============================================================

export const pcComponentsAddon = [
    // ==========================================================
    // CPU INTEL — GEN 3 (Ivy Bridge, 2012) — LGA1155
    // ==========================================================
    {
        id: 'cpu-i3-3220',
        kategori: 'cpu',
        nama: 'Intel Core i3-3220',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1155',
            generasi: '3rd Gen (Ivy Bridge)',
            core: 2,
            thread: 4,
            baseClock: '3.3 GHz',
            boostClock: '-',
            tdp: 55,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 100
    },
    {
        id: 'cpu-i5-3470',
        kategori: 'cpu',
        nama: 'Intel Core i5-3470',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1155',
            generasi: '3rd Gen (Ivy Bridge)',
            core: 4,
            thread: 4,
            baseClock: '3.2 GHz',
            boostClock: '3.6 GHz',
            tdp: 77,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 101
    },
    {
        id: 'cpu-i7-3770',
        kategori: 'cpu',
        nama: 'Intel Core i7-3770',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1155',
            generasi: '3rd Gen (Ivy Bridge)',
            core: 4,
            thread: 8,
            baseClock: '3.4 GHz',
            boostClock: '3.9 GHz',
            tdp: 77,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 102
    },

    // ==========================================================
    // CPU INTEL — GEN 4 (Haswell, 2013-2014) — LGA1150
    // ==========================================================
    {
        id: 'cpu-i3-4130',
        kategori: 'cpu',
        nama: 'Intel Core i3-4130',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1150',
            generasi: '4th Gen (Haswell)',
            core: 2,
            thread: 4,
            baseClock: '3.4 GHz',
            boostClock: '-',
            tdp: 54,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 103
    },
    {
        id: 'cpu-i5-4570',
        kategori: 'cpu',
        nama: 'Intel Core i5-4570',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1150',
            generasi: '4th Gen (Haswell)',
            core: 4,
            thread: 4,
            baseClock: '3.2 GHz',
            boostClock: '3.6 GHz',
            tdp: 84,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 104
    },
    {
        id: 'cpu-i7-4770',
        kategori: 'cpu',
        nama: 'Intel Core i7-4770',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1150',
            generasi: '4th Gen (Haswell)',
            core: 4,
            thread: 8,
            baseClock: '3.4 GHz',
            boostClock: '3.9 GHz',
            tdp: 84,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 105
    },
    {
        id: 'cpu-i7-4790',
        kategori: 'cpu',
        nama: 'Intel Core i7-4790',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1150',
            generasi: '4th Gen (Haswell Refresh)',
            core: 4,
            thread: 8,
            baseClock: '3.6 GHz',
            boostClock: '4.0 GHz',
            tdp: 84,
            igpu: true,
            ramSupport: ['DDR3']
        },
        aktif: true,
        order: 106
    },

    // ==========================================================
    // CPU INTEL — GEN 6 (Skylake, 2015) — LGA1151
    // ==========================================================
    {
        id: 'cpu-i3-6100',
        kategori: 'cpu',
        nama: 'Intel Core i3-6100',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '6th Gen (Skylake)',
            core: 2,
            thread: 4,
            baseClock: '3.7 GHz',
            boostClock: '-',
            tdp: 51,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 107
    },
    {
        id: 'cpu-i5-6500',
        kategori: 'cpu',
        nama: 'Intel Core i5-6500',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '6th Gen (Skylake)',
            core: 4,
            thread: 4,
            baseClock: '3.2 GHz',
            boostClock: '3.6 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 108
    },
    {
        id: 'cpu-i7-6700',
        kategori: 'cpu',
        nama: 'Intel Core i7-6700',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '6th Gen (Skylake)',
            core: 4,
            thread: 8,
            baseClock: '3.4 GHz',
            boostClock: '4.0 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 109
    },

    // ==========================================================
    // CPU INTEL — GEN 7 (Kaby Lake, 2017) — LGA1151
    // ==========================================================
    {
        id: 'cpu-i3-7100',
        kategori: 'cpu',
        nama: 'Intel Core i3-7100',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '7th Gen (Kaby Lake)',
            core: 2,
            thread: 4,
            baseClock: '3.9 GHz',
            boostClock: '-',
            tdp: 51,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 110
    },
    {
        id: 'cpu-i5-7400',
        kategori: 'cpu',
        nama: 'Intel Core i5-7400',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '7th Gen (Kaby Lake)',
            core: 4,
            thread: 4,
            baseClock: '3.0 GHz',
            boostClock: '3.5 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 111
    },
    {
        id: 'cpu-i7-7700',
        kategori: 'cpu',
        nama: 'Intel Core i7-7700',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151',
            generasi: '7th Gen (Kaby Lake)',
            core: 4,
            thread: 8,
            baseClock: '3.6 GHz',
            boostClock: '4.2 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR3L', 'DDR4']
        },
        aktif: true,
        order: 112
    },

    // ==========================================================
    // CPU INTEL — GEN 8 (Coffee Lake, 2017) — LGA1151 v2
    // ==========================================================
    {
        id: 'cpu-i3-8100',
        kategori: 'cpu',
        nama: 'Intel Core i3-8100',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '8th Gen (Coffee Lake)',
            core: 4,
            thread: 4,
            baseClock: '3.6 GHz',
            boostClock: '-',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 113
    },
    {
        id: 'cpu-i5-8400',
        kategori: 'cpu',
        nama: 'Intel Core i5-8400',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '8th Gen (Coffee Lake)',
            core: 6,
            thread: 6,
            baseClock: '2.8 GHz',
            boostClock: '4.0 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 114
    },
    {
        id: 'cpu-i7-8700',
        kategori: 'cpu',
        nama: 'Intel Core i7-8700',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '8th Gen (Coffee Lake)',
            core: 6,
            thread: 12,
            baseClock: '3.2 GHz',
            boostClock: '4.6 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 115
    },

    // ==========================================================
    // CPU INTEL — GEN 9 (Coffee Lake Refresh, 2018-2019) — LGA1151 v2
    // ==========================================================
    {
        id: 'cpu-i3-9100f',
        kategori: 'cpu',
        nama: 'Intel Core i3-9100F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '9th Gen (Coffee Lake Refresh)',
            core: 4,
            thread: 4,
            baseClock: '3.6 GHz',
            boostClock: '4.2 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 116
    },
    {
        id: 'cpu-i5-9400f',
        kategori: 'cpu',
        nama: 'Intel Core i5-9400F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '9th Gen (Coffee Lake Refresh)',
            core: 6,
            thread: 6,
            baseClock: '2.9 GHz',
            boostClock: '4.1 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 117
    },
    {
        id: 'cpu-i7-9700',
        kategori: 'cpu',
        nama: 'Intel Core i7-9700',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1151v2',
            generasi: '9th Gen (Coffee Lake Refresh)',
            core: 8,
            thread: 8,
            baseClock: '3.0 GHz',
            boostClock: '4.7 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 118
    },

    // ==========================================================
    // CPU INTEL — GEN 10 (Comet Lake, 2020) — LGA1200
    // ==========================================================
    {
        id: 'cpu-i3-10100f',
        kategori: 'cpu',
        nama: 'Intel Core i3-10100F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '10th Gen (Comet Lake)',
            core: 4,
            thread: 8,
            baseClock: '3.6 GHz',
            boostClock: '4.3 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 119
    },
    {
        id: 'cpu-i5-10400f',
        kategori: 'cpu',
        nama: 'Intel Core i5-10400F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '10th Gen (Comet Lake)',
            core: 6,
            thread: 12,
            baseClock: '2.9 GHz',
            boostClock: '4.3 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 120
    },
    {
        id: 'cpu-i7-10700',
        kategori: 'cpu',
        nama: 'Intel Core i7-10700',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '10th Gen (Comet Lake)',
            core: 8,
            thread: 16,
            baseClock: '2.9 GHz',
            boostClock: '4.8 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 121
    },
    {
        id: 'cpu-i9-10900f',
        kategori: 'cpu',
        nama: 'Intel Core i9-10900F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '10th Gen (Comet Lake)',
            core: 10,
            thread: 20,
            baseClock: '2.8 GHz',
            boostClock: '5.2 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 122
    },

    // ==========================================================
    // CPU INTEL — GEN 11 (Rocket Lake, 2021) — LGA1200
    // ==========================================================
    {
        id: 'cpu-i5-11400f',
        kategori: 'cpu',
        nama: 'Intel Core i5-11400F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '11th Gen (Rocket Lake)',
            core: 6,
            thread: 12,
            baseClock: '2.6 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 123
    },
    {
        id: 'cpu-i7-11700f',
        kategori: 'cpu',
        nama: 'Intel Core i7-11700F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '11th Gen (Rocket Lake)',
            core: 8,
            thread: 16,
            baseClock: '2.5 GHz',
            boostClock: '4.9 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 124
    },
    {
        id: 'cpu-i9-11900f',
        kategori: 'cpu',
        nama: 'Intel Core i9-11900F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1200',
            generasi: '11th Gen (Rocket Lake)',
            core: 8,
            thread: 16,
            baseClock: '2.5 GHz',
            boostClock: '5.2 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 125
    },

    // ==========================================================
    // CPU AMD — RYZEN 2000 (Pinnacle Ridge, 2018) — AM4
    // ==========================================================
    {
        id: 'cpu-ryzen3-2200g',
        kategori: 'cpu',
        nama: 'AMD Ryzen 3 2200G',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 2000 (Pinnacle Ridge)',
            core: 4,
            thread: 4,
            baseClock: '3.5 GHz',
            boostClock: '3.7 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 126
    },
    {
        id: 'cpu-ryzen5-2600',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 2600',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 2000 (Pinnacle Ridge)',
            core: 6,
            thread: 12,
            baseClock: '3.4 GHz',
            boostClock: '3.9 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 127
    },
    {
        id: 'cpu-ryzen5-2600x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 2600X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 2000 (Pinnacle Ridge)',
            core: 6,
            thread: 12,
            baseClock: '3.6 GHz',
            boostClock: '4.2 GHz',
            tdp: 95,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 128
    },
    {
        id: 'cpu-ryzen7-2700',
        kategori: 'cpu',
        nama: 'AMD Ryzen 7 2700',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 2000 (Pinnacle Ridge)',
            core: 8,
            thread: 16,
            baseClock: '3.2 GHz',
            boostClock: '4.1 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 129
    },

    // ==========================================================
    // CPU AMD — RYZEN 3000 (Matisse, 2019) — AM4
    // ==========================================================
    {
        id: 'cpu-ryzen3-3200g',
        kategori: 'cpu',
        nama: 'AMD Ryzen 3 3200G',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 3000 (Picasso)',
            core: 4,
            thread: 4,
            baseClock: '3.6 GHz',
            boostClock: '4.0 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 130
    },
    {
        id: 'cpu-ryzen5-3600',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 3600',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 3000 (Matisse)',
            core: 6,
            thread: 12,
            baseClock: '3.6 GHz',
            boostClock: '4.2 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 131
    },
    {
        id: 'cpu-ryzen5-3600x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 3600X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 3000 (Matisse)',
            core: 6,
            thread: 12,
            baseClock: '3.8 GHz',
            boostClock: '4.4 GHz',
            tdp: 95,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 132
    },
    {
        id: 'cpu-ryzen7-3700x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 7 3700X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 3000 (Matisse)',
            core: 8,
            thread: 16,
            baseClock: '3.6 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 133
    },
    {
        id: 'cpu-ryzen9-3900x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 9 3900X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 3000 (Matisse)',
            core: 12,
            thread: 24,
            baseClock: '3.8 GHz',
            boostClock: '4.6 GHz',
            tdp: 105,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 134
    },

    // ==========================================================
    // MAINBOARD — LGA1150 (Intel Gen 4)
    // ==========================================================
    {
        id: 'mb-h81m',
        kategori: 'mainboard',
        nama: 'ASUS H81M-K',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1150',
            chipset: 'H81',
            ramType: 'DDR3',
            ramSlot: 2,
            maxRam: 16,
            formFactor: 'mATX',
            storageSupport: ['SATA'],
            pcieVersion: '2.0'
        },
        aktif: true,
        order: 100
    },
    {
        id: 'mb-b85m',
        kategori: 'mainboard',
        nama: 'Gigabyte B85M-D3H',
        brand: 'Gigabyte',
        spesifikasi: {
            socket: 'LGA1150',
            chipset: 'B85',
            ramType: 'DDR3',
            ramSlot: 4,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 101
    },
    {
        id: 'mb-h97m',
        kategori: 'mainboard',
        nama: 'ASUS H97M-E',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1150',
            chipset: 'H97',
            ramType: 'DDR3',
            ramSlot: 4,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 SATA'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 102
    },
    {
        id: 'mb-z97',
        kategori: 'mainboard',
        nama: 'ASUS Z97-A',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1150',
            chipset: 'Z97',
            ramType: 'DDR3',
            ramSlot: 4,
            maxRam: 32,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 SATA'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 103
    },

    // ==========================================================
    // MAINBOARD — LGA1151 (Intel Gen 6-7)
    // ==========================================================
    {
        id: 'mb-h110m',
        kategori: 'mainboard',
        nama: 'ASUS H110M-K',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1151',
            chipset: 'H110',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 104
    },
    {
        id: 'mb-b250m',
        kategori: 'mainboard',
        nama: 'MSI B250M Pro-VD',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1151',
            chipset: 'B250',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 105
    },
    {
        id: 'mb-z270',
        kategori: 'mainboard',
        nama: 'ASUS ROG STRIX Z270E Gaming',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1151',
            chipset: 'Z270',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 64,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 106
    },

    // ==========================================================
    // MAINBOARD — LGA1151 v2 (Intel Gen 8-9)
    // ==========================================================
    {
        id: 'mb-h310m',
        kategori: 'mainboard',
        nama: 'ASUS PRIME H310M-K',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1151v2',
            chipset: 'H310',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 107
    },
    {
        id: 'mb-b360m',
        kategori: 'mainboard',
        nama: 'MSI B360M Mortar',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1151v2',
            chipset: 'B360',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 64,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 108
    },
    {
        id: 'mb-z390',
        kategori: 'mainboard',
        nama: 'ASUS ROG STRIX Z390-E Gaming',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1151v2',
            chipset: 'Z390',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 109
    },

    // ==========================================================
    // MAINBOARD — LGA1200 (Intel Gen 10-11)
    // ==========================================================
    {
        id: 'mb-h410m',
        kategori: 'mainboard',
        nama: 'ASUS PRIME H410M-E',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1200',
            chipset: 'H410',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 64,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 110
    },
    {
        id: 'mb-b460m',
        kategori: 'mainboard',
        nama: 'MSI MAG B460M Mortar',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1200',
            chipset: 'B460',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 111
    },
    {
        id: 'mb-z490',
        kategori: 'mainboard',
        nama: 'ASUS ROG STRIX Z490-E Gaming',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1200',
            chipset: 'Z490',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 112
    },
    {
        id: 'mb-b560m',
        kategori: 'mainboard',
        nama: 'MSI MAG B560M Bazooka',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1200',
            chipset: 'B560',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 113
    },
    {
        id: 'mb-z590',
        kategori: 'mainboard',
        nama: 'ASUS ROG STRIX Z590-E Gaming',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1200',
            chipset: 'Z590',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 114
    },

    // ==========================================================
    // RAM DDR3 — untuk kompatibilitas dengan Gen 3-6
    // ==========================================================
    {
        id: 'ram-ddr3-4gb',
        kategori: 'ram',
        nama: 'Kingston ValueRAM 4GB DDR3',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR3',
            capacity: 4,
            speed: '1600 MHz',
            formFactor: 'DIMM',
            kit: '1x4GB'
        },
        aktif: true,
        order: 100
    },
    {
        id: 'ram-ddr3-8gb',
        kategori: 'ram',
        nama: 'Kingston ValueRAM 8GB DDR3',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR3',
            capacity: 8,
            speed: '1600 MHz',
            formFactor: 'DIMM',
            kit: '1x8GB'
        },
        aktif: true,
        order: 101
    },
    {
        id: 'ram-ddr3-16gb-kit',
        kategori: 'ram',
        nama: 'Corsair Vengeance 16GB (2x8GB) DDR3',
        brand: 'Corsair',
        spesifikasi: {
            type: 'DDR3',
            capacity: 16,
            speed: '1600 MHz',
            formFactor: 'DIMM',
            kit: '2x8GB'
        },
        aktif: true,
        order: 102
    },
    {
        id: 'ram-ddr3l-8gb',
        kategori: 'ram',
        nama: 'Kingston SO-DIMM 8GB DDR3L',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR3L',
            capacity: 8,
            speed: '1600 MHz',
            formFactor: 'DIMM',
            kit: '1x8GB'
        },
        aktif: true,
        order: 103
    }
];
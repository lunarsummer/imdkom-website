// ============================================================
// PC COMPONENTS SEED DATA
// 75 komponen untuk PC Builder
// Struktur sama dengan Firestore collection: pc_components
// ============================================================

export const pcComponents = [
    // ==========================================================
    // CPU — 15 komponen (Intel 8, AMD 7)
    // ==========================================================
    // Intel
    {
        id: 'cpu-i3-12100f',
        kategori: 'cpu',
        nama: 'Intel Core i3-12100F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '12th Gen',
            core: 4,
            thread: 8,
            baseClock: '3.3 GHz',
            boostClock: '4.3 GHz',
            tdp: 58,
            igpu: false,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 1
    },
    {
        id: 'cpu-i3-12100',
        kategori: 'cpu',
        nama: 'Intel Core i3-12100',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '12th Gen',
            core: 4,
            thread: 8,
            baseClock: '3.3 GHz',
            boostClock: '4.3 GHz',
            tdp: 60,
            igpu: true,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 2
    },
    {
        id: 'cpu-i5-12400f',
        kategori: 'cpu',
        nama: 'Intel Core i5-12400F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '12th Gen',
            core: 6,
            thread: 12,
            baseClock: '2.5 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 3
    },
    {
        id: 'cpu-i5-12400',
        kategori: 'cpu',
        nama: 'Intel Core i5-12400',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '12th Gen',
            core: 6,
            thread: 12,
            baseClock: '2.5 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 4
    },
    {
        id: 'cpu-i5-13400f',
        kategori: 'cpu',
        nama: 'Intel Core i5-13400F',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '13th Gen',
            core: 10,
            thread: 16,
            baseClock: '2.5 GHz',
            boostClock: '4.6 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 5
    },
    {
        id: 'cpu-i7-12700k',
        kategori: 'cpu',
        nama: 'Intel Core i7-12700K',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '12th Gen',
            core: 12,
            thread: 20,
            baseClock: '3.6 GHz',
            boostClock: '5.0 GHz',
            tdp: 125,
            igpu: true,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 6
    },
    {
        id: 'cpu-i7-13700k',
        kategori: 'cpu',
        nama: 'Intel Core i7-13700K',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '13th Gen',
            core: 16,
            thread: 24,
            baseClock: '3.4 GHz',
            boostClock: '5.4 GHz',
            tdp: 125,
            igpu: true,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 7
    },
    {
        id: 'cpu-i9-13900k',
        kategori: 'cpu',
        nama: 'Intel Core i9-13900K',
        brand: 'Intel',
        spesifikasi: {
            socket: 'LGA1700',
            generasi: '13th Gen',
            core: 24,
            thread: 32,
            baseClock: '3.0 GHz',
            boostClock: '5.8 GHz',
            tdp: 125,
            igpu: true,
            ramSupport: ['DDR4', 'DDR5']
        },
        aktif: true,
        order: 8
    },
    // AMD
    {
        id: 'cpu-ryzen3-4100',
        kategori: 'cpu',
        nama: 'AMD Ryzen 3 4100',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 4000',
            core: 4,
            thread: 8,
            baseClock: '3.8 GHz',
            boostClock: '4.0 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 9
    },
    {
        id: 'cpu-ryzen5-5600',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 5600',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 5000',
            core: 6,
            thread: 12,
            baseClock: '3.5 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 10
    },
    {
        id: 'cpu-ryzen5-5600g',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 5600G',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 5000',
            core: 6,
            thread: 12,
            baseClock: '3.9 GHz',
            boostClock: '4.4 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 11
    },
    {
        id: 'cpu-ryzen5-7600',
        kategori: 'cpu',
        nama: 'AMD Ryzen 5 7600',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM5',
            generasi: 'Ryzen 7000',
            core: 6,
            thread: 12,
            baseClock: '3.8 GHz',
            boostClock: '5.1 GHz',
            tdp: 65,
            igpu: true,
            ramSupport: ['DDR5']
        },
        aktif: true,
        order: 12
    },
    {
        id: 'cpu-ryzen7-5700x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 7 5700X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM4',
            generasi: 'Ryzen 5000',
            core: 8,
            thread: 16,
            baseClock: '3.4 GHz',
            boostClock: '4.6 GHz',
            tdp: 65,
            igpu: false,
            ramSupport: ['DDR4']
        },
        aktif: true,
        order: 13
    },
    {
        id: 'cpu-ryzen7-7700x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 7 7700X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM5',
            generasi: 'Ryzen 7000',
            core: 8,
            thread: 16,
            baseClock: '4.5 GHz',
            boostClock: '5.4 GHz',
            tdp: 105,
            igpu: true,
            ramSupport: ['DDR5']
        },
        aktif: true,
        order: 14
    },
    {
        id: 'cpu-ryzen9-7950x',
        kategori: 'cpu',
        nama: 'AMD Ryzen 9 7950X',
        brand: 'AMD',
        spesifikasi: {
            socket: 'AM5',
            generasi: 'Ryzen 7000',
            core: 16,
            thread: 32,
            baseClock: '4.5 GHz',
            boostClock: '5.7 GHz',
            tdp: 170,
            igpu: true,
            ramSupport: ['DDR5']
        },
        aktif: true,
        order: 15
    },

    // ==========================================================
    // MAINBOARD — 12 komponen
    // ==========================================================
    // LGA1700 - DDR4
    {
        id: 'mb-h610m-ddr4',
        kategori: 'mainboard',
        nama: 'ASUS PRIME H610M-K D4',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'H610',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 64,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'mb-b660m-ddr4',
        kategori: 'mainboard',
        nama: 'MSI PRO B660M-A DDR4',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'B660',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'mb-b760m-ddr4',
        kategori: 'mainboard',
        nama: 'Gigabyte B760M DS3H DDR4',
        brand: 'Gigabyte',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'B760',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'mb-z690-ddr4',
        kategori: 'mainboard',
        nama: 'ASUS TUF Z690-PLUS D4',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'Z690',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '5.0'
        },
        aktif: true,
        order: 4
    },
    // LGA1700 - DDR5
    {
        id: 'mb-b660m-ddr5',
        kategori: 'mainboard',
        nama: 'MSI MAG B660M Mortar WiFi DDR5',
        brand: 'MSI',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'B660',
            ramType: 'DDR5',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'mb-z790-ddr5',
        kategori: 'mainboard',
        nama: 'ASUS ROG STRIX Z790-A Gaming',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'LGA1700',
            chipset: 'Z790',
            ramType: 'DDR5',
            ramSlot: 4,
            maxRam: 192,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '5.0'
        },
        aktif: true,
        order: 6
    },
    // AM4
    {
        id: 'mb-a320m',
        kategori: 'mainboard',
        nama: 'ASRock A320M-HDV',
        brand: 'ASRock',
        spesifikasi: {
            socket: 'AM4',
            chipset: 'A320',
            ramType: 'DDR4',
            ramSlot: 2,
            maxRam: 32,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 7
    },
    {
        id: 'mb-b450m',
        kategori: 'mainboard',
        nama: 'MSI B450M Mortar Max',
        brand: 'MSI',
        spesifikasi: {
            socket: 'AM4',
            chipset: 'B450',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 8
    },
    {
        id: 'mb-b550m',
        kategori: 'mainboard',
        nama: 'ASUS TUF B550M-PLUS',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'AM4',
            chipset: 'B550',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 9
    },
    {
        id: 'mb-x570',
        kategori: 'mainboard',
        nama: 'ASUS ROG Crosshair X570 Hero',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'AM4',
            chipset: 'X570',
            ramType: 'DDR4',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 10
    },
    // AM5
    {
        id: 'mb-b650m',
        kategori: 'mainboard',
        nama: 'MSI PRO B650M-A WiFi',
        brand: 'MSI',
        spesifikasi: {
            socket: 'AM5',
            chipset: 'B650',
            ramType: 'DDR5',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'mATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 11
    },
    {
        id: 'mb-x670',
        kategori: 'mainboard',
        nama: 'ASUS ROG Crosshair X670E Hero',
        brand: 'ASUS',
        spesifikasi: {
            socket: 'AM5',
            chipset: 'X670E',
            ramType: 'DDR5',
            ramSlot: 4,
            maxRam: 128,
            formFactor: 'ATX',
            storageSupport: ['SATA', 'M.2 NVMe'],
            pcieVersion: '5.0'
        },
        aktif: true,
        order: 12
    },

    // ==========================================================
    // RAM — 10 komponen
    // ==========================================================
    // DDR4
    {
        id: 'ram-ddr4-4gb',
        kategori: 'ram',
        nama: 'Kingston ValueRAM 4GB',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR4',
            capacity: 4,
            speed: '2666 MHz',
            formFactor: 'DIMM',
            kit: '1x4GB'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'ram-ddr4-8gb',
        kategori: 'ram',
        nama: 'Kingston ValueRAM 8GB',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR4',
            capacity: 8,
            speed: '2666 MHz',
            formFactor: 'DIMM',
            kit: '1x8GB'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'ram-ddr4-8gb-3200',
        kategori: 'ram',
        nama: 'Corsair Vengeance LPX 8GB',
        brand: 'Corsair',
        spesifikasi: {
            type: 'DDR4',
            capacity: 8,
            speed: '3200 MHz',
            formFactor: 'DIMM',
            kit: '1x8GB'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'ram-ddr4-16gb-kit',
        kategori: 'ram',
        nama: 'Kingston Fury Beast 16GB (2x8GB)',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR4',
            capacity: 16,
            speed: '3200 MHz',
            formFactor: 'DIMM',
            kit: '2x8GB'
        },
        aktif: true,
        order: 4
    },
    {
        id: 'ram-ddr4-16gb-single',
        kategori: 'ram',
        nama: 'Corsair Vengeance LPX 16GB',
        brand: 'Corsair',
        spesifikasi: {
            type: 'DDR4',
            capacity: 16,
            speed: '3200 MHz',
            formFactor: 'DIMM',
            kit: '1x16GB'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'ram-ddr4-32gb-kit',
        kategori: 'ram',
        nama: 'G.Skill Trident Z RGB 32GB (2x16GB)',
        brand: 'G.Skill',
        spesifikasi: {
            type: 'DDR4',
            capacity: 32,
            speed: '3600 MHz',
            formFactor: 'DIMM',
            kit: '2x16GB'
        },
        aktif: true,
        order: 6
    },
    {
        id: 'ram-ddr4-64gb-kit',
        kategori: 'ram',
        nama: 'Corsair Vengeance LPX 64GB (2x32GB)',
        brand: 'Corsair',
        spesifikasi: {
            type: 'DDR4',
            capacity: 64,
            speed: '3200 MHz',
            formFactor: 'DIMM',
            kit: '2x32GB'
        },
        aktif: true,
        order: 7
    },
    // DDR5
    {
        id: 'ram-ddr5-16gb-kit',
        kategori: 'ram',
        nama: 'Corsair Vengeance DDR5 16GB (2x8GB)',
        brand: 'Corsair',
        spesifikasi: {
            type: 'DDR5',
            capacity: 16,
            speed: '5200 MHz',
            formFactor: 'DIMM',
            kit: '2x8GB'
        },
        aktif: true,
        order: 8
    },
    {
        id: 'ram-ddr5-32gb-kit',
        kategori: 'ram',
        nama: 'Kingston Fury Beast DDR5 32GB (2x16GB)',
        brand: 'Kingston',
        spesifikasi: {
            type: 'DDR5',
            capacity: 32,
            speed: '5600 MHz',
            formFactor: 'DIMM',
            kit: '2x16GB'
        },
        aktif: true,
        order: 9
    },
    {
        id: 'ram-ddr5-64gb-kit',
        kategori: 'ram',
        nama: 'G.Skill Trident Z5 RGB 64GB (2x32GB)',
        brand: 'G.Skill',
        spesifikasi: {
            type: 'DDR5',
            capacity: 64,
            speed: '6000 MHz',
            formFactor: 'DIMM',
            kit: '2x32GB'
        },
        aktif: true,
        order: 10
    },

    // ==========================================================
    // STORAGE — 10 komponen
    // ==========================================================
    {
        id: 'storage-hdd-1tb',
        kategori: 'storage',
        nama: 'Seagate Barracuda 1TB HDD',
        brand: 'Seagate',
        spesifikasi: {
            type: 'HDD',
            interface: 'SATA',
            capacity: 1000,
            speed: '7200 RPM'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'storage-hdd-2tb',
        kategori: 'storage',
        nama: 'Seagate Barracuda 2TB HDD',
        brand: 'Seagate',
        spesifikasi: {
            type: 'HDD',
            interface: 'SATA',
            capacity: 2000,
            speed: '7200 RPM'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'storage-ssd-sata-240',
        kategori: 'storage',
        nama: 'Kingston A400 240GB SSD',
        brand: 'Kingston',
        spesifikasi: {
            type: 'SSD',
            interface: 'SATA',
            capacity: 240,
            speed: '500 MB/s'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'storage-ssd-sata-480',
        kategori: 'storage',
        nama: 'Kingston A400 480GB SSD',
        brand: 'Kingston',
        spesifikasi: {
            type: 'SSD',
            interface: 'SATA',
            capacity: 480,
            speed: '500 MB/s'
        },
        aktif: true,
        order: 4
    },
    {
        id: 'storage-ssd-nvme-256',
        kategori: 'storage',
        nama: 'Samsung 980 250GB NVMe',
        brand: 'Samsung',
        spesifikasi: {
            type: 'SSD',
            interface: 'M.2 NVMe',
            capacity: 250,
            speed: '2900 MB/s'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'storage-ssd-nvme-500',
        kategori: 'storage',
        nama: 'Samsung 970 EVO Plus 500GB',
        brand: 'Samsung',
        spesifikasi: {
            type: 'SSD',
            interface: 'M.2 NVMe',
            capacity: 500,
            speed: '3500 MB/s'
        },
        aktif: true,
        order: 6
    },
    {
        id: 'storage-ssd-nvme-1tb',
        kategori: 'storage',
        nama: 'Samsung 970 EVO Plus 1TB',
        brand: 'Samsung',
        spesifikasi: {
            type: 'SSD',
            interface: 'M.2 NVMe',
            capacity: 1000,
            speed: '3500 MB/s'
        },
        aktif: true,
        order: 7
    },
    {
        id: 'storage-ssd-nvme-1tb-gen4',
        kategori: 'storage',
        nama: 'Samsung 980 PRO 1TB Gen4',
        brand: 'Samsung',
        spesifikasi: {
            type: 'SSD',
            interface: 'M.2 NVMe',
            capacity: 1000,
            speed: '7000 MB/s'
        },
        aktif: true,
        order: 8
    },
    {
        id: 'storage-ssd-nvme-2tb',
        kategori: 'storage',
        nama: 'Samsung 980 PRO 2TB Gen4',
        brand: 'Samsung',
        spesifikasi: {
            type: 'SSD',
            interface: 'M.2 NVMe',
            capacity: 2000,
            speed: '7000 MB/s'
        },
        aktif: true,
        order: 9
    },
    {
        id: 'storage-hybrid-1tb',
        kategori: 'storage',
        nama: 'Seagate FireCuda 1TB SSHD',
        brand: 'Seagate',
        spesifikasi: {
            type: 'SSHD',
            interface: 'SATA',
            capacity: 1000,
            speed: '7200 RPM'
        },
        aktif: true,
        order: 10
    },

    // ==========================================================
    // VGA — 10 komponen
    // ==========================================================
    {
        id: 'vga-gt1030',
        kategori: 'vga',
        nama: 'NVIDIA GT 1030 2GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'GT 1030',
            vram: '2GB GDDR5',
            tdp: 30,
            length: 150,
            powerConnector: 'None',
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'vga-gtx1050ti',
        kategori: 'vga',
        nama: 'NVIDIA GTX 1050 Ti 4GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'GTX 1050 Ti',
            vram: '4GB GDDR5',
            tdp: 75,
            length: 170,
            powerConnector: 'None',
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'vga-gtx1650',
        kategori: 'vga',
        nama: 'NVIDIA GTX 1650 4GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'GTX 1650',
            vram: '4GB GDDR6',
            tdp: 75,
            length: 200,
            powerConnector: 'None',
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'vga-gtx1660s',
        kategori: 'vga',
        nama: 'NVIDIA GTX 1660 Super 6GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'GTX 1660 Super',
            vram: '6GB GDDR6',
            tdp: 125,
            length: 229,
            powerConnector: '1x 8-pin',
            pcieVersion: '3.0'
        },
        aktif: true,
        order: 4
    },
    {
        id: 'vga-rtx3050',
        kategori: 'vga',
        nama: 'NVIDIA RTX 3050 8GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 3050',
            vram: '8GB GDDR6',
            tdp: 130,
            length: 242,
            powerConnector: '1x 8-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'vga-rtx3060',
        kategori: 'vga',
        nama: 'NVIDIA RTX 3060 12GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 3060',
            vram: '12GB GDDR6',
            tdp: 170,
            length: 242,
            powerConnector: '1x 8-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 6
    },
    {
        id: 'vga-rtx3060ti',
        kategori: 'vga',
        nama: 'NVIDIA RTX 3060 Ti 8GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 3060 Ti',
            vram: '8GB GDDR6',
            tdp: 200,
            length: 242,
            powerConnector: '1x 8-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 7
    },
    {
        id: 'vga-rtx4060',
        kategori: 'vga',
        nama: 'NVIDIA RTX 4060 8GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 4060',
            vram: '8GB GDDR6',
            tdp: 115,
            length: 244,
            powerConnector: '1x 8-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 8
    },
    {
        id: 'vga-rtx4070',
        kategori: 'vga',
        nama: 'NVIDIA RTX 4070 12GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 4070',
            vram: '12GB GDDR6X',
            tdp: 200,
            length: 280,
            powerConnector: '1x 16-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 9
    },
    {
        id: 'vga-rtx4080',
        kategori: 'vga',
        nama: 'NVIDIA RTX 4080 16GB',
        brand: 'NVIDIA',
        spesifikasi: {
            chipset: 'RTX 4080',
            vram: '16GB GDDR6X',
            tdp: 320,
            length: 336,
            powerConnector: '1x 16-pin',
            pcieVersion: '4.0'
        },
        aktif: true,
        order: 10
    },

    // ==========================================================
    // PSU — 10 komponen
    // ==========================================================
    {
        id: 'psu-350w',
        kategori: 'psu',
        nama: 'Generic PSU 350W',
        brand: 'Generic',
        spesifikasi: {
            wattage: 350,
            efficiency: '80+',
            modular: 'Non-Modular'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'psu-400w',
        kategori: 'psu',
        nama: 'Corsair CV450 450W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 450,
            efficiency: '80+ Bronze',
            modular: 'Non-Modular'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'psu-500w',
        kategori: 'psu',
        nama: 'Corsair CV550 550W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 550,
            efficiency: '80+ Bronze',
            modular: 'Non-Modular'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'psu-600w',
        kategori: 'psu',
        nama: 'Cooler Master MWE 600W',
        brand: 'Cooler Master',
        spesifikasi: {
            wattage: 600,
            efficiency: '80+ Bronze',
            modular: 'Non-Modular'
        },
        aktif: true,
        order: 4
    },
    {
        id: 'psu-650w',
        kategori: 'psu',
        nama: 'Seasonic Focus GX-650 650W',
        brand: 'Seasonic',
        spesifikasi: {
            wattage: 650,
            efficiency: '80+ Gold',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'psu-750w',
        kategori: 'psu',
        nama: 'Corsair RM750 750W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 750,
            efficiency: '80+ Gold',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 6
    },
    {
        id: 'psu-850w',
        kategori: 'psu',
        nama: 'Corsair RM850x 850W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 850,
            efficiency: '80+ Gold',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 7
    },
    {
        id: 'psu-1000w',
        kategori: 'psu',
        nama: 'Corsair HX1000 1000W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 1000,
            efficiency: '80+ Platinum',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 8
    },
    {
        id: 'psu-1200w',
        kategori: 'psu',
        nama: 'Seasonic Prime TX-1200 1200W',
        brand: 'Seasonic',
        spesifikasi: {
            wattage: 1200,
            efficiency: '80+ Titanium',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 9
    },
    {
        id: 'psu-1600w',
        kategori: 'psu',
        nama: 'Corsair AX1600i 1600W',
        brand: 'Corsair',
        spesifikasi: {
            wattage: 1600,
            efficiency: '80+ Titanium',
            modular: 'Full Modular'
        },
        aktif: true,
        order: 10
    },

    // ==========================================================
    // CASING — 8 komponen
    // ==========================================================
    {
        id: 'casing-itx-mini',
        kategori: 'casing',
        nama: 'Cooler Master Elite 110 (ITX)',
        brand: 'Cooler Master',
        spesifikasi: {
            formFactor: ['ITX'],
            maxGpuLength: 210,
            maxCoolerHeight: 76,
            psuSupport: 'SFX'
        },
        aktif: true,
        order: 1
    },
    {
        id: 'casing-matx-mini',
        kategori: 'casing',
        nama: 'Cooler Master MasterBox Q300L',
        brand: 'Cooler Master',
        spesifikasi: {
            formFactor: ['mATX', 'ITX'],
            maxGpuLength: 360,
            maxCoolerHeight: 159,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 2
    },
    {
        id: 'casing-matx-mid',
        kategori: 'casing',
        nama: 'NZXT H400i (mATX)',
        brand: 'NZXT',
        spesifikasi: {
            formFactor: ['mATX', 'ITX'],
            maxGpuLength: 381,
            maxCoolerHeight: 164,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 3
    },
    {
        id: 'casing-atx-mid',
        kategori: 'casing',
        nama: 'NZXT H510',
        brand: 'NZXT',
        spesifikasi: {
            formFactor: ['ATX', 'mATX', 'ITX'],
            maxGpuLength: 381,
            maxCoolerHeight: 165,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 4
    },
    {
        id: 'casing-atx-airflow',
        kategori: 'casing',
        nama: 'Corsair 4000D Airflow',
        brand: 'Corsair',
        spesifikasi: {
            formFactor: ['ATX', 'mATX', 'ITX'],
            maxGpuLength: 360,
            maxCoolerHeight: 170,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 5
    },
    {
        id: 'casing-atx-rgb',
        kategori: 'casing',
        nama: 'Cooler Master TD500 Mesh ARGB',
        brand: 'Cooler Master',
        spesifikasi: {
            formFactor: ['ATX', 'mATX', 'ITX'],
            maxGpuLength: 410,
            maxCoolerHeight: 165,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 6
    },
    {
        id: 'casing-atx-full',
        kategori: 'casing',
        nama: 'Corsair 7000D Airflow (Full Tower)',
        brand: 'Corsair',
        spesifikasi: {
            formFactor: ['E-ATX', 'ATX', 'mATX', 'ITX'],
            maxGpuLength: 450,
            maxCoolerHeight: 190,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 7
    },
    {
        id: 'casing-premium',
        kategori: 'casing',
        nama: 'Lian Li O11 Dynamic EVO',
        brand: 'Lian Li',
        spesifikasi: {
            formFactor: ['E-ATX', 'ATX', 'mATX', 'ITX'],
            maxGpuLength: 426,
            maxCoolerHeight: 167,
            psuSupport: 'ATX'
        },
        aktif: true,
        order: 8
    }
];

// Helper: Filter by kategori
export function getComponentsByCategory(kategori) {
    return pcComponents.filter(c => c.kategori === kategori && c.aktif);
}
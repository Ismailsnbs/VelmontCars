import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ═══════════════════════════════════════════════════════════
  // 1. VERGİ ORANLARI (Tax Rates)
  // ═══════════════════════════════════════════════════════════
  const taxRates = [
    {
      code: 'CUSTOMS_EU',
      name: 'Gumruk Vergisi (AB)',
      rate: 0,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      description: 'AB ulkelerinden gelen araclar icin gumruk vergisi',
      createdBy: 'system',
    },
    {
      code: 'CUSTOMS_NON_EU',
      name: 'Gumruk Vergisi (AB Disi)',
      rate: 10,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      description: 'AB disi ulkelerden gelen araclar icin gumruk vergisi',
      createdBy: 'system',
    },
    {
      code: 'KDV_PASSENGER',
      name: 'KDV (Binek)',
      rate: 20,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'PASSENGER' as const,
      description: 'Binek araclar icin KDV',
      createdBy: 'system',
    },
    {
      code: 'KDV_COMMERCIAL',
      name: 'KDV (Ticari)',
      rate: 16,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'COMMERCIAL' as const,
      description: 'Ticari araclar icin KDV',
      createdBy: 'system',
    },
    {
      code: 'FIF_0_1000',
      name: 'FIF (0-1000cc)',
      rate: 15,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      minEngineCC: 0,
      maxEngineCC: 1000,
      description: 'Fiyat Istikrar Fonu 0-1000cc',
      createdBy: 'system',
    },
    {
      code: 'FIF_1001_1600',
      name: 'FIF (1001-1600cc)',
      rate: 18,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      minEngineCC: 1001,
      maxEngineCC: 1600,
      description: 'Fiyat Istikrar Fonu 1001-1600cc',
      createdBy: 'system',
    },
    {
      code: 'FIF_1601_2000',
      name: 'FIF (1601-2000cc)',
      rate: 22,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      minEngineCC: 1601,
      maxEngineCC: 2000,
      description: 'Fiyat Istikrar Fonu 1601-2000cc',
      createdBy: 'system',
    },
    {
      code: 'FIF_2001_2500',
      name: 'FIF (2001-2500cc)',
      rate: 25,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      minEngineCC: 2001,
      maxEngineCC: 2500,
      description: 'Fiyat Istikrar Fonu 2001-2500cc',
      createdBy: 'system',
    },
    {
      code: 'FIF_2501_PLUS',
      name: 'FIF (2501+cc)',
      rate: 30,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      minEngineCC: 2501,
      maxEngineCC: 99999,
      description: 'Fiyat Istikrar Fonu 2501cc ve uzeri',
      createdBy: 'system',
    },
    {
      code: 'GKK',
      name: 'Guvenlik Kuvvetleri Katkisi',
      rate: 2.5,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      description: 'GKK - CIF uzerinden',
      createdBy: 'system',
    },
    {
      code: 'WHARF',
      name: 'Rihtim Harci',
      rate: 4.4,
      rateType: 'PERCENTAGE' as const,
      vehicleType: 'ALL' as const,
      description: 'Rihtim harci - CIF uzerinden',
      createdBy: 'system',
    },
    {
      code: 'GENERAL_FIF',
      name: 'Genel FIF',
      rate: 2.03,
      rateType: 'PER_CC' as const,
      vehicleType: 'ALL' as const,
      description: 'Motor hacmi x 2.03 TL (TL/USD donusumlu)',
      createdBy: 'system',
    },
    {
      code: 'BANDROL',
      name: 'Bandrol',
      rate: 33.5,
      rateType: 'FIXED' as const,
      vehicleType: 'ALL' as const,
      description: 'Sabit bandrol ucreti (TL)',
      createdBy: 'system',
    },
  ];

  for (const tax of taxRates) {
    await prisma.taxRate.upsert({
      where: { code: tax.code },
      update: {},
      create: tax,
    });
  }
  console.log(`  ✓ ${taxRates.length} vergi orani eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 2. MENŞE ÜLKELER (Origin Countries)
  // ═══════════════════════════════════════════════════════════
  const countries = [
    { code: 'JP', name: 'Japonya', flag: 'JP', customsDutyRate: 10, isEU: false, minShippingCost: 550, maxShippingCost: 650, avgShippingDays: 45 },
    { code: 'GB', name: 'Ingiltere', flag: 'GB', customsDutyRate: 10, isEU: false, minShippingCost: 400, maxShippingCost: 500, avgShippingDays: 20 },
    { code: 'DE', name: 'Almanya', flag: 'DE', customsDutyRate: 0, isEU: true, minShippingCost: 350, maxShippingCost: 450, avgShippingDays: 15 },
    { code: 'TR', name: 'Turkiye', flag: 'TR', customsDutyRate: 0, isEU: false, minShippingCost: 200, maxShippingCost: 300, avgShippingDays: 3 },
    { code: 'KR', name: 'Guney Kore', flag: 'KR', customsDutyRate: 10, isEU: false, minShippingCost: 600, maxShippingCost: 700, avgShippingDays: 40 },
    { code: 'US', name: 'ABD', flag: 'US', customsDutyRate: 10, isEU: false, minShippingCost: 800, maxShippingCost: 1000, avgShippingDays: 35 },
  ];

  const countryMap: Record<string, string> = {};
  for (const country of countries) {
    const c = await prisma.originCountry.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
    countryMap[country.code] = c.id;
  }
  console.log(`  ✓ ${countries.length} ulke eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 3. DÖVİZ KURLARI (Exchange Rates)
  // ═══════════════════════════════════════════════════════════
  const exchangeRates = [
    { currencyCode: 'USD', currencyName: 'Amerikan Dolari', buyRate: 35.5, sellRate: 35.8, source: 'manual' },
    { currencyCode: 'EUR', currencyName: 'Euro', buyRate: 38.2, sellRate: 38.6, source: 'manual' },
    { currencyCode: 'GBP', currencyName: 'Ingiliz Sterlini', buyRate: 44.5, sellRate: 45.0, source: 'manual' },
    { currencyCode: 'JPY', currencyName: 'Japon Yeni', buyRate: 0.235, sellRate: 0.24, source: 'manual' },
    { currencyCode: 'TRY', currencyName: 'Turk Lirasi', buyRate: 1.0, sellRate: 1.0, source: 'manual' },
  ];

  for (const rate of exchangeRates) {
    const existing = await prisma.exchangeRate.findFirst({
      where: { currencyCode: rate.currencyCode, isActive: true },
    });
    if (!existing) {
      await prisma.exchangeRate.create({ data: rate });
    }
  }
  console.log(`  ✓ ${exchangeRates.length} doviz kuru eklendi`);

  // Exchange Rate Settings
  const existingSettings = await prisma.exchangeRateSettings.findFirst();
  if (!existingSettings) {
    await prisma.exchangeRateSettings.create({
      data: { updateMode: 'manual', updateInterval: 60 },
    });
  }
  console.log('  ✓ Doviz kuru ayarlari eklendi');

  // ═══════════════════════════════════════════════════════════
  // 4. GALERİLER
  // ═══════════════════════════════════════════════════════════
  const gallery1 = await prisma.gallery.upsert({
    where: { slug: 'demo-galeri' },
    update: {},
    create: {
      name: 'Demo Galeri',
      slug: 'demo-galeri',
      address: 'Dereboyu Cad. No:45, Lefkosa',
      city: 'Lefkosa',
      phone: '+90 392 123 4567',
      email: 'info@demogaleri.com',
      subscription: 'PROFESSIONAL',
    },
  });

  const gallery2 = await prisma.gallery.upsert({
    where: { slug: 'premium-motors' },
    update: {},
    create: {
      name: 'Premium Motors',
      slug: 'premium-motors',
      address: 'Salamis Yolu No:120, Gazimagusa',
      city: 'Gazimagusa',
      phone: '+90 392 365 8900',
      email: 'info@premiummotors.com',
      subscription: 'ENTERPRISE',
    },
  });
  console.log('  ✓ 2 galeri eklendi');

  // ═══════════════════════════════════════════════════════════
  // 5. KULLANICILAR (6 ROL — TUM TIPLER)
  // ═══════════════════════════════════════════════════════════
  const hashedPassword = await bcrypt.hash('123456', 12);

  const users = [
    // MASTER ADMIN — platform yoneticisi, galeri bagimsiz
    { email: 'admin@kktcgaleri.com', password: hashedPassword, name: 'Master Admin', role: 'MASTER_ADMIN' as const, galleryId: null as string | null },
    // GALLERY 1 — Demo Galeri kullanicilari
    { email: 'owner@demogaleri.com', password: hashedPassword, name: 'Galeri Sahibi', role: 'GALLERY_OWNER' as const, galleryId: gallery1.id },
    { email: 'manager@demogaleri.com', password: hashedPassword, name: 'Galeri Muduru', role: 'GALLERY_MANAGER' as const, galleryId: gallery1.id },
    { email: 'sales@demogaleri.com', password: hashedPassword, name: 'Satis Danismani', role: 'SALES' as const, galleryId: gallery1.id },
    { email: 'accountant@demogaleri.com', password: hashedPassword, name: 'Muhasebeci', role: 'ACCOUNTANT' as const, galleryId: gallery1.id },
    { email: 'staff@demogaleri.com', password: hashedPassword, name: 'Personel', role: 'STAFF' as const, galleryId: gallery1.id },
    // GALLERY 2 — Premium Motors (cross-tenant test)
    { email: 'owner@premiummotors.com', password: hashedPassword, name: 'PM Galeri Sahibi', role: 'GALLERY_OWNER' as const, galleryId: gallery2.id },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log(`  ✓ ${users.length} kullanici eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 6. ARAÇLAR (VEHICLES) — Her status'ten ornekler
  // ═══════════════════════════════════════════════════════════

  // Demo Galeri araclar
  const vehicles = [
    // TRANSIT araçlar
    {
      brand: 'Toyota', model: 'Corolla', year: 2022, engineCC: 1600,
      vin: 'JTDKN3DU5N5123456', color: 'Beyaz', mileage: 15000,
      fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan', fobPrice: 6000, originCountryId: countryMap['JP'],
      shippingCost: 600, insuranceCost: 100, status: 'TRANSIT' as const,
      estimatedArrival: new Date('2026-04-15'), galleryId: gallery1.id,
      description: 'Japonya ihracat, temiz arac',
    },
    {
      brand: 'Honda', model: 'Civic', year: 2021, engineCC: 1500,
      vin: 'SHHFK7H40MU234567', color: 'Gri', mileage: 28000,
      fuelType: 'PETROL' as const, transmission: 'MANUAL' as const,
      bodyType: 'Sedan', fobPrice: 5500, originCountryId: countryMap['JP'],
      shippingCost: 580, insuranceCost: 90, status: 'TRANSIT' as const,
      estimatedArrival: new Date('2026-04-20'), galleryId: gallery1.id,
      description: 'Honda Civic 1.5 benzin, temiz',
    },
    {
      brand: 'BMW', model: '320i', year: 2020, engineCC: 2000,
      vin: 'WBA5R1C58LA345678', color: 'Siyah', mileage: 42000,
      fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan', fobPrice: 12000, originCountryId: countryMap['DE'],
      shippingCost: 400, insuranceCost: 150, status: 'TRANSIT' as const,
      estimatedArrival: new Date('2026-03-25'), galleryId: gallery1.id,
      description: 'Almanya cikisli BMW, AB gumruksuz',
    },
    // IN_STOCK araçlar
    {
      brand: 'Toyota', model: 'Yaris', year: 2023, engineCC: 1000,
      vin: 'VNKKJ3D35PA456789', color: 'Kirmizi', mileage: 8000,
      fuelType: 'HYBRID' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Hatchback', fobPrice: 5000, originCountryId: countryMap['JP'],
      shippingCost: 550, insuranceCost: 80, cifValue: 5630, customsDuty: 563,
      kdv: 1238.6, fif: 844.5, gkk: 140.75, wharfFee: 247.72,
      totalImportCost: 8800, totalCost: 8800, status: 'IN_STOCK' as const,
      arrivalDate: new Date('2026-02-10'), galleryId: gallery1.id,
      description: 'Hibrit Yaris, ekonomik',
    },
    {
      brand: 'Mercedes', model: 'C200', year: 2021, engineCC: 2000,
      vin: 'W1KWF8DB1MR567890', color: 'Lacivert', mileage: 35000,
      fuelType: 'DIESEL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan', fobPrice: 15000, originCountryId: countryMap['DE'],
      shippingCost: 420, insuranceCost: 180, cifValue: 15600, customsDuty: 0,
      kdv: 4680, fif: 3432, gkk: 390, wharfFee: 686.4,
      totalImportCost: 25200, totalCost: 25200, status: 'IN_STOCK' as const,
      arrivalDate: new Date('2026-01-20'), galleryId: gallery1.id,
      description: 'AB gumruksuz Mercedes, dizel',
    },
    {
      brand: 'Hyundai', model: 'Tucson', year: 2022, engineCC: 1600,
      vin: 'KMHJ3814MNU678901', color: 'Beyaz', mileage: 22000,
      fuelType: 'DIESEL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV', fobPrice: 8000, originCountryId: countryMap['KR'],
      shippingCost: 650, insuranceCost: 120, cifValue: 8770, customsDuty: 877,
      kdv: 2129.4, fif: 1578.6, gkk: 219.25, wharfFee: 385.88,
      totalImportCost: 14200, totalCost: 14200, status: 'IN_STOCK' as const,
      arrivalDate: new Date('2026-02-01'), galleryId: gallery1.id,
      description: 'Kore cikisli SUV, dizel otomatik',
    },
    {
      brand: 'Ford', model: 'Focus', year: 2020, engineCC: 1500,
      vin: 'WF0XXXGCDXLY789012', color: 'Mavi', mileage: 55000,
      fuelType: 'PETROL' as const, transmission: 'MANUAL' as const,
      bodyType: 'Hatchback', fobPrice: 4500, originCountryId: countryMap['GB'],
      shippingCost: 450, insuranceCost: 70, cifValue: 5020, customsDuty: 502,
      kdv: 1204.8, fif: 903.6, gkk: 125.5, wharfFee: 220.88,
      totalImportCost: 8200, totalCost: 8200, status: 'IN_STOCK' as const,
      arrivalDate: new Date('2026-01-15'), galleryId: gallery1.id,
      description: 'Ingiltere cikisli Focus, ekonomik',
    },
    // RESERVED araç
    {
      brand: 'Volkswagen', model: 'Golf', year: 2022, engineCC: 1400,
      vin: 'WVWZZZ1KZMP890123', color: 'Gri', mileage: 18000,
      fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Hatchback', fobPrice: 7000, originCountryId: countryMap['DE'],
      shippingCost: 380, insuranceCost: 100, cifValue: 7480, customsDuty: 0,
      kdv: 2244, fif: 1346.4, gkk: 187, wharfFee: 329.12,
      totalImportCost: 11800, totalCost: 11800, salePrice: 14500,
      status: 'RESERVED' as const, arrivalDate: new Date('2026-01-05'),
      galleryId: gallery1.id, description: 'Rezerve edildi — musteri onay bekleniyor',
    },
    // SOLD araçlar
    {
      brand: 'Nissan', model: 'Qashqai', year: 2021, engineCC: 1600,
      vin: 'SJNFAAJ11U7901234', color: 'Siyah', mileage: 40000,
      fuelType: 'DIESEL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV', fobPrice: 7500, originCountryId: countryMap['GB'],
      shippingCost: 480, insuranceCost: 110, cifValue: 8090, customsDuty: 809,
      kdv: 1963.8, fif: 1456.2, gkk: 202.25, wharfFee: 355.96,
      totalImportCost: 13100, totalCost: 13100, salePrice: 16000,
      profit: 2900, profitMargin: 18.1, status: 'SOLD' as const,
      arrivalDate: new Date('2025-12-01'), soldDate: new Date('2026-01-28'),
      galleryId: gallery1.id, description: 'Satildi',
    },
    {
      brand: 'Toyota', model: 'RAV4', year: 2022, engineCC: 2000,
      vin: 'JTMW43FV5ND012345', color: 'Beyaz', mileage: 12000,
      fuelType: 'HYBRID' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV', fobPrice: 11000, originCountryId: countryMap['JP'],
      shippingCost: 620, insuranceCost: 140, cifValue: 11760, customsDuty: 1176,
      kdv: 3267.2, fif: 2587.2, gkk: 294, wharfFee: 517.44,
      totalImportCost: 19800, totalCost: 19800, salePrice: 24000,
      profit: 4200, profitMargin: 17.5, status: 'SOLD' as const,
      arrivalDate: new Date('2025-11-15'), soldDate: new Date('2026-02-14'),
      galleryId: gallery1.id, description: 'Satildi',
    },
  ];

  // Premium Motors için 2 arac (cross-tenant test)
  const vehiclesGallery2 = [
    {
      brand: 'Audi', model: 'A4', year: 2023, engineCC: 2000,
      vin: 'WAUZZZ8K9PA111222', color: 'Beyaz', mileage: 5000,
      fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan', fobPrice: 18000, originCountryId: countryMap['DE'],
      shippingCost: 400, insuranceCost: 200, status: 'IN_STOCK' as const,
      cifValue: 18600, totalImportCost: 28000, totalCost: 28000,
      arrivalDate: new Date('2026-02-20'), galleryId: gallery2.id,
      description: 'Premium Motors stok araci',
    },
    {
      brand: 'Range Rover', model: 'Evoque', year: 2022, engineCC: 2000,
      vin: 'SALZA2BN8NH333444', color: 'Siyah', mileage: 15000,
      fuelType: 'DIESEL' as const, transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV', fobPrice: 22000, originCountryId: countryMap['GB'],
      shippingCost: 500, insuranceCost: 250, status: 'TRANSIT' as const,
      estimatedArrival: new Date('2026-04-01'), galleryId: gallery2.id,
      description: 'Premium Motors transit araci',
    },
  ];

  const allVehicles = [...vehicles, ...vehiclesGallery2];
  const vehicleRecords: Record<string, string> = {};

  for (const v of allVehicles) {
    const record = await prisma.vehicle.upsert({
      where: { vin: v.vin! },
      update: {},
      create: v,
    });
    vehicleRecords[v.vin!] = record.id;
  }
  console.log(`  ✓ ${allVehicles.length} arac eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 7. ARAÇ GİDERLERİ (Vehicle Expenses)
  // ═══════════════════════════════════════════════════════════
  const yarisId = vehicleRecords['VNKKJ3D35PA456789'];
  const mercId = vehicleRecords['W1KWF8DB1MR567890'];
  const focusId = vehicleRecords['WF0XXXGCDXLY789012'];

  if (yarisId) {
    await prisma.vehicleExpense.createMany({
      data: [
        { vehicleId: yarisId, type: 'REPAIR', amount: 200, description: 'Fren balatasi degisimi', createdBy: 'owner@demogaleri.com' },
        { vehicleId: yarisId, type: 'PAINT', amount: 350, description: 'Tampon boyama', createdBy: 'manager@demogaleri.com' },
      ],
      skipDuplicates: true,
    });
  }
  if (mercId) {
    await prisma.vehicleExpense.createMany({
      data: [
        { vehicleId: mercId, type: 'PARTS', amount: 800, description: 'Yag filtresi + hava filtresi + klima filtresi', createdBy: 'manager@demogaleri.com' },
        { vehicleId: mercId, type: 'REPAIR', amount: 1200, description: 'Triger seti degisimi', createdBy: 'owner@demogaleri.com' },
      ],
      skipDuplicates: true,
    });
  }
  if (focusId) {
    await prisma.vehicleExpense.createMany({
      data: [
        { vehicleId: focusId, type: 'INSURANCE', amount: 150, description: 'Kasko sigortasi', createdBy: 'sales@demogaleri.com' },
      ],
      skipDuplicates: true,
    });
  }
  console.log('  ✓ Arac giderleri eklendi');

  // ═══════════════════════════════════════════════════════════
  // 8. ÜRÜNLER (Products) — Demo Galeri stok
  // ═══════════════════════════════════════════════════════════
  const products = [
    { name: 'Oto Sampuan (5L)', category: 'CLEANING' as const, unit: 'adet', currentStock: 25, minStockLevel: 5, unitPrice: 8.50, barcode: '8690001001', galleryId: gallery1.id },
    { name: 'Cila Spreyi', category: 'SPRAY' as const, unit: 'adet', currentStock: 40, minStockLevel: 10, unitPrice: 4.20, barcode: '8690001002', galleryId: gallery1.id },
    { name: 'Mikrofiber Bez (10lu)', category: 'CLOTH' as const, unit: 'paket', currentStock: 15, minStockLevel: 3, unitPrice: 12.00, barcode: '8690001003', galleryId: gallery1.id },
    { name: 'Lastik Parlatici', category: 'CHEMICAL' as const, unit: 'adet', currentStock: 30, minStockLevel: 8, unitPrice: 6.50, barcode: '8690001004', galleryId: gallery1.id },
    { name: 'Detay Fircasi Seti', category: 'BRUSH' as const, unit: 'set', currentStock: 8, minStockLevel: 2, unitPrice: 15.00, barcode: '8690001005', galleryId: gallery1.id },
    { name: 'Motor Temizleyici', category: 'CHEMICAL' as const, unit: 'adet', currentStock: 2, minStockLevel: 5, unitPrice: 11.00, barcode: '8690001006', galleryId: gallery1.id, description: 'STOK KRITIK — minimum altinda!' },
    { name: 'Cam Suyu (5L)', category: 'CLEANING' as const, unit: 'adet', currentStock: 50, minStockLevel: 10, unitPrice: 3.50, barcode: '8690001007', galleryId: gallery1.id },
    { name: 'Koltuk Temizleme Kopu', category: 'SPRAY' as const, unit: 'adet', currentStock: 18, minStockLevel: 5, unitPrice: 7.80, barcode: '8690001008', galleryId: gallery1.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `seed-product-${p.barcode}` },
      update: {},
      create: p,
    });
  }
  console.log(`  ✓ ${products.length} urun eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 9. MÜŞTERİLER (Customers)
  // ═══════════════════════════════════════════════════════════
  const customers = [
    { name: 'Ahmet Yilmaz', phone: '+90 533 111 2233', email: 'ahmet@email.com', identityNo: 'TC12345678', address: 'Gonyeli, Lefkosa', notes: 'SUV arayor, butcesi $15-20K', galleryId: gallery1.id },
    { name: 'Mehmet Kaya', phone: '+90 542 222 3344', email: 'mehmet.kaya@email.com', identityNo: 'TC23456789', address: 'Girne Merkez', notes: 'Aile araci, sedan tercih', galleryId: gallery1.id },
    { name: 'Ayse Demir', phone: '+90 548 333 4455', email: 'ayse.d@email.com', identityNo: 'TC34567890', address: 'Gazimagusa', notes: 'Hibrit/elektrik tercih, cevreci', galleryId: gallery1.id },
    { name: 'Fatma Celik', phone: '+90 533 444 5566', email: 'fatma.c@email.com', identityNo: 'TC45678901', address: 'Lefkosa Surlariçi', notes: 'Kucuk hatchback arayor, ilk araci', galleryId: gallery1.id },
    { name: 'Ali Ozkan', phone: '+90 542 555 6677', email: 'ali.ozkan@email.com', identityNo: 'TC56789012', address: 'Guzelyurt', notes: 'Ticari arac arayor, nakliye isi', galleryId: gallery1.id },
    { name: 'Hasan Korkmaz', phone: '+90 548 666 7788', email: 'hasan.k@email.com', identityNo: 'TC67890123', address: 'Iskele', notes: 'Premium marka tercih, butce onemli degil', galleryId: gallery1.id },
    // Premium Motors müşterisi (cross-tenant test)
    { name: 'Kemal Sahin', phone: '+90 533 777 8899', email: 'kemal@email.com', identityNo: 'TC78901234', address: 'Gazimagusa', notes: 'Lux SUV arayor', galleryId: gallery2.id },
  ];

  const customerRecords: Record<string, string> = {};
  for (const c of customers) {
    const record = await prisma.customer.create({ data: c });
    customerRecords[c.identityNo!] = record.id;
  }
  console.log(`  ✓ ${customers.length} musteri eklendi`);

  // ═══════════════════════════════════════════════════════════
  // 10. SATIŞLAR (Sales) — satılmış araçlar için
  // ═══════════════════════════════════════════════════════════
  const qashqaiId = vehicleRecords['SJNFAAJ11U7901234'];
  const rav4Id = vehicleRecords['JTMW43FV5ND012345'];

  if (qashqaiId && customerRecords['TC12345678']) {
    await prisma.sale.create({
      data: {
        vehicleId: qashqaiId,
        customerId: customerRecords['TC12345678'],
        galleryId: gallery1.id,
        salePrice: 16000,
        totalCost: 13100,
        profit: 2900,
        profitMargin: 18.1,
        saleDate: new Date('2026-01-28'),
        paymentType: 'Nakit',
        notes: 'Pesin odeme, arac teslim edildi',
        createdBy: 'sales@demogaleri.com',
      },
    });
  }

  if (rav4Id && customerRecords['TC67890123']) {
    await prisma.sale.create({
      data: {
        vehicleId: rav4Id,
        customerId: customerRecords['TC67890123'],
        galleryId: gallery1.id,
        salePrice: 24000,
        totalCost: 19800,
        profit: 4200,
        profitMargin: 17.5,
        saleDate: new Date('2026-02-14'),
        paymentType: 'Havale',
        notes: 'Banka havalesi ile odeme',
        createdBy: 'owner@demogaleri.com',
      },
    });
  }
  console.log('  ✓ 2 satis kaydi eklendi');

  // ═══════════════════════════════════════════════════════════
  // 11. BİLDİRİMLER (Platform Notifications)
  // ═══════════════════════════════════════════════════════════
  await prisma.platformNotification.create({
    data: {
      type: 'TAX_CHANGE',
      title: 'KDV Orani Degisikligi',
      message: 'Binek araclar icin KDV orani %18 den %20 ye guncellendi. 01.01.2026 tarihinden itibaren gecerlidir.',
      priority: 'HIGH',
      targetType: 'ALL',
      targetIds: [],
      sentBy: 'admin@kktcgaleri.com',
    },
  });
  await prisma.platformNotification.create({
    data: {
      type: 'CURRENCY_ALERT',
      title: 'Doviz Kuru Guncelleme',
      message: 'USD/TL kuru 35.80 olarak guncellendi.',
      priority: 'NORMAL',
      targetType: 'ALL',
      targetIds: [],
      sentBy: 'admin@kktcgaleri.com',
    },
  });
  await prisma.platformNotification.create({
    data: {
      type: 'SYSTEM_MAINTENANCE',
      title: 'Sistem Bakimi',
      message: 'Bu hafta sonu 02:00-04:00 arasi planlı bakim yapilacaktir.',
      priority: 'LOW',
      targetType: 'ALL',
      targetIds: [],
      sentBy: 'admin@kktcgaleri.com',
    },
  });
  console.log('  ✓ 3 bildirim eklendi');

  // ═══════════════════════════════════════════════════════════
  // 12. AUDIT LOGS (Örnek kayıtlar)
  // ═══════════════════════════════════════════════════════════
  await prisma.auditLog.createMany({
    data: [
      { action: 'CREATE', entityType: 'TaxRate', entityId: 'seed', performedBy: 'admin@kktcgaleri.com', newValues: { code: 'KDV_PASSENGER', rate: 20 } },
      { action: 'UPDATE', entityType: 'ExchangeRate', entityId: 'seed', performedBy: 'admin@kktcgaleri.com', oldValues: { sellRate: 34.5 }, newValues: { sellRate: 35.8 } },
      { action: 'CREATE', entityType: 'Gallery', entityId: gallery1.id, performedBy: 'admin@kktcgaleri.com', newValues: { name: 'Demo Galeri' } },
      { action: 'CREATE', entityType: 'Gallery', entityId: gallery2.id, performedBy: 'admin@kktcgaleri.com', newValues: { name: 'Premium Motors' } },
    ],
  });
  console.log('  ✓ 4 audit log eklendi');

  // ═══════════════════════════════════════════════════════════
  // ÖZET
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════');
  console.log('✓ SEED TAMAMLANDI!');
  console.log('══════════════════════════════════════════');
  console.log('\n📋 Giris Bilgileri (tum sifreler: 123456)\n');
  console.log('┌─────────────────┬──────────────────────────────┬─────────────────┐');
  console.log('│ Rol              │ Email                        │ Galeri          │');
  console.log('├─────────────────┼──────────────────────────────┼─────────────────┤');
  console.log('│ MASTER_ADMIN    │ admin@kktcgaleri.com         │ —               │');
  console.log('│ GALLERY_OWNER   │ owner@demogaleri.com         │ Demo Galeri     │');
  console.log('│ GALLERY_MANAGER │ manager@demogaleri.com       │ Demo Galeri     │');
  console.log('│ SALES           │ sales@demogaleri.com         │ Demo Galeri     │');
  console.log('│ ACCOUNTANT      │ accountant@demogaleri.com    │ Demo Galeri     │');
  console.log('│ STAFF           │ staff@demogaleri.com         │ Demo Galeri     │');
  console.log('│ GALLERY_OWNER   │ owner@premiummotors.com      │ Premium Motors  │');
  console.log('└─────────────────┴──────────────────────────────┴─────────────────┘');
  console.log('\n📊 Veri Ozeti:');
  console.log('  Galeriler: 2 (Demo Galeri + Premium Motors)');
  console.log('  Araclar: 12 (3 TRANSIT, 4 IN_STOCK, 1 RESERVED, 2 SOLD + 2 Premium)');
  console.log('  Musteriler: 7 (6 Demo + 1 Premium)');
  console.log('  Satislar: 2');
  console.log('  Urunler: 8 (1 kritik stok)');
  console.log('  Bildirimler: 3');
  console.log('  Audit Logs: 4');
}

main()
  .catch((e) => {
    console.error('Seed hatasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

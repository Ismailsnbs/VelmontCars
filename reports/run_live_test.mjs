/**
 * KKTC Galeri - Live Frontend Test
 * Faz 3 - 2026-03-01
 * Playwright ile tum route'lari test eder
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = __dirname;
const SCREENSHOTS_DIR = join(REPORTS_DIR, 'screenshots_faz3');

try { mkdirSync(SCREENSHOTS_DIR, { recursive: true }); } catch(e) {}

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000';

// Test sonuclari
const results = {
  pages: [],
  errors: { critical: [], warning: [], info: [] },
  summary: { pagesOk: 0, pagesError: 0, clicksOk: 0, clicksError: 0, formsOk: 0, formsError: 0 }
};

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function addError(level, route, type, detail, source = '') {
  results.errors[level].push({ route, type, detail, source });
}

async function waitForLoad(page, ms = 2000) {
  await page.waitForTimeout(ms);
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

async function takeScreenshot(page, name) {
  try {
    const safeName = name.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const path = join(SCREENSHOTS_DIR, `${safeName}.png`);
    await page.screenshot({ path, fullPage: false });
    return path;
  } catch(e) {
    return `screenshot_hatasi: ${e.message}`;
  }
}

async function testPage(page, route, description, consoleErrors) {
  log(`TEST: ${route} — ${description}`);
  const result = {
    route,
    description,
    status: 'ok',
    consoleErrors: [],
    networkErrors: [],
    clicks: [],
    forms: [],
    screenshot: '',
    notes: []
  };

  const networkErrors = [];
  const pageConsoleErrors = [];

  // Network response listener
  const responseHandler = (response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push(`${status} ${response.url()}`);
    }
  };
  page.on('response', responseHandler);

  // Console error listener
  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push(msg.text());
    }
  };
  page.on('console', consoleHandler);

  const pageErrorHandler = (err) => {
    pageConsoleErrors.push(`PAGE ERROR: ${err.message}`);
  };
  page.on('pageerror', pageErrorHandler);

  try {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForLoad(page, 2500);
    const loadTime = Date.now() - startTime;
    result.loadTime = loadTime;

    // Sayfa icerigini kontrol et
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) || '');
    const title = await page.title();
    result.title = title;
    result.bodyPreview = bodyText.slice(0, 100);

    // Bos sayfa kontrolu
    if (!bodyText || bodyText.length < 10) {
      result.status = 'warning';
      result.notes.push('Sayfa icerik yok veya cok az');
      addError('warning', route, 'BOSH_SAYFA', 'Sayfa icerigi bos', '');
    }

    // 404 / Error sayfasi kontrolu
    if (bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('not found')) {
      result.status = 'error';
      result.notes.push('404 Not Found icerigi algilandi');
      addError('critical', route, '404_NOT_FOUND', `Sayfa 404 dondu: ${bodyText.slice(0, 100)}`, '');
    }

    // Error boundary kontrolu
    if (bodyText.toLowerCase().includes('something went wrong') || bodyText.toLowerCase().includes('application error')) {
      result.status = 'error';
      result.notes.push('Application Error boundary tetiklendi');
      addError('critical', route, 'APP_ERROR', `Error boundary: ${bodyText.slice(0, 100)}`, '');
    }

    result.screenshot = await takeScreenshot(page, route || 'root');

  } catch(e) {
    result.status = 'error';
    result.notes.push(`Sayfa yuklenemedi: ${e.message}`);
    addError('critical', route, 'SAYFA_YUKLENEMEDI', e.message, '');
  }

  result.consoleErrors = pageConsoleErrors;
  result.networkErrors = networkErrors;

  // Hatalari kaydet
  pageConsoleErrors.forEach(err => {
    if (err.includes('TypeError') || err.includes('ReferenceError') || err.includes('Cannot read') || err.includes('is not a function')) {
      addError('critical', route, 'CONSOLE_ERROR', err, '');
    } else if (err.includes('Warning') || err.includes('deprecated')) {
      addError('info', route, 'CONSOLE_WARNING', err, '');
    } else {
      addError('warning', route, 'CONSOLE_ERROR', err, '');
    }
  });

  networkErrors.forEach(err => {
    if (err.startsWith('5')) {
      addError('critical', route, 'NETWORK_5XX', err, '');
    } else if (err.startsWith('4') && !err.includes('401') && !err.includes('403')) {
      addError('warning', route, 'NETWORK_4XX', err, '');
    }
  });

  page.off('response', responseHandler);
  page.off('console', consoleHandler);
  page.off('pageerror', pageErrorHandler);

  if (result.status === 'ok') results.summary.pagesOk++;
  else results.summary.pagesError++;

  results.pages.push(result);
  return result;
}

async function testClick(page, selector, description, route) {
  try {
    const el = await page.$(selector);
    if (!el) {
      results.summary.clicksError++;
      return { ok: false, msg: `Element bulunamadi: ${selector}` };
    }
    await el.click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    results.summary.clicksOk++;
    return { ok: true, msg: description };
  } catch(e) {
    results.summary.clicksError++;
    addError('warning', route, 'CLICK_HATASI', `${description}: ${e.message}`, '');
    return { ok: false, msg: e.message };
  }
}

async function testButton(page, route, buttonText, waitAfterMs = 1500) {
  try {
    const buttons = await page.$$(`button`);
    for (const btn of buttons) {
      const text = await btn.innerText().catch(() => '');
      if (text.toLowerCase().includes(buttonText.toLowerCase())) {
        await btn.click({ timeout: 5000 });
        await page.waitForTimeout(waitAfterMs);
        results.summary.clicksOk++;
        return { ok: true, msg: `"${buttonText}" butonuna tiklandi` };
      }
    }
    results.summary.clicksError++;
    return { ok: false, msg: `"${buttonText}" butonu bulunamadi` };
  } catch(e) {
    results.summary.clicksError++;
    return { ok: false, msg: e.message };
  }
}

async function closeModal(page) {
  try {
    // Escape ile kapat
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } catch(e) {}
}

async function run() {
  log('=== KKTC Galeri Live Test Basliyor ===');
  log(`Frontend: ${BASE_URL}`);
  log(`Backend: ${API_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // ==========================================
  // 1. LOGIN TESTI
  // ==========================================
  log('\n--- 1. AUTH TESTI ---');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const loginResult = {
    route: '/login',
    description: 'Giris sayfasi',
    status: 'ok',
    consoleErrors: [],
    networkErrors: [],
    clicks: [],
    forms: [],
    screenshot: '',
    notes: []
  };

  const loginNetworkErrors = [];
  const loginConsoleErrors = [];

  page.on('response', r => { if (r.status() >= 400 && r.status() !== 401) loginNetworkErrors.push(`${r.status()} ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error') loginConsoleErrors.push(m.text()); });

  try {
    loginResult.title = await page.title();
    loginResult.screenshot = await takeScreenshot(page, 'login');

    // Form doldurma
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="mail" i]');
    const passwordInput = await page.$('input[type="password"]');

    if (emailInput && passwordInput) {
      await emailInput.fill('admin@kktcgaleri.com');
      await passwordInput.fill('123456');
      loginResult.forms.push({ ok: true, msg: 'Form doldurmasi basarili' });
      results.summary.formsOk++;

      // Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        if (currentUrl.includes('/master') || currentUrl.includes('/dashboard')) {
          loginResult.notes.push(`Login basarili - redirect: ${currentUrl}`);
          log(`LOGIN BASARILI: ${currentUrl}`);
        } else {
          loginResult.notes.push(`Login sonrasi URL: ${currentUrl} (beklenmedik)`);
          log(`LOGIN SONRASI URL: ${currentUrl}`);

          // Hata mesaji var mi?
          const bodyText = await page.evaluate(() => document.body?.innerText || '');
          if (bodyText.toLowerCase().includes('hata') || bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('gecersiz')) {
            loginResult.notes.push('Login hata mesaji algilandi');
            addError('critical', '/login', 'LOGIN_HATASI', bodyText.slice(0, 200), 'apps/web/app/(auth)/login/');
          }
        }
      } else {
        loginResult.notes.push('Submit butonu bulunamadi');
        addError('warning', '/login', 'SUBMIT_BTN_YOK', 'Submit butonu alinamadi', '');
      }
    } else {
      loginResult.notes.push(`Email input: ${!!emailInput}, Password input: ${!!passwordInput}`);
      addError('critical', '/login', 'FORM_ALANLARI_YOK', 'Email veya sifre input bulunamadi', 'apps/web/app/(auth)/login/');
    }
  } catch(e) {
    loginResult.status = 'error';
    loginResult.notes.push(`Login test hatasi: ${e.message}`);
    addError('critical', '/login', 'LOGIN_TEST_HATASI', e.message, '');
  }

  loginResult.consoleErrors = loginConsoleErrors;
  loginResult.networkErrors = loginNetworkErrors;
  results.pages.push(loginResult);

  // Simdi authenticate oldugumuzdan emin olalim
  const currentUrl = page.url();
  log(`Mevcut URL: ${currentUrl}`);

  // ==========================================
  // 2. MASTER PANEL ROUTE'LARI
  // ==========================================
  log('\n--- 2. MASTER PANEL ROUTE TESTLERI ---');

  const masterRoutes = [
    { path: '/master', desc: 'Master Dashboard' },
    { path: '/master/tax-rates', desc: 'Vergi Oranlari Listesi' },
    { path: '/master/countries', desc: 'Ulkeler Listesi' },
    { path: '/master/exchange-rates', desc: 'Doviz Kurlari' },
    { path: '/master/galleries', desc: 'Galeriler Listesi' },
    { path: '/master/notifications', desc: 'Bildirimler Listesi' },
    { path: '/master/audit-logs', desc: 'Audit Log Listesi' },
  ];

  for (const route of masterRoutes) {
    const r = await testPage(page, route.path, route.desc, []);
    log(`  ${r.status === 'ok' ? 'OK' : 'HATA'} ${route.path} (${r.loadTime || 0}ms) - ${r.notes.join(', ') || 'temiz'}`);

    // Her sayfada buton/interaksiyon testleri
    if (r.status !== 'error') {
      // Yeni olustur / Ekle butonu ara
      const addBtnResult = await testButton(page, route.path, 'Yeni', 2000);
      if (addBtnResult.ok) {
        r.clicks.push(addBtnResult);
        log(`    + Dialog acildi: ${addBtnResult.msg}`);
        // Modal kapama
        await closeModal(page);
        await page.waitForTimeout(500);
      }

      // Ekle butonu dene
      const addBtn2 = await testButton(page, route.path, 'Ekle', 1500);
      if (addBtn2.ok) {
        r.clicks.push(addBtn2);
        await closeModal(page);
      }

      // Olustur dene
      const createBtn = await testButton(page, route.path, 'Oluştur', 1500);
      if (createBtn.ok) {
        r.clicks.push(createBtn);
        await closeModal(page);
      }
    }
  }

  // ==========================================
  // DETAYLI TAX RATES TESTI
  // ==========================================
  log('\n--- Tax Rates Detayli Test ---');
  await page.goto(`${BASE_URL}/master/tax-rates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  const taxPageConsoleErrors = [];
  const taxNetworkErrors = [];
  page.on('console', m => { if (m.type() === 'error') taxPageConsoleErrors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) taxNetworkErrors.push(`${r.status()} ${r.url()}`); });

  try {
    // Tablo satirlari var mi?
    const rows = await page.$$('tbody tr, [role="row"]');
    log(`  Tablo satiri sayisi: ${rows.length}`);

    // Duzenle butonu dene
    if (rows.length > 0) {
      const editBtn = await page.$('button[aria-label*="edit" i], button[title*="edit" i], button:has-text("Düzenle")');
      if (editBtn) {
        await editBtn.click({ timeout: 3000 });
        await page.waitForTimeout(1500);
        const editScreen = await takeScreenshot(page, 'tax-rates-edit-dialog');
        log(`  Duzenle dialog acildi`);
        await closeModal(page);
      }
    }

    // Arama testi
    const searchInput = await page.$('input[placeholder*="ara" i], input[placeholder*="search" i], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('KDV');
      await page.waitForTimeout(1500);
      const searchScreenshot = await takeScreenshot(page, 'tax-rates-search');
      results.summary.formsOk++;
      log(`  Arama testi yapildi`);
      await searchInput.clear();
    }
  } catch(e) {
    log(`  Tax rates detayli test hatasi: ${e.message}`);
  }

  // ==========================================
  // DETAYLI GALLERIES TESTI
  // ==========================================
  log('\n--- Galleries Detayli Test ---');
  await page.goto(`${BASE_URL}/master/galleries`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const galRows = await page.$$('tbody tr, [role="row"]');
    log(`  Galeri tablo satiri: ${galRows.length}`);

    if (galRows.length > 1) {
      // Detay linkine tiklama
      const detailLink = await page.$('a[href*="/galleries/"]');
      if (detailLink) {
        const href = await detailLink.getAttribute('href');
        log(`  Detay linki: ${href}`);
        await detailLink.click({ timeout: 3000 });
        await page.waitForTimeout(2000);
        const detailUrl = page.url();
        log(`  Galeri detay URL: ${detailUrl}`);
        const detailScreenshot = await takeScreenshot(page, 'gallery-detail');
        results.summary.clicksOk++;

        // Geri don
        await page.goto(`${BASE_URL}/master/galleries`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1500);
      }
    }
  } catch(e) {
    log(`  Galleries detayli test hatasi: ${e.message}`);
  }

  // ==========================================
  // DETAYLI NOTIFICATIONS TESTI
  // ==========================================
  log('\n--- Notifications Detayli Test ---');
  await page.goto(`${BASE_URL}/master/notifications`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const notifScreenshot = await takeScreenshot(page, 'notifications-list');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '');
    log(`  Bildirim sayfasi icerigi: ${bodyText.slice(0, 100)}`);

    // Bildirim olustur butonu
    const createBtn = await page.$('button:has-text("Bildirim Oluştur"), button:has-text("Yeni Bildirim"), button:has-text("Gönder")');
    if (createBtn) {
      await createBtn.click({ timeout: 3000 });
      await page.waitForTimeout(1500);
      const dialogScreenshot = await takeScreenshot(page, 'notifications-create-dialog');
      log(`  Bildirim olustur dialog acildi`);

      // Form doldurma
      const titleInput = await page.$('input[name="title"], input[placeholder*="baslik" i], input[placeholder*="title" i]');
      const msgInput = await page.$('textarea[name="message"], textarea[placeholder*="mesaj" i]');

      if (titleInput) {
        await titleInput.fill('Test Bildirimi');
        results.summary.formsOk++;
      }
      if (msgInput) {
        await msgInput.fill('Bu bir test mesajdir');
        results.summary.formsOk++;
      }

      await closeModal(page);
    }
  } catch(e) {
    log(`  Notifications detayli test hatasi: ${e.message}`);
  }

  // ==========================================
  // DETAYLI EXCHANGE RATES TESTI
  // ==========================================
  log('\n--- Exchange Rates Detayli Test ---');
  await page.goto(`${BASE_URL}/master/exchange-rates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const exchangeScreenshot = await takeScreenshot(page, 'exchange-rates');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || '');
    log(`  Doviz kurlari icerigi: ${bodyText.slice(0, 100)}`);

    // Tab'lari test et
    const tabs = await page.$$('[role="tab"]');
    log(`  Tab sayisi: ${tabs.length}`);
    for (let i = 0; i < tabs.length && i < 3; i++) {
      try {
        const tabText = await tabs[i].innerText().catch(() => '');
        await tabs[i].click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        results.summary.clicksOk++;
        log(`  Tab tiklandi: "${tabText}"`);
        const tabScreenshot = await takeScreenshot(page, `exchange-rates-tab-${i}`);
      } catch(e) {
        log(`  Tab ${i} hatasi: ${e.message}`);
      }
    }
  } catch(e) {
    log(`  Exchange rates detayli test hatasi: ${e.message}`);
  }

  // ==========================================
  // DETAYLI AUDIT LOGS TESTI
  // ==========================================
  log('\n--- Audit Logs Detayli Test ---');
  await page.goto(`${BASE_URL}/master/audit-logs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const auditScreenshot = await takeScreenshot(page, 'audit-logs');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || '');
    log(`  Audit log icerigi: ${bodyText.slice(0, 100)}`);
  } catch(e) {
    log(`  Audit logs test hatasi: ${e.message}`);
  }

  // ==========================================
  // 3. GALLERY/DASHBOARD PANEL ROUTE'LARI
  // ==========================================
  log('\n--- 3. DASHBOARD PANEL ROUTE TESTLERI ---');

  // Once login yap (galeri kullanicisi)
  // Mevcut session ile dene
  const dashboardRoutes = [
    { path: '/dashboard', desc: 'Dashboard Ana Sayfa' },
    { path: '/dashboard/vehicles', desc: 'Araclar Listesi' },
    { path: '/dashboard/vehicles/new', desc: 'Yeni Arac Formu' },
  ];

  for (const route of dashboardRoutes) {
    const r = await testPage(page, route.path, route.desc, []);
    log(`  ${r.status === 'ok' ? 'OK' : 'HATA'} ${route.path} (${r.loadTime || 0}ms) - ${r.notes.join(', ') || 'temiz'}`);
  }

  // ==========================================
  // DETAYLI VEHICLES LISTESI TESTI
  // ==========================================
  log('\n--- Vehicles Detayli Test ---');
  await page.goto(`${BASE_URL}/dashboard/vehicles`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const vehicleScreenshot = await takeScreenshot(page, 'vehicles-list');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '');
    log(`  Araclar sayfasi icerigi: ${bodyText.slice(0, 150)}`);

    // Tab'lari test et (Stok, Transit, Satildi)
    const tabs = await page.$$('[role="tab"]');
    log(`  Tab sayisi: ${tabs.length}`);
    for (let i = 0; i < tabs.length && i < 4; i++) {
      try {
        const tabText = await tabs[i].innerText().catch(() => '');
        await tabs[i].click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        results.summary.clicksOk++;
        log(`  Arac tab tiklandi: "${tabText}"`);
      } catch(e) {}
    }

    // Yeni arac ekleme butonuna tika
    const newBtn = await page.$('a[href="/dashboard/vehicles/new"], button:has-text("Yeni Araç"), button:has-text("Araç Ekle")');
    if (newBtn) {
      await newBtn.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      results.summary.clicksOk++;
      log(`  Yeni arac butonu tiklandi: ${page.url()}`);
    }
  } catch(e) {
    log(`  Vehicles detayli test hatasi: ${e.message}`);
  }

  // ==========================================
  // DETAYLI VEHICLES NEW TESTI
  // ==========================================
  log('\n--- Vehicles New Form Detayli Test ---');
  await page.goto(`${BASE_URL}/dashboard/vehicles/new`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  try {
    const newVehicleScreenshot = await takeScreenshot(page, 'vehicles-new');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '');
    log(`  Yeni arac formu icerigi: ${bodyText.slice(0, 150)}`);

    // Form alanlari var mi?
    const inputs = await page.$$('input, select, textarea');
    log(`  Form alani sayisi: ${inputs.length}`);

    if (inputs.length > 0) {
      // Temel alanlari doldur
      const brandInput = await page.$('input[name="brand"], input[placeholder*="marka" i], input[placeholder*="brand" i]');
      if (brandInput) {
        await brandInput.fill('Toyota');
        results.summary.formsOk++;
        log(`  Marka alani dolduruldu`);
      }

      const modelInput = await page.$('input[name="model"], input[placeholder*="model" i]');
      if (modelInput) {
        await modelInput.fill('Corolla');
        results.summary.formsOk++;
        log(`  Model alani dolduruldu`);
      }

      const yearInput = await page.$('input[name="year"], input[placeholder*="yil" i], input[placeholder*="year" i], input[type="number"][name*="year"]');
      if (yearInput) {
        await yearInput.fill('2022');
        results.summary.formsOk++;
      }

      const formScreenshot = await takeScreenshot(page, 'vehicles-new-filled');
    }
  } catch(e) {
    log(`  Vehicles new form test hatasi: ${e.message}`);
  }

  // ==========================================
  // AUTH SAYFASI TESTLERI
  // ==========================================
  log('\n--- AUTH SAYFASI TESTLERI ---');

  // Register sayfasi
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  const registerResult = {
    route: '/register',
    description: 'Kayit sayfasi',
    status: 'ok',
    consoleErrors: [],
    networkErrors: [],
    clicks: [],
    forms: [],
    screenshot: await takeScreenshot(page, 'register'),
    notes: []
  };

  const registerText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) || '');
  if (!registerText || registerText.length < 5) {
    registerResult.status = 'warning';
    registerResult.notes.push('Register sayfasi bos veya mevcut degil');
  } else {
    registerResult.notes.push(`Register sayfasi icerigi: ${registerText.slice(0, 80)}`);
  }
  results.pages.push(registerResult);

  // ==========================================
  // VEHICLE DETAIL TESTI
  // ==========================================
  log('\n--- Vehicle Detail Testi ---');

  // Once vehicles listesinden bir ID al
  try {
    const vehiclesResp = await page.evaluate(async () => {
      const r = await fetch('/api/vehicles?limit=1').catch(() => null);
      if (r && r.ok) return r.json();
      return null;
    });

    // Direkt API'dan al
    const apiResp = await page.evaluate(async () => {
      try {
        const r = await fetch('http://localhost:4000/api/vehicles?limit=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
        });
        if (r.ok) return r.json();
        return null;
      } catch(e) {
        return null;
      }
    });

    log(`  API araclari: ${JSON.stringify(apiResp)?.slice(0, 100)}`);

    // Araçlar listesine git ve ilk araca tikla
    await page.goto(`${BASE_URL}/dashboard/vehicles`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);

    const vehicleLinks = await page.$$('a[href*="/dashboard/vehicles/"]:not([href="/dashboard/vehicles/new"])');
    log(`  Arac detail link sayisi: ${vehicleLinks.length}`);

    if (vehicleLinks.length > 0) {
      const href = await vehicleLinks[0].getAttribute('href');
      log(`  Ilk arac linki: ${href}`);
      await vehicleLinks[0].click({ timeout: 3000 });
      await page.waitForTimeout(2500);
      const detailScreenshot = await takeScreenshot(page, 'vehicle-detail');
      const detailUrl = page.url();
      log(`  Arac detay URL: ${detailUrl}`);
      results.summary.clicksOk++;

      // Detay sayfasinda tab testleri
      const detailTabs = await page.$$('[role="tab"]');
      for (let i = 0; i < detailTabs.length && i < 3; i++) {
        try {
          const tabText = await detailTabs[i].innerText().catch(() => '');
          await detailTabs[i].click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          results.summary.clicksOk++;
          log(`  Detay tab: "${tabText}"`);
        } catch(e) {}
      }

      // Detay sayfa resultu ekle
      const detailBodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || '');
      results.pages.push({
        route: href || '/dashboard/vehicles/[id]',
        description: 'Arac Detay Sayfasi',
        status: detailBodyText.length > 50 ? 'ok' : 'warning',
        consoleErrors: [],
        networkErrors: [],
        clicks: [{ ok: true, msg: 'Tab gezintisi yapildi' }],
        forms: [],
        screenshot: detailScreenshot,
        notes: [detailBodyText.slice(0, 100)]
      });
      if (detailBodyText.length > 50) results.summary.pagesOk++;
      else results.summary.pagesError++;
    }
  } catch(e) {
    log(`  Vehicle detail test hatasi: ${e.message}`);
  }

  // ==========================================
  // FINAL OZET
  // ==========================================
  log('\n--- TESTLER TAMAMLANDI ---');
  log(`Sayfalar: ${results.summary.pagesOk} OK / ${results.summary.pagesError} HATA`);
  log(`Tiklamalar: ${results.summary.clicksOk} OK / ${results.summary.clicksError} HATA`);
  log(`Formlar: ${results.summary.formsOk} OK / ${results.summary.formsError} HATA`);
  log(`Kritik hatalar: ${results.errors.critical.length}`);
  log(`Uyarilar: ${results.errors.warning.length}`);
  log(`Bilgi: ${results.errors.info.length}`);

  await browser.close();

  // Sonuclari JSON olarak kaydet
  const jsonPath = join(REPORTS_DIR, 'test_results_faz3.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  log(`Sonuclar kaydedildi: ${jsonPath}`);

  return results;
}

run().then(results => {
  console.log('\n=== TEST TAMAMLANDI ===');
  console.log(JSON.stringify({
    pagesOk: results.summary.pagesOk,
    pagesError: results.summary.pagesError,
    clicksOk: results.summary.clicksOk,
    clicksError: results.summary.clicksError,
    formsOk: results.summary.formsOk,
    formsError: results.summary.formsError,
    criticalErrors: results.errors.critical.length,
    warnings: results.errors.warning.length,
    info: results.errors.info.length
  }, null, 2));
}).catch(err => {
  console.error('TEST HATASI:', err);
  process.exit(1);
});

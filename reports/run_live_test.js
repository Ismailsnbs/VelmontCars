/**
 * KKTC Galeri - Live Frontend Test
 * Faz 3 - 2026-03-01
 * Playwright ile tum route'lari test eder
 */

const { chromium } = require('playwright');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const REPORTS_DIR = __dirname;
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots_faz3');

try { mkdirSync(SCREENSHOTS_DIR, { recursive: true }); } catch(e) {}

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000';

// Test sonuclari
const results = {
  pages: [],
  errors: { critical: [], warning: [], info: [] },
  summary: {
    pagesOk: 0, pagesError: 0,
    clicksOk: 0, clicksError: 0,
    formsOk: 0, formsError: 0
  }
};

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function addError(level, route, type, detail, source) {
  results.errors[level].push({ route, type, detail, source: source || '' });
}

async function waitFor(page, ms) {
  await page.waitForTimeout(ms || 2000);
}

async function takeScreenshot(page, name) {
  try {
    const safeName = name.replace(/\//g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
    const filePath = path.join(SCREENSHOTS_DIR, `${safeName}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    return filePath;
  } catch(e) {
    return `screenshot_hatasi: ${e.message}`;
  }
}

async function testPage(page, route, description) {
  log(`TEST: ${route} — ${description}`);

  const result = {
    route,
    description,
    status: 'ok',
    loadTime: 0,
    title: '',
    bodyPreview: '',
    consoleErrors: [],
    networkErrors: [],
    clicks: [],
    forms: [],
    screenshot: '',
    notes: []
  };

  const networkErrors = [];
  const pageConsoleErrors = [];

  const responseHandler = (response) => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      // API hatalari (401 bekleniyor, auth gereken sayfalar)
      if (status === 401 && url.includes('/api/')) {
        // 401 API hatalari bilgi olarak kaydet
        result.notes.push(`401 Auth gerekli: ${url.split('/api/')[1] || url}`);
      } else if (status !== 401) {
        networkErrors.push(`${status} ${url}`);
      }
    }
  };

  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push(msg.text());
    }
  };

  const pageErrorHandler = (err) => {
    pageConsoleErrors.push(`PAGE ERROR: ${err.message}`);
  };

  page.on('response', responseHandler);
  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await waitFor(page, 2500);
    result.loadTime = Date.now() - startTime;

    result.title = await page.title().catch(() => '');
    result.bodyPreview = await page.evaluate(() => {
      return (document.body && document.body.innerText || '').slice(0, 200);
    }).catch(() => '');

    // Bos sayfa kontrolu
    if (!result.bodyPreview || result.bodyPreview.length < 10) {
      result.status = 'warning';
      result.notes.push('Sayfa icerigi bos veya cok az');
      addError('warning', route, 'BOSH_SAYFA', 'Sayfa icerigi yetersiz', '');
    }

    // 404 kontrolu
    if (result.bodyPreview.toLowerCase().includes('404') ||
        result.bodyPreview.toLowerCase().includes('bu sayfa bulunamadi') ||
        result.bodyPreview.toLowerCase().includes('not found')) {
      result.status = 'error';
      result.notes.push('404 Not Found algilandi');
      addError('critical', route, '404_NOT_FOUND', result.bodyPreview.slice(0, 100), '');
    }

    // Error boundary kontrolu
    if (result.bodyPreview.toLowerCase().includes('something went wrong') ||
        result.bodyPreview.toLowerCase().includes('application error') ||
        result.bodyPreview.toLowerCase().includes('bir hata olustu')) {
      result.status = 'error';
      result.notes.push('Application Error boundary tetiklendi');
      addError('critical', route, 'APP_ERROR', result.bodyPreview.slice(0, 150), '');
    }

    result.screenshot = await takeScreenshot(page, route || 'root');

  } catch(e) {
    result.status = 'error';
    result.notes.push(`Sayfa yuklenemedi: ${e.message}`);
    addError('critical', route, 'SAYFA_YUKLENEMEDI', e.message, '');
    results.summary.pagesError++;
    results.pages.push(result);
    page.off('response', responseHandler);
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
    return result;
  }

  result.consoleErrors = pageConsoleErrors;
  result.networkErrors = networkErrors;

  // Hatalari siniflandir
  pageConsoleErrors.forEach(err => {
    if (err.includes('TypeError') || err.includes('ReferenceError') ||
        err.includes('Cannot read') || err.includes('is not a function') ||
        err.includes('PAGE ERROR')) {
      addError('critical', route, 'CONSOLE_RUNTIME_ERROR', err.slice(0, 200), '');
    } else if (err.includes('Warning') || err.includes('deprecated') || err.includes('useLayoutEffect')) {
      addError('info', route, 'CONSOLE_WARNING', err.slice(0, 200), '');
    } else {
      addError('warning', route, 'CONSOLE_ERROR', err.slice(0, 200), '');
    }
  });

  networkErrors.forEach(err => {
    if (err.match(/^5/)) {
      addError('critical', route, 'NETWORK_5XX', err, '');
    } else if (err.match(/^4/) && !err.includes('401') && !err.includes('403')) {
      addError('warning', route, 'NETWORK_4XX', err, '');
    }
  });

  if (result.status === 'ok') results.summary.pagesOk++;
  else results.summary.pagesError++;

  page.off('response', responseHandler);
  page.off('console', consoleHandler);
  page.off('pageerror', pageErrorHandler);

  results.pages.push(result);
  return result;
}

async function tryClick(page, selector, description, route) {
  try {
    const el = await page.$(selector);
    if (!el) return { ok: false, msg: `Element yok: ${selector}` };
    await el.click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    results.summary.clicksOk++;
    return { ok: true, msg: description };
  } catch(e) {
    results.summary.clicksError++;
    addError('warning', route, 'CLICK_HATASI', `${description}: ${e.message.slice(0, 100)}`, '');
    return { ok: false, msg: e.message.slice(0, 80) };
  }
}

async function tryButtonByText(page, route, text, waitMs) {
  waitMs = waitMs || 1500;
  try {
    const btn = await page.$(`button:has-text("${text}")`);
    if (!btn) return { ok: false, msg: `"${text}" butonu yok` };
    const isVisible = await btn.isVisible().catch(() => false);
    if (!isVisible) return { ok: false, msg: `"${text}" butonu gizli` };
    await btn.click({ timeout: 5000 });
    await page.waitForTimeout(waitMs);
    results.summary.clicksOk++;
    return { ok: true, msg: `"${text}" butonuna tiklandi` };
  } catch(e) {
    results.summary.clicksError++;
    return { ok: false, msg: e.message.slice(0, 80) };
  }
}

async function closeModal(page) {
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  } catch(e) {}
}

async function fillInputIfExists(page, selectors, value) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          await el.fill(value);
          results.summary.formsOk++;
          return true;
        }
      }
    } catch(e) {}
  }
  return false;
}

async function run() {
  log('=== KKTC Galeri Faz 3 Live Test Basliyor ===');
  log(`Frontend: ${BASE_URL} | Backend: ${API_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // ==========================================
  // 1. LOGIN TESTI
  // ==========================================
  log('\n--- 1. LOGIN TESTI ---');

  const loginPageErrors = [];
  const loginNetErrors = [];

  page.on('response', r => {
    if (r.status() >= 400 && r.status() !== 401) loginNetErrors.push(`${r.status()} ${r.url()}`);
  });
  page.on('console', m => {
    if (m.type() === 'error') loginPageErrors.push(m.text());
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2000);

  const loginResult = {
    route: '/login',
    description: 'Giris Sayfasi',
    status: 'ok',
    loadTime: 0,
    title: await page.title().catch(() => ''),
    bodyPreview: '',
    consoleErrors: [],
    networkErrors: [],
    clicks: [],
    forms: [],
    screenshot: await takeScreenshot(page, 'login'),
    notes: []
  };

  const loginBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300)).catch(() => '');
  loginResult.bodyPreview = loginBody.slice(0, 100);

  log(`  Login sayfasi title: "${loginResult.title}"`);
  log(`  Login sayfasi body: "${loginBody.slice(0, 80)}"`);

  // Form doldurmak icin input'lari bul
  try {
    const emailFilled = await fillInputIfExists(page,
      ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="mail" i]'],
      'admin@kktcgaleri.com'
    );
    const passFilled = await fillInputIfExists(page,
      ['input[type="password"]', 'input[name="password"]'],
      '123456'
    );

    log(`  Email filled: ${emailFilled}, Password filled: ${passFilled}`);

    if (emailFilled && passFilled) {
      loginResult.forms.push({ ok: true, msg: 'Login formu dolduruldu' });

      // Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (!submitBtn) {
        // Text ile dene
        const loginBtn = await page.$('button:has-text("Giriş"), button:has-text("Login"), button:has-text("Giris")');
        if (loginBtn) await loginBtn.click({ timeout: 5000 });
      } else {
        await submitBtn.click({ timeout: 5000 });
      }

      await waitFor(page, 3500);
      const afterUrl = page.url();
      log(`  Login sonrasi URL: ${afterUrl}`);

      if (afterUrl.includes('/master') || afterUrl.includes('/dashboard')) {
        loginResult.notes.push(`Login BASARILI - redirect: ${afterUrl}`);
        log('  LOGIN BASARILI!');
        results.summary.formsOk++;
      } else {
        const afterBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300)).catch(() => '');
        loginResult.notes.push(`Login redirect beklenmedik: ${afterUrl}`);
        loginResult.notes.push(`Sayfa icerigi: ${afterBody.slice(0, 100)}`);

        if (afterBody.toLowerCase().includes('hata') || afterBody.toLowerCase().includes('invalid') ||
            afterBody.toLowerCase().includes('yanlis') || afterBody.toLowerCase().includes('hatalı')) {
          loginResult.status = 'error';
          addError('critical', '/login', 'LOGIN_BASARISIZ', `URL: ${afterUrl}, Body: ${afterBody.slice(0, 100)}`, 'apps/web/app/(auth)/login/');
          results.summary.formsError++;
        } else {
          loginResult.notes.push('Login sonucu belirsiz (redirect olmadi ama hata da yok)');
        }
      }
    } else {
      loginResult.status = 'error';
      loginResult.notes.push('Login form alanlari bulunamadi');
      addError('critical', '/login', 'FORM_INPUT_YOK', `email:${emailFilled} pass:${passFilled}`, 'apps/web/app/(auth)/login/');
    }
  } catch(e) {
    loginResult.status = 'error';
    loginResult.notes.push(`Login hatasi: ${e.message}`);
    addError('critical', '/login', 'LOGIN_EXCEPTION', e.message, '');
  }

  loginResult.consoleErrors = loginPageErrors;
  loginResult.networkErrors = loginNetErrors;
  if (loginResult.status === 'ok') results.summary.pagesOk++;
  else results.summary.pagesError++;
  results.pages.push(loginResult);

  const postLoginUrl = page.url();
  log(`\n  Mevcut URL: ${postLoginUrl}`);

  // ==========================================
  // 2. MASTER PANEL SAYFALAR
  // ==========================================
  log('\n--- 2. MASTER PANEL ROUTE TESTLERI ---');

  const masterRoutes = [
    { path: '/master', desc: 'Master Dashboard' },
    { path: '/master/tax-rates', desc: 'Vergi Oranlari' },
    { path: '/master/countries', desc: 'Ulkeler (Mensei Ulkeler)' },
    { path: '/master/exchange-rates', desc: 'Doviz Kurlari' },
    { path: '/master/galleries', desc: 'Galeriler' },
    { path: '/master/notifications', desc: 'Bildirimler' },
    { path: '/master/audit-logs', desc: 'Audit Logs' },
  ];

  for (const route of masterRoutes) {
    const r = await testPage(page, route.path, route.desc);
    const statusIcon = r.status === 'ok' ? 'OK' : r.status === 'warning' ? 'UYARI' : 'HATA';
    log(`  [${statusIcon}] ${route.path} (${r.loadTime}ms)`);
    if (r.consoleErrors.length) log(`    Console errors: ${r.consoleErrors.length}`);
    if (r.networkErrors.length) log(`    Network errors: ${r.networkErrors.join(', ')}`);
    if (r.notes.length) log(`    Notlar: ${r.notes.join(' | ')}`);
  }

  // ==========================================
  // 2b. MASTER SAYFALAR DETAYLI INTERAKSIYON
  // ==========================================

  // --- TAX RATES ---
  log('\n--- Tax Rates Detayli Test ---');
  await page.goto(`${BASE_URL}/master/tax-rates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  const taxRatesPageResult = results.pages.find(p => p.route === '/master/tax-rates');

  try {
    // Tablo var mi?
    const rows = await page.$$('tbody tr');
    log(`  Tablo satiri: ${rows.length}`);

    // Yeni Vergi Orani butonuna tikla
    const newBtn = await tryButtonByText(page, '/master/tax-rates', 'Yeni', 2000);
    if (newBtn.ok) {
      if (taxRatesPageResult) taxRatesPageResult.clicks.push(newBtn);
      const dialogScreenshot = await takeScreenshot(page, 'tax-rates-new-dialog');
      log(`  Yeni Vergi dialog: ${newBtn.msg}`);

      // Dialog icinde form doldur
      await fillInputIfExists(page, ['input[name="name"]', 'input[placeholder*="ad" i]'], 'Test KDV');
      await fillInputIfExists(page, ['input[name="rate"]', 'input[placeholder*="oran" i]'], '18');

      const dialogScreenshot2 = await takeScreenshot(page, 'tax-rates-new-dialog-filled');
      await closeModal(page);
      await waitFor(page, 500);
    } else {
      // Ekle veya Oluştur dene
      const addBtn = await tryButtonByText(page, '/master/tax-rates', 'Ekle', 1500);
      if (addBtn.ok && taxRatesPageResult) taxRatesPageResult.clicks.push(addBtn);
      await closeModal(page);
    }

    // Satir varsa duzenle butonunu test et
    if (rows.length > 0) {
      const editBtns = await page.$$('button[aria-label*="edit" i], button[aria-label*="duzenle" i]');
      if (editBtns.length === 0) {
        // Satira hover yap, buton gorunebilir
        await rows[0].hover().catch(() => {});
        await waitFor(page, 500);
      }

      // Action menusunu dene (dropdown)
      const moreBtn = await page.$('button[aria-haspopup="menu"], button[aria-label*="more" i], button[aria-label*="actions" i]');
      if (moreBtn) {
        await moreBtn.click({ timeout: 3000 });
        await waitFor(page, 800);
        const menuScreenshot = await takeScreenshot(page, 'tax-rates-action-menu');
        results.summary.clicksOk++;
        await closeModal(page);
      }
    }

    // Arama testi
    const searchInput = await page.$('input[placeholder*="ara" i], input[placeholder*="search" i], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('KDV');
      await waitFor(page, 1500);
      const searchScreenshot = await takeScreenshot(page, 'tax-rates-search-results');
      results.summary.formsOk++;
      log(`  Arama testi yapildi - KDV aranmadi`);
      await searchInput.clear();
    }

  } catch(e) {
    log(`  Tax rates interaksiyon hatasi: ${e.message}`);
    addError('warning', '/master/tax-rates', 'INTERAKSIYON_HATASI', e.message, '');
  }

  // --- COUNTRIES ---
  log('\n--- Countries Detayli Test ---');
  await page.goto(`${BASE_URL}/master/countries`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  try {
    const countryRows = await page.$$('tbody tr');
    log(`  Ulke tablo satiri: ${countryRows.length}`);

    const newCountryBtn = await tryButtonByText(page, '/master/countries', 'Yeni', 2000);
    if (newCountryBtn.ok) {
      const countriesResult = results.pages.find(p => p.route === '/master/countries');
      if (countriesResult) countriesResult.clicks.push(newCountryBtn);
      log(`  Yeni ulke dialog: ${newCountryBtn.msg}`);
      await takeScreenshot(page, 'countries-new-dialog');
      await closeModal(page);
    } else {
      const addCountryBtn = await tryButtonByText(page, '/master/countries', 'Ekle', 1500);
      if (addCountryBtn.ok) {
        const countriesResult = results.pages.find(p => p.route === '/master/countries');
        if (countriesResult) countriesResult.clicks.push(addCountryBtn);
        await closeModal(page);
      }
    }
  } catch(e) {
    log(`  Countries interaksiyon hatasi: ${e.message}`);
  }

  // --- EXCHANGE RATES ---
  log('\n--- Exchange Rates Detayli Test ---');
  await page.goto(`${BASE_URL}/master/exchange-rates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  const exchResult = results.pages.find(p => p.route === '/master/exchange-rates');

  try {
    const exchBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300)).catch(() => '');
    log(`  Doviz kurlari icerigi: ${exchBody.slice(0, 100)}`);

    // Tab'lari test et
    const tabs = await page.$$('[role="tab"]');
    log(`  Tab sayisi: ${tabs.length}`);

    for (let i = 0; i < tabs.length && i < 4; i++) {
      try {
        const tabText = await tabs[i].innerText().catch(() => `Tab${i}`);
        const isSelected = await tabs[i].getAttribute('aria-selected').catch(() => 'false');
        await tabs[i].click({ timeout: 3000 });
        await waitFor(page, 1200);
        results.summary.clicksOk++;
        log(`  Tab tiklandi: "${tabText.trim()}" (selected: ${isSelected})`);
        await takeScreenshot(page, `exchange-rates-tab-${i}`);
        if (exchResult) exchResult.clicks.push({ ok: true, msg: `Tab: "${tabText.trim()}"` });
      } catch(e) {
        log(`  Tab ${i} tiklama hatasi: ${e.message.slice(0, 50)}`);
      }
    }
  } catch(e) {
    log(`  Exchange rates interaksiyon hatasi: ${e.message}`);
  }

  // --- GALLERIES ---
  log('\n--- Galleries Detayli Test ---');
  await page.goto(`${BASE_URL}/master/galleries`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  const galleriesResult = results.pages.find(p => p.route === '/master/galleries');

  try {
    const galRows = await page.$$('tbody tr');
    log(`  Galeri satiri: ${galRows.length}`);

    // Yeni galeri butonu
    const newGalBtn = await tryButtonByText(page, '/master/galleries', 'Yeni', 2000);
    if (newGalBtn.ok) {
      if (galleriesResult) galleriesResult.clicks.push(newGalBtn);
      log(`  Yeni galeri dialog: ${newGalBtn.msg}`);
      await takeScreenshot(page, 'galleries-new-dialog');
      await closeModal(page);
    }

    // Galeri detay sayfasina git
    const galDetailLink = await page.$('a[href*="/master/galleries/"]');
    if (galDetailLink) {
      const href = await galDetailLink.getAttribute('href');
      await galDetailLink.click({ timeout: 3000 });
      await waitFor(page, 2500);
      results.summary.clicksOk++;
      log(`  Galeri detay: ${page.url()}`);
      await takeScreenshot(page, 'gallery-detail');

      // Detay sayfasi icerigi
      const detailBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 200)).catch(() => '');
      log(`  Galeri detay icerik: ${detailBody.slice(0, 80)}`);

      const galDetailResult = {
        route: href,
        description: 'Galeri Detay Sayfasi',
        status: detailBody.length > 30 ? 'ok' : 'warning',
        loadTime: 0,
        title: await page.title().catch(() => ''),
        bodyPreview: detailBody.slice(0, 100),
        consoleErrors: [],
        networkErrors: [],
        clicks: [],
        forms: [],
        screenshot: path.join(SCREENSHOTS_DIR, 'gallery_detail.png'),
        notes: []
      };
      if (galDetailResult.status === 'ok') results.summary.pagesOk++;
      else results.summary.pagesError++;
      results.pages.push(galDetailResult);

      await page.goto(`${BASE_URL}/master/galleries`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await waitFor(page, 1500);
    }
  } catch(e) {
    log(`  Galleries interaksiyon hatasi: ${e.message}`);
  }

  // --- NOTIFICATIONS ---
  log('\n--- Notifications Detayli Test ---');
  await page.goto(`${BASE_URL}/master/notifications`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  const notifResult = results.pages.find(p => p.route === '/master/notifications');

  try {
    const notifBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 400)).catch(() => '');
    log(`  Bildirim sayfasi: ${notifBody.slice(0, 100)}`);
    await takeScreenshot(page, 'notifications-list');

    // Bildirim olustur butonu
    const createNotifBtn = await tryButtonByText(page, '/master/notifications', 'Bildirim', 2000);
    if (!createNotifBtn.ok) {
      const createNotifBtn2 = await tryButtonByText(page, '/master/notifications', 'Oluştur', 2000);
      if (createNotifBtn2.ok && notifResult) {
        notifResult.clicks.push(createNotifBtn2);
        await takeScreenshot(page, 'notifications-create-dialog');

        // Form doldur
        await fillInputIfExists(page, ['input[name="title"]', 'input[placeholder*="baslik" i]'], 'Test Bildirimi');
        await fillInputIfExists(page, ['textarea[name="message"]', 'textarea[placeholder*="mesaj" i]', 'textarea'], 'Bu bir test mesajidir');

        await takeScreenshot(page, 'notifications-create-filled');
        await closeModal(page);
      }
    } else {
      if (notifResult) notifResult.clicks.push(createNotifBtn);
      await takeScreenshot(page, 'notifications-create-dialog');
      await fillInputIfExists(page, ['input[name="title"]', 'input[placeholder*="baslik" i]'], 'Test Bildirimi');
      await fillInputIfExists(page, ['textarea[name="message"]', 'textarea[placeholder*="mesaj" i]', 'textarea'], 'Bu bir test mesajidir');
      await takeScreenshot(page, 'notifications-create-filled');
      await closeModal(page);
    }
  } catch(e) {
    log(`  Notifications interaksiyon hatasi: ${e.message}`);
  }

  // --- AUDIT LOGS ---
  log('\n--- Audit Logs Detayli Test ---');
  await page.goto(`${BASE_URL}/master/audit-logs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2500);

  try {
    const auditBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 400)).catch(() => '');
    log(`  Audit log sayfasi: ${auditBody.slice(0, 100)}`);
    await takeScreenshot(page, 'audit-logs');

    // Filtreler var mi?
    const selects = await page.$$('select, [role="combobox"]');
    log(`  Filtre select sayisi: ${selects.length}`);
  } catch(e) {
    log(`  Audit logs interaksiyon hatasi: ${e.message}`);
  }

  // ==========================================
  // 3. DASHBOARD (GALERI) PANEL SAYFALAR
  // ==========================================
  log('\n--- 3. DASHBOARD PANEL ROUTE TESTLERI ---');

  const dashboardRoutes = [
    { path: '/dashboard', desc: 'Galeri Dashboard' },
    { path: '/dashboard/vehicles', desc: 'Araclar Listesi' },
    { path: '/dashboard/vehicles/new', desc: 'Yeni Arac Formu' },
  ];

  for (const route of dashboardRoutes) {
    const r = await testPage(page, route.path, route.desc);
    const statusIcon = r.status === 'ok' ? 'OK' : r.status === 'warning' ? 'UYARI' : 'HATA';
    log(`  [${statusIcon}] ${route.path} (${r.loadTime}ms)`);
    if (r.consoleErrors.length) log(`    Console errors: ${r.consoleErrors.length} adet`);
    if (r.networkErrors.length) log(`    Network: ${r.networkErrors.join(', ')}`);
    if (r.notes.length) log(`    Notlar: ${r.notes.join(' | ')}`);
  }

  // ==========================================
  // 3b. DASHBOARD SAYFALAR DETAYLI INTERAKSIYON
  // ==========================================

  // --- VEHICLES LIST ---
  log('\n--- Vehicles List Detayli Test ---');
  await page.goto(`${BASE_URL}/dashboard/vehicles`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 3000);

  const vehiclesResult = results.pages.find(p => p.route === '/dashboard/vehicles');

  try {
    const vehicleBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 500)).catch(() => '');
    log(`  Araclar sayfasi: ${vehicleBody.slice(0, 150)}`);

    // Tab'lari test et (Stokta, Transit, Satildi vb)
    const vehicleTabs = await page.$$('[role="tab"]');
    log(`  Arac tab sayisi: ${vehicleTabs.length}`);

    for (let i = 0; i < vehicleTabs.length && i < 5; i++) {
      try {
        const tabText = await vehicleTabs[i].innerText().catch(() => `Tab${i}`);
        await vehicleTabs[i].click({ timeout: 3000 });
        await waitFor(page, 1200);
        results.summary.clicksOk++;
        log(`  Arac tab: "${tabText.trim()}"`);
        await takeScreenshot(page, `vehicles-tab-${i}`);
        if (vehiclesResult) vehiclesResult.clicks.push({ ok: true, msg: `Tab: "${tabText.trim()}"` });
      } catch(e) {}
    }

    // Grid/Liste view switch
    const gridBtn = await page.$('button[aria-label*="grid" i], button[title*="grid" i]');
    const listBtn = await page.$('button[aria-label*="list" i], button[title*="list" i], button[aria-label*="liste" i]');

    if (gridBtn) {
      await gridBtn.click({ timeout: 3000 });
      await waitFor(page, 1000);
      results.summary.clicksOk++;
      log(`  Grid view aktif edildi`);
      if (vehiclesResult) vehiclesResult.clicks.push({ ok: true, msg: 'Grid view' });
    }
    if (listBtn) {
      await listBtn.click({ timeout: 3000 });
      await waitFor(page, 1000);
      results.summary.clicksOk++;
      log(`  Liste view aktif edildi`);
      if (vehiclesResult) vehiclesResult.clicks.push({ ok: true, msg: 'Liste view' });
    }

    // Arama kutusu
    const vehicleSearch = await page.$('input[placeholder*="ara" i], input[placeholder*="search" i], input[type="search"]');
    if (vehicleSearch) {
      await vehicleSearch.fill('Toyota');
      await waitFor(page, 1500);
      results.summary.formsOk++;
      log(`  Arac arama testi: Toyota`);
      await takeScreenshot(page, 'vehicles-search-toyota');
      await vehicleSearch.clear();
    }

    // Yeni arac ekleme linki
    const newVehicleLink = await page.$('a[href="/dashboard/vehicles/new"]');
    if (newVehicleLink) {
      await newVehicleLink.click({ timeout: 3000 });
      await waitFor(page, 2000);
      results.summary.clicksOk++;
      log(`  Yeni arac linki tiklandi: ${page.url()}`);
      if (vehiclesResult) vehiclesResult.clicks.push({ ok: true, msg: 'Yeni arac linki' });
      await page.goto(`${BASE_URL}/dashboard/vehicles`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await waitFor(page, 1500);
    }

    // Arac satira tikla (detail)
    const vehicleRows = await page.$$('tbody tr, .vehicle-card, [data-testid*="vehicle"]');
    log(`  Arac satir/kart sayisi: ${vehicleRows.length}`);

    if (vehicleRows.length > 0) {
      try {
        const firstRow = vehicleRows[0];
        const detailLink = await firstRow.$('a[href*="/dashboard/vehicles/"]:not([href="/dashboard/vehicles/new"])');
        if (detailLink) {
          const href = await detailLink.getAttribute('href');
          await detailLink.click({ timeout: 3000 });
          await waitFor(page, 2500);
          results.summary.clicksOk++;
          log(`  Arac detay URL: ${page.url()}`);
          await takeScreenshot(page, 'vehicle-detail');

          // Detay sayfa test
          const detailBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300)).catch(() => '');

          // Detay tab'lari
          const detailTabs = await page.$$('[role="tab"]');
          for (let i = 0; i < detailTabs.length && i < 4; i++) {
            try {
              const tText = await detailTabs[i].innerText().catch(() => '');
              await detailTabs[i].click({ timeout: 3000 });
              await waitFor(page, 1000);
              results.summary.clicksOk++;
              log(`  Arac detay tab: "${tText.trim()}"`);
              await takeScreenshot(page, `vehicle-detail-tab-${i}`);
            } catch(e) {}
          }

          // Durum degistir butonu
          const statusBtn = await tryButtonByText(page, href || '/dashboard/vehicles/[id]', 'Durum', 1500);
          if (!statusBtn.ok) {
            const moveStockBtn = await tryButtonByText(page, href || '/dashboard/vehicles/[id]', 'Stok', 1500);
          }

          results.pages.push({
            route: href || '/dashboard/vehicles/[id]',
            description: 'Arac Detay Sayfasi',
            status: detailBody.length > 30 ? 'ok' : 'warning',
            loadTime: 0,
            title: await page.title().catch(() => ''),
            bodyPreview: detailBody.slice(0, 100),
            consoleErrors: [],
            networkErrors: [],
            clicks: [{ ok: true, msg: 'Detay tab gezintisi' }],
            forms: [],
            screenshot: path.join(SCREENSHOTS_DIR, 'vehicle_detail.png'),
            notes: []
          });
          if (detailBody.length > 30) results.summary.pagesOk++;
          else results.summary.pagesError++;
        }
      } catch(e) {
        log(`  Arac detay tiklama hatasi: ${e.message.slice(0, 80)}`);
      }
    }
  } catch(e) {
    log(`  Vehicles detayli test hatasi: ${e.message}`);
  }

  // --- VEHICLES NEW FORM ---
  log('\n--- Vehicles New Form Detayli Test ---');
  await page.goto(`${BASE_URL}/dashboard/vehicles/new`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 3000);

  const newVehicleResult = results.pages.find(p => p.route === '/dashboard/vehicles/new');

  try {
    const newVehicleBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 500)).catch(() => '');
    log(`  Yeni arac formu: ${newVehicleBody.slice(0, 150)}`);
    await takeScreenshot(page, 'vehicles-new-form');

    // Multi-step form adim sayisi
    const steps = await page.$$('[data-step], .step, .step-indicator, [aria-current="step"]');
    log(`  Form adim sayisi: ${steps.length}`);

    // Input sayisi
    const inputs = await page.$$('input:not([type="hidden"]), select, textarea');
    log(`  Form input sayisi: ${inputs.length}`);

    if (inputs.length > 0) {
      // Marka
      const brandOk = await fillInputIfExists(page,
        ['input[name="brand"]', 'input[placeholder*="marka" i]', 'input[placeholder*="brand" i]'],
        'Toyota'
      );
      // Model
      const modelOk = await fillInputIfExists(page,
        ['input[name="model"]', 'input[placeholder*="model" i]'],
        'Corolla'
      );
      // Yil
      const yearOk = await fillInputIfExists(page,
        ['input[name="year"]', 'input[placeholder*="yil" i]', 'input[placeholder*="year" i]', 'input[type="number"]'],
        '2022'
      );
      // CC
      const ccOk = await fillInputIfExists(page,
        ['input[name="engineCC"]', 'input[name="engineCc"]', 'input[placeholder*="cc" i]', 'input[placeholder*="hacim" i]'],
        '1600'
      );

      log(`  Form doldurmasi: marka:${brandOk} model:${modelOk} yil:${yearOk} cc:${ccOk}`);
      await takeScreenshot(page, 'vehicles-new-filled');

      if (newVehicleResult) {
        newVehicleResult.forms.push({ ok: true, msg: `Form alanlari dolduruldu (${[brandOk, modelOk, yearOk, ccOk].filter(Boolean).length}/4)` });
      }

      // Ileri butonu veya submit
      const nextBtn = await tryButtonByText(page, '/dashboard/vehicles/new', 'İleri', 1500);
      if (!nextBtn.ok) {
        const nextBtn2 = await tryButtonByText(page, '/dashboard/vehicles/new', 'Devam', 1500);
        if (nextBtn2.ok) {
          log(`  "Devam" butonuna tiklandi`);
          await takeScreenshot(page, 'vehicles-new-step2');
        }
      } else {
        log(`  "Ileri" butonuna tiklandi`);
        await takeScreenshot(page, 'vehicles-new-step2');
      }
    }
  } catch(e) {
    log(`  Vehicles new form test hatasi: ${e.message}`);
  }

  // ==========================================
  // 4. AUTH SAYFALAR
  // ==========================================
  log('\n--- 4. AUTH SAYFALAR TESTI ---');

  // Register sayfasi
  const registerPageErrors = [];
  const registerNetErrors = [];
  page.on('console', m => { if (m.type() === 'error') registerPageErrors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.status() !== 401) registerNetErrors.push(`${r.status()} ${r.url()}`); });

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitFor(page, 2000);

  const registerBody = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300)).catch(() => '');
  log(`  Register body: "${registerBody.slice(0, 100)}"`);

  const registerResult = {
    route: '/register',
    description: 'Kayit Sayfasi',
    status: registerBody.length > 10 ? 'ok' : 'warning',
    loadTime: 0,
    title: await page.title().catch(() => ''),
    bodyPreview: registerBody.slice(0, 100),
    consoleErrors: registerPageErrors,
    networkErrors: registerNetErrors,
    clicks: [],
    forms: [],
    screenshot: await takeScreenshot(page, 'register'),
    notes: registerBody.length > 10 ? [] : ['Register sayfasi bos veya redirect oldu']
  };

  if (registerBody.length > 10) results.summary.pagesOk++;
  else {
    results.summary.pagesError++;
    registerResult.status = 'warning';
  }
  results.pages.push(registerResult);

  // ==========================================
  // 5. HENUZ YAPILMAMIS SAYFALAR (404 bekleniyor)
  // ==========================================
  log('\n--- 5. HENUZ YAPILMAMIS SAYFALAR ---');

  const notImplementedRoutes = [
    { path: '/dashboard/calculator', desc: 'Hesaplama Modulu (Faz 4)' },
    { path: '/dashboard/products', desc: 'Urunler (Faz 5)' },
    { path: '/dashboard/customers', desc: 'Musteriler (Faz 7)' },
    { path: '/dashboard/sales', desc: 'Satislar (Faz 7)' },
    { path: '/dashboard/reports', desc: 'Raporlar (Faz 6)' },
    { path: '/dashboard/settings', desc: 'Ayarlar' },
  ];

  for (const route of notImplementedRoutes) {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await waitFor(page, 1500);

    const bodyText = await page.evaluate(() => (document.body && document.body.innerText || '').slice(0, 200)).catch(() => '');
    const currentUrl = page.url();

    const notImplResult = {
      route: route.path,
      description: route.desc,
      status: 'info',
      loadTime: 0,
      title: await page.title().catch(() => ''),
      bodyPreview: bodyText.slice(0, 100),
      consoleErrors: [],
      networkErrors: [],
      clicks: [],
      forms: [],
      screenshot: await takeScreenshot(page, route.path),
      notes: [`Henuz implemente edilmemis (planlanan faz)`, `URL: ${currentUrl}`]
    };

    // 404 mi, redirect mi, yoksa sayfa mi var?
    if (bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('not found')) {
      notImplResult.notes.push('404 - Sayfa mevcut degil');
      addError('info', route.path, 'HENUZ_YAPILMAMIS', `404 - ${route.desc}`, '');
    } else if (currentUrl !== `${BASE_URL}${route.path}`) {
      notImplResult.notes.push(`Redirect: ${currentUrl}`);
    } else {
      notImplResult.notes.push('Sayfa mevcut veya boş');
    }

    log(`  ${route.path}: ${notImplResult.notes.join(', ')}`);
    results.pages.push(notImplResult);
  }

  // ==========================================
  // TAMAMLANDI
  // ==========================================
  log('\n=== TESTLER TAMAMLANDI ===');
  log(`Sayfalar: ${results.summary.pagesOk} OK / ${results.summary.pagesError} HATA`);
  log(`Tiklamalar: ${results.summary.clicksOk} OK / ${results.summary.clicksError} HATA`);
  log(`Formlar: ${results.summary.formsOk} OK / ${results.summary.formsError} HATA`);
  log(`Kritik: ${results.errors.critical.length} | Uyari: ${results.errors.warning.length} | Bilgi: ${results.errors.info.length}`);

  await browser.close();

  // JSON kaydet
  const jsonPath = path.join(REPORTS_DIR, 'test_results_faz3.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  log(`JSON sonuclar kaydedildi: ${jsonPath}`);

  return results;
}

run().then(res => {
  console.log('\n===SUMMARY===');
  console.log(JSON.stringify(res.summary, null, 2));
  console.log('CRITICAL:', res.errors.critical.length);
  console.log('WARNING:', res.errors.warning.length);
  console.log('INFO:', res.errors.info.length);
}).catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

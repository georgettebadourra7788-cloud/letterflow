import { chromium } from 'playwright';

const BASE = 'http://localhost:5175';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--disable-background-networking', '--disable-sync', '--disable-client-side-phishing-detection', '--no-first-run'],
});
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

function log(msg) {
  console.log(msg);
}

try {
  const email = `quota+${Date.now()}@example.com`;
  const password = 'password123';

  log('1. Sign up fresh account and add one student');
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Create Account")');
  await page.fill('#name', 'Dr. Quota Test');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  await page.goto(`${BASE}/students/new`);
  await page.fill('#studentName', 'quota student');
  await page.fill('#relationship', 'advisor for 1 semester');
  await page.click('button:has-text("Save to Student Roster")');
  await page.waitForURL('**/students', { timeout: 10000 });
  log('   student created');

  log('2. Generate 3 letters (the free-plan lifetime limit)');
  const letterIds = [];
  for (let i = 1; i <= 3; i++) {
    await page.goto(`${BASE}/letters/new`);
    await page.waitForSelector('button:has-text("Generate Draft")', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.click('button:has-text("Generate Draft")');
    // Must actually leave /letters/new — a plain '**/letters/*' glob also
    // matches the starting URL itself and resolves before the real
    // post-creation redirect happens.
    await page.waitForURL((url) => /\/letters\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'), {
      timeout: 10000,
    });
    const id = page.url().split('/letters/')[1];
    letterIds.push(id);
    log(`   letter ${i} created: ${id}`);
  }

  log('3. Try a 4th letter — should now be blocked by UpgradeNotice');
  await page.goto(`${BASE}/letters/new`);
  await page.waitForTimeout(1500);
  const blockedText = await page.locator('text=Free plan limit reached').first().textContent().catch(() => null);
  if (!blockedText) throw new Error('FAIL: 4th letter was NOT blocked — no UpgradeNotice shown after 3 letters');
  log('   PASS: blocked as expected (UpgradeNotice shown)');

  log('4. Delete one of the 3 letters (tidying the dashboard)');
  await page.goto(`${BASE}/letters/${letterIds[0]}`);
  await page.waitForSelector('button:has-text("Delete letter")', { timeout: 10000 });
  page.once('dialog', (dialog) => dialog.accept());
  await page.click('button:has-text("Delete letter")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  log('   deleted letter, back on dashboard');

  log('5. Try to create a new letter again — must STILL be blocked (lifetime counter, not live count)');
  await page.goto(`${BASE}/letters/new`);
  await page.waitForTimeout(1500);
  const stillBlockedText = await page.locator('text=Free plan limit reached').first().textContent().catch(() => null);
  await page.screenshot({ path: '/tmp/e2e-shots/06-still-blocked-after-delete.png' });
  if (!stillBlockedText) {
    throw new Error('FAIL: deleting a letter RESTORED quota — 4th letter was allowed after delete. Lifetime-counter enforcement is broken.');
  }
  log('   PASS: still blocked after delete — deleting did not restore quota');

  log('\n=== QUOTA ENFORCEMENT TEST PASSED ===');
  process.exitCode = 0;
} catch (err) {
  console.error('\n=== TEST FAILED ===');
  console.error(err);
  await page.screenshot({ path: '/tmp/e2e-shots/quota-FAILURE.png' });
  process.exitCode = 1;
} finally {
  await browser.close();
}

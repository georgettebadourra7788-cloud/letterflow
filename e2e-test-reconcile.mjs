import { chromium } from 'playwright';

const BASE = 'http://localhost:5175';
const PROJECT = 'demo-letterflow';
const FS_BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

async function fsGetUser(uid) {
  const res = await fetch(`${FS_BASE}/users/${uid}`, { headers: { Authorization: 'Bearer owner' } });
  const json = await res.json();
  const fields = json.fields || {};
  return {
    totalStudentsCreated: parseInt(fields.totalStudentsCreated?.integerValue || '0', 10),
    totalLettersGenerated: parseInt(fields.totalLettersGenerated?.integerValue || '0', 10),
  };
}

// Directly PATCH the counter field via the emulator REST API, bypassing the
// app entirely — this simulates the exact bug report: a document exists in
// Firestore whose totalLettersGenerated is lower than the real letter count
// (e.g. left over from before this counter existed).
async function fsCorruptCounter(uid, value) {
  const url = `${FS_BASE}/users/${uid}?updateMask.fieldPaths=totalLettersGenerated`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { totalLettersGenerated: { integerValue: String(value) } } }),
  });
  if (!res.ok) throw new Error(`Failed to corrupt counter: ${res.status} ${await res.text()}`);
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--disable-background-networking', '--disable-sync', '--disable-client-side-phishing-detection', '--no-first-run'],
});
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

function log(msg) {
  console.log(msg);
}

try {
  const email = `reconcile+${Date.now()}@example.com`;
  const password = 'password123';

  log('1. Sign up and create a student');
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Create Account")');
  await page.fill('#name', 'Dr. Reconcile Test');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Grab the uid from the Firestore emulator by matching on email.
  const usersRes = await fetch(`${FS_BASE}/users`, { headers: { Authorization: 'Bearer owner' } });
  const usersJson = await usersRes.json();
  const userDoc = usersJson.documents.find((d) => d.fields.email?.stringValue === email);
  const realUid = userDoc.name.split('/').pop();
  log(`   uid: ${realUid}`);

  await page.goto(`${BASE}/students/new`);
  await page.fill('#studentName', 'reconcile student');
  await page.fill('#relationship', 'advisor for 1 semester');
  await page.click('button:has-text("Save to Student Roster")');
  await page.waitForURL('**/students', { timeout: 10000 });

  log('2. Generate 3 real letters through the app (legit path)');
  for (let i = 1; i <= 3; i++) {
    await page.goto(`${BASE}/letters/new`);
    await page.waitForSelector('button:has-text("Generate Draft")', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.click('button:has-text("Generate Draft")');
    await page.waitForURL((url) => /\/letters\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'), {
      timeout: 10000,
    });
    log(`   letter ${i} created`);
  }

  const before = await fsGetUser(realUid);
  log(`   counter after 3 real creates: totalLettersGenerated=${before.totalLettersGenerated} (expect 3)`);
  if (before.totalLettersGenerated !== 3) {
    throw new Error(`FAIL: expected counter to be 3 after 3 real creates, got ${before.totalLettersGenerated}`);
  }

  log('\n3. Reproduce the reported bug: directly corrupt the counter to 0');
  log('   (simulating letters that existed before this counter field did)');
  await fsCorruptCounter(realUid, 0);
  const corrupted = await fsGetUser(realUid);
  log(`   counter forced to: totalLettersGenerated=${corrupted.totalLettersGenerated} (3 real letter docs still exist)`);

  log('\n4. Visit New Letter Request — this should trigger reconcileUsageCounters()');
  await page.goto(`${BASE}/letters/new`);
  await page.waitForTimeout(2000); // allow the async reconciliation to complete

  const healed = await fsGetUser(realUid);
  log(`   counter after visiting the page: totalLettersGenerated=${healed.totalLettersGenerated}`);
  if (healed.totalLettersGenerated !== 3) {
    throw new Error(`FAIL: self-heal did not repair the counter — expected 3, got ${healed.totalLettersGenerated}`);
  }
  log('   PASS: counter self-healed back to the true document count (3)');

  log('\n5. Confirm the limit is now correctly enforced (blocked, since 3 real letters exist)');
  await page.screenshot({ path: '/tmp/e2e-shots/07-reconciled-then-blocked.png' });
  const blockedText = await page.locator('text=Free plan limit reached').first().textContent().catch(() => null);
  if (!blockedText) {
    throw new Error('FAIL: page did not show the free-plan block even though the counter is now accurately at 3');
  }
  log('   PASS: correctly blocked after self-heal');

  log('\n=== RECONCILIATION TEST PASSED ===');
  process.exitCode = 0;
} catch (err) {
  console.error('\n=== TEST FAILED ===');
  console.error(err);
  await page.screenshot({ path: '/tmp/e2e-shots/reconcile-FAILURE.png' }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}

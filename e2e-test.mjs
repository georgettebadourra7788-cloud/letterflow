import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5175';
const SHOTS = '/tmp/e2e-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--disable-background-networking', '--disable-sync', '--disable-client-side-phishing-detection', '--no-first-run'],
});
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('  [browser console error]', msg.text());
});
page.on('pageerror', (err) => console.log('  [browser page error]', err.message));

function log(msg) {
  console.log(msg);
}

async function shot(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
  log(`  screenshot: ${SHOTS}/${name}.png`);
}

try {
  const email = `lecturer+${Date.now()}@example.com`;
  const password = 'password123';

  log('1. Sign up a fresh lecturer account');
  await page.goto(`${BASE}/login`);
  await page.click('button:has-text("Create Account")');
  await page.fill('#name', 'Dr. Test Lecturer');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await shot('00-after-signup-click');
  const errorText = await page.locator('.text-error').first().textContent().catch(() => null);
  if (errorText) log(`   [form error visible]: ${errorText}`);
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  log('   -> landed on dashboard');

  log('2. Create student A: Alice Anderson');
  await page.goto(`${BASE}/students/new`);
  await page.fill('#studentName', 'alice anderson');
  await page.fill('#studentProgram', 'B.S. Chemistry, Class of 2025');
  await page.fill('#studentGrade', '3.9/4');
  await page.fill('#relationship', 'instructor for 1 semester');
  await page.click('button:has-text("Save to Student Roster")');
  await page.waitForURL('**/students', { timeout: 10000 });
  log('   -> saved, back on students list');

  log('3. Create student B: Ben Ortiz');
  await page.goto(`${BASE}/students/new`);
  await page.fill('#studentName', 'ben ortiz');
  await page.fill('#studentProgram', 'B.A. History, Class of 2026');
  await page.fill('#studentGrade', '3.2/4');
  await page.fill('#relationship', 'thesis advisor for 3 semester');
  await page.click('button:has-text("Save to Student Roster")');
  await page.waitForURL('**/students', { timeout: 10000 });
  log('   -> saved, back on students list');

  log('4. Open New Letter Request');
  await page.goto(`${BASE}/letters/new`);
  await page.waitForSelector('#student-select', { timeout: 10000 });
  await page.waitForTimeout(1500); // let both onSnapshot fires (cache+server) settle

  const initialSelection = await page.locator('#student-select').inputValue();
  const initialText = await page.locator('#student-select').locator('option:checked').textContent();
  log(`   initial selection: id=${initialSelection} name="${initialText}"`);
  await shot('01-initial-selection');

  log('5. Select the OTHER student via the dropdown');
  const allOptions = await page.locator('#student-select option').all();
  const optionValues = [];
  for (const opt of allOptions) {
    optionValues.push({ value: await opt.getAttribute('value'), text: await opt.textContent() });
  }
  log('   options in dropdown: ' + JSON.stringify(optionValues));

  const otherOption = optionValues.find((o) => o.value !== initialSelection);
  if (!otherOption) throw new Error('Only one option in dropdown, cannot test switching');

  await page.selectOption('#student-select', otherOption.value);
  await page.waitForTimeout(300);
  const afterClickSelection = await page.locator('#student-select').inputValue();
  const afterClickText = await page.locator('#student-select').locator('option:checked').textContent();
  log(`   after selecting "${otherOption.text}": id=${afterClickSelection} name="${afterClickText}"`);
  await shot('02-after-selecting-other-student');

  if (afterClickSelection !== otherOption.value) {
    throw new Error(`FAIL: dropdown value is "${afterClickSelection}", expected "${otherOption.value}" — selection did not update`);
  }

  log('6. Wait 3s (simulate extra onSnapshot fires / reconnects) and re-check it did not revert');
  await page.waitForTimeout(3000);
  const afterWaitSelection = await page.locator('#student-select').inputValue();
  log(`   after waiting: id=${afterWaitSelection}`);
  await shot('03-after-waiting-still-selected');
  if (afterWaitSelection !== otherOption.value) {
    throw new Error(`FAIL: selection reverted after waiting — now "${afterWaitSelection}", expected "${otherOption.value}"`);
  }

  log('7. Generate the letter and confirm the CORRECT student\'s data is in the draft');
  await page.click('button:has-text("Generate Draft")');
  await page.waitForURL('**/letters/*', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot('04-letter-editor-generated');

  const draftText = await page.locator('textarea').inputValue();
  log('   --- generated draft text ---');
  log(draftText);
  log('   --- end draft text ---');

  const expectedName = otherOption.text; // e.g. "Ben Ortiz"
  const wrongName = optionValues.find((o) => o.value === initialSelection).text; // e.g. "Alice Anderson"

  if (!draftText.includes(expectedName)) {
    throw new Error(`FAIL: draft does not contain expected student name "${expectedName}"`);
  }
  if (draftText.includes(wrongName)) {
    throw new Error(`FAIL: draft contains the WRONG (previously-selected) student name "${wrongName}"`);
  }

  log(`\nPASS: draft correctly reflects "${expectedName}" and does not mention "${wrongName}"`);

  log('\n8. Sanity: switch back to the first student for a SECOND letter and confirm that works too');
  await page.goto(`${BASE}/letters/new`);
  await page.waitForSelector('#student-select', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.selectOption('#student-select', initialSelection);
  await page.waitForTimeout(300);
  const backToFirst = await page.locator('#student-select').inputValue();
  if (backToFirst !== initialSelection) {
    throw new Error(`FAIL: could not switch back to first student either — got "${backToFirst}"`);
  }
  log(`   switched back to id=${backToFirst} successfully`);
  await shot('05-switched-back-to-first-student');

  log('\n=== ALL CHECKS PASSED ===');
  process.exitCode = 0;
} catch (err) {
  console.error('\n=== TEST FAILED ===');
  console.error(err);
  await shot('FAILURE-state');
  process.exitCode = 1;
} finally {
  await browser.close();
}

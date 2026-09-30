// Development-only regression checks. The HTML itself has no runtime dependencies.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const file = path.resolve(__dirname, '..', 'Cheatsheet-Commander.html');
const url = pathToFileURL(file).href;
const pages = ['pacman', 'parted', 'git', 'brew', 'unix', 'debian', 'tmux', 'editors', 'nixos', 'ergo'];
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHEATSHEET_BROWSER_PATH ? { executablePath: process.env.CHEATSHEET_BROWSER_PATH } : {}),
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    const page = await context.newPage();
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/^https?:/.test(request.url())) externalRequests.push(request.url());
    });
    await page.addInitScript(() => {
      window.copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async text => { window.copied.push(text); } },
      });
    });
    await page.goto(url);
    check(await page.locator('[role=tab]').count() === 10, 'All ten tabs initialize');
    check(await page.locator('.content-section:visible').count() === 1, 'Only the selected panel displays');
    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
    check(new Set(ids).size === ids.length, 'IDs are unique');
    check(await page.locator('.card p .copy-btn, .no-copy .copy-btn').count() === 0, 'No copy buttons on prose or keybinding cards');
    check(await page.locator('code code').count() === 0, 'Code blocks are not accidentally nested');
    check(await page.locator('a[target=_blank]:not([rel~="noopener"])').count() === 0, 'External references isolate their new tabs');
    const lowContrast = await page.locator('.card-header, .tab-button').evaluateAll(elements => {
      function luminance(hex) {
        const rgb = hex.trim().replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255)
          .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      }
      return elements.filter(element => ['start', 'mid', 'end'].some(stop => {
        const hex = getComputedStyle(element).getPropertyValue('--accent-gradient-' + stop);
        return 1.05 / (luminance(hex) + 0.05) < 4.5;
      })).map(element => element.textContent);
    });
    check(lowContrast.length === 0, 'White heading and active-tab text has at least 4.5:1 contrast at all gradient stops: ' + lowContrast.join(', '));
    for (const panel of pages) {
      await page.locator('#' + panel + '-tab').click();
      check(await page.locator('#' + panel).isVisible(), panel + ' opens');
      check(await page.locator('#' + panel + '-tab').getAttribute('aria-selected') === 'true', panel + ' selection is announced');
      check(await page.locator('#' + panel + ' h2.page-title').count() === 1, panel + ' has a title');
      check(await page.locator('#' + panel + ' a[href^="https://"]').count() > 0, panel + ' has source references');
    }
    await page.goto(url + '#git');
    check(await page.locator('#git').isVisible(), 'Bookmarks select their page');
    await page.locator('#git-tab').focus();
    await page.keyboard.press('ArrowRight');
    check(await page.locator('#brew-tab').evaluate(tab => tab === document.activeElement), 'Right arrow changes tab and focus');
    await page.keyboard.press('End');
    check(await page.locator('#ergo').isVisible(), 'End selects the last tab');
    await page.keyboard.press('Home');
    check(await page.locator('#pacman').isVisible(), 'Home selects the first tab');
    await page.locator('#git-tab').click();
    await page.locator('#nixos-tab').click();
    await page.goBack();
    check(await page.locator('#git').isVisible(), 'Browser Back restores the previous tab');
    await page.goForward();
    check(await page.locator('#nixos').isVisible(), 'Browser Forward restores the next tab');
    await page.goto(url + '#unknown');
    check(await page.locator('#pacman').isVisible(), 'Unknown bookmarks fall back without errors');

    await page.keyboard.press('/');
    check(await page.locator('#search').evaluate(input => input === document.activeElement), 'Slash focuses search');
    await page.locator('#search').fill('RSYNC bandwidth');
    check(await page.locator('#unix-tab .tab-count').innerText() === '(1)', 'Search handles multiple terms and case');
    check(await page.locator('#empty-state').isVisible(), 'Current page explains that matches live on another tab');
    await page.locator('#unix-tab').click();
    check(await page.locator('#unix .card:visible').count() === 1, 'Matching card and ancestors stay visible');
    check(!(await page.locator('#empty-state').isVisible()), 'Empty state disappears on a matching page');
    await page.locator('#search').fill('no-such-command-987654');
    check(await page.locator('.content-section.active .card:visible').count() === 0, 'No-match search hides all cards');
    await page.locator('#search').press('Escape');
    check(await page.locator('#search').inputValue() === '', 'Escape clears search');
    check(await page.locator('#unix .card:visible').count() > 1, 'Clearing restores nested layout');

    // Verify every captured command, including initially hidden tabs and multiline snippets.
    const copyResult = await page.evaluate(async () => {
      window.copied = [];
      const commands = Array.from(document.querySelectorAll('.card:not(.no-copy) > code'));
      const expected = commands.map(code => Array.from(code.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim());
      commands.forEach(code => code.querySelector('.copy-btn').click());
      await Promise.resolve();
      return { expected, actual: window.copied };
    });
    assert.deepEqual(copyResult.actual, copyResult.expected, 'Every copy button preserves only the command text');
    checks++;
    check(copyResult.actual.some(command => command.includes('\n') && command.includes('environment.systemPackages')), 'Multiline snippets preserve their newlines');
    await page.locator('#git-tab').click();
    await page.locator('#git .copy-btn').first().click();
    check((await page.evaluate(() => window.copied.at(-1))) === 'git init', 'Actual visible command click copies the command');

    // A rejected Clipboard API and a false/throwing legacy API must offer manual copying.
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
      document.execCommand = () => false;
    });
    await page.reload();
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
      document.execCommand = () => false;
    });
    await page.locator('#git .copy-btn').first().click();
    check(await page.locator('#copy-dialog').isVisible(), 'False copy result opens manual-copy dialog');
    check(await page.locator('#manual-copy').inputValue() === 'git init', 'Manual copying receives correct text');
    check(await page.locator('#git .copy-btn.success').count() === 0, 'Failed copy never claims success');
    await page.locator('#close-copy').click();
    check(await page.locator('#git .copy-btn').first().evaluate(button => button === document.activeElement), 'Dialog returns focus to its trigger');
    await page.evaluate(() => { document.execCommand = () => { throw new Error('Unsupported'); }; });
    await page.locator('#git .copy-btn').first().click();
    check(await page.locator('#copy-dialog').isVisible(), 'Throwing legacy copy also opens manual-copy dialog');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      document.execCommand = () => {
        window.legacyCopied = document.activeElement.value;
        return true;
      };
    });
    await page.locator('#git .copy-btn').first().click();
    check(await page.evaluate(() => window.legacyCopied === 'git init'), 'Legacy fallback receives correct selected text');
    check(await page.locator('#git .copy-btn.success').count() === 1, 'Successful fallback is announced');

    for (const width of [320, 390, 768, 900, 1280]) {
      await page.setViewportSize({ width, height: 960 });
      for (const panel of pages) {
        await page.locator('#' + panel + '-tab').click();
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), panel + ' fits at ' + width + 'px');
        const overflowing = await page.locator('#' + panel + ' h3').evaluateAll(headings => headings
          .filter(heading => heading.getBoundingClientRect().right > innerWidth + 1).map(heading => heading.textContent));
        check(overflowing.length === 0, panel + ' headings fit at ' + width + 'px');
      }
    }
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.locator('#parted-tab').click();
    await page.emulateMedia({ media: 'print' });
    check(await page.locator('.content-section:visible').count() === 1, 'Print contains only the selected page');
    check(await page.locator('.copy-btn:visible, .tabs-container:visible').count() === 0, 'Print omits controls');
    check(await page.locator('#parted .card:visible').count() === 7, 'Print retains selected page content');
    await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
    check(await page.locator('.tab-button').first().evaluate(tab => getComputedStyle(tab).transitionDuration === '0s'), 'Reduced-motion preference disables transitions');
    await page.evaluate(() => { window.print = () => { window.printCalled = true; }; });
    await page.locator('#print-page').click();
    check(await page.evaluate(() => window.printCalled === true), 'Print button invokes printing');

    if (process.env.CHEATSHEET_SCREENSHOT_DIR) {
      const directory = process.env.CHEATSHEET_SCREENSHOT_DIR;
      fs.mkdirSync(directory, { recursive: true });
      for (const panel of ['pacman', 'parted', 'nixos', 'editors', 'ergo']) {
        await page.locator('#' + panel + '-tab').click();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(directory, panel + '-desktop.png'), fullPage: true });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('#nixos-tab').click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(directory, 'nixos-mobile.png'), fullPage: true });
      await page.screenshot({ path: path.join(directory, 'nixos-mobile-top.png') });
    }
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noScript.newPage();
    await staticPage.goto(url);
    check(await staticPage.locator('.content-section:visible').count() === 10, 'All content remains readable without JavaScript');
    check(await staticPage.locator('.tabs-container:visible, .toolbar:visible').count() === 0, 'Nonworking controls hide without JavaScript');
    await noScript.close();
    check(errors.length === 0, 'No browser script errors: ' + errors.join(', '));
    check(externalRequests.length === 0, 'No external requests during offline use');
    console.log(`Passed ${checks} checks across ten pages and five viewport widths; verified ${copyResult.actual.length} copy buttons.`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

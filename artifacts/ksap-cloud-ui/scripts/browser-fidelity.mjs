// Main-agent source-library checks, independent of the product journey tests.
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const pages = (process.argv[2] || "overview").split(",");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || execSync("command -v chromium").toString().trim(),
  headless: true, args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", e => errors.push(`${page.url()}: ${e.stack || e.message}`));
const evidence = [];
await mkdir("docs/references/screenshots", { recursive: true });
try {
  for (const id of pages) {
    for (const theme of ["light", "dark"]) {
      await page.goto(`http://localhost:80/ksap-cloud-ui/?theme=${theme}&palette=blue&density=standard#${id}`);
      await page.locator("#ksap-content h1").waitFor();
      await page.waitForFunction(() => !document.querySelector("#ksap-content [role=status]")?.textContent?.includes("Loading examples"));
      await page.waitForFunction(t => document.documentElement.dataset.theme === t, theme);
      const body = await page.locator("body").evaluate(el => ({
        font: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      if (!body.font.includes("Montserrat") || body.overflow) throw new Error(`${id}/${theme}: typography or overflow ${JSON.stringify(body)}`);
      await page.screenshot({ path: `docs/references/screenshots/${id}-${theme}.png` });
      if (["dialog","sheet","alert-dialog","popover","dropdown-menu"].includes(id)) {
        await page.locator("main button").first().click();
        const target = page.locator(id === "alert-dialog" ? '[role=alertdialog]' : ["dialog","sheet"].includes(id) ? '[role=dialog]' : id === "dropdown-menu" ? '[role=menu]' : '[data-slot=popover-content]').first();
        await target.waitFor();
        await page.screenshot({ path: `docs/references/screenshots/${id}-${theme}-open.png` });
        await page.keyboard.press("Escape");
        await target.waitFor({state:"hidden"});
      }
      if (id === "context-menu") {
        await page.getByText("Right click or long press", {exact:true}).click({button:"right"});
        await page.locator('[role=menu]').waitFor();
        await page.screenshot({ path: `docs/references/screenshots/${id}-${theme}-open.png` });
        await page.keyboard.press("Escape");
      }
      if (id === "tooltip" || id === "hover-card") {
        await page.locator("main button").first().hover();
        await page.locator(id==="tooltip"?'[role=tooltip]':'[data-slot=hover-card-content]').first().waitFor();
        await page.screenshot({path:`docs/references/screenshots/${id}-${theme}-open.png`});
        await page.mouse.move(0,0); await page.keyboard.press("Escape");
      }
      if (theme === "light") {
        const enabled = page.locator('main [role=checkbox]:not([data-disabled]),main [role=switch]:not([data-disabled])').first();
        if (await enabled.count()) {
          await enabled.focus();
          const before = await enabled.getAttribute("aria-checked");
          await page.keyboard.press("Space");
          if (before === await enabled.getAttribute("aria-checked")) throw new Error(`${id}: Space did not change checked state`);
        }
        const slider = page.locator('main [role=slider]:not([data-disabled])').first();
        if (await slider.count()) {
          await slider.focus();
          const before = await slider.getAttribute("aria-valuenow");
          await page.keyboard.press("ArrowRight");
          if (before === await slider.getAttribute("aria-valuenow")) throw new Error(`${id}: slider keyboard value did not change`);
        }
        const radio = page.locator('main [role=radio]:not([data-disabled])').first();
        if (await radio.count()) {
          await radio.focus(); await page.keyboard.press("ArrowDown");
          if (!await page.locator('main [role=radio][aria-checked=true]').count()) throw new Error(`${id}: radio keyboard selection failed`);
        }
        const combo = page.locator('main [role=combobox]:not(:disabled)').first();
        if (await combo.count()) {
          await combo.focus(); await page.keyboard.press("Space");
          await page.locator('[role=listbox],[cmdk-list]').first().waitFor({timeout:5000});
          await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
          await page.keyboard.press("Escape");
        }
        const toggle = page.locator('main button[aria-pressed]:not(:disabled)').first();
        if (await toggle.count()) {
          const before = await toggle.getAttribute("aria-pressed");
          await toggle.focus(); await page.keyboard.press("Space");
          if (before === await toggle.getAttribute("aria-pressed")) throw new Error(`${id}: toggle state did not change`);
        }
        const tab = page.locator('main [role=tab]').first();
        if (await tab.count()) {
          await tab.focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter");
          if (!await page.locator('main [role=tab][aria-selected=true]').count()) throw new Error(`${id}: tab keyboard selection failed`);
        }
      }
      evidence.push(`${id}/${theme}: rendered, source typography and width checked`);
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  await writeFile("docs/references/latest-browser-checks.json", JSON.stringify({ pages, checks: evidence, renderErrors: errors }, null, 2));
  console.log(evidence.join("\n"));
} finally { await browser.close(); }
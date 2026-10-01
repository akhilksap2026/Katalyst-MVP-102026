import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
const browser = await chromium.launch({ executablePath: execSync("command -v chromium").toString().trim(), args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(20000);
const errors = [];
page.on("pageerror", e => errors.push(e.message));
const report = [];
async function settings() {
  const trigger = page.getByTestId("display-settings");
  if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
  console.log("Settings items:", await page.getByRole("menuitemradio").allTextContents());
}
async function go(path) {
  console.log("Opening", path);
  await page.goto(`http://localhost:80${path}`);
  await page.locator("main").waitFor();
  await page.evaluate(async () => { await document.fonts.ready; });
  console.log("Rendered", path);
}
function check(ok, message) { if (!ok) throw Error(message); report.push(message); console.log(message); }
try {
  await go("/");
  check(await page.getByText("Catalyst", {exact:true}).count() > 0, "Home renders");
  await settings();
  await page.getByRole("menuitemradio", {name:"Dark", exact:true}).click();
  await settings();
  await page.getByRole("menuitemradio", {name:"Yellow", exact:true}).click();
  await settings();
  await page.getByRole("menuitemradio", {name:"Compact", exact:true}).click();
  await page.reload();
  check(await page.evaluate(() => document.documentElement.dataset.theme === "dark" && document.documentElement.dataset.palette === "yellow" && document.documentElement.dataset.density === "compact"), "Theme, palette and density persist");
  await page.getByRole("button", {name:"Sign in to demo session"}).click();
  await page.getByRole("button", {name:"Account menu for Demo consultant"}).waitFor();
  await page.getByRole("button", {name:"Account menu for Demo consultant"}).click();
  await page.getByRole("menuitem", {name:"Sign out", exact:true}).click();
  report.push("Demo sign-in and sign-out");
  await page.getByRole("button", {name:"Open assistant",exact:true}).click();
  await page.getByRole("textbox", {name:"Ask the assistant"}).fill("What is a shipment?");
  await page.getByRole("button", {name:"Send",exact:true}).click();
  await page.waitForTimeout(500);
  check((await page.locator('[role=dialog]').innerText()).includes("shipment"), "Local assistant replies");
  await page.keyboard.press("Escape");
  await go("/agents");
  await page.getByTestId("agents-try-sample").click();
  await page.getByTestId("agents-compare").click();
  await page.getByTestId("agents-row-CARRIER_PERF_WEEKLY").waitFor();
  await page.getByTestId("agents-row-CARRIER_PERF_WEEKLY").click();
  check(await page.getByTestId("agents-row-UAT_DATA_PURGE").count() === 1, "Comparison renders changed and only-DEV records");
  const csv = page.waitForEvent("download");
  await page.getByTestId("agents-export-csv").click();
  check((await csv).suggestedFilename().endsWith(".csv"), "Comparison CSV download");
  const excel = page.waitForEvent("download");
  await page.getByTestId("agents-export-xlsx").click();
  check((await excel).suggestedFilename().endsWith(".xlsx"), "Comparison Excel download");
  await page.getByTestId("agents-copy-summary").click();
  check((await page.evaluate(() => navigator.clipboard.readText())).length > 20, "Comparison clipboard summary");
  const handle = page.getByRole("separator", {name:"Resize detail panel"});
  await handle.focus();
  const before = await handle.getAttribute("aria-valuenow");
  await page.keyboard.press("ArrowDown");
  check(before !== await handle.getAttribute("aria-valuenow"), "Results split keyboard resizing");
  await go("/list");
  await page.getByRole("textbox", {name:"Input values",exact:true}).fill("KSAP.ORD-2\nKSAP.ORD-10\nKSAP.ORD-2");
  const output = await page.getByRole("textbox", {name:"Output values",exact:true}).inputValue();
  check(output.includes("ORD-2") && output.includes("ORD-10"), "List transforms input");
  const listDownload = page.waitForEvent("download");
  await page.getByRole("button", {name:"Download .txt",exact:true}).click();
  check((await listDownload).suggestedFilename().endsWith(".txt"), "List download");
  await go("/dictionary/26A/SHIPMENT");
  await page.getByRole("tab", {name:"SQL",exact:true}).click();
  check((await page.locator("main").innerText()).includes("SHIPMENT"), "Dictionary detail SQL");
  await go("/dictionary/joins");
  await page.getByRole("button", {name:"Find paths",exact:true}).click();
  check((await page.locator("main").innerText()).includes("SHIPMENT_STOP"), "Dictionary join path discovery");
  await go("/planned/migration");
  check((await page.locator("main").innerText()).toLowerCase().includes("planned"), "Planned page remains honest");
  await page.setViewportSize({width:390,height:844});
  for (const route of ["/", "/agents", "/list", "/dictionary"]) {
    await go(route);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Mobile width ${route}`);
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(report.join("\n"));
} finally { await browser.close(); }
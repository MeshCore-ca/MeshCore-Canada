import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { launch } from "chrome-launcher";
import lighthouse, { desktopConfig } from "lighthouse";
import { normalizeSiteBaseUrl, resolveSiteRoute } from "../tests/browser/site-route.mjs";

const suppliedBaseUrl = process.env.LIGHTHOUSE_BASE_URL;
const baseUrl = normalizeSiteBaseUrl(suppliedBaseUrl || "http://127.0.0.1:4174/");
const routes = [
  ["home", "/"],
  ["start", "/start/"],
  ["communities", "/provinces/"],
  ["config", "/config/"],
  ["submit-idea", "/submit-idea/"]
];
const budgets = {
  performance: 0.8,
  accessibility: 0.95,
  "best-practices": 0.9,
  seo: 0.9
};

let server;
let chrome;

function startServer() {
  if (suppliedBaseUrl) return undefined;
  const command = process.platform === "win32" ? "python.exe" : "python3";
  return spawn(
    command,
    ["-m", "http.server", "4174", "--bind", "127.0.0.1", "--directory", ".tmp/site"],
    { stdio: "ignore", windowsHide: true }
  );
}

async function waitForServer(url, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // The bounded retry below handles server startup.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function scoreSummary(result) {
  return Object.fromEntries(
    Object.keys(budgets).map((name) => [name, result.lhr.categories[name]?.score ?? 0])
  );
}

function hasNoIndex(html) {
  return /<meta\s+name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html);
}

async function run() {
  server = startServer();
  await waitForServer(baseUrl);
  await mkdir(".tmp/lighthouse", { recursive: true });
  chrome = await launch({
    chromePath: process.env.CHROME_PATH || undefined,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"]
  });

  const failures = [];
  for (const [name, route] of routes) {
    const url = resolveSiteRoute(baseUrl, route);
    const html = await (await fetch(url)).text();
    const intentionallyNoIndex = hasNoIndex(html);
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: Object.keys(budgets)
    }, desktopConfig);
    if (!result) throw new Error(`Lighthouse returned no result for ${url}`);

    await writeFile(
      `.tmp/lighthouse/${name}.json`,
      typeof result.report === "string" ? result.report : JSON.stringify(result.report),
      "utf8"
    );
    const scores = scoreSummary(result);
    console.log(`${name}: ${JSON.stringify(scores)}`);
    for (const [category, minimum] of Object.entries(budgets)) {
      if (category === "seo" && intentionallyNoIndex) continue;
      if (scores[category] < minimum) {
        failures.push(`${name} ${category} ${scores[category]} < ${minimum}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`Lighthouse budgets failed:\n- ${failures.join("\n- ")}`);
  }
}

try {
  await run();
} finally {
  if (chrome) await chrome.kill();
  if (server) server.kill();
}

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import process from "node:process";

const siteRoot = resolve(process.argv[2] || ".tmp/site");
const publicOrigin = "https://meshcore.ca";
const attributePattern = /\b(?:href|src)=["']([^"']+)["']/gi;
const ignoredSchemes = /^(?:data|mailto|tel|javascript|blob):/i;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function pagePath(file) {
  const local = relative(siteRoot, file).split(sep).join("/");
  if (local === "index.html") return "/";
  if (local.endsWith("/index.html")) return `/${local.slice(0, -"index.html".length)}`;
  return `/${local}`;
}

function decodeAttribute(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (_error) {
    return false;
  }
}

async function resolveTarget(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (_error) {
    return { error: "invalid URL encoding" };
  }
  const local = decoded.replace(/^\/+/, "");
  const candidates = [];
  if (!local) candidates.push(join(siteRoot, "index.html"));
  else if (decoded.endsWith("/")) candidates.push(join(siteRoot, local, "index.html"));
  else {
    candidates.push(join(siteRoot, local));
    if (!extname(local)) {
      candidates.push(join(siteRoot, local, "index.html"));
      candidates.push(join(siteRoot, `${local}.html`));
    }
  }
  for (const candidate of candidates) {
    if (await isFile(candidate)) return { path: candidate };
  }
  return { error: `missing target ${decoded}` };
}

async function hasExactCase(path) {
  const local = relative(siteRoot, path);
  if (!local || local.startsWith("..")) return !local;
  let current = siteRoot;
  for (const part of local.split(sep)) {
    const names = await readdir(current);
    if (!names.includes(part)) return false;
    current = join(current, part);
  }
  return true;
}

function hasAnchor(text, fragment) {
  let id;
  try {
    id = decodeURIComponent(fragment);
  } catch (_error) {
    return false;
  }
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:id|name)=["']${escaped}["']`).test(text);
}

async function main() {
  const files = await walk(siteRoot);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const failures = new Set();
  let checked = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const base = new URL(pagePath(file), publicOrigin);
    for (const match of html.matchAll(attributePattern)) {
      const raw = decodeAttribute(match[1].trim());
      if (!raw || raw === "#" || raw.startsWith("//") || ignoredSchemes.test(raw)) continue;

      let url;
      try {
        url = new URL(raw, base);
      } catch (_error) {
        failures.add(`${pagePath(file)} -> ${raw}: invalid URL`);
        continue;
      }
      if (url.origin !== publicOrigin) continue;
      checked += 1;
      const target = await resolveTarget(url.pathname);
      if (!target.path) {
        failures.add(`${pagePath(file)} -> ${raw}: ${target.error}`);
        continue;
      }
      if (!(await hasExactCase(target.path))) {
        failures.add(`${pagePath(file)} -> ${raw}: path casing differs from disk`);
        continue;
      }
      if (url.hash && [".html", ".svg"].includes(extname(target.path).toLowerCase())) {
        const targetText = target.path === file ? html : await readFile(target.path, "utf8");
        if (!hasAnchor(targetText, url.hash.slice(1))) {
          failures.add(`${pagePath(file)} -> ${raw}: missing fragment target`);
        }
      }
    }
  }

  if (failures.size) {
    console.error(`Built-link validation failed with ${failures.size} problem(s):`);
    for (const failure of [...failures].sort()) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Built-link validation passed for ${htmlFiles.length} pages and ${checked} local references.`);
}

await main();

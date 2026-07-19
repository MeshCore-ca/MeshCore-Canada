import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const noIndexPattern =
  /<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b[^"']*["'][^>]*>/i;
const canonicalPattern =
  /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function fallbackUrl(siteRoot, file, origin) {
  const local = relative(siteRoot, file).split(sep).join("/");
  const pathname = local === "index.html"
    ? "/"
    : `/${local.replace(/(?:^|\/)index\.html$/, "/")}`;
  return new URL(pathname, origin).href;
}

export async function postprocessSite(siteDirectory, options = {}) {
  const siteRoot = resolve(siteDirectory);
  const sitemapPath = join(siteRoot, "sitemap.xml");
  if (!(await stat(sitemapPath)).isFile()) {
    throw new Error(`Missing sitemap: ${sitemapPath}`);
  }

  const htmlFiles = (await walk(siteRoot)).filter((file) => file.endsWith(".html"));
  const sitemapSource = await readFile(sitemapPath, "utf8");
  const firstLocation = sitemapSource.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const origin = firstLocation ? new URL(firstLocation).origin : "https://meshcore.ca";
  const noIndexUrls = new Set();

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    if (!noIndexPattern.test(html)) continue;
    const canonical = html.match(canonicalPattern)?.[1];
    noIndexUrls.add(canonical || fallbackUrl(siteRoot, file, origin));
  }

  const filteredSitemap = sitemapSource.replace(
    /\s*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g,
    (block, location) => (noIndexUrls.has(location) ? "" : block),
  );
  await writeFile(sitemapPath, `${filteredSitemap.trim()}\n`, "utf8");

  const manifest = {
    schema: "meshcore-canada-site-manifest-v1",
    revision:
      options.revision ||
      process.env.MCC_SITE_REVISION ||
      process.env.GITHUB_SHA ||
      "local-preview",
    generatedAt: options.generatedAt || new Date().toISOString(),
    siteOrigin: origin,
    pageCount: htmlFiles.length,
    indexedPageCount: htmlFiles.length - noIndexUrls.size,
    noIndexPageCount: noIndexUrls.size,
    sitemapSha256: createHash("sha256").update(filteredSitemap).digest("hex"),
  };
  await writeFile(
    join(siteRoot, "site-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return manifest;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const siteRoot = process.argv[2] || ".tmp/site";
  const manifest = await postprocessSite(siteRoot);
  console.log(
    `Post-processed ${manifest.pageCount} pages; ${manifest.noIndexPageCount} excluded from indexing.`,
  );
}

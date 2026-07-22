import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import process from "node:process";

const robotsMetaPattern =
  /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i;
const noIndexPattern =
  /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i;
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

function ensureNoIndex(html, file) {
  if (robotsMetaPattern.test(html)) {
    return html.replace(
      robotsMetaPattern,
      '<meta name="robots" content="noindex, nofollow">',
    );
  }
  if (!/<\/head\s*>/i.test(html)) {
    throw new Error(`Cannot apply preview noindex; missing </head> in ${file}`);
  }
  return html.replace(
    /<\/head\s*>/i,
    '  <meta name="robots" content="noindex, nofollow">\n</head>',
  );
}

function fallbackUrl(siteRoot, file, siteBaseUrl) {
  const local = relative(siteRoot, file).split(sep).join("/");
  const route = local === "index.html"
    ? "./"
    : local.replace(/(?:^|\/)index\.html$/, "/");
  return new URL(route, siteBaseUrl).href;
}

async function hashArtifact(siteRoot) {
  const files = (await walk(siteRoot))
    .map((file) => ({
      file,
      name: relative(siteRoot, file).split(sep).join("/"),
    }))
    .filter(({ name }) => name !== "site-manifest.json")
    .sort((left, right) => {
      if (left.name < right.name) return -1;
      if (left.name > right.name) return 1;
      return 0;
    });
  const hash = createHash("sha256");

  for (const { file, name } of files) {
    const content = await readFile(file);
    hash.update(name, "utf8");
    hash.update("\0", "utf8");
    hash.update(String(content.byteLength), "utf8");
    hash.update("\0", "utf8");
    hash.update(content);
    hash.update("\0", "utf8");
  }

  return hash.digest("hex");
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
  const rootHtml = await readFile(join(siteRoot, "index.html"), "utf8").catch(() => "");
  const rootCanonical = rootHtml.match(canonicalPattern)?.[1];
  const siteBaseUrl = new URL(
    options.siteUrl || rootCanonical || firstLocation || "https://meshcore.ca/",
  );
  const origin = siteBaseUrl.origin;
  const noIndexUrls = new Set();
  let noIndexPageCount = 0;

  for (const file of htmlFiles) {
    let html = await readFile(file, "utf8");
    if (options.noIndexAll) {
      const noIndexedHtml = ensureNoIndex(html, file);
      if (noIndexedHtml !== html) {
        html = noIndexedHtml;
        await writeFile(file, html, "utf8");
      }
    }
    if (!noIndexPattern.test(html)) continue;
    noIndexPageCount += 1;
    const pageUrl = fallbackUrl(siteRoot, file, siteBaseUrl);
    const canonical = html.match(canonicalPattern)?.[1];
    noIndexUrls.add(pageUrl);
    if (canonical) noIndexUrls.add(new URL(canonical, pageUrl).href);
  }

  const filteredSitemap = sitemapSource.replace(
    /\s*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g,
    (block, location) => (noIndexUrls.has(location) ? "" : block),
  );
  const sitemapOutput = `${filteredSitemap.trim()}\n`;
  await writeFile(sitemapPath, sitemapOutput, "utf8");
  await writeFile(
    join(siteRoot, "sitemap.xml.gz"),
    gzipSync(Buffer.from(sitemapOutput, "utf8"), { level: 9, mtime: 0 }),
  );

  const manifest = {
    schema: "meshcore-canada-site-manifest-v1",
    revision:
      options.revision ||
      process.env.MCC_SITE_REVISION ||
      process.env.GITHUB_SHA ||
      "local-preview",
    generatedAt: options.generatedAt || new Date().toISOString(),
    siteOrigin: origin,
    siteBaseUrl: siteBaseUrl.href,
    pageCount: htmlFiles.length,
    indexedPageCount: htmlFiles.length - noIndexPageCount,
    noIndexPageCount,
    sitemapSha256: createHash("sha256").update(sitemapOutput).digest("hex"),
    artifactSha256: await hashArtifact(siteRoot),
  };
  await writeFile(
    join(siteRoot, "site-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return manifest;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const supportedFlags = new Set(["--noindex-all"]);
  const unsupportedFlag = args.find(
    (argument) => argument.startsWith("--") && !supportedFlags.has(argument),
  );
  if (unsupportedFlag) throw new Error(`Unsupported option: ${unsupportedFlag}`);
  const siteRoot = args.find((argument) => !argument.startsWith("--")) || ".tmp/site";
  const manifest = await postprocessSite(siteRoot, {
    noIndexAll: args.includes("--noindex-all"),
  });
  console.log(
    `Post-processed ${manifest.pageCount} pages; ${manifest.noIndexPageCount} excluded from indexing.`,
  );
}

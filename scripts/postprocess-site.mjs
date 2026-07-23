import { createHash } from "node:crypto";
import {
  cp,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import process from "node:process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const robotsMetaPattern =
  /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i;
const noIndexPattern =
  /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i;
const canonicalPattern =
  /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i;
const alternateTagPattern =
  /<link\b(?=[^>]*\brel=["']alternate["'])[^>]*>/gi;
const languageMenuAnchorPattern =
  /<a\b(?=[^>]*\bclass=["'][^"']*\bmd-select__link\b)(?=[^>]*\bhreflang=["'](?:en|fr)["'])[^>]*>/gi;

function rewriteAlternateLinks(html, siteBaseUrl, pageName) {
  if (pageName === "404.html") {
    return html
      .replace(alternateTagPattern, "")
      .replace(languageMenuAnchorPattern, (tag) => {
        const language = tag.match(/\bhreflang=["'](en|fr)["']/i)?.[1]?.toLowerCase();
        const route = language === "fr" ? "fr/" : "";
        const absoluteHref = new URL(route, siteBaseUrl).href;
        return tag.replace(/\bhref=["'][^"']*["']/i, `href="${absoluteHref}"`);
      });
  }

  const equivalentPage = pageName.startsWith("fr/")
    ? pageName.slice("fr/".length)
    : pageName;
  const equivalentRoute = equivalentPage.endsWith("index.html")
    ? equivalentPage.slice(0, -"index.html".length)
    : equivalentPage;

  return html.replace(alternateTagPattern, (tag) => {
    const language = tag.match(/\bhreflang=["'](en|fr)["']/i)?.[1]?.toLowerCase();
    if (!language) return tag;
    const route = language === "fr" ? `fr/${equivalentRoute}` : equivalentRoute;
    const absoluteHref = new URL(route, siteBaseUrl).href;
    return tag.replace(/\bhref=["'][^"']*["']/i, `href="${absoluteHref}"`);
  });
}

async function pathStat(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function isDirectory(path) {
  return (await pathStat(path))?.isDirectory() || false;
}

function assertBuildDestination(siteRoot, destination) {
  const resolvedRoot = resolve(siteRoot);
  const resolvedDestination = resolve(destination);
  const fromRoot = relative(resolvedRoot, resolvedDestination);
  if (
    !fromRoot ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new Error(`Bilingual asset destination escapes the site root: ${destination}`);
  }
}

async function mirrorDirectory(siteRoot, source, destination, required) {
  const sourceStat = await pathStat(source);
  if (!sourceStat) {
    if (required) throw new Error(`Missing required built directory: ${source}`);
    return false;
  }
  if (!sourceStat.isDirectory()) {
    throw new Error(`Expected built directory: ${source}`);
  }
  assertBuildDestination(siteRoot, destination);
  await rm(destination, { recursive: true, force: true });
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
  return true;
}

async function copyBuiltFile(siteRoot, source, destination, required) {
  const sourceStat = await pathStat(source);
  if (!sourceStat) {
    if (required) throw new Error(`Missing required built file: ${source}`);
    return false;
  }
  if (!sourceStat.isFile()) {
    throw new Error(`Expected built file: ${source}`);
  }
  assertBuildDestination(siteRoot, destination);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  return true;
}

async function prepareBilingualAssets(siteRoot, docsDirectory) {
  const realBuild = await isDirectory(join(siteRoot, "assets", "stylesheets"));
  const builtRegions = join(siteRoot, "assets", "regions");
  const hasBuiltRegionAssets = await isDirectory(builtRegions);

  if (realBuild && !hasBuiltRegionAssets) {
    throw new Error(`Missing required built directory: ${builtRegions}`);
  }

  if (realBuild || hasBuiltRegionAssets) {
    const source = join(
      docsDirectory,
      "assets",
      "regions",
      "canada-region-partition.qa.json",
    );
    const sourceStat = await pathStat(source);
    if (!sourceStat?.isFile()) {
      throw new Error(`Missing required release-audit source: ${source}`);
    }
    await copyBuiltFile(
      siteRoot,
      source,
      join(builtRegions, "canada-region-partition.qa.json"),
      true,
    );
  }

  await mirrorDirectory(
    siteRoot,
    join(siteRoot, "hardware", "images"),
    join(siteRoot, "fr", "hardware", "images"),
    realBuild,
  );

  const frenchEditor = join(siteRoot, "fr", "config", "editor");
  if (await mirrorDirectory(
    siteRoot,
    join(siteRoot, "config", "editor"),
    frenchEditor,
    realBuild,
  )) {
    const editorIndex = join(frenchEditor, "index.html");
    const html = await readFile(editorIndex, "utf8");
    await writeFile(
      editorIndex,
      html
        .replaceAll("../../assets/", "../../../assets/")
        .replace('<html lang="en">', '<html lang="fr">')
        .replace(
          'data-editor-language="en" href="./"',
          'data-editor-language="en" href="../../../config/editor/"',
        )
        .replace(
          'data-editor-language="fr" href="../../fr/config/editor/"',
          'data-editor-language="fr" href="./"',
        )
        .replaceAll(
          "../standard/#cross-province-repeater-areas",
          "../standard/#zones-de-repeteurs-interprovinciales",
        ),
      "utf8",
    );
  }

  for (const name of ["location-codes.json", "observer-config.json"]) {
    await copyBuiltFile(
      siteRoot,
      join(siteRoot, "analyzer", name),
      join(siteRoot, "fr", "analyzer", name),
      realBuild,
    );
  }
}

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

  await prepareBilingualAssets(
    siteRoot,
    resolve(options.docsDirectory || join(projectRoot, "docs")),
  );

  const htmlFiles = (await walk(siteRoot)).filter((file) => file.endsWith(".html"));
  const localePageCounts = htmlFiles.reduce(
    (counts, file) => {
      const name = relative(siteRoot, file).split(sep).join("/");
      counts[name.startsWith("fr/") ? "fr" : "en"] += 1;
      return counts;
    },
    { en: 0, fr: 0 },
  );
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
    const originalHtml = html;
    const pageName = relative(siteRoot, file).split(sep).join("/");
    html = rewriteAlternateLinks(html, siteBaseUrl, pageName);
    if (options.noIndexAll) html = ensureNoIndex(html, file);
    if (html !== originalHtml) await writeFile(file, html, "utf8");
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
    localePageCounts,
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

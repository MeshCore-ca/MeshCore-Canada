import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { gunzipSync, gzipSync } from "node:zlib";

import { postprocessSite } from "../../scripts/postprocess-site.mjs";

test("noindex pages are removed from the sitemap and recorded in the manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-postprocess-"));
  try {
    await mkdir(join(root, "draft"), { recursive: true });
    await mkdir(join(root, "raw"), { recursive: true });
    await writeFile(
      join(root, "index.html"),
      '<link rel="canonical" href="https://canadaverse.org/meshcore-canada/"><link rel="alternate" href="/meshcore-canada/fr/" hreflang="fr">',
      "utf8",
    );
    await writeFile(
      join(root, "draft", "index.html"),
      '<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://canadaverse.org/meshcore-canada/draft/">',
      "utf8",
    );
    await writeFile(
      join(root, "raw", "index.html"),
      '<meta name="robots" content="noindex, nofollow">',
      "utf8",
    );
    const sitemapSource = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<url><loc>https://canadaverse.org/meshcore-canada/</loc></url>",
      "<url><loc>https://canadaverse.org/meshcore-canada/draft/</loc></url>",
      "<url><loc>https://canadaverse.org/meshcore-canada/raw/</loc></url>",
      "</urlset>",
    ].join("\n");
    await writeFile(join(root, "sitemap.xml"), sitemapSource, "utf8");
    await writeFile(join(root, "sitemap.xml.gz"), gzipSync(sitemapSource));

    const manifest = await postprocessSite(root, {
      revision: "test-sha",
      generatedAt: "2026-07-19T00:00:00.000Z",
    });
    const home = await readFile(join(root, "index.html"), "utf8");
    const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
    const sitemapGzip = gunzipSync(
      await readFile(join(root, "sitemap.xml.gz")),
    ).toString("utf8");
    const savedManifest = JSON.parse(
      await readFile(join(root, "site-manifest.json"), "utf8"),
    );

    assert.match(sitemap, /https:\/\/canadaverse\.org\/meshcore-canada\/<\/loc>/);
    assert.match(home, /href="https:\/\/canadaverse\.org\/meshcore-canada\/fr\/" hreflang="fr"/);
    assert.doesNotMatch(sitemap, /meshcore-canada\/(?:draft|raw)\//);
    assert.equal(sitemapGzip, sitemap);
    assert.equal(manifest.indexedPageCount, 1);
    assert.equal(savedManifest.revision, "test-sha");
    assert.equal(savedManifest.noIndexPageCount, 2);
    assert.equal(savedManifest.siteBaseUrl, "https://canadaverse.org/meshcore-canada/");
    assert.deepEqual(savedManifest.localePageCounts, { en: 3, fr: 0 });
    assert.match(savedManifest.artifactSha256, /^[a-f0-9]{64}$/);

    const repeated = await postprocessSite(root, {
      revision: "a-different-revision",
      generatedAt: "2026-07-22T00:00:00.000Z",
    });
    assert.equal(repeated.artifactSha256, savedManifest.artifactSha256);

    await writeFile(join(root, "asset.txt"), "changed artifact content\n", "utf8");
    const changed = await postprocessSite(root, {
      revision: "test-sha",
      generatedAt: "2026-07-19T00:00:00.000Z",
    });
    assert.notEqual(changed.artifactSha256, savedManifest.artifactSha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("language alternates target equivalent English and French routes", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-language-alternates-"));
  try {
    await mkdir(join(root, "hardware"), { recursive: true });
    await mkdir(join(root, "fr", "hardware"), { recursive: true });
    await writeFile(
      join(root, "index.html"),
      '<link rel="canonical" href="https://canadaverse.org/meshcore-canada/">',
      "utf8",
    );
    const staleAlternates = [
      '<link rel="alternate" href="/meshcore-canada/" hreflang="en">',
      '<link rel="alternate" href="/meshcore-canada/fr/" hreflang="fr">',
    ].join("");
    await writeFile(join(root, "hardware", "index.html"), staleAlternates, "utf8");
    await writeFile(join(root, "fr", "hardware", "index.html"), staleAlternates, "utf8");
    const stale404 = staleAlternates + [
      '<a class="md-select__link" href="/meshcore-canada/tools/" hreflang="en">English</a>',
      '<a class="md-select__link" href="/meshcore-canada/fr/tools/" hreflang="fr">Français</a>',
    ].join("");
    await writeFile(join(root, "404.html"), stale404, "utf8");
    const sitemapSource = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<url><loc>https://canadaverse.org/meshcore-canada/</loc></url>",
      "</urlset>",
    ].join("\n");
    await writeFile(join(root, "sitemap.xml"), sitemapSource, "utf8");
    await writeFile(join(root, "sitemap.xml.gz"), gzipSync(sitemapSource));

    await postprocessSite(root, {
      revision: "language-test-sha",
      generatedAt: "2026-07-23T00:00:00.000Z",
    });

    for (const page of [
      join(root, "hardware", "index.html"),
      join(root, "fr", "hardware", "index.html"),
    ]) {
      const html = await readFile(page, "utf8");
      assert.match(html, /href="https:\/\/canadaverse\.org\/meshcore-canada\/hardware\/" hreflang="en"/);
      assert.match(html, /href="https:\/\/canadaverse\.org\/meshcore-canada\/fr\/hardware\/" hreflang="fr"/);
    }
    const notFound = await readFile(join(root, "404.html"), "utf8");
    assert.doesNotMatch(notFound, /rel="alternate"/);
    assert.match(notFound, /href="https:\/\/canadaverse\.org\/meshcore-canada\/" hreflang="en"/);
    assert.match(notFound, /href="https:\/\/canadaverse\.org\/meshcore-canada\/fr\/" hreflang="fr"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("real builds mirror shared assets required by French routes", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-bilingual-assets-"));
  const docs = await mkdtemp(join(tmpdir(), "mcc-docs-bilingual-assets-"));
  try {
    await mkdir(join(root, "assets", "stylesheets"), { recursive: true });
    await mkdir(join(root, "assets", "regions"), { recursive: true });
    await mkdir(join(root, "hardware", "images"), { recursive: true });
    await mkdir(join(root, "config", "editor"), { recursive: true });
    await mkdir(join(root, "analyzer"), { recursive: true });
    await mkdir(join(docs, "assets", "regions"), { recursive: true });

    await writeFile(
      join(root, "index.html"),
      '<link rel="canonical" href="https://canadaverse.org/meshcore-canada/"><link rel="alternate" href="/meshcore-canada/fr/" hreflang="fr">',
      "utf8",
    );
    await writeFile(
      join(root, "hardware", "images", "solar.jpg"),
      "solar image bytes",
      "utf8",
    );
    await writeFile(
      join(root, "config", "editor", "index.html"),
      [
        '<html lang="en">',
        '<script src="../../assets/javascripts/i18n-runtime.js"></script>',
        '<a data-editor-language="en" href="./">English</a>',
        '<a data-editor-language="fr" href="../../fr/config/editor/">Français</a>',
        '<a href="../standard/#cross-province-repeater-areas">Read the rule</a>',
        "</html>",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      join(root, "analyzer", "location-codes.json"),
      '{"YYZ":"Toronto"}',
      "utf8",
    );
    await writeFile(
      join(root, "analyzer", "observer-config.json"),
      '{"observer":true}',
      "utf8",
    );
    await writeFile(
      join(docs, "assets", "regions", "canada-region-partition.qa.json"),
      '{"status":"pass"}',
      "utf8",
    );

    const sitemapSource = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<url><loc>https://canadaverse.org/meshcore-canada/</loc></url>",
      "</urlset>",
    ].join("\n");
    await writeFile(join(root, "sitemap.xml"), sitemapSource, "utf8");
    await writeFile(join(root, "sitemap.xml.gz"), gzipSync(sitemapSource));

    const manifest = await postprocessSite(root, {
      docsDirectory: docs,
      revision: "bilingual-test-sha",
      generatedAt: "2026-07-23T00:00:00.000Z",
    });

    assert.equal(
      await readFile(
        join(root, "assets", "regions", "canada-region-partition.qa.json"),
        "utf8",
      ),
      '{"status":"pass"}',
    );
    assert.equal(
      await readFile(join(root, "fr", "hardware", "images", "solar.jpg"), "utf8"),
      "solar image bytes",
    );
    const frenchEditor = await readFile(
      join(root, "fr", "config", "editor", "index.html"),
      "utf8",
    );
    assert.match(frenchEditor, /\.\.\/\.\.\/\.\.\/assets\/javascripts\/i18n-runtime\.js/);
    assert.match(frenchEditor, /<html lang="fr">/);
    assert.match(frenchEditor, /data-editor-language="en" href="\.\.\/\.\.\/\.\.\/config\/editor\/"/);
    assert.match(frenchEditor, /data-editor-language="fr" href="\.\/"/);
    assert.doesNotMatch(frenchEditor, /src="\.\.\/\.\.\/assets\//);
    assert.match(
      frenchEditor,
      /href="\.\.\/standard\/#zones-de-repeteurs-interprovinciales"/,
    );
    assert.equal(
      await readFile(join(root, "fr", "analyzer", "location-codes.json"), "utf8"),
      '{"YYZ":"Toronto"}',
    );
    assert.equal(
      await readFile(join(root, "fr", "analyzer", "observer-config.json"), "utf8"),
      '{"observer":true}',
    );
    assert.deepEqual(manifest.localePageCounts, { en: 2, fr: 1 });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(docs, { recursive: true, force: true });
  }
});

test("release-audit data is required when region assets are built", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-release-audit-"));
  try {
    await mkdir(join(root, "assets", "regions"), { recursive: true });
    await writeFile(join(root, "sitemap.xml"), "<urlset></urlset>", "utf8");
    await assert.rejects(
      postprocessSite(root, { docsDirectory: join(root, "missing-docs") }),
      /Missing required release-audit source/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("noindex-all injects robots metadata into every HTML page", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-preview-noindex-"));
  try {
    await mkdir(join(root, "legacy"), { recursive: true });
    await writeFile(
      join(root, "index.html"),
      '<html><head><link rel="canonical" href="https://canadaverse.org/meshcore-canada/"><meta name="robots" content="noindex"></head><body>Home</body></html>',
      "utf8",
    );
    await writeFile(
      join(root, "legacy", "index.html"),
      '<html><head><link rel="canonical" href="../"></head><body>Redirect wrapper</body></html>',
      "utf8",
    );
    const sitemapSource = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<url><loc>https://canadaverse.org/meshcore-canada/</loc></url>",
      "<url><loc>https://canadaverse.org/meshcore-canada/legacy/</loc></url>",
      "</urlset>",
    ].join("\n");
    await writeFile(join(root, "sitemap.xml"), sitemapSource, "utf8");
    await writeFile(join(root, "sitemap.xml.gz"), gzipSync(sitemapSource));

    const manifest = await postprocessSite(root, {
      noIndexAll: true,
      revision: "preview-sha",
      generatedAt: "2026-07-22T00:00:00.000Z",
    });
    const home = await readFile(join(root, "index.html"), "utf8");
    const redirect = await readFile(join(root, "legacy", "index.html"), "utf8");
    const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
    const sitemapGzip = gunzipSync(
      await readFile(join(root, "sitemap.xml.gz")),
    ).toString("utf8");

    assert.equal((home.match(/name="robots"/g) || []).length, 1);
    assert.match(home, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(redirect, /<meta name="robots" content="noindex, nofollow">/);
    assert.doesNotMatch(sitemap, /<loc>/);
    assert.equal(sitemapGzip, sitemap);
    assert.equal(manifest.noIndexPageCount, manifest.pageCount);
    assert.equal(manifest.noIndexPageCount, 2);
    assert.equal(manifest.indexedPageCount, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

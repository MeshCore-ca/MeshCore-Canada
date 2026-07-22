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
      '<link rel="canonical" href="https://canadaverse.org/meshcore-canada/">',
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
    const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
    const sitemapGzip = gunzipSync(
      await readFile(join(root, "sitemap.xml.gz")),
    ).toString("utf8");
    const savedManifest = JSON.parse(
      await readFile(join(root, "site-manifest.json"), "utf8"),
    );

    assert.match(sitemap, /https:\/\/canadaverse\.org\/meshcore-canada\/<\/loc>/);
    assert.doesNotMatch(sitemap, /meshcore-canada\/(?:draft|raw)\//);
    assert.equal(sitemapGzip, sitemap);
    assert.equal(manifest.indexedPageCount, 1);
    assert.equal(savedManifest.revision, "test-sha");
    assert.equal(savedManifest.noIndexPageCount, 2);
    assert.equal(savedManifest.siteBaseUrl, "https://canadaverse.org/meshcore-canada/");
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
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { postprocessSite } from "../../scripts/postprocess-site.mjs";

test("noindex pages are removed from the sitemap and recorded in the manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "mcc-site-postprocess-"));
  try {
    await mkdir(join(root, "draft"), { recursive: true });
    await writeFile(
      join(root, "index.html"),
      '<link rel="canonical" href="https://meshcore.ca/">',
      "utf8",
    );
    await writeFile(
      join(root, "draft", "index.html"),
      '<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://meshcore.ca/draft/">',
      "utf8",
    );
    await writeFile(
      join(root, "sitemap.xml"),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "<url><loc>https://meshcore.ca/</loc></url>",
        "<url><loc>https://meshcore.ca/draft/</loc></url>",
        "</urlset>",
      ].join("\n"),
      "utf8",
    );

    const manifest = await postprocessSite(root, {
      revision: "test-sha",
      generatedAt: "2026-07-19T00:00:00.000Z",
    });
    const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
    const savedManifest = JSON.parse(
      await readFile(join(root, "site-manifest.json"), "utf8"),
    );

    assert.match(sitemap, /https:\/\/meshcore\.ca\/<\/loc>/);
    assert.doesNotMatch(sitemap, /https:\/\/meshcore\.ca\/draft\//);
    assert.equal(manifest.indexedPageCount, 1);
    assert.equal(savedManifest.revision, "test-sha");
    assert.equal(savedManifest.noIndexPageCount, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

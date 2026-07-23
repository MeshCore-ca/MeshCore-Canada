import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildCommunityIdea, buildFrenchSubmissionText } from "../../docs/javascripts/community-submission.js";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const docs = join(root, "docs");

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") return [];
      return markdownFiles(path);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  }));
  return nested.flat();
}

test("every public English page has a matching French source page", async () => {
  const pages = await markdownFiles(docs);
  const english = pages.filter((path) => !path.endsWith(".fr.md"));
  const french = new Set(
    pages.filter((path) => path.endsWith(".fr.md"))
      .map((path) => relative(docs, path).replace(/\.fr\.md$/, ".md")),
  );

  assert.ok(english.length >= 50, "translation parity should cover the whole site, not a sample");
  const missing = english
    .map((path) => relative(docs, path))
    .filter((path) => !french.has(path));
  assert.deepEqual(missing, []);

  for (const path of pages.filter((value) => value.endsWith(".fr.md"))) {
    await access(path.replace(/\.fr\.md$/, ".md"));
  }
});

test("MkDocs uses the pinned bilingual plugin and a route-preserving switcher", async () => {
  const [requirements, config, alternate] = await Promise.all([
    readFile(join(root, "requirements-docs.txt"), "utf8"),
    readFile(join(root, "mkdocs.yml"), "utf8"),
    readFile(join(root, "overrides", "partials", "alternate.html"), "utf8"),
  ]);

  assert.match(requirements, /^mkdocs-static-i18n==1\.3\.1$/m);
  assert.match(config, /^\s+- i18n:$/m);
  assert.match(config, /^\s+docs_structure: suffix$/m);
  assert.match(config, /^\s+fallback_to_default: true$/m);
  assert.match(config, /^\s+- locale: fr$/m);
  assert.match(config, /^\s+name: Français$/m);
  assert.match(alternate, /target="_self"/);
  assert.match(alternate, /aria-current="page"/);
});

test("French interactive UI and standalone editor keep their language context", async () => {
  const [runtime, editor, editorCss, frenchSubmission] = await Promise.all([
    readFile(join(docs, "assets", "javascripts", "i18n-runtime.js"), "utf8"),
    readFile(join(docs, "config", "editor", "index.html"), "utf8"),
    readFile(join(docs, "config", "editor", "editor.css"), "utf8"),
    readFile(join(docs, "submit-idea.fr.md"), "utf8"),
  ]);

  assert.match(runtime, /MeshCoreCanadaI18n/);
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /\/fr\/config\/editor/);
  assert.match(runtime, /"The proposal format is not supported\.": "Le format/);
  assert.match(runtime, /"Spam protection cannot load in this browser\.": "La protection/);
  assert.match(editor, /data-editor-language="en"/);
  assert.match(editor, /data-editor-language="fr"/);
  assert.match(editor, /data-editor-language="en" href="\.\/"/);
  assert.match(editor, /data-editor-language="fr" href="\.\.\/\.\.\/fr\/config\/editor\/"/);
  assert.match(editor, /i18n-runtime\.js/);
  assert.match(editorCss, /\.utility-nav__divider\s*\{[^}]*\}\s*\.lifecycle-list/s);
  assert.match(frenchSubmission, /name="source_page" value="https:\/\/meshcore\.ca\/fr\/submit-idea\/"/);
});

test("French idea preview uses French headings while preserving submission values", () => {
  const proposal = buildCommunityIdea({
    category: "Documentation correction",
    experience: "Active mesh user",
    summary: "Clarifier une étape",
    region: "Montréal",
    need: "Le texte actuel est difficile à suivre.",
    idea: "Ajouter un exemple plus court.",
    context: "",
    followUp: "",
    publicAcknowledged: true,
  });
  const preview = buildFrenchSubmissionText(proposal);

  assert.match(preview, /^# Clarifier une étape/m);
  assert.match(preview, /^## Type de contribution$/m);
  assert.match(preview, /Correction de la documentation/);
  assert.match(preview, /^## Expérience avec MeshCore$/m);
  assert.match(preview, /J’utilise activement un réseau MeshCore/);
  assert.equal(proposal.category, "Documentation correction");
  assert.equal(proposal.experience, "Active mesh user");
});

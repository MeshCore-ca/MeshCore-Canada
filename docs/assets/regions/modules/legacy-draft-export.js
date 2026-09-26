import { draftKey, serializableDraft } from "../../../config/editor/infrastructure/draft-store.js?v=20260722-2";

export function collectLegacyDrafts(storage) {
  const drafts = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!/^mcc-region-editor-draft:v[12]:[0-9a-f]{64}:[0-9]{2}$/.test(key || "")) continue;
    try {
      const draft = serializableDraft(JSON.parse(storage.getItem(key)));
      if (draft && draftKey(draft.schema, draft.baseMembershipSha256, draft.province) === key) drafts.push(draft);
    } catch (_) { /* An unreadable record must not hide other recoverable drafts. */ }
  }
  return drafts.sort((a, b) => a.savedAt - b.savedAt);
}

function init() {
  const button = document.querySelector("[data-legacy-draft-export]");
  if (!button || button.dataset.ready) return;
  button.dataset.ready = "1";
  button.addEventListener("click", () => {
    const french = document.documentElement.lang.startsWith("fr");
    const status = document.querySelector("[data-legacy-draft-status]");
    try {
      const drafts = collectLegacyDrafts(window.localStorage);
      if (!drafts.length) {
        status.textContent = french ? "Aucun brouillon n’est enregistré dans ce navigateur." : "No saved drafts were found in this browser.";
        return;
      }
      const output = { schema: "meshcore-canada-legacy-draft-export/v1", notice: "Historical census-cell drafts, not approved MeshMapper boundaries", drafts };
      const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2) + "\n"], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "meshcore-legacy-region-drafts.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = french ? "Téléchargement prêt. Aucun brouillon n’a été supprimé ou envoyé." : "Download ready. No drafts were deleted or uploaded.";
    } catch (_) {
      status.textContent = french ? "Les brouillons de ce navigateur sont inaccessibles. Vérifiez les réglages de stockage." : "This browser's saved drafts could not be read. Check its storage settings.";
    }
  });
}

if (typeof document !== "undefined") {
  if (window.document$?.subscribe) window.document$.subscribe(init);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}

import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} other provinces set their own code as the companion default now`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/?tag=yyc&province=ab`));
    const profile = page.locator('[data-role="map-text-result"] .mc-region-profile');
    await expect(profile).toContainText(locale ? "Réglez dès maintenant la portée par défaut (Default Region Scope) de votre compagnon sur ab" : "Set your companion’s Default Region Scope to ab now");
    // Scopes are set now: no pilot, rollout or phase wording.
    await expect(profile).not.toContainText(/pilot|rollout|déploiement local/i);
  });
}

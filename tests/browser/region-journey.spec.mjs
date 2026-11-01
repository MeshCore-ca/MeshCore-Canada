import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { proposalOperator, activateConfig } from "./activation-helpers.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} role guidance prepares first and explains independent forwarding`, async ({ page }) => {
    const errors=[]; page.on("pageerror",e=>errors.push(e.message));
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ytr&province=on`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await expect(page.locator('[data-scp-output] code')).toHaveCount(0);
    await page.locator('[data-scp-role]').selectOption("companion");
    await expect(page.locator('[data-scp-role-summary]')).toContainText(locale ? "aucun changement" : "no changes yet");
    await expect(page.locator('[data-scp-firmware]')).toBeHidden();
    await expect(page.locator('[data-scp-output] code')).toHaveCount(0);
    await page.locator('[data-scp-role]').selectOption("bot");
    await expect(page.locator('[data-scp-role-summary]')).toContainText("MeshMapper");
    await page.locator('[data-scp-role]').selectOption("repeater");
    await expect(page.locator('[data-scp-type]')).toHaveValue("unknown");
    const commands=page.locator('[data-scp-output="region"]');
    await expect(commands.locator("code")).toHaveText(["region def ytr|* on|* onqc|* can|* na","region save"]);
    await expect(page.locator('[data-scp-readiness]')).toContainText(locale ? "Non confirmé" : "Not locally confirmed");
    const demo=page.locator('[data-scp-simulator]'); await demo.locator("summary").click();
    await page.locator('[data-scp-message]').selectOption("*");
    await expect(page.locator('[data-scp-decision]')).toContainText(locale ? "Inchangé" : "Unchanged");
    await page.locator('[data-scp-message]').selectOption("yul");
    await expect(page.locator('[data-scp-decision]')).toContainText(locale ? "Inconnu" : "Unknown");
    await page.locator('[data-scp-activation]').selectOption("activate");
    await page.locator('[data-scp-activate]').check();
    await expect(commands.locator("code")).toHaveCount(0); // Unknown type cannot activate.
    expect(errors).toEqual([]);
    expect((await new AxeBuilder({page}).include('[data-scp-picker]').analyze()).violations).toEqual([]);
  });

  test(`${locale || "en/"} activation confirmation is not shared or carried to different neighbours`, async ({ page }) => {
    const errors=[]; page.on("pageerror",e=>errors.push(e.message));
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ytr&province=on`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    const commands=page.locator('[data-scp-output="region"]');
    await proposalOperator(page,{type:"edge"});
    await expect(commands).toContainText("region denyf *");
    await page.locator('[data-scp-extra]').selectOption("ygk");
    await expect(page.locator('[data-scp-activate]')).not.toBeChecked();
    await expect(commands.locator("code")).toHaveCount(0);
    await page.locator('[data-scp-activate]').check();
    await page.locator('[data-scp-simulator] summary').click();
    await page.locator('[data-scp-message]').selectOption("*");
    await expect(page.locator('[data-scp-decision]')).toContainText(locale ? "Non relayé" : "Not forwarded");
    const share=await page.locator('[data-scp-share]').getAttribute("href");
    await page.goto("about:blank");
    await page.goto(share);
    await expect(page.locator('[data-scp-activation]')).toHaveValue("activate");
    await expect(page.locator('[data-scp-activate]')).not.toBeChecked();
    await expect(commands.locator("code")).toHaveCount(0);
    await page.locator('[data-scp-activate]').check();
    await expect(commands).toContainText("region denyf *");
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true})));
    await expect(page.locator('[data-scp-activate]')).not.toBeChecked();
    await expect(commands.locator("code")).toHaveCount(0);
    await page.locator('[data-scp-activate]').check();
    await page.locator('[data-scp-area]').selectOption("ygk:on");
    await expect(commands.locator("code")).toHaveCount(0);
    expect(errors).toEqual([]);
    expect((await new AxeBuilder({page}).include('[data-scp-picker]').analyze()).violations).toEqual([]);
  });

  test(`${locale || "en/"} saved-list verification requires the default and clears stale results on edit`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ytr&province=on`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await proposalOperator(page,{type:"edge"});
    const box=page.locator('[data-scp-verification]');
    await box.locator("summary").click();
    const list="*^\n ytr F\n on F\n onqc F\n can F\n na F";
    await box.locator('[data-verify-list]').fill(list);
    await box.locator('[data-verify-check]').click();
    await expect(box.locator('[data-verify-status]')).toContainText(locale ? "liste correspond" : "region list matches");
    await box.locator('[data-verify-default]').fill("default scope is ytr");
    await expect(box.locator('[data-verify-status]')).toBeEmpty();
    await box.locator('[data-verify-check]').click();
    await expect(box.locator('[data-verify-status]')).toContainText(locale ? "correspondent" : "settings match");
  });

  test(`${locale || "en/"} verification flags wrong permissions and unexpected scopes without uploading them`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ytr&province=on`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await proposalOperator(page,{type:"edge"});
    const box=page.locator('[data-scp-verification]'); await box.locator("summary").click();
    const requests=[];page.on("request",r=>requests.push(r.url()+" "+(r.postData()||"")));
    const list="*^\n ytr F\n on F\n onqc F\n can F\n na F";
    await box.locator('[data-verify-list]').fill(list.replace("*^","*^ F")+"\n local-private F");
    await box.locator('[data-verify-check]').click();
    await expect(box.locator('[data-verify-details]')).toContainText("local-private");
    await expect(box.locator('[data-verify-details]')).toContainText("*");
    await box.locator('[data-verify-list]').fill("bad reply");
    await box.locator('[data-verify-check]').click();
    await expect(box.locator('[data-verify-details]')).toBeHidden();
    expect(requests.some(r=>r.includes("local-private"))).toBe(false);
  });

  test(`${locale || "en/"} preparation verification keeps its claim limited to named scopes`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ytr&province=on`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await proposalOperator(page,{activate:false,type:"edge"});
    const box=page.locator('[data-scp-verification]'); await box.locator("summary").click();
    await expect(box.locator('[data-verify-default]')).toHaveCount(0);
    await box.locator('[data-verify-list]').fill("*^\n ytr F\n on F\n onqc F\n can F\n na F\n old-scope F");
    await box.locator('[data-verify-check]').click();
    await expect(box.locator('[data-verify-status]')).toContainText(locale ? "sauvegarde" : "backup");
  });

  test(`${locale || "en/"} configurator separates preparation, activation and regional readiness`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ytr&province=on&type=large&step=4&instructions=technical`));
    const result=page.locator('[data-role="result"]');
    await expect(result).toContainText("region def ytr|* on|* onqc|* can|* na");
    await expect(result.locator('[data-cmd="region denyf *"]')).toHaveCount(0);
    await expect(result.locator('[data-cmd="region default ytr"]')).toHaveCount(0);
    await expect(result.locator('[data-region-readiness]')).toContainText(locale ? "Non confirmé" : "Not locally confirmed");
    await activateConfig(page);
    await expect(result).toContainText("region denyf *");
    await expect(result).toContainText("region default ytr");
    await page.locator('[data-go-step="3"]').click();
    await page.locator('[data-action="add-served-region"]').selectOption("yul");
    await page.locator('[data-go-step="4"]').click();
    await expect(result.locator('[data-cmd]')).toHaveCount(0);
    await activateConfig(page);
    await result.locator('[data-scope-verification] summary').click();
    await expect(result.locator('[data-verify-list]')).toBeVisible();
  });

  test(`${locale || "en/"} unknown forwarding roles cannot activate and other provinces keep local policy`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ytr&province=on&type=large&step=4&instructions=technical`));
    const result=page.locator('[data-role="result"]');
    await activateConfig(page);
    await page.locator('[data-go-step="3"]').click();
    await page.locator('input[name="mcc-type"][value="unknown"]').check();
    await page.locator('[data-action="confirm-activation"]').check();
    await page.locator('[data-go-step="4"]').click();
    await expect(result.locator('[data-cmd]')).toHaveCount(0);
    await expect(result).toContainText(locale ? "Confirmez" : "Confirm");
    await page.goto(siteRoute(`/${locale}config/map/?tag=yyc&province=ab`));
    await expect(page.locator('[data-role="map-text-result"]')).toContainText(locale ? "hors du projet pilote" : "outside the ON/QC pilot");
  });
}

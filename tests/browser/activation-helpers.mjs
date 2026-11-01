export async function proposalOperator(page, { activate = true, type = "city" } = {}) {
  await page.locator('[data-scp-role]').selectOption("repeater");
  await page.locator('[data-scp-type]').selectOption(type);
  await page.locator('[data-scp-activation]').selectOption(activate ? "activate" : "prepare");
  if (activate) await page.locator('[data-scp-activate]').check();
}

export async function activateConfig(page) {
  await page.locator('[data-role="result"] .mcc-result-console, [data-role="result"] .mcc-status-warning').first().waitFor({state:"attached"});
  const wasReview = await page.locator('[data-wizard-step="4"]').isVisible();
  await page.locator('[data-go-step="3"]').click();
  await page.locator('#mcc-activation').selectOption("activate");
  await page.locator('[data-action="confirm-activation"]').check();
  if (wasReview) await page.locator('[data-go-step="4"]').click();
}

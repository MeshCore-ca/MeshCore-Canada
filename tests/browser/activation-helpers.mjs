export async function proposalOperator(page, { activate = true, type = "city" } = {}) {
  await page.locator('[data-scp-role]').selectOption("repeater");
  await page.locator('[data-scp-type]').selectOption(type);
  await page.locator('[data-scp-activation]').selectOption(activate ? "activate" : "prepare");
  if (activate) await page.locator('[data-scp-activate]').check();
}

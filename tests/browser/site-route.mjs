export function normalizeSiteBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`Site base URL must use HTTP or HTTPS: ${value}`);
  }
  if (url.search || url.hash) {
    throw new TypeError(`Site base URL must not include a query or fragment: ${value}`);
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url.href;
}

export function siteRoute(route) {
  if (typeof route !== "string" || !route.startsWith("/")) {
    throw new TypeError(`Site route must start with "/": ${route}`);
  }
  return `.${route}`;
}

export function resolveSiteRoute(baseUrl, route) {
  return new URL(siteRoute(route), normalizeSiteBaseUrl(baseUrl)).href;
}